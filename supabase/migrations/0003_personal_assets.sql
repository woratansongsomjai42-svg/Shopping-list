-- Personal asset / investment portfolio — private to each user, same
-- ownership model as personal_transactions (no household_id).

create type personal_asset_type as enum (
  'savings',
  'stock',
  'mutual_fund',
  'crypto',
  'real_estate',
  'gold',
  'other'
);

create table personal_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type personal_asset_type not null default 'other',
  invested_amount numeric(14, 2) not null default 0,
  current_value numeric(14, 2) not null default 0,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index personal_assets_user_id_idx on personal_assets (user_id);

create trigger personal_assets_set_updated_at
  before update on personal_assets
  for each row execute function set_updated_at();

alter table personal_assets enable row level security;

create policy "users manage their own assets"
  on personal_assets for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
