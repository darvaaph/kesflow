-- ==============================================================================
-- MIGRATION: QUICK PRESETS TABLE & RLS POLICIES
-- Jalankan skrip ini di Supabase SQL Editor jika database sudah ada sebelumnya.
-- ==============================================================================

create table if not exists public.quick_presets (
  id uuid default gen_random_uuid() primary key,
  space_id uuid references public.spaces(id) on delete cascade not null,
  label text not null,
  amount numeric(12, 2) not null check (amount > 0),
  category_name text not null default 'Transport & Parkir',
  icon_name text not null default 'Zap',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_quick_presets_space on public.quick_presets(space_id);

alter table public.quick_presets enable row level security;

create policy "Access quick presets" on public.quick_presets
  for all using (public.is_member_of_space(space_id));

-- Tambahkan ke publikasi Realtime Supabase
alter publication supabase_realtime add table public.quick_presets;
