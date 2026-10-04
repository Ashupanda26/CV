import { Check } from 'lucide-react'
import { IMAGES } from '@/data/images'
import { SmartImage } from '@/components/ui/Feedback'

const OFFER = ['Pool design', 'New pool construction', 'Pool renovation', 'Landscaping and surrounds', 'Pool maintenance']

export function About() {
  return (
    <section id="about" className="scroll-mt-20 bg-white py-24 lg:py-36">
      <div className="container-x grid items-center gap-14 lg:grid-cols-2 lg:gap-24">
        <div className="reveal relative">
          <SmartImage src={IMAGES.about} alt="Modern home with a pool designed by BlueStone" className="aspect-[4/5] w-full rounded-[28px] object-cover" />
          <div className="absolute -right-4 -bottom-8 hidden w-60 rounded-2xl bg-navy-900 p-6 text-white shadow-2xl sm:block lg:-right-10">
            <p className="font-display text-5xl text-aqua-300">2004</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">Founded in Weybridge by a structural engineer and a landscape architect.</p>
          </div>
        </div>
        <div>
          <p className="eyebrow reveal">About BlueStone</p>
          <h2 className="section-title reveal mt-4">A pool should feel like it was always meant to be there.</h2>
          <div className="reveal mt-7 space-y-5 text-[17px] leading-relaxed text-slate-600">
            <p>
              We are a small, specialist team of designers, engineers and craftspeople who create private swimming pools for homes across the South East.
              Every pool we build is designed around the architecture of the house, the shape of the garden and the way your family will use it.
            </p>
            <p>
              One project manager stays with you from first consultation to handover, and our own crews — never subcontracted labour — build every shell, surround and plant room.
            </p>
          </div>
          <ul className="reveal mt-9 grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {OFFER.map((o) => (
              <li key={o} className="flex items-center gap-3 text-navy-900">
                <span className="flex size-6 items-center justify-center rounded-full bg-aqua-50 ring-1 ring-aqua-200">
                  <Check className="size-3.5 text-aqua-600" />
                </span>
                <span className="font-medium">{o}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
