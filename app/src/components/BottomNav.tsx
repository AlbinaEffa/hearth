import { NavLink, useNavigate } from 'react-router-dom'
import { Icon } from './Icon'

type Item = { to: string; icon: string; label: string }

// One nav for everyone — equal rights, no role split.
const ITEMS: Item[] = [
  { to: '/home', icon: 'home', label: 'Главная' },
  { to: '/tasks', icon: 'assignment', label: 'Задачи' },
  { to: '/rewards', icon: 'redeem', label: 'Награды' },
  { to: '/wallet', icon: 'savings', label: 'Кошелёк' },
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
      <NavItem item={ITEMS[0]} />
      <NavItem item={ITEMS[1]} />
      <button className="fab" aria-label="Новая задача" onClick={() => nav('/new-task')}>
        <Icon name="add" size={28} />
      </button>
      <NavItem item={ITEMS[2]} />
      <NavItem item={ITEMS[3]} />
    </nav>
  )
}
