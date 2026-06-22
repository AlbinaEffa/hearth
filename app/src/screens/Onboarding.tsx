import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { useStore } from '../store'

const centered: React.CSSProperties = {
  minHeight: '100dvh', display: 'flex', flexDirection: 'column',
  justifyContent: 'center', padding: '36px 24px', gap: 24,
}

// shared across the create-family steps (same module, survives navigation)
const draft: { name?: string; email?: string; password?: string; color?: string } = {}

function BackBtn() {
  const nav = useNavigate()
  return (
    <button className="icon-btn" onClick={() => nav(-1)} aria-label="Назад"
      style={{ position: 'absolute', top: 16, left: 16, zIndex: 10 }}>
      <Icon name="arrow_back" />
    </button>
  )
}

function BrandMark({ size = 64, icon = 'local_fire_department', tone = 'primary' }: { size?: number; icon?: string; tone?: 'primary' | 'sage' }) {
  const bg = tone === 'sage' ? 'var(--sage-container)' : 'var(--primary-container)'
  const fg = tone === 'sage' ? 'var(--sage)' : 'var(--primary)'
  return (
    <div className="brand-mark" style={{ width: size, height: size, background: bg, color: fg }}>
      <Icon name={icon} size={size * 0.5} />
    </div>
  )
}

function Header({ icon, tone, title, sub }: { icon?: string; tone?: 'primary' | 'sage'; title: string; sub: string }) {
  return (
    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <BrandMark icon={icon} tone={tone} />
      <div><h1 className="h1" style={{ marginBottom: 6 }}>{title}</h1><p className="body muted">{sub}</p></div>
    </div>
  )
}

function Err({ msg }: { msg: string | null }) {
  if (!msg) return null
  return <p className="error-text" style={{ textAlign: 'center' }}>{msg}</p>
}

function PasswordField({ id, placeholder, label, value, onChange }: { id: string; placeholder: string; label: string; value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false)
  return (
    <div className="field">
      {label && <label htmlFor={id}>{label}</label>}
      <div style={{ position: 'relative' }}>
        <input className="input" id={id} type={show ? 'text' : 'password'} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} style={{ paddingRight: 48 }} />
        <button type="button" aria-label="Показать пароль" onClick={() => setShow((s) => !s)}
          style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={show ? 'visibility_off' : 'visibility'} size={20} />
        </button>
      </div>
    </div>
  )
}

const AVATAR_COLORS = ['var(--primary-soft)', 'var(--sage)', 'var(--honey)', '#b1cfa7', 'var(--primary)', '#a68b7c']
const roleHome = (_role?: string) => '/home' // one app for everyone

/* ---------------- Welcome ---------------- */
export function Welcome() {
  return (
    <div className="page" style={{ ...centered, alignItems: 'center', textAlign: 'center', gap: 26 }}>
      <BrandMark size={88} />
      <div>
        <h1 className="h1" style={{ marginBottom: 8 }}>Добро пожаловать в Hearth</h1>
        <p className="body muted">Семейный очаг: дела по дому, награды и забота — в одном тёплом месте.</p>
      </div>
      <div className="stack" style={{ gap: 12, width: '100%' }}>
        <Link to="/signup" className="btn btn-primary btn-block">Создать семью</Link>
        <Link to="/login" className="btn btn-secondary btn-block">Войти</Link>
        <Link to="/join" className="btn btn-ghost btn-block">У меня есть код приглашения</Link>
      </div>
    </div>
  )
}

/* ---------------- Sign up (step 1: account) ---------------- */
export function SignUp() {
  const nav = useNavigate()
  const [name, setName] = useState(draft.name ?? '')
  const [email, setEmail] = useState(draft.email ?? '')
  const [password, setPassword] = useState(draft.password ?? '')
  const next = (e: React.FormEvent) => {
    e.preventDefault()
    draft.name = name; draft.email = email; draft.password = password
    nav('/setup-profile')
  }
  return (
    <div className="page" style={centered}>
      <BackBtn />
      <Header title="Создать семью" sub="Сначала — ваш личный аккаунт родителя." />
      <form className="stack" style={{ gap: 16 }} onSubmit={next}>
        <div className="field"><label htmlFor="n">Ваше имя</label><input className="input" id="n" value={name} onChange={(e) => setName(e.target.value)} placeholder="Как вас зовут?" /></div>
        <div className="field"><label htmlFor="e">Эл. почта</label><input className="input" id="e" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="hello@hearth.com" /></div>
        <PasswordField id="p" label="Пароль" placeholder="Минимум 8 символов" value={password} onChange={setPassword} />
        <button className="btn btn-primary btn-block" type="submit">Далее</button>
      </form>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, paddingTop: 8, borderTop: '1px solid var(--line-soft)' }}>
        <span className="caption">Уже есть аккаунт?</span>
        <Link to="/login" className="btn btn-ghost btn-sm">Войти</Link>
      </div>
    </div>
  )
}

