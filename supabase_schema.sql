-- 1. Create PROFILES table (Public user data)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  role text default 'user', -- 'admin' or 'user'
  created_at timestamptz default now()
);

-- 2. Create EXAM_SESSIONS table (Stores full exam history)
create table public.exam_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  module text not null, -- 'vorstellung', 'bild', 'planung', 'schreiben'
  topic text,
  grade text, -- 'A1', 'A2', 'B1', 'Unter A1'
  duration_seconds integer,
  transcript jsonb, -- Stores the chat history or written text
  feedback_data jsonb, -- Stores the full AI grading result (mistakes, tips, reasoning)
  created_at timestamptz default now()
);

-- 3. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.exam_sessions enable row level security;

-- 4. Policies for PROFILES
-- Users can view their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using ( auth.uid() = id );

-- Admins can view all profiles (We assume you will manually set your role to 'admin' in the database)
create policy "Admins can view all profiles"
  on public.profiles for select
  using ( (select role from public.profiles where id = auth.uid()) = 'admin' );

-- 5. Policies for EXAM_SESSIONS
-- Users can insert their own results
create policy "Users can insert own sessions"
  on public.exam_sessions for insert
  with check ( auth.uid() = user_id );

-- Users can view their own results
create policy "Users can view own sessions"
  on public.exam_sessions for select
  using ( auth.uid() = user_id );

-- Admins can view all results
create policy "Admins can view all sessions"
  on public.exam_sessions for select
  using ( (select role from public.profiles where id = auth.uid()) = 'admin' );

-- 6. Trigger to automatically create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 7. (Optional) Insert logic for existing users if any
-- insert into public.profiles (id) select id from auth.users on conflict do nothing;
