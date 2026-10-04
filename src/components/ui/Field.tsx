import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const base =
  'w-full rounded-lg border bg-white px-3.5 text-sm text-navy-900 placeholder:text-slate-400 transition focus:outline-none focus:ring-4 disabled:bg-slate-50 disabled:text-slate-500'
const ok = 'border-slate-300 focus:border-aqua-500 focus:ring-aqua-500/15'
const bad = 'border-red-400 focus:border-red-500 focus:ring-red-500/15'

interface Wrap { label?: string; error?: string; hint?: string; required?: boolean; className?: string }

function FieldWrap({ id, label, error, hint, required, className, children }: Wrap & { id: string; children: ReactNode }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-navy-800">
          {label} {required && <span className="text-aqua-600">*</span>}
        </label>
      )}
      {children}
      {error ? <p className="text-xs text-red-600">{error}</p> : hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
    </div>
  )
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & Wrap
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ label, error, hint, className, required, id, ...rest }, ref) {
  const auto = useId()
  const fid = id ?? auto
  return (
    <FieldWrap id={fid} label={label} error={error} hint={hint} required={required} className={className}>
      <input ref={ref} id={fid} required={required} aria-invalid={!!error} className={cn(base, 'h-11', error ? bad : ok)} {...rest} />
    </FieldWrap>
  )
})

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & Wrap
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ label, error, hint, className, required, id, ...rest }, ref) {
  const auto = useId()
  const fid = id ?? auto
  return (
    <FieldWrap id={fid} label={label} error={error} hint={hint} required={required} className={className}>
      <textarea ref={ref} id={fid} required={required} aria-invalid={!!error} className={cn(base, 'min-h-28 py-3', error ? bad : ok)} {...rest} />
    </FieldWrap>
  )
})

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & Wrap & { options: Array<string | { value: string; label: string }>; placeholder?: string }
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({ label, error, hint, className, required, id, options, placeholder, ...rest }, ref) {
  const auto = useId()
  const fid = id ?? auto
  return (
    <FieldWrap id={fid} label={label} error={error} hint={hint} required={required} className={className}>
      <div className="relative">
        <select ref={ref} id={fid} required={required} aria-invalid={!!error} className={cn(base, 'h-11 cursor-pointer appearance-none pr-9', error ? bad : ok)} {...rest}>
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => {
            const opt = typeof o === 'string' ? { value: o, label: o } : o
            return <option key={opt.value} value={opt.value}>{opt.label}</option>
          })}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-slate-400" />
      </div>
    </FieldWrap>
  )
})

/** Compact inline select used for changing status inside tables. */
export function InlineSelect({ value, onChange, options, disabled, className, 'aria-label': ariaLabel }: {
  value: string
  onChange: (v: string) => void
  options: Array<{ value: string; label: string }>
  disabled?: boolean
  className?: string
  'aria-label'?: string
}) {
  return (
    <div className={cn('relative inline-block', className)}>
      <select
        aria-label={ariaLabel}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        className="h-8 cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white pr-7 pl-2.5 text-xs font-medium text-navy-800 hover:border-slate-300 focus:border-aqua-500 focus:ring-4 focus:ring-aqua-500/15 focus:outline-none disabled:opacity-50"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-slate-400" />
    </div>
  )
}

export function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label?: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={(e) => { e.stopPropagation(); onChange(!checked) }}
      className={cn('relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:opacity-50', checked ? 'bg-aqua-500' : 'bg-slate-300')}
    >
      <span className={cn('inline-block size-5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-5.5' : 'translate-x-0.5')} />
    </button>
  )
}
