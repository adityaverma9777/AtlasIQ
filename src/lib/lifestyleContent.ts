/**
 * Lifestyle Content Service
 * Fetches travel, food, culture, and lifestyle articles
 */

import { fetchRssWithProxy, parseRssItems, stripHtml } from './rssProxy'
import type { Headline } from './news'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface LifestyleItem extends Headline {
    category: 'travel' | 'food' | 'culture' | 'lifestyle'
    readTime?: string
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
        const xmlText = await fetchRssWithProxy(rssUrl, { cacheMinutes: 30, bypassCache })
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
        const xmlText = await fetchRssWithProxy(rssUrl, { cacheMinutes: 30, bypassCache })
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
        const xmlText = await fetchRssWithProxy(rssUrl, { cacheMinutes: 30, bypassCache })
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

