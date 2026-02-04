const cache = new Map<string, { data: unknown; expires: number }>()

interface FetchOptions {
    cacheMinutes?: number
    bypassCache?: boolean
}

export async function fetchWithCache<T>(
    url: string,
    options: FetchOptions = {}
): Promise<T> {
    const { cacheMinutes = 5, bypassCache = false } = options
    const now = Date.now()

    if (!bypassCache) {
        const cached = cache.get(url)
        if (cached && cached.expires > now) {
            return cached.data as T
        }
    }

    const response = await fetch(url)
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()
    cache.set(url, { data, expires: now + cacheMinutes * 60 * 1000 })

    return data as T
}

export async function fetchTextWithCache(
    url: string,
    options: FetchOptions = {}
): Promise<string> {
    const { cacheMinutes = 5, bypassCache = false } = options
    const now = Date.now()

    if (!bypassCache) {
        const cached = cache.get(url)
        if (cached && cached.expires > now) {
            return cached.data as string
        }
    }

    const response = await fetch(url)
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
    }

    const text = await response.text()
    cache.set(url, { data: text, expires: now + cacheMinutes * 60 * 1000 })

    return text
}

export function clearCache(url?: string) {
    if (url) {
        cache.delete(url)
    } else {
        cache.clear()
    }
}

