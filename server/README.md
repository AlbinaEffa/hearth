# Hearth — backend (own API)

Fastify + TypeScript API in front of the local Postgres (`hearth-db` in Docker). No Supabase.

## Run
```bash
# 1) DB must be up (from repo root):  HEARTH_DB_PORT=51291 docker compose up -d
# 2) start the API:
cd server
npm install
PORT=51300 DATABASE_URL=postgresql://hearth:hearth@localhost:51291/hearth npm run dev
```
`npm run dev` uses `tsx watch` (auto-reload). Default port 51300, DB url defaults to the compose one.

## Auth
JWT (Bearer). Demo accounts (seed): `mama@hearth.app` / `papa@…` / `sasha@…` / `kira@…`, password **`hearth123`**.

## Endpoints
| Method | Path | Notes |
|---|---|---|
| POST | `/auth/signup` | name,email,password,householdName → creates user+home+admin membership, returns token |
| POST | `/auth/login` | email,password → token |
| POST | `/auth/join` | invite,name,email,password → join existing home |
| GET | `/me` | token payload |
| GET | `/members` `/tasks` `/rewards` `/goals` `/transactions?member=` `/notifications` | household-scoped |
| POST | `/tasks` | create |
| POST | `/tasks/:id/take` `/submit` `/approve` `/reject` | call the atomic SQL functions |
| POST | `/rewards/:id/redeem` | debits coins (overspend blocked by DB) |

All reads/writes are scoped to the household in the JWT — families are isolated.
Coin changes go through the DB functions (`approve_task`, `redeem_reward`), so balances stay consistent.
