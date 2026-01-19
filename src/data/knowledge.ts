// knowledge entity cache with refresh support

import type { KnowledgeEntity } from '../lib/atlas'

const knowledgeCache: Map<string, KnowledgeEntity> = new Map()

export function getCachedKnowledge(slug: string): KnowledgeEntity | null {
    return knowledgeCache.get(slug) || null
}

export function cacheKnowledge(entity: KnowledgeEntity): void {
    knowledgeCache.set(entity.slug, entity)
}

export function isKnowledgeCacheValid(slug: string): boolean {
    const cached = knowledgeCache.get(slug)
    if (!cached) return false
    const ageMs = Date.now() - cached.lastUpdated.getTime()
    const ttlMs = cached.ttl * 60 * 60 * 1000
    return ageMs < ttlMs
}

export function topicToSlug(topic: string): string {
    return topic
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
}

// get all cached slugs for refresh
export function getAllCachedSlugs(): string[] {
    return Array.from(knowledgeCache.keys())
}

// get expired entities for refresh
export function getExpiredSlugs(): string[] {
    const expired: string[] = []
    for (const [slug, entity] of knowledgeCache) {
        const ageMs = Date.now() - entity.lastUpdated.getTime()
        const ttlMs = entity.ttl * 60 * 60 * 1000
        if (ageMs >= ttlMs) {
            expired.push(slug)
        }
    }
    return expired
}

// cleanup stale entities (> 48h)
export function cleanupStaleEntities(): number {
    const maxAge = 48 * 60 * 60 * 1000
    let removed = 0

    for (const [slug, entity] of knowledgeCache) {
        const age = Date.now() - entity.lastUpdated.getTime()
        if (age > maxAge) {
            knowledgeCache.delete(slug)
            removed++
        }
    }

    return removed
}
