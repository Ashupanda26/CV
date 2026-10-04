import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Box, Camera, Eye, Move3d, Pause, Play, RotateCcw, Sun, Sunset, Moon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { buttonClass } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Feedback'
import type { LightingStyle, PoolStyle, WaterStyle } from '@/components/pool3d/PoolScene'

// three.js is ~700KB — only fetch it when the section approaches the viewport.
const PoolScene = lazy(() => import('@/components/pool3d/PoolScene'))

const STYLES: Array<{ value: PoolStyle; label: string; note: string }> = [
  { value: 'rectangular', label: 'Classic Rectangle', note: '10m × 4m' },
  { value: 'lshape', label: 'L-Shaped', note: 'Shallow play area' },
  { value: 'freeform', label: 'Freeform', note: 'Natural curves' },
  { value: 'infinity', label: 'Infinity Edge', note: '12m vanishing edge' },
]
const WATERS: Array<{ value: WaterStyle; label: string; swatch: string }> = [
  { value: 'crystal', label: 'Crystal Blue', swatch: 'linear-gradient(135deg,#7fe3ef,#1a8fc4)' },
  { value: 'lagoon', label: 'Lagoon', swatch: 'linear-gradient(135deg,#8ff0d8,#14a89a)' },
  { value: 'deep', label: 'Midnight', swatch: 'linear-gradient(135deg,#3c7fb0,#0b2846)' },
  { value: 'emerald', label: 'Emerald', swatch: 'linear-gradient(135deg,#86d9b0,#127a63)' },
]
const LIGHTS: Array<{ value: LightingStyle; label: string; icon: typeof Sun }> = [
  { value: 'day', label: 'Daylight', icon: Sun },
  { value: 'sunset', label: 'Sunset', icon: Sunset },
  { value: 'night', label: 'Night', icon: Moon },
]
const VIEWS = [
  { value: 'perspective', label: 'Perspective', icon: Move3d },
  { value: 'top', label: 'Plan view', icon: Box },
  { value: 'side', label: 'Eye level', icon: Eye },
] as const

function webglAvailable() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

