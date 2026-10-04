import { Link } from 'react-router-dom'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { useSettings } from '@/context/SettingsContext'
import { whatsappLink } from '@/lib/whatsapp'
import { IMAGES } from '@/data/images'
import { buttonClass } from '@/components/ui/Button'
import { WhatsAppIcon } from '@/components/ui/BrandIcons'
import { cn } from '@/lib/utils'

const STATS = [
  { value: '20+', label: 'Years building pools' },
  { value: '350+', label: 'Pools completed' },
  { value: '4.9★', label: 'Average client rating' },
  { value: '10yr', label: 'Structural guarantee' },
]

export function Hero() {
  const s = useSettings()
  return (
    <section className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-navy-950 bg-[radial-gradient(ellipse_at_70%_60%,rgba(47,181,188,0.35),transparent_60%)] text-white">
      <img src={IMAGES.hero} alt="Infinity-edge swimming pool at dusk beside a contemporary home" className="absolute inset-0 -z-20 size-full scale-105 animate-[fade-in_1.6s_ease-out_both] object-cover" fetchPriority="high" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-navy-950/70 via-navy-950/35 to-navy-950/90" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy-950/70 via-transparent to-transparent" />

      <div className="container-x flex flex-1 flex-col justify-center pt-32 pb-16">
        <p className="eyebrow animate-fade-up !text-aqua-300">Bespoke pools · Surrey & the Home Counties</p>
        <h1 className="mt-6 max-w-4xl animate-fade-up font-display text-5xl leading-[0.98] font-medium tracking-tight [animation-delay:120ms] sm:text-7xl lg:text-[92px]">
          Beautiful Pools.<br />
          <span className="text-aqua-200 italic">Expertly Designed.</span><br />
          Built to Last.
        </h1>
        <p className="mt-7 max-w-xl animate-fade-up text-base leading-relaxed text-slate-200 [animation-delay:240ms] sm:text-lg">
          BlueStone Pools designs and builds bespoke residential swimming pools — from the first sketch to the moment you dive in.
          Architectural design, master craftsmanship and one dedicated team throughout.
        </p>
        <div className="mt-10 flex animate-fade-up flex-col gap-3 [animation-delay:360ms] sm:flex-row">
          <Link to={{ hash: '#quote' }} className={buttonClass('aqua', 'lg')}>
            Get a Free Quote <ArrowRight className="size-4" />
          </Link>
          <a href={whatsappLink(s.whatsapp_number)} target="_blank" rel="noopener noreferrer" className={buttonClass('light', 'lg')}>
            <WhatsAppIcon className="size-5" /> Chat on WhatsApp
          </a>
        </div>
      </div>

      <div className="border-t border-white/10 bg-navy-950/40 backdrop-blur-md">
        <dl className="container-x grid grid-cols-2 lg:grid-cols-4">
          {STATS.map((st, i) => (
            <div key={st.label} className={cn('py-6 lg:py-8', i % 2 === 1 && 'pl-6 border-l border-white/10', i >= 2 && 'border-t border-white/10 lg:border-t-0', i === 2 && 'lg:pl-6 lg:border-l')}>
              <dt className="text-xs tracking-wide text-slate-300 uppercase">{st.label}</dt>
              <dd className="mt-1 font-display text-3xl text-white sm:text-4xl">{st.value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <Link to={{ hash: '#about' }} aria-label="Scroll down" className="absolute bottom-32 left-1/2 hidden -translate-x-1/2 animate-bounce text-white/60 hover:text-white lg:block">
        <ChevronDown className="size-6" />
      </Link>
    </section>
  )
}
