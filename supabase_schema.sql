-- 🧹 CLEANUP: Удаляем старую таблицу, чтобы не путаться
DROP TABLE IF EXISTS public.exam_results;

-- ⚠️ WARNING: Пересоздаем таблицу сессий (удалит историю тестов новой версии, если она там была)
DROP TABLE IF EXISTS public.exam_sessions;

-- 1. Create PROFILES table (if not exists)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  role text default 'user',
  created_at timestamptz default now()
);

-- 2. Create EXAM_SESSIONS table (Correct Structure)
create table public.exam_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  module text not null,
  topic text,
  grade text,
  duration_seconds integer,
  transcript jsonb, 
  feedback_data jsonb,
  created_at timestamptz default now()
);

-- 3. Enable RLS
alter table public.profiles enable row level security;
alter table public.exam_sessions enable row level security;

-- 4. Re-create Policies
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Admins can view all profiles" on public.profiles;
drop policy if exists "Users can insert own sessions" on public.exam_sessions;
drop policy if exists "Users can view own sessions" on public.exam_sessions;
drop policy if exists "Admins can view all sessions" on public.exam_sessions;

create policy "Users can view own profile" on public.profiles for select using ( auth.uid() = id );
create policy "Admins can view all profiles" on public.profiles for select using ( (select role from public.profiles where id = auth.uid()) = 'admin' );

create policy "Users can insert own sessions" on public.exam_sessions for insert with check ( auth.uid() = user_id );
create policy "Users can view own sessions" on public.exam_sessions for select using ( auth.uid() = user_id );
create policy "Admins can view all sessions" on public.exam_sessions for select using ( (select role from public.profiles where id = auth.uid()) = 'admin' );

-- 5. Fix Profiles for existing users
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;
