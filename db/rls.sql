-- ============================================================
-- Hearth — Row-Level Security (Supabase), schema v3
-- Apply AFTER schema.sql on Supabase (needs auth.uid()).
-- Model: app_user.id == auth.users.id. A user sees only data of
-- households they belong to. Coin-touching / lifecycle mutations go
-- through SECURITY DEFINER functions, so they bypass table policies
-- and enforce their own rules (creator-only approval, currency, etc.).
-- Equal rights: any member can create tasks and rewards.
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

-- household of a membership row
create or replace function hh_of_member(m uuid) returns uuid
  language sql stable security definer set search_path = public as $$
  select household_id from membership where id = m;
$$;

-- household of a task
create or replace function hh_of_task(t uuid) returns uuid
  language sql stable security definer set search_path = public as $$
  select household_id from task where id = t;
$$;

-- ---------- Lifecycle / coin functions run as definer ----------
alter function take_task(uuid, uuid)                 security definer;
alter function accept_offer(uuid, uuid)              security definer;
alter function decline_offer(uuid, uuid)             security definer;
alter function submit_task(uuid, uuid)               security definer;
alter function approve_task(uuid, uuid)              security definer;
alter function reject_task(uuid, uuid, text)         security definer;
alter function redeem_reward(uuid, uuid)             security definer;
alter function request_reward(uuid, uuid, uuid, text, text)   security definer;
alter function approve_reward_request(uuid, uuid, integer)    security definer;
alter function decline_reward_request(uuid, uuid)            security definer;
alter function generate_due_tasks(date)             security definer;

-- ---------- Enable RLS ----------
alter table app_user        enable row level security;
alter table household       enable row level security;
alter table room            enable row level security;
alter table membership      enable row level security;
alter table goal            enable row level security;
alter table invite          enable row level security;
alter table reward_item     enable row level security;
alter table reward_request  enable row level security;
alter table task_template   enable row level security;
alter table task            enable row level security;
alter table transaction     enable row level security;
alter table task_event      enable row level security;
alter table task_attachment enable row level security;
alter table notification    enable row level security;

-- ---------- app_user ----------
create policy au_read on app_user for select using (
  id = auth.uid() or exists (
    select 1 from membership m1 join membership m2 on m1.household_id = m2.household_id
    where m1.user_id = auth.uid() and m2.user_id = app_user.id)
);
create policy au_update on app_user for update using (id = auth.uid()) with check (id = auth.uid());
create policy au_insert on app_user for insert with check (id = auth.uid());

-- ---------- household ----------
create policy hh_read   on household for select using (is_member(id));
create policy hh_create on household for insert with check (created_by = auth.uid());
create policy hh_update on household for update using (is_parent(id));

-- ---------- room ----------
create policy room_read  on room for select using (is_member(household_id));
create policy room_write on room for all using (is_member(household_id)) with check (is_member(household_id));

-- ---------- membership ----------
create policy ms_read   on membership for select using (is_member(household_id));
create policy ms_join   on membership for insert with check (user_id = auth.uid() or is_parent(household_id));
create policy ms_update on membership for update using (is_parent(household_id) or user_id = auth.uid());

-- ---------- goal (owner manages own; household can read) ----------
create policy goal_read  on goal for select using (is_member(hh_of_member(membership_id)));
create policy goal_write on goal for all using (is_member(hh_of_member(membership_id))) with check (is_member(hh_of_member(membership_id)));

-- ---------- invite ----------
create policy inv_read on invite for select using (is_member(household_id));
create policy inv_mng  on invite for all using (is_parent(household_id)) with check (is_parent(household_id));

-- ---------- reward_item (equal rights: any member creates) ----------
create policy rw_read  on reward_item for select using (is_member(household_id));
create policy rw_write on reward_item for all using (is_member(household_id)) with check (is_member(household_id));

-- ---------- reward_request (read household; create as self; resolve via RPC) ----------
create policy rr_read   on reward_request for select using (is_member(household_id));
create policy rr_create on reward_request for insert with check (is_member(household_id));

-- ---------- task_template ----------
create policy tpl_read  on task_template for select using (is_member(household_id));
create policy tpl_write on task_template for all using (is_member(household_id)) with check (is_member(household_id));

-- ---------- task (read household; create as member; state changes via RPC) ----------
create policy task_read   on task for select using (is_member(household_id));
create policy task_create on task for insert with check (is_member(household_id));

-- ---------- transaction (read only; writes via functions) ----------
create policy txn_read on transaction for select using (is_member(household_id));

-- ---------- task_event / attachments ----------
create policy te_read  on task_event for select using (is_member(hh_of_task(task_id)));
create policy att_read on task_attachment for select using (is_member(hh_of_task(task_id)));
create policy att_add  on task_attachment for insert with check (is_member(hh_of_task(task_id)));

-- ---------- notifications: only the recipient ----------
create policy notif_read on notification for select using (
  recipient_id in (select id from membership where user_id = auth.uid())
);
create policy notif_upd on notification for update using (
  recipient_id in (select id from membership where user_id = auth.uid())
);

-- ---------- grant execute on RPCs ----------
grant execute on function
  take_task(uuid, uuid), accept_offer(uuid, uuid), decline_offer(uuid, uuid),
  submit_task(uuid, uuid), approve_task(uuid, uuid), reject_task(uuid, uuid, text),
  redeem_reward(uuid, uuid), request_reward(uuid, uuid, uuid, text, text),
  approve_reward_request(uuid, uuid, integer), decline_reward_request(uuid, uuid),
  generate_due_tasks(date)
to authenticated;
