/**
 * Government Activity Engine
 * Real-time feed of official government activities
 * Sources: PIB (primary), MEA, data.gov.in
 * 
 * STRICT RULES:
 * - Only show data from last 7 days
 * - No AI-generated facts
 * - No future assumptions
 * - Every item must be verifiable with source link
 */

import { fetchTextWithCache } from '../fetch'
import type { IndiaEntity, IndiaFetchOptions } from './types'
import { TTL, CORS_PROXY, titleToSlug, createEntityId, getExpiryDate } from './types'

const PIB_RSS_URL = 'https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3'
const PIB_SOURCE_NAME = 'Press Information Bureau'
const PIB_SOURCE_URL = 'https://pib.gov.in'

// Activity types for categorization
export type ActivityType =
    | 'cabinet-decision'
    | 'scheme-launch'
    | 'fund-allocation'
    | 'infrastructure'
    | 'policy-change'
    | 'appointment'
    | 'international'
    | 'general'

export interface GovernmentActivity extends IndiaEntity {
    activityType: ActivityType
    amount?: string           // ₹ amount if monetary
    ministry?: string
    isSpending?: boolean      // True if involves public spending
}

// Parse RSS XML
function parseRSSXML(xml: string): Array<{ title: string; link: string; description: string; pubDate: string }> {
    const items: Array<{ title: string; link: string; description: string; pubDate: string }> = []
    const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/gi) || []

    for (const itemXml of itemMatches) {
        const title = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/i)?.[1]
            || itemXml.match(/<title>(.*?)<\/title>/i)?.[1] || ''
        const link = itemXml.match(/<link>(.*?)<\/link>/i)?.[1] || ''
        const description = itemXml.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/i)?.[1]
            || itemXml.match(/<description>(.*?)<\/description>/i)?.[1] || ''
        const pubDate = itemXml.match(/<pubDate>(.*?)<\/pubDate>/i)?.[1] || ''

        if (title && link) {
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

// Detect activity type from content
function detectActivityType(title: string, description: string): ActivityType {
    const text = `${title} ${description}`.toLowerCase()

    if (/cabinet|union cabinet|council of ministers/i.test(text)) return 'cabinet-decision'
    if (/scheme|yojana|program|mission|initiative/i.test(text)) return 'scheme-launch'
    if (/crore|lakh|₹|rs\.|rupees|allocation|fund|budget|sanction/i.test(text)) return 'fund-allocation'
    if (/highway|road|rail|airport|port|bridge|infrastructure/i.test(text)) return 'infrastructure'
    if (/policy|regulation|amendment|notification|guideline/i.test(text)) return 'policy-change'
    if (/appoint|nominate|secretary|director/i.test(text)) return 'appointment'
    if (/bilateral|summit|visit|foreign|ambassador|treaty/i.test(text)) return 'international'
    return 'general'
}

// Extract monetary amount from text
function extractAmount(text: string): string | undefined {
    // Match patterns like "Rs. 3,200 crore", "₹5000 Cr", "10 lakh crore"
    const patterns = [
        /₹\s*([\d,]+(?:\.\d+)?)\s*(crore|cr|lakh|lac)/i,
        /rs\.?\s*([\d,]+(?:\.\d+)?)\s*(crore|cr|lakh|lac)/i,
        /([\d,]+(?:\.\d+)?)\s*(crore|cr|lakh|lac)\s*(rupees)?/i,
    ]

    for (const pattern of patterns) {
        const match = text.match(pattern)
        if (match) {
            const num = match[1].replace(/,/g, '')
            const unit = match[2].toLowerCase()
            const unitLabel = unit.startsWith('cr') ? 'Cr' : 'Lakh'
            return `₹${num} ${unitLabel}`
        }
    }
    return undefined
}

// Extract ministry from text
function extractMinistry(title: string, description: string): string {
    const text = `${title} ${description}`

    const ministryPatterns: [RegExp, string][] = [
        [/ministry of finance|finance minister|fm/i, 'Finance'],
        [/ministry of external affairs|mea|eam/i, 'External Affairs'],
        [/ministry of defence|defence minister|raksha/i, 'Defence'],
        [/ministry of home affairs|home minister|mha/i, 'Home Affairs'],
        [/pmo|prime minister/i, 'PMO'],
        [/ministry of health|health minister/i, 'Health'],
        [/ministry of education|education minister/i, 'Education'],
        [/ministry of commerce|commerce minister/i, 'Commerce'],
        [/ministry of railways|railway minister/i, 'Railways'],
        [/ministry of road|morth|nitin gadkari/i, 'Road Transport'],
        [/ministry of it|meity/i, 'Electronics & IT'],
        [/ministry of agriculture/i, 'Agriculture'],
        [/ministry of power|energy/i, 'Power'],
        [/ministry of housing|urban/i, 'Urban Development'],
    ]

    for (const [pattern, ministry] of ministryPatterns) {
        if (pattern.test(text)) return ministry
    }

    return 'Government of India'
}

// Check if item is within last 7 days
function isWithinLastWeek(dateStr: string): boolean {
    try {
        const date = new Date(dateStr)
        const now = new Date()
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        return date >= weekAgo && date <= now
    } catch {
        return false
    }
}

// Convert to activity entity
function toActivity(item: { title: string; link: string; description: string; pubDate: string }): GovernmentActivity {
    const now = new Date().toISOString()
    const slug = titleToSlug(item.title)
    const fullText = `${item.title} ${item.description}`
    const amount = extractAmount(fullText)
    const activityType = detectActivityType(item.title, item.description)

    return {
        id: createEntityId('activity', slug),
        slug,
        title: item.title,
        summary: item.description.slice(0, 300) + (item.description.length > 300 ? '...' : ''),
        category: 'govt',
        entityType: 'press-release',
        priority: amount || activityType === 'cabinet-decision' ? 'high' : 'medium',
        publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : now,
        fetchedAt: now,
        expiresAt: getExpiryDate(TTL.PIB),
        activityType,
        amount,
        ministry: extractMinistry(item.title, item.description),
        isSpending: !!amount,
        body: item.description,
        source: {
            name: PIB_SOURCE_NAME,
            url: item.link,
            fetchedAt: now,
        },
    }
}

/**
 * Fetch real-time government activities
 * Only returns items from the last 7 days
 */
export async function fetchGovernmentActivity(opts: IndiaFetchOptions = {}): Promise<GovernmentActivity[]> {
    const { bypassCache = false, limit = 10 } = opts

    try {
        const url = `${CORS_PROXY}${encodeURIComponent(PIB_RSS_URL)}`
        const xml = await fetchTextWithCache(url, {
            cacheMinutes: TTL.PIB,
            bypassCache,
        })

        const items = parseRSSXML(xml)

        // Filter to last 7 days only - NO FALLBACK DATA
        const recentItems = items.filter(item => isWithinLastWeek(item.pubDate))

        // Convert to activity entities
        const activities = recentItems.slice(0, limit).map(toActivity)

        return activities
    } catch (error) {
        console.error('Failed to fetch government activity:', error)
        // Return empty array - NO FAKE DATA
        return []
    }
}

/**
 * Fetch spending-related activities only
 */
export async function fetchPublicSpending(opts: IndiaFetchOptions = {}): Promise<GovernmentActivity[]> {
    const activities = await fetchGovernmentActivity({ ...opts, limit: 50 })
    return activities.filter(a => a.isSpending).slice(0, opts.limit || 5)
}

/**
 * Get activity data with metadata
 */
export async function getActivityData(opts: IndiaFetchOptions = {}) {
    const data = await fetchGovernmentActivity(opts)
    const now = new Date().toISOString()

    return {
        data,
        source: PIB_SOURCE_URL,
        fetchedAt: now,
        expiresAt: getExpiryDate(TTL.PIB),
        isEmpty: data.length === 0,
    }
}

// Activity type labels for display
export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
    'cabinet-decision': 'Cabinet',
    'scheme-launch': 'Scheme',
    'fund-allocation': 'Spending',
    'infrastructure': 'Infrastructure',
    'policy-change': 'Policy',
    'appointment': 'Appointment',
    'international': 'Diplomatic',
    'general': 'Update',
}
