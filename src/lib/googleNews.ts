import { fetchTextWithCache } from './fetch'
import type { Headline } from './news'

function stripHtml(text: string): string {
    return text
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
}

function parseRssItems(xmlText: string): Array<{
    title: string
    link: string
    pubDate?: string
    sourceName?: string
    sourceUrl?: string
    description?: string
    imageUrl?: string
}> {
    try {
        const doc = new DOMParser().parseFromString(xmlText, 'text/xml')
        const items = Array.from(doc.querySelectorAll('item'))
        return items.map((item) => {
            const title = item.querySelector('title')?.textContent?.trim() || ''
            const link = item.querySelector('link')?.textContent?.trim() || ''
            const pubDate = item.querySelector('pubDate')?.textContent?.trim() || undefined
            const description = item.querySelector('description')?.textContent?.trim() || undefined

            const sourceEl = item.querySelector('source')
            const sourceName = sourceEl?.textContent?.trim() || undefined
            const sourceUrl = sourceEl?.getAttribute('url') || undefined

            let imageUrl: string | undefined
            const media = item.querySelector('media\\:thumbnail, media\\:content, enclosure') as Element | null
            if (media) {
                imageUrl = media.getAttribute('url') || undefined
            }

            return { title, link, pubDate, sourceName, sourceUrl, description, imageUrl }
        })
    } catch {
        return []
    }
}

async function fetchRssWithProxy(rssUrl: string, bypassCache: boolean): Promise<string> {
    // Try CORS proxy first (more reliable for RSS)
    const corsProxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`
    
    try {
        const text = await fetchTextWithCache(corsProxy, { cacheMinutes: 5, bypassCache })
        if (text && text.includes('<item>')) {
            return text
        }
    } catch {
        // fall through to next method
    }

    // Fallback: try direct fetch (might work in some browsers)
    try {
        const response = await fetch(rssUrl)
        if (response.ok) {
            return await response.text()
        }
    } catch {
        // fall through
    }

    // Last resort: try via Jina reader
    try {
        const readerUrl = `https://r.jina.ai/${rssUrl}`
        const text = await fetchTextWithCache(readerUrl, { cacheMinutes: 5, bypassCache })
        if (text && (text.includes('<item>') || text.includes('<rss'))) {
            return text
        }
    } catch {
        // all methods failed
    }

    throw new Error('Failed to fetch Google News RSS feed')
}

export async function fetchGoogleNewsIndiaHeadlines(opts: {
    page: number
    pageSize: number
    bypassCache?: boolean
}): Promise<Headline[]> {
    const { page, pageSize, bypassCache = false } = opts

    // India edition (English)
    const rssUrl = 'https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en'

    try {
        const xmlText = await fetchRssWithProxy(rssUrl, bypassCache)
        const items = parseRssItems(xmlText).filter((i) => i.title && (i.sourceUrl || i.link))

        if (items.length === 0) {
            throw new Error('No articles found in RSS feed')
        }

        const start = (page - 1) * pageSize
        const slice = items.slice(start, start + pageSize)

        return slice.map((i) => {
            const url = i.sourceUrl || i.link
            const rawSummary = i.description ? stripHtml(i.description) : ''
            const summary = rawSummary.length > 220 ? `${rawSummary.slice(0, 220)}…` : rawSummary

            return {
                title: i.title,
                summary: summary || 'Read more',
                tag: i.sourceName || 'Google News',
                url,
                imageUrl: i.imageUrl,
                publishedAt: i.pubDate ? new Date(i.pubDate).toISOString() : undefined,
            }
        })
    } catch (error) {
        console.error('Google News India fetch error:', error)
        throw new Error(`Failed to load India headlines: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
}


