# Hearth — database

PostgreSQL schema for the Hearth family app. Works on Supabase, Neon, Railway, or local Postgres.

## Files
- `schema.sql` — tables, enums, constraints, indexes, transactional functions (the coin ledger + task lifecycle).
- `seed.sql` — demo family «Ивановы» with a consistent ledger (cached `coins` == sum of `transaction`).
- `rls.sql` — Row-Level Security policies (Supabase). Apply **after** `schema.sql`. Needs the `auth` schema (`auth.uid()`).

## Quick local check (Docker, no host port)
```bash
docker run -d --name hearth-pg -e POSTGRES_PASSWORD=hearth -e POSTGRES_DB=hearth postgres:16-alpine
docker cp db/schema.sql hearth-pg:/ && docker cp db/seed.sql hearth-pg:/
docker exec -i hearth-pg psql -U postgres -d hearth -f /schema.sql
docker exec -i hearth-pg psql -U postgres -d hearth -f /seed.sql
# integrity: cached coins must equal the ledger
docker exec -i hearth-pg psql -U postgres -d hearth -c \
 "select m.coins, coalesce(sum(case t.type when 'spend' then -t.amount else t.amount end),0) ledger \
  from membership m left join transaction t on t.membership_id=m.id group by m.id;"
docker rm -f hearth-pg
```
(Verified: schema+seed apply clean; approve_task credits coins, redeem_reward debits, overspend is blocked by `CHECK (coins >= 0)`, generate_due_tasks materialises recurring tasks idempotently.)

## Supabase
1. Create a project → SQL Editor.
2. Run `schema.sql`, then `rls.sql`. Load `seed.sql` only for a demo.
3. Make `app_user.id` match `auth.users.id` (insert an `app_user` row on signup, e.g. via a trigger on `auth.users`).
4. Schedule the recurring-task generator daily (Database → Cron / `pg_cron`):
   ```sql
   select cron.schedule('hearth-daily', '0 3 * * *', $$select generate_due_tasks()$$);
   ```
5. App: copy `app/.env.example` → `app/.env.local`, set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
   The data layer is in `app/src/data/api.ts` (+ realtime subscription helper).

## Coin integrity model
`transaction` is the append-only source of truth; `membership.coins` is a cached balance
updated **atomically** inside the SQL functions. `CHECK (coins >= 0)` makes overspending
impossible even under concurrent requests — the ACID guarantee that motivated choosing Postgres.
