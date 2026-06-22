-- ============================================================
-- Hearth — database schema v3 (PostgreSQL)
-- Adds: two currencies (child/adult), offered task status,
-- magazine (reward ownership + reward requests), rooms,
-- household guardian/theme. Works on any Postgres / Supabase.
-- Coin balances are cached on membership; the `transaction`
-- ledger is the source of truth; SQL functions keep them in sync.
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- Enums ----------
create type member_role    as enum ('parent', 'child');
create type currency       as enum ('child', 'adult');   -- two separate moneys
create type task_status    as enum ('open', 'offered', 'accepted', 'submitted', 'approved', 'rejected');
create type txn_type       as enum ('earn', 'spend', 'adjust');
create type invite_status  as enum ('pending', 'accepted', 'revoked');
create type recurrence     as enum ('once', 'daily', 'weekly', 'monthly');
create type goal_status    as enum ('active', 'reached', 'archived');
create type task_action    as enum ('created', 'offered', 'assigned', 'taken', 'accepted', 'declined', 'submitted', 'approved', 'rejected', 'reopened');
create type notif_type     as enum ('task_offered', 'task_submitted', 'task_approved', 'task_rejected', 'reward_redeemed', 'reward_requested', 'reward_request_resolved', 'member_joined', 'reminder');
create type request_status as enum ('pending', 'approved', 'declined');

-- ---------- Accounts ----------
create table app_user (
  id            uuid primary key default gen_random_uuid(),
  email         text unique not null,
  display_name  text not null,
  avatar_color  text not null default '#d37b5b',
  password_hash text,
  created_at    timestamptz not null default now()
);

-- ---------- Household ----------
create table household (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  invite_code  text unique not null,
  guardian     text not null default 'cottage',  -- "хранитель очага" (icon key)
  theme        text not null default 'hearth',
  created_by   uuid references app_user(id) on delete set null,
  created_at   timestamptz not null default now()
);

-- ---------- Rooms ----------
create table room (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references household(id) on delete cascade,
  name         text not null,
  created_at   timestamptz not null default now()
);
create index on room (household_id);

-- ---------- Membership: user in a household, role + two balances ----------
create table membership (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references household(id) on delete cascade,
  user_id       uuid not null references app_user(id) on delete cascade,
  role          member_role not null,
  is_admin      boolean not null default false,
  coins_child   integer not null default 0 check (coins_child >= 0),
  coins_adult   integer not null default 0 check (coins_adult >= 0),
  joined_at     timestamptz not null default now(),
  unique (household_id, user_id),
  check (not is_admin or role = 'parent')
);
create index on membership (household_id);

-- ---------- Savings goals (several per member) ----------
create table goal (
  id            uuid primary key default gen_random_uuid(),
  membership_id uuid not null references membership(id) on delete cascade,
  title         text not null,
  emoji         text,
  target        integer not null check (target > 0),
  cur           currency not null default 'child',
  status        goal_status not null default 'active',
  created_at    timestamptz not null default now(),
  reached_at    timestamptz
);
create index on goal (membership_id, status);

-- ---------- Invites ----------
create table invite (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references household(id) on delete cascade,
  code          text unique not null,
  invited_name  text,
  role          member_role not null,
  status        invite_status not null default 'pending',
  created_by    uuid references membership(id) on delete set null,
  accepted_by   uuid references membership(id) on delete set null,
  created_at    timestamptz not null default now()
);
create index on invite (household_id);

-- ---------- Reward catalogue (each reward has a currency + owner who fulfils it) ----------
create table reward_item (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references household(id) on delete cascade,
  title         text not null,
  description   text,
  tag           text,
  cost          integer not null check (cost > 0),
  cur           currency not null default 'adult',
  owner_id      uuid references membership(id) on delete set null,  -- who grants/fulfils it
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);
create index on reward_item (household_id) where active;

-- ---------- Reward requests ("ask X for a reward; they set a price or decline") ----------
create table reward_request (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references household(id) on delete cascade,
  requester_id  uuid not null references membership(id) on delete cascade,
  target_id     uuid not null references membership(id) on delete cascade,  -- who is asked
  title         text not null,
  note          text,
  status        request_status not null default 'pending',
  reward_id     uuid references reward_item(id) on delete set null,         -- created on approval
  created_at    timestamptz not null default now(),
  resolved_at   timestamptz
);
create index on reward_request (household_id, status);

