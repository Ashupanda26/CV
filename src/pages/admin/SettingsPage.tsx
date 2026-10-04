import { useEffect, useState, type FormEvent } from 'react'
import { Database, RotateCcw, Save } from 'lucide-react'
import { db } from '@/services/db'
import { useSettings } from '@/context/SettingsContext'
import { useToast } from '@/context/ToastContext'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import { Card, CardHeader, PageHeader } from '@/components/ui/Card'
import { Input, Textarea } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import type { BusinessSettings } from '@/types'

export default function SettingsPage() {
  const current = useSettings()
  const toast = useToast()
  const confirm = useConfirm()
  const [form, setForm] = useState<BusinessSettings>(current)
  const [saving, setSaving] = useState(false)
  const [seeding, setSeeding] = useState(false)

  useEffect(() => setForm(current), [current])

  const set = (k: keyof BusinessSettings) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const dirty = JSON.stringify(form) !== JSON.stringify(current)

  async function onSave(e: FormEvent) {
    e.preventDefault()
    if (!/^\+?[\d\s]{10,16}$/.test(form.whatsapp_number)) return toast.error('Invalid WhatsApp number', 'Use international format, e.g. +44 7700 900000')
    setSaving(true)
    try {
      await db.saveSettings(form)
      toast.success('Settings saved', 'The public website has been updated.')
    } catch (err) {
      toast.error('Could not save settings', err instanceof Error ? err.message : undefined)
    } finally {
      setSaving(false)
    }
  }

  async function seed() {
    if (!(await confirm({ title: 'Load sample data?', message: 'This upserts the demo customers, projects, leads, quotes and more into your Supabase project. Existing rows with the same IDs are overwritten.', confirmLabel: 'Load sample data' }))) return
    setSeeding(true)
    try {
      await db.seedSupabase()
      toast.success('Sample data loaded')
    } catch (err) {
      toast.error('Seeding failed', err instanceof Error ? err.message : undefined)
    } finally {
      setSeeding(false)
    }
  }

  async function reset() {
    if (await confirm({ title: 'Reset demo data?', message: 'All changes made in this browser will be discarded and the original sample data restored.', confirmLabel: 'Reset', danger: true })) {
      db.resetDemo()
      toast.success('Demo data restored')
    }
  }

  return (
    <>
      <PageHeader title="Settings" description="Business details used across the website and dashboard." />
      <form onSubmit={onSave} className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader title="Business information" />
            <div className="grid gap-4 p-6 sm:grid-cols-2">
              <Input label="Company name" required value={form.company_name} onChange={set('company_name')} className="sm:col-span-2" />
              <Input label="Phone" required value={form.phone} onChange={set('phone')} />
              <Input label="Email" type="email" required value={form.email} onChange={set('email')} />
              <Input label="WhatsApp number" required value={form.whatsapp_number} onChange={set('whatsapp_number')} hint="International format — used by every WhatsApp button on the site." />
              <Input label="Business hours" value={form.business_hours} onChange={set('business_hours')} />
              <Textarea label="Address" rows={2} value={form.address} onChange={set('address')} className="sm:col-span-2" />
            </div>
          </Card>
          <Card>
            <CardHeader title="Social media" description="Leave blank to hide an icon in the footer." />
            <div className="grid gap-4 p-6 sm:grid-cols-2">
              <Input label="Instagram" type="url" value={form.instagram_url} onChange={set('instagram_url')} placeholder="https://instagram.com/…" />
              <Input label="Facebook" type="url" value={form.facebook_url} onChange={set('facebook_url')} placeholder="https://facebook.com/…" />
              <Input label="LinkedIn" type="url" value={form.linkedin_url} onChange={set('linkedin_url')} placeholder="https://linkedin.com/company/…" />
              <Input label="YouTube" type="url" value={form.youtube_url} onChange={set('youtube_url')} placeholder="https://youtube.com/@…" />
            </div>
          </Card>
          <div className="flex justify-end gap-2">
            <Button variant="outline" disabled={!dirty} onClick={() => setForm(current)}>Discard changes</Button>
            <Button type="submit" loading={saving} disabled={!dirty} icon={<Save className="size-4" />}>Save settings</Button>
          </div>
        </div>

        <Card className="h-fit">
          <CardHeader title="Data source" />
          <div className="space-y-4 p-6 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <span>Mode</span>
              {db.mode === 'supabase' ? <Badge tone="green">Supabase connected</Badge> : <Badge tone="aqua">Demo (browser storage)</Badge>}
            </div>
            {db.mode === 'supabase' ? (
              <>
                <p>Load the demo dataset into an empty Supabase project so the dashboard looks populated.</p>
                <Button variant="outline" className="w-full" loading={seeding} icon={<Database className="size-4" />} onClick={seed}>Load sample data</Button>
              </>
            ) : (
              <>
                <p>Changes are saved in this browser only. Add Supabase credentials to <code className="rounded bg-slate-100 px-1">.env</code> to use a real database.</p>
                <Button variant="outline" className="w-full" icon={<RotateCcw className="size-4" />} onClick={reset}>Reset demo data</Button>
              </>
            )}
          </div>
        </Card>
      </form>
    </>
  )
}
