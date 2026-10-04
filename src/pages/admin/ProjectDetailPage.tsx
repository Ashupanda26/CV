import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Calendar, Check, Circle, ImagePlus, MapPin, PoundSterling, User, Waves } from 'lucide-react'
import { useTable } from '@/hooks/useTable'
import { db } from '@/services/db'
import { useToast } from '@/context/ToastContext'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import { Card, CardHeader } from '@/components/ui/Card'
import { EmptyState, Skeleton, SmartImage } from '@/components/ui/Feedback'
import { InlineSelect } from '@/components/ui/Field'
import { Button, buttonClass } from '@/components/ui/Button'
import { WhatsAppIcon } from '@/components/ui/BrandIcons'
import { PROJECT_STATUSES } from '@/lib/constants'
import { pool } from '@/data/images'
import { openWhatsApp } from '@/lib/whatsapp'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import type { ProjectStatus, ProjectUpdate } from '@/types'

export default function ProjectDetailPage() {
  const { id } = useParams()
  const projects = useTable('projects')
  const updates = useTable('project_updates')
  const { data: customers } = useTable('customers')
  const toast = useToast()
  const confirm = useConfirm()
  const [busy, setBusy] = useState<string | null>(null)
  const [activeImg, setActiveImg] = useState(0)

  const project = projects.data.find((p) => p.id === id)
  const customer = customers.find((c) => c.id === project?.customer_id)
  const stages = useMemo(() => updates.data.filter((u) => u.project_id === id).sort((a, b) => a.sort_order - b.sort_order), [updates.data, id])
  const currentIdx = stages.findIndex((s) => !s.completed)

  if (projects.loading) return <div className="space-y-4"><Skeleton className="h-72" /><Skeleton className="h-96" /></div>
  if (!project) return <EmptyState title="Project not found" action={<Link to="/admin/projects" className={buttonClass('outline')}>Back to projects</Link>} />

  async function setStatus(status: ProjectStatus) {
    try {
      await db.update('projects', project!.id, { status })
      toast.success('Status updated')
    } catch (e) {
      toast.error('Update failed', e instanceof Error ? e.message : undefined)
    }
  }

  async function toggleStage(stage: ProjectUpdate, idx: number) {
    const completing = !stage.completed
    if (!completing && !(await confirm({ title: `Reopen “${stage.stage}”?`, message: 'This stage and every later stage will be marked as not complete.', confirmLabel: 'Reopen stage' }))) return
    setBusy(stage.id)
    try {
      // Completing a stage completes all earlier ones; reopening resets all later ones.
      const affected = stages.filter((s, i) => (completing ? i <= idx && !s.completed : i >= idx && s.completed))
      await Promise.all(
        affected.map((s) =>
          db.update('project_updates', s.id, { completed: completing, completed_at: completing ? new Date().toISOString() : null, note: completing ? `${s.stage} signed off.` : '' }),
        ),
      )
      const done = completing ? idx + 1 : idx
      const progress = Math.round((done / stages.length) * 100)
      const status: ProjectStatus = done === stages.length ? 'completed' : done >= 4 ? 'construction' : done === 3 ? 'approved' : done >= 1 ? 'design' : 'planning'
      await db.update('projects', project!.id, { progress, status })
      toast.success(completing ? `${stage.stage} completed` : `${stage.stage} reopened`, `Project is now ${progress}% complete.`)
    } catch (e) {
      toast.error('Update failed', e instanceof Error ? e.message : undefined)
    } finally {
      setBusy(null)
    }
  }

  async function addImage() {
    const next = [...project!.images, pool(project!.images.length + 5)]
    await db.update('projects', project!.id, { images: next })
    setActiveImg(next.length - 1)
    toast.success('Photo added', 'In production this opens an upload to Supabase Storage.')
  }

  const facts = [
    { icon: User, label: 'Customer', value: customer ? <Link to={`/admin/customers/${customer.id}`} className="text-aqua-700 hover:underline">{customer.name}</Link> : '—' },
    { icon: MapPin, label: 'Location', value: project.location },
    { icon: PoundSterling, label: 'Project value', value: formatCurrency(project.value) },
    { icon: Calendar, label: 'Start date', value: formatDate(project.start_date) },
    { icon: Calendar, label: 'Expected completion', value: formatDate(project.expected_completion) },
    { icon: Waves, label: 'Pool type', value: project.pool_type },
  ]

  return (
    <>
      <Link to="/admin/projects" className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-navy-900"><ArrowLeft className="size-4" /> Projects</Link>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-navy-900 sm:text-[28px]">{project.name}</h1>
          <p className="mt-1 text-sm text-slate-500">{project.description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <InlineSelect aria-label="Project status" value={project.status} onChange={(v) => setStatus(v as ProjectStatus)} options={PROJECT_STATUSES} className="[&_select]:h-10 [&_select]:text-sm" />
          {customer && (
            <Button variant="whatsapp" icon={<WhatsAppIcon className="size-4" />} onClick={() => openWhatsApp(customer.phone, `Hi ${customer.name.split(' ')[0]}, a quick update on ${project.name}: we're now ${project.progress}% complete${currentIdx >= 0 ? ` and working on ${stages[currentIdx]?.stage.toLowerCase()}` : ''}.`)}>
              Send update
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card className="overflow-hidden">
            <SmartImage src={project.images[activeImg] ?? project.images[0]} alt={project.name} className="aspect-[16/8] w-full object-cover" />
            <div className="flex gap-2 overflow-x-auto p-3">
              {project.images.map((src, i) => (
                <button key={i} onClick={() => setActiveImg(i)} className={cn('shrink-0 overflow-hidden rounded-lg ring-2 transition', activeImg === i ? 'ring-aqua-500' : 'ring-transparent opacity-70 hover:opacity-100')}>
                  <SmartImage src={src} alt="" className="h-16 w-24 object-cover" />
                </button>
              ))}
              <button onClick={addImage} className="flex h-16 w-24 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-200 text-xs text-slate-500 hover:border-aqua-400 hover:text-aqua-700">
                <ImagePlus className="size-4" /> Add photo
              </button>
            </div>
          </Card>

          <Card>
            <CardHeader title="Progress timeline" description="Click a stage to mark it complete — progress and status update automatically." />
            <div className="p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-aqua-500 to-aqua-400 transition-all duration-700" style={{ width: `${project.progress}%` }} /></div>
                <span className="text-sm font-semibold tabular-nums">{project.progress}%</span>
              </div>
              {updates.loading ? <Skeleton className="h-64" /> : (
                <ol className="relative">
                  {stages.map((s, i) => {
                    const current = i === currentIdx
                    return (
                      <li key={s.id} className="relative flex gap-4 pb-6 last:pb-0">
                        {i < stages.length - 1 && <span className={cn('absolute top-8 left-[15px] h-[calc(100%-2rem)] w-0.5', s.completed ? 'bg-aqua-500' : 'bg-slate-200')} />}
                        <button
                          onClick={() => toggleStage(s, i)}
                          disabled={busy !== null}
                          aria-label={s.completed ? `Reopen ${s.stage}` : `Complete ${s.stage}`}
                          className={cn(
                            'relative z-10 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full transition disabled:cursor-wait',
                            s.completed ? 'bg-aqua-500 text-white hover:bg-aqua-600' : current ? 'bg-white text-aqua-600 ring-2 ring-aqua-500 hover:bg-aqua-50' : 'bg-white text-slate-300 ring-2 ring-slate-200 hover:ring-slate-300',
                          )}
                        >
                          {s.completed ? <Check className="size-4" /> : current ? <span className="size-2.5 animate-pulse rounded-full bg-aqua-500" /> : <Circle className="size-3" />}
                        </button>
                        <div className="flex-1 pt-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className={cn('font-medium', s.completed || current ? 'text-navy-900' : 'text-slate-400')}>{s.stage}</p>
                            {current && <span className="rounded-full bg-aqua-50 px-2 py-0.5 text-xs font-semibold text-aqua-700 ring-1 ring-aqua-200">Current</span>}
                          </div>
                          {s.completed && <p className="text-xs text-slate-500">Completed {formatDate(s.completed_at)}{s.note ? ` · ${s.note}` : ''}</p>}
                        </div>
                      </li>
                    )
                  })}
                </ol>
              )}
            </div>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader title="Project details" />
          <dl className="divide-y divide-slate-100">
            {facts.map((f) => (
              <div key={f.label} className="flex items-start gap-3 px-6 py-4">
                <f.icon className="mt-0.5 size-4 shrink-0 text-slate-400" />
                <dt className="w-36 shrink-0 text-sm text-slate-500">{f.label}</dt>
                <dd className="text-sm font-medium text-navy-900">{f.value}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
    </>
  )
}
