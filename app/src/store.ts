import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api, setToken } from './lib/api'

export type Role = 'parent' | 'child'
export type Cur = 'child' | 'adult'
export type Member = { id: string; name: string; role: Role; is_admin: boolean; coins_adult: number; coins_child: number; avatar_color: string }
export type TaskStatus = 'open' | 'offered' | 'accepted' | 'submitted' | 'approved' | 'rejected'
export type Task = {
  id: string; title: string; note: string | null; place: string | null; reward: number; cur: Cur
  assignee_id: string | null; created_by: string | null; status: TaskStatus
  is_personal: boolean; urgent: boolean; due_at: string | null; room_id: string | null
}
export type Reward = { id: string; title: string; description: string | null; tag: string | null; cost: number; cur: Cur; owner_id: string | null }
export type Goal = { id: string; membership_id: string; title: string; emoji: string | null; target: number; cur: Cur; status: string }
export type Txn = { id: string; membership_id: string; title: string; amount: number; cur: Cur; type: 'earn' | 'spend' | 'adjust'; created_at: string }
export type Notif = { id: string; type: string; title: string; body: string | null; read_at: string | null; created_at: string }
export type RewardRequest = { id: string; requester_id: string; target_id: string; title: string; note: string | null; status: string; created_at: string }
export type Room = { id: string; name: string }
export type User = { uid: string; mid: string; hid: string; role: Role; name: string; avatar_color?: string }

type State = {
  token: string | null
  user: User | null
  members: Member[]; tasks: Task[]; rewards: Reward[]; goals: Goal[]; txns: Txn[]
  notifications: Notif[]; rewardRequests: RewardRequest[]; rooms: Room[]
  loading: boolean; error: string | null

  login: (email: string, password: string) => Promise<void>
  signup: (b: { name: string; email: string; password: string; householdName?: string; guardian?: string; theme?: string; avatar_color?: string }) => Promise<void>
  join: (b: { invite: string; name: string; email: string; password: string }) => Promise<void>
  logout: () => void
  loadAll: () => Promise<void>

  createTask: (b: Record<string, unknown>) => Promise<void>
  takeTask: (id: string) => Promise<void>
  acceptTask: (id: string) => Promise<void>
  declineTask: (id: string) => Promise<void>
  submitTask: (id: string) => Promise<void>
  approveTask: (id: string) => Promise<void>
  rejectTask: (id: string, note?: string) => Promise<void>
  redeem: (rewardId: string, member?: string) => Promise<void>
  createReward: (b: Record<string, unknown>) => Promise<void>
  requestReward: (b: { target_id: string; title: string; note?: string }) => Promise<void>
  approveRewardRequest: (id: string, cost: number) => Promise<void>
  declineRewardRequest: (id: string) => Promise<void>
}

const empty = { members: [], tasks: [], rewards: [], goals: [], txns: [], notifications: [], rewardRequests: [], rooms: [] }

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      token: null, user: null, ...empty, loading: false, error: null,

      login: async (email, password) => { const { token, user } = await api.login(email, password); setToken(token); set({ token, user, error: null }); await get().loadAll() },
      signup: async (b) => { const { token, user } = await api.signup(b); setToken(token); set({ token, user, error: null }); await get().loadAll() },
      join: async (b) => { const { token, user } = await api.join(b); setToken(token); set({ token, user, error: null }); await get().loadAll() },
      logout: () => { setToken(null); set({ token: null, user: null, ...empty }) },

      loadAll: async () => {
        if (!get().token) return
        set({ loading: true, error: null })
        try {
          const [members, tasks, rewards, goals, notifications, txns, rooms, rewardRequests] = await Promise.all([
            api.members(), api.tasks(), api.rewards(), api.goals(), api.notifications(), api.transactions(), api.rooms(), api.rewardRequests(),
          ])
          set({ members, tasks, rewards, goals, notifications, txns, rooms, rewardRequests, loading: false })
        } catch (e: any) { set({ error: String(e.message || e), loading: false }) }
      },

      createTask: async (b) => { await api.createTask(b); await get().loadAll() },
      takeTask: async (id) => { await api.takeTask(id); await get().loadAll() },
      acceptTask: async (id) => { await api.acceptTask(id); await get().loadAll() },
      declineTask: async (id) => { await api.declineTask(id); await get().loadAll() },
      submitTask: async (id) => { await api.submitTask(id); await get().loadAll() },
      approveTask: async (id) => { await api.approveTask(id); await get().loadAll() },
      rejectTask: async (id, note) => { await api.rejectTask(id, note); await get().loadAll() },
      redeem: async (rewardId, member) => { await api.redeem(rewardId, member); await get().loadAll() },
      createReward: async (b) => { await api.createReward(b); await get().loadAll() },
      requestReward: async (b) => { await api.requestReward(b); await get().loadAll() },
      approveRewardRequest: async (id, cost) => { await api.approveRewardRequest(id, cost); await get().loadAll() },
      declineRewardRequest: async (id) => { await api.declineRewardRequest(id); await get().loadAll() },
    }),
    {
      name: 'hearth-auth',
      partialize: (s) => ({ token: s.token, user: s.user }),
      onRehydrateStorage: () => (state) => { if (state?.token) { setToken(state.token); state.loadAll() } },
    },
  ),
)

export const memberName = (members: Member[], id: string | null) => members.find((m) => m.id === id)?.name ?? '—'
export const findMember = (members: Member[], id: string | null) => members.find((m) => m.id === id)
