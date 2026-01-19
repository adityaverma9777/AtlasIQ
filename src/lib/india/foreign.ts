/**
 * Foreign Affairs Module
 * Fetches MEA (Ministry of External Affairs) press releases
 * Source: https://mea.gov.in/
 */

import { fetchTextWithCache } from '../fetch'
import type { IndiaEntity, IndiaFetchOptions, RSSItem } from './types'
import { TTL, CORS_PROXY, titleToSlug, createEntityId, getExpiryDate } from './types'

const MEA_RSS = 'https://mea.gov.in/rss/press-releases-feed.xml'
const MEA_URL = 'https://mea.gov.in/'
const MEA_SOURCE_NAME = 'Ministry of External Affairs'

// Countries and regions to tag
const COUNTRY_PATTERNS: [RegExp, string][] = [
    [/united states|us|america|biden|washington/i, 'United States'],
    [/china|beijing|xi jinping/i, 'China'],
    [/russia|moscow|putin/i, 'Russia'],
    [/pakistan|islamabad/i, 'Pakistan'],
    [/bangladesh|dhaka/i, 'Bangladesh'],
    [/nepal|kathmandu/i, 'Nepal'],
    [/sri lanka|colombo/i, 'Sri Lanka'],
    [/japan|tokyo/i, 'Japan'],
    [/australia|canberra/i, 'Australia'],
    [/france|paris|macron/i, 'France'],
    [/germany|berlin/i, 'Germany'],
    [/uk|britain|london/i, 'United Kingdom'],
    [/uae|emirates|dubai|abu dhabi/i, 'UAE'],
    [/saudi|riyadh/i, 'Saudi Arabia'],
    [/israel|tel aviv/i, 'Israel'],
    [/iran|tehran/i, 'Iran'],
    [/quad|quadrilateral/i, 'QUAD'],
    [/brics/i, 'BRICS'],
    [/g20|g-20/i, 'G20'],
    [/sco|shanghai cooperation/i, 'SCO'],
    [/asean/i, 'ASEAN'],
    [/un|united nations/i, 'United Nations'],
]

// Parse RSS feed
function parseRSS(xml: string): RSSItem[] {
    const items: RSSItem[] = []
    const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/gi) || []

    for (const itemXml of itemMatches) {
        const title = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/i)?.[1]
            || itemXml.match(/<title>(.*?)<\/title>/i)?.[1] || ''
        const link = itemXml.match(/<link>(.*?)<\/link>/i)?.[1] || ''
        const description = itemXml.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/i)?.[1]
            || itemXml.match(/<description>(.*?)<\/description>/i)?.[1] || ''
        const pubDate = itemXml.match(/<pubDate>(.*?)<\/pubDate>/i)?.[1] || ''

        if (title) {
            items.push({
                title: title.trim(),
                link: link.trim(),
                description: description.replace(/<[^>]*>/g, '').trim(),
                pubDate: pubDate.trim(),
            })
        }
    }

    return items
}

// Extract related countries from text
function extractCountries(title: string, description: string): string[] {
    const text = `${title} ${description}`
    const countries: string[] = []

    for (const [pattern, country] of COUNTRY_PATTERNS) {
        if (pattern.test(text) && !countries.includes(country)) {
            countries.push(country)
        }
    }

    return countries
}

// Detect entity type
function detectEntityType(title: string): 'bilateral' | 'treaty' | 'statement' {
    const text = title.toLowerCase()
    if (/agreement|treaty|mou|pact/i.test(text)) return 'treaty'
    if (/visit|meeting|summit|talks/i.test(text)) return 'bilateral'
    return 'statement'
}

// Convert to entity
function toForeignEntity(item: RSSItem): IndiaEntity {
    const now = new Date().toISOString()
    const slug = titleToSlug(item.title)
    const countries = extractCountries(item.title, item.description)

    return {
        id: createEntityId('foreign', slug),
        slug,
        title: item.title,
        summary: item.description.slice(0, 300) + (item.description.length > 300 ? '...' : ''),
        category: 'foreign',
        entityType: detectEntityType(item.title),
        priority: countries.includes('United States') || countries.includes('China') || countries.includes('QUAD') ? 'high' : 'medium',
        publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : now,
        fetchedAt: now,
        expiresAt: getExpiryDate(TTL.FOREIGN),
        ministry: MEA_SOURCE_NAME,
        body: item.description,
        relatedCountries: countries,
        source: {
            name: MEA_SOURCE_NAME,
            url: item.link || MEA_URL,
            fetchedAt: now,
        },
    }
}

/**
 * Fetch MEA foreign affairs updates
 * Returns empty array if no real data - NO FAKE DATA
 */
export async function fetchForeignAffairs(opts: IndiaFetchOptions = {}): Promise<IndiaEntity[]> {
    const { bypassCache = false, limit = 10 } = opts

    try {
        const url = `${CORS_PROXY}${encodeURIComponent(MEA_RSS)}`
        const xml = await fetchTextWithCache(url, {
            cacheMinutes: TTL.FOREIGN,
            bypassCache,
        })

        const items = parseRSS(xml)
        return items.slice(0, limit).map(toForeignEntity)
    } catch (error) {
        console.error('Failed to fetch MEA updates:', error)
        // Return empty array - NO FAKE DATA
        return []
    }
}

/**
 * Get foreign affairs data with metadata
 */
export async function getForeignData(opts: IndiaFetchOptions = {}) {
    const data = await fetchForeignAffairs(opts)
    const now = new Date().toISOString()

    return {
        data,
        source: MEA_URL,
        fetchedAt: now,
        expiresAt: getExpiryDate(TTL.FOREIGN),
        isEmpty: data.length === 0,
    }
}

