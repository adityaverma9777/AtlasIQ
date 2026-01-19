// encyclopedia search - Wikipedia first, no hallucination

import { getKnowledgeArticle, type KnowledgeEntity } from './knowledge'
import { resolveSearchTopic } from './atlas'

export interface SearchResult {
    article: KnowledgeEntity | null
    found: boolean
    searchedTopic: string
}

// search Wikipedia for encyclopedia content
export async function search(query: string): Promise<SearchResult> {
    const trimmed = query.trim()

    if (!trimmed || trimmed.length < 2) {
        return { article: null, found: false, searchedTopic: '' }
    }

    // use Groq to refine topic name (not generate content)
    const topic = await resolveSearchTopic(trimmed)

    // search Wikipedia via knowledge engine
    const article = await getKnowledgeArticle(topic)

    return {
        article,
        found: article !== null,
        searchedTopic: topic,
    }
}

// legacy exports for compatibility (empty)
export interface IndiaResult { title: string; summary: string; tag: string }
export interface LearnResult { title: string; summary: string; tag: string }
export interface SearchResults {
    markets: never[]
    weather: null
    headlines: never[]
    india: never[]
    learn: never[]
}