/* ---------------- Setup profile (step 2: avatar) ---------------- */
export function SetupProfile() {
  const nav = useNavigate()
  const [c, setC] = useState(0)
  const next = (e: React.FormEvent) => { e.preventDefault(); draft.color = AVATAR_COLORS[c]; nav('/create-home') }
  return (
    <div className="page" style={centered}>
      <BackBtn />
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <div className="avatar" style={{ width: 96, height: 96, background: AVATAR_COLORS[c], color: '#fff', fontSize: 38 }}>{(draft.name?.[0] ?? 'М').toUpperCase()}</div>
        <div><h1 className="h1" style={{ marginBottom: 6 }}>Ваш профиль</h1><p className="body muted">Выберите цвет — чтобы вас узнавали в семье.</p></div>
      </div>
      <form className="stack" style={{ gap: 18 }} onSubmit={next}>
        <div className="field"><label>Цвет аватара</label>
          <div className="row" style={{ gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            {AVATAR_COLORS.map((col, i) => (
              <button type="button" key={i} onClick={() => setC(i)} aria-label={'Цвет ' + (i + 1)}
                style={{ width: 48, height: 48, borderRadius: '50%', background: col, border: i === c ? '3px solid var(--text-1)' : '3px solid transparent', cursor: 'pointer' }} />
            ))}
          </div>
        </div>
        <button className="btn btn-primary btn-block" type="submit">Далее</button>
      </form>
    </div>
  )
}

/* ---------------- Create home (step 3: name + actually sign up) ---------------- */
export function CreateHome() {
  const nav = useNavigate()
  const signup = useStore((s) => s.signup)
  const [home, setHome] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const create = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setErr(null)
    try {
      await signup({ name: draft.name!, email: draft.email!, password: draft.password!, householdName: home || `Семья ${draft.name}` })
      nav('/invite')
    } catch (e: any) { setErr(e.message || 'Не удалось создать'); setBusy(false) }
  }
  return (
    <div className="page" style={centered}>
      <BackBtn />
      <Header icon="add_home" title="Создать дом" sub="Дайте семье уютное имя." />
      <form className="stack" style={{ gap: 16 }} onSubmit={create}>
        <div className="field"><label htmlFor="h">Название дома</label><input className="input" id="h" value={home} onChange={(e) => setHome(e.target.value)} placeholder="Например: Ивановы" /></div>
        <Err msg={err} />
        <button className={'btn btn-primary btn-block' + (busy ? ' is-loading' : '')} type="submit" disabled={busy}>Создать</button>
      </form>
    </div>
  )
}

/* ---------------- Invite (post-signup; codes are cosmetic for now) ---------------- */
type LocalMember = { name: string; role: 'adult' | 'teen'; code: string }
function makeCode(name: string, i: number) {
  const base = name.trim().toUpperCase().replace(/[^A-ZА-Я0-9]/g, '').slice(0, 3) || 'HRT'
  return 'HRT-' + base + (12 + i * 7)
}
export function Invite() {
  const homeName = useStore((s) => s.user?.name)
  const [members, setMembers] = useState<LocalMember[]>([])
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [role, setRole] = useState<'adult' | 'teen'>('teen')
  const addMember = () => {
    const n = name.trim() || (role === 'teen' ? 'Подросток' : 'Взрослый')
    setMembers((m) => [...m, { name: n, role, code: makeCode(n, m.length) }])
    setName(''); setRole('teen'); setAdding(false)
  }
  return (
    <div className="page screen" style={{ paddingTop: 56, paddingBottom: 40 }}>
      <Header icon="celebration" tone="sage" title="Дом создан!" sub={`Пригласите близких, ${homeName ?? ''} — каждый откроет свою ссылку и создаст вход.`} />
      <div className="list">
        <div className="list-row">
          <div className="avatar" style={{ width: 38, height: 38, background: 'var(--primary-soft)', fontSize: 14 }}>{(homeName?.[0] ?? 'Я').toUpperCase()}</div>
          <div className="grow"><p className="title" style={{ fontSize: 15 }}>{homeName ?? 'Вы'}</p><p className="caption">Это вы · взрослый</p></div>
          <span className="chip chip-primary">Вы</span>
        </div>
        {members.map((m, i) => (
          <div key={i} className="list-row" style={{ alignItems: 'flex-start' }}>
            <div className="avatar" style={{ width: 38, height: 38, background: m.role === 'teen' ? 'var(--honey)' : 'var(--sage)', color: m.role === 'teen' ? 'var(--on-honey)' : '#fff', fontSize: 14 }}>{m.name[0]}</div>
            <div className="grow">
              <p className="title" style={{ fontSize: 15 }}>{m.name}</p>
              <p className="caption" style={{ marginBottom: 8 }}>{m.role === 'teen' ? 'Подросток' : 'Взрослый'} · приглашение</p>
              <div className="row" style={{ gap: 8 }}>
                <span className="chip" style={{ fontFamily: 'monospace', letterSpacing: 1 }}>{m.code}</span>
                <button className="btn btn-ghost btn-sm" style={{ height: 30, padding: '0 8px' }}><Icon name="ios_share" size={16} />Ссылка</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {adding ? (
        <div className="card stack" style={{ gap: 14 }}>
          <div className="field"><label htmlFor="mn">Имя участника</label><input className="input" id="mn" value={name} onChange={(e) => setName(e.target.value)} placeholder="Например: Саша" autoFocus /></div>
          <div className="field"><label>Роль</label>
            <div className="row" style={{ gap: 10 }}>
              <button type="button" className={'btn btn-sm ' + (role === 'teen' ? 'btn-primary' : 'btn-secondary')} style={{ flex: 1 }} onClick={() => setRole('teen')}>Подросток</button>
              <button type="button" className={'btn btn-sm ' + (role === 'adult' ? 'btn-primary' : 'btn-secondary')} style={{ flex: 1 }} onClick={() => setRole('adult')}>Взрослый</button>
            </div>
          </div>
          <div className="row" style={{ gap: 10 }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setAdding(false); setName('') }}>Отмена</button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={addMember}>Создать приглашение</button>
          </div>
        </div>
      ) : (
        <button className="btn btn-secondary btn-block" onClick={() => setAdding(true)}><Icon name="person_add" size={20} />Добавить участника</button>
      )}
      <Link to="/home" className="btn btn-primary btn-block">Войти в дом</Link>
    </div>
  )
}

/* ---------------- Login ---------------- */
export function Login() {
  const nav = useNavigate()
  const login = useStore((s) => s.login)
  const [email, setEmail] = useState('mama@hearth.app')
  const [password, setPassword] = useState('hearth123')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setErr(null)
    try {
      await login(email, password)
      nav(roleHome(useStore.getState().user?.role))
    } catch (e: any) { setErr(e.message || 'Ошибка входа'); setBusy(false) }
  }
  return (
    <div className="page" style={centered}>
      <BackBtn />
      <Header title="С возвращением" sub="Войдите в свой аккаунт." />
      <form className="stack" style={{ gap: 16 }} onSubmit={submit}>
        <div className="field"><label htmlFor="email">Эл. почта</label><input className="input" id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="hello@hearth.com" /></div>
        <div className="field">
          <div className="between"><label htmlFor="pwd" style={{ margin: 0 }}>Пароль</label><a href="#" className="caption" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Забыли пароль?</a></div>
          <PasswordField id="pwd" label="" placeholder="••••••••" value={password} onChange={setPassword} />
        </div>
        <Err msg={err} />
        <button className={'btn btn-primary btn-block' + (busy ? ' is-loading' : '')} type="submit" disabled={busy}>Войти</button>
      </form>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, paddingTop: 8, borderTop: '1px solid var(--line-soft)' }}>
        <span className="caption">Впервые здесь?</span>
        <Link to="/signup" className="btn btn-ghost btn-sm">Создать семью</Link>
      </div>
    </div>
  )
}

