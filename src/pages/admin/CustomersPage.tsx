import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Plus, Search, Users } from 'lucide-react'
import { useTable } from '@/hooks/useTable'
import { db } from '@/services/db'
import { useToast } from '@/context/ToastContext'
import { Avatar, Card, DataTable, FilterTabs, PageHeader, SearchInput } from '@/components/ui/Card'
import { EmptyState, ErrorState, TableSkeleton } from '@/components/ui/Feedback'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Field'
import type { CustomerStatus } from '@/types'

const EMPTY = { name: '', email: '', phone: '', address: '', postcode: '', status: 'prospect' as CustomerStatus }

export default function CustomersPage() {
  const { data, loading, error, refresh } = useTable('customers')
  const { data: projects } = useTable('projects')
  const navigate = useNavigate()
  const toast = useToast()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<'all' | CustomerStatus>('all')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  const projectOf = useMemo(() => {
    const m = new Map<string, string[]>()
    projects.forEach((p) => m.set(p.customer_id, [...(m.get(p.customer_id) ?? []), p.name]))
    return m
  }, [projects])

  const rows = useMemo(() => {
    const t = q.toLowerCase()
    return data
      .filter((c) => (status === 'all' || c.status === status) && (!t || [c.name, c.email, c.address, c.postcode].some((v) => v.toLowerCase().includes(t))))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [data, q, status])

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const c = await db.insert('customers', form)
      toast.success('Customer added', c.name)
      setOpen(false)
      setForm(EMPTY)
      navigate(`/admin/customers/${c.id}`)
    } catch (err) {
      toast.error('Could not add customer', err instanceof Error ? err.message : undefined)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader title="Customers" description={`${data.length} customers`} actions={<Button icon={<Plus className="size-4" />} onClick={() => setOpen(true)}>Add customer</Button>} />
      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
          <FilterTabs
            value={status}
            onChange={setStatus}
            options={[
              { value: 'all', label: 'All', count: data.length },
              { value: 'prospect', label: 'Prospect', count: data.filter((c) => c.status === 'prospect').length },
              { value: 'active', label: 'Active', count: data.filter((c) => c.status === 'active').length },
              { value: 'completed', label: 'Completed', count: data.filter((c) => c.status === 'completed').length },
            ]}
          />
          <SearchInput value={q} onChange={setQ} icon={Search} placeholder="Search customers…" />
        </div>
        {error ? <ErrorState message={error} onRetry={refresh} /> : loading ? <TableSkeleton /> : rows.length === 0 ? (
          <EmptyState icon={Users} title="No customers found" description="Add a customer or convert a lead to get started." />
        ) : (
          <DataTable>
            <thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Address</th><th>Project</th><th>Status</th><th /></tr></thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="cursor-pointer" onClick={() => navigate(`/admin/customers/${c.id}`)}>
                  <td><div className="flex items-center gap-3"><Avatar name={c.name} /><span className="font-medium text-navy-900">{c.name}</span></div></td>
                  <td className="whitespace-nowrap text-slate-600">{c.phone}</td>
                  <td className="text-slate-600">{c.email}</td>
                  <td className="max-w-56 text-slate-600"><p className="truncate">{c.address}</p><p className="text-xs text-slate-400">{c.postcode}</p></td>
                  <td className="text-slate-600">{projectOf.get(c.id)?.join(', ') ?? <span className="text-slate-400">—</span>}</td>
                  <td><StatusBadge status={c.status} /></td>
                  <td className="text-right"><ChevronRight className="inline size-4 text-slate-400" /></td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Add customer" footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" form="customer-form" loading={saving}>Save customer</Button></>}>
        <form id="customer-form" onSubmit={onCreate} className="grid gap-4 sm:grid-cols-2">
          <Input label="Full name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="sm:col-span-2" />
          <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Phone" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="sm:col-span-2" />
          <Input label="Postcode" value={form.postcode} onChange={(e) => setForm({ ...form, postcode: e.target.value })} />
          <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as CustomerStatus })} options={[{ value: 'prospect', label: 'Prospect' }, { value: 'active', label: 'Active' }, { value: 'completed', label: 'Completed' }]} />
        </form>
      </Modal>
    </>
  )
}
