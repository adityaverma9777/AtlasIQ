/**
 * Article Synthesizer - Core engine for AtlasIQ
 * 
 * Gathers information from multiple sources (news, Wikipedia, trusted public data),
 * validates, deduplicates, and synthesizes into a single human-readable article.
 * 
 * Strict rules:
 * - NO hallucinated facts
 * - NO copying paragraphs verbatim
 * - NO AI-sounding language
 * - Editorial quality, neutral, trustworthy tone
 */

import { fetchWikipediaSummary, type WikipediaArticle } from './wikipedia'
import { fetchHeadlines, type Headline } from './news'
import { fetchIndiaNews, type IndiaNewsArticle } from './indiaNews'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface ImageData {
    url: string
    caption?: string
    width?: number
    height?: number
}

export interface ArticleSection {
    title: string
    content: string
    image?: ImageData
}

export interface SourceAttribution {
    name: string
    type: 'news' | 'encyclopedia' | 'official' | 'data'
    url?: string
}

export interface SynthesizedArticle {
    title: string                    // Editorial-quality title
    slug: string                     // URL-friendly slug
    summary: string                  // TL;DR (2-3 sentences)
    sections: ArticleSection[]       // Dynamic sections
    heroImage?: ImageData            // Primary visual
    inlineImages: ImageData[]        // Section visuals
    sources: SourceAttribution[]     // Compiled from...
    indiaContext?: string            // Indian perspective if applicable
    topic: string                    // Original search topic
    generatedAt: Date
    ttl: number                      // Cache TTL in hours
}

// Raw gathered data before synthesis
interface GatheredData {
    wikipedia: WikipediaArticle | null
    news: Headline[]
    indiaNews: IndiaNewsArticle[]
    topic: string
}

// ─────────────────────────────────────────────────────────────
// Article Writing Prompt
// ─────────────────────────────────────────────────────────────

const ARTICLE_WRITER_PROMPT = `You are an editorial writer for AtlasIQ, a premium knowledge platform.

Your task: Write a COMPREHENSIVE, in-depth article synthesizing the provided source data.

ARTICLE LENGTH REQUIREMENTS (CRITICAL):
- Write 5-8 detailed sections minimum
- Each section MUST have 4-6 substantial paragraphs
- Each paragraph should be 3-5 sentences
- Total article should be 1500-2500 words
- Cover all major aspects of the topic thoroughly

ABSOLUTE RULES:
1. NEVER invent facts - only use information from the provided sources
2. NEVER copy paragraphs verbatim - rephrase everything in your own editorial voice
3. NEVER use AI-sounding phrases like "It's important to note", "In conclusion", "Delving into"
4. Use calm, neutral, trustworthy language like a quality newspaper

WRITING STYLE:
- Write like The Economist or BBC - informed, measured, clear
- Short sentences, active voice
- Each paragraph should flow naturally to the next
- Include specific details, dates, numbers, and names from the sources
- Explain context and background thoroughly

REQUIRED SECTIONS (adapt titles to topic):
1. Overview/Introduction - comprehensive intro to the topic
2. Background/History - origins and development
3. Key Concepts/How It Works - main details and mechanisms
4. Current State/Recent Developments - latest situation
5. Impact/Significance - why this matters
6. Challenges/Controversies - issues and debates (if applicable)
7. Future Outlook - where this is heading (if applicable)

OUTPUT FORMAT (JSON):
{
  "title": "Editorial-quality headline (not clickbait)",
  "summary": "3-4 sentence comprehensive TL;DR that captures the full scope",
  "sections": [
    {"title": "Section Title", "content": "4-6 paragraphs of detailed, flowing prose. Each paragraph 3-5 sentences. Include specific facts, dates, and names."},
    ...
  ],
  "keyFacts": [{"label": "...", "value": "..."}],
  "indiaContext": "2-3 sentences on Indian relevance with specific details (or null if not applicable)"
}

Respond ONLY with valid JSON. No markdown wrapping.`

// ─────────────────────────────────────────────────────────────
// Source Gathering
// ─────────────────────────────────────────────────────────────

