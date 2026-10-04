import { Link } from 'react-router-dom'
import { buttonClass } from '@/components/ui/Button'
import { Logo } from '@/components/ui/BrandIcons'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-navy-950 px-6 text-center text-white">
      <Logo light />
      <p className="mt-12 font-display text-8xl text-aqua-300">404</p>
      <h1 className="mt-4 font-display text-4xl">This page has gone for a swim.</h1>
      <p className="mt-3 text-slate-400">The page you’re looking for doesn’t exist or has moved.</p>
      <Link to="/" className={buttonClass('aqua', 'lg', 'mt-10')}>Back to home</Link>
    </div>
  )
}
