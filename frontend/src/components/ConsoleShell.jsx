import { Activity, Bell, Boxes, LogOut, Menu, Moon, Radio, Settings2, Sun, Waypoints, X } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useSession } from '../auth/session.jsx'
import { useTheme } from '../theme/theme.jsx'

const navigation = [
  { to: '/', label: 'Overview', icon: Activity, end: true },
  { to: '/events', label: 'Event activity', icon: Radio },
  { to: '/dead-letter', label: 'Dead letter queue', icon: Boxes },
  { to: '/endpoints', label: 'Endpoints', icon: Waypoints },
]

const titleByPath = {
  '/': 'Overview', '/events': 'Event activity', '/dead-letter': 'Dead letter queue',
  '/endpoints': 'Endpoints', '/settings': 'Workspace settings',
}

function WorkspaceNavigation({ onNavigate }) {
  return <nav className="mt-2 space-y-0.5">{navigation.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} onClick={onNavigate} className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-colors ${isActive ? 'bg-[#edf2f7] text-[#1c4b70] dark:bg-[#1e3344] dark:text-[#a8d5ed]' : 'text-[#5e6978] hover:bg-[#f5f6f8] hover:text-[#172033] dark:text-[#aab5c0] dark:hover:bg-[#202a35] dark:hover:text-[#eef3f7]'}`}><Icon size={16} />{label}</NavLink>)}</nav>
}

export function ConsoleShell() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { session, signOut } = useSession()
  const { theme, toggleTheme } = useTheme()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const pageTitle = titleByPath[pathname] ?? 'HookRelay'

  function leaveConsole() { signOut(); navigate('/sign-in') }

  return <div className="min-h-screen bg-[#f5f6f8] text-[#182230] transition-colors dark:bg-[#11161d] dark:text-[#d9e1e8]">
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-[238px] border-r border-[#e2e5e9] bg-white dark:border-[#293440] dark:bg-[#151c24] lg:flex lg:flex-col">
      <Brand />
      <div className="px-3 pt-5"><p className="px-3 text-[10px] font-semibold uppercase tracking-[0.13em] text-[#98a1ad]">Workspace</p><WorkspaceNavigation /></div>
      <AccountPanel session={session} onSettings={() => navigate('/settings')} onSignOut={leaveConsole} />
    </aside>

    {mobileNavOpen && <div className="fixed inset-0 z-40 bg-[#101820]/35 lg:hidden" onClick={() => setMobileNavOpen(false)}>
      <aside className="h-full w-[280px] bg-white p-4 shadow-xl dark:bg-[#151c24]" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between"><Brand compact /><button onClick={() => setMobileNavOpen(false)} title="Close navigation" className="rounded-md p-2 text-[#6e7b87] hover:bg-[#f2f4f6] dark:hover:bg-[#202a35]"><X size={18} /></button></div><p className="mt-7 px-3 text-[10px] font-semibold uppercase tracking-[0.13em] text-[#98a1ad]">Workspace</p><WorkspaceNavigation onNavigate={() => setMobileNavOpen(false)} /></aside>
    </div>}

    <div className="lg:pl-[238px]">
      <header className="sticky top-0 z-10 flex h-[72px] items-center justify-between border-b border-[#e2e5e9] bg-white/95 px-5 backdrop-blur dark:border-[#293440] dark:bg-[#151c24]/95 lg:px-8">
        <div className="flex items-center gap-3"><button onClick={() => setMobileNavOpen(true)} title="Open navigation" className="rounded-md p-2 text-[#657382] hover:bg-[#f2f4f6] dark:text-[#b9c5cf] dark:hover:bg-[#202a35] lg:hidden"><Menu size={18} /></button><div><p className="text-[11px] font-medium text-[#8a94a0]">HookRelay / Console</p><h1 className="mt-0.5 text-lg font-semibold tracking-[-0.025em] text-[#172033] dark:text-[#eff4f8]">{pageTitle}</h1></div></div>
        <div className="flex items-center gap-3"><div className="hidden items-center gap-2 rounded-md border border-[#dce8df] bg-[#f5faf6] px-2.5 py-1.5 sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-[#2d8a57]" /><span className="font-mono text-[10px] font-medium text-[#39734e]">LIVE CONNECTION</span></div><button onClick={toggleTheme} title="Toggle color theme" className="grid h-8 w-8 place-items-center rounded-md border border-[#e2e5e9] text-[#788494] hover:bg-[#f6f7f9] dark:border-[#3a4653] dark:text-[#b7c2cc] dark:hover:bg-[#202a35]">{theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}</button><div className="relative"><button onClick={() => setNotificationsOpen((open) => !open)} aria-expanded={notificationsOpen} aria-label="Show delivery alerts" className="grid h-8 w-8 place-items-center rounded-md border border-[#e2e5e9] text-[#788494] hover:bg-[#f6f7f9] dark:border-[#3a4653] dark:text-[#b7c2cc] dark:hover:bg-[#202a35]"><Bell size={15} /></button>{notificationsOpen && <div className="absolute right-0 mt-2 w-72 rounded-lg border border-[#dfe5e9] bg-white p-4 shadow-lg dark:border-[#34414e] dark:bg-[#1b2530]"><p className="text-sm font-semibold text-[#263342] dark:text-[#eef3f7]">Delivery alerts</p><p className="mt-1 text-xs leading-5 text-[#71808e]">No unread alerts. Failed deliveries appear in the Dead Letter Queue.</p></div>}</div></div>
      </header>
      <main className="mx-auto max-w-[1540px] p-5 lg:p-8"><Outlet /></main>
    </div>
  </div>
}

function Brand({ compact = false }) {
  return <div className={`flex items-center gap-3 ${compact ? '' : 'h-[72px] border-b border-[#e9ebee] px-5 dark:border-[#293440]'}`}><div className="grid h-8 w-8 place-items-center rounded-lg bg-[#162435] text-white shadow-sm"><Activity size={17} /></div><div><p className="text-sm font-semibold tracking-[-0.02em] text-[#172033] dark:text-[#eef3f7]">HookRelay</p><p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#7b8494]">Operations console</p></div></div>
}

function AccountPanel({ session, onSettings, onSignOut }) {
  return <div className="mt-auto border-t border-[#e9ebee] p-3 dark:border-[#293440]"><button onClick={onSettings} className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium text-[#5e6978] hover:bg-[#f5f6f8] dark:text-[#aab5c0] dark:hover:bg-[#202a35]"><Settings2 size={16} /> Workspace settings</button><div className="mt-2 flex items-center gap-2 rounded-md border border-[#e6e9ed] p-2 dark:border-[#34414e]"><div className="grid h-7 w-7 place-items-center rounded-full bg-[#e8eef5] text-xs font-semibold text-[#385d7b]">{session?.name?.slice(0, 1).toUpperCase()}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-[#293242] dark:text-[#e6edf3]">{session?.name}</p><p className="truncate text-[10px] text-[#85909d]">Developer</p></div><button onClick={onSignOut} title="Sign out" className="text-[#88929e] hover:text-[#be3b3b]"><LogOut size={15} /></button></div></div>
}
