import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** True when the app should talk to a real Supabase project instead of local mock data. */
export const isSupabaseConfigured = Boolean(url && anonKey)

/**
 * Only the public anon key is ever used in the browser. Row Level Security
 * (see supabase/schema.sql) is what protects the data — never put the
 * service role key in a VITE_ variable.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured ? createClient(url!, anonKey!) : null
