import {
  Archive,
  AtSign,
  BarChart3,
  Bot,
  ClipboardList,
  ChevronRight,
  CircleHelp,
  Headphones,
  Inbox,
  LayoutDashboard,
  ListFilter,
  Link2,
  Menu,
  MessageSquare,
  Package,
  PanelLeftClose,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Truck,
  Users,
  UsersRound,
  Warehouse,
  X,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useRef, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import type { InboxData, InboxView } from '../types/inbox'
import { CHANNELS, CURRENT_AGENT_ID, VIEW_LABELS } from '../lib/inbox'
import { ChannelIcon } from './shared'
import AccountMenu from './AccountMenu'
import type { Channel } from '../types/inbox'
import { useI18n } from '../i18n'
import { APP_MODE } from '../services/inboxService'
import {
  canAccessModule,
  getDefaultRoute,
  useAppAccess,
} from '../modules/operations/access'

const moduleLinks: { name: string; path: string; icon: LucideIcon }[] = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Inbox', path: '/inbox', icon: Inbox },
  { name: 'CRM', path: '/customers', icon: Users },
  { name: 'Customer Care', path: '/care', icon: Headphones },
  { name: 'Orders', path: '/orders', icon: ShoppingBag },
  { name: 'Logistics', path: '/logistics', icon: Truck },
  { name: 'Products', path: '/products', icon: Package },
  { name: 'Inventory', path: '/inventory', icon: Warehouse },
  { name: 'Market Intelligence', path: '/market-intelligence', icon: TrendingUp },
  { name: 'Reports', path: '/reports', icon: BarChart3 },
  { name: 'Admin', path: '/admin', icon: ShieldCheck },
]

const adminLinks: { path: string; label: [string, string]; icon: LucideIcon }[] = [
  { path: '/admin', label: ['Tổng quan quản trị', 'Admin overview'], icon: BarChart3 },
  { path: '/admin/sales', label: ['Báo cáo bán hàng', 'Sales reports'], icon: ShoppingBag },
  {
    path: '/admin/care',
    label: ['Tin nhắn & chăm sóc', 'Messages & care'],
    icon: Headphones,
  },
  {
    path: '/admin/work',
    label: ['Công việc & nhân sự', 'Work & staffing'],
    icon: ClipboardList,
  },
  {
    path: '/market-intelligence',
    label: ['Phân tích thị trường', 'Market intelligence'],
    icon: TrendingUp,
  },
  ...(APP_MODE === 'live'
    ? [
        {
          path: '/admin/team',
          label: ['Tài khoản & phân quyền', 'Accounts & permissions'] as [string, string],
          icon: UsersRound,
        },
      ]
    : []),
]

