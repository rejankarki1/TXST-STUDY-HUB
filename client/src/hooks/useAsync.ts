import * as React from 'react'

export type AsyncState<T> = {
  data: T | undefined
  loading: boolean
  error: string | null
}

/**
 * One fetch, three states, and a reload the page can call after a mutation.
 *
 * This is the whole of the app's server-state handling. It replaces a global
 * reducer that had to be invalidated by hand after every write — here a
 * mutation just awaits its API call and calls reload(), and the screen is
 * correct because the server said so.
 *
 * `deps` behaves like a useEffect dependency list. A stale response from a
 * superseded run is dropped rather than applied.
 */
export function useAsync<T>(
  run: () => Promise<T>,
  deps: React.DependencyList,
  options: { enabled?: boolean } = {},
): AsyncState<T> & { reload: () => Promise<void>; setData: (value: T) => void } {
  const enabled = options.enabled ?? true

  const [data, setData] = React.useState<T | undefined>(undefined)
  const [loading, setLoading] = React.useState(enabled)
  const [error, setError] = React.useState<string | null>(null)

  const runRef = React.useRef(run)
  runRef.current = run

  /* Incremented per load; a response whose id is no longer current is ignored,
     which is what stops a slow first request overwriting a fast second one. */
  const runId = React.useRef(0)

  const load = React.useCallback(async () => {
    if (!enabled) {
      setLoading(false)
      return
    }

    const id = ++runId.current
    setLoading(true)
    setError(null)

    try {
      const result = await runRef.current()
      if (runId.current !== id) return
      setData(result)
    } catch (caught) {
      if (runId.current !== id) return
      setError(caught instanceof Error ? caught.message : 'Something went wrong')
    } finally {
      if (runId.current === id) setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps])

  React.useEffect(() => {
    void load()
  }, [load])

  return { data, loading, error, reload: load, setData }
}