/* ---------------- Join by invite ---------------- */
export function Join() {
  const nav = useNavigate()
  const join = useStore((s) => s.join)
  const [invite, setInvite] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setErr(null)
    try {
      await join({ invite, name, email, password })
      nav(roleHome(useStore.getState().user?.role))
    } catch (e: any) { setErr(e.message || 'Не удалось присоединиться'); setBusy(false) }
  }
  return (
    <div className="page" style={centered}>
      <BackBtn />
      <Header icon="key" tone="sage" title="Присоединиться к семье" sub="Введите код из приглашения и создайте свой вход." />
      <form className="stack" style={{ gap: 16 }} onSubmit={submit}>
        <div className="field"><label htmlFor="c">Код приглашения</label>
          <input className="input" id="c" value={invite} onChange={(e) => setInvite(e.target.value)} placeholder="HRT-САШ12" style={{ textAlign: 'center', letterSpacing: 4, fontWeight: 700, textTransform: 'uppercase' }} />
        </div>
        <div className="field"><label htmlFor="jn">Ваше имя</label><input className="input" id="jn" value={name} onChange={(e) => setName(e.target.value)} placeholder="Как вас зовут?" /></div>
        <div className="field"><label htmlFor="je">Эл. почта</label><input className="input" id="je" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="hello@hearth.com" /></div>
        <PasswordField id="jp" label="Придумайте пароль" placeholder="Минимум 8 символов" value={password} onChange={setPassword} />
        <Err msg={err} />
        <button className={'btn btn-primary btn-block' + (busy ? ' is-loading' : '')} type="submit" disabled={busy}>Присоединиться</button>
      </form>
    </div>
  )
}
