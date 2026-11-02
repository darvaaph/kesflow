begin;

-- Refuse ambiguous historical membership instead of silently reassigning debts.
do $$ begin
  if exists (select 1 from public.space_members group by space_id having count(*) > 2)
     or exists (select 1 from public.space_members group by user_id having count(*) > 1) then
    raise exception 'Resolve duplicate memberships or spaces with more than two members before migration';
  end if;
end $$;
create unique index if not exists space_members_one_space_per_user on public.space_members(user_id);
alter table public.spaces add column if not exists user_a_id uuid references public.profiles(id);
alter table public.spaces add column if not exists user_b_id uuid references public.profiles(id);
alter table public.spaces add column if not exists revision bigint not null default 0;
update public.spaces s set
  user_a_id = (select m.user_id from public.space_members m where m.space_id = s.id order by m.joined_at, m.id limit 1),
  user_b_id = (select m.user_id from public.space_members m where m.space_id = s.id order by m.joined_at, m.id limit 1 offset 1)
where s.user_a_id is null;

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text unique not null, p256dh text not null, auth text not null,
  user_agent text, created_at timestamptz not null default now()
);
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  actor_id uuid references public.profiles(id), actor_name text not null,
  action_type text not null, target_id uuid not null, title text not null,
  description text not null, amount numeric(12,2) not null,
  before_data jsonb, after_data jsonb, created_at timestamptz not null default now()
);
create index if not exists activity_logs_space_created on public.activity_logs(space_id, created_at desc);
create index if not exists settlements_space on public.settlements(space_id);
alter table public.push_subscriptions enable row level security;
alter table public.activity_logs enable row level security;

create or replace function public.is_member_of_space(_space_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.space_members where space_id = _space_id and user_id = auth.uid());
$$;
create or replace function public.shares_space_with(_user_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.space_members me join public.space_members other using(space_id)
    where me.user_id = auth.uid() and other.user_id = _user_id);
$$;
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Authenticated users can view profiles" on public.profiles;
create policy "Own and partner profiles" on public.profiles for select to authenticated
  using (id = auth.uid() or public.shares_space_with(id));
drop policy if exists "Users can find space by invite code" on public.spaces;
drop policy if exists "Users can create spaces" on public.spaces;
drop policy if exists "Users can join space" on public.space_members;
-- Membership identity and room creation are writable only through checked RPCs.
revoke insert, update, delete on public.space_members, public.spaces from anon, authenticated;
drop policy if exists "Access categories" on public.categories;
create policy "Read categories" on public.categories for select to authenticated
  using (space_id is null or public.is_member_of_space(space_id));
create policy "Write room categories" on public.categories for all to authenticated
  using (space_id is not null and public.is_member_of_space(space_id))
  with check (space_id is not null and public.is_member_of_space(space_id));
drop policy if exists "Receipts view policy" on storage.objects;
drop policy if exists "Receipts upload policy" on storage.objects;
create policy "Room receipts read" on storage.objects for select to authenticated
  using (bucket_id = 'receipts' and exists(select 1 from public.space_members m
    where m.user_id = auth.uid() and m.space_id::text = split_part(name, '/', 1)));
create policy "Room receipts upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'receipts' and exists(select 1 from public.space_members m
    where m.user_id = auth.uid() and m.space_id::text = split_part(name, '/', 1)));
drop policy if exists "Access push subscriptions" on public.push_subscriptions;
create policy "Own push subscriptions" on public.push_subscriptions for all to authenticated
  using (user_id = auth.uid() and public.is_member_of_space(space_id))
  with check (user_id = auth.uid() and public.is_member_of_space(space_id));
create policy "Read room activity" on public.activity_logs for select to authenticated
  using (public.is_member_of_space(space_id));
grant select on public.activity_logs to authenticated;
revoke insert, update, delete on public.activity_logs from anon, authenticated;
drop policy if exists "Access settlements" on public.settlements;
create policy "Read settlements" on public.settlements for select to authenticated
  using (public.is_member_of_space(space_id));
revoke insert, update, delete on public.settlements from anon, authenticated;

