/**
 * Elections Module
 * Fetches Election Commission of India data
 * Source: https://eci.gov.in/, https://results.eci.gov.in/
 */

import { fetchTextWithCache } from '../fetch'
import type { ElectionEntity, IndiaFetchOptions } from './types'
import { TTL, CORS_PROXY, titleToSlug, createEntityId, getExpiryDate } from './types'

const ECI_URL = 'https://eci.gov.in/'
const ECI_RSS = 'https://eci.gov.in/rss/rss.xml'
const ECI_SOURCE_NAME = 'Election Commission of India'

// Parse ECI RSS feed
function parseECIRSS(xml: string): Array<{ title: string; link: string; description: string; pubDate: string }> {
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

// Detect election type from title
function detectElectionType(title: string): ElectionEntity['electionType'] {
    const text = title.toLowerCase()
    if (/lok sabha|general election/i.test(text)) return 'general'
    if (/by-election|bye-election/i.test(text)) return 'by-election'
    if (/municipal|panchayat|local/i.test(text)) return 'local'
    return 'state'
}

// Extract state from title
function extractState(title: string): string | undefined {
    const states = [
        'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
        'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
        'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
        'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
        'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
        'Delhi', 'Jammu and Kashmir', 'Ladakh'
    ]

    for (const state of states) {
        if (title.toLowerCase().includes(state.toLowerCase())) {
            return state
        }
    }
    return undefined
}

// Convert to election entity
function toElectionEntity(item: { title: string; link: string; description: string; pubDate: string }): ElectionEntity {
    const now = new Date().toISOString()
    const slug = titleToSlug(item.title)

    return {
        id: createEntityId('election', slug),
        slug,
        title: item.title,
        summary: item.description.replace(/<[^>]*>/g, '').slice(0, 300),
        category: 'election',
        entityType: 'election-schedule',
        electionType: detectElectionType(item.title),
        state: extractState(item.title),
        priority: 'high',
        publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : now,
        fetchedAt: now,
        expiresAt: getExpiryDate(TTL.ELECTIONS),
        body: item.description,
        source: {
            name: ECI_SOURCE_NAME,
            url: item.link || ECI_URL,
            fetchedAt: now,
        },
    }
}

/**
 * Fetch ECI updates
 * Returns empty array if no real data - NO FAKE DATA
 */
export async function fetchElectionUpdates(opts: IndiaFetchOptions = {}): Promise<ElectionEntity[]> {
    const { bypassCache = false, limit = 10 } = opts

    try {
        const url = `${CORS_PROXY}${encodeURIComponent(ECI_RSS)}`
        const xml = await fetchTextWithCache(url, {
            cacheMinutes: TTL.ELECTIONS,
            bypassCache,
        })

        const items = parseECIRSS(xml)
        return items.slice(0, limit).map(toElectionEntity)
    } catch (error) {
        console.error('Failed to fetch ECI updates:', error)
        // Return empty array - NO FAKE DATA
        return []
    }
}

/**
 * Get elections data with metadata
 */
export async function getElectionsData(opts: IndiaFetchOptions = {}) {
    const data = await fetchElectionUpdates(opts)
    const now = new Date().toISOString()

    return {
        data,
        source: ECI_URL,
        fetchedAt: now,
        expiresAt: getExpiryDate(TTL.ELECTIONS),
        isEmpty: data.length === 0,
    }
}

