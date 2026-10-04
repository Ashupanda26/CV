import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export interface AuthUser { email: string; name: string; isDemo: boolean }

interface AuthApi {
  user: AuthUser | null
  loading: boolean
  /** True when no Supabase project is connected and the demo login is offered. */
  demoAvailable: boolean
  signIn: (email: string, password: string) => Promise<void>
  signInDemo: () => void
  signOut: () => Promise<void>
}

const DEMO_KEY = 'bluestone-demo-session'
const AuthContext = createContext<AuthApi | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      if (sessionStorage.getItem(DEMO_KEY)) setUser({ email: 'demo@bluestonepools.co.uk', name: 'Alex Morgan', isDemo: true })
      setLoading(false)
      return
    }
    const toUser = (email?: string | null, name?: string): AuthUser | null =>
      email ? { email, name: name || email.split('@')[0]!, isDemo: false } : null

    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user
      setUser(toUser(u?.email, u?.user_metadata?.full_name))
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user
      setUser(toUser(u?.email, u?.user_metadata?.full_name))
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const api: AuthApi = {
    user,
    loading,
    demoAvailable: !isSupabaseConfigured,
    async signIn(email, password) {
      if (!supabase) throw new Error('Supabase is not configured — use demo mode.')
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
    },
    signInDemo() {
      if (isSupabaseConfigured) return
      sessionStorage.setItem(DEMO_KEY, '1')
      setUser({ email: 'demo@bluestonepools.co.uk', name: 'Alex Morgan', isDemo: true })
    },
    async signOut() {
      sessionStorage.removeItem(DEMO_KEY)
      if (supabase) await supabase.auth.signOut()
      setUser(null)
    },
  }

  return <AuthContext.Provider value={api}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
