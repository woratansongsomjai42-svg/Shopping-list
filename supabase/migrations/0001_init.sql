-- HomeTrack initial schema
-- Households, membership, shopping list, expenses, and expense splitting.
-- Run via `supabase db push` or paste into the Supabase SQL editor.

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- Enums
-- ─────────────────────────────────────────────────────────────

create type member_role as enum ('owner', 'member');

create type shopping_category as enum (
  'fresh_food',       -- ของสด
  'kitchen_supplies',  -- ของใช้ในครัว
  'cleaning_supplies', -- อุปกรณ์ทำความสะอาด
  'personal_care',
  'household_goods',
  'other'
);

create type urgency_level as enum ('urgent', 'normal', 'backup');

create type expense_category as enum (
  'electricity',
  'water',
  'internet',
  'groceries',
  'household_goods',
  'rent',
  'other'
);

-- ─────────────────────────────────────────────────────────────
-- Households & membership
-- ─────────────────────────────────────────────────────────────

create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique
    default upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8)),
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

create table household_members (
  household_id uuid not null references households (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role member_role not null default 'member',
  display_name text,
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create index household_members_user_id_idx on household_members (user_id);

-- ─────────────────────────────────────────────────────────────
-- Shopping list
-- ─────────────────────────────────────────────────────────────

create table shopping_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  name text not null,
  quantity numeric(10, 2) not null default 1,
  unit text not null default 'ชิ้น',
  category shopping_category not null default 'other',
  urgency urgency_level not null default 'normal',
  note text,
  is_purchased boolean not null default false,
  purchased_by uuid references auth.users (id),
  purchased_at timestamptz,
  converted_expense_id uuid, -- FK added below, once `expenses` exists
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- Expenses & splitting
-- ─────────────────────────────────────────────────────────────

create table expenses (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  description text not null,
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'THB',
  category expense_category not null default 'other',
  expense_date date not null default current_date,
  paid_by uuid not null references auth.users (id),
  source_item_id uuid references shopping_items (id) on delete set null,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- shopping_items.converted_expense_id references expenses, which is defined
-- after shopping_items — add the FK now that both tables exist.
alter table shopping_items
  add constraint shopping_items_converted_expense_id_fkey
  foreign key (converted_expense_id) references expenses (id) on delete set null;

create table expense_splits (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references expenses (id) on delete cascade,
  user_id uuid not null references auth.users (id),
  share_amount numeric(12, 2) not null check (share_amount >= 0),
  is_settled boolean not null default false,
  settled_at timestamptz,
  unique (expense_id, user_id)
);

create index shopping_items_household_id_idx on shopping_items (household_id, is_purchased);
create index expenses_household_id_date_idx on expenses (household_id, expense_date desc);
create index expense_splits_expense_id_idx on expense_splits (expense_id);
create index expense_splits_user_id_idx on expense_splits (user_id);

-- ─────────────────────────────────────────────────────────────
-- updated_at trigger
-- ─────────────────────────────────────────────────────────────

create function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger shopping_items_set_updated_at
  before update on shopping_items
  for each row execute function set_updated_at();

create trigger expenses_set_updated_at
  before update on expenses
  for each row execute function set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- Auto-add creator as owner when a household is created
-- ─────────────────────────────────────────────────────────────

create function handle_new_household() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into household_members (household_id, user_id, role)
  values (new.id, new.created_by, 'owner');
  return new;
end;
$$;

create trigger households_add_owner
  after insert on households
  for each row execute function handle_new_household();

-- ─────────────────────────────────────────────────────────────
-- RLS helper functions (security definer to avoid recursive policy checks)
-- ─────────────────────────────────────────────────────────────

create function is_household_member(p_household_id uuid) returns boolean
language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from household_members
    where household_id = p_household_id and user_id = auth.uid()
  );
$$;

create function is_household_owner(p_household_id uuid) returns boolean
language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from household_members
    where household_id = p_household_id and user_id = auth.uid() and role = 'owner'
  );
$$;

-- Joins the caller into a household by invite code. Runs as security definer
-- so it can look up the household without an RLS select policy granting
-- access to strangers, and inserts the membership without needing a broad
-- self-insert policy on household_members.
create function join_household_by_invite_code(p_invite_code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_household_id uuid;
begin
  select id into v_household_id from households where invite_code = upper(p_invite_code);

  if v_household_id is null then
    raise exception 'invalid invite code';
  end if;

  insert into household_members (household_id, user_id)
  values (v_household_id, auth.uid())
  on conflict (household_id, user_id) do nothing;

  return v_household_id;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- household_members guards
-- ─────────────────────────────────────────────────────────────

-- Fills the member's display name from their signup metadata so the roster
-- doesn't just show raw user ids. Covers email signup (display_name) and the
-- common OAuth provider fields (full_name / name).
create function set_member_display_name() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.display_name is null then
    select coalesce(
      raw_user_meta_data ->> 'display_name',
      raw_user_meta_data ->> 'full_name',
      raw_user_meta_data ->> 'name'
    )
    into new.display_name
    from auth.users
    where id = new.user_id;
  end if;
  return new;
end;
$$;

create trigger household_members_set_display_name
  before insert on household_members
  for each row execute function set_member_display_name();

-- Caps how many households one user can belong to. Enforced here (rather
-- than in each caller) so it covers both creating a household
-- (households_add_owner above) and joining one (join_household_by_invite_code
-- below) with a single rule.
create function check_household_membership_limit() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_limit constant integer := 5;
  v_count integer;
begin
  select count(*) into v_count from household_members where user_id = new.user_id;
  if v_count >= v_limit then
    raise exception 'HOUSEHOLD_LIMIT_REACHED' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger household_members_enforce_limit
  before insert on household_members
  for each row execute function check_household_membership_limit();

-- Only the household owner may change another row's role; a member updating
-- their own row (e.g. display_name) may not smuggle in a role change.
create function guard_member_role_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.role <> old.role and not is_household_owner(old.household_id) then
    raise exception 'only the household owner can change member roles';
  end if;
  return new;
end;
$$;

create trigger household_members_guard_role_change
  before update on household_members
  for each row execute function guard_member_role_change();

-- Blocks demoting or removing the last owner of a household, so it never
-- ends up ownerless.
create function guard_last_owner() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_household_id uuid := coalesce(old.household_id, new.household_id);
  v_remaining_owners integer;
begin
  if (tg_op = 'DELETE' and old.role = 'owner')
    or (tg_op = 'UPDATE' and old.role = 'owner' and new.role <> 'owner') then
    select count(*) into v_remaining_owners
    from household_members
    where household_id = v_household_id and role = 'owner' and user_id <> old.user_id;

    if v_remaining_owners = 0 then
      raise exception 'a household must have at least one owner';
    end if;
  end if;

  return coalesce(new, old);
end;
$$;

create trigger household_members_guard_last_owner
  before update or delete on household_members
  for each row execute function guard_last_owner();

-- ─────────────────────────────────────────────────────────────
-- RLS policies
-- ─────────────────────────────────────────────────────────────

alter table households enable row level security;
alter table household_members enable row level security;
alter table shopping_items enable row level security;
alter table expenses enable row level security;
alter table expense_splits enable row level security;

-- households
create policy "members can view their households"
  on households for select
  using (is_household_member(id));

create policy "authenticated users can create households"
  on households for insert
  with check (auth.uid() = created_by);

create policy "owners can update their household"
  on households for update
  using (is_household_owner(id));

create policy "owners can delete their household"
  on households for delete
  using (is_household_owner(id));

-- household_members
create policy "members can view household roster"
  on household_members for select
  using (is_household_member(household_id));

-- Self-joining happens through join_household_by_invite_code(), which runs
-- as security definer and bypasses this policy; it is intentionally not
-- listed here so a member can't be added to a household by guessing its id.
create policy "owners can add members"
  on household_members for insert
  with check (is_household_owner(household_id));

create policy "owners manage roles, members edit themselves"
  on household_members for update
  using (is_household_owner(household_id) or user_id = auth.uid());

create policy "owners remove members, members can leave"
  on household_members for delete
  using (is_household_owner(household_id) or user_id = auth.uid());

-- shopping_items
create policy "members can view shopping items"
  on shopping_items for select
  using (is_household_member(household_id));

create policy "members can add shopping items"
  on shopping_items for insert
  with check (is_household_member(household_id) and created_by = auth.uid());

create policy "members can update shopping items"
  on shopping_items for update
  using (is_household_member(household_id));

create policy "members can delete shopping items"
  on shopping_items for delete
  using (is_household_member(household_id));

-- expenses
create policy "members can view expenses"
  on expenses for select
  using (is_household_member(household_id));

create policy "members can add expenses"
  on expenses for insert
  with check (is_household_member(household_id) and created_by = auth.uid());

create policy "members can update expenses"
  on expenses for update
  using (is_household_member(household_id));

create policy "members can delete expenses"
  on expenses for delete
  using (is_household_member(household_id));

-- expense_splits
create policy "members can view expense splits"
  on expense_splits for select
  using (exists (
    select 1 from expenses e
    where e.id = expense_splits.expense_id and is_household_member(e.household_id)
  ));

create policy "members can add expense splits"
  on expense_splits for insert
  with check (exists (
    select 1 from expenses e
    where e.id = expense_splits.expense_id and is_household_member(e.household_id)
  ));

create policy "members can update expense splits"
  on expense_splits for update
  using (exists (
    select 1 from expenses e
    where e.id = expense_splits.expense_id and is_household_member(e.household_id)
  ));

create policy "members can delete expense splits"
  on expense_splits for delete
  using (exists (
    select 1 from expenses e
    where e.id = expense_splits.expense_id and is_household_member(e.household_id)
  ));

-- ─────────────────────────────────────────────────────────────
-- Realtime: broadcast changes to the shopping list and expenses
-- ─────────────────────────────────────────────────────────────

alter publication supabase_realtime add table shopping_items;
alter publication supabase_realtime add table expenses;
