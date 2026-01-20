/**
 * Entertainment News Service
 * Fetches Hollywood and Bollywood news from Google News RSS
 */

import { fetchTextWithCache } from './fetch'
import type { Headline } from './news'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface EntertainmentItem extends Headline {
    category: 'hollywood' | 'bollywood' | 'entertainment'
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
            const text = await fetchTextWithCache(proxyUrl, { cacheMinutes: 15, bypassCache })
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
// Hollywood News
// ─────────────────────────────────────────────────────────────

export async function fetchHollywoodNews(opts: {
    count?: number
    bypassCache?: boolean
} = {}): Promise<EntertainmentItem[]> {
    const { count = 8, bypassCache = false } = opts

    // Google News search for Hollywood entertainment
    const rssUrl = 'https://news.google.com/rss/search?q=hollywood+movies+celebrities&hl=en-US&gl=US&ceid=US:en'

    try {
        const xmlText = await fetchRssWithProxy(rssUrl, bypassCache)
        const items = parseRssItems(xmlText).filter(i => i.title && i.link)

        return items.slice(0, count).map(i => {
            const rawSummary = i.description ? stripHtml(i.description) : ''
            const summary = rawSummary.length > 180 ? `${rawSummary.slice(0, 180)}…` : rawSummary

            return {
                title: i.title,
                summary: summary || 'Read more',
                tag: i.sourceName || 'Hollywood',
                url: i.link,
                imageUrl: i.imageUrl,
                publishedAt: i.pubDate ? new Date(i.pubDate).toISOString() : undefined,
                category: 'hollywood' as const,
            }
        })
    } catch (error) {
        console.error('Hollywood news fetch error:', error)
        return []
    }
}

// ─────────────────────────────────────────────────────────────
// Bollywood News
// ─────────────────────────────────────────────────────────────

export async function fetchBollywoodNews(opts: {
    count?: number
    bypassCache?: boolean
} = {}): Promise<EntertainmentItem[]> {
    const { count = 8, bypassCache = false } = opts

    // Google News search for Bollywood entertainment
    const rssUrl = 'https://news.google.com/rss/search?q=bollywood+movies+celebrities&hl=en-IN&gl=IN&ceid=IN:en'

    try {
        const xmlText = await fetchRssWithProxy(rssUrl, bypassCache)
        const items = parseRssItems(xmlText).filter(i => i.title && i.link)

        return items.slice(0, count).map(i => {
            const rawSummary = i.description ? stripHtml(i.description) : ''
            const summary = rawSummary.length > 180 ? `${rawSummary.slice(0, 180)}…` : rawSummary

            return {
                title: i.title,
                summary: summary || 'Read more',
                tag: i.sourceName || 'Bollywood',
                url: i.link,
                imageUrl: i.imageUrl,
                publishedAt: i.pubDate ? new Date(i.pubDate).toISOString() : undefined,
                category: 'bollywood' as const,
            }
        })
    } catch (error) {
        console.error('Bollywood news fetch error:', error)
        return []
    }
}

// ─────────────────────────────────────────────────────────────
// Combined Entertainment Feed
// ─────────────────────────────────────────────────────────────

export async function fetchEntertainmentFeed(opts: {
    count?: number
    bypassCache?: boolean
} = {}): Promise<EntertainmentItem[]> {
    const { count = 12, bypassCache = false } = opts

    const [hollywood, bollywood] = await Promise.all([
        fetchHollywoodNews({ count: Math.ceil(count / 2), bypassCache }),
        fetchBollywoodNews({ count: Math.ceil(count / 2), bypassCache }),
    ])

    // Interleave results
    const combined: EntertainmentItem[] = []
    const maxLen = Math.max(hollywood.length, bollywood.length)

    for (let i = 0; i < maxLen; i++) {
        if (hollywood[i]) combined.push(hollywood[i])
        if (bollywood[i]) combined.push(bollywood[i])
    }

    return combined.slice(0, count)
}
