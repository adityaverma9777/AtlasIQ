// Wikipedia article ingestion with noise filtering

import { fetchWithCache } from './fetch'

export interface WikipediaImage {
    url: string
    caption?: string
    width?: number
    height?: number
}

export interface WikipediaSection {
    title: string
    content: string
    level: number
}

export interface WikipediaArticle {
    title: string
    summary: string
    sections: WikipediaSection[]
    infobox: { label: string; value: string }[]
    images: WikipediaImage[]
    categories: string[]
    relatedLinks: string[]
    sourceUrl: string
}

// sections to always filter out
const SKIP_SECTIONS = new Set([
    'references',
    'see also',
    'external links',
    'further reading',
    'notes',
    'footnotes',
    'bibliography',
    'sources',
    'citations',
    'editing',
    'governance',
    'contributors',
    'talk',
    'history of changes',
])

// check if section should be skipped
function shouldSkipSection(title: string): boolean {
    const lower = title.toLowerCase().trim()
    if (SKIP_SECTIONS.has(lower)) return true
    if (lower.includes('wikipedia')) return true
    if (lower.includes('edit')) return true
    return false
}

// clean section content
function cleanContent(text: string): string {
    return text
        .replace(/\[\d+\]/g, '') // remove citation numbers
        .replace(/\[citation needed\]/gi, '')
        .replace(/\[clarification needed\]/gi, '')
        .replace(/\n{3,}/g, '\n\n') // collapse multiple newlines
        .trim()
}

interface WikiSummary {
    title: string
    extract: string
    description?: string
    thumbnail?: { source: string; width: number; height: number }
    originalimage?: { source: string; width: number; height: number }
    content_urls?: { desktop: { page: string } }
}

interface WikiParseResponse {
    parse: {
        title: string
        sections: { line: string; level: string; index: string }[]
        images: string[]
        categories: { '*': string }[]
        links: { '*': string }[]
    }
}

// main fetch function
export async function fetchWikipediaSummary(topic: string): Promise<WikipediaArticle | null> {
    try {
        const encoded = encodeURIComponent(topic.replace(/\s+/g, '_'))
        const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`

        const summary = await fetchWithCache<WikiSummary>(summaryUrl, {
            cacheMinutes: 60 * 24,
        })

        if (!summary?.extract) return null

        // get full article
        const fullArticle = await fetchFullArticle(topic)

        const images: WikipediaImage[] = []

        // hero image
        if (summary.originalimage?.source) {
            images.push({
                url: summary.originalimage.source,
                width: summary.originalimage.width,
                height: summary.originalimage.height,
            })
        } else if (summary.thumbnail?.source) {
            // upscale thumbnail
            images.push({
                url: summary.thumbnail.source.replace(/\/\d+px-/, '/800px-'),
                width: 800,
                height: summary.thumbnail.height,
            })
        }

        // add section images (limited)
        if (fullArticle?.images) {
            images.push(...fullArticle.images.slice(0, 4))
        }

        return {
            title: summary.title,
            summary: summary.description || summary.extract.slice(0, 200),
            sections: fullArticle?.sections || [
                { title: 'Overview', content: cleanContent(summary.extract), level: 1 },
            ],
            infobox: fullArticle?.infobox || [],
            images,
            categories: fullArticle?.categories || [],
            relatedLinks: fullArticle?.relatedLinks || [],
            sourceUrl: summary.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encoded}`,
        }
    } catch {
        return null
    }
}