create or replace function public.default_quick_presets()
returns jsonb language sql immutable set search_path = '' as $$
  select '[
    {"label":"Parkir Motor","amount":2000,"categoryName":"Transport & Parkir","iconName":"Bike"},
    {"label":"Parkir Mobil","amount":5000,"categoryName":"Transport & Parkir","iconName":"Car"},
    {"label":"Parkir Mall","amount":10000,"categoryName":"Transport & Parkir","iconName":"Building2"},
    {"label":"Kopi Berdua","amount":36000,"categoryName":"Makanan & Minuman","iconName":"Coffee"},
    {"label":"Jajan / Camilan","amount":20000,"categoryName":"Camilan & Jajan","iconName":"Cookie"}
  ]'::jsonb;
$$;
insert into public.quick_presets(space_id,label,amount,category_name,icon_name)
select s.id,p->>'label',(p->>'amount')::numeric,p->>'categoryName',p->>'iconName'
from public.spaces s cross join jsonb_array_elements(public.default_quick_presets()) p
where not exists(select 1 from public.quick_presets q where q.space_id=s.id);

create or replace function public.create_couple_space(_name text, _nickname text)
returns public.spaces language plpgsql security definer set search_path = '' as $$
declare s public.spaces; code text;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  perform 1 from public.profiles where id = auth.uid() for update;
  if exists(select 1 from public.space_members where user_id = auth.uid()) then raise exception 'Already in a space'; end if;
  loop
    code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    begin
      insert into public.spaces(name, invite_code, created_by, user_a_id)
      values(coalesce(nullif(trim(_name), ''), 'Date Kita'), code, auth.uid(), auth.uid()) returning * into s;
      exit;
    exception when unique_violation then null;
    end;
  end loop;
  insert into public.space_members(space_id, user_id, nickname, role)
  values(s.id, auth.uid(), coalesce(nullif(trim(_nickname), ''), 'Kamu'), 'owner');
  update public.profiles set display_name = coalesce(nullif(trim(_nickname), ''), display_name) where id = auth.uid();
  perform public.reset_quick_presets(s.id, public.default_quick_presets());
  return s;
end $$;

create or replace function public.join_couple_space(_code text, _nickname text)
returns void language plpgsql security definer set search_path = '' as $$
declare s public.spaces;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  perform 1 from public.profiles where id = auth.uid() for update;
  if exists(select 1 from public.space_members where user_id = auth.uid()) then raise exception 'Already in a space'; end if;
  select * into s from public.spaces where invite_code = upper(trim(_code)) for update;
  if not found then raise exception 'Kode undangan tidak ditemukan'; end if;
  if (select count(*) from public.space_members where space_id = s.id) >= 2 then raise exception 'Space sudah penuh'; end if;
  if auth.uid() is distinct from s.user_a_id and auth.uid() is distinct from s.user_b_id then
    if s.user_a_id is not null and s.user_b_id is not null then
      raise exception 'Ruang ini menyimpan riwayat pasangan sebelumnya. Buat ruang baru.';
    end if;
    update public.spaces set
      user_a_id = case when s.user_a_id is null then auth.uid() else user_a_id end,
      user_b_id = case when s.user_a_id is not null then auth.uid() else user_b_id end
    where id = s.id;
  end if;
  insert into public.space_members(space_id, user_id, nickname)
  values(s.id, auth.uid(), coalesce(nullif(trim(_nickname), ''), 'Pasangan'));
  update public.profiles set display_name = coalesce(nullif(trim(_nickname), ''), display_name) where id = auth.uid();
end $$;