async function gatherSources(topic: string): Promise<GatheredData> {
    // Parallel fetch from all sources
    const [wikipedia, news, indiaNews] = await Promise.all([
        fetchWikipediaSummary(topic).catch(() => null),
        fetchHeadlines({ country: 'GLOBAL' }, { pageSize: 10 }).catch(() => []),
        fetchIndiaNews({ limit: 10 }).catch(() => []),
    ])

    // Filter news to topic-relevant items
    const topicLower = topic.toLowerCase()
    const topicWords = topicLower.split(/\s+/).filter(w => w.length > 3)

    const relevantNews = news.filter(article => {
        const text = `${article.title} ${article.summary}`.toLowerCase()
        return topicWords.some(word => text.includes(word))
    }).slice(0, 5)

    const relevantIndiaNews = indiaNews.filter(article => {
        const text = `${article.title} ${article.description}`.toLowerCase()
        return topicWords.some(word => text.includes(word))
    }).slice(0, 3)

    return {
        wikipedia,
        news: relevantNews,
        indiaNews: relevantIndiaNews,
        topic,
    }
}

// ─────────────────────────────────────────────────────────────
// India Context Detection
// ─────────────────────────────────────────────────────────────

const INDIA_KEYWORDS = [
    'india', 'indian', 'delhi', 'mumbai', 'bangalore', 'chennai', 'kolkata',
    'modi', 'bjp', 'congress', 'rupee', 'inr', 'bse', 'nse', 'sensex', 'nifty',
    'bollywood', 'cricket', 'ipl', 'isro', 'tata', 'reliance', 'infosys',
    'gandhi', 'nehru', 'ayodhya', 'kashmir', 'himalaya', 'ganges', 'taj mahal',
]

export function hasIndiaRelevance(topic: string, content?: string): boolean {
    const text = `${topic} ${content || ''}`.toLowerCase()
    return INDIA_KEYWORDS.some(keyword => text.includes(keyword))
}

// ─────────────────────────────────────────────────────────────
// Article Synthesis
// ─────────────────────────────────────────────────────────────

function buildSourceContext(data: GatheredData): string {
    const parts: string[] = []

    // Wikipedia content
    if (data.wikipedia) {
        parts.push(`[ENCYCLOPEDIA SOURCE: ${data.wikipedia.title}]`)
        parts.push(data.wikipedia.summary)
        for (const section of data.wikipedia.sections.slice(0, 8)) {
            parts.push(`## ${section.title}`)
            parts.push(section.content.slice(0, 2000))
        }
    }

    // News articles
    if (data.news.length > 0) {
        parts.push('\n[NEWS SOURCES]')
        for (const article of data.news) {
            parts.push(`- ${article.title} (${article.tag}): ${article.summary}`)
        }
    }

    // India news
    if (data.indiaNews.length > 0) {
        parts.push('\n[INDIA NEWS SOURCES]')
        for (const article of data.indiaNews) {
            parts.push(`- ${article.title}: ${article.description}`)
        }
    }

    return parts.join('\n')
}

function createSlug(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 80)
}

interface GroqResponse {
    choices: Array<{
        message: { content: string }
    }>
}

interface ArticleJSON {
    title: string
    summary: string
    sections: Array<{ title: string; content: string }>
    keyFacts?: Array<{ label: string; value: string }>
    indiaContext?: string | null
}

export async function synthesizeArticle(topic: string): Promise<SynthesizedArticle | null> {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY

    // Gather from all sources
    const data = await gatherSources(topic)

    // Need at least Wikipedia to synthesize
    if (!data.wikipedia && data.news.length === 0) {
        return null
    }

    // Build source context
    const sourceContext = buildSourceContext(data)

    // Collect source attributions
    const sources: SourceAttribution[] = []
    if (data.wikipedia) {
        sources.push({
            name: 'Wikipedia',
            type: 'encyclopedia',
            url: data.wikipedia.sourceUrl,
        })
    }
    for (const article of data.news.slice(0, 3)) {
        sources.push({
            name: article.tag,
            type: 'news',
            url: article.url,
        })
    }
    for (const article of data.indiaNews.slice(0, 2)) {
        const primarySource = article.sources[0]
        if (primarySource) {
            sources.push({
                name: primarySource.name,
                type: 'news',
                url: primarySource.url,
            })
        }
    }

    // Collect images
    const images: ImageData[] = []
    if (data.wikipedia?.images) {
        for (const img of data.wikipedia.images.slice(0, 4)) {
            images.push({
                url: img.url,
                caption: img.caption,
                width: img.width,
                height: img.height,
            })
        }
    }
    for (const article of data.news) {
        if (article.imageUrl) {
            images.push({ url: article.imageUrl, caption: article.title })
        }
    }

    // If no API key, create fallback article
    if (!apiKey) {
        return createFallbackArticle(data, sources, images)
    }

    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: ARTICLE_WRITER_PROMPT },
                    {
                        role: 'user',
                        content: `Write an article about: ${topic}\n\nSOURCE DATA:\n${sourceContext.slice(0, 8000)}`,
                    },
                ],
                temperature: 0.4,
                max_tokens: 6000,
            }),
        })

        if (!response.ok) {
            return createFallbackArticle(data, sources, images)
        }

        const result: GroqResponse = await response.json()
        const content = result.choices[0]?.message?.content

        if (!content) {
            return createFallbackArticle(data, sources, images)
        }

        // Parse JSON response
        let jsonStr = content.trim()
        if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.replace(/^```json?\n?/, '').replace(/\n?```$/, '')
        }

        const parsed: ArticleJSON = JSON.parse(jsonStr)

        // Build synthesized article
        const heroImage = images[0]
        const inlineImages = images.slice(1, 5)

        return {
            title: parsed.title || topic,
            slug: createSlug(parsed.title || topic),
            summary: parsed.summary || '',
            sections: parsed.sections.map(s => ({
                title: s.title,
                content: s.content,
            })),
            heroImage,
            inlineImages,
            sources,
            indiaContext: parsed.indiaContext || undefined,
            topic,
            generatedAt: new Date(),
            ttl: 6, // 6 hours
        }
    } catch (err) {
        console.warn('[ArticleSynthesizer] Synthesis failed:', err)
        return createFallbackArticle(data, sources, images)
    }
}

