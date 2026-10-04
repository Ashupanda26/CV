import { useMemo, useState } from 'react'
import { ExternalLink, Globe, Lock, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTable } from '@/hooks/useTable'
import { db } from '@/services/db'
import { useToast } from '@/context/ToastContext'
import { Card, FilterTabs, PageHeader, StatCard } from '@/components/ui/Card'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback'
import { Badge } from '@/components/ui/Badge'
import { Toggle } from '@/components/ui/Field'
import { buttonClass } from '@/components/ui/Button'
import { Stars } from '@/components/public/Reviews'
import { formatDate } from '@/lib/utils'
import type { Feedback } from '@/types'

export default function FeedbackPage() {
  const { data, setData, loading, error, refresh } = useTable('feedback')
  const { data: customers } = useTable('customers')
  const { data: projects } = useTable('projects')
  const toast = useToast()
  const [filter, setFilter] = useState<'all' | 'published' | 'private'>('all')
  const cust = useMemo(() => new Map(customers.map((c) => [c.id, c.name])), [customers])
  const proj = useMemo(() => new Map(projects.map((p) => [p.id, p.name])), [projects])

  const rows = data.filter((f) => filter === 'all' || (filter === 'published' ? f.published : !f.published))
  const avg = data.length ? data.reduce((s, f) => s + f.rating, 0) / data.length : 0

  async function togglePublish(f: Feedback) {
    const next = !f.published
    setData((rows) => rows.map((r) => (r.id === f.id ? { ...r, published: next } : r)))
    try {
      await db.update('feedback', f.id, { published: next })
      toast.success(next ? 'Published to website' : 'Removed from website', `Review by ${f.author_name}`)
    } catch (e) {
      setData((rows) => rows.map((r) => (r.id === f.id ? { ...r, published: !next } : r)))
      toast.error('Update failed', e instanceof Error ? e.message : undefined)
    }
  }

  return (
    <>
      <PageHeader title="Feedback" description="Choose which reviews appear on the public website." actions={<Link to="/#reviews" className={buttonClass('outline')}><ExternalLink className="size-4" /> View on website</Link>} />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Average rating" value={avg.toFixed(1)} icon={Star} accent="amber" hint={`${data.length} reviews`} />
        <StatCard label="Published" value={data.filter((f) => f.published).length} icon={Globe} accent="green" />
        <StatCard label="Private" value={data.filter((f) => !f.published).length} icon={Lock} accent="violet" />
      </div>
      <div className="mb-4">
        <FilterTabs value={filter} onChange={setFilter} options={[{ value: 'all', label: 'All', count: data.length }, { value: 'published', label: 'Published', count: data.filter((f) => f.published).length }, { value: 'private', label: 'Private', count: data.filter((f) => !f.published).length }]} />
      </div>
      {error ? <Card><ErrorState message={error} onRetry={refresh} /></Card> : loading ? (
        <div className="grid gap-4 lg:grid-cols-2">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}</div>
      ) : rows.length === 0 ? (
        <Card><EmptyState icon={Star} title="No feedback here" /></Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {rows.map((f) => (
            <Card key={f.id} padded className="flex flex-col">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-navy-900">{cust.get(f.customer_id) ?? f.author_name}</p>
                  <p className="text-sm text-slate-500">{f.project_id ? proj.get(f.project_id) : '—'} · {formatDate(f.created_at)}</p>
                </div>
                <Stars rating={f.rating} />
              </div>
              <p className="mt-4 flex-1 leading-relaxed text-slate-700">“{f.comment}”</p>
              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                {f.published ? <Badge tone="green">Published</Badge> : <Badge tone="slate">Private</Badge>}
                <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-600">
                  Show on website
                  <Toggle checked={f.published} onChange={() => togglePublish(f)} label={`Publish review by ${f.author_name}`} />
                </label>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
