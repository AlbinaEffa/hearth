import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { Brand } from '../components/TopBar'
import { BottomNav } from '../components/BottomNav'
import { Coin } from '../components/Coin'
import { useStore, memberName, type Member, type Task } from '../store'

function useMe() { return useStore((s) => s.members.find((m) => m.id === s.user?.mid)) }
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
function Balances({ m }: { m?: Member }) {
  if (!m) return null
  return <span className="row" style={{ gap: 6 }}><Coin value={m.coins_adult} cur="adult" /><Coin value={m.coins_child} cur="child" /></span>
}
function TypeChip({ t }: { t: Task }) {
  if (t.is_personal) return <span className="chip" style={{ fontSize: 10 }}>Личная</span>
  if (t.reward > 0) return <span className="chip chip-primary" style={{ fontSize: 10 }}>С наградой</span>
  return <span className="chip" style={{ fontSize: 10 }}>Поручение</span>
}
function StatusChip({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    open: ['Свободна', 'chip'], offered: ['Предложена', 'chip-honey'], accepted: ['В работе', 'chip-sage'],
    submitted: ['На одобрении', 'chip-honey'], approved: ['Готово', 'chip-primary'], rejected: ['Возвращена', 'chip-error'],
  }
  const [label, cls] = map[status] ?? ['—', 'chip']
  return <span className={'chip ' + cls} style={{ fontSize: 10 }}>{label}</span>
}
function fmtDue(ts: string | null) { if (!ts) return ''; const d = new Date(ts); return isNaN(d.getTime()) ? ts : d.toLocaleString('ru', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) }
function fmt(ts: string) { try { return new Date(ts).toLocaleString('ru', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) } catch { return ts } }

