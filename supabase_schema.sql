-- ==============================================================================
-- KESFLOW SUPABASE SCHEMA MIGRATION SCRIPT
-- Eksekusi skrip ini di Supabase SQL Editor untuk inisialisasi basis data lengkap.
-- ==============================================================================

-- 1. Inisialisasi Ekstensi
create extension if not exists "uuid-ossp";

-- 2. Tabel Profiles (Sinkronisasi Otomatis dengan auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  display_name text not null,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Trigger Function: Auto create profile on auth.users sign-up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), 'User'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update set
    email = excluded.email,
    display_name = coalesce(excluded.display_name, public.profiles.display_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

-- Trigger definition
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Tabel Spaces (Ruang Kencan Bersama)
create table if not exists public.spaces (
  id uuid default gen_random_uuid() primary key,
  name text not null default 'Kencan Kita',
  invite_code text unique not null,
  created_by uuid references public.profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Tabel Space Members (Maksimal 2 Orang per Space)
create table if not exists public.space_members (
  id uuid default gen_random_uuid() primary key,
  space_id uuid references public.spaces(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  nickname text not null,
  role text not null default 'member',
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (space_id, user_id)
);

-- 5. Tabel Categories (Kategori Pengeluaran)
create table if not exists public.categories (
  id uuid default gen_random_uuid() primary key,
  space_id uuid references public.spaces(id) on delete cascade,
  name text not null,
  icon text not null,
  color text default '#f97316',
  is_preset boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Tabel Events (Tag Kencan Khusus / Trip / Momen Kencan)
create table if not exists public.events (
  id uuid default gen_random_uuid() primary key,
  space_id uuid references public.spaces(id) on delete cascade not null,
  title text not null,
  start_date date not null default current_date,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Tabel Transactions (Pencatatan Belanja & Mikro)
create table if not exists public.transactions (
  id uuid default gen_random_uuid() primary key,
  space_id uuid references public.spaces(id) on delete cascade not null,
  payer_id uuid references public.profiles(id) not null,
  event_id uuid references public.events(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  title text not null,
  amount numeric(12, 2) not null check (amount > 0),
  split_type text not null check (split_type in ('EQUAL_50_50', 'FULL_TREAT', 'FULL_OWE', 'CUSTOM')),
  user_a_share numeric(12, 2) not null default 0,
  user_b_share numeric(12, 2) not null default 0,
  receipt_url text,
  notes text,
  spent_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Tabel Settlements (Transaksi Pelunasan Hutang Saldo Berjalan)
create table if not exists public.settlements (
  id uuid default gen_random_uuid() primary key,
  space_id uuid references public.spaces(id) on delete cascade not null,
  from_user_id uuid references public.profiles(id) not null,
  to_user_id uuid references public.profiles(id) not null,
  amount numeric(12, 2) not null check (amount > 0),
  notes text,
  settled_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. Tabel Quick Presets (Pintasan Catat Kilat Pengeluaran)
create table if not exists public.quick_presets (
  id uuid default gen_random_uuid() primary key,
  space_id uuid references public.spaces(id) on delete cascade not null,
  label text not null,
  amount numeric(12, 2) not null check (amount > 0),
  category_name text not null default 'Transport & Parkir',
  icon_name text not null default 'Zap',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- INDEXING UNTUK KECEPATAN QUERY
-- ==============================================================================
create index if not exists idx_transactions_space_spent on public.transactions(space_id, spent_at desc);
create index if not exists idx_transactions_event on public.transactions(event_id);
create index if not exists idx_quick_presets_space on public.quick_presets(space_id);
create index if not exists idx_space_members_user on public.space_members(user_id);
create index if not exists idx_spaces_invite on public.spaces(invite_code);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
alter table public.profiles enable row level security;
alter table public.spaces enable row level security;
alter table public.space_members enable row level security;
alter table public.categories enable row level security;
alter table public.events enable row level security;
alter table public.transactions enable row level security;
alter table public.settlements enable row level security;
alter table public.quick_presets enable row level security;

-- Helper RLS function: Cek apakah user saat ini adalah member aktif space
create or replace function public.is_member_of_space(_space_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.space_members
    where space_id = _space_id and user_id = auth.uid()
  );
end;
$$ language plpgsql security definer;

-- 1. Profiles Policies
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- 2. Spaces Policies
create policy "Members can view their spaces" on public.spaces
  for select using (public.is_member_of_space(id));

create policy "Users can create spaces" on public.spaces
  for insert with check (auth.uid() = created_by);

create policy "Users can find space by invite code" on public.spaces
  for select using (auth.role() = 'authenticated');

-- 3. Space Members Policies
create policy "Members can view space members" on public.space_members
  for select using (public.is_member_of_space(space_id));

create policy "Users can join space" on public.space_members
  for insert with check (
    auth.uid() = user_id and
    (select count(*) from public.space_members where space_id = space_members.space_id) < 2
  );

-- 4. Categories Policies
create policy "Access categories" on public.categories
  for all using (space_id is null or public.is_member_of_space(space_id));

-- 5. Events Policies
create policy "Access events" on public.events
  for all using (public.is_member_of_space(space_id));

-- 6. Transactions Policies
create policy "Access transactions" on public.transactions
  for all using (public.is_member_of_space(space_id));

-- 7. Settlements Policies
create policy "Access settlements" on public.settlements
  for all using (public.is_member_of_space(space_id));

-- 8. Quick Presets Policies
create policy "Access quick presets" on public.quick_presets
  for all using (public.is_member_of_space(space_id));

-- ==============================================================================
-- SUPABASE REALTIME CONFIGURATION
-- ==============================================================================
begin;
  -- Hapus publikasi tabel lama jika sudah ada untuk menghindari duplikasi
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for table 
    public.transactions, 
    public.settlements, 
    public.space_members,
    public.quick_presets;
commit;

-- ==============================================================================
-- DEFAULT SEED CATEGORIES
-- ==============================================================================
insert into public.categories (name, icon, color, is_preset) values
  ('Makanan & Minuman', 'UtensilsCrossed', '#f97316', false),
  ('Camilan & Jajan', 'Cookie', '#fb923c', true),
  ('Nonton & Bioskop', 'Film', '#8b5cf6', false),
  ('Transport & Parkir', 'Car', '#06b6d4', true),
  ('Belanja Bareng', 'ShoppingBag', '#ec4899', false),
  ('Staycation & Liburan', 'Hotel', '#10b981', false),
  ('Hadiah & Kejutan', 'Gift', '#f43f5e', false),
  ('Lain-lain', 'MoreHorizontal', '#64748b', false)
on conflict do nothing;

-- ==============================================================================
-- STORAGE BUCKET: RECEIPTS (FOTO STRUK BUKTI PEMBAYARAN)
-- ==============================================================================
insert into storage.buckets (id, name, public) 
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

create policy "Receipts view policy" on storage.objects
  for select using (
    bucket_id = 'receipts' and auth.role() = 'authenticated'
  );

create policy "Receipts upload policy" on storage.objects
  for insert with check (
    bucket_id = 'receipts' and auth.role() = 'authenticated'
  );
