-- ============================================================
-- Hearth — database schema (PostgreSQL)
-- Works as-is on Supabase, Neon, Railway, or self-hosted Postgres.
-- Coin balance integrity: the `transaction` table is the source of
-- truth (an append-only ledger). `membership.coins` is a cached
-- balance kept in sync atomically by the functions at the bottom.
-- ============================================================

create extension if not exists "pgcrypto";   -- for gen_random_uuid()

-- ---------- Enums ----------
create type member_role  as enum ('parent', 'child');
create type task_status  as enum ('open', 'accepted', 'submitted', 'approved', 'rejected');
create type txn_type     as enum ('earn', 'spend', 'adjust');
create type invite_status as enum ('pending', 'accepted', 'revoked');
create type recurrence   as enum ('once', 'daily', 'weekly', 'monthly');
create type goal_status   as enum ('active', 'reached', 'archived');
create type task_action  as enum ('created', 'assigned', 'taken', 'submitted', 'approved', 'rejected', 'reopened');

-- ---------- Accounts ----------
create table app_user (
  id            uuid primary key default gen_random_uuid(),
  email         text unique not null,
  display_name  text not null,
  avatar_color  text not null default '#d37b5b',
  password_hash text,                              -- bcrypt (pgcrypto); null if using external auth
  created_at    timestamptz not null default now()
);

-- ---------- Household (the "family") ----------
create table household (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  invite_code  text unique not null,
  created_by   uuid references app_user(id) on delete set null,
  created_at   timestamptz not null default now()
);

-- ---------- Membership: a user in a household, with a role + coin balance ----------
create table membership (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references household(id) on delete cascade,
  user_id       uuid not null references app_user(id) on delete cascade,
  role          member_role not null,
  is_admin      boolean not null default false,   -- parent-admin (manage home/members) vs regular parent
  coins         integer not null default 0 check (coins >= 0),   -- cached balance
  joined_at     timestamptz not null default now(),
  unique (household_id, user_id),
  check (not is_admin or role = 'parent')          -- only a parent can be admin
);
create index on membership (household_id);

-- ---------- Savings goals (a member can have several) ----------
create table goal (
  id            uuid primary key default gen_random_uuid(),
  membership_id uuid not null references membership(id) on delete cascade,
  title         text not null,
  emoji         text,
  target        integer not null check (target > 0),
  status        goal_status not null default 'active',
  created_at    timestamptz not null default now(),
  reached_at    timestamptz
);
create index on goal (membership_id, status);

-- ---------- Invites (model B: link/code per member) ----------
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

-- ---------- Reward catalogue ----------
create table reward_item (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references household(id) on delete cascade,
  title         text not null,
  description   text,
  tag           text,
  cost          integer not null check (cost > 0),
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);
create index on reward_item (household_id);

-- ---------- Recurring task templates (schedule) ----------
-- A scheduler materialises `task` rows from active templates (see generate_due_tasks()).
create table task_template (
  id              uuid primary key default gen_random_uuid(),
  household_id    uuid not null references household(id) on delete cascade,
  title           text not null,
  note            text,
  reward          integer not null default 0 check (reward >= 0),
  default_assignee uuid references membership(id) on delete set null,  -- null = post to board
  is_personal     boolean not null default false,
  recurrence      recurrence not null default 'weekly',
  weekdays        smallint[] not null default '{}',   -- 0=Sun..6=Sat, for weekly
  day_of_month    smallint check (day_of_month between 1 and 31),  -- for monthly
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
  template_id   uuid references task_template(id) on delete set null,  -- set if generated from a schedule
  title         text not null,
  note          text,
  reward        integer not null default 0 check (reward >= 0),
  assignee_id   uuid references membership(id) on delete set null,   -- null = on the board
  created_by    uuid references membership(id) on delete set null,
  status        task_status not null default 'open',
  is_personal   boolean not null default false,
  urgent        boolean not null default false,
  due_at        timestamptz,
  created_at    timestamptz not null default now(),
  submitted_at  timestamptz,
  approved_at   timestamptz
);
create index on task (household_id, status);
create index on task (assignee_id);
create index on task (template_id);

-- ---------- Coin ledger (append-only) ----------
create table transaction (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references household(id) on delete cascade,
  membership_id uuid not null references membership(id) on delete cascade,
  type          txn_type not null,
  amount        integer not null check (amount > 0),   -- always positive; sign implied by type
  title         text not null,
  task_id       uuid references task(id) on delete set null,
  reward_id     uuid references reward_item(id) on delete set null,
  created_at    timestamptz not null default now()
);
create index on transaction (membership_id, created_at desc);

-- ---------- Task lifecycle / approval log (audit trail) ----------
create table task_event (
  id            uuid primary key default gen_random_uuid(),
  task_id       uuid not null references task(id) on delete cascade,
  actor_id      uuid references membership(id) on delete set null,
  action        task_action not null,
  note          text,
  created_at    timestamptz not null default now()
);
create index on task_event (task_id, created_at);

-- ---------- Photo attachments (proof of a done task) ----------
create table task_attachment (
  id            uuid primary key default gen_random_uuid(),
  task_id       uuid not null references task(id) on delete cascade,
  uploaded_by   uuid references membership(id) on delete set null,
  url           text not null,            -- storage path / public url
  created_at    timestamptz not null default now()
);
create index on task_attachment (task_id);

-- ---------- Notifications / push ----------
create type notif_type as enum ('task_submitted', 'task_approved', 'task_rejected', 'reward_redeemed', 'member_joined', 'reminder');
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

