/**
 * Parliament Module
 * Fetches Lok Sabha & Rajya Sabha updates
 * Sources: https://sansad.in/, https://loksabha.nic.in/, https://rajyasabha.nic.in/
 */

import { fetchTextWithCache } from '../fetch'
import type { IndiaEntity, IndiaFetchOptions, RSSItem } from './types'
import { TTL, CORS_PROXY, titleToSlug, createEntityId, getExpiryDate } from './types'

const LOK_SABHA_RSS = 'https://loksabha.nic.in/rss/press_releases.xml'
const RAJYA_SABHA_RSS = 'https://rajyasabha.nic.in/rss/press_releases.xml'
const SANSAD_URL = 'https://sansad.in/'

// Parse RSS XML
function parseRSSXML(xml: string): RSSItem[] {
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

// Detect entity type from content
function detectEntityType(title: string, description: string): 'bill' | 'session' | 'question-hour' | 'press-release' {
    const text = `${title} ${description}`.toLowerCase()

    if (/bill|amendment|legislation|act/i.test(text)) return 'bill'
    if (/session|sitting|adjournment/i.test(text)) return 'session'
    if (/question hour|starred question|unstarred/i.test(text)) return 'question-hour'
    return 'press-release'
}

// Convert to entity
function toEntity(item: RSSItem, house: 'Lok Sabha' | 'Rajya Sabha'): IndiaEntity {
    const now = new Date().toISOString()
    const slug = titleToSlug(`${house}-${item.title}`)

    return {
        id: createEntityId('parliament', slug),
        slug,
        title: item.title,
        summary: item.description.slice(0, 300) + (item.description.length > 300 ? '...' : ''),
        category: 'parliament',
        entityType: detectEntityType(item.title, item.description),
        priority: /bill|budget|session/i.test(item.title) ? 'high' : 'medium',
        publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : now,
        fetchedAt: now,
        expiresAt: getExpiryDate(TTL.PARLIAMENT),
        ministry: house,
        body: item.description,
        source: {
            name: house,
            url: item.link || SANSAD_URL,
            fetchedAt: now,
        },
    }
}

/**
 * Fetch Lok Sabha updates
 */
async function fetchLokSabha(opts: IndiaFetchOptions): Promise<IndiaEntity[]> {
    try {
        const url = `${CORS_PROXY}${encodeURIComponent(LOK_SABHA_RSS)}`
        const xml = await fetchTextWithCache(url, {
            cacheMinutes: TTL.PARLIAMENT,
            bypassCache: opts.bypassCache,
        })

        const items = parseRSSXML(xml)
        return items.slice(0, opts.limit || 5).map(item => toEntity(item, 'Lok Sabha'))
    } catch (error) {
        console.error('Failed to fetch Lok Sabha updates:', error)
        return []
    }
}

/**
 * Fetch Rajya Sabha updates
 */
async function fetchRajyaSabha(opts: IndiaFetchOptions): Promise<IndiaEntity[]> {
    try {
        const url = `${CORS_PROXY}${encodeURIComponent(RAJYA_SABHA_RSS)}`
        const xml = await fetchTextWithCache(url, {
            cacheMinutes: TTL.PARLIAMENT,
            bypassCache: opts.bypassCache,
        })

        const items = parseRSSXML(xml)
        return items.slice(0, opts.limit || 5).map(item => toEntity(item, 'Rajya Sabha'))
    } catch (error) {
        console.error('Failed to fetch Rajya Sabha updates:', error)
        return []
    }
}

/**
 * Fetch all Parliament updates (both houses)
 */
export async function fetchParliamentUpdates(opts: IndiaFetchOptions = {}): Promise<IndiaEntity[]> {
    const [lokSabha, rajyaSabha] = await Promise.all([
        fetchLokSabha(opts),
        fetchRajyaSabha(opts),
    ])

    // Merge and sort by date
    const all = [...lokSabha, ...rajyaSabha]
    all.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())

    return all.slice(0, opts.limit || 10)
}

/**
 * Get Parliament data with metadata
 */
export async function getParliamentData(opts: IndiaFetchOptions = {}) {
    const data = await fetchParliamentUpdates(opts)
    const now = new Date().toISOString()

    return {
        data,
        source: SANSAD_URL,
        fetchedAt: now,
        expiresAt: getExpiryDate(TTL.PARLIAMENT),
        isEmpty: data.length === 0,
    }
}

