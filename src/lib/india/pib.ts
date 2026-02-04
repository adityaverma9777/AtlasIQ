/**
 * PIB (Press Information Bureau) Module
 * Fetches official government press releases from PIB RSS feed
 * Source: https://pib.gov.in/
 */

import { fetchTextWithCache } from '../fetch'
import type { IndiaEntity, IndiaFetchOptions, RSSItem } from './types'
import { TTL, CORS_PROXY, titleToSlug, createEntityId, getExpiryDate } from './types'

const PIB_RSS_URL = 'https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3'
const PIB_SOURCE_NAME = 'Press Information Bureau'
const PIB_SOURCE_URL = 'https://pib.gov.in'

// Parse XML RSS feed
function parseRSSXML(xml: string): RSSItem[] {
    const items: RSSItem[] = []

    // Simple regex-based XML parsing (works in browser without DOMParser issues)
    const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/gi) || []

    for (const itemXml of itemMatches) {
        const title = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/i)?.[1]
            || itemXml.match(/<title>(.*?)<\/title>/i)?.[1] || ''
        const link = itemXml.match(/<link>(.*?)<\/link>/i)?.[1] || ''
        const description = itemXml.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/i)?.[1]
            || itemXml.match(/<description>(.*?)<\/description>/i)?.[1] || ''
        const pubDate = itemXml.match(/<pubDate>(.*?)<\/pubDate>/i)?.[1] || ''
        const category = itemXml.match(/<category>(.*?)<\/category>/i)?.[1] || ''

        if (title && link) {
            items.push({
                title: title.trim(),
                link: link.trim(),
                description: description.replace(/<[^>]*>/g, '').trim(),
                pubDate: pubDate.trim(),
                category: category.trim(),
            })
        }
    }

    return items
}

// Extract ministry from PIB release
function extractMinistry(title: string, description: string): string {
    const text = `${title} ${description}`.toLowerCase()

    const ministryPatterns: [RegExp, string][] = [
        [/ministry of finance|finance minister/i, 'Ministry of Finance'],
        [/ministry of external affairs|mea|foreign minister/i, 'Ministry of External Affairs'],
        [/ministry of defence|defence minister/i, 'Ministry of Defence'],
        [/ministry of home affairs|home minister/i, 'Ministry of Home Affairs'],
        [/pmo|prime minister/i, 'Prime Minister\'s Office'],
        [/ministry of health/i, 'Ministry of Health'],
        [/ministry of education/i, 'Ministry of Education'],
        [/ministry of commerce/i, 'Ministry of Commerce'],
        [/ministry of railways/i, 'Ministry of Railways'],
        [/ministry of it|meity/i, 'Ministry of Electronics & IT'],
    ]

    for (const [pattern, ministry] of ministryPatterns) {
        if (pattern.test(text)) return ministry
    }

    return 'Government of India'
}

// Determine priority based on keywords
function getPriority(title: string): 'high' | 'medium' | 'low' {
    const text = title.toLowerCase()

    if (/prime minister|cabinet|emergency|parliament|budget|election/i.test(text)) {
        return 'high'
    }
    if (/minister|policy|scheme|announcement|launch/i.test(text)) {
        return 'medium'
    }
    return 'low'
}

// Convert RSS item to IndiaEntity
function rssToEntity(item: RSSItem): IndiaEntity {
    const now = new Date().toISOString()
    const slug = titleToSlug(item.title)

    return {
        id: createEntityId('govt', slug),
        slug,
        title: item.title,
        summary: item.description.slice(0, 300) + (item.description.length > 300 ? '...' : ''),
        category: 'govt',
        entityType: 'press-release',
        priority: getPriority(item.title),
        publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : now,
        fetchedAt: now,
        expiresAt: getExpiryDate(TTL.PIB),
        ministry: extractMinistry(item.title, item.description),
        body: item.description,
        source: {
            name: PIB_SOURCE_NAME,
            url: item.link || PIB_SOURCE_URL,
            fetchedAt: now,
        },
    }
}

/**
 * Fetch latest PIB press releases
 */
export async function fetchPIBReleases(opts: IndiaFetchOptions = {}): Promise<IndiaEntity[]> {
    const { bypassCache = false, limit = 10 } = opts

    try {
        const url = `${CORS_PROXY}${encodeURIComponent(PIB_RSS_URL)}`
        const xml = await fetchTextWithCache(url, {
            cacheMinutes: TTL.PIB,
            bypassCache,
        })

        const items = parseRSSXML(xml)
        const entities = items.slice(0, limit).map(rssToEntity)

        return entities
    } catch (error) {
        console.error('Failed to fetch PIB releases:', error)
        return []
    }
}

/**
 * Get PIB data with metadata
 */
export async function getPIBData(opts: IndiaFetchOptions = {}) {
    const data = await fetchPIBReleases(opts)
    const now = new Date().toISOString()

    return {
        data,
        source: PIB_SOURCE_URL,
        fetchedAt: now,
        expiresAt: getExpiryDate(TTL.PIB),
        fromCache: false, // fetchWithCache handles this internally
    }
}

