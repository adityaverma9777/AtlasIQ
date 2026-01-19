// knowledge engine - auto-generates encyclopedia articles

import { fetchWikipediaSummary } from './wikipedia'
import { resolveSearchTopic, generateKnowledgeEntity, type KnowledgeEntity, type KnowledgeType } from './atlas'
import { getCachedKnowledge, cacheKnowledge, isKnowledgeCacheValid, topicToSlug } from '../data/knowledge'

// topics for daily rotation
const dailyTopics = [
    'Photosynthesis',
    'Black hole',
    'Great Wall of China',
    'French Revolution',
    'DNA',
    'Mount Everest',
    'Theory of relativity',
    'Amazon River',
    'Renaissance',
    'Quantum mechanics',
    'Mariana Trench',
    'Industrial Revolution',
    'Solar System',
    'Ancient Egypt',
    'Climate change',
    'World War II',
    'Evolution',
    'Artificial intelligence',
    'Human brain',
    'Plate tectonics',
    'Moon landing',
    'Antibiotics',
    'Pyramids of Giza',
    'Democracy',
    'Isaac Newton',
    'Rainforest',
]

export function getTodayTopic(): string {
    const now = new Date()
    const start = new Date(now.getFullYear(), 0, 0)
    const diff = now.getTime() - start.getTime()
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24))
    return dailyTopics[dayOfYear % dailyTopics.length]
}

export function getFeaturedTopics(): string[] {
    const today = getTodayTopic()
    const idx = dailyTopics.indexOf(today)
    return [
        today,
        dailyTopics[(idx + 7) % dailyTopics.length],
        dailyTopics[(idx + 14) % dailyTopics.length],
    ]
}

// main entry with AI-guided search
export async function getKnowledgeArticle(
    query: string,
    bypassCache = false
): Promise<KnowledgeEntity | null> {
    // AI resolves to exact topic
    const topic = await resolveSearchTopic(query)
    const slug = topicToSlug(topic)

    // check cache
    if (!bypassCache && isKnowledgeCacheValid(slug)) {
        return getCachedKnowledge(slug)
    }

    // fetch from Wikipedia
    const wikiArticle = await fetchWikipediaSummary(topic)
    if (!wikiArticle) return null

    // generate via Atlas
    const entity = await generateKnowledgeEntity(wikiArticle)

    // validate minimum quality
    if (!entity.overview || entity.sections.length === 0) {
        return null
    }

    cacheKnowledge(entity)
    return entity
}

// get by slug
export async function getKnowledgeBySlug(
    slug: string,
    bypassCache = false
): Promise<KnowledgeEntity | null> {
    if (!bypassCache && isKnowledgeCacheValid(slug)) {
        return getCachedKnowledge(slug)
    }

    const topic = slug.replace(/-/g, ' ')
    return getKnowledgeArticle(topic, bypassCache)
}

export async function canGenerateArticle(topic: string): Promise<boolean> {
    if (!topic || topic.length < 2) return false
    const wiki = await fetchWikipediaSummary(topic)
    return wiki !== null
}

export { topicToSlug, type KnowledgeEntity, type KnowledgeType }
