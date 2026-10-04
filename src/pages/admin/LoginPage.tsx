import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, FlaskConical, Lock } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { Logo } from '@/components/ui/BrandIcons'
import { IMAGES } from '@/data/images'

export default function LoginPage() {
  const { user, signIn, signInDemo, demoAvailable } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/admin'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (user) return <Navigate to={from} replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signIn(email, password)
      toast.success('Welcome back')
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  function enterDemo() {
    signInDemo()
    toast.info('Demo mode', 'You are exploring the dashboard with sample data.')
    navigate(from, { replace: true })
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-navy-950 lg:block">
        <img src={IMAGES.pools[1]} alt="" className="absolute inset-0 size-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/40 to-navy-950/30" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Logo light />
          <div>
            <p className="font-display text-5xl leading-tight">Every lead, project and client — in one place.</p>
            <p className="mt-4 max-w-md text-slate-300">The BlueStone Pools contractor dashboard.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-center bg-white px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <div className="lg:hidden"><Logo /></div>
          <Link to="/" className="mt-8 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-navy-900 lg:mt-0">
            <ArrowLeft className="size-4" /> Back to website
          </Link>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-navy-900">Sign in</h1>
          <p className="mt-2 text-sm text-slate-500">Staff access to the BlueStone Pools dashboard.</p>

          {demoAvailable && (
            <div className="mt-8 rounded-2xl border border-aqua-200 bg-aqua-50 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-aqua-700">
                <FlaskConical className="size-4" /> Demo mode available
              </div>
              <p className="mt-1.5 text-sm text-slate-600">
                This demo runs on realistic sample data. No password needed: explore leads, projects, quotes and more.
              </p>
              <Button variant="primary" className="mt-4 w-full" onClick={enterDemo}>Enter demo dashboard</Button>
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <Input label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={demoAvailable} placeholder="you@bluestonepools.co.uk" />
            <Input label="Password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={demoAvailable} />
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
            <Button type="submit" variant={demoAvailable ? 'outline' : 'primary'} className="w-full" loading={loading} disabled={demoAvailable} icon={<Lock className="size-4" />}>
              Sign in
            </Button>
            {demoAvailable && <p className="text-center text-xs text-slate-400">Staff email sign-in is enabled on the live system.</p>}
          </form>
        </div>
      </div>
    </div>
  )
}
