// Fetch client for our own Hearth backend (server/, Fastify + Postgres).
const BASE = (import.meta.env.VITE_API_URL as string) || 'http://127.0.0.1:51300'

let token: string | null = null
export function setToken(t: string | null) { token = t }

async function req(path: string, opts: RequestInit = {}) {
  const res = await fetch(BASE + path, {
    ...opts,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: 'Bearer ' + token } : {}),
      ...(opts.headers || {}),
    },
  })
  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    throw new Error((e as any).error || res.statusText)
  }
  return res.status === 204 ? null : res.json()
}

const post = (p: string, body?: unknown) => req(p, { method: 'POST', body: body ? JSON.stringify(body) : undefined })

export const api = {
  login: (email: string, password: string) => post('/auth/login', { email, password }),
  signup: (b: { name: string; email: string; password: string; householdName?: string }) => post('/auth/signup', b),
  join: (b: { invite: string; name: string; email: string; password: string }) => post('/auth/join', b),

  members: () => req('/members'),
  tasks: () => req('/tasks'),
  rewards: () => req('/rewards'),
  goals: () => req('/goals'),
  transactions: (member?: string) => req('/transactions' + (member ? `?member=${member}` : '')),
  notifications: () => req('/notifications'),

  createTask: (b: Record<string, unknown>) => post('/tasks', b),
  takeTask: (id: string) => post(`/tasks/${id}/take`),
  submitTask: (id: string) => post(`/tasks/${id}/submit`),
  approveTask: (id: string) => post(`/tasks/${id}/approve`),
  rejectTask: (id: string, note?: string) => post(`/tasks/${id}/reject`, { note }),
  redeem: (rewardId: string, member?: string) => post(`/rewards/${rewardId}/redeem`, { member }),
}
