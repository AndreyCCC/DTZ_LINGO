-- 🧨 RESET: Полный сброс таблиц и функций, чтобы начать с чистого листа
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.exam_sessions;
DROP TABLE IF EXISTS public.exam_results; -- удаляем старую на всякий случай
DROP TABLE IF EXISTS public.profiles;

-- 1. Создаем таблицу PROFILES (Профили)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  role text default 'user',
  created_at timestamptz default now()
);

-- 2. 🔥 ВАЖНО: Триггер для автоматического создания профиля при регистрации
-- Это решает проблему, когда юзер есть в Auth, но нет в Profiles
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. 🚑 ЛЕЧЕНИЕ СТАРЫХ ЮЗЕРОВ: Создаем профили для всех, кто уже есть в системе
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

-- 4. Создаем таблицу EXAM_SESSIONS (Сессии)
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

-- 5. Настройка безопасности (RLS)
alter table public.profiles enable row level security;
alter table public.exam_sessions enable row level security;

-- Политики доступа
create policy "Users can view own profile" on public.profiles for select using ( auth.uid() = id );
create policy "Users can insert own sessions" on public.exam_sessions for insert with check ( auth.uid() = user_id );
create policy "Users can view own sessions" on public.exam_sessions for select using ( auth.uid() = user_id );
create policy "Admins can view all sessions" on public.exam_sessions for select using ( 
  (select role from public.profiles where id = auth.uid()) = 'admin' 
);
