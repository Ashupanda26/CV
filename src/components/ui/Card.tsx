import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Card({ children, className, padded = false }: { children: ReactNode; className?: string; padded?: boolean }) {
  return <div className={cn('rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(11,23,36,0.04)]', padded && 'p-5 sm:p-6', className)}>{children}</div>
}

export function CardHeader({ title, description, action, className }: { title: string; description?: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6', className)}>
      <div>
        <h3 className="font-semibold text-navy-900">{title}</h3>
        {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-navy-900 sm:text-[28px]">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function StatCard({ label, value, icon: Icon, hint, accent = 'navy' }: { label: string; value: ReactNode; icon: LucideIcon; hint?: string; accent?: 'navy' | 'aqua' | 'amber' | 'green' | 'red' | 'violet' }) {
  const accents = {
    navy: 'bg-navy-900 text-white',
    aqua: 'bg-aqua-50 text-aqua-700',
    amber: 'bg-amber-50 text-amber-700',
    green: 'bg-emerald-50 text-emerald-700',
    red: 'bg-red-50 text-red-600',
    violet: 'bg-violet-50 text-violet-700',
  }
  return (
    <Card className="p-5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-navy-900/5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <div className={cn('flex size-9 items-center justify-center rounded-xl', accents[accent])}>
          <Icon className="size-[18px]" />
        </div>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-navy-900 tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </Card>
  )
}

/** Horizontal scroll wrapper + consistent table styling. */
export function DataTable({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm [&_td]:px-5 [&_td]:py-3.5 [&_th]:px-5 [&_th]:py-3 [&_th]:text-xs [&_th]:font-semibold [&_th]:tracking-wide [&_th]:text-slate-500 [&_th]:uppercase [&_thead]:bg-slate-50/80 [&_tbody_tr]:border-t [&_tbody_tr]:border-slate-100 [&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-slate-50/70">
        {children}
      </table>
    </div>
  )
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  const hue = [...name].reduce((h, c) => h + c.charCodeAt(0), 0) % 4
  const tones = ['bg-navy-900 text-white', 'bg-aqua-100 text-aqua-700', 'bg-slate-200 text-navy-800', 'bg-navy-700 text-aqua-200']
  return (
    <span className={cn('inline-flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold', tones[hue], className)}>
      {name.split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase()}
    </span>
  )
}

export function SearchInput({ value, onChange, placeholder = 'Search…', icon: Icon }: { value: string; onChange: (v: string) => void; placeholder?: string; icon: LucideIcon }) {
  return (
    <div className="relative w-full sm:w-72">
      <Icon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-10 w-full rounded-lg border border-slate-200 bg-white pr-3 pl-9 text-sm placeholder:text-slate-400 focus:border-aqua-500 focus:ring-4 focus:ring-aqua-500/15 focus:outline-none"
      />
    </div>
  )
}

export function FilterTabs<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: Array<{ value: T; label: string; count?: number }> }) {
  return (
    <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition',
            value === o.value ? 'bg-navy-900 text-white' : 'text-slate-600 hover:bg-slate-100',
          )}
        >
          {o.label}
          {o.count !== undefined && <span className={cn('rounded-md px-1.5 text-xs tabular-nums', value === o.value ? 'bg-white/15' : 'bg-slate-100 text-slate-500')}>{o.count}</span>}
        </button>
      ))}
    </div>
  )
}
