import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { Clock, LayoutDashboard, Mail, MapPin, Menu, Phone, X } from 'lucide-react'
import { useSettings } from '@/context/SettingsContext'
import { whatsappLink } from '@/lib/whatsapp'
import { cn } from '@/lib/utils'
import { buttonClass } from '@/components/ui/Button'
import { FacebookIcon, InstagramIcon, LinkedInIcon, Logo, WhatsAppIcon, YouTubeIcon } from '@/components/ui/BrandIcons'

export const NAV = [
  { label: 'About', hash: '#about' },
  { label: 'Services', hash: '#services' },
  { label: 'Projects', hash: '#projects' },
  { label: '3D Viewer', hash: '#viewer' },
  { label: 'Process', hash: '#process' },
  { label: 'Reviews', hash: '#reviews' },
]

function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const overHero = pathname === '/' && !scrolled && !open

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setOpen(false), [pathname])

  return (
    <header className={cn('fixed inset-x-0 top-0 z-50 transition-all duration-500', overHero ? 'bg-transparent py-5' : 'border-b border-slate-200/70 bg-white/90 py-3 backdrop-blur-xl')}>
      <nav className="container-x flex items-center justify-between gap-6">
        <Link to="/" aria-label="BlueStone Pools home">
          <Logo light={overHero} />
        </Link>
        <ul className="hidden items-center gap-8 lg:flex">
          {NAV.map((n) => (
            <li key={n.hash}>
              <Link to={{ pathname: '/', hash: n.hash }} className={cn('text-sm font-medium transition-colors', overHero ? 'text-white/85 hover:text-white' : 'text-slate-600 hover:text-navy-900')}>
                {n.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <span className="hidden sm:block">
            <Link to={{ pathname: '/', hash: '#quote' }} className={cn(buttonClass(overHero ? 'light' : 'primary', 'md'), 'rounded-full px-5')}>
              Get a Free Quote
            </Link>
          </span>
          <button onClick={() => setOpen((o) => !o)} className={cn('rounded-lg p-2 lg:hidden', overHero ? 'text-white' : 'text-navy-900')} aria-label="Toggle menu" aria-expanded={open}>
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </nav>
      {open && (
        <div className="container-x animate-fade-in lg:hidden">
          <ul className="mt-3 space-y-1 border-t border-slate-100 pt-3 pb-4">
            {NAV.map((n) => (
              <li key={n.hash}>
                <Link onClick={() => setOpen(false)} to={{ pathname: '/', hash: n.hash }} className="block rounded-lg px-3 py-3 text-base font-medium text-navy-900 hover:bg-slate-50">
                  {n.label}
                </Link>
              </li>
            ))}
            <li className="pt-2">
              <Link onClick={() => setOpen(false)} to={{ pathname: '/', hash: '#quote' }} className={cn(buttonClass('primary', 'lg'), 'w-full')}>
                Get a Free Quote
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  )
}

function WhatsAppFloat() {
  const s = useSettings()
  return (
    <a
      href={whatsappLink(s.whatsapp_number)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="group fixed right-5 bottom-5 z-40 flex items-center gap-3 sm:right-8 sm:bottom-8"
    >
      <span className="pointer-events-none hidden translate-x-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-navy-900 opacity-0 shadow-lg transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 sm:block">
        Chat on WhatsApp
      </span>
      <span className="relative flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl shadow-emerald-900/25 transition-transform duration-300 group-hover:scale-110">
        <span className="absolute inset-0 animate-ping rounded-full bg-[#25D366] opacity-20 [animation-duration:2.5s]" />
        <WhatsAppIcon className="relative size-7" />
      </span>
    </a>
  )
}

function Footer() {
  const s = useSettings()
  const year = new Date().getFullYear()
  const socials = [
    { href: s.instagram_url, Icon: InstagramIcon, label: 'Instagram' },
    { href: s.facebook_url, Icon: FacebookIcon, label: 'Facebook' },
    { href: s.linkedin_url, Icon: LinkedInIcon, label: 'LinkedIn' },
    { href: s.youtube_url, Icon: YouTubeIcon, label: 'YouTube' },
  ].filter((x) => x.href)

  const col = 'text-sm text-slate-400 transition-colors hover:text-white'
  return (
    <footer className="bg-navy-950 text-white">
      <div className="container-x grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-12 lg:py-20">
        <div className="lg:col-span-4">
          <Logo light />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-slate-400">
            Designers and builders of bespoke residential swimming pools across Surrey, Berkshire, Kent and the Home Counties since 2004.
          </p>
          <div className="mt-6 flex gap-2">
            {socials.map(({ href, Icon, label }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="flex size-10 items-center justify-center rounded-full border border-white/10 text-slate-300 transition hover:border-aqua-400 hover:text-aqua-300">
                <Icon className="size-4" />
              </a>
            ))}
          </div>
        </div>
        <div className="lg:col-span-2">
          <h4 className="text-xs font-semibold tracking-[0.2em] text-aqua-300 uppercase">Services</h4>
          <ul className="mt-5 space-y-3">
            {['Pool Design', 'New Pool Construction', 'Pool Renovation', 'Landscaping & Surrounds', 'Pool Maintenance'].map((x) => (
              <li key={x}><Link to={{ pathname: '/', hash: '#services' }} className={col}>{x}</Link></li>
            ))}
          </ul>
        </div>
        <div className="lg:col-span-2">
          <h4 className="text-xs font-semibold tracking-[0.2em] text-aqua-300 uppercase">Company</h4>
          <ul className="mt-5 space-y-3">
            <li><Link to={{ pathname: '/', hash: '#about' }} className={col}>About</Link></li>
            <li><Link to={{ pathname: '/', hash: '#projects' }} className={col}>Projects</Link></li>
            <li><Link to={{ pathname: '/', hash: '#process' }} className={col}>Our Process</Link></li>
            <li><Link to={{ pathname: '/', hash: '#reviews' }} className={col}>Reviews</Link></li>
            <li><Link to="/admin" className={col}>Client & Staff Login</Link></li>
          </ul>
        </div>
        <div className="lg:col-span-4">
          <h4 className="text-xs font-semibold tracking-[0.2em] text-aqua-300 uppercase">Contact</h4>
          <ul className="mt-5 space-y-3.5 text-sm text-slate-300">
            <li className="flex gap-3"><Phone className="mt-0.5 size-4 shrink-0 text-aqua-400" /><a href={`tel:${s.phone.replace(/\s/g, '')}`} className="hover:text-white">{s.phone}</a></li>
            <li className="flex gap-3"><Mail className="mt-0.5 size-4 shrink-0 text-aqua-400" /><a href={`mailto:${s.email}`} className="hover:text-white">{s.email}</a></li>
            <li className="flex gap-3"><WhatsAppIcon className="mt-0.5 size-4 shrink-0 text-aqua-400" /><a href={whatsappLink(s.whatsapp_number)} target="_blank" rel="noopener noreferrer" className="hover:text-white">WhatsApp {s.whatsapp_number}</a></li>
            <li className="flex gap-3"><MapPin className="mt-0.5 size-4 shrink-0 text-aqua-400" />{s.address}</li>
            <li className="flex gap-3"><Clock className="mt-0.5 size-4 shrink-0 text-aqua-400" />{s.business_hours}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col gap-3 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} {s.company_name} Ltd. Registered in England & Wales. Demo website.</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-white">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppFloat />
      <Link
        to="/admin/login"
        className="fixed bottom-5 left-5 z-40 inline-flex items-center gap-2 rounded-full bg-navy-900/90 px-4 py-2.5 text-xs font-medium text-white shadow-xl shadow-navy-900/30 ring-1 ring-white/10 backdrop-blur transition hover:bg-navy-800 sm:bottom-8 sm:left-8 sm:text-sm"
      >
        <LayoutDashboard className="size-4 text-aqua-300" />
        Contractor dashboard demo
      </Link>
    </div>
  )
}
