import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import pg from 'pg'

const { Pool } = pg
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://hearth:hearth@localhost:51291/hearth',
})
const q = (sql: string, params: unknown[] = []) => pool.query(sql, params)

const app = Fastify({ logger: false })
await app.register(cors, { origin: true })
await app.register(jwt, { secret: process.env.JWT_SECRET || 'dev-secret-change-me' })

// auth guard
app.decorate('auth', async (req: any, reply: any) => {
  try { await req.jwtVerify() } catch { reply.code(401).send({ error: 'unauthorized' }) }
})
const A = { preHandler: (app as any).auth }

const code = () => 'HRT-' + Math.random().toString(36).slice(2, 7).toUpperCase()
const sign = (u: any) => app.jwt.sign({ uid: u.uid, mid: u.mid, hid: u.hid, role: u.role, name: u.name })

// ---------- Auth ----------
app.post('/auth/signup', async (req: any, reply) => {
  const { name, email, password, householdName, guardian = 'cottage', theme = 'hearth', avatar_color } = req.body || {}
  if (!name || !email || !password) return reply.code(400).send({ error: 'name, email, password required' })
  const c = await pool.connect()
  try {
    await c.query('begin')
    const u = await c.query(
      `insert into app_user (email, display_name, password_hash, avatar_color)
       values ($1,$2, crypt($3, gen_salt('bf')), coalesce($4, '#d37b5b')) returning id, display_name, avatar_color`,
      [email, name, password, avatar_color || null],
    )
    const h = await c.query(`insert into household (name, invite_code, guardian, theme, created_by) values ($1,$2,$3,$4,$5) returning id`,
      [householdName || `Семья ${name}`, code(), guardian, theme, u.rows[0].id])
    const m = await c.query(
      `insert into membership (household_id, user_id, role, is_admin) values ($1,$2,'parent',true) returning id`,
      [h.rows[0].id, u.rows[0].id])
    await c.query('commit')
    const payload = { uid: u.rows[0].id, mid: m.rows[0].id, hid: h.rows[0].id, role: 'parent', name }
    return { token: sign(payload), user: { ...payload, avatar_color: u.rows[0].avatar_color } }
  } catch (e: any) {
    await c.query('rollback')
    if (e.code === '23505') return reply.code(409).send({ error: 'email already used' })
    return reply.code(500).send({ error: String(e.message || e) })
  } finally { c.release() }
})

app.post('/auth/login', async (req: any, reply) => {
  const { email, password } = req.body || {}
  const u = await q(
    `select id, display_name, avatar_color from app_user
     where email = $1 and password_hash = crypt($2, password_hash)`, [email, password])
  if (!u.rowCount) return reply.code(401).send({ error: 'invalid credentials' })
  const m = await q(
    `select id, household_id, role from membership where user_id = $1 order by joined_at limit 1`, [u.rows[0].id])
  if (!m.rowCount) return reply.code(403).send({ error: 'no household' })
  const payload = { uid: u.rows[0].id, mid: m.rows[0].id, hid: m.rows[0].household_id, role: m.rows[0].role, name: u.rows[0].display_name }
  return { token: sign(payload), user: { ...payload, avatar_color: u.rows[0].avatar_color } }
})

app.post('/auth/join', async (req: any, reply) => {
  const { invite, name, email, password } = req.body || {}
  const inv = await q(`select id, household_id, role from invite where code = $1 and status = 'pending'`, [invite])
  if (!inv.rowCount) return reply.code(404).send({ error: 'invite not found' })
  const c = await pool.connect()
  try {
    await c.query('begin')
    const u = await c.query(
      `insert into app_user (email, display_name, password_hash) values ($1,$2, crypt($3, gen_salt('bf'))) returning id, avatar_color`,
      [email, name, password])
    const m = await c.query(`insert into membership (household_id, user_id, role) values ($1,$2,$3) returning id`,
      [inv.rows[0].household_id, u.rows[0].id, inv.rows[0].role])
    await c.query(`update invite set status='accepted', accepted_by=$1 where id=$2`, [m.rows[0].id, inv.rows[0].id])
    await c.query('commit')
    const payload = { uid: u.rows[0].id, mid: m.rows[0].id, hid: inv.rows[0].household_id, role: inv.rows[0].role, name }
    return { token: sign(payload), user: { ...payload, avatar_color: u.rows[0].avatar_color } }
  } catch (e: any) {
    await c.query('rollback'); return reply.code(500).send({ error: String(e.message || e) })
  } finally { c.release() }
})

app.get('/me', A, async (req: any) => req.user)

// ---------- Reads (scoped to the token's household) ----------
app.get('/members', A, async (req: any) =>
  (await q(`select m.id, m.role, m.is_admin, m.coins_adult, m.coins_child, u.display_name as name, u.avatar_color
            from membership m join app_user u on u.id = m.user_id where m.household_id = $1
            order by m.role, u.display_name`, [req.user.hid])).rows)

app.get('/rooms', A, async (req: any) =>
  (await q(`select * from room where household_id = $1 order by name`, [req.user.hid])).rows)

app.get('/reward-requests', A, async (req: any) =>
  (await q(`select * from reward_request where household_id = $1 order by created_at desc`, [req.user.hid])).rows)

app.get('/tasks', A, async (req: any) =>
  (await q(`select * from task where household_id = $1 order by created_at desc`, [req.user.hid])).rows)