create or replace function public.leave_couple_space(_space_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from public.spaces where id = _space_id for update;
  if not public.is_member_of_space(_space_id) then raise exception 'Not a member'; end if;
  delete from public.push_subscriptions where space_id = _space_id and user_id = auth.uid();
  delete from public.space_members where space_id = _space_id and user_id = auth.uid();
  -- Keep participant identities attached to historical shares, even after leaving.
end $$;

create or replace function public.update_nickname(_nickname text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or nullif(trim(_nickname), '') is null then raise exception 'Nickname wajib diisi'; end if;
  update public.profiles set display_name = trim(_nickname), updated_at = now() where id = auth.uid();
  update public.space_members set nickname = trim(_nickname) where user_id = auth.uid();
end $$;

create or replace function public.validate_transaction()
returns trigger language plpgsql security definer set search_path = '' as $$
declare s public.spaces; a numeric; b numeric;
begin
  if tg_op = 'UPDATE' and (new.space_id <> old.space_id or new.id <> old.id) then raise exception 'Cannot move a transaction'; end if;
  if tg_op = 'DELETE' then
    perform 1 from public.spaces where id = old.space_id for update;
    return old;
  end if;
  select * into s from public.spaces where id = new.space_id for update;
  if (tg_op = 'INSERT' or new.payer_id is distinct from old.payer_id) and
    not exists(select 1 from public.space_members where space_id = new.space_id and user_id = new.payer_id) then
    raise exception 'Pembayar bukan anggota ruang';
  end if;
  if new.payer_id is distinct from s.user_a_id and new.payer_id is distinct from s.user_b_id then raise exception 'Invalid participant'; end if;
  if new.amount::text in ('NaN','Infinity','-Infinity') or new.amount <= 0 or trim(new.title) = '' then raise exception 'Invalid transaction'; end if;
  if new.event_id is not null and not exists(select 1 from public.events where id = new.event_id and space_id = new.space_id) then raise exception 'Event belongs to another space'; end if;
  if new.category_id is not null and not exists(select 1 from public.categories where id = new.category_id and (space_id is null or space_id = new.space_id)) then raise exception 'Category belongs to another space'; end if;
  if new.user_a_share < 0 or new.user_b_share < 0 or new.user_a_share + new.user_b_share <> new.amount
    or new.user_a_share::text = 'NaN' or new.user_b_share::text = 'NaN' then raise exception 'Porsi pembagian tidak valid'; end if;
  if new.split_type = 'EQUAL_50_50' then a := round(new.amount / 2, 2); b := new.amount - a;
  elsif new.split_type = 'FULL_TREAT' then a := case when new.payer_id = s.user_a_id then new.amount else 0 end; b := new.amount - a;
  elsif new.split_type = 'FULL_OWE' then a := case when new.payer_id = s.user_a_id then 0 else new.amount end; b := new.amount - a;
  else return new;
  end if;
  if new.user_a_share <> a or new.user_b_share <> b then raise exception 'Porsi tidak cocok dengan mode pembagian'; end if;
  return new;
end $$;
create trigger validate_transaction before insert or update or delete on public.transactions
  for each row execute function public.validate_transaction();

create or replace function public.record_activity()
returns trigger language plpgsql security definer set search_path = '' as $$
declare row_data jsonb; action text; actor_name text; details text;
begin
  row_data := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  if auth.uid() is null then return null; end if;
  select display_name into actor_name from public.profiles where id = auth.uid();
  action := case when tg_table_name = 'settlements' then 'SETTLEMENT_ADDED'
    when tg_op = 'INSERT' then 'TX_CREATED' when tg_op = 'UPDATE' then 'TX_UPDATED' else 'TX_DELETED' end;
  if action = 'TX_UPDATED' then
    select string_agg(label || ': ' || coalesce(to_jsonb(old)->>field, '-') || ' → ' || coalesce(row_data->>field, '-'), ' · ')
    into details from (values ('title','Judul'),('amount','Nominal'),('split_type','Mode'),('user_a_share','Porsi A'),('user_b_share','Porsi B')) fields(field,label)
    where (to_jsonb(old)->field) is distinct from (row_data->field);
    if old.payer_id is distinct from new.payer_id then
      details := concat_ws(' · ', details, 'Pembayar: ' ||
        (select display_name from public.profiles where id=old.payer_id) || ' → ' ||
        (select display_name from public.profiles where id=new.payer_id));
    end if;
  end if;
  insert into public.activity_logs(space_id, actor_id, actor_name, action_type, target_id, title, description, amount, before_data, after_data)
  values((row_data->>'space_id')::uuid, auth.uid(), coalesce(actor_name, 'Pengguna'), action, (row_data->>'id')::uuid,
    coalesce(row_data->>'title', 'Settle Up'),
    case action when 'TX_UPDATED' then 'Transaksi diperbarui' when 'TX_DELETED' then 'Transaksi dihapus'
      when 'TX_CREATED' then 'Pengeluaran dicatat' else 'Pelunasan dicatat' end || ' oleh ' || coalesce(actor_name, 'Pengguna') || coalesce(' · ' || details, ''),
    (row_data->>'amount')::numeric,
    case when tg_op <> 'INSERT' then to_jsonb(old) end,
    case when tg_op <> 'DELETE' then to_jsonb(new) end);
  return null;
end $$;
create trigger transaction_activity after insert or update or delete on public.transactions for each row execute function public.record_activity();
create trigger settlement_activity after insert on public.settlements for each row execute function public.record_activity();

-- Existing rows record known payment facts, not an invented original author.
insert into public.activity_logs(space_id,actor_id,actor_name,action_type,target_id,title,description,amount,after_data,created_at)
select t.space_id,null,'Pencatat tidak diketahui','TX_CREATED',t.id,t.title,
  'Riwayat sebelum pembaruan; dibayar ' || p.display_name,t.amount,to_jsonb(t),t.created_at
from public.transactions t join public.profiles p on p.id=t.payer_id;
insert into public.activity_logs(space_id,actor_id,actor_name,action_type,target_id,title,description,amount,after_data,created_at)
select s.space_id,null,'Pencatat tidak diketahui','SETTLEMENT_ADDED',s.id,'Settle Up',
  'Riwayat pelunasan sebelum pembaruan',s.amount,to_jsonb(s),s.settled_at from public.settlements s;

create or replace function public.settle_balance(_space_id uuid, _expected_balance numeric, _amount numeric, _notes text, _request_id uuid)
returns public.settlements language plpgsql security definer set search_path = '' as $$
declare s public.spaces; result public.settlements; net numeric;
begin
  select * into s from public.spaces where id = _space_id for update;
  if not public.is_member_of_space(_space_id) then raise exception 'Not a member'; end if;
  select * into result from public.settlements where id = _request_id and space_id = _space_id;
  if found then return result; end if;
  if (select count(*) from public.space_members where space_id = _space_id) <> 2 then raise exception 'Pasangan harus bergabung sebelum pelunasan'; end if;
  select coalesce(sum(case when split_type = 'FULL_TREAT' then 0 when payer_id = s.user_a_id then user_b_share else -user_a_share end), 0)
    into net from public.transactions where space_id = _space_id;
  select net + coalesce(sum(case when from_user_id = s.user_a_id then amount else -amount end), 0)
    into net from public.settlements where space_id = _space_id;
  if _expected_balance is null or net <> _expected_balance then raise exception 'Saldo berubah. Periksa saldo terbaru sebelum melunasi.'; end if;
  if _amount is null or _amount::text in ('NaN','Infinity','-Infinity') or _amount <= 0 or _amount > abs(net) then raise exception 'Nominal pelunasan tidak valid'; end if;
  insert into public.settlements(id, space_id, from_user_id, to_user_id, amount, notes)
  values(_request_id, _space_id, case when net > 0 then s.user_b_id else s.user_a_id end,
    case when net > 0 then s.user_a_id else s.user_b_id end, _amount, _notes) returning * into result;
  return result;
end $$;

create or replace function public.clear_space_transactions(_space_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from public.spaces where id = _space_id for update;
  if not public.is_member_of_space(_space_id) then raise exception 'Not a member'; end if;
  delete from public.transactions where space_id = _space_id;
  delete from public.settlements where space_id = _space_id;
end $$;

create or replace function public.reset_quick_presets(_space_id uuid, _presets jsonb)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from public.spaces where id = _space_id for update;
  if not public.is_member_of_space(_space_id) then raise exception 'Not a member'; end if;
  if jsonb_typeof(_presets) <> 'array' or jsonb_array_length(_presets) not between 1 and 50 then raise exception 'Invalid presets'; end if;
  delete from public.quick_presets where space_id = _space_id;
  insert into public.quick_presets(space_id, label, amount, category_name, icon_name)
  select _space_id, p->>'label', (p->>'amount')::numeric, p->>'categoryName', p->>'iconName' from jsonb_array_elements(_presets) p;
end $$;

-- Normalize legacy active flags before adding the invariant.
with ranked as (select id, row_number() over(partition by space_id order by created_at desc, id) rn from public.events where is_active)
update public.events set is_active = false where id in (select id from ranked where rn > 1);
create unique index if not exists one_active_event_per_space on public.events(space_id) where is_active;
create or replace function public.set_active_event(_event_id uuid, _active boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare sid uuid;
begin
  select space_id into sid from public.events where id = _event_id;
  perform 1 from public.spaces where id = sid for update;
  if not public.is_member_of_space(sid) then raise exception 'Not a member'; end if;
  if _active then update public.events set is_active = false where space_id = sid and is_active; end if;
  update public.events set is_active = _active where id = _event_id;
end $$;

-- One MVCC snapshot, with JSON aggregates unaffected by the API row limit.
create or replace function public.notify_space_deletion()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  -- DELETE payloads cannot be filtered by space_id under Realtime RLS.
  update public.spaces set revision = revision + 1 where id = old.space_id;
  return old;
end $$;
create trigger event_deleted after delete on public.events for each row execute function public.notify_space_deletion();
create trigger preset_deleted after delete on public.quick_presets for each row execute function public.notify_space_deletion();
create trigger member_deleted after delete on public.space_members for each row execute function public.notify_space_deletion();
create trigger settlement_deleted after delete on public.settlements for each row execute function public.notify_space_deletion();

create or replace function public.get_space_snapshot()
returns jsonb language sql stable security definer set search_path = '' as $$
  with my_space as (select space_id from public.space_members where user_id = auth.uid()),
  room as (select s.* from public.spaces s join my_space m on s.id = m.space_id)
  select jsonb_build_object(
    'space', (select to_jsonb(r) from room r),
    'members', coalesce((select jsonb_agg(m order by m.joined_at, m.id) from public.space_members m where space_id in (select id from room)), '[]'::jsonb),
    'profiles', coalesce((select jsonb_agg(p) from public.profiles p where p.id = auth.uid() or p.id in (select user_a_id from room union select user_b_id from room)), '[]'::jsonb),
    'categories', coalesce((select jsonb_agg(c order by c.created_at, c.id) from public.categories c where space_id is null or space_id in (select id from room)), '[]'::jsonb),
    'events', coalesce((select jsonb_agg(e order by start_date desc, id) from public.events e where space_id in (select id from room)), '[]'::jsonb),
    'transactions', coalesce((select jsonb_agg(t order by spent_at desc, id) from public.transactions t where space_id in (select id from room)), '[]'::jsonb),
    'settlements', coalesce((select jsonb_agg(s order by settled_at desc, id) from public.settlements s where space_id in (select id from room)), '[]'::jsonb),
    'activityLogs', coalesce((select jsonb_agg(l order by created_at desc, id) from public.activity_logs l where space_id in (select id from room)), '[]'::jsonb),
    'quickPresets', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'space_id', space_id, 'label', label, 'amount', amount, 'categoryName', category_name, 'iconName', icon_name) order by created_at, id) from public.quick_presets where space_id in (select id from room)), '[]'::jsonb)
  );
$$;

do $$ declare fn regprocedure; tbl text; begin
  for fn in select p.oid::regprocedure from pg_proc p join pg_namespace n on p.pronamespace=n.oid
    where n.nspname='public' and p.proname in ('is_member_of_space','shares_space_with','create_couple_space','join_couple_space',
    'leave_couple_space','update_nickname','validate_transaction','record_activity','settle_balance','clear_space_transactions',
    'reset_quick_presets','set_active_event','get_space_snapshot','notify_space_deletion') loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
    if fn::text not like 'validate_transaction(%' and fn::text not like 'record_activity(%' and fn::text not like 'notify_space_deletion(%' then
      execute format('grant execute on function %s to authenticated', fn);
    end if;
  end loop;
  foreach tbl in array array['transactions','settlements','space_members','quick_presets','events','activity_logs','spaces'] loop
    if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename=tbl) then
      execute format('alter publication supabase_realtime add table public.%I', tbl);
    end if;
  end loop;
end $$;
commit;
