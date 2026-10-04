import { useMemo, useState } from 'react'
import { Mail, Phone, Search, Target, UserPlus } from 'lucide-react'
import { useTable } from '@/hooks/useTable'
import { db } from '@/services/db'
import { useToast } from '@/context/ToastContext'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import { Card, DataTable, FilterTabs, PageHeader, SearchInput, Avatar } from '@/components/ui/Card'
import { EmptyState, ErrorState, TableSkeleton } from '@/components/ui/Feedback'
import { InlineSelect } from '@/components/ui/Field'
import { StatusBadge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { WhatsAppIcon } from '@/components/ui/BrandIcons'
import { LEAD_STATUSES, labelOf } from '@/lib/constants'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import { openWhatsApp } from '@/lib/whatsapp'
import type { Lead, LeadStatus } from '@/types'

export default function LeadsPage() {
  const { data, setData, loading, error, refresh } = useTable('leads')
  const toast = useToast()
  const confirm = useConfirm()
  const [status, setStatus] = useState<'all' | LeadStatus>('all')
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<Lead | null>(null)
  const [converting, setConverting] = useState(false)

  const filtered = useMemo(() => {
    const term = q.toLowerCase()
    return data.filter(
      (l) => (status === 'all' || l.status === status) && (!term || [l.name, l.email, l.postcode, l.enquiry_type].some((v) => v.toLowerCase().includes(term))),
    )
  }, [data, status, q])

  const pipeline = data.filter((l) => !['won', 'lost'].includes(l.status)).reduce((s, l) => s + l.estimated_value, 0)

  async function changeStatus(lead: Lead, next: LeadStatus) {
    const prev = lead.status
    setData((rows) => rows.map((r) => (r.id === lead.id ? { ...r, status: next } : r))) // optimistic
    setSelected((s) => (s?.id === lead.id ? { ...s, status: next } : s))
    try {
      await db.update('leads', lead.id, { status: next })
      toast.success('Lead updated', `${lead.name} → ${labelOf(LEAD_STATUSES, next)}`)
    } catch (e) {
      setData((rows) => rows.map((r) => (r.id === lead.id ? { ...r, status: prev } : r)))
      toast.error('Could not update lead', e instanceof Error ? e.message : undefined)
    }
  }

  async function convert(lead: Lead) {
    const ok = await confirm({ title: 'Convert to customer?', message: `This creates a customer record for ${lead.name} so you can attach projects, quotes and tickets.`, confirmLabel: 'Create customer' })
    if (!ok) return
    setConverting(true)
    try {
      const c = await db.insert('customers', { name: lead.name, email: lead.email, phone: lead.phone, address: '', postcode: lead.postcode, status: 'prospect' })
      await db.update('leads', lead.id, { customer_id: c.id, status: lead.status === 'new' ? 'contacted' : lead.status })
      setSelected(null)
      toast.success('Customer created', `${lead.name} has been added to Customers.`)
    } catch (e) {
      toast.error('Could not convert lead', e instanceof Error ? e.message : undefined)
    } finally {
      setConverting(false)
    }
  }

  return (
    <>
      <PageHeader title="Leads" description={`${data.length} enquiries · ${formatCurrency(pipeline)} open pipeline`} />
      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
          <FilterTabs
            value={status}
            onChange={setStatus}
            options={[{ value: 'all', label: 'All', count: data.length }, ...LEAD_STATUSES.map((s) => ({ ...s, count: data.filter((l) => l.status === s.value).length }))]}
          />
          <SearchInput value={q} onChange={setQ} icon={Search} placeholder="Search leads…" />
        </div>
        {error ? (
          <ErrorState message={error} onRetry={refresh} />
        ) : loading ? (
          <TableSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Target} title="No leads found" description={q ? 'Try a different search term.' : 'New enquiries from the website will appear here.'} />
        ) : (
          <DataTable>
            <thead>
              <tr><th>Customer</th><th>Enquiry type</th><th>Date</th><th>Status</th><th className="text-right">Est. value</th><th>Contact</th></tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} className="cursor-pointer" onClick={() => setSelected(l)}>
                  <td>
                    <div className="flex items-center gap-3">
                      <Avatar name={l.name} />
                      <div>
                        <p className="font-medium text-navy-900">{l.name}</p>
                        <p className="text-xs text-slate-500">{l.postcode} · {l.source}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-slate-600">{l.enquiry_type}</td>
                  <td className="whitespace-nowrap text-slate-600">{formatDate(l.created_at)}</td>
                  <td><InlineSelect aria-label="Lead status" value={l.status} onChange={(v) => changeStatus(l, v as LeadStatus)} options={LEAD_STATUSES} /></td>
                  <td className="text-right font-medium text-navy-900 tabular-nums">{formatCurrency(l.estimated_value)}</td>
                  <td>
                    <div className="flex flex-col text-xs text-slate-500">
                      <a href={`tel:${l.phone}`} onClick={(e) => e.stopPropagation()} className="hover:text-aqua-700">{l.phone}</a>
                      <a href={`mailto:${l.email}`} onClick={(e) => e.stopPropagation()} className="truncate hover:text-aqua-700">{l.email}</a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </Card>

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ''}
        description={selected ? `${selected.enquiry_type} · received ${formatDateTime(selected.created_at)}` : ''}
        size="lg"
        footer={
          selected && (
            <>
              <Button variant="whatsapp" icon={<WhatsAppIcon className="size-4" />} onClick={() => openWhatsApp(selected.phone, `Hi ${selected.name.split(' ')[0]}, thanks for your enquiry with BlueStone Pools. When would be a good time for a quick call?`)}>WhatsApp</Button>
              {!selected.customer_id && <Button variant="primary" icon={<UserPlus className="size-4" />} loading={converting} onClick={() => convert(selected)}>Convert to customer</Button>}
            </>
          )
        }
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={selected.status} label={labelOf(LEAD_STATUSES, selected.status)} />
              <InlineSelect aria-label="Change status" value={selected.status} onChange={(v) => changeStatus(selected, v as LeadStatus)} options={LEAD_STATUSES} />
            </div>
            <dl className="grid gap-4 sm:grid-cols-2">
              {[
                ['Phone', <a href={`tel:${selected.phone}`} className="inline-flex items-center gap-1.5 hover:text-aqua-700"><Phone className="size-3.5" />{selected.phone}</a>],
                ['Email', <a href={`mailto:${selected.email}`} className="inline-flex items-center gap-1.5 break-all hover:text-aqua-700"><Mail className="size-3.5" />{selected.email}</a>],
                ['Postcode', selected.postcode],
                ['Budget', selected.budget],
                ['Estimated value', formatCurrency(selected.estimated_value)],
                ['Source', selected.source],
              ].map(([k, v]) => (
                <div key={k as string} className="rounded-xl bg-slate-50 p-3.5">
                  <dt className="text-xs text-slate-500">{k}</dt>
                  <dd className="mt-0.5 text-sm font-medium text-navy-900">{v}</dd>
                </div>
              ))}
            </dl>
            <div>
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Message</p>
              <p className="mt-2 rounded-xl border border-slate-200 p-4 text-sm leading-relaxed text-slate-700">{selected.message || 'No message provided.'}</p>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
