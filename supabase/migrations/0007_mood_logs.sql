-- Daily mood tracker — private to each user, not shared with the household.
-- One entry per user per day (upsert on mood_date). Run via `supabase db
-- push` or paste into the SQL editor.

create table mood_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  mood_date date not null default current_date,
  mood smallint not null check (mood between 1 and 5),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, mood_date)
);

create index mood_logs_user_id_idx on mood_logs (user_id, mood_date desc);

create trigger mood_logs_set_updated_at
  before update on mood_logs
  for each row execute function set_updated_at();

alter table mood_logs enable row level security;

-- Purely private: no household_id — a row is visible and writable only by
-- the user who created it.
create policy "users manage their own mood logs"
  on mood_logs for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
