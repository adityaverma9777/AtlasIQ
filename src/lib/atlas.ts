// Atlas - Groq formatting pipeline with strict article structuring

import type { WikipediaArticle, WikipediaImage } from './wikipedia'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

// resolve user search to exact Wikipedia topic
const TOPIC_RESOLVER_PROMPT = `You help find the exact Wikipedia article title for a search query.
Given a user's search, return ONLY the exact Wikipedia article title that best matches.
Return just the title, nothing else. No quotes, no explanation.
Examples:
- "who discovered gravity" -> "Isaac Newton"
- "tallest mountain" -> "Mount Everest"
- "ww2" -> "World War II"
- "photosynthesis process" -> "Photosynthesis"`

// strict article structuring prompt
const ATLAS_SYSTEM_PROMPT = `You are Atlas, the intelligence structurer for AtlasIQ encyclopedia.

Your ONLY task is to structure raw Wikipedia content into a clean article format.

STRICT RULES:
1. NEVER add facts not in the source
2. NEVER add opinions or commentary
3. NEVER repeat the same content twice
4. Keep neutral encyclopedia tone
5. Preserve all dates, numbers, names exactly

HEADING RULES (CRITICAL):
- Use EXACTLY these section titles, no variations:
  * "Overview" - brief intro (1 paragraph only)
  * "Background" - history/origins (combine all historical content here)
  * Topic-specific subsections (2-4 max, unique titles)
  * "Significance" - why it matters
- NEVER use: "History" separately (merge into Background)
- NEVER duplicate any heading
- Each section must have UNIQUE content

CONTENT RULES:
- Remove Wikipedia meta text (editing, governance, contributors)
- Remove "See also", "References", "External links" content
- Split long paragraphs (max 3-4 sentences each)
- Keep total output concise

Output JSON:
{
  "overview": "1-2 sentence summary",
  "sections": [
    {"title": "Background", "content": "..."},
    {"title": "...", "content": "..."}
  ],
  "keyFacts": [{"label": "...", "value": "..."}],
  "timeline": [{"date": "...", "event": "..."}],
  "significance": "1-2 sentences on importance"
}

Respond ONLY with valid JSON. No markdown wrapping.`

interface GroqResponse {
    choices: Array<{
        message: { content: string }
    }>
}

export interface ArticleSection {
    title: string
    content: string
}

export interface FormattedArticle {
    overview: string
    sections: ArticleSection[]
    keyFacts: { label: string; value: string }[]
    timeline?: { date: string; event: string }[]
    significance: string
}

// resolve search query to Wikipedia topic
export async function resolveSearchTopic(query: string): Promise<string> {
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
                max_tokens: 100,
            }),
        })

        if (!response.ok) return query

        const data: GroqResponse = await response.json()
        const topic = data.choices[0]?.message?.content?.trim()
        return topic || query
    } catch {
        return query
    }
}

// deduplicate sections by normalizing titles
function deduplicateSections(sections: ArticleSection[]): ArticleSection[] {
    const seen = new Set<string>()
    const result: ArticleSection[] = []

    // title normalization map
    const normalize: Record<string, string> = {
        history: 'Background',
        origins: 'Background',
        development: 'Background',
        evolution: 'Background',
        importance: 'Significance',
        impact: 'Significance',
        relevance: 'Significance',
        introduction: 'Overview',
        summary: 'Overview',
    }

    for (const section of sections) {
        const lower = section.title.toLowerCase().trim()
        const normalized = normalize[lower] || section.title

        if (seen.has(normalized.toLowerCase())) {
            // merge content into existing section
            const existing = result.find(
                (s) => s.title.toLowerCase() === normalized.toLowerCase()
            )
            if (existing && section.content) {
                existing.content += '\n\n' + section.content
            }
        } else {
            seen.add(normalized.toLowerCase())
            result.push({ title: normalized, content: section.content })
        }
    }

    return result
}

// validate article quality
function validateArticle(article: FormattedArticle): boolean {
    if (!article.overview || article.overview.length < 20) return false
    if (!article.sections || article.sections.length < 1) return false
    const totalContent = article.sections.reduce((acc, s) => acc + s.content.length, 0)
    if (totalContent < 200) return false
    return true
}