-- ---------- Recurring task templates ----------
create table task_template (
  id              uuid primary key default gen_random_uuid(),
  household_id    uuid not null references household(id) on delete cascade,
  title           text not null,
  note            text,
  reward          integer not null default 0 check (reward >= 0),
  cur             currency not null default 'adult',
  default_assignee uuid references membership(id) on delete set null,
  is_personal     boolean not null default false,
  recurrence      recurrence not null default 'weekly',
  weekdays        smallint[] not null default '{}',
  day_of_month    smallint check (day_of_month between 1 and 31),
  time_of_day     time,
  active          boolean not null default true,
  created_by      uuid references membership(id) on delete set null,
  last_run_on     date,
  created_at      timestamptz not null default now()
);
create index on task_template (household_id) where active;

-- ---------- Tasks ----------
create table task (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references household(id) on delete cascade,
  template_id   uuid references task_template(id) on delete set null,
  room_id       uuid references room(id) on delete set null,
  title         text not null,
  note          text,
  place         text,
  reward        integer not null default 0 check (reward >= 0),
  cur           currency not null default 'adult',     -- currency the reward pays in
  assignee_id   uuid references membership(id) on delete set null,  -- null = board
  created_by    uuid references membership(id) on delete set null,
  status        task_status not null default 'open',
  is_personal   boolean not null default false,
  urgent        boolean not null default false,
  due_at        timestamptz,
  remind_at     timestamptz,
  created_at    timestamptz not null default now(),
  submitted_at  timestamptz,
  approved_at   timestamptz
);
create index on task (household_id, status);
create index on task (assignee_id);
create index on task (template_id);

-- ---------- Coin ledger ----------
create table transaction (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references household(id) on delete cascade,
  membership_id uuid not null references membership(id) on delete cascade,
  type          txn_type not null,
  cur           currency not null,
  amount        integer not null check (amount > 0),
  title         text not null,
  task_id       uuid references task(id) on delete set null,
  reward_id     uuid references reward_item(id) on delete set null,
  created_at    timestamptz not null default now()
);
create index on transaction (membership_id, created_at desc);

-- ---------- Task lifecycle / approval log ----------
create table task_event (
  id            uuid primary key default gen_random_uuid(),
  task_id       uuid not null references task(id) on delete cascade,
  actor_id      uuid references membership(id) on delete set null,
  action        task_action not null,
  note          text,
  created_at    timestamptz not null default now()
);
create index on task_event (task_id, created_at);

-- ---------- Photo attachments ----------
create table task_attachment (
  id            uuid primary key default gen_random_uuid(),
  task_id       uuid not null references task(id) on delete cascade,
  uploaded_by   uuid references membership(id) on delete set null,
  url           text not null,
  created_at    timestamptz not null default now()
);
create index on task_attachment (task_id);

-- ---------- Notifications ----------
create table notification (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references household(id) on delete cascade,
  recipient_id  uuid not null references membership(id) on delete cascade,
  type          notif_type not null,
  title         text not null,
  body          text,
  task_id       uuid references task(id) on delete cascade,
  read_at       timestamptz,
  created_at    timestamptz not null default now()
);
create index on notification (recipient_id, read_at, created_at desc);

-- ============================================================
-- Helpers
-- ============================================================
create or replace function add_coins(p_member uuid, p_cur currency, p_delta integer)
returns integer language plpgsql as $$
declare bal integer;
begin
  if p_cur = 'child' then
    update membership set coins_child = coins_child + p_delta where id = p_member returning coins_child into bal;
  else
    update membership set coins_adult = coins_adult + p_delta where id = p_member returning coins_adult into bal;
  end if;
  return bal;
end $$;

-- ============================================================
-- Task lifecycle (atomic; write ledger + audit + notifications)
-- ============================================================