-- Note: one user can belong to several households — the schema already supports it
-- via the membership join table (no unique constraint on user_id alone). The app
-- just scopes everything by the active membership/household.

-- ============================================================
-- Transactional logic — these keep ledger + cached balance consistent
-- and write the audit log. Each runs as a single atomic statement.
-- ============================================================

-- Child takes a board task
create or replace function take_task(p_task uuid, p_member uuid)
returns void language plpgsql as $$
begin
  update task set assignee_id = p_member, status = 'accepted'
   where id = p_task and status = 'open';
  if not found then raise exception 'task % is not available', p_task; end if;
  insert into task_event (task_id, actor_id, action) values (p_task, p_member, 'taken');
end $$;

-- Child marks a task done -> awaiting approval (+ notify parents)
create or replace function submit_task(p_task uuid, p_member uuid)
returns void language plpgsql as $$
declare t task%rowtype;
begin
  update task set status = 'submitted', submitted_at = now()
   where id = p_task and status = 'accepted' returning * into t;
  if not found then raise exception 'task % cannot be submitted', p_task; end if;
  insert into task_event (task_id, actor_id, action) values (p_task, p_member, 'submitted');
  insert into notification (household_id, recipient_id, type, title, task_id)
  select t.household_id, m.id, 'task_submitted', 'Нужно одобрить: ' || t.title, t.id
    from membership m where m.household_id = t.household_id and m.role = 'parent';
end $$;

-- Parent approves -> credit coins + ledger + audit + goals + notify child (all atomic)
create or replace function approve_task(p_task uuid, p_approver uuid)
returns void language plpgsql as $$
declare t task%rowtype; new_balance integer;
begin
  select * into t from task where id = p_task and status = 'submitted' for update;
  if not found then raise exception 'task % is not awaiting approval', p_task; end if;
  -- equality: only the creator of the (rewarded) task may approve it
  if t.created_by is not null and t.created_by <> p_approver then
    raise exception 'only the task creator can approve';
  end if;

  update task set status = 'approved', approved_at = now() where id = p_task;
  insert into task_event (task_id, actor_id, action) values (p_task, p_approver, 'approved');

  if t.reward > 0 and t.assignee_id is not null then
    update membership set coins = coins + t.reward
      where id = t.assignee_id returning coins into new_balance;
    insert into transaction (household_id, membership_id, type, amount, title, task_id)
    values (t.household_id, t.assignee_id, 'earn', t.reward, t.title, t.id);
    update goal set status = 'reached', reached_at = now()
      where membership_id = t.assignee_id and status = 'active' and target <= new_balance;
  end if;

  if t.assignee_id is not null then
    insert into notification (household_id, recipient_id, type, title, task_id)
    values (t.household_id, t.assignee_id, 'task_approved', 'Одобрено: ' || t.title, t.id);
  end if;
end $$;

-- Parent returns a submitted task for rework (+ notify child)
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

-- Child redeems a reward -> debit coins + ledger row + notify parents (CHECK blocks overspend)
create or replace function redeem_reward(p_member uuid, p_reward uuid)
returns void language plpgsql as $$
declare r reward_item%rowtype; m membership%rowtype;
begin
  select * into r from reward_item where id = p_reward and active;
  if not found then raise exception 'reward % not found', p_reward; end if;
  select * into m from membership where id = p_member for update;

  -- the coins >= 0 CHECK constraint guarantees no negative balance even on races
  update membership set coins = coins - r.cost where id = p_member;

  insert into transaction (household_id, membership_id, type, amount, title, reward_id)
  values (m.household_id, p_member, 'spend', r.cost, r.title, r.id);

  insert into notification (household_id, recipient_id, type, title)
  select m.household_id, p.id, 'reward_redeemed', 'Награда получена: ' || r.title
    from membership p where p.household_id = m.household_id and p.role = 'parent';
end $$;

-- Scheduler: materialise tasks from active templates that are due today.
-- Run once a day (Supabase: pg_cron; or a scheduled Edge Function / cron job):
--   select generate_due_tasks();
create or replace function generate_due_tasks(p_today date default current_date)
returns integer language plpgsql as $$
declare n integer := 0; tpl task_template%rowtype; is_due boolean;
begin
  for tpl in select * from task_template
             where active and (last_run_on is null or last_run_on < p_today) loop
    is_due := case tpl.recurrence
                when 'daily'   then true
                when 'weekly'  then extract(dow from p_today)::smallint = any (tpl.weekdays)
                when 'monthly' then extract(day from p_today)::smallint = coalesce(tpl.day_of_month, 1)
                else false
              end;
    if is_due then
      insert into task (household_id, template_id, title, note, reward, assignee_id, created_by, status, is_personal, due_at)
      values (tpl.household_id, tpl.id, tpl.title, tpl.note, tpl.reward, tpl.default_assignee, tpl.created_by,
              (case when tpl.default_assignee is null then 'open' else 'accepted' end)::task_status,
              tpl.is_personal,
              case when tpl.time_of_day is null then null else (p_today + tpl.time_of_day) end);
      update task_template set last_run_on = p_today where id = tpl.id;
      n := n + 1;
    end if;
  end loop;
  return n;
end $$;

-- Sanity check: cached balance must equal the ledger sum
-- select m.id, m.coins,
--   coalesce(sum(case t.type when 'spend' then -t.amount else t.amount end),0) as ledger
-- from membership m left join transaction t on t.membership_id = m.id group by m.id;
