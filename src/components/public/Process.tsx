import { CalendarCheck, ClipboardList, HardHat, KeyRound, PenTool, type LucideIcon } from 'lucide-react'

const STEPS: Array<{ title: string; text: string; icon: LucideIcon; time: string }> = [
  { title: 'Consultation', icon: CalendarCheck, time: 'Week 1', text: 'A no-obligation visit to understand your home, garden, budget and how you want to use the pool.' },
  { title: 'Design', icon: PenTool, time: 'Weeks 2–4', text: 'Concept layouts, 3D visuals and material samples, refined with you until it feels exactly right.' },
  { title: 'Quote', icon: ClipboardList, time: 'Week 5', text: 'A clear, itemised fixed-price quote — no provisional sums hiding surprises.' },
  { title: 'Construction', icon: HardHat, time: '8–14 weeks', text: 'Our own crews build your pool, with weekly photo updates on WhatsApp and a tidy, safe site.' },
  { title: 'Handover', icon: KeyRound, time: 'Day one', text: 'We fill, balance and commission the pool, walk you through everything and stay on hand for aftercare.' },
]

export function Process() {
  return (
    <section id="process" className="scroll-mt-20 bg-white py-24 lg:py-36">
      <div className="container-x">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow reveal">How we work</p>
          <h2 className="section-title reveal mt-4">Five steps from first sketch to first swim.</h2>
        </div>
        <ol className="relative mt-16 grid gap-10 lg:grid-cols-5 lg:gap-6">
          <div aria-hidden className="absolute top-7 right-[10%] left-[10%] hidden h-px bg-gradient-to-r from-aqua-200 via-aqua-400 to-aqua-200 lg:block" />
          {STEPS.map((s, i) => (
            <li key={s.title} className="reveal relative flex gap-5 lg:flex-col lg:items-center lg:text-center" style={{ transitionDelay: `${i * 100}ms` }}>
              <div className="relative z-10 flex size-14 shrink-0 items-center justify-center rounded-2xl bg-navy-900 text-aqua-300 shadow-lg shadow-navy-900/20 ring-8 ring-white">
                <s.icon className="size-6" />
              </div>
              <div>
                <p className="text-xs font-semibold tracking-widest text-aqua-600 uppercase">0{i + 1} · {s.time}</p>
                <h3 className="mt-2 font-display text-[28px] font-medium text-navy-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
