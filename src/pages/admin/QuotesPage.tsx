import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ClipboardList, Plus, Search } from 'lucide-react'
import { useTable } from '@/hooks/useTable'
import { Avatar, Card, DataTable, FilterTabs, PageHeader, SearchInput, StatCard } from '@/components/ui/Card'
import { EmptyState, ErrorState, TableSkeleton } from '@/components/ui/Feedback'
import { StatusBadge } from '@/components/ui/Badge'
import { buttonClass } from '@/components/ui/Button'
import { QUOTE_STATUSES, labelOf } from '@/lib/constants'
import { formatCurrency, formatDate } from '@/lib/utils'
import { CheckCircle2, FileEdit, Send } from 'lucide-react'
import type { QuoteStatus } from '@/types'

export default function QuotesPage() {
  const { data, loading, error, refresh } = useTable('quotes')
  const { data: customers } = useTable('customers')
  const navigate = useNavigate()
  const [status, setStatus] = useState<'all' | QuoteStatus>('all')
  const [q, setQ] = useState('')
  const cust = useMemo(() => new Map(customers.map((c) => [c.id, c.name])), [customers])

  const rows = useMemo(() => {
    const t = q.toLowerCase()
    return data.filter((x) => (status === 'all' || x.status === status) && (!t || [x.quote_number, cust.get(x.customer_id) ?? ''].some((v) => v.toLowerCase().includes(t))))
  }, [data, status, q, cust])

  const sum = (s: QuoteStatus) => data.filter((x) => x.status === s).reduce((a, x) => a + x.total, 0)

  return (
    <>
      <PageHeader title="Quotes" description="Create, send and track customer quotations." actions={<Link to="/admin/quotes/new" className={buttonClass('primary')}><Plus className="size-4" /> New quote</Link>} />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Drafts" value={formatCurrency(sum('draft'))} icon={FileEdit} accent="violet" hint={`${data.filter((x) => x.status === 'draft').length} quotes`} />
        <StatCard label="Awaiting approval" value={formatCurrency(sum('sent'))} icon={Send} accent="aqua" hint={`${data.filter((x) => x.status === 'sent').length} quotes`} />
        <StatCard label="Approved" value={formatCurrency(sum('approved'))} icon={CheckCircle2} accent="green" hint={`${data.filter((x) => x.status === 'approved').length} quotes`} />
      </div>
      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
          <FilterTabs value={status} onChange={setStatus} options={[{ value: 'all', label: 'All', count: data.length }, ...QUOTE_STATUSES.map((s) => ({ ...s, count: data.filter((x) => x.status === s.value).length }))]} />
          <SearchInput value={q} onChange={setQ} icon={Search} placeholder="Search quotes…" />
        </div>
        {error ? <ErrorState message={error} onRetry={refresh} /> : loading ? <TableSkeleton /> : rows.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No quotes yet" description="Create your first quote to send to a customer." action={<Link to="/admin/quotes/new" className={buttonClass('primary')}>New quote</Link>} />
        ) : (
          <DataTable>
            <thead><tr><th>Quote</th><th>Customer</th><th>Created</th><th>Valid until</th><th>Status</th><th className="text-right">Total</th></tr></thead>
            <tbody>
              {rows.map((x) => (
                <tr key={x.id} className="cursor-pointer" onClick={() => navigate(`/admin/quotes/${x.id}`)}>
                  <td className="font-medium text-navy-900">{x.quote_number}</td>
                  <td><div className="flex items-center gap-3"><Avatar name={cust.get(x.customer_id) ?? '?'} className="size-8" />{cust.get(x.customer_id)}</div></td>
                  <td className="text-slate-600">{formatDate(x.created_at)}</td>
                  <td className="text-slate-600">{formatDate(x.valid_until)}</td>
                  <td><StatusBadge status={x.status} label={labelOf(QUOTE_STATUSES, x.status)} /></td>
                  <td className="text-right font-semibold text-navy-900 tabular-nums">{formatCurrency(x.total)}</td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </Card>
    </>
  )
}
