import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { db, onDbChange } from '@/services/db'
import { settings as fallback } from '@/data/mock'
import type { BusinessSettings } from '@/types'

const SettingsContext = createContext<BusinessSettings>(fallback)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<BusinessSettings>(fallback)

  useEffect(() => {
    const load = () => db.getSettings().then(setSettings).catch(() => setSettings(fallback))
    load()
    return onDbChange((t) => {
      if (t === 'settings') load()
    })
  }, [])

  return <SettingsContext.Provider value={settings}>{children}</SettingsContext.Provider>
}

export const useSettings = () => useContext(SettingsContext)
