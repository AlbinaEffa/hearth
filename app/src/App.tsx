import type { ReactNode } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useStore } from './store'
import { Welcome, SignUp, SetupProfile, CreateHome, Invite, Login, Join } from './screens/Onboarding'
import {
  Home, Tasks, TaskDetails, NewTask, Week, Rewards, Wallet,
  Notifications, Profile, EditProfile, Settings,
} from './screens/Adult'

function Protected({ children }: { children: ReactNode }) {
  const token = useStore((s) => s.token)
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <div className="app-shell">
      <Routes>
        {/* Public — entry & onboarding */}
        <Route path="/" element={<Welcome />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/setup-profile" element={<SetupProfile />} />
        <Route path="/create-home" element={<CreateHome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/join" element={<Join />} />

        {/* Protected — same app for everyone (equal rights) */}
        <Route path="/invite" element={<Protected><Invite /></Protected>} />
        <Route path="/home" element={<Protected><Home /></Protected>} />
        <Route path="/tasks" element={<Protected><Tasks /></Protected>} />
        <Route path="/tasks/:id" element={<Protected><TaskDetails /></Protected>} />
        <Route path="/new-task" element={<Protected><NewTask /></Protected>} />
        <Route path="/week" element={<Protected><Week /></Protected>} />
        <Route path="/rewards" element={<Protected><Rewards /></Protected>} />
        <Route path="/wallet" element={<Protected><Wallet /></Protected>} />
        <Route path="/notifications" element={<Protected><Notifications /></Protected>} />
        <Route path="/profile" element={<Protected><Profile /></Protected>} />
        <Route path="/edit-profile" element={<Protected><EditProfile /></Protected>} />
        <Route path="/settings" element={<Protected><Settings /></Protected>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
