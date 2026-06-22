# Hearth 🔥

Семейное приложение для дел по дому: задачи, награды-монеты и забота — в одном тёплом месте.
**Равные права:** любой участник создаёт задачи и выполняет их; одобряет выполнение тот, кто задачу создал (и дал награду).

## Стек
- **Фронт:** React + Vite + TypeScript, Zustand, React Router, дизайн-система `hearth.css`, иконки lucide.
- **Бэкенд:** Fastify + TypeScript, JWT-авторизация.
- **БД:** PostgreSQL (в Docker). Целостность монет — атомарные SQL-функции + леджер (`transaction`).

## Структура
```
app/        — веб-приложение (React)
server/     — API (Fastify) поверх Postgres
db/         — schema.sql, seed.sql, rls.sql (Supabase, опц.), README
cozy_house/ — DESIGN.md (дизайн-система) + assets/ (черновики маскота)
assets/     — общий hearth.css
docker-compose.yml — локальная Postgres
*/code.html — исходные HTML-макеты экранов (история итераций)
```

## Запуск (3 процесса)
```bash
# 1) база данных
HEARTH_DB_PORT=51291 docker compose up -d
# 2) API
cd server && npm install && PORT=51300 npm run dev
# 3) фронт
cd app && npm install && npm run dev
```
Открыть фронт по адресу из вывода Vite. Демо-входы: `mama@hearth.app` (и `papa@`, `sasha@`, `kira@`), пароль `hearth123`.

## Что внутри
- Онбординг: регистрация → аватар → создать дом → пригласить (по коду); вход и присоединение по коду.
- Единое приложение: Главная · Задачи · ＋Новая · Награды · Кошелёк + детали задачи, уведомления, профиль/настройки.
- Ежедневный цикл: создать → взять/выполнить → одобрить (создатель) → монеты → потратить.

Подробности БД — в [`db/README.md`](db/README.md), API — в [`server/README.md`](server/README.md), дизайн — в [`cozy_house/DESIGN.md`](cozy_house/DESIGN.md).
