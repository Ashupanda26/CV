import { ArrowUpRight, Compass, Hammer, RefreshCcw, Trees, Wrench, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { IMAGES } from '@/data/images'
import { SmartImage } from '@/components/ui/Feedback'
import { cn } from '@/lib/utils'

const SERVICES: Array<{ title: string; text: string; icon: LucideIcon; image: string; points: string[] }> = [
  { title: 'Pool Design', icon: Compass, image: IMAGES.services.design, text: 'Architectural pool design with 3D visuals, engineering drawings and planning support.', points: ['Site survey', '3D visualisation', 'Planning drawings'] },
  { title: 'New Pool Construction', icon: Hammer, image: IMAGES.services.construction, text: 'Reinforced concrete pools built by our own crews to exacting structural standards.', points: ['Concrete & block', '10-year guarantee', 'Dedicated PM'] },
  { title: 'Pool Renovation', icon: RefreshCcw, image: IMAGES.services.renovation, text: 'Give a tired pool a second life — new finishes, equipment, lighting and covers.', points: ['Mosaic & tiling', 'Heat pumps', 'Automatic covers'] },
  { title: 'Landscaping & Surrounds', icon: Trees, image: IMAGES.services.landscaping, text: 'Terraces, coping, planting and lighting that tie the pool into the garden.', points: ['Natural stone', 'Porcelain terraces', 'Garden lighting'] },
  { title: 'Pool Maintenance', icon: Wrench, image: IMAGES.services.maintenance, text: 'Seasonal openings, servicing and repairs so your pool is always ready to swim.', points: ['Service plans', 'Water care', 'Fast repairs'] },
]

export function Services() {
  return (
    <section id="services" className="scroll-mt-20 bg-stone-warm py-24 lg:py-36">
      <div className="container-x">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <p className="eyebrow reveal">Services</p>
            <h2 className="section-title reveal mt-4">Everything your pool needs, under one roof.</h2>
          </div>
          <p className="reveal max-w-md text-slate-600">From the first conversation to decades of care, we handle every stage in-house — so nothing gets lost between trades.</p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-6">
          {SERVICES.map((s, i) => (
            <article
              key={s.title}
              className={cn(
                'reveal group relative flex min-h-[420px] flex-col justify-end overflow-hidden rounded-3xl bg-navy-900 text-white',
                i < 2 ? 'lg:col-span-3' : 'lg:col-span-2',
              )}
              style={{ transitionDelay: `${(i % 3) * 80}ms` }}
            >
              <SmartImage src={s.image} alt="" className="absolute inset-0 size-full object-cover transition-transform duration-[1.2s] group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/60 to-navy-950/5 transition-colors duration-500 group-hover:via-navy-950/70" />
              <div className="relative p-7 sm:p-8">
                <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur">
                  <s.icon className="size-5 text-aqua-300" />
                </div>
                <h3 className="font-display text-3xl font-medium">{s.title}</h3>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-300">{s.text}</p>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {s.points.map((p) => (
                    <li key={p} className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-slate-200 backdrop-blur">{p}</li>
                  ))}
                </ul>
                <Link to={{ hash: '#quote' }} className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-aqua-300 transition group-hover:gap-2.5">
                  Enquire <ArrowUpRight className="size-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
