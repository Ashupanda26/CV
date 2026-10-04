import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, FileEdit, Plus, Save, Send, Trash2 } from 'lucide-react'
import { useTable } from '@/hooks/useTable'
import { db } from '@/services/db'
import { useToast } from '@/context/ToastContext'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import { useSettings } from '@/context/SettingsContext'
import { Card, CardHeader } from '@/components/ui/Card'
import { EmptyState, Skeleton } from '@/components/ui/Feedback'
import { Input, Select, Textarea } from '@/components/ui/Field'
import { StatusBadge } from '@/components/ui/Badge'
import { Button, buttonClass } from '@/components/ui/Button'
import { WhatsAppIcon } from '@/components/ui/BrandIcons'
import { QUOTE_LINE_CATEGORIES, QUOTE_STATUSES, labelOf } from '@/lib/constants'
import { openWhatsApp } from '@/lib/whatsapp'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { QuoteStatus } from '@/types'

interface Line { key: string; category: string; description: string; amount: string }
const newLine = (category = 'Other costs', description = '', amount = ''): Line => ({ key: crypto.randomUUID(), category, description, amount })
const DEFAULT_LINES = () => QUOTE_LINE_CATEGORIES.map((c) => newLine(c))
const inDays = (d: number) => new Date(Date.now() + d * 86_400_000).toISOString().slice(0, 10)

