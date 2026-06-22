import type { CSSProperties } from 'react'
import {
  Plus, ArrowLeft, ClipboardList, ClipboardCheck, Delete, CalendarDays,
  CircleCheck, ChevronRight, Sparkles, X, Copy, CheckCheck, Leaf, Pencil,
  Users, Home, Hourglass, Share2, Flame, LogOut, BookOpen, MoreHorizontal,
  Film, Bell, BellRing, Coins, ListTodo, UserPlus, Camera, CircleAlert,
  Circle, Gift, RotateCcw, PiggyBank, Clock, Settings, Store, ShieldCheck,
  KeyRound, HousePlus, House, PartyPopper, Eye, EyeOff, type LucideIcon,
} from 'lucide-react'

// Map the Material-style names used across screens to lucide icons.
const MAP: Record<string, LucideIcon> = {
  add: Plus,
  arrow_back: ArrowLeft,
  assignment: ClipboardList,
  assignment_turned_in: ClipboardCheck,
  backspace: Delete,
  calendar_month: CalendarDays,
  check_circle: CircleCheck,
  chevron_right: ChevronRight,
  cleaning_services: Sparkles,
  close: X,
  content_copy: Copy,
  done_all: CheckCheck,
  eco: Leaf,
  edit: Pencil,
  group: Users,
  home: Home,
  hourglass_top: Hourglass,
  ios_share: Share2,
  local_fire_department: Flame,
  logout: LogOut,
  menu_book: BookOpen,
  more_horiz: MoreHorizontal,
  movie: Film,
  notifications: Bell,
  notifications_active: BellRing,
  paid: Coins,
  pending_actions: ListTodo,
  person_add: UserPlus,
  photo_camera: Camera,
  priority_high: CircleAlert,
  radio_button_unchecked: Circle,
  redeem: Gift,
  restart_alt: RotateCcw,
  savings: PiggyBank,
  schedule: Clock,
  settings: Settings,
  storefront: Store,
  verified_user: ShieldCheck,
  inventory_2: Store,
  key: KeyRound,
  add_home: HousePlus,
  cottage: House,
  celebration: PartyPopper,
  visibility: Eye,
  visibility_off: EyeOff,
}

export function Icon({
  name,
  size = 24,
  color = 'currentColor',
  style,
}: {
  name: string
  size?: number
  fill?: boolean // kept for API compatibility; lucide icons are outline
  color?: string
  style?: CSSProperties
}) {
  const Cmp = MAP[name] ?? Circle
  return <Cmp size={size} color={color} strokeWidth={2} style={style} />
}
