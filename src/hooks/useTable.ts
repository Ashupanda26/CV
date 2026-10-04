import { useCallback, useEffect, useState } from 'react'
import { db, onDbChange } from '@/services/db'
import type { TableMap, TableName } from '@/types'

/** Loads a whole table and keeps it fresh when anything writes to it. */
export function useTable<T extends TableName>(table: T) {
  const [data, setData] = useState<TableMap[T][]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setError(null)
      setData(await db.list(table))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [table])

  useEffect(() => {
    refresh()
    return onDbChange((t) => {
      if (t === table) refresh()
    })
  }, [refresh, table])

  return { data, setData, loading, error, refresh }
}

/** Builds an id -> row lookup for client-side joins. */
export function useLookup<T extends { id: string }>(rows: T[]) {
  const map = new Map<string, T>()
  rows.forEach((r) => map.set(r.id, r))
  return map
}
