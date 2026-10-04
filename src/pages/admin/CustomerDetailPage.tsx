import { useMemo, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ClipboardList, FolderKanban, Mail, MapPin, MessageSquare, Phone, Plus, Wrench } from 'lucide-react'
import { useTable } from '@/hooks/useTable'
import { Avatar, Card, CardHeader } from '@/components/ui/Card'
import { EmptyState, Skeleton } from '@/components/ui/Feedback'
import { StatusBadge } from '@/components/ui/Badge'
import { Button, buttonClass } from '@/components/ui/Button'
import { WhatsAppIcon } from '@/components/ui/BrandIcons'
import { openWhatsApp } from '@/lib/whatsapp'
import { cn, formatCurrency, formatDate, timeAgo } from '@/lib/utils'
import { QUOTE_STATUSES, TICKET_STATUSES, labelOf } from '@/lib/constants'

function Section({ title, icon, count, action, children }: { title: string; icon: typeof Mail; count: number; action?: ReactNode; children: ReactNode }) {
  const Icon = icon
  return (
    <Card>
      <CardHeader title={`${title} (${count})`} action={action} />
      {count === 0 ? <EmptyState icon={Icon} title={`No ${title.toLowerCase()} yet`} /> : children}
    </Card>
  )
}

export default function CustomerDetailPage() {
  const { id } = useParams()
  const customers = useTable('customers')
  const projects = useTable('projects')
  const quotes = useTable('quotes')
  const messages = useTable('messages')
  const tickets = useTable('maintenance_tickets')

  const customer = customers.data.find((c) => c.id === id)
  const mine = useMemo(
    () => ({
      projects: projects.data.filter((p) => p.customer_id === id),
      quotes: quotes.data.filter((q) => q.customer_id === id),
      messages: messages.data.filter((m) => m.customer_id === id).sort((a, b) => a.created_at.localeCompare(b.created_at)),
      tickets: tickets.data.filter((t) => t.customer_id === id),
    }),
    [id, projects.data, quotes.data, messages.data, tickets.data],
  )

  if (customers.loading) return <div className="space-y-4"><Skeleton className="h-36" /><Skeleton className="h-64" /></div>
  if (!customer) return <EmptyState title="Customer not found" description="This customer may have been removed." action={<Link to="/admin/customers" className={buttonClass('outline')}>Back to customers</Link>} />

  const lifetime = mine.projects.reduce((s, p) => s + p.value, 0)

  return (
    <>
      <Link to="/admin/customers" className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-navy-900"><ArrowLeft className="size-4" /> Customers</Link>

      <Card className="mb-6 overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-navy-900 via-navy-700 to-aqua-700" />
        <div className="flex flex-col gap-5 px-6 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <Avatar name={customer.name} className="-mt-8 size-16 text-lg ring-4 ring-white" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold text-navy-900">{customer.name}</h1>
                <StatusBadge status={customer.status} />
              </div>
              <p className="text-sm text-slate-500">Customer since {formatDate(customer.created_at, { month: 'long', year: 'numeric' })} · {formatCurrency(lifetime)} lifetime value</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={`tel:${customer.phone}`} className={buttonClass('outline')}><Phone className="size-4" /> Call</a>
            <Button variant="whatsapp" icon={<WhatsAppIcon className="size-4" />} onClick={() => openWhatsApp(customer.phone, `Hi ${customer.name.split(' ')[0]}, `)}>WhatsApp</Button>
          </div>
        </div>
        <dl className="grid gap-px border-t border-slate-100 bg-slate-100 sm:grid-cols-3">
          {[
            [Phone, customer.phone],
            [Mail, customer.email],
            [MapPin, `${customer.address}${customer.postcode ? `, ${customer.postcode}` : ''}`],
          ].map(([Icon, v], i) => {
            const I = Icon as typeof Phone
            return <div key={i} className="flex items-center gap-2.5 bg-white px-6 py-4 text-sm text-slate-700"><I className="size-4 shrink-0 text-slate-400" /><span className="truncate">{v as string}</span></div>
          })}
        </dl>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Projects" icon={FolderKanban} count={mine.projects.length}>
          <ul className="divide-y divide-slate-100">
            {mine.projects.map((p) => (
              <li key={p.id}>
                <Link to={`/admin/projects/${p.id}`} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50">
                  <img src={p.images[0]} alt="" className="size-14 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-navy-900">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.pool_type}</p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-aqua-500" style={{ width: `${p.progress}%` }} /></div>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={p.status} />
                    <p className="mt-1 text-sm font-medium tabular-nums">{formatCurrency(p.value)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Quotes" icon={ClipboardList} count={mine.quotes.length} action={<Link to={`/admin/quotes/new?customer=${customer.id}`} className={buttonClass('outline', 'sm')}><Plus className="size-3.5" /> New quote</Link>}>
          <ul className="divide-y divide-slate-100">
            {mine.quotes.map((q) => (
              <li key={q.id}>
                <Link to={`/admin/quotes/${q.id}`} className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-slate-50">
                  <div><p className="font-medium text-navy-900">{q.quote_number}</p><p className="text-xs text-slate-500">{formatDate(q.created_at)}</p></div>
                  <div className="flex items-center gap-4"><span className="font-medium tabular-nums">{formatCurrency(q.total)}</span><StatusBadge status={q.status} label={labelOf(QUOTE_STATUSES, q.status)} /></div>
                </Link>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Messages" icon={MessageSquare} count={mine.messages.length} action={<Link to={`/admin/messages?customer=${customer.id}`} className="text-sm font-medium text-aqua-600 hover:text-aqua-700">Open conversation</Link>}>
          <div className="max-h-80 space-y-2 overflow-y-auto bg-[#efeae2] p-5">
            {mine.messages.map((m) => (
              <div key={m.id} className={cn('flex', m.direction === 'outbound' ? 'justify-end' : 'justify-start')}>
                <div className={cn('max-w-[80%] rounded-xl px-3 py-2 text-sm shadow-sm', m.direction === 'outbound' ? 'bg-[#d9fdd3]' : 'bg-white')}>
                  {m.body}
                  <p className="mt-1 text-right text-[10px] text-slate-500">{timeAgo(m.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Maintenance tickets" icon={Wrench} count={mine.tickets.length}>
          <ul className="divide-y divide-slate-100">
            {mine.tickets.map((t) => (
              <li key={t.id}>
                <Link to="/admin/tickets" className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-slate-50">
                  <div><p className="font-medium text-navy-900">#{t.ticket_number} · {t.issue}</p><p className="text-xs text-slate-500">{formatDate(t.created_at)}</p></div>
                  <div className="flex gap-2"><StatusBadge status={t.priority} /><StatusBadge status={t.status} label={labelOf(TICKET_STATUSES, t.status)} /></div>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </>
  )
}
