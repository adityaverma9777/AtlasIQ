/**
 * India Governance Engine - Type Definitions
 * Common types for all India data modules
 */

// Entity categories
export type IndiaCategory =
    | 'govt'          // Government updates, policies
    | 'parliament'    // Lok Sabha, Rajya Sabha
    | 'election'      // ECI data
    | 'exam'          // UPSC, SSC, IBPS, RRB
    | 'foreign'       // MEA, bilateral relations

// Entity types within categories
export type IndiaEntityType =
    | 'press-release'
    | 'bill'
    | 'session'
    | 'question-hour'
    | 'election-schedule'
    | 'election-result'
    | 'exam-notification'
    | 'exam-result'
    | 'bilateral'
    | 'treaty'
    | 'statement'

// Severity/priority levels
export type EntityPriority = 'high' | 'medium' | 'low'

// Mandatory source with URL
export interface EntitySource {
    name: string
    url: string
    fetchedAt: string  // ISO timestamp
}

// Key-value facts
export interface EntityFact {
    label: string
    value: string
}

// Timeline event
export interface TimelineEvent {
    date: string
    event: string
}

// Core India Entity schema
export interface IndiaEntity {
    id: string
    slug: string
    title: string
    summary: string
    category: IndiaCategory
    entityType: IndiaEntityType
    priority: EntityPriority

    // Metadata
    publishedAt: string      // Original publish date
    fetchedAt: string        // When we fetched it
    expiresAt: string        // Cache expiry (TTL)

    // Content
    ministry?: string        // For govt updates
    body?: string            // Full text if available
    facts?: EntityFact[]
    timeline?: TimelineEvent[]

    // Relations
    relatedCountries?: string[]  // For foreign affairs
    relatedEntities?: string[]   // Slugs of related entities

    // Source (MANDATORY)
    source: EntitySource
}

// Exam-specific entity with additional fields
export interface ExamEntity extends IndiaEntity {
    category: 'exam'
    conductingBody: string
    examName: string
    notificationDate: string
    applicationDeadline?: string
    examDate?: string
    eligibility?: string
    officialLink: string
}

// Election-specific entity
export interface ElectionEntity extends IndiaEntity {
    category: 'election'
    electionType: 'general' | 'state' | 'by-election' | 'local'
    state?: string
    phases?: { phase: number; date: string; states: string[] }[]
    resultDate?: string
}

// Fetch options for India modules
export interface IndiaFetchOptions {
    bypassCache?: boolean
    limit?: number
}

// Response wrapper with metadata
export interface IndiaDataResponse<T> {
    data: T[]
    source: string
    fetchedAt: string
    expiresAt: string
    fromCache: boolean
}

// RSS item from government feeds
export interface RSSItem {
    title: string
    link: string
    description: string
    pubDate: string
    category?: string
}

// TTL constants (in minutes)
export const TTL = {
    PIB: 360,           // 6 hours
    PARLIAMENT: 720,    // 12 hours
    ELECTIONS: 60,      // 1 hour during active, 24 hours otherwise
    EXAMS: 1440,        // 24 hours
    FOREIGN: 1440,      // 24 hours
} as const

// CORS proxy for government sites
export const CORS_PROXY = 'https://api.allorigins.win/raw?url='

// Helper to create entity ID
export function createEntityId(category: string, slug: string): string {
    return `india-${category}-${slug}`
}

// Helper to create slug from title
export function titleToSlug(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 80)
}

// Helper to check if entity is expired
export function isExpired(expiresAt: string): boolean {
    return new Date(expiresAt) < new Date()
}

// Helper to calculate expiry date
export function getExpiryDate(ttlMinutes: number): string {
    const expiry = new Date()
    expiry.setMinutes(expiry.getMinutes() + ttlMinutes)
    return expiry.toISOString()
}
