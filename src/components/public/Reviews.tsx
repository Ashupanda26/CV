import { useMemo } from 'react'
import { Quote, Star } from 'lucide-react'
import { useTable } from '@/hooks/useTable'
import { Skeleton } from '@/components/ui/Feedback'
import { cn } from '@/lib/utils'

export function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <div className={cn('flex gap-0.5', className)} aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={cn('size-4', n <= rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200')} />
      ))}
    </div>
  )
}

export function Reviews() {
  // Only feedback the admin has marked "published" appears here.
  const { data, loading } = useTable('feedback')
  const published = useMemo(() => data.filter((f) => f.published).slice(0, 6), [data])
  const avg = published.length ? published.reduce((s, f) => s + f.rating, 0) / published.length : 0

  return (
    <section id="reviews" className="scroll-mt-20 bg-stone-warm py-24 lg:py-36">
      <div className="container-x">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <p className="eyebrow reveal">Client reviews</p>
            <h2 className="section-title reveal mt-4">Trusted by families across the South East.</h2>
          </div>
          {published.length > 0 && (
            <div className="reveal flex items-center gap-4 rounded-2xl bg-white px-6 py-4 shadow-sm">
              <p className="font-display text-5xl text-navy-900">{avg.toFixed(1)}</p>
              <div>
                <Stars rating={Math.round(avg)} />
                <p className="mt-1 text-xs text-slate-500">Average from verified clients</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-64 rounded-3xl" />)
            : published.map((f, i) => (
                <figure key={f.id} className={cn('flex animate-fade-up flex-col rounded-3xl bg-white p-8 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition hover:-translate-y-1 hover:shadow-xl hover:shadow-navy-900/5', i === 0 && 'lg:bg-navy-900 lg:text-white')} style={{ animationDelay: `${i * 80}ms` }}>
                  <Quote className={cn('size-8', i === 0 ? 'text-aqua-500 lg:text-aqua-300' : 'text-aqua-500')} />
                  <blockquote className={cn('mt-5 flex-1 font-display text-[22px] leading-snug', i === 0 ? 'text-navy-900 lg:text-white' : 'text-navy-900')}>
                    “{f.comment}”
                  </blockquote>
                  <figcaption className="mt-8 flex items-end justify-between gap-4">
                    <div>
                      <p className="font-semibold">{f.author_name}</p>
                      <p className={cn('text-sm', i === 0 ? 'text-slate-500 lg:text-slate-400' : 'text-slate-500')}>{f.author_location}</p>
                    </div>
                    <Stars rating={f.rating} />
                  </figcaption>
                </figure>
              ))}
        </div>
      </div>
    </section>
  )
}
