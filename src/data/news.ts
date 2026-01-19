export interface CachedNewsArticle {
    slug: string
    url: string
    title: string
    description?: string
    sourceName: string
    author?: string
    publishedAt?: string
    imageUrl?: string
    content?: string
    fullText?: string
    topics?: string[]
    images?: string[]
    cachedAt: number
    ttlHours: number
}

const STORAGE_KEY = 'atlasiq_news_articles'

function safeRead(): Record<string, CachedNewsArticle> {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY)
        if (!raw) return {}
        return JSON.parse(raw) as Record<string, CachedNewsArticle>
    } catch {
        return {}
    }
}

function safeWrite(store: Record<string, CachedNewsArticle>) {
    try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store))
    } catch {
        // ignore
    }
}

export function cacheNewsArticle(article: CachedNewsArticle): void {
    const store = safeRead()
    store[article.slug] = article
    safeWrite(store)
}

export function getCachedNewsArticle(slug: string): CachedNewsArticle | null {
    const store = safeRead()
    const found = store[slug]
    if (!found) return null

    const ageMs = Date.now() - found.cachedAt
    const ttlMs = found.ttlHours * 60 * 60 * 1000
    if (ageMs > ttlMs) {
        delete store[slug]
        safeWrite(store)
        return null
    }

    return found
}

export function cleanupExpiredNewsArticles(): void {
    const store = safeRead()
    let changed = false
    for (const [slug, item] of Object.entries(store)) {
        const ageMs = Date.now() - item.cachedAt
        const ttlMs = item.ttlHours * 60 * 60 * 1000
        if (ageMs > ttlMs) {
            delete store[slug]
            changed = true
        }
    }
    if (changed) safeWrite(store)
}


