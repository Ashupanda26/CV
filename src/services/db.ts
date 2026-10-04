/**
 * Data access layer. Every page goes through this module, so switching from
 * mock data to Supabase is purely a matter of setting the env variables.
 *
 * - Supabase mode: reads/writes the real tables (RLS enforces access).
 * - Mock mode: an in-browser store persisted to localStorage, seeded from
 *   src/data/mock.ts, with a small artificial latency so loading states show.
 */
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { seed, settings as seedSettings } from '@/data/mock'
import type { BusinessSettings, TableMap, TableName } from '@/types'
import { sleep, uuid } from '@/lib/utils'

type Row<T extends TableName> = TableMap[T]

const STORAGE_KEY = 'bluestone-demo-db-v1'
const LATENCY = 250

type MockDb = { [K in TableName]: Row<K>[] } & { settings: BusinessSettings }

let memory: MockDb | null = null

function freshDb(): MockDb {
  return { ...structuredClone(seed), settings: { ...seedSettings } }
}

function load(): MockDb {
  if (memory) return memory
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    memory = raw ? (JSON.parse(raw) as MockDb) : freshDb()
  } catch {
    memory = freshDb()
  }
  return memory
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memory))
  } catch {
    /* storage full or blocked — keep working in memory */
  }
}

// Simple change notifications so different screens stay in sync.
type Listener = (table: TableName | 'settings') => void
const listeners = new Set<Listener>()
export function onDbChange(fn: Listener) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}
const emit = (t: TableName | 'settings') => listeners.forEach((l) => l(t))

const createdAt = (r: unknown) => (r as { created_at?: string }).created_at ?? ''
const byCreatedDesc = (a: unknown, b: unknown) => createdAt(b).localeCompare(createdAt(a))

/** A row as supplied by callers: id/created_at are generated if omitted. */
export type NewRow<T extends TableName> = Omit<Row<T>, 'id' | 'created_at'> & { id?: string; created_at?: string }

export const db = {
  mode: isSupabaseConfigured ? ('supabase' as const) : ('mock' as const),

  async list<T extends TableName>(table: T): Promise<Row<T>[]> {
    if (supabase) {
      const { data, error } = await supabase.from(table as string).select('*')
      if (error) throw error
      return (data as Row<T>[]).sort(byCreatedDesc)
    }
    await sleep(LATENCY)
    return [...(load()[table] as Row<T>[])].sort(byCreatedDesc)
  },

  async insert<T extends TableName>(table: T, row: NewRow<T>): Promise<Row<T>> {
    const full = { id: uuid(), created_at: new Date().toISOString(), ...row } as Row<T>
    if (supabase) {
      const { data, error } = await supabase.from(table as string).insert(full).select().single()
      if (error) throw error
      emit(table)
      return data as Row<T>
    }
    await sleep(LATENCY)
    ;(load()[table] as Row<T>[]).push(full)
    persist()
    emit(table)
    return full
  },

  /** Public form submissions: anonymous users may insert but not read back (RLS). */
  async insertAnonymous<T extends TableName>(table: T, row: Omit<Row<T>, 'id' | 'created_at'>): Promise<void> {
    if (supabase) {
      const { error } = await supabase.from(table as string).insert({ id: uuid(), ...row })
      if (error) throw error
      return
    }
    await db.insert(table, row)
  },

  async update<T extends TableName>(table: T, id: string, patch: Partial<Row<T>>): Promise<Row<T>> {
    if (supabase) {
      const { data, error } = await supabase.from(table as string).update(patch as Record<string, unknown>).eq('id', id).select().single()
      if (error) throw error
      emit(table)
      return data as Row<T>
    }
    await sleep(LATENCY)
    const rows = load()[table] as Row<T>[]
    const idx = rows.findIndex((r) => r.id === id)
    if (idx === -1) throw new Error('Record not found')
    rows[idx] = { ...rows[idx]!, ...patch }
    persist()
    emit(table)
    return rows[idx]!
  },

  async remove<T extends TableName>(table: T, id: string): Promise<void> {
    if (supabase) {
      const { error } = await supabase.from(table as string).delete().eq('id', id)
      if (error) throw error
      emit(table)
      return
    }
    await sleep(LATENCY)
    const store = load()
    ;(store[table] as Row<T>[]) = (store[table] as Row<T>[]).filter((r) => r.id !== id)
    persist()
    emit(table)
  },

  async removeWhere<T extends TableName>(table: T, column: keyof Row<T> & string, value: string): Promise<void> {
    if (supabase) {
      const { error } = await supabase.from(table as string).delete().eq(column as string, value)
      if (error) throw error
      return
    }
    const store = load()
    ;(store[table] as Row<T>[]) = (store[table] as Row<T>[]).filter((r) => (r as unknown as Record<string, unknown>)[column] !== value)
    persist()
  },

  async getSettings(): Promise<BusinessSettings> {
    if (supabase) {
      const { data, error } = await supabase.from('business_settings').select('*').eq('id', 1).maybeSingle()
      if (error) throw error
      return (data as BusinessSettings) ?? seedSettings
    }
    return { ...load().settings }
  },

  async saveSettings(patch: Partial<BusinessSettings>): Promise<BusinessSettings> {
    if (supabase) {
      const { data, error } = await supabase.from('business_settings').upsert({ ...patch, id: 1 }).select().single()
      if (error) throw error
      emit('settings')
      return data as BusinessSettings
    }
    await sleep(LATENCY)
    const store = load()
    store.settings = { ...store.settings, ...patch }
    persist()
    emit('settings')
    return store.settings
  },

  /**
   * Upload a photo. Supabase mode stores it in the public `gallery` bucket;
   * mock mode downsizes it to a data URL so it fits in localStorage.
   */
  async uploadImage(file: File): Promise<string> {
    if (supabase) {
      const path = `${Date.now()}-${file.name.replace(/[^\w.-]/g, '_')}`
      const { error } = await supabase.storage.from('gallery').upload(path, file, { cacheControl: '31536000' })
      if (error) throw error
      return supabase.storage.from('gallery').getPublicUrl(path).data.publicUrl
    }
    return resizeToDataUrl(file, 1200)
  },

  /** Mock mode: restore the original sample data. */
  resetDemo() {
    memory = freshDb()
    persist()
    ;(Object.keys(seed) as TableName[]).forEach(emit)
    emit('settings')
  },

  /**
   * Supabase mode: load the sample data into an empty project using the
   * signed-in admin's session (no service-role key needed).
   */
  async seedSupabase() {
    if (!supabase) return
    const order: TableName[] = ['customers', 'projects', 'project_updates', 'leads', 'quotes', 'quote_items', 'maintenance_tickets', 'feedback', 'messages', 'gallery_items']
    for (const table of order) {
      const { error } = await supabase.from(table as string).upsert(seed[table] as object[])
      if (error) throw new Error(`${table}: ${error.message}`)
      emit(table)
    }
    await db.saveSettings(seedSettings)
  },
}

function resizeToDataUrl(file: File, maxSize: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.8))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('That file could not be read as an image.'))
    }
    img.src = url
  })
}
