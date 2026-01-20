/**
 * Lifestyle Content Service
 * Fetches travel, food, culture, and lifestyle articles
 */

import { fetchTextWithCache } from './fetch'
import type { Headline } from './news'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface LifestyleItem extends Headline {
    category: 'travel' | 'food' | 'culture' | 'lifestyle'
    readTime?: string
}

// ─────────────────────────────────────────────────────────────
// RSS Parser
// ─────────────────────────────────────────────────────────────

function parseRssItems(xmlText: string): Array<{
    title: string
    link: string
    pubDate?: string
    sourceName?: string
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

            let imageUrl: string | undefined
            const media = item.querySelector('media\\:thumbnail, media\\:content, enclosure') as Element | null
            if (media) {
                imageUrl = media.getAttribute('url') || undefined
            }

            return { title, link, pubDate, sourceName, description, imageUrl }
        })
    } catch {
        return []
    }
}

function stripHtml(text: string): string {
    return text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

async function fetchRssWithProxy(rssUrl: string, bypassCache = false): Promise<string> {
    const proxies = [
        `https://corsproxy.io/?${encodeURIComponent(rssUrl)}`,
        `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`,
    ]

    for (const proxyUrl of proxies) {
        try {
            const text = await fetchTextWithCache(proxyUrl, { cacheMinutes: 30, bypassCache })
            if (text && text.includes('<item>')) {
                return text
            }
        } catch {
            continue
        }
    }

    throw new Error('Failed to fetch RSS feed')
}

// ─────────────────────────────────────────────────────────────
// Travel Articles
// ─────────────────────────────────────────────────────────────

export async function fetchTravelArticles(opts: {
    count?: number
    bypassCache?: boolean
} = {}): Promise<LifestyleItem[]> {
    const { count = 6, bypassCache = false } = opts

    const rssUrl = 'https://news.google.com/rss/search?q=travel+destination+vacation+tourism&hl=en-US&gl=US&ceid=US:en'

    try {
        const xmlText = await fetchRssWithProxy(rssUrl, bypassCache)
        const items = parseRssItems(xmlText).filter(i => i.title && i.link)

        return items.slice(0, count).map(i => {
            const rawSummary = i.description ? stripHtml(i.description) : ''
            const summary = rawSummary.length > 180 ? `${rawSummary.slice(0, 180)}…` : rawSummary

            return {
                title: i.title,
                summary: summary || 'Discover new destinations',
                tag: i.sourceName || 'Travel',
                url: i.link,
                imageUrl: i.imageUrl,
                publishedAt: i.pubDate ? new Date(i.pubDate).toISOString() : undefined,
                category: 'travel' as const,
                readTime: '4 min read',
            }
        })
    } catch (error) {
        console.error('Travel articles fetch error:', error)
        return []
    }
}

// ─────────────────────────────────────────────────────────────
// Food Articles
// ─────────────────────────────────────────────────────────────

export async function fetchFoodArticles(opts: {
    count?: number
    bypassCache?: boolean
} = {}): Promise<LifestyleItem[]> {
    const { count = 6, bypassCache = false } = opts

    const rssUrl = 'https://news.google.com/rss/search?q=food+recipes+restaurants+cuisine&hl=en-US&gl=US&ceid=US:en'

    try {
        const xmlText = await fetchRssWithProxy(rssUrl, bypassCache)
        const items = parseRssItems(xmlText).filter(i => i.title && i.link)

        return items.slice(0, count).map(i => {
            const rawSummary = i.description ? stripHtml(i.description) : ''
            const summary = rawSummary.length > 180 ? `${rawSummary.slice(0, 180)}…` : rawSummary

            return {
                title: i.title,
                summary: summary || 'Explore culinary delights',
                tag: i.sourceName || 'Food',
                url: i.link,
                imageUrl: i.imageUrl,
                publishedAt: i.pubDate ? new Date(i.pubDate).toISOString() : undefined,
                category: 'food' as const,
                readTime: '3 min read',
            }
        })
    } catch (error) {
        console.error('Food articles fetch error:', error)
        return []
    }
}

// ─────────────────────────────────────────────────────────────
// Culture & Arts
// ─────────────────────────────────────────────────────────────

export async function fetchCultureArticles(opts: {
    count?: number
    bypassCache?: boolean
} = {}): Promise<LifestyleItem[]> {
    const { count = 6, bypassCache = false } = opts

    const rssUrl = 'https://news.google.com/rss/search?q=art+culture+museum+exhibition&hl=en-US&gl=US&ceid=US:en'

    try {
        const xmlText = await fetchRssWithProxy(rssUrl, bypassCache)
        const items = parseRssItems(xmlText).filter(i => i.title && i.link)

        return items.slice(0, count).map(i => {
            const rawSummary = i.description ? stripHtml(i.description) : ''
            const summary = rawSummary.length > 180 ? `${rawSummary.slice(0, 180)}…` : rawSummary

            return {
                title: i.title,
                summary: summary || 'Explore art and culture',
                tag: i.sourceName || 'Culture',
                url: i.link,
                imageUrl: i.imageUrl,
                publishedAt: i.pubDate ? new Date(i.pubDate).toISOString() : undefined,
                category: 'culture' as const,
                readTime: '5 min read',
            }
        })
    } catch (error) {
        console.error('Culture articles fetch error:', error)
        return []
    }
}

// ─────────────────────────────────────────────────────────────
// Combined Lifestyle Feed
// ─────────────────────────────────────────────────────────────

export async function fetchLifestyleFeed(opts: {
    count?: number
    bypassCache?: boolean
} = {}): Promise<LifestyleItem[]> {
    const { count = 12, bypassCache = false } = opts

    const [travel, food, culture] = await Promise.all([
        fetchTravelArticles({ count: Math.ceil(count / 3), bypassCache }),
        fetchFoodArticles({ count: Math.ceil(count / 3), bypassCache }),
        fetchCultureArticles({ count: Math.ceil(count / 3), bypassCache }),
    ])

    // Interleave results for variety
    const combined: LifestyleItem[] = []
    const maxLen = Math.max(travel.length, food.length, culture.length)

    for (let i = 0; i < maxLen; i++) {
        if (travel[i]) combined.push(travel[i])
        if (food[i]) combined.push(food[i])
        if (culture[i]) combined.push(culture[i])
    }

    return combined.slice(0, count)
}
