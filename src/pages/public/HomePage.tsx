import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useReveal } from '@/hooks/useReveal'
import { Hero } from '@/components/public/Hero'
import { About } from '@/components/public/About'
import { Services } from '@/components/public/Services'
import { Projects } from '@/components/public/Projects'
import { PoolViewer } from '@/components/public/PoolViewer'
import { Process } from '@/components/public/Process'
import { Reviews } from '@/components/public/Reviews'
import { QuoteForm } from '@/components/public/QuoteForm'

export default function HomePage() {
  const ref = useReveal<HTMLDivElement>()
  const { hash } = useLocation()

  // Smooth-scroll to #section links, including when arriving from another page.
  // Sections above may still be loading data, so correct the position once
  // layout settles (unless the visitor has started scrolling themselves).
  useEffect(() => {
    if (!hash) return
    const target = () => document.querySelector(hash)
    let userScrolled = false
    const stop = () => (userScrolled = true)
    window.addEventListener('wheel', stop, { passive: true })
    window.addEventListener('touchmove', stop, { passive: true })
    const t1 = setTimeout(() => target()?.scrollIntoView({ behavior: 'smooth' }), 60)
    const t2 = setTimeout(() => {
      const el = target()
      if (el && !userScrolled && Math.abs(el.getBoundingClientRect().top) > 4) el.scrollIntoView({ behavior: 'smooth' })
    }, 900)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      window.removeEventListener('wheel', stop)
      window.removeEventListener('touchmove', stop)
    }
  }, [hash])

  return (
    <div ref={ref}>
      <Hero />
      <About />
      <Services />
      <Projects />
      <PoolViewer />
      <Process />
      <Reviews />
      <QuoteForm />
    </div>
  )
}
