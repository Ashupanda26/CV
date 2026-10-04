import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Calendar, FolderKanban, MapPin, Plus, Search } from 'lucide-react'
import { useTable } from '@/hooks/useTable'
import { db } from '@/services/db'
import { useToast } from '@/context/ToastContext'
import { Card, FilterTabs, PageHeader, SearchInput } from '@/components/ui/Card'
import { EmptyState, ErrorState, Skeleton, SmartImage } from '@/components/ui/Feedback'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Select, Textarea } from '@/components/ui/Field'
import { PROJECT_STATUSES, labelOf } from '@/lib/constants'
import { PROJECT_STAGES } from '@/data/mock'
import { pool } from '@/data/images'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { ProjectStatus } from '@/types'

const EMPTY = { name: '', customer_id: '', location: '', pool_type: '', value: '', start_date: '', expected_completion: '', status: 'planning' as ProjectStatus, description: '' }

export default function ProjectsPage() {
  const { data, loading, error, refresh } = useTable('projects')
  const { data: customers } = useTable('customers')
  const toast = useToast()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'all' | ProjectStatus>('all')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  const cust = useMemo(() => new Map(customers.map((c) => [c.id, c.name])), [customers])
  const rows = useMemo(() => {
    const t = q.toLowerCase()
    return data.filter((p) => (status === 'all' || p.status === status) && (!t || [p.name, p.location, cust.get(p.customer_id) ?? ''].some((v) => v.toLowerCase().includes(t))))
  }, [data, status, q, cust])

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const p = await db.insert('projects', {
        ...form,
        value: Number(form.value) || 0,
        progress: 0,
        images: [pool(data.length + 3)],
      })
      // Seed the standard build timeline for the new project.
      await Promise.all(
        PROJECT_STAGES.map((stage, i) =>
          db.insert('project_updates', { project_id: p.id, stage, note: '', sort_order: i, completed: false, completed_at: null }),
        ),
      )
      toast.success('Project created', p.name)
      setOpen(false)
      setForm(EMPTY)
      navigate(`/admin/projects/${p.id}`)
    } catch (err) {
      toast.error('Could not create project', err instanceof Error ? err.message : undefined)
    } finally {
      setSaving(false)
    }
  }

  const set = (k: keyof typeof EMPTY) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value })

  return (
    <>
      <PageHeader
        title="Projects"
        description={`${data.length} projects · ${formatCurrency(data.reduce((s, p) => s + p.value, 0))} total value`}
        actions={<Button icon={<Plus className="size-4" />} onClick={() => setOpen(true)}>New project</Button>}
      />
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterTabs value={status} onChange={setStatus} options={[{ value: 'all', label: 'All', count: data.length }, ...PROJECT_STATUSES.map((s) => ({ ...s, count: data.filter((p) => p.status === s.value).length }))]} />
        <SearchInput value={q} onChange={setQ} icon={Search} placeholder="Search projects…" />
      </div>

      {error ? <Card><ErrorState message={error} onRetry={refresh} /></Card> : loading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-80 rounded-2xl" />)}</div>
      ) : rows.length === 0 ? (
        <Card><EmptyState icon={FolderKanban} title="No projects found" description="Create a project to start tracking a build." /></Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((p) => (
            <Link key={p.id} to={`/admin/projects/${p.id}`} className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-navy-900/5">
              <div className="relative aspect-[16/9] overflow-hidden">
                <SmartImage src={p.images[0]} alt={p.name} className="size-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute top-3 left-3"><StatusBadge status={p.status} label={labelOf(PROJECT_STATUSES, p.status)} /></div>
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-navy-900">{p.name}</h3>
                    <p className="text-sm text-slate-500">{cust.get(p.customer_id)}</p>
                  </div>
                  <p className="font-semibold text-navy-900 tabular-nums">{formatCurrency(p.value)}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" />{p.location}</span>
                  <span className="inline-flex items-center gap-1"><Calendar className="size-3.5" />{formatDate(p.start_date, { day: 'numeric', month: 'short' })} → {formatDate(p.expected_completion, { day: 'numeric', month: 'short', year: '2-digit' })}</span>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-aqua-500" style={{ width: `${p.progress}%` }} /></div>
                  <span className="text-xs font-semibold tabular-nums">{p.progress}%</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New project" size="lg" footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" form="project-form" loading={saving}>Create project</Button></>}>
        <form id="project-form" onSubmit={onCreate} className="grid gap-4 sm:grid-cols-2">
          <Input label="Project name" required value={form.name} onChange={set('name')} placeholder="e.g. Hughes Garden Pool" />
          <Select label="Customer" required value={form.customer_id} onChange={set('customer_id')} placeholder="Select customer" options={customers.map((c) => ({ value: c.id, label: c.name }))} />
          <Input label="Location" required value={form.location} onChange={set('location')} placeholder="Town, County" />
          <Input label="Pool type" value={form.pool_type} onChange={set('pool_type')} placeholder="Rectangular concrete, 10m × 4m" />
          <Input label="Project value (£)" type="number" min={0} required value={form.value} onChange={set('value')} />
          <Select label="Status" value={form.status} onChange={set('status')} options={PROJECT_STATUSES} />
          <Input label="Start date" type="date" required value={form.start_date} onChange={set('start_date')} />
          <Input label="Expected completion" type="date" required value={form.expected_completion} onChange={set('expected_completion')} />
          <Textarea label="Description" className="sm:col-span-2" value={form.description} onChange={set('description')} rows={3} />
        </form>
      </Modal>
    </>
  )
}
