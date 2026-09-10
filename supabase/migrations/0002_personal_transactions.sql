-- Personal income/expense ledger — private to each user, not shared with
-- the household. Run via `supabase db push` or paste into the SQL editor.

create type personal_transaction_type as enum ('income', 'expense');

create table personal_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type personal_transaction_type not null,
  category text not null default 'อื่นๆ',
  description text not null,
  amount numeric(12, 2) not null check (amount > 0),
  transaction_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index personal_transactions_user_id_idx
  on personal_transactions (user_id, transaction_date desc);

create trigger personal_transactions_set_updated_at
  before update on personal_transactions
  for each row execute function set_updated_at();

alter table personal_transactions enable row level security;

-- Purely private: no household_id, no owner/member distinction — a row is
-- visible and writable only by the user who created it.
create policy "users manage their own personal transactions"
  on personal_transactions for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
