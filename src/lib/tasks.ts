// scheduled refresh tasks

import { registerTask, INTERVAL_24H } from './scheduler'
import { getExpiredSlugs, cleanupStaleEntities } from '../data/knowledge'
import { getKnowledgeBySlug, getFeaturedTopics } from './knowledge'

// refresh expired knowledge entities
async function refreshKnowledgeEntities(): Promise<void> {
    // refresh featured topics first (ensures today's topic is ready)
    const featured = getFeaturedTopics()
    for (const topic of featured) {
        try {
            await getKnowledgeBySlug(topic.toLowerCase().replace(/\s+/g, '-'), true)
        } catch { /* silent fail */ }
    }

    // refresh expired cached entities
    const expired = getExpiredSlugs()
    for (const slug of expired.slice(0, 5)) {
        try {
            await getKnowledgeBySlug(slug, true)
        } catch { /* silent fail */ }
    }
}

// cleanup stale cache
async function cleanupCache(): Promise<void> {
    cleanupStaleEntities()
}

// register all scheduled tasks
export function registerScheduledTasks(): void {
    registerTask('knowledge-refresh', INTERVAL_24H, refreshKnowledgeEntities)
    registerTask('cache-cleanup', INTERVAL_24H, cleanupCache)
}
