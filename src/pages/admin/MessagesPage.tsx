import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowLeft, CheckCheck, MessageSquare, Search, SendHorizontal } from 'lucide-react'
import { useTable } from '@/hooks/useTable'
import { db } from '@/services/db'
import { useToast } from '@/context/ToastContext'
import { Avatar, Card, PageHeader, SearchInput } from '@/components/ui/Card'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { WhatsAppIcon } from '@/components/ui/BrandIcons'
import { openWhatsApp } from '@/lib/whatsapp'
import { cn, formatDate, timeAgo } from '@/lib/utils'
import type { Message } from '@/types'

interface Thread { customerId: string; name: string; phone: string; project: string; last: Message; unread: number; messages: Message[] }

export default function MessagesPage() {
  const { data, loading, error, refresh } = useTable('messages')
  const { data: customers } = useTable('customers')
  const { data: projects } = useTable('projects')
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const bottom = useRef<HTMLDivElement>(null)
  const activeId = params.get('customer')

  const threads = useMemo<Thread[]>(() => {
    const byCustomer = new Map<string, Message[]>()
    data.forEach((m) => byCustomer.set(m.customer_id, [...(byCustomer.get(m.customer_id) ?? []), m]))
    return [...byCustomer.entries()]
      .map(([customerId, msgs]) => {
        const sorted = msgs.sort((a, b) => a.created_at.localeCompare(b.created_at))
        const c = customers.find((x) => x.id === customerId)
        const projectId = sorted.find((m) => m.project_id)?.project_id
        return {
          customerId,
          name: c?.name ?? 'Unknown',
          phone: c?.phone ?? '',
          project: projects.find((p) => p.id === projectId)?.name ?? 'General enquiry',
          last: sorted[sorted.length - 1]!,
          unread: sorted.filter((m) => m.status === 'unread').length,
          messages: sorted,
        }
      })
      .filter((t) => !q || t.name.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => b.last.created_at.localeCompare(a.last.created_at))
  }, [data, customers, projects, q])

  const active = threads.find((t) => t.customerId === activeId)

  // Opening a conversation marks its inbound messages as read.
  useEffect(() => {
    if (!active) return
    active.messages.filter((m) => m.status === 'unread').forEach((m) => db.update('messages', m.id, { status: 'read' }))
  }, [active])

  useEffect(() => bottom.current?.scrollIntoView({ block: 'end' }), [active?.messages.length, activeId])

  async function reply(e: FormEvent) {
    e.preventDefault()
    if (!active || !draft.trim()) return
    setSending(true)
    try {
      await db.insert('messages', {
        customer_id: active.customerId,
        project_id: active.messages.find((m) => m.project_id)?.project_id ?? null,
        direction: 'outbound',
        body: draft.trim(),
        status: 'replied',
        channel: 'whatsapp',
      })
      setDraft('')
      toast.success('Reply saved', 'Demo mode: logged to the conversation. Connect the WhatsApp Business API to deliver automatically.')
    } catch (err) {
      toast.error('Could not send reply', err instanceof Error ? err.message : undefined)
    } finally {
      setSending(false)
    }
  }

  const select = (id: string | null) => setParams(id ? { customer: id } : {})

  return (
    <>
      <PageHeader title="Messages" description="Customer conversations across WhatsApp." />
      {error ? <Card><ErrorState message={error} onRetry={refresh} /></Card> : (
        <Card className="grid h-[calc(100vh-220px)] min-h-[520px] overflow-hidden lg:grid-cols-[360px_1fr]">
          {/* conversation list */}
          <div className={cn('min-h-0 flex-col border-r border-slate-100', active ? 'hidden lg:flex' : 'flex')}>
            <div className="border-b border-slate-100 p-3"><SearchInput value={q} onChange={setQ} icon={Search} placeholder="Search conversations…" /></div>
            <ul className="flex-1 overflow-y-auto">
              {loading ? Array.from({ length: 6 }, (_, i) => <li key={i} className="flex gap-3 p-4"><Skeleton className="size-10 rounded-full" /><Skeleton className="h-10 flex-1" /></li>) :
                threads.length === 0 ? <EmptyState icon={MessageSquare} title="No conversations" /> :
                threads.map((t) => (
                  <li key={t.customerId}>
                    <button onClick={() => select(t.customerId)} className={cn('flex w-full cursor-pointer gap-3 border-b border-slate-50 px-4 py-3.5 text-left transition hover:bg-slate-50', activeId === t.customerId && 'bg-aqua-50/60 hover:bg-aqua-50')}>
                      <Avatar name={t.name} className="size-10" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className={cn('truncate text-sm', t.unread ? 'font-semibold text-navy-900' : 'font-medium text-navy-900')}>{t.name}</p>
                          <span className="shrink-0 text-[11px] text-slate-400">{timeAgo(t.last.created_at)}</span>
                        </div>
                        <p className="truncate text-xs text-aqua-700">{t.project}</p>
                        <div className="mt-0.5 flex items-center gap-2">
                          <p className={cn('flex-1 truncate text-xs', t.unread ? 'text-navy-800' : 'text-slate-500')}>
                            {t.last.direction === 'outbound' && <CheckCheck className="mr-1 inline size-3.5 text-sky-500" />}
                            {t.last.body}
                          </p>
                          {t.unread > 0 && <span className="rounded-full bg-[#25D366] px-1.5 text-[11px] font-semibold text-white">{t.unread}</span>}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
            </ul>
          </div>

          {/* chat pane */}
          {active ? (
            <div className="flex min-h-0 flex-col">
              <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
                <button onClick={() => select(null)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden" aria-label="Back"><ArrowLeft className="size-5" /></button>
                <Avatar name={active.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-navy-900">{active.name}</p>
                  <p className="truncate text-xs text-slate-500">{active.project} · {active.phone}</p>
                </div>
                <StatusBadge status={active.last.status} />
                <span className="hidden sm:block">
                  <Button size="sm" variant="whatsapp" icon={<WhatsAppIcon className="size-3.5" />} onClick={() => openWhatsApp(active.phone, `Hi ${active.name.split(' ')[0]}, `)}>
                    Send WhatsApp Message
                  </Button>
                </span>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto bg-[#efeae2] p-4 sm:p-6" style={{ backgroundImage: 'radial-gradient(rgba(0,0,0,0.035) 1px, transparent 1px)', backgroundSize: '16px 16px' }}>
                {active.messages.map((m, i) => {
                  const showDate = i === 0 || formatDate(m.created_at) !== formatDate(active.messages[i - 1]!.created_at)
                  return (
                    <div key={m.id}>
                      {showDate && <p className="my-3 text-center"><span className="rounded-md bg-white/80 px-2.5 py-1 text-[11px] text-slate-500 shadow-sm">{formatDate(m.created_at)}</span></p>}
                      <div className={cn('flex', m.direction === 'outbound' ? 'justify-end' : 'justify-start')}>
                        <div className={cn('max-w-[78%] rounded-lg px-3 py-2 text-sm text-slate-800 shadow-sm', m.direction === 'outbound' ? 'rounded-tr-none bg-[#d9fdd3]' : 'rounded-tl-none bg-white')}>
                          <p className="whitespace-pre-wrap">{m.body}</p>
                          <p className="mt-1 flex items-center justify-end gap-1 text-[10px] text-slate-500">
                            {new Date(m.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                            {m.direction === 'outbound' && <CheckCheck className="size-3.5 text-sky-500" />}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottom} />
              </div>
              <form onSubmit={reply} className="flex items-center gap-2 border-t border-slate-100 bg-slate-50 p-3">
                <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type a reply…" aria-label="Reply" className="h-11 flex-1 rounded-full border border-slate-200 bg-white px-4 text-sm focus:border-aqua-500 focus:ring-4 focus:ring-aqua-500/15 focus:outline-none" />
                <Button type="submit" loading={sending} disabled={!draft.trim()} className="h-11 rounded-full" icon={<SendHorizontal className="size-4" />}>Reply</Button>
                <Button variant="whatsapp" className="h-11 rounded-full sm:hidden" aria-label="Send WhatsApp Message" onClick={() => openWhatsApp(active.phone, draft || `Hi ${active.name.split(' ')[0]}, `)}><WhatsAppIcon className="size-4" /></Button>
              </form>
            </div>
          ) : (
            <div className="hidden items-center justify-center bg-slate-50/50 lg:flex">
              <EmptyState icon={MessageSquare} title="Select a conversation" description="Choose a customer on the left to view and reply to their messages." />
            </div>
          )}
        </Card>
      )}
    </>
  )
}
