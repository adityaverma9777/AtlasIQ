/**
 * Normalize Module
 * Combines all India data sources into unified feed
 */

import type { IndiaEntity, ExamEntity, ElectionEntity, IndiaFetchOptions, IndiaDataResponse, IndiaCategory } from './types'
import { getExpiryDate, TTL } from './types'
import { fetchPIBReleases } from './pib'
import { fetchParliamentUpdates } from './parliament'
import { fetchElectionUpdates } from './elections'
import { fetchExamNotifications } from './exams'
import { fetchForeignAffairs } from './foreign'

/**
 * Fetch all India data from all sources
 */
export async function fetchAllIndiaData(opts: IndiaFetchOptions = {}): Promise<{
    govt: IndiaEntity[]
    parliament: IndiaEntity[]
    elections: ElectionEntity[]
    exams: ExamEntity[]
    foreign: IndiaEntity[]
    fetchedAt: string
}> {
    const [govt, parliament, elections, exams, foreign] = await Promise.all([
        fetchPIBReleases({ ...opts, limit: 6 }),
        fetchParliamentUpdates({ ...opts, limit: 4 }),
        fetchElectionUpdates({ ...opts, limit: 4 }),
        fetchExamNotifications({ ...opts, limit: 6 }),
        fetchForeignAffairs({ ...opts, limit: 4 }),
    ])

    return {
        govt,
        parliament,
        elections,
        exams,
        foreign,
        fetchedAt: new Date().toISOString(),
    }
}

/**
 * Fetch data for a specific category
 */
export async function fetchIndiaByCategory(
    category: IndiaCategory,
    opts: IndiaFetchOptions = {}
): Promise<IndiaDataResponse<IndiaEntity>> {
    const now = new Date().toISOString()
    let data: IndiaEntity[] = []
    let source = ''
    let ttl: number = TTL.PIB

    switch (category) {
        case 'govt':
            data = await fetchPIBReleases(opts)
            source = 'https://pib.gov.in/'
            ttl = TTL.PIB
            break
        case 'parliament':
            data = await fetchParliamentUpdates(opts)
            source = 'https://sansad.in/'
            ttl = TTL.PARLIAMENT
            break
        case 'election':
            data = await fetchElectionUpdates(opts)
            source = 'https://eci.gov.in/'
            ttl = TTL.ELECTIONS
            break
        case 'exam':
            data = await fetchExamNotifications(opts)
            source = 'Multiple Sources'
            ttl = TTL.EXAMS
            break
        case 'foreign':
            data = await fetchForeignAffairs(opts)
            source = 'https://mea.gov.in/'
            ttl = TTL.FOREIGN
            break
    }

    return {
        data,
        source,
        fetchedAt: now,
        expiresAt: getExpiryDate(ttl),
        fromCache: false,
    }
}

/**
 * Get combined feed sorted by date
 */
export async function fetchIndiaCombinedFeed(opts: IndiaFetchOptions = {}): Promise<IndiaEntity[]> {
    const all = await fetchAllIndiaData(opts)

    const combined: IndiaEntity[] = [
        ...all.govt,
        ...all.parliament,
        ...all.elections,
        ...all.exams,
        ...all.foreign,
    ]

    // Sort by priority then date
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    combined.sort((a, b) => {
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
        if (priorityDiff !== 0) return priorityDiff
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    })

    return combined.slice(0, opts.limit || 20)
}

/**
 * Get entity by slug from any category
 */
export async function getIndiaEntity(slug: string): Promise<IndiaEntity | null> {
    const all = await fetchAllIndiaData({ limit: 50 })
    const combined = [
        ...all.govt,
        ...all.parliament,
        ...all.elections,
        ...all.exams,
        ...all.foreign,
    ]

    return combined.find(e => e.slug === slug) || null
}

// Category labels for display
export const CATEGORY_LABELS: Record<IndiaCategory, string> = {
    govt: 'Government',
    parliament: 'Parliament',
    election: 'Elections',
    exam: 'Exams',
    foreign: 'Foreign Affairs',
}

// Entity type labels
export const ENTITY_TYPE_LABELS: Record<string, string> = {
    'press-release': 'Press Release',
    'bill': 'Bill',
    'session': 'Session',
    'question-hour': 'Question Hour',
    'election-schedule': 'Schedule',
    'election-result': 'Result',
    'exam-notification': 'Notification',
    'exam-result': 'Result',
    'bilateral': 'Bilateral',
    'treaty': 'Treaty',
    'statement': 'Statement',
}