app.get('/rewards', A, async (req: any) =>
  (await q(`select * from reward_item where household_id = $1 and active order by cost`, [req.user.hid])).rows)

app.get('/goals', A, async (req: any) =>
  (await q(`select g.* from goal g join membership m on m.id = g.membership_id
            where m.household_id = $1`, [req.user.hid])).rows)

app.get('/transactions', A, async (req: any) => {
  const mid = (req.query?.member as string) || req.user.mid
  return (await q(`select * from transaction where membership_id = $1 order by created_at desc limit 50`, [mid])).rows
})

app.get('/notifications', A, async (req: any) =>
  (await q(`select * from notification where recipient_id = $1 order by created_at desc limit 50`, [req.user.mid])).rows)

// ---------- Mutations ----------
app.post('/tasks', A, async (req: any, reply) => {
  const { title, reward = 0, assignee_id = null, is_personal = false, due_at = null, urgent = false, place = null, room_id = null } = req.body || {}
  if (!title) return reply.code(400).send({ error: 'title required' })
  const cur = req.user.role === 'child' ? 'child' : 'adult'
  // self/personal -> accepted; offered to someone else -> offered; board -> open
  const status = (is_personal || assignee_id === req.user.mid) ? 'accepted' : assignee_id ? 'offered' : 'open'
  const r = await q(
    `insert into task (household_id, title, reward, cur, assignee_id, created_by, status, is_personal, urgent, due_at, place, room_id)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) returning *`,
    [req.user.hid, title, reward, cur, assignee_id, req.user.mid, status, is_personal, urgent, due_at, place, room_id])
  if (status === 'offered' && assignee_id) {
    await q(`insert into notification (household_id, recipient_id, type, title, task_id) values ($1,$2,'task_offered',$3,$4)`,
      [req.user.hid, assignee_id, 'Тебе предложена задача: ' + title, r.rows[0].id])
  }
  return r.rows[0]
})

// Create a reward (anyone; owner = me, currency = my role)
app.post('/rewards', A, async (req: any, reply) => {
  const { title, description = null, tag = null, cost } = req.body || {}
  if (!title || !cost) return reply.code(400).send({ error: 'title and cost required' })
  const cur = req.user.role === 'child' ? 'child' : 'adult'
  const r = await q(`insert into reward_item (household_id, title, description, tag, cost, cur, owner_id) values ($1,$2,$3,$4,$5,$6,$7) returning *`,
    [req.user.hid, title, description, tag, cost, cur, req.user.mid])
  return r.rows[0]
})

const rpc = (fn: string, params: unknown[]) => q(`select ${fn}`, params)
app.post('/tasks/:id/take', A, async (req: any) => { await rpc('take_task($1,$2)', [req.params.id, req.user.mid]); return { ok: true } })
app.post('/tasks/:id/accept', A, async (req: any) => { await rpc('accept_offer($1,$2)', [req.params.id, req.user.mid]); return { ok: true } })
app.post('/tasks/:id/decline', A, async (req: any) => { await rpc('decline_offer($1,$2)', [req.params.id, req.user.mid]); return { ok: true } })
app.post('/tasks/:id/submit', A, async (req: any) => { await rpc('submit_task($1,$2)', [req.params.id, req.user.mid]); return { ok: true } })
app.post('/tasks/:id/approve', A, async (req: any) => { await rpc('approve_task($1,$2)', [req.params.id, req.user.mid]); return { ok: true } })
app.post('/tasks/:id/reject', A, async (req: any) => { await rpc('reject_task($1,$2,$3)', [req.params.id, req.user.mid, req.body?.note ?? null]); return { ok: true } })
app.post('/rewards/:id/redeem', A, async (req: any, reply) => {
  const member = req.body?.member || req.user.mid
  try { await rpc('redeem_reward($1,$2)', [member, req.params.id]); return { ok: true } }
  catch (e: any) {
    if (String(e.message).includes('coins_')) return reply.code(400).send({ error: 'not enough coins' })
    return reply.code(500).send({ error: String(e.message || e) })
  }
})

// Reward requests: ask someone for a reward; they price it or decline
app.post('/reward-requests', A, async (req: any, reply) => {
  const { target_id, title, note = null } = req.body || {}
  if (!target_id || !title) return reply.code(400).send({ error: 'target_id and title required' })
  await rpc('request_reward($1,$2,$3,$4,$5)', [req.user.hid, req.user.mid, target_id, title, note])
  return { ok: true }
})
app.post('/reward-requests/:id/approve', A, async (req: any, reply) => {
  const { cost } = req.body || {}
  if (!cost) return reply.code(400).send({ error: 'cost required' })
  try { await rpc('approve_reward_request($1,$2,$3)', [req.params.id, req.user.mid, cost]); return { ok: true } }
  catch (e: any) { return reply.code(400).send({ error: String(e.message || e) }) }
})
app.post('/reward-requests/:id/decline', A, async (req: any, reply) => {
  try { await rpc('decline_reward_request($1,$2)', [req.params.id, req.user.mid]); return { ok: true } }
  catch (e: any) { return reply.code(400).send({ error: String(e.message || e) }) }
})

const port = Number(process.env.PORT) || 51300
app.listen({ port, host: '127.0.0.1' }).then(() => console.log(`hearth-server on http://127.0.0.1:${port}`))