-- Create on the board (open) or offered to a specific person.
create or replace function take_task(p_task uuid, p_member uuid)
returns void language plpgsql as $$
begin
  update task set assignee_id = p_member, status = 'accepted'
   where id = p_task and status = 'open';
  if not found then raise exception 'task % is not on the board', p_task; end if;
  insert into task_event (task_id, actor_id, action) values (p_task, p_member, 'taken');
end $$;

-- Accept a task offered to me
create or replace function accept_offer(p_task uuid, p_member uuid)
returns void language plpgsql as $$
begin
  update task set status = 'accepted'
   where id = p_task and status = 'offered' and assignee_id = p_member;
  if not found then raise exception 'no offer for % to accept', p_task; end if;
  insert into task_event (task_id, actor_id, action) values (p_task, p_member, 'accepted');
end $$;

-- Decline an offer -> goes to the board
create or replace function decline_offer(p_task uuid, p_member uuid)
returns void language plpgsql as $$
begin
  update task set status = 'open', assignee_id = null
   where id = p_task and status = 'offered' and assignee_id = p_member;
  if not found then raise exception 'no offer for % to decline', p_task; end if;
  insert into task_event (task_id, actor_id, action) values (p_task, p_member, 'declined');
end $$;

create or replace function submit_task(p_task uuid, p_member uuid)
returns void language plpgsql as $$
declare t task%rowtype;
begin
  update task set status = 'submitted', submitted_at = now()
   where id = p_task and status = 'accepted' returning * into t;
  if not found then raise exception 'task % cannot be submitted', p_task; end if;
  insert into task_event (task_id, actor_id, action) values (p_task, p_member, 'submitted');
  if t.created_by is not null and t.created_by <> p_member then
    insert into notification (household_id, recipient_id, type, title, task_id)
    values (t.household_id, t.created_by, 'task_submitted', 'Нужно одобрить: ' || t.title, t.id);
  end if;
end $$;

-- Only the creator approves; credits the task's currency.
create or replace function approve_task(p_task uuid, p_approver uuid)
returns void language plpgsql as $$
declare t task%rowtype; new_balance integer;
begin
  select * into t from task where id = p_task and status = 'submitted' for update;
  if not found then raise exception 'task % is not awaiting approval', p_task; end if;
  if t.created_by is not null and t.created_by <> p_approver then
    raise exception 'only the task creator can approve';
  end if;

  update task set status = 'approved', approved_at = now() where id = p_task;
  insert into task_event (task_id, actor_id, action) values (p_task, p_approver, 'approved');

  if t.reward > 0 and t.assignee_id is not null then
    new_balance := add_coins(t.assignee_id, t.cur, t.reward);
    insert into transaction (household_id, membership_id, type, cur, amount, title, task_id)
    values (t.household_id, t.assignee_id, 'earn', t.cur, t.reward, t.title, t.id);
    update goal set status = 'reached', reached_at = now()
      where membership_id = t.assignee_id and status = 'active' and cur = t.cur and target <= new_balance;
    insert into notification (household_id, recipient_id, type, title, task_id)
    values (t.household_id, t.assignee_id, 'task_approved', 'Одобрено: ' || t.title, t.id);
  end if;
end $$;

create or replace function reject_task(p_task uuid, p_approver uuid, p_note text default null)
returns void language plpgsql as $$
declare t task%rowtype;
begin
  update task set status = 'accepted', submitted_at = null
   where id = p_task and status = 'submitted' returning * into t;
  if not found then raise exception 'task % is not awaiting approval', p_task; end if;
  insert into task_event (task_id, actor_id, action, note) values (p_task, p_approver, 'rejected', p_note);
  if t.assignee_id is not null then
    insert into notification (household_id, recipient_id, type, title, body, task_id)
    values (t.household_id, t.assignee_id, 'task_rejected', 'Вернули на доработку: ' || t.title, p_note, t.id);
  end if;
end $$;