/* ---------------- Home ---------------- */
export function Home() {
  const uid = useStore((s) => s.user?.mid)
  const me = useMe()
  const members = useStore((s) => s.members)
  const tasks = useStore((s) => s.tasks)
  const approve = useStore((s) => s.approveTask)
  const reject = useStore((s) => s.rejectTask)
  const submit = useStore((s) => s.submitTask)
  const accept = useStore((s) => s.acceptTask)
  const decline = useStore((s) => s.declineTask)

  const myApprovals = tasks.filter((t) => t.created_by === uid && t.status === 'submitted')
  const offered = tasks.filter((t) => t.assignee_id === uid && t.status === 'offered')
  const myTasks = tasks.filter((t) => t.assignee_id === uid && (t.status === 'accepted' || t.status === 'submitted') && !t.is_personal)

  return (
    <>
      <AppTopBar />
      <main className="screen page">
        <section>
          <h1 className="h1">Привет, {me?.name ?? ''}! 👋</h1>
          <div className="row" style={{ gap: 8, marginTop: 8 }}><Balances m={me} /></div>
        </section>

        {offered.length > 0 && (
          <section>
            <h2 className="h3" style={{ marginBottom: 12 }}>Тебе предложили</h2>
            {offered.map((t) => (
              <div key={t.id} className="card tight" style={{ marginBottom: 10, background: 'var(--reward-container)', borderColor: '#eccf86' }}>
                <div className="between" style={{ marginBottom: 10 }}>
                  <div><p className="title" style={{ fontSize: 14 }}>{t.title}</p><p className="caption">от {memberName(members, t.created_by)}{t.due_at ? ' · ' + fmtDue(t.due_at) : ''}</p></div>
                  {t.reward > 0 && <Coin value={t.reward} cur={t.cur} />}
                </div>
                <div className="row" style={{ gap: 8 }}>
                  <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => accept(t.id)}>Принять</button>
                  <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => decline(t.id)}>Отклонить</button>
                </div>
              </div>
            ))}
          </section>
        )}

        {myApprovals.length > 0 && (
          <section className="card" style={{ background: '#fff8f5', borderColor: 'var(--primary-container)' }}>
            <div className="between" style={{ marginBottom: 12 }}>
              <span className="row" style={{ gap: 8, color: 'var(--primary)', fontWeight: 700, fontSize: 14 }}><Icon name="pending_actions" size={18} />Ждут вашего одобрения</span>
              <span className="count-badge">{myApprovals.length}</span>
            </div>
            {myApprovals.map((t) => (
              <div key={t.id} className="card tight" style={{ marginBottom: 8, boxShadow: 'none' }}>
                <div className="between">
                  <div><p className="title" style={{ fontSize: 14 }}>{t.title}</p><p className="caption">{memberName(members, t.assignee_id)} · +{t.reward}</p></div>
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
          <div className="between" style={{ marginBottom: 12 }}><h2 className="h3">Мои дела сегодня</h2><Link to="/tasks" className="link-arrow">Все →</Link></div>
          {myTasks.length === 0 && <div className="card flat" style={{ textAlign: 'center', background: 'var(--surface-2)', border: 'none' }}><p className="caption">Дел нет. Возьмите задание на Доске или создайте ＋.</p></div>}
          {myTasks.map((t) => (
            <div key={t.id} className={'card tight ' + (t.status === 'accepted' ? 'accent-reward' : '')} style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', ...(t.status === 'submitted' ? { background: 'var(--reward-container)', borderColor: '#eccf86' } : {}) }}>
              <Link to={'/tasks/' + t.id} style={{ textDecoration: 'none', flex: 1 }}>
                <div className="row" style={{ gap: 6, marginBottom: 4 }}><StatusChip status={t.status} />{t.due_at && <span className="caption" style={{ color: t.urgent ? 'var(--error)' : 'var(--text-3)' }}>{t.urgent ? '⚠ ' : ''}{fmtDue(t.due_at)}</span>}</div>
                <p className="title" style={{ fontSize: 14 }}>{t.title}</p>
              </Link>
              <div className="stack" style={{ alignItems: 'flex-end', gap: 6 }}>
                {t.reward > 0 && <Coin value={t.reward} cur={t.cur} />}
                {t.status === 'accepted' ? <button className="btn btn-primary btn-sm" style={{ height: 30, padding: '0 12px' }} onClick={() => submit(t.id)}>Готово</button> : <Icon name="hourglass_top" color="var(--reward)" size={22} />}
              </div>
            </div>
          ))}
        </section>

        <section>
          <h2 className="h3" style={{ marginBottom: 12 }}>Семья</h2>
          <div className="hscroll">
            {members.map((m) => (
              <div key={m.id} className="card tight" style={{ minWidth: 120, textAlign: 'center', flexShrink: 0 }}>
                <div className="avatar" style={{ width: 40, height: 40, background: m.avatar_color, margin: '0 auto 6px', fontSize: 16 }}>{m.name[0]}</div>
                <p className="title" style={{ fontSize: 12, marginBottom: 4 }}>{m.name}</p>
                <div className="stack" style={{ gap: 2, alignItems: 'center' }}><Coin value={m.coins_adult} cur="adult" /><Coin value={m.coins_child} cur="child" /></div>
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
  const { approveTask: approve, rejectTask: reject, submitTask: submit, takeTask: take, acceptTask: accept, declineTask: decline } = useStore.getState()

  const myApprovals = tasks.filter((t) => t.created_by === uid && t.status === 'submitted')
  const offered = tasks.filter((t) => t.assignee_id === uid && t.status === 'offered')
  const mine = tasks.filter((t) => t.assignee_id === uid && (t.status === 'accepted' || t.status === 'submitted') && !t.is_personal)
  const board = tasks.filter((t) => t.status === 'open')
  const others = tasks.filter((t) => t.assignee_id && t.assignee_id !== uid && ['offered', 'accepted', 'submitted'].includes(t.status) && !t.is_personal)
  const personal = tasks.filter((t) => t.is_personal && t.assignee_id === uid)
  const done = tasks.filter((t) => t.status === 'approved' && !t.is_personal)

  const Row = ({ t, children }: { t: Task; children?: React.ReactNode }) => (
    <div className="card tight accent-reward" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Link to={'/tasks/' + t.id} style={{ textDecoration: 'none', flex: 1 }}>
        <div className="row" style={{ gap: 6, marginBottom: 5, flexWrap: 'wrap' }}><TypeChip t={t} /><StatusChip status={t.status} />{t.due_at && <span className="caption">{fmtDue(t.due_at)}</span>}</div>
        <p className="title" style={{ fontSize: 14 }}>{t.title}</p>
      </Link>
      <div className="stack" style={{ alignItems: 'flex-end', gap: 6 }}>{t.reward > 0 && <Coin value={t.reward} cur={t.cur} />}{children}</div>
    </div>
  )

  return (
    <>
      <AppTopBar />
      <main className="screen page" style={{ gap: 10 }}>
        <h1 className="h1" style={{ marginBottom: 4 }}>Задачи</h1>

        {myApprovals.length > 0 && <>
          <div className="row" style={{ gap: 8 }}><p className="section-label">Ждут вашего одобрения</p><span className="count-badge">{myApprovals.length}</span></div>
          {myApprovals.map((t) => (
            <div key={t.id} className="card tight accent-reward">
              <div className="between" style={{ marginBottom: 10 }}><div><p className="title" style={{ fontSize: 14 }}>{t.title}</p><p className="caption">{memberName(members, t.assignee_id)} · выполнил(а)</p></div><Coin value={t.reward} cur={t.cur} /></div>
              <div className="row" style={{ gap: 8 }}><button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => approve(t.id)}>✓ Одобрить</button><button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => reject(t.id)}>✗ Вернуть</button></div>
            </div>
          ))}
        </>}

        {offered.length > 0 && <>
          <p className="section-label" style={{ marginTop: 8 }}>Тебе предложено</p>
          {offered.map((t) => (
            <div key={t.id} className="card tight" style={{ background: 'var(--reward-container)', borderColor: '#eccf86' }}>
              <div className="between" style={{ marginBottom: 10 }}><div><p className="title" style={{ fontSize: 14 }}>{t.title}</p><p className="caption">от {memberName(members, t.created_by)}</p></div>{t.reward > 0 && <Coin value={t.reward} cur={t.cur} />}</div>
              <div className="row" style={{ gap: 8 }}><button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => accept(t.id)}>Принять</button><button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => decline(t.id)}>Отклонить</button></div>
            </div>
          ))}
        </>}

        {mine.length > 0 && <><p className="section-label" style={{ marginTop: 8 }}>Мои дела</p>
          {mine.map((t) => <Row key={t.id} t={t}>{t.status === 'accepted' ? <button className="btn btn-primary btn-sm" style={{ height: 32 }} onClick={() => submit(t.id)}>Готово</button> : <Icon name="hourglass_top" color="var(--reward)" />}</Row>)}
        </>}

        {board.length > 0 && <><p className="section-label" style={{ marginTop: 8 }}>Свободные (Доска)</p>
          {board.map((t) => <Row key={t.id} t={t}><button className="btn btn-primary btn-sm" style={{ height: 30, padding: '0 12px' }} onClick={() => take(t.id)}>Беру!</button></Row>)}
        </>}

        {others.length > 0 && <><p className="section-label" style={{ marginTop: 8 }}>Задачи семьи</p>
          {others.map((t) => (
            <Link to={'/tasks/' + t.id} key={t.id} className="card tight" style={{ borderLeft: '3px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textDecoration: 'none' }}>
              <div><div className="row" style={{ gap: 6, marginBottom: 5 }}><StatusChip status={t.status} /><span className="caption">{memberName(members, t.assignee_id)}</span></div><p className="title" style={{ fontSize: 14 }}>{t.title}</p></div>
              <Icon name="chevron_right" color="var(--text-3)" />
            </Link>
          ))}
        </>}

        {personal.length > 0 && <><p className="section-label" style={{ marginTop: 8 }}>Личные</p>
          {personal.map((t) => (
            <div key={t.id} className="card tight accent-personal" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><div className="row" style={{ gap: 6, marginBottom: 4 }}><TypeChip t={t} /><StatusChip status={t.status} /></div><p className="title" style={{ fontSize: 14 }}>{t.title}</p></div>
              {t.status === 'accepted' ? <button className="btn btn-secondary btn-sm" style={{ height: 30 }} onClick={() => submit(t.id)}>Готово</button> : <Icon name="hourglass_top" color="var(--text-3)" />}
            </div>
          ))}
        </>}

        {done.length > 0 && <><p className="section-label" style={{ marginTop: 8 }}>Выполненные</p>
          {done.slice(0, 8).map((t) => (
            <div key={t.id} className="card tight" style={{ opacity: .65, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '3px solid var(--sage)' }}>
              <div><p className="title" style={{ fontSize: 14, textDecoration: 'line-through', color: 'var(--text-2)' }}>{t.title}</p><p className="caption">{memberName(members, t.assignee_id)} · +{t.reward}</p></div>
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
  const rooms = useStore((s) => s.rooms)
  const task = useStore((s) => s.tasks.find((t) => t.id === id))
  const { approveTask: approve, rejectTask: reject, submitTask: submit, takeTask: take, acceptTask: accept, declineTask: decline } = useStore.getState()

  if (!task) return (<><header className="topbar"><button className="icon-btn" onClick={() => nav(-1)}><Icon name="arrow_back" /></button><span className="title">Задача</span><span style={{ width: 38 }} /></header><main className="screen page"><p className="body muted">Задача не найдена.</p></main></>)

  const iAmCreator = task.created_by === uid
  const iAmAssignee = task.assignee_id === uid
  const roomName = rooms.find((r) => r.id === task.room_id)?.name

  return (
    <>
      <header className="topbar"><button className="icon-btn" onClick={() => nav(-1)}><Icon name="arrow_back" /></button><span className="title">Задача</span><button className="icon-btn"><Icon name="more_horiz" /></button></header>
      <main className="screen page">
        <div className="row" style={{ gap: 8 }}><TypeChip t={task} /><StatusChip status={task.status} /></div>
        <h1 className="h1">{task.title}</h1>
        <div className="card">
          <div className="between" style={{ marginBottom: 12 }}>
            <div className="row" style={{ gap: 10 }}><div className="avatar" style={{ width: 40, height: 40, background: 'var(--primary-soft)', fontSize: 15 }}>{(task.assignee_id ? memberName(members, task.assignee_id) : '·')[0]}</div><div><p className="caption">Исполнитель</p><p className="title" style={{ fontSize: 15 }}>{task.assignee_id ? memberName(members, task.assignee_id) : 'Свободна (Доска)'}</p></div></div>
            {task.reward > 0 && <Coin value={task.reward} cur={task.cur} />}
          </div>
          {task.due_at && <p className="body" style={{ fontSize: 14, color: task.urgent ? 'var(--error)' : 'var(--text-1)' }}><Icon name="schedule" size={14} style={{ verticalAlign: -2 }} /> {task.urgent ? '⚠ ' : ''}{fmtDue(task.due_at)}</p>}
          {(task.place || roomName) && <p className="body" style={{ fontSize: 14, marginTop: 4 }}><Icon name="home" size={14} style={{ verticalAlign: -2 }} /> {[roomName, task.place].filter(Boolean).join(' · ')}</p>}
          <p className="caption" style={{ marginTop: 10 }}>Создал(а): {memberName(members, task.created_by)}</p>
        </div>
        {task.note && <div className="card"><p className="title" style={{ fontSize: 15, marginBottom: 6 }}>Описание</p><p className="body muted" style={{ fontSize: 14 }}>{task.note}</p></div>}

        {task.status === 'open' && <button className="btn btn-primary btn-block" onClick={async () => { await take(task.id); nav('/tasks') }}>Взять задание</button>}
        {task.status === 'offered' && iAmAssignee && <><button className="btn btn-primary btn-block" onClick={async () => { await accept(task.id); nav('/tasks') }}>Принять</button><button className="btn btn-secondary btn-block" onClick={async () => { await decline(task.id); nav('/tasks') }}>Отклонить</button></>}
        {task.status === 'accepted' && iAmAssignee && <button className="btn btn-primary btn-block" onClick={async () => { await submit(task.id); nav('/tasks') }}>Отметить «Готово»</button>}
        {task.status === 'submitted' && iAmCreator && <><button className="btn btn-primary btn-block" onClick={async () => { await approve(task.id); nav('/tasks') }}>Одобрить · начислить {task.reward}</button><button className="btn btn-secondary btn-block" onClick={async () => { await reject(task.id); nav('/tasks') }}>Вернуть на доработку</button></>}
        {task.status === 'submitted' && !iAmCreator && <div className="card flat" style={{ textAlign: 'center', background: 'var(--surface-2)', border: 'none' }}><p className="caption">Ждёт одобрения создателя ({memberName(members, task.created_by)}).</p></div>}
        {task.status === 'approved' && <div className="card flat" style={{ textAlign: 'center', background: 'var(--sage-container)', border: 'none' }}><p className="body" style={{ color: 'var(--on-sage)', fontWeight: 600 }}>✓ Готово · +{task.reward}</p></div>}
      </main>
    </>
  )
}

/* ---------------- New task ---------------- */
export function NewTask() {
  const nav = useNavigate()
  const uid = useStore((s) => s.user?.mid)
  const members = useStore((s) => s.members)
  const rooms = useStore((s) => s.rooms)
  const create = useStore((s) => s.createTask)
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState<'duty' | 'personal'>('duty')
  const [assignee, setAssignee] = useState<string | null>(null)
  const [reward, setReward] = useState(15)
  const [due, setDue] = useState('')
  const [place, setPlace] = useState('')
  const [room, setRoom] = useState<string | null>(null)
  const [urgent, setUrgent] = useState(false)
  const [busy, setBusy] = useState(false)

  const options: { id: string | null; label: string }[] = [{ id: null, label: 'На Доску' }, ...members.map((m) => ({ id: m.id, label: m.id === uid ? 'Себе' : m.name }))]

  const submit = async () => {
    setBusy(true)
    try {
      if (kind === 'personal') await create({ title: title || 'Личная задача', reward: 0, assignee_id: uid, is_personal: true, due_at: due || null, place: place || null, room_id: room })
      else await create({ title: title || 'Новая задача', reward, assignee_id: assignee, due_at: due || null, urgent, place: place || null, room_id: room })
      nav('/tasks')
    } catch { setBusy(false) }
  }
  return (
    <>
      <header className="topbar"><button className="icon-btn" onClick={() => nav(-1)}><Icon name="close" /></button><span className="title">Новая задача</span><span style={{ width: 38 }} /></header>
      <main className="screen page">
        <div className="field"><label>Что нужно сделать?</label><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Например: вымыть посуду" autoFocus /></div>
        <div className="field"><label>Тип</label><div className="row" style={{ gap: 10 }}>
          <button className={'btn btn-sm ' + (kind === 'duty' ? 'btn-primary' : 'btn-secondary')} style={{ flex: 1 }} onClick={() => setKind('duty')}>С наградой</button>
          <button className={'btn btn-sm ' + (kind === 'personal' ? 'btn-primary' : 'btn-secondary')} style={{ flex: 1 }} onClick={() => setKind('personal')}>Личная</button>
        </div></div>
        {kind === 'duty' && <>
          <div className="field"><label>Кому</label><div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>{options.map((p) => <button key={String(p.id)} className={'chip selectable' + (assignee === p.id ? ' selected' : '')} onClick={() => setAssignee(p.id)}>{p.label}</button>)}</div></div>
          <div className="field"><label>Награда (монеты)</label><input className="input" type="number" value={reward} onChange={(e) => setReward(Math.max(0, +e.target.value))} /></div>
        </>}
        <div className="field"><label>Срок (необязательно)</label><input className="input" value={due} onChange={(e) => setDue(e.target.value)} placeholder="Сегодня, 20:00" /></div>
        <div className="field"><label>Место (необязательно)</label><input className="input" value={place} onChange={(e) => setPlace(e.target.value)} placeholder="Например: балкон" /></div>
        {rooms.length > 0 && <div className="field"><label>Комната</label><div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <button className={'chip selectable' + (room === null ? ' selected' : '')} onClick={() => setRoom(null)}>—</button>
          {rooms.map((r) => <button key={r.id} className={'chip selectable' + (room === r.id ? ' selected' : '')} onClick={() => setRoom(r.id)}>{r.name}</button>)}
        </div></div>}
        {kind === 'duty' && <label className="card tight" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><span className="row" style={{ gap: 10 }}><Icon name="priority_high" color="var(--error)" />Срочная</span><span className="switch"><input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} /><span /></span></label>}
        <button className={'btn btn-primary btn-block' + (busy ? ' is-loading' : '')} onClick={submit} disabled={busy}>Создать задачу</button>
      </main>
    </>
  )
}

/* ---------------- Магазин ---------------- */
export function Rewards() {
  const uid = useStore((s) => s.user?.mid)
  const me = useMe()
  const members = useStore((s) => s.members)
  const rewards = useStore((s) => s.rewards)
  const requests = useStore((s) => s.rewardRequests)
  const { redeem, createReward, requestReward, approveRewardRequest, declineRewardRequest } = useStore.getState()
  const [adding, setAdding] = useState(false)
  const [asking, setAsking] = useState(false)
  const [nt, setNt] = useState(''); const [nc, setNc] = useState(50)
  const [rt, setRt] = useState(''); const [rtarget, setRtarget] = useState<string | null>(null)
  const [prices, setPrices] = useState<Record<string, string>>({})

  const bal = (cur: 'child' | 'adult') => (cur === 'child' ? me?.coins_child : me?.coins_adult) ?? 0
  const incoming = requests.filter((r) => r.target_id === uid && r.status === 'pending')
  const adultR = rewards.filter((r) => r.cur === 'adult')
  const childR = rewards.filter((r) => r.cur === 'child')

  const RewardCard = ({ r }: { r: typeof rewards[number] }) => {
    const can = bal(r.cur) >= r.cost
    return (
      <div className="card">
        {r.tag && <span className="chip chip-honey" style={{ marginBottom: 8 }}>{r.tag}</span>}
        <p className="title">{r.title}</p>
        {r.description && <p className="body muted" style={{ fontSize: 13, marginTop: 2 }}>{r.description}</p>}
        <p className="caption" style={{ marginTop: 6 }}>от {memberName(members, r.owner_id)}</p>
        <div className="between" style={{ marginTop: 12 }}>
          <Coin value={r.cost} cur={r.cur} />
          {can ? <button className="btn btn-primary btn-sm" onClick={() => redeem(r.id, uid)}>Получить</button> : <button className="btn btn-secondary btn-sm" disabled>Ещё {r.cost - bal(r.cur)}</button>}
        </div>
      </div>
    )
  }

  return (
    <>
      <AppTopBar right={<Balances m={me} />} />
      <main className="screen page">
        <section><h1 className="h1">Магазин</h1><p className="body muted">Тратьте монеты, создавайте награды и просите их у близких.</p></section>

        <div className="row" style={{ gap: 10 }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setAdding(!adding); setAsking(false) }}><Icon name="add" size={18} />Награда</button>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setAsking(!asking); setAdding(false) }}><Icon name="redeem" size={18} />Запросить</button>
        </div>

        {adding && (
          <div className="card stack" style={{ gap: 12 }}>
            <p className="title" style={{ fontSize: 15 }}>Новая награда (для других)</p>
            <input className="input" value={nt} onChange={(e) => setNt(e.target.value)} placeholder="Например: Испеку блины" />
            <div className="field"><label>Цена ({me?.role === 'child' ? 'детские' : 'взрослые'} монеты)</label><input className="input" type="number" value={nc} onChange={(e) => setNc(Math.max(1, +e.target.value))} /></div>
            <button className="btn btn-primary" onClick={async () => { await createReward({ title: nt || 'Награда', cost: nc }); setNt(''); setAdding(false) }}>Создать</button>
          </div>
        )}
        {asking && (
          <div className="card stack" style={{ gap: 12 }}>
            <p className="title" style={{ fontSize: 15 }}>Запросить награду</p>
            <input className="input" value={rt} onChange={(e) => setRt(e.target.value)} placeholder="Например: Пицца в пятницу" />
            <div className="field"><label>У кого</label><div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>{members.filter((m) => m.id !== uid).map((m) => <button key={m.id} className={'chip selectable' + (rtarget === m.id ? ' selected' : '')} onClick={() => setRtarget(m.id)}>{m.name}</button>)}</div></div>
            <button className="btn btn-primary" disabled={!rtarget} onClick={async () => { await requestReward({ target_id: rtarget!, title: rt || 'Награда' }); setRt(''); setRtarget(null); setAsking(false) }}>Отправить запрос</button>
          </div>
        )}

        {incoming.length > 0 && <section>
          <h2 className="h3" style={{ marginBottom: 10 }}>Запросы к вам</h2>
          {incoming.map((q) => (
            <div key={q.id} className="card" style={{ marginBottom: 10 }}>
              <p className="title" style={{ fontSize: 15 }}>{q.title}</p>
              <p className="caption" style={{ marginBottom: 10 }}>от {memberName(members, q.requester_id)}</p>
              <div className="row" style={{ gap: 8 }}>
                <input className="input" style={{ width: 90, height: 40 }} type="number" placeholder="цена" value={prices[q.id] ?? ''} onChange={(e) => setPrices({ ...prices, [q.id]: e.target.value })} />
                <button className="btn btn-primary btn-sm" style={{ flex: 1 }} disabled={!prices[q.id]} onClick={() => approveRewardRequest(q.id, +prices[q.id])}>Одобрить</button>
                <button className="btn btn-secondary btn-sm" onClick={() => declineRewardRequest(q.id)}>Отклонить</button>
              </div>
            </div>
          ))}
        </section>}

        {adultR.length > 0 && <section><h2 className="h3" style={{ marginBottom: 10 }}>За взрослые монеты</h2>{adultR.map((r) => <RewardCard key={r.id} r={r} />)}</section>}
        {childR.length > 0 && <section><h2 className="h3" style={{ marginBottom: 10 }}>За детские монеты</h2>{childR.map((r) => <RewardCard key={r.id} r={r} />)}</section>}
      </main>
      <BottomNav />
    </>
  )
}

/* ---------------- Wallet ---------------- */
export function Wallet() {
  const nav = useNavigate()
  const uid = useStore((s) => s.user?.mid)
  const me = useMe()
  const members = useStore((s) => s.members)
  const txns = useStore((s) => s.txns)
  const goals = useStore((s) => s.goals)
  const goal = goals.find((g) => g.membership_id === uid && g.status === 'active')

  return (
    <>
      <header className="topbar"><button className="icon-btn" onClick={() => nav(-1)}><Icon name="arrow_back" /></button><span className="title">Кошелёк</span><span style={{ width: 38 }} /></header>
      <main className="screen page">
        <section className="card hero" style={{ background: 'var(--reward-container)', borderColor: '#eccf86', textAlign: 'center' }}>
          <p className="caption" style={{ color: 'var(--on-reward)' }}>Мой баланс</p>
          <div className="row" style={{ justifyContent: 'center', gap: 18, margin: '10px 0' }}>
            <div><div style={{ fontSize: 34, fontWeight: 800, color: 'var(--on-reward)', lineHeight: 1 }}>{me?.coins_adult ?? 0}</div><p className="caption" style={{ color: 'var(--on-reward)' }}>взрослые</p></div>
            <div><div style={{ fontSize: 34, fontWeight: 800, color: 'var(--on-reward)', lineHeight: 1 }}>{me?.coins_child ?? 0}</div><p className="caption" style={{ color: 'var(--on-reward)' }}>детские</p></div>
          </div>
          <div className="row" style={{ gap: 10, marginTop: 8 }}><Link to="/tasks" className="btn btn-secondary" style={{ flex: 1 }}>Заработать</Link><Link to="/rewards" className="btn btn-primary" style={{ flex: 1 }}>Потратить</Link></div>
        </section>

        {goal && (() => {
          const bal = (m: typeof members[number]) => goal.cur === 'child' ? m.coins_child : m.coins_adult
          const racers = [...members].sort((a, b) => bal(b) - bal(a))
          return (
            <section className="card">
              <div className="between" style={{ marginBottom: 12 }}><p className="title" style={{ fontSize: 15 }}>🏁 Гонка к цели: {goal.title}</p><span className="caption">{goal.target}</span></div>
              {racers.map((m) => {
                const pct = Math.min(100, Math.round((bal(m) / goal.target) * 100))
                return (
                  <div key={m.id} style={{ marginBottom: 10 }}>
                    <div className="between" style={{ marginBottom: 4 }}><span className="caption" style={{ fontWeight: m.id === uid ? 700 : 500, color: m.id === uid ? 'var(--primary)' : 'var(--text-2)' }}>{m.name}{m.id === uid ? ' (вы)' : ''}</span><span className="caption">{bal(m)} / {goal.target}</span></div>
                    <div className="track reward"><span style={{ width: pct + '%', background: m.avatar_color }} /></div>
                  </div>
                )
              })}
            </section>
          )
        })()}

        <section>
          <h2 className="h3" style={{ marginBottom: 12 }}>История</h2>
          {txns.length === 0 && <div className="card flat" style={{ textAlign: 'center', background: 'var(--surface-2)', border: 'none' }}><p className="caption">Пока пусто.</p></div>}
          {txns.map((h) => {
            const earn = h.type === 'earn' || h.type === 'adjust'
            return (
              <div key={h.id} className="card tight" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div className="row" style={{ gap: 12 }}><div className="avatar" style={{ width: 38, height: 38, background: earn ? 'var(--sage-container)' : 'var(--primary-container)', color: earn ? 'var(--sage)' : 'var(--primary)' }}><Icon name={earn ? 'check_circle' : 'redeem'} size={20} /></div><div><p className="title" style={{ fontSize: 14 }}>{h.title}</p><p className="caption">{fmt(h.created_at)}</p></div></div>
                <span style={{ fontWeight: 800, color: earn ? 'var(--sage)' : 'var(--primary)' }}>{earn ? '+' : '−'}{h.amount}<small style={{ fontSize: 9, opacity: .6 }}>{h.cur === 'child' ? 'д' : 'в'}</small></span>
              </div>
            )
          })}
        </section>
      </main>
    </>
  )
}

/* ---------------- Notifications ---------------- */
const NICON: Record<string, string> = { task_offered: 'assignment', task_submitted: 'pending_actions', task_approved: 'check_circle', task_rejected: 'priority_high', reward_redeemed: 'redeem', reward_requested: 'redeem', reward_request_resolved: 'check_circle', member_joined: 'person_add', reminder: 'schedule' }
export function Notifications() {
  const nav = useNavigate()
  const notifs = useStore((s) => s.notifications)
  return (
    <>
      <header className="topbar"><button className="icon-btn" onClick={() => nav(-1)}><Icon name="arrow_back" /></button><span className="title">Уведомления</span><button className="icon-btn"><Icon name="done_all" /></button></header>
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

/* ---------------- Week (real calendar) ---------------- */
const WD = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
export function Week() {
  const uid = useStore((s) => s.user?.mid)
  const members = useStore((s) => s.members)
  const tasks = useStore((s) => s.tasks)
  // build 7 days starting Monday of current week
  const today = new Date()
  const monday = new Date(today); monday.setDate(today.getDate() - ((today.getDay() + 6) % 7))
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return d })
  const [sel, setSel] = useState((today.getDay() + 6) % 7)
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString()
  const dated = tasks.filter((t) => t.due_at)
  const dayTasks = dated.filter((t) => sameDay(new Date(t.due_at!), days[sel]))
  const myDone = tasks.filter((t) => t.assignee_id === uid && t.status === 'approved').length
  const myEarned = tasks.filter((t) => t.assignee_id === uid && t.status === 'approved').reduce((s, t) => s + t.reward, 0)

  return (
    <>
      <AppTopBar />
      <main className="screen page">
        <h1 className="h1">Неделя</h1>
        <div className="hscroll">
          {days.map((d, i) => {
            const cnt = dated.filter((t) => sameDay(new Date(t.due_at!), d)).length
            return (
              <button key={i} onClick={() => setSel(i)} style={{ flexShrink: 0, width: 54, padding: '10px 0', borderRadius: 'var(--r-lg)', border: '1px solid var(--line)', cursor: 'pointer', background: i === sel ? 'var(--primary)' : 'var(--white)', color: i === sel ? '#fff' : 'var(--text-1)' }}>
                <div style={{ fontSize: 11, fontWeight: 600, opacity: .8 }}>{WD[d.getDay()]}</div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{d.getDate()}</div>
                {cnt > 0 && <div style={{ width: 5, height: 5, borderRadius: '50%', background: i === sel ? '#fff' : 'var(--primary)', margin: '3px auto 0' }} />}
              </button>
            )
          })}
        </div>
        <p className="section-label">{WD[days[sel].getDay()]}, {days[sel].getDate()}</p>
        {dayTasks.length === 0 && <div className="card flat" style={{ textAlign: 'center', background: 'var(--surface-2)', border: 'none' }}><p className="caption">На этот день задач со сроком нет.</p></div>}
        {dayTasks.map((t) => (
          <div key={t.id} className="card tight" style={{ display: 'flex', gap: 12, alignItems: 'center', borderLeft: '3px solid ' + (t.is_personal ? 'var(--sage)' : 'var(--primary)') }}>
            <span className="title" style={{ fontSize: 14, color: 'var(--primary)', minWidth: 48 }}>{new Date(t.due_at!).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}</span>
            <div style={{ flex: 1 }}><p className="title" style={{ fontSize: 14 }}>{t.title}</p><p className="caption">{memberName(members, t.assignee_id)}</p></div>
            <StatusChip status={t.status} />
          </div>
        ))}
        <section className="card" style={{ marginTop: 4 }}>
          <p className="title" style={{ fontSize: 15, marginBottom: 8 }}>Итоги</p>
          <div className="row" style={{ gap: 18 }}>
            <div><div style={{ fontSize: 24, fontWeight: 800, color: 'var(--sage)' }}>{myDone}</div><p className="caption">выполнено</p></div>
            <div><div style={{ fontSize: 24, fontWeight: 800, color: 'var(--reward)' }}>{myEarned}</div><p className="caption">заработано</p></div>
          </div>
        </section>
      </main>
      <BottomNav />
    </>
  )
}

/* ---------------- Profile ---------------- */
export function Profile() {
  const me = useMe()
  const logout = useStore((s) => s.logout)
  const nav = useNavigate()
  const menu = [
    { icon: 'savings', t: 'Мой кошелёк', to: '/wallet' },
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
          <div><h1 className="h1">{me?.name}</h1><p className="body muted">{me?.role === 'child' ? 'Ребёнок' : 'Взрослый'}{me?.is_admin ? ' · админ' : ''}</p></div>
          <Balances m={me} />
        </section>
        <div className="list">
          {menu.map((m) => <Link key={m.t} to={m.to} className="list-row" style={{ textDecoration: 'none', color: 'inherit' }}><Icon name={m.icon} color="var(--primary)" /><span className="grow title" style={{ fontSize: 15 }}>{m.t}</span><Icon name="chevron_right" color="var(--text-3)" /></Link>)}
          <button className="list-row" style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', textAlign: 'left' }} onClick={() => { logout(); nav('/') }}><Icon name="logout" color="var(--error)" /><span className="grow title" style={{ fontSize: 15 }}>Выйти</span></button>
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
      <header className="topbar"><button className="icon-btn" onClick={() => nav(-1)}><Icon name="arrow_back" /></button><span className="title">Профиль</span><button className="btn btn-ghost btn-sm" style={{ height: 'auto' }} onClick={() => nav(-1)}>Сохранить</button></header>
      <main className="screen page" style={{ paddingBottom: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'relative' }}><div className="avatar" style={{ width: 104, height: 104, background: colors[c], fontSize: 40 }}>{me?.name?.[0] ?? '·'}</div><button className="fab" style={{ width: 40, height: 40, position: 'absolute', bottom: -4, right: -4, top: 'auto', boxShadow: 'var(--elev-2)' }}><Icon name="photo_camera" size={20} /></button></div>
        </div>
        <div className="field"><label>Имя</label><input className="input" defaultValue={me?.name} /></div>
        <div className="field"><label>Цвет аватара</label><div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>{colors.map((col, i) => <button key={i} onClick={() => setC(i)} aria-label={'Цвет ' + (i + 1)} style={{ width: 48, height: 48, borderRadius: '50%', background: col, border: i === c ? '2px solid var(--text-1)' : '2px solid transparent', cursor: 'pointer' }} />)}</div></div>
        <button className="btn btn-primary btn-block" onClick={() => nav(-1)}>Сохранить</button>
      </main>
    </>
  )
}

/* ---------------- Settings (incl. rooms) ---------------- */
function Toggle({ on = false }: { on?: boolean }) { const [v, setV] = useState(on); return <span className="switch"><input type="checkbox" checked={v} onChange={(e) => setV(e.target.checked)} /><span /></span> }
export function Settings() {
  const nav = useNavigate()
  const rooms = useStore((s) => s.rooms)
  return (
    <>
      <header className="topbar"><button className="icon-btn" onClick={() => nav(-1)}><Icon name="arrow_back" /></button><span className="title">Настройки дома</span><span style={{ width: 38 }} /></header>
      <main className="screen page" style={{ paddingBottom: 24 }}>
        <section><h1 className="h1">Семья</h1><p className="body muted">Дом, комнаты и оповещения.</p></section>

        <div><h2 className="h3" style={{ marginBottom: 10 }}>Комнаты</h2>
          <div className="list">
            {rooms.map((r) => <div key={r.id} className="list-row"><div className="avatar" style={{ width: 38, height: 38, background: 'var(--surface-2)', color: 'var(--primary)' }}><Icon name="home" size={20} /></div><span className="grow title" style={{ fontSize: 15 }}>{r.name}</span></div>)}
            {rooms.length === 0 && <div className="list-row"><span className="caption">Комнат пока нет.</span></div>}
          </div>
        </div>

        <div><h2 className="h3" style={{ marginBottom: 10 }}>Оповещения</h2>
          <div className="list">
            {[['notifications_active', 'var(--honey)', 'var(--on-honey)', '«К столу!»', 'Зовёт всех на ужин', true], ['cleaning_services', 'var(--sage-container)', 'var(--sage)', 'Напоминания о делах', 'Мягкий пинг по задачам', true], ['priority_high', 'var(--error-container)', 'var(--error)', 'Срочные оповещения', 'Только для важного', false]].map((r: any) => (
              <div key={r[3]} className="list-row"><div className="avatar" style={{ width: 38, height: 38, background: r[1], color: r[2] }}><Icon name={r[0]} size={20} /></div><div className="grow"><p className="title" style={{ fontSize: 15 }}>{r[3]}</p><p className="caption">{r[4]}</p></div><Toggle on={r[5]} /></div>
            ))}
          </div>
        </div>
      </main>
    </>
  )
}
