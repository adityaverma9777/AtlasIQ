import { fetchRssWithProxy, stripHtml } from './rssProxy'
import type { Headline } from './news'

export async function fetchGoogleNewsIndiaHeadlines(opts: {
    page: number
    pageSize: number
    bypassCache?: boolean
}): Promise<Headline[]> {
    const { page, pageSize, bypassCache = false } = opts

    // India edition (English)
    const rssUrl = 'https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en'

    try {
        const xmlText = await fetchRssWithProxy(rssUrl, { cacheMinutes: 5, bypassCache })

        // Use shared parser but need to get sourceUrl from source element
        const doc = new DOMParser().parseFromString(xmlText, 'text/xml')
        const items = Array.from(doc.querySelectorAll('item')).map((item) => {
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
        }).filter((i) => i.title && (i.sourceUrl || i.link))

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

