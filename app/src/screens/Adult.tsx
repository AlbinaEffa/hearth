import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { Brand } from '../components/TopBar'
import { BottomNav } from '../components/BottomNav'
import { Coin } from '../components/Coin'
import { useStore, memberName } from '../store'

function useMe() {
  return useStore((s) => s.members.find((m) => m.id === s.user?.mid))
}
function AppTopBar({ right }: { right?: React.ReactNode }) {
  const me = useMe()
  return (
    <header className="topbar">
      <Brand />
      {right ?? (
        <div className="row" style={{ gap: 6 }}>
          <Link to="/notifications" className="icon-btn" aria-label="Уведомления"><Icon name="notifications" size={22} /><span className="dot" /></Link>
          <Link to="/profile" className="avatar" style={{ width: 34, height: 34, background: me?.avatar_color ?? 'var(--primary-soft)', fontSize: 14, textDecoration: 'none' }}>{me?.name?.[0] ?? '·'}</Link>
        </div>
      )}
    </header>
  )
}
function StatusChip({ status }: { status: string }) {
  if (status === 'submitted') return <span className="chip chip-honey" style={{ fontSize: 10 }}>На одобрении</span>
  if (status === 'accepted') return <span className="chip chip-sage" style={{ fontSize: 10 }}>В работе</span>
  if (status === 'approved') return <span className="chip chip-primary" style={{ fontSize: 10 }}>Готово</span>
  return <span className="chip" style={{ fontSize: 10 }}>Свободна</span>
}
function fmtDue(ts: string | null) {
  if (!ts) return ''
  const d = new Date(ts)
  return isNaN(d.getTime()) ? ts : d.toLocaleString('ru', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}
function fmt(ts: string) {
  try { return new Date(ts).toLocaleString('ru', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) } catch { return ts }
}

/* ---------------- Home ---------------- */
export function Home() {
  const uid = useStore((s) => s.user?.mid)
  const me = useMe()
  const members = useStore((s) => s.members)
  const tasks = useStore((s) => s.tasks)
  const approve = useStore((s) => s.approveTask)
  const reject = useStore((s) => s.rejectTask)
  const submit = useStore((s) => s.submitTask)

  const myApprovals = tasks.filter((t) => t.created_by === uid && t.status === 'submitted')
  const myTasks = tasks.filter((t) => t.assignee_id === uid && t.status !== 'approved' && !t.is_personal)

  return (
    <>
      <AppTopBar />
      <main className="screen page">
        <section>
          <h1 className="h1">Привет, {me?.name ?? ''}! 👋</h1>
          <span className="chip chip-honey" style={{ marginTop: 8 }}><Icon name="paid" size={16} />{me?.coins ?? 0} монет · {myTasks.length} дел в работе</span>
        </section>

        {myApprovals.length > 0 && (
          <section className="card" style={{ background: '#fff8f5', borderColor: 'var(--primary-container)' }}>
            <div className="between" style={{ marginBottom: 12 }}>
              <span className="row" style={{ gap: 8, color: 'var(--primary)', fontWeight: 700, fontSize: 14 }}><Icon name="pending_actions" size={18} />Ждут вашего одобрения</span>
              <span className="count-badge">{myApprovals.length}</span>
            </div>
            {myApprovals.map((t) => (
              <div key={t.id} className="card tight" style={{ marginBottom: 8, boxShadow: 'none' }}>
                <div className="between">
                  <div><p className="title" style={{ fontSize: 14 }}>{t.title}</p><p className="caption">{memberName(members, t.assignee_id)} · +{t.reward} монет</p></div>
                  <div className="row" style={{ gap: 6 }}>
                    <button className="btn btn-primary btn-sm" style={{ height: 34, padding: '0 12px' }} onClick={() => approve(t.id)}>✓</button>
                    <button className="btn btn-secondary btn-sm" style={{ height: 34, padding: '0 12px' }} onClick={() => reject(t.id)}>✗</button>
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

        <section>
          <div className="between" style={{ marginBottom: 12 }}>
            <h2 className="h3">Мои дела сегодня</h2>
            <Link to="/tasks" className="link-arrow">Все →</Link>
          </div>
          {myTasks.length === 0 && <div className="card flat" style={{ textAlign: 'center', background: 'var(--surface-2)', border: 'none' }}><p className="caption">Дел нет. Возьмите задание на Доске или создайте ＋.</p></div>}
          {myTasks.map((t) => (
            <div key={t.id} className={'card tight ' + (t.status === 'accepted' ? 'accent-reward' : '')}
              style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', ...(t.status === 'submitted' ? { background: 'var(--reward-container)', borderColor: '#eccf86' } : {}) }}>
              <Link to={'/tasks/' + t.id} style={{ textDecoration: 'none', flex: 1 }}>
                <div className="row" style={{ gap: 6, marginBottom: 4 }}><StatusChip status={t.status} />{t.due_at && <span className="caption" style={{ color: t.urgent ? 'var(--error)' : 'var(--text-3)' }}>{t.urgent ? '⚠ ' : ''}{fmtDue(t.due_at)}</span>}</div>
                <p className="title" style={{ fontSize: 14 }}>{t.title}</p>
              </Link>
              <div className="stack" style={{ alignItems: 'flex-end', gap: 6 }}>
                {t.reward > 0 && <Coin value={t.reward} />}
                {t.status === 'accepted'
                  ? <button className="btn btn-primary btn-sm" style={{ height: 30, padding: '0 12px' }} onClick={() => submit(t.id)}>Готово</button>
                  : <Icon name="hourglass_top" color="var(--reward)" size={22} />}
              </div>
            </div>
          ))}
        </section>

        <section>
          <h2 className="h3" style={{ marginBottom: 12 }}>Семья</h2>
          <div className="hscroll">
            {members.map((m) => (
              <div key={m.id} className="card tight" style={{ minWidth: 100, textAlign: 'center', flexShrink: 0 }}>
                <div className="avatar" style={{ width: 40, height: 40, background: m.avatar_color, margin: '0 auto 6px', fontSize: 16 }}>{m.name[0]}</div>
                <p className="title" style={{ fontSize: 12 }}>{m.name}</p>
                <p className="caption" style={{ color: 'var(--reward)', fontWeight: 700 }}>{m.coins} монет</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <BottomNav />
    </>
  )
}

/* ---------------- Tasks ---------------- */
export function Tasks() {
  const uid = useStore((s) => s.user?.mid)
  const members = useStore((s) => s.members)
  const tasks = useStore((s) => s.tasks)
  const approve = useStore((s) => s.approveTask)
  const reject = useStore((s) => s.rejectTask)
  const submit = useStore((s) => s.submitTask)
  const take = useStore((s) => s.takeTask)

  const myApprovals = tasks.filter((t) => t.created_by === uid && t.status === 'submitted')
  const mine = tasks.filter((t) => t.assignee_id === uid && (t.status === 'accepted' || t.status === 'submitted') && !t.is_personal)
  const board = tasks.filter((t) => t.status === 'open')
  const others = tasks.filter((t) => t.assignee_id && t.assignee_id !== uid && (t.status === 'accepted' || t.status === 'submitted') && !t.is_personal)
  const personal = tasks.filter((t) => t.is_personal && t.assignee_id === uid)
  const done = tasks.filter((t) => t.status === 'approved' && !t.is_personal)

  return (
    <>
      <AppTopBar />
      <main className="screen page" style={{ gap: 10 }}>
        <h1 className="h1" style={{ marginBottom: 4 }}>Задачи</h1>

        {myApprovals.length > 0 && <>
          <div className="row" style={{ gap: 8 }}><p className="section-label">Ждут вашего одобрения</p><span className="count-badge">{myApprovals.length}</span></div>
          {myApprovals.map((t) => (
            <div key={t.id} className="card tight accent-reward">
              <div className="between" style={{ marginBottom: 10 }}>
                <div><p className="title" style={{ fontSize: 14 }}>{t.title}</p><p className="caption">{memberName(members, t.assignee_id)} · выполнил(а)</p></div>
                <Coin value={t.reward} />
              </div>
              <div className="row" style={{ gap: 8 }}>
                <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => approve(t.id)}>✓ Одобрить</button>
                <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => reject(t.id)}>✗ Вернуть</button>
              </div>
            </div>
          ))}
        </>}

        {mine.length > 0 && <>
          <p className="section-label" style={{ marginTop: 8 }}>Мои дела</p>
          {mine.map((t) => (
            <div key={t.id} className="card tight accent-reward" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Link to={'/tasks/' + t.id} style={{ textDecoration: 'none', flex: 1 }}>
                <div className="row" style={{ gap: 6, marginBottom: 5 }}><StatusChip status={t.status} />{t.due_at && <span className="caption">{fmtDue(t.due_at)}</span>}</div>
                <p className="title" style={{ fontSize: 14 }}>{t.title}</p>
              </Link>
              {t.status === 'accepted' ? <button className="btn btn-primary btn-sm" style={{ height: 32 }} onClick={() => submit(t.id)}>Готово</button> : <Icon name="hourglass_top" color="var(--reward)" />}
            </div>
          ))}
        </>}

        {board.length > 0 && <>
          <p className="section-label" style={{ marginTop: 8 }}>Свободные (Доска)</p>
          {board.map((t) => (
            <div key={t.id} className="card tight accent-reward" style={{ borderStyle: 'dashed', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Link to={'/tasks/' + t.id} style={{ textDecoration: 'none', flex: 1 }}><p className="title" style={{ fontSize: 14 }}>{t.title}</p><p className="caption">создал(а): {memberName(members, t.created_by)}</p></Link>
              <div className="stack" style={{ alignItems: 'flex-end', gap: 6 }}>{t.reward > 0 && <Coin value={t.reward} />}<button className="btn btn-primary btn-sm" style={{ height: 30, padding: '0 12px' }} onClick={() => take(t.id)}>Беру!</button></div>
            </div>
          ))}
        </>}

        {others.length > 0 && <>
          <p className="section-label" style={{ marginTop: 8 }}>Задачи семьи</p>
          {others.map((t) => (
            <Link to={'/tasks/' + t.id} key={t.id} className="card tight" style={{ borderLeft: '3px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textDecoration: 'none' }}>
              <div><div className="row" style={{ gap: 6, marginBottom: 5 }}><StatusChip status={t.status} /><span className="caption">{memberName(members, t.assignee_id)}</span></div><p className="title" style={{ fontSize: 14 }}>{t.title}</p></div>
              <Icon name="chevron_right" color="var(--text-3)" />
            </Link>
          ))}
        </>}

        {personal.length > 0 && <>
          <p className="section-label" style={{ marginTop: 8 }}>Личные</p>
          {personal.map((t) => (
            <div key={t.id} className="card tight accent-personal" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p className="title" style={{ fontSize: 14 }}>{t.title}</p>
              {t.status === 'accepted' ? <button className="btn btn-secondary btn-sm" style={{ height: 30 }} onClick={() => submit(t.id)}>Готово</button> : <Icon name="hourglass_top" color="var(--text-3)" />}
            </div>
          ))}
        </>}

        {done.length > 0 && <>
          <p className="section-label" style={{ marginTop: 8 }}>Выполненные</p>
          {done.slice(0, 8).map((t) => (
            <div key={t.id} className="card tight" style={{ opacity: .65, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '3px solid var(--sage)' }}>
              <div><p className="title" style={{ fontSize: 14, textDecoration: 'line-through', color: 'var(--text-2)' }}>{t.title}</p><p className="caption">{memberName(members, t.assignee_id)} · +{t.reward} монет</p></div>
              <Icon name="check_circle" color="var(--sage)" />
            </div>
          ))}
        </>}
      </main>
      <BottomNav />
    </>
  )
}

/* ---------------- Task details ---------------- */
export function TaskDetails() {
  const nav = useNavigate()
  const { id } = useParams()
  const uid = useStore((s) => s.user?.mid)
  const members = useStore((s) => s.members)
  const task = useStore((s) => s.tasks.find((t) => t.id === id))
  const approve = useStore((s) => s.approveTask)
  const reject = useStore((s) => s.rejectTask)
  const submit = useStore((s) => s.submitTask)
  const take = useStore((s) => s.takeTask)

  if (!task) return (
    <><header className="topbar"><button className="icon-btn" onClick={() => nav(-1)}><Icon name="arrow_back" /></button><span className="title">Задача</span><span style={{ width: 38 }} /></header>
      <main className="screen page"><p className="body muted">Задача не найдена.</p></main></>
  )

  const iAmCreator = task.created_by === uid
  const iAmAssignee = task.assignee_id === uid

  return (
    <>
      <header className="topbar">
        <button className="icon-btn" onClick={() => nav(-1)}><Icon name="arrow_back" /></button>
        <span className="title">Задача</span>
        <button className="icon-btn"><Icon name="more_horiz" /></button>
      </header>
      <main className="screen page">
        <div className="row" style={{ gap: 8 }}>
          {!task.is_personal && task.reward > 0 && <span className="chip chip-primary">С наградой</span>}
          <StatusChip status={task.status} />
        </div>
        <h1 className="h1">{task.title}</h1>
        <div className="card">
          <div className="between" style={{ marginBottom: task.due_at ? 14 : 0 }}>
            <div className="row" style={{ gap: 10 }}>
              <div className="avatar" style={{ width: 40, height: 40, background: 'var(--primary-soft)', fontSize: 15 }}>{(task.assignee_id ? memberName(members, task.assignee_id) : '·')[0]}</div>
              <div><p className="caption">Исполнитель</p><p className="title" style={{ fontSize: 15 }}>{task.assignee_id ? memberName(members, task.assignee_id) : 'Свободна (Доска)'}</p></div>
            </div>
            {task.reward > 0 && <Coin value={task.reward} />}
          </div>
          {task.due_at && <><p className="caption" style={{ marginBottom: 6 }}>Срок</p><p className="body" style={{ fontSize: 14, color: task.urgent ? 'var(--error)' : 'var(--text-1)' }}>{task.urgent ? '⚠ ' : ''}{fmtDue(task.due_at)}</p></>}
          <p className="caption" style={{ marginTop: 10 }}>Создал(а): {memberName(members, task.created_by)}</p>
        </div>
        {task.note && <div className="card"><p className="title" style={{ fontSize: 15, marginBottom: 6 }}>Описание</p><p className="body muted" style={{ fontSize: 14 }}>{task.note}</p></div>}

        {task.status === 'open' && <button className="btn btn-primary btn-block" onClick={async () => { await take(task.id); nav('/tasks') }}>Взять задание</button>}
        {task.status === 'accepted' && iAmAssignee && <button className="btn btn-primary btn-block" onClick={async () => { await submit(task.id); nav('/tasks') }}>Отметить «Готово»</button>}
        {task.status === 'accepted' && !iAmAssignee && <div className="card flat" style={{ textAlign: 'center', background: 'var(--surface-2)', border: 'none' }}><p className="caption">В работе у {memberName(members, task.assignee_id)}.</p></div>}
        {task.status === 'submitted' && iAmCreator && <>
          <button className="btn btn-primary btn-block" onClick={async () => { await approve(task.id); nav('/tasks') }}>Одобрить · начислить {task.reward} монет</button>
          <button className="btn btn-secondary btn-block" onClick={async () => { await reject(task.id); nav('/tasks') }}>Вернуть на доработку</button>
        </>}
        {task.status === 'submitted' && !iAmCreator && <div className="card flat" style={{ textAlign: 'center', background: 'var(--surface-2)', border: 'none' }}><p className="caption">Ждёт одобрения создателя ({memberName(members, task.created_by)}).</p></div>}
        {task.status === 'approved' && <div className="card flat" style={{ textAlign: 'center', background: 'var(--sage-container)', border: 'none' }}><p className="body" style={{ color: 'var(--on-sage)', fontWeight: 600 }}>✓ Готово · +{task.reward} монет</p></div>}
      </main>
    </>
  )
}

/* ---------------- New task (anyone) ---------------- */
export function NewTask() {
  const nav = useNavigate()
  const uid = useStore((s) => s.user?.mid)
  const members = useStore((s) => s.members)
  const create = useStore((s) => s.createTask)

  const [title, setTitle] = useState('')
  const [kind, setKind] = useState<'duty' | 'personal'>('duty')
  const [assignee, setAssignee] = useState<string | null>(null)
  const [reward, setReward] = useState(15)
  const [due, setDue] = useState('')
  const [urgent, setUrgent] = useState(false)
  const [busy, setBusy] = useState(false)

  const options: { id: string | null; label: string }[] = [
    { id: null, label: 'На Доску' },
    ...members.map((m) => ({ id: m.id, label: m.id === uid ? 'Себе' : m.name })),
  ]

  const submit = async () => {
    setBusy(true)
    try {
      if (kind === 'personal') await create({ title: title || 'Личная задача', reward: 0, assignee_id: uid, is_personal: true, due_at: due || null })
      else await create({ title: title || 'Новая задача', reward, assignee_id: assignee, due_at: due || null, urgent })
      nav('/tasks')
    } catch { setBusy(false) }
  }

  return (
    <>
      <header className="topbar">
        <button className="icon-btn" onClick={() => nav(-1)}><Icon name="close" /></button>
        <span className="title">Новая задача</span>
        <span style={{ width: 38 }} />
      </header>
      <main className="screen page">
        <div className="field"><label>Что нужно сделать?</label><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Например: вымыть посуду" autoFocus /></div>
        <div className="field"><label>Тип</label>
          <div className="row" style={{ gap: 10 }}>
            <button className={'btn btn-sm ' + (kind === 'duty' ? 'btn-primary' : 'btn-secondary')} style={{ flex: 1 }} onClick={() => setKind('duty')}>С наградой</button>
            <button className={'btn btn-sm ' + (kind === 'personal' ? 'btn-primary' : 'btn-secondary')} style={{ flex: 1 }} onClick={() => setKind('personal')}>Личная</button>
          </div>
        </div>
        {kind === 'duty' && <>
          <div className="field"><label>Кому</label>
            <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
              {options.map((p) => (
                <button key={String(p.id)} className={'chip selectable' + (assignee === p.id ? ' selected' : '')} onClick={() => setAssignee(p.id)}>{p.label}</button>
              ))}
            </div>
          </div>
          <div className="field"><label>Награда (монеты)</label><input className="input" type="number" value={reward} onChange={(e) => setReward(Math.max(0, +e.target.value))} /></div>
        </>}
        <div className="field"><label>Срок (необязательно)</label><input className="input" value={due} onChange={(e) => setDue(e.target.value)} placeholder="Сегодня, 20:00" /></div>
        {kind === 'duty' && (
          <label className="card tight" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="row" style={{ gap: 10 }}><Icon name="priority_high" color="var(--error)" />Срочная</span>
            <span className="switch"><input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} /><span /></span>
          </label>
        )}
        <button className={'btn btn-primary btn-block' + (busy ? ' is-loading' : '')} onClick={submit} disabled={busy}>Создать задачу</button>
      </main>
    </>
  )
}

/* ---------------- Rewards (store; anyone redeems own coins) ---------------- */
export function Rewards() {
  const uid = useStore((s) => s.user?.mid)
  const me = useMe()
  const rewards = useStore((s) => s.rewards)
  const redeem = useStore((s) => s.redeem)
  const coins = me?.coins ?? 0
  return (
    <>
      <AppTopBar right={<Coin value={coins} />} />
      <main className="screen page">
        <section><h1 className="h1">Награды</h1><p className="body muted">Обменивайте свои монеты на приятности.</p></section>
        {rewards.map((p) => {
          const can = coins >= p.cost
          return (
            <div key={p.id} className="card">
              {p.tag && <span className="chip chip-honey" style={{ marginBottom: 8 }}>{p.tag}</span>}
              <p className="title">{p.title}</p>
              {p.description && <p className="body muted" style={{ fontSize: 13, marginTop: 2 }}>{p.description}</p>}
              {!can && <div className="track reward" style={{ marginTop: 14 }}><span style={{ width: Math.min(100, Math.round((coins / p.cost) * 100)) + '%' }} /></div>}
              <div className="between" style={{ marginTop: 14 }}>
                <Coin value={p.cost} />
                {can ? <button className="btn btn-primary btn-sm" onClick={() => redeem(p.id, uid)}>Получить</button> : <button className="btn btn-secondary btn-sm" disabled>Ещё {p.cost - coins}</button>}
              </div>
            </div>
          )
        })}
      </main>
      <BottomNav />
    </>
  )
}

/* ---------------- Wallet ---------------- */
export function Wallet() {
  const uid = useStore((s) => s.user?.mid)
  const me = useMe()
  const txns = useStore((s) => s.txns)
  const goals = useStore((s) => s.goals)
  const goal = goals.find((g) => g.membership_id === uid && g.status === 'active')
  const coins = me?.coins ?? 0
  const pct = goal ? Math.min(100, Math.round((coins / goal.target) * 100)) : 0
  return (
    <>
      <AppTopBar />
      <main className="screen page">
        <section className="card hero" style={{ background: 'var(--reward-container)', borderColor: '#eccf86', textAlign: 'center' }}>
          <p className="caption" style={{ color: 'var(--on-reward)' }}>Текущий баланс</p>
          <div className="row" style={{ justifyContent: 'center', gap: 8, margin: '8px 0' }}>
            <Icon name="paid" size={34} color="var(--reward)" />
            <span style={{ fontSize: 44, fontWeight: 800, color: 'var(--on-reward)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{coins}</span>
          </div>
          <p className="caption" style={{ color: 'var(--on-reward)' }}>монет</p>
          <div className="row" style={{ gap: 10, marginTop: 16 }}>
            <Link to="/tasks" className="btn btn-secondary" style={{ flex: 1 }}>Заработать</Link>
            <Link to="/rewards" className="btn btn-primary" style={{ flex: 1 }}>Потратить</Link>
          </div>
        </section>

        {goal && (
          <section className="card">
            <div className="between" style={{ marginBottom: 10 }}><p className="title" style={{ fontSize: 15 }}>Цель: {goal.title}</p><span className="caption">{coins} / {goal.target}</span></div>
            <div className="track reward"><span style={{ width: pct + '%' }} /></div>
            <p className="caption" style={{ marginTop: 8 }}>{coins >= goal.target ? 'Цель достигнута! 🎉' : `Осталось накопить ${goal.target - coins} монет`}</p>
          </section>
        )}

        <section>
          <h2 className="h3" style={{ marginBottom: 12 }}>История</h2>
          {txns.length === 0 && <div className="card flat" style={{ textAlign: 'center', background: 'var(--surface-2)', border: 'none' }}><p className="caption">Пока пусто. Выполните задание!</p></div>}
          {txns.map((h) => {
            const earn = h.type === 'earn' || h.type === 'adjust'
            return (
              <div key={h.id} className="card tight" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div className="row" style={{ gap: 12 }}>
                  <div className="avatar" style={{ width: 38, height: 38, background: earn ? 'var(--sage-container)' : 'var(--primary-container)', color: earn ? 'var(--sage)' : 'var(--primary)' }}><Icon name={earn ? 'check_circle' : 'redeem'} size={20} /></div>
                  <div><p className="title" style={{ fontSize: 14 }}>{h.title}</p><p className="caption">{fmt(h.created_at)}</p></div>
                </div>
                <span style={{ fontWeight: 800, color: earn ? 'var(--sage)' : 'var(--primary)' }}>{earn ? '+' : '−'}{h.amount}</span>
              </div>
            )
          })}
        </section>
      </main>
      <BottomNav />
    </>
  )
}

/* ---------------- Notifications ---------------- */
const NICON: Record<string, string> = {
  task_submitted: 'pending_actions', task_approved: 'check_circle', task_rejected: 'priority_high',
  reward_redeemed: 'redeem', member_joined: 'person_add', reminder: 'schedule',
}
export function Notifications() {
  const nav = useNavigate()
  const notifs = useStore((s) => s.notifications)
  return (
    <>
      <header className="topbar">
        <button className="icon-btn" onClick={() => nav(-1)}><Icon name="arrow_back" /></button>
        <span className="title">Уведомления</span>
        <button className="icon-btn" aria-label="Прочитать всё"><Icon name="done_all" /></button>
      </header>
      <main className="screen page">
        {notifs.length === 0 && <div className="card flat" style={{ textAlign: 'center', background: 'var(--surface-2)', border: 'none' }}><p className="caption">Уведомлений пока нет.</p></div>}
        {notifs.map((n) => (
          <div key={n.id} className="card tight" style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: n.read_at ? 'var(--white)' : '#fff8f5' }}>
            <div className="avatar" style={{ width: 40, height: 40, background: 'var(--surface-2)', color: 'var(--primary)' }}><Icon name={NICON[n.type] ?? 'notifications'} size={20} /></div>
            <div style={{ flex: 1 }}><p className="title" style={{ fontSize: 14 }}>{n.title}</p>{n.body && <p className="caption">{n.body}</p>}</div>
            {!n.read_at && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', marginTop: 6 }} />}
          </div>
        ))}
      </main>
    </>
  )
}

/* ---------------- Week ---------------- */
const days = [['Пн', 12], ['Вт', 13], ['Ср', 14], ['Чт', 15], ['Пт', 16], ['Сб', 17], ['Вс', 18]] as const
export function Week() {
  const [sel, setSel] = useState(1)
  return (
    <>
      <AppTopBar />
      <main className="screen page">
        <h1 className="h1">Неделя</h1>
        <div className="hscroll">
          {days.map(([d, n], i) => (
            <button key={d} onClick={() => setSel(i)} style={{ flexShrink: 0, width: 52, padding: '10px 0', borderRadius: 'var(--r-lg)', border: '1px solid var(--line)', cursor: 'pointer', background: i === sel ? 'var(--primary)' : 'var(--white)', color: i === sel ? '#fff' : 'var(--text-1)' }}>
              <div style={{ fontSize: 11, fontWeight: 600, opacity: .8 }}>{d}</div><div style={{ fontSize: 18, fontWeight: 800 }}>{n}</div>
            </button>
          ))}
        </div>
        <p className="section-label">Расписание</p>
        {[['09:00', 'Запись к стоматологу', 'chip-primary'], ['16:00', 'Тренировка', 'chip-sage'], ['20:00', 'Вымыть посуду', 'chip-honey']].map(([time, t, c]) => (
          <div key={t} className="card tight" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span className="title" style={{ fontSize: 14, color: 'var(--primary)', minWidth: 44 }}>{time}</span>
            <p className="title" style={{ fontSize: 14, flex: 1 }}>{t}</p>
            <span className={'chip ' + c} style={{ fontSize: 10 }}>событие</span>
          </div>
        ))}
      </main>
      <BottomNav />
    </>
  )
}

/* ---------------- Profile ---------------- */
export function Profile() {
  const me = useMe()
  const user = useStore((s) => s.user)
  const logout = useStore((s) => s.logout)
  const nav = useNavigate()
  const menu = [
    { icon: 'edit', t: 'Профиль и аватар', to: '/edit-profile' },
    { icon: 'settings', t: 'Настройки дома', to: '/settings' },
    { icon: 'person_add', t: 'Пригласить в семью', to: '/invite' },
  ]
  return (
    <>
      <AppTopBar />
      <main className="screen page">
        <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
          <div className="avatar" style={{ width: 96, height: 96, background: me?.avatar_color ?? 'var(--primary-soft)', fontSize: 40 }}>{me?.name?.[0] ?? '·'}</div>
          <div><h1 className="h1">{me?.name ?? user?.name}</h1><p className="body muted">{me?.role === 'child' ? 'Ребёнок' : 'Взрослый'}{me?.is_admin ? ' · админ' : ''}</p></div>
          <div className="row" style={{ gap: 10 }}><span className="chip chip-reward"><Icon name="paid" size={14} />{me?.coins ?? 0} монет</span></div>
        </section>
        <div className="list">
          {menu.map((m) => (
            <Link key={m.t} to={m.to} className="list-row" style={{ textDecoration: 'none', color: 'inherit' }}>
              <Icon name={m.icon} color="var(--primary)" /><span className="grow title" style={{ fontSize: 15 }}>{m.t}</span><Icon name="chevron_right" color="var(--text-3)" />
            </Link>
          ))}
          <button className="list-row" style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', textAlign: 'left' }} onClick={() => { logout(); nav('/') }}>
            <Icon name="logout" color="var(--error)" /><span className="grow title" style={{ fontSize: 15 }}>Выйти</span>
          </button>
        </div>
      </main>
      <BottomNav />
    </>
  )
}

/* ---------------- Edit profile ---------------- */
export function EditProfile() {
  const nav = useNavigate()
  const me = useMe()
  const colors = ['var(--primary-soft)', 'var(--sage)', 'var(--honey)', '#b1cfa7', 'var(--primary)', '#a68b7c']
  const [c, setC] = useState(0)
  return (
    <>
      <header className="topbar">
        <button className="icon-btn" onClick={() => nav(-1)}><Icon name="arrow_back" /></button>
        <span className="title">Профиль</span>
        <button className="btn btn-ghost btn-sm" style={{ height: 'auto' }} onClick={() => nav(-1)}>Сохранить</button>
      </header>
      <main className="screen page" style={{ paddingBottom: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <div className="avatar" style={{ width: 104, height: 104, background: colors[c], fontSize: 40 }}>{me?.name?.[0] ?? '·'}</div>
            <button className="fab" style={{ width: 40, height: 40, position: 'absolute', bottom: -4, right: -4, top: 'auto', boxShadow: 'var(--elev-2)' }}><Icon name="photo_camera" size={20} /></button>
          </div>
          <p className="caption">Фото или цвет</p>
        </div>
        <div className="field"><label>Имя</label><input className="input" defaultValue={me?.name} /></div>
        <div className="field"><label>Цвет аватара</label>
          <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
            {colors.map((col, i) => (
              <button key={i} onClick={() => setC(i)} aria-label={'Цвет ' + (i + 1)} style={{ width: 48, height: 48, borderRadius: '50%', background: col, border: i === c ? '2px solid var(--text-1)' : '2px solid transparent', cursor: 'pointer' }} />
            ))}
          </div>
        </div>
        <button className="btn btn-primary btn-block" onClick={() => nav(-1)}>Сохранить изменения</button>
      </main>
    </>
  )
}

/* ---------------- Settings ---------------- */
function Toggle({ on = false }: { on?: boolean }) {
  const [v, setV] = useState(on)
  return <span className="switch"><input type="checkbox" checked={v} onChange={(e) => setV(e.target.checked)} /><span /></span>
}
export function Settings() {
  const nav = useNavigate()
  const rows = (items: { icon: string; bg: string; fg: string; t: string; m: string; on?: boolean }[]) => (
    <div className="list">
      {items.map((r) => (
        <div key={r.t} className="list-row">
          <div className="avatar" style={{ width: 38, height: 38, background: r.bg, color: r.fg }}><Icon name={r.icon} size={20} /></div>
          <div className="grow"><p className="title" style={{ fontSize: 15 }}>{r.t}</p><p className="caption">{r.m}</p></div>
          <Toggle on={r.on} />
        </div>
      ))}
    </div>
  )
  return (
    <>
      <header className="topbar">
        <button className="icon-btn" onClick={() => nav(-1)}><Icon name="arrow_back" /></button>
        <span className="title">Настройки дома</span>
        <span style={{ width: 38 }} />
      </header>
      <main className="screen page" style={{ paddingBottom: 24 }}>
        <section><h1 className="h1">Семья</h1><p className="body muted">Управление домом и оповещениями.</p></section>
        <div><h2 className="h3" style={{ marginBottom: 10 }}>Оповещения</h2>
          {rows([
            { icon: 'notifications_active', bg: 'var(--honey)', fg: 'var(--on-honey)', t: '«К столу!»', m: 'Зовёт всех на ужин', on: true },
            { icon: 'cleaning_services', bg: 'var(--sage-container)', fg: 'var(--sage)', t: 'Напоминания о делах', m: 'Мягкий пинг по задачам', on: true },
            { icon: 'priority_high', bg: 'var(--error-container)', fg: 'var(--error)', t: 'Срочные оповещения', m: 'Только для важного' },
          ])}
        </div>
      </main>
    </>
  )
}
