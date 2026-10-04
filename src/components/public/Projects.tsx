import { useEffect, useMemo, useState } from 'react'
import { ImageOff, MapPin, X } from 'lucide-react'
import { useTable } from '@/hooks/useTable'
import { SmartImage, Skeleton, EmptyState, ErrorState } from '@/components/ui/Feedback'
import { cn } from '@/lib/utils'
import { GALLERY_CATEGORIES } from '@/lib/constants'
import type { GalleryItem } from '@/types'

const FILTERS = ['All', ...GALLERY_CATEGORIES] as const
type Filter = (typeof FILTERS)[number]

export function Projects() {
  const { data, loading, error, refresh } = useTable('gallery_items')
  const [filter, setFilter] = useState<Filter>('All')
  const [active, setActive] = useState<GalleryItem | null>(null)

  const items = useMemo(
    () =>
      data
        .filter((g) => g.published && (filter === 'All' || g.category === filter))
        .sort((a, b) => a.sort_order - b.sort_order),
    [data, filter],
  )

  return (
    <section id="projects" className="scroll-mt-20 bg-white py-24 lg:py-36">
      <div className="container-x">
        <div className="max-w-2xl">
          <p className="eyebrow reveal">Selected Projects</p>
          <h2 className="section-title reveal mt-4">Pools we're proud to put our name to.</h2>
        </div>

        <div className="reveal mt-10 -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0" role="tablist" aria-label="Filter projects">
          {FILTERS.map((f) => (
            <button
              key={f}
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={cn(
                'shrink-0 cursor-pointer rounded-full border px-5 py-2.5 text-sm font-medium transition-all',
                filter === f ? 'border-navy-900 bg-navy-900 text-white' : 'border-slate-200 text-slate-600 hover:border-navy-900 hover:text-navy-900',
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="mt-10">
          {error ? (
            <ErrorState message={error} onRetry={refresh} />
          ) : loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="aspect-[4/5] rounded-3xl" />)}
            </div>
          ) : items.length === 0 ? (
            <EmptyState icon={ImageOff} title="No projects in this category yet" description="Check back soon — new projects are added as they complete." />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => setActive(p)}
                  className={cn('group relative block animate-fade-up cursor-pointer overflow-hidden rounded-3xl bg-navy-900 text-left', i % 5 === 0 && 'lg:row-span-1')}
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <SmartImage src={p.image_url} alt={p.title} className="aspect-[4/5] w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.06]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-navy-950/10 to-transparent" />
                  <span className="absolute top-5 left-5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-navy-900 backdrop-blur">{p.category}</span>
                  <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                    <p className="flex items-center gap-1.5 text-xs text-aqua-200"><MapPin className="size-3.5" />{p.location}</p>
                    <h3 className="mt-2 font-display text-[28px] leading-tight">{p.title}</h3>
                    <p className="mt-1 text-sm text-slate-300">{p.pool_type}</p>
                    <p className="mt-0 max-h-0 overflow-hidden text-sm leading-relaxed text-slate-300 opacity-0 transition-all duration-500 group-hover:mt-3 group-hover:max-h-24 group-hover:opacity-100">{p.description}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {active && <ProjectLightbox item={active} onClose={() => setActive(null)} />}
    </section>
  )
}

function ProjectLightbox({ item, onClose }: { item: GalleryItem; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])
  return (
    <div className="fixed inset-0 z-[80] flex animate-fade-in items-center justify-center bg-navy-950/90 p-4 backdrop-blur" onClick={onClose} role="dialog" aria-modal="true" aria-label={item.title}>
      <button onClick={onClose} className="absolute top-5 right-5 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" aria-label="Close">
        <X className="size-6" />
      </button>
      <div className="grid w-full max-w-5xl animate-scale-in overflow-hidden rounded-3xl bg-white md:grid-cols-5" onClick={(e) => e.stopPropagation()}>
        <SmartImage src={item.image_url.replace('w=1600', 'w=2000')} alt={item.title} className="aspect-[4/3] w-full object-cover md:col-span-3 md:aspect-auto md:h-full" />
        <div className="p-8 md:col-span-2 md:p-10">
          <p className="eyebrow">{item.category}</p>
          <h3 className="mt-3 font-display text-4xl text-navy-900">{item.title}</h3>
          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between border-b border-slate-100 pb-3"><dt className="text-slate-500">Location</dt><dd className="font-medium">{item.location}</dd></div>
            <div className="flex justify-between border-b border-slate-100 pb-3"><dt className="text-slate-500">Pool type</dt><dd className="font-medium text-right">{item.pool_type}</dd></div>
          </dl>
          <p className="mt-6 leading-relaxed text-slate-600">{item.description}</p>
        </div>
      </div>
    </div>
  )
}
