/**
 * Sports News Service
 * Fetches sports headlines, cricket updates, and live scores
 */

import { fetchTextWithCache } from './fetch'
import type { Headline } from './news'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface SportsItem extends Headline {
    sport: 'cricket' | 'football' | 'tennis' | 'general'
    isLive?: boolean
    matchStatus?: string
}

export interface LiveMatch {
    id: string
    title: string
    team1: string
    team2: string
    score1?: string
    score2?: string
    status: 'live' | 'upcoming' | 'completed'
    sport: string
    venue?: string
    startTime?: string
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
            const text = await fetchTextWithCache(proxyUrl, { cacheMinutes: 10, bypassCache })
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
// General Sports News
// ─────────────────────────────────────────────────────────────

export async function fetchSportsHeadlines(opts: {
    count?: number
    bypassCache?: boolean
} = {}): Promise<SportsItem[]> {
    const { count = 10, bypassCache = false } = opts

    const rssUrl = 'https://news.google.com/rss/search?q=sports+news&hl=en-US&gl=US&ceid=US:en'

    try {
        const xmlText = await fetchRssWithProxy(rssUrl, bypassCache)
        const items = parseRssItems(xmlText).filter(i => i.title && i.link)

        return items.slice(0, count).map(i => {
            const rawSummary = i.description ? stripHtml(i.description) : ''
            const summary = rawSummary.length > 180 ? `${rawSummary.slice(0, 180)}…` : rawSummary

            // Detect sport type from title
            const titleLower = i.title.toLowerCase()
            let sport: SportsItem['sport'] = 'general'
            if (titleLower.includes('cricket') || titleLower.includes('icc') || titleLower.includes('bcci')) {
                sport = 'cricket'
            } else if (titleLower.includes('football') || titleLower.includes('soccer') || titleLower.includes('premier league')) {
                sport = 'football'
            } else if (titleLower.includes('tennis') || titleLower.includes('wimbledon') || titleLower.includes('grand slam')) {
                sport = 'tennis'
            }

            return {
                title: i.title,
                summary: summary || 'Read more',
                tag: i.sourceName || 'Sports',
                url: i.link,
                imageUrl: i.imageUrl,
                publishedAt: i.pubDate ? new Date(i.pubDate).toISOString() : undefined,
                sport,
            }
        })
    } catch (error) {
        console.error('Sports news fetch error:', error)
        return []
    }
}

// ─────────────────────────────────────────────────────────────
// Cricket / ICC Updates
// ─────────────────────────────────────────────────────────────

export async function fetchCricketNews(opts: {
    count?: number
    bypassCache?: boolean
} = {}): Promise<SportsItem[]> {
    const { count = 8, bypassCache = false } = opts

    const rssUrl = 'https://news.google.com/rss/search?q=cricket+icc+live+match&hl=en-IN&gl=IN&ceid=IN:en'

    try {
        const xmlText = await fetchRssWithProxy(rssUrl, bypassCache)
        const items = parseRssItems(xmlText).filter(i => i.title && i.link)

        return items.slice(0, count).map(i => {
            const rawSummary = i.description ? stripHtml(i.description) : ''
            const summary = rawSummary.length > 180 ? `${rawSummary.slice(0, 180)}…` : rawSummary

            // Detect if it's a live match
            const titleLower = i.title.toLowerCase()
            const isLive = titleLower.includes('live') || titleLower.includes('score') || titleLower.includes('vs')

            return {
                title: i.title,
                summary: summary || 'Read more',
                tag: i.sourceName || 'Cricket',
                url: i.link,
                imageUrl: i.imageUrl,
                publishedAt: i.pubDate ? new Date(i.pubDate).toISOString() : undefined,
                sport: 'cricket' as const,
                isLive,
            }
        })
    } catch (error) {
        console.error('Cricket news fetch error:', error)
        return []
    }
}

// ─────────────────────────────────────────────────────────────
// Live Cricket Scores (from free API)
// ─────────────────────────────────────────────────────────────

export async function fetchLiveCricketMatches(opts: {
    bypassCache?: boolean
} = {}): Promise<LiveMatch[]> {
    const { bypassCache = false } = opts

    // Using Cricbuzz RSS as a fallback for live scores
    const rssUrl = 'https://news.google.com/rss/search?q=cricket+live+score+today&hl=en-IN&gl=IN&ceid=IN:en'

    try {
        const xmlText = await fetchRssWithProxy(rssUrl, bypassCache)
        const items = parseRssItems(xmlText).filter(i => i.title && i.link)

        // Parse live matches from headlines
        const liveMatches: LiveMatch[] = []

        for (const item of items.slice(0, 5)) {
            const title = item.title
            // Try to extract match info from title (e.g., "IND vs AUS Live Score: India 250/4")
            const vsMatch = title.match(/(\w+)\s*(?:vs?|VS)\s*(\w+)/i)

            if (vsMatch) {
                const scoreMatch = title.match(/(\d+\/\d+|\d+-\d+)/g)

                liveMatches.push({
                    id: item.link,
                    title: title,
                    team1: vsMatch[1],
                    team2: vsMatch[2],
                    score1: scoreMatch?.[0],
                    score2: scoreMatch?.[1],
                    status: title.toLowerCase().includes('live') ? 'live' : 'upcoming',
                    sport: 'cricket',
                })
            }
        }

        return liveMatches
    } catch (error) {
        console.error('Live cricket fetch error:', error)
        return []
    }
}

// ─────────────────────────────────────────────────────────────
// Combined Sports Feed
// ─────────────────────────────────────────────────────────────

export async function fetchSportsFeed(opts: {
    count?: number
    bypassCache?: boolean
} = {}): Promise<SportsItem[]> {
    const { count = 12, bypassCache = false } = opts

    const [general, cricket] = await Promise.all([
        fetchSportsHeadlines({ count: Math.ceil(count / 2), bypassCache }),
        fetchCricketNews({ count: Math.ceil(count / 2), bypassCache }),
    ])

    // Prioritize live matches and interleave
    const live = [...general, ...cricket].filter(s => s.isLive)
    const nonLive = [...general, ...cricket].filter(s => !s.isLive)

    return [...live, ...nonLive].slice(0, count)
}
