-- ============================================================
-- Hearth — Row-Level Security (Supabase)
-- Apply after schema.sql on Supabase (needs the auth schema / auth.uid()).
-- Model: app_user.id == auth.users.id. A user sees only data of households
-- they belong to. Coin-touching mutations go through SECURITY DEFINER
-- functions so balances stay correct regardless of table policies.
-- ============================================================

-- ---------- Helpers ----------
create or replace function is_member(h uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from membership where household_id = h and user_id = auth.uid());
$$;

create or replace function is_parent(h uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from membership where household_id = h and user_id = auth.uid() and role = 'parent');
$$;

-- lifecycle functions run as definer (bypass RLS, enforce their own rules)
alter function take_task(uuid, uuid)          security definer;
alter function submit_task(uuid, uuid)        security definer;
alter function approve_task(uuid, uuid)       security definer;
alter function reject_task(uuid, uuid, text)  security definer;
alter function redeem_reward(uuid, uuid)      security definer;
alter function generate_due_tasks(date)       security definer;

-- ---------- Enable RLS ----------
alter table app_user        enable row level security;
alter table household        enable row level security;
alter table membership       enable row level security;
alter table goal             enable row level security;
alter table invite           enable row level security;
alter table reward_item      enable row level security;
alter table task_template    enable row level security;
alter table task             enable row level security;
alter table transaction      enable row level security;
alter table task_event       enable row level security;
alter table task_attachment  enable row level security;
alter table notification     enable row level security;

-- ---------- app_user ----------
create policy au_self_read on app_user for select using (
  id = auth.uid() or exists (
    select 1 from membership m1 join membership m2 on m1.household_id = m2.household_id
    where m1.user_id = auth.uid() and m2.user_id = app_user.id)
);
create policy au_self_write on app_user for update using (id = auth.uid()) with check (id = auth.uid());
create policy au_insert on app_user for insert with check (id = auth.uid());

-- ---------- household ----------
create policy hh_read   on household for select using (is_member(id));
create policy hh_create on household for insert with check (created_by = auth.uid());
create policy hh_admin  on household for update using (is_parent(id));

-- ---------- membership ----------
create policy ms_read   on membership for select using (is_member(household_id));
create policy ms_join   on membership for insert with check (user_id = auth.uid() or is_parent(household_id));
create policy ms_manage on membership for update using (is_parent(household_id) or user_id = auth.uid());

-- ---------- goal (a member manages their own; parents can help) ----------
create policy goal_read  on goal for select using (is_member((select household_id from membership where id = goal.membership_id)));
create policy goal_write on goal for all using (is_member((select household_id from membership where id = goal.membership_id)))
  with check (is_member((select household_id from membership where id = goal.membership_id)));

-- ---------- household-scoped read for the rest ----------
create policy inv_read on invite       for select using (is_member(household_id));
create policy inv_mng  on invite       for all using (is_parent(household_id)) with check (is_parent(household_id));

create policy rw_read  on reward_item  for select using (is_member(household_id));
create policy rw_mng   on reward_item  for all using (is_parent(household_id)) with check (is_parent(household_id));

create policy tpl_read on task_template for select using (is_member(household_id));
create policy tpl_mng  on task_template for all using (is_parent(household_id)) with check (is_parent(household_id));

create policy task_read on task for select using (is_member(household_id));
create policy task_mng  on task for all using (is_parent(household_id)) with check (is_parent(household_id));
-- (children take/submit tasks via the SECURITY DEFINER functions, not direct writes)

create policy txn_read on transaction for select using (is_member(household_id));
create policy te_read  on task_event  for select using (is_member((select household_id from task where id = task_event.task_id)));

create policy att_read on task_attachment for select using (is_member((select household_id from task where id = task_attachment.task_id)));
create policy att_add  on task_attachment for insert with check (is_member((select household_id from task where id = task_attachment.task_id)));

-- ---------- notifications: only the recipient ----------
create policy notif_read on notification for select using (
  recipient_id in (select id from membership where user_id = auth.uid())
);
create policy notif_upd on notification for update using (
  recipient_id in (select id from membership where user_id = auth.uid())
);

-- ---------- grant execute on RPCs ----------
grant execute on function take_task(uuid, uuid), submit_task(uuid, uuid),
  approve_task(uuid, uuid), reject_task(uuid, uuid, text),
  redeem_reward(uuid, uuid), generate_due_tasks(date) to authenticated;