export function MainSidebar({
  onModule,
  onHelp,
  activeModule = 'Inbox',
  adminMode = false,
}: {
  onModule: (module: string) => void
  onHelp: () => void
  mode: 'demo' | 'live'
  activeModule?: string
  adminMode?: boolean
}) {
  const { t, label } = useI18n()
  const access = useAppAccess()
  const { pathname } = useLocation()
  const visibleModules = moduleLinks.filter(
    ({ name }) => canAccessModule(name, access) && (!adminMode || name === 'Admin'),
  )
  return (
    <nav className="main-sidebar" aria-label={t('Điều hướng chính', 'Main navigation')}>
      <Link
        to={adminMode ? '/admin' : getDefaultRoute(access)}
        className="brand-mark"
        aria-label="SmartSales Suite"
        title="SmartSales Suite"
      >
        <Zap size={26} fill="currentColor" strokeWidth={1.6} />
        <span>smartsales</span>
      </Link>
      <div className="module-navigation">
        {adminMode
          ? adminLinks.map(({ path, label: names, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                end
                aria-label={t(names[0], names[1])}
                title={t(names[0], names[1])}
                className={({ isActive }) =>
                  `module-link ${isActive ? 'active' : ''}`
                }
              >
                <Icon size={18} />
                <span>{t(names[0], names[1])}</span>
              </NavLink>
            ))
          : visibleModules.map(({ name, path, icon: Icon }) => {
              const active =
                name === 'Admin'
                  ? pathname.startsWith(path)
                  : name === 'Inbox'
                    ? activeModule === name && pathname === path
                    : activeModule === name || pathname === path
              const moduleLabel = label(name)
              return (
                <NavLink
                  key={name}
                  to={path}
                  end={name !== 'Admin'}
                  aria-label={moduleLabel}
                  title={moduleLabel}
                  aria-current={active ? 'page' : undefined}
                  className={`module-link ${active ? 'active' : ''}`}
                  onClick={(event) => {
                    if (name === 'Inbox' && pathname === path) {
                      event.preventDefault()
                      onModule(name)
                    }
                  }}
                >
                  <Icon size={18} />
                  <span>{moduleLabel}</span>
                </NavLink>
              )
            })}
      </div>
      <div className="nav-bottom">
        <button
          className="module-link nav-action"
          aria-label={t('Trợ giúp và phím tắt', 'Help and shortcuts')}
          title={t('Trợ giúp', 'Help')}
          onClick={onHelp}
        >
          <CircleHelp size={18} />
          <span>{t('Trợ giúp', 'Help')}</span>
        </button>
        {canAccessModule('Admin', access) && (
          <button
            className="module-link nav-action"
            aria-label={label('Settings')}
            title={label('Settings')}
            onClick={() => onModule('Settings')}
          >
            <Settings size={18} />
            <span>{label('Settings')}</span>
          </button>
        )}
        <AccountMenu />
      </div>
    </nav>
  )
}
export function ChannelBar({
  channel,
  onChannel,
  onMenu,
  mode,
  onConnections,
  canManageConnections = true,
}: {
  channel: Channel | 'all'
  onChannel: (channel: Channel | 'all') => void
  onMenu: () => void
  mode: 'demo' | 'live'
  onConnections: () => void
  canManageConnections?: boolean
}) {
  const { locale, setLocale, t, label } = useI18n()
  return (
    <header className="channel-bar">
      <div className="workspace-brand">
        <button
          className="icon-button mobile-menu"
          aria-label={t('Mở điều hướng hộp thư', 'Open inbox navigation')}
          onClick={onMenu}
        >
          <Menu size={20} />
        </button>
        <span className="brand-name">
          smartsales<span className="brand-dot">.</span>
        </span>
        <span className="suite-label">SUITE</span>
        <span className="header-divider" />
        <span className="workspace-label">
          {t('Không gian làm việc', 'Workspace')} <ChevronRight size={12} />{' '}
          <strong>{label('Inbox')}</strong>
        </span>
      </div>
      <div className="channel-integrations" aria-label={t('Lọc theo kênh', 'Filter by channel')}>
        {CHANNELS.map((c) => (
          <button
            key={c.id}
            className={`integration-button ${channel === c.id ? 'active' : ''}`}
            aria-label={t(`Lọc ${label(c.label)}`, `Filter ${c.label}`)}
            aria-pressed={channel === c.id}
            title={`${label(c.label)} · ${mode === 'demo' ? t('Kết nối mô phỏng', 'Simulated connection') : t('Chưa xác minh kết nối', 'Connection unverified')}`}
            onClick={() => onChannel(channel === c.id ? 'all' : c.id)}
          >
            <ChannelIcon channel={c.id} size={20} />
            <span className={`connection-dot ${mode === 'live' ? 'unverified' : ''}`} />
          </button>
        ))}
        {canManageConnections && (
          <button
            className="integration-button manage-connections"
            onClick={onConnections}
            aria-label={t('Quản lý nguồn tin nhắn', 'Manage message sources')}
            title={t('Quản lý nguồn tin nhắn', 'Manage message sources')}
          >
            <Link2 size={19} />
          </button>
        )}
      </div>
      <div
        className="language-switch"
        role="group"
        aria-label={t('Ngôn ngữ giao diện', 'Interface language')}
      >
        <button
          type="button"
          lang="vi"
          aria-label="Tiếng Việt"
          title="Tiếng Việt"
          aria-pressed={locale === 'vi'}
          onClick={() => setLocale('vi')}
        >
          VI
        </button>
        <button
          type="button"
          lang="en"
          aria-label="English"
          title="English"
          aria-pressed={locale === 'en'}
          onClick={() => setLocale('en')}
        >
          EN
        </button>
      </div>
      <div className="environment-pill">
        <span className="environment-dot" />
        {mode === 'demo'
          ? t('Không gian Demo', 'Demo workspace')
          : t('Không gian trực tiếp', 'Live workspace')}
      </div>
    </header>
  )
}
export function InboxSidebar({
  data,
  view,
  onView,
  collapsed,
  onCollapse,
  mobileOpen,
  onMobileClose,
  onHelp,
  mode,
}: {
  data: InboxData
  view: InboxView
  onView: (view: InboxView) => void
  collapsed: boolean
  onCollapse: () => void
  mobileOpen: boolean
  onMobileClose: () => void
  onHelp: () => void
  mode: 'demo' | 'live'
}) {
  const { t, label } = useI18n()
  const sidebarRef = useRef<HTMLElement>(null)
  useEffect(() => {
    if (!mobileOpen || window.innerWidth > 900) return
    const previous = document.activeElement as HTMLElement | null
    sidebarRef.current?.querySelector<HTMLElement>('.mobile-close')?.focus()
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      const buttons = Array.from(
        sidebarRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href]') || [],
      ).filter((button) => button.getClientRects().length > 0)
      const first = buttons[0],
        last = buttons.at(-1)
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
    document.addEventListener('keydown', trapFocus)
    return () => {
      document.removeEventListener('keydown', trapFocus)
      previous?.focus()
    }
  }, [mobileOpen])
  const count = (v: InboxView) =>
    data.conversations.filter((c) =>
      v === 'archive'
        ? c.status === 'closed'
        : c.status !== 'closed' &&
          c.unread > 0 &&
          (v === 'all' ||
            (v === 'mine' && c.assigneeId === CURRENT_AGENT_ID) ||
            (v === 'unassigned' && !c.assigneeId) ||
            (v === 'mentions' && c.mentioned) ||
            (v === 'bots' && c.bot) ||
            (v === 'teams' && c.teamId) ||
            (v === 'views' && ['high', 'urgent'].includes(c.priority))),
    ).length
  const primary = [
    { id: 'mine', icon: Inbox },
    { id: 'all', icon: MessageSquare },
    { id: 'unassigned', icon: UsersRound },
    { id: 'mentions', icon: AtSign },
    { id: 'bots', icon: Bot },
  ] as const
  const secondary = [
    { id: 'teams', icon: Users },
    { id: 'views', icon: ListFilter },
    { id: 'archive', icon: Archive },
  ] as const
  return (
    <>
      <aside
        ref={sidebarRef}
        className={`inbox-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}
        aria-label={t('Điều hướng hộp thư', 'Inbox navigation')}
      >
        <div className="inbox-sidebar-heading">
          <h1>
            {label('Inbox')}
            <span className="heading-dot" />
          </h1>
          <button
            className="icon-button collapse-control"
            onClick={onCollapse}
            aria-label={
              collapsed
                ? t('Mở rộng thanh bên', 'Expand sidebar')
                : t('Thu gọn thanh bên', 'Collapse sidebar')
            }
          >
            {collapsed ? <ChevronRight size={17} /> : <PanelLeftClose size={17} />}
          </button>
          <button
            className="icon-button mobile-close"
            aria-label={t('Đóng điều hướng', 'Close navigation')}
            onClick={onMobileClose}
          >
            <X size={18} />
          </button>
        </div>
        <div className="inbox-nav-group">
          <Link
            to="/dashboard"
            className="inbox-nav-item inbox-dashboard-link"
            onClick={onMobileClose}
          >
            <LayoutDashboard size={17} />
            <span>{label('Dashboard')}</span>
            <ChevronRight size={15} />
          </Link>
          {primary.map(({ id, icon: Icon }) => (
            <button
              key={id}
              title={label(VIEW_LABELS[id])}
              className={`inbox-nav-item ${view === id ? 'active' : ''}`}
              aria-current={view === id ? 'page' : undefined}
              onClick={() => onView(id)}
            >
              <Icon size={17} />
              <span className="inbox-nav-label">{label(VIEW_LABELS[id])}</span>
              <span
                className="inbox-count"
                aria-label={t(
                  `${count(id)} hội thoại chưa đọc`,
                  `${count(id)} unread conversations`,
                )}
              >
                {count(id)}
              </span>
            </button>
          ))}
        </div>
        <div className="sidebar-section-label">{t('QUẢN LÝ', 'MANAGE')}</div>
        <div className="inbox-nav-group secondary-group">
          {secondary.map(({ id, icon: Icon }) => (
            <button
              key={id}
              title={label(VIEW_LABELS[id])}
              className={`inbox-nav-item ${view === id ? 'active' : ''}`}
              onClick={() => onView(id)}
            >
              <Icon size={17} />
              <span className="inbox-nav-label">{label(VIEW_LABELS[id])}</span>
              <span className="inbox-count">{count(id)}</span>
            </button>
          ))}
        </div>
        <div className="sidebar-bottom">
          <div className="copilot-promo">
            <div className="promo-symbol">
              <Sparkles size={19} />
            </div>
            <strong>{t('Có trợ lý. Xử lý nhanh hơn.', 'A little help. A lot faster.')}</strong>
            <p>
              {t(
                'Trợ lý AI giúp bạn xử lý hội thoại hiệu quả hơn.',
                'Your AI copilot keeps every conversation moving.',
              )}
            </p>
            <button onClick={onHelp}>
              {t('Khám phá không gian làm việc', 'Explore your workspace')}{' '}
              <ChevronRight size={13} />
            </button>
          </div>
          <div className="workspace-status">
            <span className="online-dot" />
            <span>
              {mode === 'demo'
                ? t('Dữ liệu Demo · lưu tại máy', 'Demo data · saved locally')
                : t('Không gian API', 'API workspace')}
            </span>
            <span className="demo-caption">{mode.toUpperCase()}</span>
          </div>
        </div>
      </aside>
      {mobileOpen && <div className="navigation-overlay" onClick={onMobileClose} />}
    </>
  )
}
