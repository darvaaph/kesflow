-- Migration: Izinkan sesama anggota pasangan untuk melihat profil & nama satu sama lain
-- Masalah sebelumnya: Policy lama "Users can view own profile" (auth.uid() = id) memblokir user melihat profil pasangannya.

drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Authenticated users can view profiles" on public.profiles;

create policy "Authenticated users can view profiles" on public.profiles
  for select using (auth.role() = 'authenticated');
