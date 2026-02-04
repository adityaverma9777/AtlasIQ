/**
 * Exams Module
 * Fetches government exam notifications from official sources
 * Sources: UPSC, SSC, IBPS, RRB
 */

import { fetchTextWithCache } from '../fetch'
import type { ExamEntity, IndiaFetchOptions } from './types'
import { TTL, CORS_PROXY, titleToSlug, createEntityId, getExpiryDate } from './types'

// Official exam sources
const EXAM_SOURCES = {
    upsc: { name: 'UPSC', url: 'https://upsc.gov.in/', rss: 'https://upsc.gov.in/rss.xml' },
    ssc: { name: 'SSC', url: 'https://ssc.nic.in/', rss: 'https://ssc.nic.in/rss/rss.xml' },
    ibps: { name: 'IBPS', url: 'https://ibps.in/', rss: null },
    rrb: { name: 'RRB', url: 'https://rrbcdg.gov.in/', rss: null },
} as const

type ExamSource = keyof typeof EXAM_SOURCES

// Parse RSS feed
function parseRSS(xml: string): Array<{ title: string; link: string; description: string; pubDate: string }> {
    const items: Array<{ title: string; link: string; description: string; pubDate: string }> = []
    const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/gi) || []

    for (const itemXml of itemMatches) {
        const title = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/i)?.[1]
            || itemXml.match(/<title>(.*?)<\/title>/i)?.[1] || ''
        const link = itemXml.match(/<link>(.*?)<\/link>/i)?.[1] || ''
        const description = itemXml.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/i)?.[1]
            || itemXml.match(/<description>(.*?)<\/description>/i)?.[1] || ''
        const pubDate = itemXml.match(/<pubDate>(.*?)<\/pubDate>/i)?.[1] || ''

        if (title) {
            items.push({ title: title.trim(), link: link.trim(), description: description.trim(), pubDate: pubDate.trim() })
        }
    }

    return items
}

// Extract exam name from title
function extractExamName(title: string, source: string): string {
    // Common exam patterns
    if (/civil services|cse/i.test(title)) return 'UPSC Civil Services'
    if (/nda/i.test(title)) return 'UPSC NDA'
    if (/cds/i.test(title)) return 'UPSC CDS'
    if (/cgl/i.test(title)) return 'SSC CGL'
    if (/chsl/i.test(title)) return 'SSC CHSL'
    if (/mts/i.test(title)) return 'SSC MTS'
    if (/\bpo\b/i.test(title)) return 'IBPS PO'
    if (/clerk/i.test(title)) return 'IBPS Clerk'
    if (/rrb\s*(ntpc|group|alp)?/i.test(title)) return 'RRB NTPC'

    return `${source} Examination`
}

// Extract deadline from description
function extractDeadline(description: string): string | undefined {
    // Look for date patterns
    const datePatterns = [
        /last date[:\s]*(\d{1,2}[\/-]\d{1,2}[\/-]\d{4})/i,
        /deadline[:\s]*(\d{1,2}[\/-]\d{1,2}[\/-]\d{4})/i,
        /apply by[:\s]*(\d{1,2}[\/-]\d{1,2}[\/-]\d{4})/i,
        /(\d{1,2}[\/-]\d{1,2}[\/-]\d{4})/,
    ]

    for (const pattern of datePatterns) {
        const match = description.match(pattern)
        if (match) {
            try {
                const parts = match[1].split(/[\/-]/)
                if (parts.length === 3) {
                    const date = new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`)
                    if (!isNaN(date.getTime())) {
                        return date.toISOString().split('T')[0]
                    }
                }
            } catch {
                continue
            }
        }
    }
    return undefined
}

// Convert to exam entity
function toExamEntity(
    item: { title: string; link: string; description: string; pubDate: string },
    source: ExamSource
): ExamEntity {
    const now = new Date().toISOString()
    const slug = titleToSlug(item.title)
    const sourceInfo = EXAM_SOURCES[source]

    return {
        id: createEntityId('exam', slug),
        slug,
        title: item.title,
        summary: item.description.replace(/<[^>]*>/g, '').slice(0, 300),
        category: 'exam',
        entityType: 'exam-notification',
        priority: 'high',
        publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : now,
        fetchedAt: now,
        expiresAt: getExpiryDate(TTL.EXAMS),
        conductingBody: sourceInfo.name,
        examName: extractExamName(item.title, sourceInfo.name),
        notificationDate: now.split('T')[0],
        applicationDeadline: extractDeadline(item.description),
        officialLink: item.link || sourceInfo.url,
        source: {
            name: sourceInfo.name,
            url: item.link || sourceInfo.url,
            fetchedAt: now,
        },
    }
}

/**
 * Fetch exams from a specific source
 */
async function fetchFromSource(source: ExamSource, opts: IndiaFetchOptions): Promise<ExamEntity[]> {
    const sourceInfo = EXAM_SOURCES[source]
    if (!sourceInfo.rss) return []

    try {
        const url = `${CORS_PROXY}${encodeURIComponent(sourceInfo.rss)}`
        const xml = await fetchTextWithCache(url, {
            cacheMinutes: TTL.EXAMS,
            bypassCache: opts.bypassCache,
        })

        const items = parseRSS(xml)
        // Filter for notification-related items
        const notifications = items.filter(item =>
            /notification|recruitment|exam|apply|vacancy|advertisement/i.test(item.title + item.description)
        )

        return notifications.slice(0, opts.limit || 5).map(item => toExamEntity(item, source))
    } catch (error) {
        console.error(`Failed to fetch ${source} exams:`, error)
        return []
    }
}

/**
 * Fetch all exam notifications
 * Returns empty array if no real data - NO FAKE DATA
 */
export async function fetchExamNotifications(opts: IndiaFetchOptions = {}): Promise<ExamEntity[]> {
    const sources: ExamSource[] = ['upsc', 'ssc']

    const results = await Promise.all(
        sources.map(source => fetchFromSource(source, opts))
    )

    const all = results.flat()

    // Return empty if no real data - NO FAKE DATA
    if (all.length === 0) {
        return []
    }

    // Sort by date and limit
    all.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    return all.slice(0, opts.limit || 10)
}

/**
 * Get exams data with metadata
 */
export async function getExamsData(opts: IndiaFetchOptions = {}) {
    const data = await fetchExamNotifications(opts)
    const now = new Date().toISOString()

    return {
        data,
        source: 'Multiple Sources',
        fetchedAt: now,
        expiresAt: getExpiryDate(TTL.EXAMS),
        isEmpty: data.length === 0,
    }
}


