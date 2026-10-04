import type { ReactNode } from 'react'
import { cn, titleCase } from '@/lib/utils'

export type Tone = 'slate' | 'blue' | 'aqua' | 'amber' | 'violet' | 'green' | 'red' | 'orange'

const TONES: Record<Tone, string> = {
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
  blue: 'bg-blue-50 text-blue-700 ring-blue-200',
  aqua: 'bg-aqua-50 text-aqua-700 ring-aqua-200',
  amber: 'bg-amber-50 text-amber-800 ring-amber-200',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  orange: 'bg-orange-50 text-orange-700 ring-orange-200',
}
const DOTS: Record<Tone, string> = {
  slate: 'bg-slate-400', blue: 'bg-blue-500', aqua: 'bg-aqua-500', amber: 'bg-amber-500',
  violet: 'bg-violet-500', green: 'bg-emerald-500', red: 'bg-red-500', orange: 'bg-orange-500',
}

/** Central mapping so every status renders the same colour everywhere. */
export const STATUS_TONE: Record<string, Tone> = {
  // leads
  new: 'blue', contacted: 'violet', site_visit: 'amber', quote_sent: 'aqua', won: 'green', lost: 'slate',
  // customers
  prospect: 'violet', active: 'aqua',
  // projects
  planning: 'slate', design: 'violet', approved: 'blue', construction: 'amber', completed: 'green',
  // quotes
  draft: 'slate', sent: 'blue', declined: 'red',
  // tickets
  open: 'red', assigned: 'violet', in_progress: 'amber', resolved: 'green', closed: 'slate',
  // priority
  low: 'slate', medium: 'blue', high: 'orange', urgent: 'red',
  // messages
  unread: 'blue', read: 'slate', replied: 'green',
  // publishing
  published: 'green', private: 'slate', hidden: 'slate',
}

export function Badge({ tone = 'slate', children, dot = true, className }: { tone?: Tone; children: ReactNode; dot?: boolean; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset', TONES[tone], className)}>
      {dot && <span className={cn('size-1.5 rounded-full', DOTS[tone])} />}
      {children}
    </span>
  )
}

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  return <Badge tone={STATUS_TONE[status] ?? 'slate'}>{label ?? titleCase(status)}</Badge>
}
