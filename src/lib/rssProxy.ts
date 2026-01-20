/**
 * Shared RSS Proxy Utility
 * Centralizes the RSS fetching logic with proper fallbacks
 */

import { fetchTextWithCache } from './fetch'

// Detect if running on Vercel or localhost
function getBaseUrl(): string {
    if (typeof window !== 'undefined') {
        return window.location.origin
    }
    return ''
}

/**
 * Fetch RSS feed with CORS bypass
 * Uses Vercel serverless proxy in production, public proxies in dev
 */
export async function fetchRssWithProxy(
    rssUrl: string,
    opts: { cacheMinutes?: number; bypassCache?: boolean } = {}
): Promise<string> {
    const { cacheMinutes = 15, bypassCache = false } = opts
    const baseUrl = getBaseUrl()

    // Strategy 1: Use our Vercel serverless proxy (works in production)
    if (baseUrl && !baseUrl.includes('localhost')) {
        try {
            const proxyUrl = `${baseUrl}/api/rss-proxy?url=${encodeURIComponent(rssUrl)}`
            const text = await fetchTextWithCache(proxyUrl, { cacheMinutes, bypassCache })
            if (text && (text.includes('<item>') || text.includes('<entry>'))) {
                return text
            }
        } catch (error) {
            console.warn('Serverless proxy failed, trying fallbacks:', error)
        }
    }

    // Strategy 2: Public CORS proxies (works in local dev)
    const proxies = [
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(rssUrl)}`,
        `https://corsproxy.io/?${encodeURIComponent(rssUrl)}`,
        `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`,
    ]

    for (const proxyUrl of proxies) {
        try {
            const text = await fetchTextWithCache(proxyUrl, { cacheMinutes, bypassCache })
            if (text && (text.includes('<item>') || text.includes('<entry>'))) {
                return text
            }
        } catch {
            continue
        }
    }

    // Strategy 3: Direct fetch (works if CORS is not an issue)
    try {
        const response = await fetch(rssUrl)
        if (response.ok) {
            const text = await response.text()
            if (text.includes('<item>') || text.includes('<entry>')) {
                return text
            }
        }
    } catch {
        // fall through
    }

    throw new Error('Failed to fetch RSS feed')
}

/**
 * Parse RSS items from XML text
 */
export function parseRssItems(xmlText: string): Array<{
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

/**
 * Strip HTML tags from text
 */
export function stripHtml(text: string): string {
    return text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}
