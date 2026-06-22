import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from './Icon'

export function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark">
        <Icon name="local_fire_department" size={20} fill />
      </span>
      Hearth
    </div>
  )
}

export function TopBar({
  title,
  back,
  brand,
  right,
}: {
  title?: string
  back?: boolean
  brand?: boolean
  right?: ReactNode
}) {
  const nav = useNavigate()
  return (
    <header className="topbar">
      {back ? (
        <button className="icon-btn" aria-label="Назад" onClick={() => nav(-1)}>
          <Icon name="arrow_back" />
        </button>
      ) : brand ? (
        <Brand />
      ) : (
        <span style={{ width: 38 }} />
      )}
      {title && <span className="title">{title}</span>}
      {right ?? <span style={{ width: 38 }} />}
    </header>
  )
}
