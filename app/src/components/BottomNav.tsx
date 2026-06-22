import { NavLink, useNavigate } from 'react-router-dom'
import { Icon } from './Icon'

type Item = { to: string; icon: string; label: string }

// One nav for everyone. Wallet lives in Profile.
const LEFT: Item[] = [
  { to: '/home', icon: 'home', label: 'Главная' },
  { to: '/tasks', icon: 'assignment', label: 'Задачи' },
]
const RIGHT: Item[] = [
  { to: '/week', icon: 'calendar_month', label: 'Неделя' },
  { to: '/rewards', icon: 'redeem', label: 'Магазин' },
]

function NavItem({ item }: { item: Item }) {
  return (
    <NavLink to={item.to} className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')} end>
      <Icon name={item.icon} />
      {item.label}
    </NavLink>
  )
}

export function BottomNav() {
  const nav = useNavigate()
  return (
    <nav className="bottom-nav">
      {LEFT.map((i) => <NavItem key={i.to} item={i} />)}
      <button className="fab" aria-label="Новая задача" onClick={() => nav('/new-task')}>
        <Icon name="add" size={28} />
      </button>
      {RIGHT.map((i) => <NavItem key={i.to} item={i} />)}
    </nav>
  )
}
