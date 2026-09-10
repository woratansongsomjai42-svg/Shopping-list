-- Household reminders/calendar — shared with the household, same
-- membership-gated model as shopping_items.

create table reminders (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  title text not null,
  note text,
  due_date date not null,
  due_time time,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

create index reminders_household_id_due_date_idx on reminders (household_id, due_date);

alter table reminders enable row level security;

create policy "members can view reminders"
  on reminders for select
  using (is_household_member(household_id));

create policy "members can add reminders"
  on reminders for insert
  with check (is_household_member(household_id) and created_by = auth.uid());

create policy "members can update reminders"
  on reminders for update
  using (is_household_member(household_id));

create policy "members can delete reminders"
  on reminders for delete
  using (is_household_member(household_id));
