import { Suspense, useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell, ClipboardList, ExternalLink, FolderKanban, Image, LayoutDashboard, LogOut, Menu, MessageSquare,
  Settings, Star, Target, Users, Wrench, X, FlaskConical,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import { useTable } from '@/hooks/useTable'
import { db } from '@/services/db'
import { Logo } from '@/components/ui/BrandIcons'
import { Avatar } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Feedback'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/leads', label: 'Leads', icon: Target, badge: 'leads' as const },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/projects', label: 'Projects', icon: FolderKanban },
  { to: '/admin/quotes', label: 'Quotes', icon: ClipboardList },
  { to: '/admin/tickets', label: 'Maintenance Tickets', icon: Wrench, badge: 'tickets' as const },
  { to: '/admin/feedback', label: 'Feedback', icon: Star },
  { to: '/admin/messages', label: 'Messages', icon: MessageSquare, badge: 'messages' as const },
  { to: '/admin/gallery', label: 'Gallery', icon: Image },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { data: leads } = useTable('leads')
  const { data: tickets } = useTable('maintenance_tickets')
  const { data: messages } = useTable('messages')
  const counts = {
    leads: leads.filter((l) => l.status === 'new').length,
    tickets: tickets.filter((t) => t.status === 'open').length,
    messages: messages.filter((m) => m.status === 'unread').length,
  }

  return (
    <div className="flex h-full flex-col bg-navy-950 text-slate-300">
      <div className="flex h-16 items-center px-6">
        <Link to="/admin" onClick={onNavigate}><Logo light /></Link>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4" aria-label="Admin">
        {NAV.map((item) => {
          const count = item.badge ? counts[item.badge] : 0
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn('size-[18px]', isActive ? 'text-aqua-300' : 'text-slate-500 group-hover:text-slate-300')} />
                  <span className="flex-1">{item.label}</span>
                  {count > 0 && <span className="rounded-full bg-aqua-500 px-2 py-0.5 text-[11px] font-semibold text-navy-950 tabular-nums">{count}</span>}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>
      <div className="border-t border-white/10 p-3">
        <Link to="/" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400 hover:bg-white/5 hover:text-white">
          <ExternalLink className="size-[18px]" /> View public website
        </Link>
      </div>
    </div>
  )
}

export default function AdminLayout() {
  const { user, signOut } = useAuth()
  const confirm = useConfirm()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => setMobileOpen(false), [pathname])

  async function handleSignOut() {
    if (await confirm({ title: 'Sign out?', message: 'You will need to sign in again to access the dashboard.', confirmLabel: 'Sign out' })) {
      await signOut()
      navigate('/admin/login')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">
        <Sidebar />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-navy-950/60" onClick={() => setMobileOpen(false)} />
          <aside className="relative h-full w-72 max-w-[85vw] animate-[slide-in_0.25s_ease-out_reverse]">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 -right-12 rounded-full bg-white/10 p-2 text-white" aria-label="Close menu"><X className="size-5" /></button>
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        {user?.isDemo && (
          <div className="flex items-center justify-center gap-2 bg-aqua-400 px-4 py-1.5 text-center text-xs font-medium text-navy-950">
            <FlaskConical className="size-3.5" />
            Demo dashboard with sample data. Your changes stay in this browser only.
            <button onClick={async () => { if (await confirm({ title: 'Reset demo data?', message: 'This restores all original sample records and discards changes made in this browser.', confirmLabel: 'Reset data', danger: true })) db.resetDemo() }} className="ml-1 cursor-pointer underline underline-offset-2 hover:no-underline">Reset data</button>
          </div>
        )}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200 bg-white/85 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <button onClick={() => setMobileOpen(true)} className="-ml-1 rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Open menu">
            <Menu className="size-5" />
          </button>
          <div className="flex-1" />
          <Link to="/admin/messages" className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-navy-900" aria-label="Notifications">
            <Bell className="size-5" />
            <span className="absolute top-2 right-2 size-2 rounded-full bg-aqua-500 ring-2 ring-white" />
          </Link>
          <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
            <Avatar name={user?.name ?? 'Admin'} className="size-8" />
            <div className="hidden text-sm leading-tight sm:block">
              <p className="font-medium text-navy-900">{user?.name}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
            <button onClick={handleSignOut} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-navy-900" aria-label="Sign out" title="Sign out">
              <LogOut className="size-[18px]" />
            </button>
          </div>
        </header>
        <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Suspense fallback={<div className="flex justify-center py-24"><Spinner /></div>}>
            <div key={pathname} className="animate-fade-in">
              <Outlet />
            </div>
          </Suspense>
        </main>
      </div>
    </div>
  )
}