// fetch full article
async function fetchFullArticle(topic: string): Promise<{
    sections: WikipediaSection[]
    infobox: { label: string; value: string }[]
    images: WikipediaImage[]
    categories: string[]
    relatedLinks: string[]
} | null> {
    try {
        const encoded = encodeURIComponent(topic.replace(/\s+/g, '_'))
        const parseUrl = `https://en.wikipedia.org/w/api.php?action=parse&page=${encoded}&format=json&prop=sections|categories|links|images&origin=*`

        const data = await fetchWithCache<WikiParseResponse>(parseUrl, {
            cacheMinutes: 60 * 24,
        })

        if (!data?.parse) return null

        const sections = await fetchSectionContents(topic, data.parse.sections)
        const images = await fetchImageUrls(data.parse.images.slice(0, 5))

        // filter categories
        const categories = data.parse.categories
            ?.map((c) => c['*'].replace(/_/g, ' '))
            .filter((c) => !c.startsWith('Articles') && !c.startsWith('All ') && !c.includes('Wikipedia'))
            .slice(0, 5) || []

        const relatedLinks = data.parse.links
            ?.filter((l) => l['*'] && !l['*'].includes(':'))
            .map((l) => l['*'])
            .slice(0, 8) || []

        return { sections, infobox: [], images, categories, relatedLinks }
    } catch {
        return null
    }
}

// fetch section contents
async function fetchSectionContents(
    topic: string,
    sectionMeta: { line: string; level: string; index: string }[]
): Promise<WikipediaSection[]> {
    const sections: WikipediaSection[] = []
    const encoded = encodeURIComponent(topic.replace(/\s+/g, '_'))

    // get intro
    try {
        const introUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encoded}&prop=extracts&exintro=1&explaintext=1&format=json&origin=*`
        const introData = await fetchWithCache<{
            query: { pages: Record<string, { extract?: string }> }
        }>(introUrl, { cacheMinutes: 60 * 24 })

        const pages = introData?.query?.pages
        const intro = pages ? Object.values(pages)[0]?.extract : null
        if (intro) {
            sections.push({ title: 'Overview', content: cleanContent(intro), level: 1 })
        }
    } catch { /* skip */ }

    // get key sections (filter noise)
    const keySections = sectionMeta
        .filter((s) => parseInt(s.level) <= 2 && !shouldSkipSection(s.line))
        .slice(0, 5)

    for (const sec of keySections) {
        if (!sec.line) continue

        try {
            const secUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encoded}&prop=extracts&explaintext=1&exsectionformat=plain&section=${sec.index}&format=json&origin=*`
            const secData = await fetchWithCache<{
                query: { pages: Record<string, { extract?: string }> }
            }>(secUrl, { cacheMinutes: 60 * 24 })

            const pages = secData?.query?.pages
            const content = pages ? Object.values(pages)[0]?.extract : null
            if (content && content.length > 100) {
                sections.push({
                    title: sec.line,
                    content: cleanContent(content.slice(0, 2000)),
                    level: parseInt(sec.level),
                })
            }
        } catch { /* skip */ }
    }

    return sections
}

// fetch image URLs
async function fetchImageUrls(filenames: string[]): Promise<WikipediaImage[]> {
    const images: WikipediaImage[] = []

    for (const filename of filenames) {
        // skip icons and logos
        if (!filename) continue
        const lower = filename.toLowerCase()
        if (lower.endsWith('.svg') || lower.includes('icon') || lower.includes('logo') || lower.includes('flag')) continue

        try {
            const url = `https://en.wikipedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url|size&format=json&origin=*`
            const data = await fetchWithCache<{
                query: { pages: Record<string, { imageinfo?: { url: string; width: number; height: number }[] }> }
            }>(url, { cacheMinutes: 60 * 24 })

            const pages = data?.query?.pages
            if (pages) {
                const page = Object.values(pages)[0]
                const info = page?.imageinfo?.[0]
                if (info?.url && !info.url.includes('.svg')) {
                    images.push({
                        url: info.url,
                        width: info.width,
                        height: info.height,
                    })
                }
            }
        } catch { /* skip */ }
    }

    return images
}

// check topic exists
export async function checkWikipediaTopic(topic: string): Promise<boolean> {
    try {
        const result = await fetchWikipediaSummary(topic)
        return result !== null
    } catch {
        return false
    }
}

