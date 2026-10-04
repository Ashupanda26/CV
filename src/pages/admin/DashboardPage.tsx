import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, CheckCircle2, ClipboardList, FolderKanban, HardHat, MessageSquare, Star, Target, Wrench, type LucideIcon,
} from 'lucide-react'
import { useTable } from '@/hooks/useTable'
import { Card, CardHeader, PageHeader, StatCard } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Feedback'
import { StatusBadge } from '@/components/ui/Badge'
import { EnquiriesStackedChart, LeadsAreaChart, ProjectStatusChart } from '@/components/admin/Charts'
import { useAuth } from '@/context/AuthContext'
import { PROJECT_STATUSES } from '@/lib/constants'
import { cn, formatCurrency, timeAgo } from '@/lib/utils'

interface Activity { id: string; icon: LucideIcon; tone: string; text: string; at: string; to: string }

const monthKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`
const lastMonths = (n: number) =>
  Array.from({ length: n }, (_, i) => {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - (n - 1 - i))
    return { key: monthKey(d), label: d.toLocaleDateString('en-GB', { month: 'short' }) }
  })

const ENQUIRY_GROUPS: Record<string, string> = {
  'New Pool Construction': 'New pools',
  'Pool Design': 'New pools',
  'Pool Renovation': 'Renovations',
  'Landscaping & Surrounds': 'Landscaping',
  'Pool Maintenance': 'Maintenance',
}
const GROUP_KEYS = ['New pools', 'Renovations', 'Landscaping', 'Maintenance']

export default function DashboardPage() {
  const { user } = useAuth()
  const leads = useTable('leads')
  const projects = useTable('projects')
  const quotes = useTable('quotes')
  const tickets = useTable('maintenance_tickets')
  const feedback = useTable('feedback')
  const customers = useTable('customers')
  const messages = useTable('messages')
  const loading = [leads, projects, quotes, tickets, feedback].some((t) => t.loading)

  const stats = useMemo(() => {
    const p = projects.data
    return {
      total: p.length,
      completed: p.filter((x) => x.status === 'completed').length,
      ongoing: p.filter((x) => ['design', 'approved', 'construction'].includes(x.status)).length,
      pipeline: p.filter((x) => x.status !== 'completed').reduce((s, x) => s + x.value, 0),
      newLeads: leads.data.filter((l) => l.status === 'new').length,
      pendingQuotes: quotes.data.filter((q) => q.status === 'draft' || q.status === 'sent').length,
      pendingValue: quotes.data.filter((q) => q.status === 'sent').reduce((s, q) => s + q.total, 0),
      openTickets: tickets.data.filter((t) => ['open', 'assigned', 'in_progress'].includes(t.status)).length,
      rating: feedback.data.length ? feedback.data.reduce((s, f) => s + f.rating, 0) / feedback.data.length : 0,
    }
  }, [projects.data, leads.data, quotes.data, tickets.data, feedback.data])

  const leadsByMonth = useMemo(() => {
    const months = lastMonths(12)
    const counts = new Map(months.map((m) => [m.key, 0]))
    leads.data.forEach((l) => {
      const k = monthKey(new Date(l.created_at))
      if (counts.has(k)) counts.set(k, counts.get(k)! + 1)
    })
    return months.map((m) => ({ month: m.label, leads: counts.get(m.key)! }))
  }, [leads.data])

  const enquiriesByMonth = useMemo(() => {
    const months = lastMonths(6)
    const rows = months.map((m) => ({ month: m.label, key: m.key, ...Object.fromEntries(GROUP_KEYS.map((k) => [k, 0])) })) as Array<Record<string, string | number>>
    leads.data.forEach((l) => {
      const row = rows.find((r) => r.key === monthKey(new Date(l.created_at)))
      const g = ENQUIRY_GROUPS[l.enquiry_type]
      if (row && g) row[g] = (row[g] as number) + 1
    })
    return rows
  }, [leads.data])

  const projectStatus = useMemo(
    () => PROJECT_STATUSES.map((s) => ({ status: s.label, count: projects.data.filter((p) => p.status === s.value).length })),
    [projects.data],
  )

  const activity = useMemo<Activity[]>(() => {
    const cust = new Map(customers.data.map((c) => [c.id, c.name]))
    const items: Activity[] = [
      ...leads.data.slice(0, 4).map((l) => ({ id: `l${l.id}`, icon: Target, tone: 'bg-blue-50 text-blue-600', text: `New quote request from ${l.name}`, at: l.created_at, to: '/admin/leads' })),
      ...tickets.data.slice(0, 2).map((t) => ({ id: `t${t.id}`, icon: Wrench, tone: 'bg-red-50 text-red-600', text: `New maintenance ticket #${t.ticket_number}: ${t.issue}`, at: t.created_at, to: '/admin/tickets' })),
      ...feedback.data.slice(0, 2).map((f) => ({ id: `f${f.id}`, icon: Star, tone: 'bg-amber-50 text-amber-600', text: `New ${f.rating}-star customer feedback from ${f.author_name}`, at: f.created_at, to: '/admin/feedback' })),
      ...quotes.data.slice(0, 2).map((q) => ({ id: `q${q.id}`, icon: ClipboardList, tone: 'bg-violet-50 text-violet-600', text: `Quote ${q.quote_number} for ${cust.get(q.customer_id) ?? 'customer'} ${q.status === 'draft' ? 'drafted' : `marked ${q.status}`}`, at: q.created_at, to: `/admin/quotes/${q.id}` })),
      ...messages.data.filter((m) => m.direction === 'inbound').slice(0, 2).map((m) => ({ id: `m${m.id}`, icon: MessageSquare, tone: 'bg-emerald-50 text-emerald-600', text: `WhatsApp message from ${cust.get(m.customer_id) ?? 'customer'}`, at: m.created_at, to: '/admin/messages' })),
      ...projects.data.filter((p) => p.status === 'construction').slice(0, 2).map((p, i) => ({ id: `p${p.id}`, icon: HardHat, tone: 'bg-aqua-50 text-aqua-700', text: `${p.name} project updated`, at: new Date(Date.now() - (i + 1) * 5.5 * 3600_000).toISOString(), to: `/admin/projects/${p.id}` })),
    ]
    return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 9)
  }, [leads.data, tickets.data, feedback.data, quotes.data, messages.data, projects.data, customers.data])

  const activeProjects = projects.data.filter((p) => p.status === 'construction' || p.status === 'approved').slice(0, 4)
  const hour = new Date().getHours()

  return (
    <>
      <PageHeader
        title={`Good ${hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'}, ${user?.name.split(' ')[0] ?? 'there'}`}
        description="Here’s what’s happening across BlueStone Pools today."
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 2xl:grid-cols-7">
        {loading
          ? Array.from({ length: 7 }, (_, i) => <Skeleton key={i} className="h-[124px] rounded-2xl" />)
          : (
            <>
              <StatCard label="Total Projects" value={stats.total} icon={FolderKanban} accent="navy" hint={`${formatCurrency(stats.pipeline)} in progress`} />
              <StatCard label="Completed" value={stats.completed} icon={CheckCircle2} accent="green" />
              <StatCard label="Ongoing" value={stats.ongoing} icon={HardHat} accent="amber" />
              <StatCard label="New Leads" value={stats.newLeads} icon={Target} accent="aqua" hint="Awaiting first contact" />
              <StatCard label="Pending Quotes" value={stats.pendingQuotes} icon={ClipboardList} accent="violet" hint={`${formatCurrency(stats.pendingValue)} sent`} />
              <StatCard label="Open Tickets" value={stats.openTickets} icon={Wrench} accent="red" />
              <StatCard label="Avg. Rating" value={<span className="flex items-baseline gap-1">{stats.rating.toFixed(1)}<Star className="size-5 fill-amber-400 text-amber-400" /></span>} icon={Star} accent="amber" hint={`${feedback.data.length} reviews`} />
            </>
          )}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3 [&>*]:min-w-0">
        <Card className="xl:col-span-2">
          <CardHeader title="Leads generated" description="New enquiries per month, last 12 months" />
          <div className="p-4 sm:p-6">{loading ? <Skeleton className="h-[260px]" /> : <LeadsAreaChart data={leadsByMonth} />}</div>
        </Card>
        <Card>
          <CardHeader title="Project status" description="All projects by current stage" />
          <div className="p-4 sm:p-6">{loading ? <Skeleton className="h-[260px]" /> : <ProjectStatusChart data={projectStatus} />}</div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3 [&>*]:min-w-0">
        <Card className="xl:col-span-2">
          <CardHeader title="Monthly enquiries" description="By enquiry type, last 6 months" />
          <div className="p-4 sm:p-6">{loading ? <Skeleton className="h-[280px]" /> : <EnquiriesStackedChart data={enquiriesByMonth} keys={GROUP_KEYS} />}</div>
        </Card>
        <Card>
          <CardHeader title="Recent activity" action={<Link to="/admin/leads" className="text-sm font-medium text-aqua-600 hover:text-aqua-700">View leads</Link>} />
          <ul className="divide-y divide-slate-100">
            {loading
              ? Array.from({ length: 6 }, (_, i) => <li key={i} className="flex gap-3 px-6 py-3.5"><Skeleton className="size-8 rounded-lg" /><Skeleton className="h-4 flex-1" /></li>)
              : activity.map((a) => (
                  <li key={a.id}>
                    <Link to={a.to} className="flex items-start gap-3 px-5 py-3 transition hover:bg-slate-50 sm:px-6">
                      <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', a.tone)}><a.icon className="size-4" /></span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-navy-900">{a.text}</p>
                        <p className="text-xs text-slate-500">{timeAgo(a.at)}</p>
                      </div>
                    </Link>
                  </li>
                ))}
          </ul>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Active builds" description="Projects currently approved or under construction" action={<Link to="/admin/projects" className="inline-flex items-center gap-1 text-sm font-medium text-aqua-600 hover:text-aqua-700">All projects <ArrowRight className="size-4" /></Link>} />
        <div className="grid gap-px bg-slate-100 sm:grid-cols-2 xl:grid-cols-4">
          {activeProjects.map((p) => (
            <Link key={p.id} to={`/admin/projects/${p.id}`} className="bg-white p-5 transition hover:bg-slate-50 sm:p-6">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-navy-900">{p.name}</p>
                <StatusBadge status={p.status} />
              </div>
              <p className="mt-1 text-sm text-slate-500">{p.location}</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-aqua-500 transition-all" style={{ width: `${p.progress}%` }} />
                </div>
                <span className="text-xs font-semibold text-navy-900 tabular-nums">{p.progress}%</span>
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </>
  )
}
