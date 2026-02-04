/**
 * India Governance Engine
 * Export all modules
 * 
 * TRUST POLICY: No fake data, no fallbacks, only real official sources
 */

// Types
export type {
    IndiaCategory,
    IndiaEntityType,
    EntityPriority,
    EntitySource,
    EntityFact,
    TimelineEvent,
    IndiaEntity,
    ExamEntity,
    ElectionEntity,
    IndiaFetchOptions,
    IndiaDataResponse,
    RSSItem,
} from './types'

export {
    TTL,
    CORS_PROXY,
    createEntityId,
    titleToSlug,
    isExpired,
    getExpiryDate,
} from './types'

// Government Activity Engine (primary)
export {
    fetchGovernmentActivity,
    fetchPublicSpending,
    getActivityData,
    ACTIVITY_TYPE_LABELS,
    type GovernmentActivity,
    type ActivityType,
} from './activity'

// Data modules (no fallback exports - removed)
export { fetchPIBReleases, getPIBData } from './pib'
export { fetchParliamentUpdates, getParliamentData } from './parliament'
export { fetchElectionUpdates, getElectionsData } from './elections'
export { fetchExamNotifications, getExamsData } from './exams'
export { fetchForeignAffairs, getForeignData } from './foreign'

// Normalization
export {
    fetchAllIndiaData,
    fetchIndiaByCategory,
    fetchIndiaCombinedFeed,
    getIndiaEntity,
    CATEGORY_LABELS,
    ENTITY_TYPE_LABELS,
} from './normalize'

