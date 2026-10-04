import { useRef, useState, type FormEvent } from 'react'
import { ExternalLink, Image as ImageIcon, MapPin, Pencil, Plus, Trash2, Upload } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTable } from '@/hooks/useTable'
import { db } from '@/services/db'
import { useToast } from '@/context/ToastContext'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import { Card, FilterTabs, PageHeader } from '@/components/ui/Card'
import { EmptyState, ErrorState, Skeleton, SmartImage } from '@/components/ui/Feedback'
import { Input, Select, Textarea, Toggle } from '@/components/ui/Field'
import { Badge } from '@/components/ui/Badge'
import { Button, buttonClass } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { GALLERY_CATEGORIES } from '@/lib/constants'
import { IMAGES } from '@/data/images'
import { cn } from '@/lib/utils'
import type { GalleryCategory, GalleryItem } from '@/types'

type FormState = Omit<GalleryItem, 'id' | 'created_at' | 'sort_order'>
const EMPTY: FormState = { title: '', category: 'New Pools', location: '', pool_type: '', description: '', image_url: '', published: true }

export default function GalleryAdminPage() {
  const { data, loading, error, refresh } = useTable('gallery_items')
  const toast = useToast()
  const confirm = useConfirm()
  const [filter, setFilter] = useState<'all' | GalleryCategory>('all')
  const [editing, setEditing] = useState<GalleryItem | 'new' | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const rows = data.filter((g) => filter === 'all' || g.category === filter).sort((a, b) => a.sort_order - b.sort_order)

  function openEditor(item: GalleryItem | 'new') {
    setEditing(item)
    setForm(item === 'new' ? { ...EMPTY, image_url: IMAGES.pools[0]! } : { title: item.title, category: item.category, location: item.location, pool_type: item.pool_type, description: item.description, image_url: item.image_url, published: item.published })
  }

  async function onSave(e: FormEvent) {
    e.preventDefault()
    if (!form.image_url) return toast.error('Please add an image')
    setSaving(true)
    try {
      if (editing === 'new') {
        await db.insert('gallery_items', { ...form, sort_order: Math.max(0, ...data.map((d) => d.sort_order)) + 1 })
        toast.success('Project added to gallery', form.published ? 'It is now live on the website.' : 'Saved as unpublished.')
      } else if (editing) {
        await db.update('gallery_items', editing.id, form)
        toast.success('Gallery item updated')
      }
      setEditing(null)
    } catch (err) {
      toast.error('Could not save', err instanceof Error ? err.message : undefined)
    } finally {
      setSaving(false)
    }
  }

  async function onDelete(item: GalleryItem) {
    if (!(await confirm({ title: 'Delete gallery item?', message: `“${item.title}” will be removed from the gallery and the public website.`, confirmLabel: 'Delete', danger: true }))) return
    try {
      await db.remove('gallery_items', item.id)
      toast.success('Deleted', item.title)
    } catch (err) {
      toast.error('Could not delete', err instanceof Error ? err.message : undefined)
    }
  }

  async function togglePublished(item: GalleryItem) {
    try {
      await db.update('gallery_items', item.id, { published: !item.published })
      toast.success(item.published ? 'Unpublished' : 'Published', item.title)
    } catch (err) {
      toast.error('Update failed', err instanceof Error ? err.message : undefined)
    }
  }

  async function onFile(file: File | undefined) {
    if (!file) return
    if (file.size > 10 * 1024 * 1024) return toast.error('Image too large', 'Please choose an image under 10MB.')
    setUploading(true)
    try {
      const url = await db.uploadImage(file)
      setForm((f) => ({ ...f, image_url: url }))
    } catch (err) {
      toast.error('Upload failed', err instanceof Error ? err.message : undefined)
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Gallery"
        description="Projects shown in the public website gallery."
        actions={<>
          <Link to="/#projects" target="_blank" className={buttonClass('outline')}><ExternalLink className="size-4" /> View on website</Link>
          <Button icon={<Plus className="size-4" />} onClick={() => openEditor('new')}>Add project</Button>
        </>}
      />
      <div className="mb-5">
        <FilterTabs value={filter} onChange={setFilter} options={[{ value: 'all', label: 'All', count: data.length }, ...GALLERY_CATEGORIES.map((c) => ({ value: c, label: c, count: data.filter((g) => g.category === c).length }))]} />
      </div>

      {error ? <Card><ErrorState message={error} onRetry={refresh} /></Card> : loading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-80 rounded-2xl" />)}</div>
      ) : rows.length === 0 ? (
        <Card><EmptyState icon={ImageIcon} title="No gallery items" description="Add your first project to show it on the website." action={<Button onClick={() => openEditor('new')}>Add project</Button>} /></Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((g) => (
            <Card key={g.id} className={cn('group overflow-hidden transition', !g.published && 'opacity-75')}>
              <div className="relative aspect-[16/10] overflow-hidden">
                <SmartImage src={g.image_url} alt={g.title} className={cn('size-full object-cover transition-transform duration-700 group-hover:scale-105', !g.published && 'grayscale')} />
                <div className="absolute top-3 left-3 flex gap-2">
                  <Badge tone="slate" dot={false} className="bg-white/90 backdrop-blur">{g.category}</Badge>
                </div>
                <div className="absolute top-3 right-3 flex gap-1.5 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                  <button onClick={() => openEditor(g)} className="rounded-lg bg-white/95 p-2 text-navy-900 shadow hover:bg-white" aria-label={`Edit ${g.title}`}><Pencil className="size-4" /></button>
                  <button onClick={() => onDelete(g)} className="rounded-lg bg-white/95 p-2 text-red-600 shadow hover:bg-white" aria-label={`Delete ${g.title}`}><Trash2 className="size-4" /></button>
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-navy-900">{g.title}</h3>
                <p className="mt-0.5 flex items-center gap-1 text-sm text-slate-500"><MapPin className="size-3.5" />{g.location}</p>
                <p className="mt-2 line-clamp-2 text-sm text-slate-600">{g.description}</p>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                  {g.published ? <Badge tone="green">Published</Badge> : <Badge tone="slate">Unpublished</Badge>}
                  <Toggle checked={g.published} onChange={() => togglePublished(g)} label={`Publish ${g.title}`} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Add gallery project' : 'Edit gallery project'}
        size="lg"
        footer={<><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button type="submit" form="gallery-form" loading={saving}>Save</Button></>}
      >
        <form id="gallery-form" onSubmit={onSave} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <p className="mb-1.5 text-sm font-medium text-navy-800">Image</p>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <SmartImage key={form.image_url} src={form.image_url} alt="" className="aspect-[16/9] w-full rounded-xl object-cover" />
              <div className="flex gap-2 sm:flex-col">
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
                <Button variant="outline" icon={<Upload className="size-4" />} loading={uploading} onClick={() => fileRef.current?.click()}>Upload</Button>
              </div>
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {IMAGES.pools.map((src) => (
                <button type="button" key={src} onClick={() => setForm({ ...form, image_url: src })} className={cn('shrink-0 overflow-hidden rounded-lg ring-2', form.image_url === src ? 'ring-aqua-500' : 'ring-transparent')}>
                  <SmartImage src={src.replace('w=1600', 'w=200')} alt="" className="h-12 w-16 object-cover" />
                </button>
              ))}
            </div>
            <Input className="mt-3" aria-label="Image URL" placeholder="…or paste an image URL" value={form.image_url.startsWith('data:') ? '' : form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
          </div>
          <Input label="Project name" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as GalleryCategory })} options={GALLERY_CATEGORIES} />
          <Input label="Location" required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <Input label="Pool type" value={form.pool_type} onChange={(e) => setForm({ ...form, pool_type: e.target.value })} />
          <Textarea label="Description" className="sm:col-span-2" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <label className="flex items-center gap-3 text-sm font-medium text-navy-800 sm:col-span-2">
            <Toggle checked={form.published} onChange={(v) => setForm({ ...form, published: v })} label="Published" />
            Published on website
          </label>
        </form>
      </Modal>
    </>
  )
}