-- Redeem a reward: debit the matching-currency balance (CHECK blocks overspend).
create or replace function redeem_reward(p_member uuid, p_reward uuid)
returns void language plpgsql as $$
declare r reward_item%rowtype; m membership%rowtype;
begin
  select * into r from reward_item where id = p_reward and active;
  if not found then raise exception 'reward % not found', p_reward; end if;
  select * into m from membership where id = p_member for update;

  perform add_coins(p_member, r.cur, -r.cost);
  insert into transaction (household_id, membership_id, type, cur, amount, title, reward_id)
  values (m.household_id, p_member, 'spend', r.cur, r.cost, r.title, r.id);

  if r.owner_id is not null and r.owner_id <> p_member then
    insert into notification (household_id, recipient_id, type, title)
    values (m.household_id, r.owner_id, 'reward_redeemed', 'Получили награду: ' || r.title);
  end if;
end $$;

-- ============================================================
-- Reward requests: ask someone for a reward; they price it or decline.
-- ============================================================
create or replace function request_reward(p_household uuid, p_requester uuid, p_target uuid, p_title text, p_note text default null)
returns uuid language plpgsql as $$
declare rid uuid;
begin
  insert into reward_request (household_id, requester_id, target_id, title, note)
  values (p_household, p_requester, p_target, p_title, p_note) returning id into rid;
  insert into notification (household_id, recipient_id, type, title, body)
  values (p_household, p_target, 'reward_requested', 'Запрос награды: ' || p_title, p_note);
  return rid;
end $$;

-- Target approves & sets a price -> a real reward_item appears in the catalogue
create or replace function approve_reward_request(p_request uuid, p_approver uuid, p_cost integer)
returns void language plpgsql as $$
declare rq reward_request%rowtype; rid uuid; appr_role member_role;
begin
  select * into rq from reward_request where id = p_request and status = 'pending' for update;
  if not found then raise exception 'request % not pending', p_request; end if;
  if rq.target_id <> p_approver then raise exception 'only the asked person can approve'; end if;
  select role into appr_role from membership where id = p_approver;

  insert into reward_item (household_id, title, tag, cost, cur, owner_id)
  values (rq.household_id, rq.title, 'По запросу', p_cost, (case when appr_role = 'child' then 'child' else 'adult' end)::currency, p_approver)
  returning id into rid;

  update reward_request set status = 'approved', reward_id = rid, resolved_at = now() where id = p_request;
  insert into notification (household_id, recipient_id, type, title)
  values (rq.household_id, rq.requester_id, 'reward_request_resolved', 'Награда одобрена: ' || rq.title);
end $$;

create or replace function decline_reward_request(p_request uuid, p_approver uuid)
returns void language plpgsql as $$
declare rq reward_request%rowtype;
begin
  select * into rq from reward_request where id = p_request and status = 'pending' for update;
  if not found then raise exception 'request % not pending', p_request; end if;
  if rq.target_id <> p_approver then raise exception 'only the asked person can decline'; end if;
  update reward_request set status = 'declined', resolved_at = now() where id = p_request;
  insert into notification (household_id, recipient_id, type, title)
  values (rq.household_id, rq.requester_id, 'reward_request_resolved', 'Награда отклонена: ' || rq.title);
end $$;

-- ============================================================
-- Scheduler
-- ============================================================
create or replace function generate_due_tasks(p_today date default current_date)
returns integer language plpgsql as $$
declare n integer := 0; tpl task_template%rowtype; is_due boolean;
begin
  for tpl in select * from task_template where active and (last_run_on is null or last_run_on < p_today) loop
    is_due := case tpl.recurrence
                when 'daily'   then true
                when 'weekly'  then extract(dow from p_today)::smallint = any (tpl.weekdays)
                when 'monthly' then extract(day from p_today)::smallint = coalesce(tpl.day_of_month, 1)
                else false end;
    if is_due then
      insert into task (household_id, template_id, title, note, reward, cur, assignee_id, created_by, status, is_personal, due_at)
      values (tpl.household_id, tpl.id, tpl.title, tpl.note, tpl.reward, tpl.cur, tpl.default_assignee, tpl.created_by,
              (case when tpl.default_assignee is null then 'open' else 'offered' end)::task_status,
              tpl.is_personal,
              case when tpl.time_of_day is null then null else (p_today + tpl.time_of_day) end);
      update task_template set last_run_on = p_today where id = tpl.id;
      n := n + 1;
    end if;
  end loop;
  return n;
end $$;
