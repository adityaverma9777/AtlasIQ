/**
 * Trending Topics Service
 * Discovers trending topics from multiple sources for AI article generation
 */

import { fetchTextWithCache } from './fetch'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface TrendingTopic {
    topic: string
    score: number
    source: 'google_trends' | 'news_aggregate' | 'social'
    category?: string
    relatedQueries?: string[]
    region?: string
}

// ─────────────────────────────────────────────────────────────
// Google Trends RSS
// ─────────────────────────────────────────────────────────────

async function fetchRssWithProxy(rssUrl: string, bypassCache = false): Promise<string> {
    const proxies = [
        `https://corsproxy.io/?${encodeURIComponent(rssUrl)}`,
        `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`,
    ]

    for (const proxyUrl of proxies) {
        try {
            const text = await fetchTextWithCache(proxyUrl, { cacheMinutes: 60, bypassCache })
            if (text && (text.includes('<item>') || text.includes('<entry>'))) {
                return text
            }
        } catch {
            continue
        }
    }

    throw new Error('Failed to fetch RSS feed')
}

export async function fetchGoogleTrends(opts: {
    region?: string
    bypassCache?: boolean
} = {}): Promise<TrendingTopic[]> {
    const { region = 'US', bypassCache = false } = opts

    // Google Trends Daily Trends RSS
    const rssUrl = `https://trends.google.com/trending/rss?geo=${region}`

    try {
        const xmlText = await fetchRssWithProxy(rssUrl, bypassCache)
        const doc = new DOMParser().parseFromString(xmlText, 'text/xml')
        const items = Array.from(doc.querySelectorAll('item'))

        return items.slice(0, 20).map((item, index) => {
            const title = item.querySelector('title')?.textContent?.trim() || ''
            const traffic = item.querySelector('ht\\:approx_traffic, approx_traffic')?.textContent?.trim()

            // Parse traffic to score (e.g., "500K+")
            let score = 100 - index * 5 // Default by position
            if (traffic) {
                const match = traffic.match(/(\d+)([KMB])?/i)
                if (match) {
                    const num = parseInt(match[1])
                    const multiplier = { 'K': 1000, 'M': 1000000, 'B': 1000000000 }[match[2]?.toUpperCase()] || 1
                    score = Math.min(100, Math.log10(num * multiplier) * 10)
                }
            }

            // Get related queries
            const newsItems = Array.from(item.querySelectorAll('ht\\:news_item_title, news_item_title'))
            const relatedQueries = newsItems.map(n => n.textContent?.trim()).filter(Boolean) as string[]

            return {
                topic: title,
                score,
                source: 'google_trends' as const,
                relatedQueries: relatedQueries.slice(0, 3),
                region,
            }
        }).filter(t => t.topic)
    } catch (error) {
        console.error('Google Trends fetch error:', error)
        return []
    }
}

// ─────────────────────────────────────────────────────────────
// Aggregate from News Headlines
// ─────────────────────────────────────────────────────────────

export async function aggregateTrendingFromNews(headlines: Array<{ title: string; tag: string }>): Promise<TrendingTopic[]> {
    const topicCounts = new Map<string, number>()

    // Extract key entities/topics from headlines
    for (const headline of headlines) {
        // Simple extraction: capitalize words that might be proper nouns/topics
        const words = headline.title.split(/\s+/)
        const potentialTopics = words.filter(w =>
            w.length > 3 &&
            /^[A-Z]/.test(w) && // Starts with capital
            !/^(The|And|For|With|From|About|This|That|What|When|Where|Why|How)$/.test(w)
        )

        for (const topic of potentialTopics) {
            const normalized = topic.replace(/[^a-zA-Z0-9\s]/g, '').trim()
            if (normalized.length > 2) {
                topicCounts.set(normalized, (topicCounts.get(normalized) || 0) + 1)
            }
        }
    }

    // Sort by frequency and return top topics
    const sortedTopics = Array.from(topicCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)

    return sortedTopics.map(([topic, count]) => ({
        topic,
        score: Math.min(100, count * 20),
        source: 'news_aggregate' as const,
    }))
}

// ─────────────────────────────────────────────────────────────
// Combined Trending Topics
// ─────────────────────────────────────────────────────────────

export async function getTrendingTopics(opts: {
    count?: number
    regions?: string[]
    bypassCache?: boolean
} = {}): Promise<TrendingTopic[]> {
    const { count = 10, regions = ['US', 'IN'], bypassCache = false } = opts

    const allTopics: TrendingTopic[] = []

    // Fetch from multiple regions
    const regionResults = await Promise.all(
        regions.map(region =>
            fetchGoogleTrends({ region, bypassCache }).catch(() => [])
        )
    )

    for (const topics of regionResults) {
        allTopics.push(...topics)
    }

    // Deduplicate and score
    const topicMap = new Map<string, TrendingTopic>()

    for (const topic of allTopics) {
        const key = topic.topic.toLowerCase()
        const existing = topicMap.get(key)

        if (existing) {
            existing.score = Math.max(existing.score, topic.score)
        } else {
            topicMap.set(key, topic)
        }
    }

    // Sort by score and return top N
    return Array.from(topicMap.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, count)
}

// ─────────────────────────────────────────────────────────────
// Hot Topics (curated for article generation)
// ─────────────────────────────────────────────────────────────

export async function getHotTopicsForArticles(opts: {
    count?: number
    bypassCache?: boolean
} = {}): Promise<string[]> {
    const { count = 5, bypassCache = false } = opts

    const topics = await getTrendingTopics({ count: count * 2, bypassCache })

    // Filter for topics that would make good articles
    const goodTopics = topics.filter(t =>
        t.topic.length > 3 &&
        t.topic.length < 50 &&
        !/^\d+$/.test(t.topic) // Not just numbers
    )

    return goodTopics.slice(0, count).map(t => t.topic)
}
