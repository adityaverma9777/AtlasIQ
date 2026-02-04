/**
 * YouTube Videos Service
 * Fetches trending and educational videos
 * Note: Uses RSS feeds to avoid API quota limits
 */

import { fetchRssWithProxy } from './rssProxy'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface YouTubeVideo {
    id: string
    title: string
    channelName: string
    channelId?: string
    thumbnail: string
    duration?: string
    viewCount?: string
    publishedAt?: string
    description?: string
    embedUrl: string
}

// ─────────────────────────────────────────────────────────────
// YouTube RSS Parser
// ─────────────────────────────────────────────────────────────

function parseYouTubeRss(xmlText: string): YouTubeVideo[] {
    try {
        const doc = new DOMParser().parseFromString(xmlText, 'text/xml')
        const entries = Array.from(doc.querySelectorAll('entry'))

        return entries.map((entry) => {
            const videoId = entry.querySelector('yt\\:videoId, videoId')?.textContent?.trim() || ''
            const title = entry.querySelector('title')?.textContent?.trim() || ''
            const channelName = entry.querySelector('author name')?.textContent?.trim() || ''
            const channelId = entry.querySelector('yt\\:channelId, channelId')?.textContent?.trim()
            const published = entry.querySelector('published')?.textContent?.trim()
            const description = entry.querySelector('media\\:description, description')?.textContent?.trim()

            // Get thumbnail
            const mediaGroup = entry.querySelector('media\\:group')
            const thumbnail = mediaGroup?.querySelector('media\\:thumbnail')?.getAttribute('url') ||
                `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`

            return {
                id: videoId,
                title,
                channelName,
                channelId,
                thumbnail,
                publishedAt: published ? new Date(published).toISOString() : undefined,
                description: description?.slice(0, 200),
                embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`,
            }
        }).filter(v => v.id && v.title)
    } catch {
        return []
    }
}

// ─────────────────────────────────────────────────────────────
// Curated Channels (Educational & High-Value)
// ─────────────────────────────────────────────────────────────

const CURATED_CHANNELS = [
    { id: 'UCBcRF18a7Qf58cCRy5xuWwQ', name: 'WION' },              // News
    { id: 'UCNye-wNBqNL5ZzHSJj3l8Bg', name: 'Al Jazeera English' }, // News
    { id: 'UCupvZG-5ko_eiXAupbDfxWw', name: 'CNN' },               // News
    { id: 'UC16niRr50-MSBwiO3YDb3RA', name: 'Bloomberg' },         // Finance
    { id: 'UCVHFbqXqoYvEWM1Ddxl0QKg', name: 'Veritasium' },        // Science
    { id: 'UC6nSFpj9HTCZ5t-N3Rm3-HA', name: 'Vsauce' },            // Science
    { id: 'UCsooa4yRKGN_zEE8iknghZA', name: 'TED-Ed' },            // Education
    { id: 'UCsXVk37bltHxD1rDPwtNM8Q', name: 'Kurzgesagt' },        // Education
]

// ─────────────────────────────────────────────────────────────
// Fetch from Channel
// ─────────────────────────────────────────────────────────────

export async function fetchChannelVideos(channelId: string, opts: {
    count?: number
    bypassCache?: boolean
} = {}): Promise<YouTubeVideo[]> {
    const { count = 5, bypassCache = false } = opts

    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`

    try {
        const xmlText = await fetchRssWithProxy(rssUrl, { cacheMinutes: 30, bypassCache })
        return parseYouTubeRss(xmlText).slice(0, count)
    } catch (error) {
        console.error(`Failed to fetch channel ${channelId}:`, error)
        return []
    }
}

// ─────────────────────────────────────────────────────────────
// Trending/Curated Videos Feed
// ─────────────────────────────────────────────────────────────

export async function fetchTrendingVideos(opts: {
    count?: number
    bypassCache?: boolean
} = {}): Promise<YouTubeVideo[]> {
    const { count = 8, bypassCache = false } = opts

    // Fetch from multiple curated channels in parallel
    const channelsToFetch = CURATED_CHANNELS.slice(0, 4)

    const results = await Promise.all(
        channelsToFetch.map(ch =>
            fetchChannelVideos(ch.id, { count: 3, bypassCache }).catch(() => [])
        )
    )

    // Flatten and sort by recency
    const allVideos = results.flat()
    allVideos.sort((a, b) => {
        const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0
        const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0
        return dateB - dateA
    })

    return allVideos.slice(0, count)
}

// ─────────────────────────────────────────────────────────────
// Search-based Videos (using Google)
// ─────────────────────────────────────────────────────────────

export async function searchYouTubeVideos(query: string, opts: {
    count?: number
    bypassCache?: boolean
} = {}): Promise<YouTubeVideo[]> {
    const { count = 6, bypassCache = false } = opts

    // YouTube search requires API key, fallback to curated channels
    // TODO: In production, use YouTube Data API with query parameter
    void query // Placeholder for future API integration
    return fetchTrendingVideos({ count, bypassCache })
}