export function PoolViewer() {
  const [style, setStyle] = useState<PoolStyle>('rectangular')
  const [water, setWater] = useState<WaterStyle>('crystal')
  const [lighting, setLighting] = useState<LightingStyle>('day')
  const [view, setView] = useState<(typeof VIEWS)[number]['value']>('perspective')
  const [autoRotate, setAutoRotate] = useState(true)
  const [cameraKey, setCameraKey] = useState(0)
  const [visible, setVisible] = useState(false)
  const [supported] = useState(webglAvailable)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => e?.isIntersecting && setVisible(true), { rootMargin: '400px' })
    if (ref.current) io.observe(ref.current)
    return () => io.disconnect()
  }, [])

  const changeView = (v: typeof view) => {
    setView(v)
    setCameraKey((k) => k + 1)
  }

  const chip = (active: boolean) =>
    cn('flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-all', active ? 'border-aqua-400 bg-aqua-400/10 text-white' : 'border-white/10 text-slate-300 hover:border-white/30 hover:text-white')

  return (
    <section id="viewer" className="scroll-mt-20 overflow-hidden bg-navy-950 py-24 text-white lg:py-36">
      <div className="container-x">
        <div className="grid gap-6 lg:grid-cols-2 lg:items-end">
          <div>
            <p className="eyebrow reveal !text-aqua-300">Interactive 3D</p>
            <h2 className="reveal mt-4 font-display text-4xl leading-[1.05] font-medium sm:text-5xl lg:text-6xl">Explore Your Pool Before We Build It</h2>
          </div>
          <p className="reveal max-w-lg text-slate-300 lg:justify-self-end">
            Drag to rotate, scroll or pinch to zoom. Try different shapes, water finishes and lighting — during design we build a fully detailed model of your actual garden.
          </p>
        </div>

        <div ref={ref} className="reveal mt-12 grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-navy-900 ring-1 ring-white/10 sm:aspect-[16/10] lg:aspect-auto lg:min-h-[600px]">
            {!supported ? (
              <div className="flex h-full items-center justify-center p-8 text-center text-slate-400">Your browser doesn't support WebGL, so the 3D viewer can't be displayed.</div>
            ) : visible ? (
              <Suspense fallback={<div className="flex h-full items-center justify-center"><Spinner className="border-white/20 border-t-aqua-400" /></div>}>
                <PoolScene style={style} water={water} lighting={lighting} autoRotate={autoRotate} view={view} cameraKey={cameraKey} />
              </Suspense>
            ) : null}

            <div className="pointer-events-none absolute top-4 left-4 flex items-center gap-2 rounded-full bg-navy-950/60 px-3 py-1.5 text-xs text-slate-200 backdrop-blur">
              <Move3d className="size-3.5 text-aqua-300" /> Drag to rotate · Scroll to zoom
            </div>
            <div className="absolute right-4 bottom-4 flex gap-2">
              <button onClick={() => setAutoRotate((a) => !a)} className="flex size-10 cursor-pointer items-center justify-center rounded-full bg-navy-950/70 text-white backdrop-blur transition hover:bg-navy-950" aria-label={autoRotate ? 'Pause rotation' : 'Auto-rotate'}>
                {autoRotate ? <Pause className="size-4" /> : <Play className="size-4" />}
              </button>
              <button onClick={() => setCameraKey((k) => k + 1)} className="flex size-10 cursor-pointer items-center justify-center rounded-full bg-navy-950/70 text-white backdrop-blur transition hover:bg-navy-950" aria-label="Reset camera">
                <RotateCcw className="size-4" />
              </button>
            </div>
          </div>

          <div className="space-y-6 rounded-3xl bg-white/[0.04] p-6 ring-1 ring-white/10">
            <fieldset>
              <legend className="mb-3 text-xs font-semibold tracking-[0.2em] text-aqua-300 uppercase">Pool style</legend>
              <div className="grid grid-cols-2 gap-2">
                {STYLES.map((s) => (
                  <button key={s.value} onClick={() => setStyle(s.value)} className={cn(chip(style === s.value), 'flex-col items-start gap-0.5')} aria-pressed={style === s.value}>
                    <span className="font-medium">{s.label}</span>
                    <span className="text-xs text-slate-400">{s.note}</span>
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-3 text-xs font-semibold tracking-[0.2em] text-aqua-300 uppercase">Water & interior</legend>
              <div className="grid grid-cols-2 gap-2">
                {WATERS.map((w) => (
                  <button key={w.value} onClick={() => setWater(w.value)} className={chip(water === w.value)} aria-pressed={water === w.value}>
                    <span className="size-5 shrink-0 rounded-full ring-2 ring-white/20" style={{ background: w.swatch }} />
                    {w.label}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-3 text-xs font-semibold tracking-[0.2em] text-aqua-300 uppercase">Lighting</legend>
              <div className="grid grid-cols-3 gap-2">
                {LIGHTS.map((l) => (
                  <button key={l.value} onClick={() => setLighting(l.value)} className={cn(chip(lighting === l.value), 'flex-col justify-center gap-1.5 text-xs')} aria-pressed={lighting === l.value}>
                    <l.icon className="size-4" />
                    {l.label}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-3 text-xs font-semibold tracking-[0.2em] text-aqua-300 uppercase">Camera</legend>
              <div className="grid grid-cols-3 gap-2">
                {VIEWS.map((v) => (
                  <button key={v.value} onClick={() => changeView(v.value)} className={cn(chip(view === v.value), 'flex-col justify-center gap-1.5 text-xs')} aria-pressed={view === v.value}>
                    <v.icon className="size-4" />
                    {v.label}
                  </button>
                ))}
              </div>
            </fieldset>
            <Link to={{ hash: '#quote' }} className={cn(buttonClass('aqua', 'lg'), 'w-full')}>
              <Camera className="size-4" /> Design my pool
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