export default function QuoteEditorPage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const isNew = !id
  const navigate = useNavigate()
  const toast = useToast()
  const confirm = useConfirm()
  const settings = useSettings()
  const quotes = useTable('quotes')
  const items = useTable('quote_items')
  const { data: customers } = useTable('customers')
  const { data: projects } = useTable('projects')

  const existing = quotes.data.find((q) => q.id === id)
  const [customerId, setCustomerId] = useState(params.get('customer') ?? '')
  const [projectId, setProjectId] = useState('')
  const [status, setStatus] = useState<QuoteStatus>('draft')
  const [notes, setNotes] = useState('Price includes VAT. 30% deposit on approval, staged payments thereafter.')
  const [validUntil, setValidUntil] = useState(inDays(30))
  const [lines, setLines] = useState<Line[]>(DEFAULT_LINES)
  const [saving, setSaving] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(isNew)

  // Load an existing quote into the form once its data arrives.
  useEffect(() => {
    if (isNew || hydrated || !existing || items.loading) return
    setCustomerId(existing.customer_id)
    setProjectId(existing.project_id ?? '')
    setStatus(existing.status)
    setNotes(existing.notes)
    setValidUntil(existing.valid_until)
    const mine = items.data.filter((i) => i.quote_id === existing.id).sort((a, b) => a.sort_order - b.sort_order)
    setLines(mine.length ? mine.map((i) => newLine(i.category, i.description, String(i.amount))) : DEFAULT_LINES())
    setHydrated(true)
  }, [isNew, hydrated, existing, items.loading, items.data])

  const total = useMemo(() => lines.reduce((s, l) => s + (Number(l.amount) || 0), 0), [lines])
  const customer = customers.find((c) => c.id === customerId)
  const customerProjects = projects.filter((p) => p.customer_id === customerId)

  if (!isNew && (quotes.loading || !hydrated)) {
    if (!quotes.loading && !existing) return <EmptyState title="Quote not found" action={<Link to="/admin/quotes" className={buttonClass('outline')}>Back to quotes</Link>} />
    return <div className="space-y-4"><Skeleton className="h-16" /><Skeleton className="h-96" /></div>
  }

  const updateLine = (key: string, patch: Partial<Line>) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)))

  async function save(nextStatus: QuoteStatus = status, label = 'Quote saved') {
    if (!customerId) {
      toast.error('Choose a customer', 'A quote must be linked to a customer.')
      return null
    }
    if (!lines.some((l) => Number(l.amount) > 0)) {
      toast.error('Add at least one priced line item')
      return null
    }
    setSaving(nextStatus + label)
    try {
      const payload = { customer_id: customerId, project_id: projectId || null, status: nextStatus, notes, valid_until: validUntil, total }
      let quoteId = existing?.id
      if (existing) {
        await db.update('quotes', existing.id, payload)
        await db.removeWhere('quote_items', 'quote_id', existing.id)
      } else {
        const created = await db.insert('quotes', { ...payload, quote_number: `Q-${new Date().getFullYear()}-${String(81 + quotes.data.length).padStart(4, '0')}` })
        quoteId = created.id
      }
      const priced = lines.filter((l) => l.description.trim() || Number(l.amount))
      for (const [i, l] of priced.entries()) {
        await db.insert('quote_items', { quote_id: quoteId!, category: l.category, description: l.description, amount: Number(l.amount) || 0, sort_order: i })
      }
      setStatus(nextStatus)
      toast.success(label, `${formatCurrency(total)} · ${labelOf(QUOTE_STATUSES, nextStatus)}`)
      if (!existing) navigate(`/admin/quotes/${quoteId}`, { replace: true })
      return quoteId
    } catch (e) {
      toast.error('Could not save quote', e instanceof Error ? e.message : undefined)
      return null
    } finally {
      setSaving(null)
    }
  }

  async function sendWhatsApp() {
    if (!customer) return toast.error('Choose a customer first')
    const ok = await save('sent', 'Quote marked as sent')
    if (!ok) return
    const summary = lines
      .filter((l) => Number(l.amount) > 0)
      .map((l) => `• ${l.category}: ${formatCurrency(Number(l.amount))}`)
      .join('\n')
    openWhatsApp(
      customer.phone,
      `Hi ${customer.name.split(' ')[0]}, here is your quote from ${settings.company_name}:\n\n${summary}\n\nTotal: ${formatCurrency(total)} (valid until ${formatDate(validUntil)}).\n\nAny questions, just reply here.`,
    )
    toast.info('Demo action', 'WhatsApp opened with the quote summary. With the WhatsApp Business API this sends automatically.')
  }

  async function remove() {
    if (!existing) return
    if (!(await confirm({ title: 'Delete quote?', message: `${existing.quote_number} and its line items will be permanently deleted.`, confirmLabel: 'Delete quote', danger: true }))) return
    await db.removeWhere('quote_items', 'quote_id', existing.id)
    await db.remove('quotes', existing.id)
    toast.success('Quote deleted')
    navigate('/admin/quotes')
  }

  return (
    <>
      <Link to="/admin/quotes" className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-navy-900"><ArrowLeft className="size-4" /> Quotes</Link>
      <div className="mb-6 flex flex-col gap-4 2xl:flex-row 2xl:items-end 2xl:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-navy-900 sm:text-[28px]">{existing ? existing.quote_number : 'New quote'}</h1>
            <StatusBadge status={status} label={labelOf(QUOTE_STATUSES, status)} />
          </div>
          <p className="mt-1 text-sm text-slate-500">{customer ? `For ${customer.name}` : 'Select a customer and add line items.'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {existing && <Button variant="ghost" icon={<Trash2 className="size-4" />} onClick={remove} className="text-red-600 hover:bg-red-50 hover:text-red-700">Delete</Button>}
          <Button variant="outline" icon={<FileEdit className="size-4" />} loading={saving === 'draftMarked as draft'} onClick={() => save('draft', 'Marked as draft')}>Mark as draft</Button>
          <Button variant="outline" icon={<Send className="size-4" />} loading={saving === 'sentMarked as sent'} onClick={() => save('sent', 'Marked as sent')}>Mark as sent</Button>
          <Button variant="outline" icon={<CheckCircle2 className="size-4" />} loading={saving === 'approvedMarked as approved'} onClick={() => save('approved', 'Marked as approved')}>Mark as approved</Button>
          <Button variant="whatsapp" icon={<WhatsAppIcon className="size-4" />} onClick={sendWhatsApp}>Send via WhatsApp</Button>
          <Button icon={<Save className="size-4" />} loading={saving === status + 'Quote saved'} onClick={() => save()}>Save quote</Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card padded>
            <div className="grid gap-4 sm:grid-cols-3">
              <Select label="Customer" required value={customerId} onChange={(e) => { setCustomerId(e.target.value); setProjectId('') }} placeholder="Select customer" options={customers.map((c) => ({ value: c.id, label: c.name }))} />
              <Select label="Project (optional)" value={projectId} onChange={(e) => setProjectId(e.target.value)} placeholder={customerProjects.length ? 'No project' : 'No projects for customer'} options={customerProjects.map((p) => ({ value: p.id, label: p.name }))} disabled={!customerProjects.length} />
              <Input label="Valid until" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
            </div>
          </Card>

          <Card>
            <CardHeader title="Line items" action={<Button size="sm" variant="outline" icon={<Plus className="size-3.5" />} onClick={() => setLines((l) => [...l, newLine()])}>Add line</Button>} />
            <div className="divide-y divide-slate-100">
              {lines.map((l) => (
                <div key={l.key} className="grid gap-3 px-5 py-4 sm:grid-cols-[180px_1fr_140px_auto] sm:items-center sm:px-6">
                  <Select aria-label="Category" value={l.category} onChange={(e) => updateLine(l.key, { category: e.target.value })} options={QUOTE_LINE_CATEGORIES} />
                  <Input aria-label="Description" value={l.description} onChange={(e) => updateLine(l.key, { description: e.target.value })} placeholder="Description" />
                  <div className="relative">
                    <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-slate-400">£</span>
                    <input aria-label="Amount" type="number" min={0} step={50} value={l.amount} onChange={(e) => updateLine(l.key, { amount: e.target.value })} placeholder="0" className="h-11 w-full rounded-lg border border-slate-300 pr-3 pl-7 text-right text-sm tabular-nums focus:border-aqua-500 focus:ring-4 focus:ring-aqua-500/15 focus:outline-none" />
                  </div>
                  <button onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))} className="justify-self-end rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Remove line">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          </Card>

          <Card padded>
            <Textarea label="Notes & terms" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </Card>
        </div>

        <Card className="h-fit overflow-hidden xl:sticky xl:top-24">
          <div className="bg-navy-900 px-6 py-5 text-white">
            <p className="text-xs tracking-[0.2em] text-aqua-300 uppercase">Quote summary</p>
            <p className="mt-2 text-4xl font-semibold tabular-nums">{formatCurrency(total)}</p>
            <p className="mt-1 text-xs text-slate-400">inc. VAT · valid until {formatDate(validUntil)}</p>
          </div>
          <dl className="divide-y divide-slate-100">
            {QUOTE_LINE_CATEGORIES.map((c) => {
              const v = lines.filter((l) => l.category === c).reduce((s, l) => s + (Number(l.amount) || 0), 0)
              return (
                <div key={c} className="flex justify-between px-6 py-3 text-sm">
                  <dt className="text-slate-600">{c}</dt>
                  <dd className="font-medium tabular-nums">{formatCurrency(v)}</dd>
                </div>
              )
            })}
            <div className="flex justify-between bg-slate-50 px-6 py-4">
              <dt className="font-semibold">Total</dt>
              <dd className="font-semibold tabular-nums">{formatCurrency(total)}</dd>
            </div>
          </dl>
        </Card>
      </div>
    </>
  )
}
