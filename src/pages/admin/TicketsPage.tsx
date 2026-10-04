import { useMemo, useState, type FormEvent } from 'react'
import { Plus, Search, Wrench } from 'lucide-react'
import { useTable } from '@/hooks/useTable'
import { db } from '@/services/db'
import { useToast } from '@/context/ToastContext'
import { Card, DataTable, FilterTabs, PageHeader, SearchInput } from '@/components/ui/Card'
import { EmptyState, ErrorState, TableSkeleton } from '@/components/ui/Feedback'
import { InlineSelect, Input, Select, Textarea } from '@/components/ui/Field'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { TICKET_PRIORITIES, TICKET_STATUSES, labelOf } from '@/lib/constants'
import { formatDateTime, timeAgo } from '@/lib/utils'
import type { MaintenanceTicket, TicketPriority, TicketStatus } from '@/types'

const TECHNICIANS = ['Ben Carter', 'Liam Ford', 'Sam Okafor']
const EMPTY = { customer_id: '', project_id: '', issue: '', description: '', priority: 'medium' as TicketPriority }

export default function TicketsPage() {
  const { data, loading, error, refresh } = useTable('maintenance_tickets')
  const { data: customers } = useTable('customers')
  const { data: projects } = useTable('projects')
  const toast = useToast()
  const [status, setStatus] = useState<'all' | TicketStatus>('all')
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<MaintenanceTicket | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  const cust = useMemo(() => new Map(customers.map((c) => [c.id, c.name])), [customers])
  const proj = useMemo(() => new Map(projects.map((p) => [p.id, p.name])), [projects])
  const rows = useMemo(() => {
    const t = q.toLowerCase()
    return data
      .filter((x) => (status === 'all' || x.status === status) && (!t || [x.issue, String(x.ticket_number), cust.get(x.customer_id) ?? ''].some((v) => v.toLowerCase().includes(t))))
      .sort((a, b) => b.ticket_number - a.ticket_number)
  }, [data, status, q, cust])

  async function patch(t: MaintenanceTicket, p: Partial<MaintenanceTicket>, msg: string) {
    try {
      // Assigning a technician to an open ticket moves it to "assigned".
      const next = p.assigned_to && t.status === 'open' ? { ...p, status: 'assigned' as const } : p
      const updated = await db.update('maintenance_tickets', t.id, next)
      setSelected((s) => (s?.id === t.id ? updated : s))
      toast.success(`Ticket #${t.ticket_number} updated`, msg)
    } catch (e) {
      toast.error('Update failed', e instanceof Error ? e.message : undefined)
    }
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const n = Math.max(1000, ...data.map((t) => t.ticket_number)) + 1
      await db.insert('maintenance_tickets', { ...form, project_id: form.project_id || null, ticket_number: n, status: 'open', assigned_to: '' })
      toast.success(`Ticket #${n} created`)
      setOpen(false)
      setForm(EMPTY)
    } catch (err) {
      toast.error('Could not create ticket', err instanceof Error ? err.message : undefined)
    } finally {
      setSaving(false)
    }
  }

  const techOptions = [{ value: '', label: 'Unassigned' }, ...TECHNICIANS.map((t) => ({ value: t, label: t }))]

  return (
    <>
      <PageHeader title="Maintenance Tickets" description="Customer support and aftercare requests." actions={<Button icon={<Plus className="size-4" />} onClick={() => setOpen(true)}>New ticket</Button>} />
      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
          <FilterTabs value={status} onChange={setStatus} options={[{ value: 'all', label: 'All', count: data.length }, ...TICKET_STATUSES.map((s) => ({ ...s, count: data.filter((x) => x.status === s.value).length }))]} />
          <SearchInput value={q} onChange={setQ} icon={Search} placeholder="Search tickets…" />
        </div>
        {error ? <ErrorState message={error} onRetry={refresh} /> : loading ? <TableSkeleton /> : rows.length === 0 ? (
          <EmptyState icon={Wrench} title="No tickets" description="Nothing needs attention — nice." />
        ) : (
          <DataTable>
            <thead><tr><th>Ticket</th><th>Customer / Project</th><th>Issue</th><th>Priority</th><th>Status</th><th>Assigned</th><th>Opened</th></tr></thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id} className="cursor-pointer" onClick={() => setSelected(t)}>
                  <td className="font-semibold text-navy-900">#{t.ticket_number}</td>
                  <td><p className="font-medium text-navy-900">{cust.get(t.customer_id)}</p><p className="text-xs text-slate-500">{t.project_id ? proj.get(t.project_id) : '—'}</p></td>
                  <td className="max-w-64"><p className="truncate text-slate-700">{t.issue}</p></td>
                  <td><StatusBadge status={t.priority} /></td>
                  <td><InlineSelect aria-label="Ticket status" value={t.status} onChange={(v) => patch(t, { status: v as TicketStatus }, labelOf(TICKET_STATUSES, v))} options={TICKET_STATUSES} /></td>
                  <td><InlineSelect aria-label="Assign technician" value={t.assigned_to} onChange={(v) => patch(t, { assigned_to: v }, v ? `Assigned to ${v}` : 'Unassigned')} options={techOptions} /></td>
                  <td className="whitespace-nowrap text-slate-500">{timeAgo(t.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </Card>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected ? `Ticket #${selected.ticket_number}` : ''} description={selected ? `Opened ${formatDateTime(selected.created_at)}` : ''}>
        {selected && (
          <div className="space-y-5">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-slate-50 p-3"><dt className="text-xs text-slate-500">Customer</dt><dd className="font-medium">{cust.get(selected.customer_id)}</dd></div>
              <div className="rounded-xl bg-slate-50 p-3"><dt className="text-xs text-slate-500">Project</dt><dd className="font-medium">{selected.project_id ? proj.get(selected.project_id) : '—'}</dd></div>
              <div className="rounded-xl bg-slate-50 p-3"><dt className="text-xs text-slate-500">Priority</dt><dd className="mt-1"><StatusBadge status={selected.priority} /></dd></div>
              <div className="rounded-xl bg-slate-50 p-3"><dt className="text-xs text-slate-500">Assigned to</dt><dd className="font-medium">{selected.assigned_to || 'Unassigned'}</dd></div>
            </dl>
            <div>
              <p className="font-semibold text-navy-900">{selected.issue}</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{selected.description}</p>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">Update status</p>
              <div className="flex flex-wrap gap-2">
                {TICKET_STATUSES.map((s) => (
                  <Button key={s.value} size="sm" variant={selected.status === s.value ? 'primary' : 'outline'} onClick={() => patch(selected, { status: s.value }, s.label)}>{s.label}</Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={open} onClose={() => setOpen(false)} title="New maintenance ticket" footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" form="ticket-form" loading={saving}>Create ticket</Button></>}>
        <form id="ticket-form" onSubmit={onCreate} className="grid gap-4 sm:grid-cols-2">
          <Select label="Customer" required value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value, project_id: '' })} placeholder="Select customer" options={customers.map((c) => ({ value: c.id, label: c.name }))} />
          <Select label="Project" value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })} placeholder="None" options={projects.filter((p) => p.customer_id === form.customer_id).map((p) => ({ value: p.id, label: p.name }))} />
          <Input label="Issue" required className="sm:col-span-2" value={form.issue} onChange={(e) => setForm({ ...form, issue: e.target.value })} placeholder="e.g. Pool pump not working" />
          <Select label="Priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as TicketPriority })} options={TICKET_PRIORITIES} />
          <Textarea label="Details" className="sm:col-span-2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
        </form>
      </Modal>
    </>
  )
}
