-- ─── Clean Table Setup ────────────────────────────────────────────────────────
-- This migration is intended to create and update schema objects only.
-- It is idempotent and should not delete or modify existing user data.
-- If a schema object already exists, the script uses safe guards like IF NOT EXISTS.

-- Create folders table
create table if not exists public.folders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create roadmaps table
create table if not exists public.roadmaps (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  folder_id uuid references public.folders(id) on delete set null,
  name text not null,
  state jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create roadmap memberships table for collaboration
create table if not exists public.roadmap_memberships (
  id uuid default gen_random_uuid() primary key,
  roadmap_id uuid references public.roadmaps(id) on delete cascade not null,
  user_id uuid references auth.users(id) not null,
  role text not null default 'viewer',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint roadmap_memberships_unique_user_per_roadmap unique (roadmap_id, user_id)
);

-- Create public profiles table
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  display_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles add column if not exists display_name text;

-- Create journal_entries table
create table if not exists public.journal_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  content text not null,
  mood text,
  linked_node_ids jsonb default '[]'::jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint journal_entries_user_date_key unique (user_id, date)
);

-- Create pomodoro_sessions table
create table if not exists public.pomodoro_sessions (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  mode text not null,
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  linked_node_id text,
  duration_seconds integer not null
);


-- ─── Row Level Security (RLS) Policies ────────────────────────────────────────

-- Enable Row Level Security (RLS)
alter table public.folders enable row level security;
alter table public.roadmaps enable row level security;
alter table public.roadmap_memberships enable row level security;
alter table public.profiles enable row level security;
alter table public.journal_entries enable row level security;
alter table public.pomodoro_sessions enable row level security;

-- Policies for folders
drop policy if exists "Users can perform all actions on their own folders" on public.folders;
drop policy if exists "Users can perform all actions on their own folders" on folders;
create policy "Users can perform all actions on their own folders"
  on public.folders for all using (auth.uid() = user_id);

-- Policies for roadmaps
drop policy if exists "Users can perform all actions on their own roadmaps" on public.roadmaps;
drop policy if exists "Users can perform all actions on their own roadmaps" on roadmaps;
drop policy if exists "Users can select shared roadmaps" on public.roadmaps;
drop policy if exists "Users can select shared roadmaps" on roadmaps;
drop policy if exists "Users can insert their own roadmaps" on public.roadmaps;
drop policy if exists "Users can insert their own roadmaps" on roadmaps;
drop policy if exists "Users can update roadmap content" on public.roadmaps;
drop policy if exists "Users can update roadmap content" on roadmaps;
drop policy if exists "Users can delete roadmaps" on public.roadmaps;
drop policy if exists "Users can delete roadmaps" on roadmaps;
create policy "Users can select shared roadmaps"
  on public.roadmaps for select using (
    auth.uid() = user_id
    or exists (
      select 1 from public.roadmap_memberships
      where public.roadmap_memberships.roadmap_id = public.roadmaps.id
        and public.roadmap_memberships.user_id = auth.uid()
    )
  );
create policy "Users can insert their own roadmaps"
  on public.roadmaps for insert with check (auth.uid() = user_id);
create policy "Users can update roadmap content"
  on public.roadmaps for update using (
    auth.uid() = user_id
    or exists (
      select 1 from public.roadmap_memberships
      where public.roadmap_memberships.roadmap_id = public.roadmaps.id
        and public.roadmap_memberships.user_id = auth.uid()
        and public.roadmap_memberships.role = 'editor'
    )
  );
create policy "Users can delete roadmaps"
  on public.roadmaps for delete using (
    auth.uid() = user_id
  );

-- Helper function for roadmap ownership checks without row-level security recursion
create or replace function public.is_roadmap_owner(roadmap_id uuid)
returns boolean as $$
begin
  return exists(
    select 1 from public.roadmaps
    where id = roadmap_id and user_id = auth.uid()
  );
end;
$$ language plpgsql security definer set row_security = off;

-- Policies for roadmap memberships
drop policy if exists "Users can manage roadmap memberships" on public.roadmap_memberships;
drop policy if exists "Users can manage roadmap memberships" on roadmap_memberships;
create policy "Users can manage roadmap memberships"
  on public.roadmap_memberships for all using (
    auth.uid() = user_id
    or public.is_roadmap_owner(roadmap_id)
  );

-- Policies for profiles
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can view own profile" on profiles;
create policy "Users can view own profile" 
  on public.profiles for select using (auth.uid() = id);

drop policy if exists "Authenticated users can find profiles for sharing" on public.profiles;
drop policy if exists "Authenticated users can find profiles for sharing" on profiles;
create policy "Authenticated users can find profiles for sharing"
  on public.profiles for select using (auth.role() = 'authenticated');

drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile" 
  on public.profiles for update using (auth.uid() = id);

-- Policies for journal_entries
drop policy if exists "Users can perform all actions on their own journal entries" on public.journal_entries;
drop policy if exists "Users can perform all actions on their own journal entries" on journal_entries;
create policy "Users can perform all actions on their own journal entries"
  on public.journal_entries for all using (auth.uid() = user_id);

-- Policies for pomodoro_sessions
drop policy if exists "Users can perform all actions on their own pomodoro sessions" on public.pomodoro_sessions;
drop policy if exists "Users can perform all actions on their own pomodoro sessions" on pomodoro_sessions;
create policy "Users can perform all actions on their own pomodoro sessions"
  on public.pomodoro_sessions for all using (auth.uid() = user_id);


-- ─── Automatic Profile Trigger ───────────────────────────────────────────────

-- Create trigger function
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ─── Performance Optimization Indexes ────────────────────────────────────────

-- Create index on folder user_id
create index if not exists folders_user_id_idx on public.folders(user_id);

-- Create index on roadmap user_id
create index if not exists roadmaps_user_id_idx on public.roadmaps(user_id);

-- Create index on roadmap folder_id
create index if not exists roadmaps_folder_id_idx on public.roadmaps(folder_id);

-- Create index on journal user_id
create index if not exists journal_entries_user_id_idx on public.journal_entries(user_id);

-- Create index on pomodoro user_id
create index if not exists pomodoro_sessions_user_id_idx on public.pomodoro_sessions(user_id);


-- ─── Realtime Subscriptions ──────────────────────────────────────────────────

-- Enable realtime for roadmaps table
alter publication supabase_realtime add table public.roadmaps;

