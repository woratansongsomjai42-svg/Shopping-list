-- Bug fix: deleting a household cascades into deleting its owner's
-- household_members row, which fired guard_last_owner() and blocked the
-- delete entirely ("a household must have at least one owner") — even
-- though the household itself was going away, so there was no "last owner"
-- left to protect. Skip the check once the household row is already gone.

create or replace function guard_last_owner() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_household_id uuid := coalesce(old.household_id, new.household_id);
  v_remaining_owners integer;
begin
  if (tg_op = 'DELETE' and old.role = 'owner')
    or (tg_op = 'UPDATE' and old.role = 'owner' and new.role <> 'owner') then

    if not exists (select 1 from households where id = v_household_id) then
      return coalesce(new, old);
    end if;

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
