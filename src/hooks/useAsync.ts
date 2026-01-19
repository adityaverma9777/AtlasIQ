import { useState, useEffect, useCallback } from 'react'

interface UseAsyncState<T> {
    data: T | null
    error: string | null
    loading: boolean
    updatedAt: Date | null
}

interface UseAsyncReturn<T> extends UseAsyncState<T> {
    refresh: () => void
}

export function useAsync<T>(
    fetcher: (bypassCache?: boolean) => Promise<T>,
    deps: unknown[] = []
): UseAsyncReturn<T> {
    const [state, setState] = useState<UseAsyncState<T>>({
        data: null,
        error: null,
        loading: true,
        updatedAt: null,
    })
    const [refreshCount, setRefreshCount] = useState(0)

    const refresh = useCallback(() => {
        setRefreshCount((c) => c + 1)
    }, [])

    useEffect(() => {
        let cancelled = false
        const bypassCache = refreshCount > 0

        setState((s) => ({ ...s, loading: true, error: null }))

        fetcher(bypassCache)
            .then((data) => {
                if (!cancelled) {
                    setState({ data, error: null, loading: false, updatedAt: new Date() })
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setState((s) => ({ ...s, error: err.message, loading: false }))
                }
            })

        return () => {
            cancelled = true
        }
    }, [...deps, refreshCount])

    return { ...state, refresh }
}
