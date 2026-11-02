import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';

const A = '00000000-0000-0000-0000-000000000001';
const B = '00000000-0000-0000-0000-000000000002';
const C = '00000000-0000-0000-0000-000000000003';
const db = new PGlite();
let room: { id: string; invite_code: string };
async function asUser(id: string) {
  await db.exec(`reset role; set role authenticated; select set_config('request.jwt.claim.sub', '${id}', false);`);
}
async function insertTx(amount = 100000) {
  return db.query<{ id: string }>(`insert into public.transactions(space_id,payer_id,title,amount,split_type,user_a_share,user_b_share)
    values($1,$2,'Dinner',$3::numeric,'EQUAL_50_50',$3::numeric/2,$3::numeric/2) returning id`, [room.id, A, amount]);
}

describe('database security and accounting', () => {
  beforeAll(async () => {
    await db.exec(`
      create role anon; create role authenticated; create schema auth; create schema storage;
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      create function auth.role() returns text language sql stable as $$select current_user::text$$;
      create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb default '{}'::jsonb);
      create table storage.buckets(id text primary key,name text,public boolean);
      create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);
      alter table storage.objects enable row level security;
      grant usage on schema public,auth,storage to anon,authenticated;
      grant all on all tables in schema storage to authenticated;
      alter default privileges in schema public grant all on tables to authenticated;
    `);
    for (const file of readdirSync('supabase/migrations').sort()) {
      if (file === '20261102_security_and_consistency.sql') {
        await db.exec(`insert into auth.users(id,email) values ('00000000-0000-0000-0000-000000000004','legacy-a@test.local'),('00000000-0000-0000-0000-000000000005','legacy-b@test.local');
          insert into public.spaces(id,name,invite_code,created_by) values('00000000-0000-0000-0000-000000000099','Legacy','OLD123','00000000-0000-0000-0000-000000000004');
          insert into public.space_members(space_id,user_id,nickname,joined_at) values
          ('00000000-0000-0000-0000-000000000099','00000000-0000-0000-0000-000000000004','Old A','2026-01-01'),
          ('00000000-0000-0000-0000-000000000099','00000000-0000-0000-0000-000000000005','Old B','2026-01-02');
          insert into public.transactions(space_id,payer_id,title,amount,split_type,user_a_share,user_b_share)
          values('00000000-0000-0000-0000-000000000099','00000000-0000-0000-0000-000000000004','Old dinner',100,'CUSTOM',25,75);`);
      }
      const sql = readFileSync(`supabase/migrations/${file}`, 'utf8').replace('create extension if not exists "uuid-ossp";', '');
      await db.exec(sql);
    }
    await db.exec(`insert into auth.users(id,email) values ('${A}','a@test.local'),('${B}','b@test.local'),('${C}','c@test.local');`);
  }, 30000);
  beforeEach(async () => {
    await db.exec('reset role; begin;');
    await asUser(A);
    const result = await db.query<{ id: string; invite_code: string }>(`select * from public.create_couple_space('Date','A')`);
    room = result.rows[0];
    await asUser(B);
    await db.query('select public.join_couple_space($1,$2)', [room.invite_code, 'B']);
    await asUser(A);
  });
  afterEach(async () => { await db.exec('rollback; reset role;'); });
  afterAll(async () => { await db.close(); });

  it('hides rooms, profiles, receipts and snapshots from a third account', async () => {
    await db.query(`insert into storage.objects(bucket_id,name) values ('receipts',$1)`, [`${room.id}/receipt.jpg`]);
    await asUser(C);
    expect((await db.query('select * from public.spaces')).rows).toHaveLength(0);
    expect((await db.query('select * from public.profiles')).rows).toHaveLength(1);
    expect((await db.query('select * from storage.objects')).rows).toHaveLength(0);
    const result = await db.query<{ snapshot: { space: unknown; transactions: unknown[] } }>('select public.get_space_snapshot() snapshot');
    expect(result.rows[0].snapshot.space).toBeNull();
    expect(result.rows[0].snapshot.transactions).toEqual([]);
  });
  it('preserves legacy financial data and labels imported history without inventing an actor', async () => {
    await asUser('00000000-0000-0000-0000-000000000004');
    const result = await db.query<{snapshot: {transactions: {user_b_share: number}[]; activityLogs: {actor_id: string|null}[]}}>('select public.get_space_snapshot() snapshot');
    expect(result.rows[0].snapshot.transactions[0].user_b_share).toBe(75);
    expect(result.rows[0].snapshot.activityLogs).toHaveLength(1);
    expect(result.rows[0].snapshot.activityLogs[0].actor_id).toBeNull();
  });
  it('rejects a third member even with the correct code', async () => {
    await asUser(C);
    await expect(db.query('select public.join_couple_space($1,$2)', [room.invite_code, 'C'])).rejects.toThrow('penuh');
  });
  it('rejects direct membership insertion', async () => {
    await asUser(C);
    await expect(db.query('insert into public.space_members(space_id,user_id,nickname) values($1,$2,$3)', [room.id,C,'C'])).rejects.toThrow();
  });
  it('cannot alter global categories', async () => {
    expect((await db.query(`delete from public.categories where space_id is null returning id`)).rows).toHaveLength(0);
  });
  it('rejects invalid shares at the database boundary', async () => {
    await expect(db.query(`insert into public.transactions(space_id,payer_id,title,amount,split_type,user_a_share,user_b_share)
      values($1,$2,'Broken',100,'CUSTOM',10,500)`, [room.id,A])).rejects.toThrow('Porsi');
  });
  it('rejects an outsider payer', async () => {
    await expect(db.query(`insert into public.transactions(space_id,payer_id,title,amount,split_type,user_a_share,user_b_share)
      values($1,$2,'Broken',100,'CUSTOM',50,50)`, [room.id,C])).rejects.toThrow('Pembayar');
  });
  it('rejects a second full settlement from the same old balance', async () => {
    await insertTx();
    await db.query(`select public.settle_balance($1,50000,50000,'paid',gen_random_uuid())`, [room.id]);
    await expect(db.query(`select public.settle_balance($1,50000,50000,'paid again',gen_random_uuid())`, [room.id])).rejects.toThrow('Saldo berubah');
  });
  it('makes retries with the same settlement ID idempotent', async () => {
    await insertTx();
    const id = '00000000-0000-0000-0000-000000000010';
    await db.query(`select public.settle_balance($1,50000,50000,'paid',$2)`, [room.id,id]);
    await db.query(`select public.settle_balance($1,50000,50000,'paid',$2)`, [room.id,id]);
    expect((await db.query('select * from public.settlements')).rows).toHaveLength(1);
  });
  it('keeps participant identities when a member leaves and lets that member rejoin', async () => {
    await insertTx();
    await db.query('select public.leave_couple_space($1)', [room.id]);
    await asUser(B);
    const s = await db.query<{user_a_id: string; user_b_id: string}>('select * from public.spaces');
    expect(s.rows[0].user_a_id).toBe(A);
    expect(s.rows[0].user_b_id).toBe(B);
    await asUser(A);
    await db.query('select public.join_couple_space($1,$2)', [room.invite_code,'A']);
    expect((await db.query('select * from public.space_members')).rows).toHaveLength(2);
  });
  it('records edits and deletion with the actual actor and before/after values', async () => {
    const tx = await insertTx();
    await asUser(B);
    await db.query(`update public.transactions set title='Updated' where id=$1`, [tx.rows[0].id]);
    await db.query(`delete from public.transactions where id=$1`, [tx.rows[0].id]);
    const logs = await db.query<{action_type: string; actor_id: string; before_data: {title: string}}>(`select * from public.activity_logs where action_type='TX_UPDATED'`);
    expect(logs.rows[0].actor_id).toBe(B);
    expect(logs.rows[0].before_data.title).toBe('Dinner');
    expect((await db.query(`select * from public.activity_logs where action_type='TX_DELETED'`)).rows).toHaveLength(1);
  });
  it('returns all 1001 transactions in one snapshot', async () => {
    await db.query(`insert into public.transactions(space_id,payer_id,title,amount,split_type,user_a_share,user_b_share)
      select $1,$2,'History',100,'EQUAL_50_50',50,50 from generate_series(1,1001)`, [room.id,A]);
    const result = await db.query<{ n: number }>(`select jsonb_array_length(public.get_space_snapshot()->'transactions') n`);
    expect(result.rows[0].n).toBe(1001);
  });
  it('switches the active event atomically', async () => {
    const events = await db.query<{id:string}>(`insert into public.events(space_id,title,is_active) values($1,'One',false),($1,'Two',false) returning id`,[room.id]);
    for (const event of events.rows) await db.query('select public.set_active_event($1,true)',[event.id]);
    expect((await db.query('select * from public.events where is_active')).rows).toHaveLength(1);
  });
  it('seeds editable presets with real UUIDs for a new room', async () => {
    const presets = await db.query<{ id: string }>('select id from public.quick_presets');
    expect(presets.rows).toHaveLength(5);
    expect((await db.query(`update public.quick_presets set label='Edited' where id=$1 returning label`, [presets.rows[0].id])).rows).toEqual([{ label: 'Edited' }]);
  });
  it('invalidates the room after deleting an empty event or preset', async () => {
    const event = await db.query<{id:string}>(`insert into public.events(space_id,title,is_active) values($1,'Empty',false) returning id`, [room.id]);
    const before = (await db.query<{revision:number}>('select revision from public.spaces')).rows[0].revision;
    await db.query('delete from public.events where id=$1',[event.rows[0].id]);
    await db.query('delete from public.quick_presets where id=(select id from public.quick_presets limit 1)');
    const after = (await db.query<{revision:number}>('select revision from public.spaces')).rows[0].revision;
    expect(Number(after)).toBe(Number(before) + 2);
    expect((await db.query(`select tablename from pg_publication_tables where pubname='supabase_realtime' and tablename='spaces'`)).rows).toHaveLength(1);
  });
  it('allows removing an event from a historical transaction after its payer leaves', async () => {
    const event = await db.query<{ id: string }>(`insert into public.events(space_id,title,is_active) values($1,'Old trip',false) returning id`, [room.id]);
    const tx = await insertTx();
    await db.query('update public.transactions set event_id=$1 where id=$2', [event.rows[0].id,tx.rows[0].id]);
    await db.query('select public.leave_couple_space($1)', [room.id]);
    await asUser(B);
    await db.query('delete from public.events where id=$1', [event.rows[0].id]);
    expect((await db.query('select event_id from public.transactions')).rows).toEqual([{ event_id: null }]);
  });
  it('rolls back the entire financial reset if settlement deletion fails', async () => {
    await insertTx();
    await db.query(`select public.settle_balance($1,50000,10000,'partial',gen_random_uuid())`, [room.id]);
    await db.exec(`reset role;
      create function public.fail_delete_test() returns trigger language plpgsql as $$begin raise exception 'simulated failure'; end$$;
      create trigger fail_delete_test before delete on public.settlements for each row execute function public.fail_delete_test();`);
    await asUser(A);
    await db.exec('savepoint reset_attempt');
    await expect(db.query('select public.clear_space_transactions($1)', [room.id])).rejects.toThrow('simulated failure');
    await db.exec('rollback to reset_attempt');
    expect((await db.query('select * from public.transactions')).rows).toHaveLength(1);
    expect((await db.query('select * from public.settlements')).rows).toHaveLength(1);
  });
  it('restricts push subscription writes to the authenticated owner', async () => {
    await expect(db.query(`insert into public.push_subscriptions(space_id,user_id,endpoint,p256dh,auth) values($1,$2,'https://example.test','key','auth')`,[room.id,B])).rejects.toThrow();
  });
  it('rolls back preset deletion if replacement insertion fails', async () => {
    await db.query(`insert into public.quick_presets(space_id,label,amount) values($1,'Keep',100)`,[room.id]);
    const before = (await db.query('select label from public.quick_presets order by label')).rows;
    await db.exec('savepoint reset_attempt');
    await expect(db.query(`select public.reset_quick_presets($1,$2)`, [room.id, JSON.stringify([{label:'Invalid',amount:-1,categoryName:'Food',iconName:'Car'}])])).rejects.toThrow();
    await db.exec('rollback to reset_attempt');
    expect((await db.query('select label from public.quick_presets order by label')).rows).toEqual(before);
  });
});