// Fallback when AI is unavailable
function createFallbackArticle(
    data: GatheredData,
    sources: SourceAttribution[],
    images: ImageData[]
): SynthesizedArticle {
    const wiki = data.wikipedia

    const sections: ArticleSection[] = []

    if (wiki) {
        sections.push({
            title: 'Overview',
            content: wiki.summary,
        })
        for (const section of wiki.sections.slice(0, 4)) {
            sections.push({
                title: section.title,
                content: section.content,
            })
        }
    }

    // Add news section if we have relevant news
    if (data.news.length > 0 || data.indiaNews.length > 0) {
        const newsContent = [...data.news, ...data.indiaNews]
            .slice(0, 5)
            .map(n => {
                const title = 'title' in n ? n.title : ''
                const desc = 'summary' in n ? n.summary : ('description' in n ? n.description : '')
                return `${title}: ${desc}`
            })
            .join('\n\n')

        if (newsContent) {
            sections.push({
                title: 'Recent Developments',
                content: newsContent,
            })
        }
    }

    return {
        title: wiki?.title || data.topic,
        slug: createSlug(wiki?.title || data.topic),
        summary: wiki?.summary || 'Article information being gathered.',
        sections,
        heroImage: images[0],
        inlineImages: images.slice(1, 5),
        sources,
        topic: data.topic,
        generatedAt: new Date(),
        ttl: 6,
    }
}

// ─────────────────────────────────────────────────────────────
// Cache
// ─────────────────────────────────────────────────────────────

const articleCache = new Map<string, { article: SynthesizedArticle; cachedAt: number }>()

export async function getOrSynthesizeArticle(
    topic: string,
    bypassCache = false
): Promise<SynthesizedArticle | null> {
    const cacheKey = topic.toLowerCase().trim()

    // Check cache
    if (!bypassCache) {
        const cached = articleCache.get(cacheKey)
        if (cached) {
            const ageHours = (Date.now() - cached.cachedAt) / (1000 * 60 * 60)
            if (ageHours < cached.article.ttl) {
                return cached.article
            }
        }
    }

    // Synthesize new article
    const article = await synthesizeArticle(topic)

    if (article) {
        articleCache.set(cacheKey, { article, cachedAt: Date.now() })
    }

    return article
}

// ─────────────────────────────────────────────────────────────
// Topic Resolution (AI-powered)
// ─────────────────────────────────────────────────────────────

const TOPIC_RESOLVER_PROMPT = `Given a user search query, return the best topic name to create an encyclopedia-style article.
Return ONLY the topic name, nothing else. No quotes, no explanation.
Examples:
- "what causes earthquakes" -> "Earthquakes"
- "elon musk" -> "Elon Musk"  
- "how does wifi work" -> "Wi-Fi"
- "india pakistan tension" -> "India-Pakistan relations"
- "climate change effects" -> "Climate change"`

export async function resolveArticleTopic(query: string): Promise<string> {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY
    if (!apiKey) return query

    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: TOPIC_RESOLVER_PROMPT },
                    { role: 'user', content: query },
                ],
                temperature: 0.1,
                max_tokens: 50,
            }),
        })

        if (!response.ok) return query

        const data: GroqResponse = await response.json()
        return data.choices[0]?.message?.content?.trim() || query
    } catch {
        return query
    }
}