// format article using Groq
export async function formatWithAtlas(
    wikiArticle: WikipediaArticle
): Promise<FormattedArticle | null> {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY

    // build content string from sections
    const rawContent = wikiArticle.sections
        .map((s) => `## ${s.title}\n${s.content}`)
        .join('\n\n')

    if (!apiKey) {
        // fallback without AI
        return createFallbackArticle(wikiArticle)
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
                    { role: 'system', content: ATLAS_SYSTEM_PROMPT },
                    {
                        role: 'user',
                        content: `Topic: ${wikiArticle.title}\n\nRaw content:\n${rawContent.slice(0, 6000)}`,
                    },
                ],
                temperature: 0.2,
                max_tokens: 2500,
            }),
        })

        if (!response.ok) throw new Error('Groq API error')

        const data: GroqResponse = await response.json()
        const content = data.choices[0]?.message?.content

        if (!content) return createFallbackArticle(wikiArticle)

        // parse JSON
        let jsonStr = content.trim()
        if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.replace(/^```json?\n?/, '').replace(/\n?```$/, '')
        }

        const parsed: FormattedArticle = JSON.parse(jsonStr)

        // deduplicate sections
        parsed.sections = deduplicateSections(parsed.sections)

        // validate
        if (!validateArticle(parsed)) {
            return createFallbackArticle(wikiArticle)
        }

        return parsed
    } catch {
        return createFallbackArticle(wikiArticle)
    }
}

// fallback article creation
function createFallbackArticle(wikiArticle: WikipediaArticle): FormattedArticle {
    const sections = deduplicateSections(
        wikiArticle.sections.slice(0, 5).map((s) => ({
            title: s.title,
            content: s.content,
        }))
    )

    return {
        overview: wikiArticle.summary,
        sections,
        keyFacts: wikiArticle.infobox.slice(0, 6),
        significance: `Learn about ${wikiArticle.title} and its importance.`,
    }
}

// types
export type KnowledgeType = 'history-event' | 'science-concept' | 'geography-place' | 'general-topic'

export interface KnowledgeEntity {
    title: string
    slug: string
    type: KnowledgeType
    overview: string
    sections: ArticleSection[]
    keyFacts: { label: string; value: string }[]
    timeline?: { date: string; event: string }[]
    significance: string
    heroImage?: WikipediaImage
    images: WikipediaImage[]
    categories: string[]
    relatedTopics: string[]
    sources: { name: string; url?: string }[]
    lastUpdated: Date
    ttl: number
}

// infer type from categories
function inferType(categories: string[]): KnowledgeType {
    const cats = categories.map((c) => c.toLowerCase()).join(' ')
    if (cats.includes('history') || cats.includes('war') || cats.includes('century')) {
        return 'history-event'
    }
    if (cats.includes('geography') || cats.includes('country') || cats.includes('city')) {
        return 'geography-place'
    }
    if (cats.includes('science') || cats.includes('biology') || cats.includes('physics')) {
        return 'science-concept'
    }
    return 'general-topic'
}

// generate complete knowledge entity
export async function generateKnowledgeEntity(
    wikiArticle: WikipediaArticle
): Promise<KnowledgeEntity> {
    const formatted = await formatWithAtlas(wikiArticle)

    const slug = wikiArticle.title
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')

    // limit images: 1 hero + max 4 inline
    const heroImage = wikiArticle.images[0]
    const inlineImages = wikiArticle.images.slice(1, 5)

    // related topics from Wikipedia links
    const relatedTopics = wikiArticle.relatedLinks
        .slice(0, 6)
        .map((t) => t.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))

    const entity: KnowledgeEntity = {
        title: wikiArticle.title,
        slug,
        type: inferType(wikiArticle.categories),
        overview: formatted?.overview || wikiArticle.summary,
        sections: formatted?.sections || [],
        keyFacts: formatted?.keyFacts || [],
        timeline: formatted?.timeline,
        significance: formatted?.significance || '',
        heroImage,
        images: inlineImages,
        categories: wikiArticle.categories,
        relatedTopics,
        sources: [{ name: 'Wikipedia', url: wikiArticle.sourceUrl }],
        lastUpdated: new Date(),
        ttl: 24,
    }

    return entity
}

export { type WikipediaImage }
