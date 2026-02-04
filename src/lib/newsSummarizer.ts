// AI news summarizer - strict factual mode

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

const SUMMARIZER_PROMPT = `You summarize news articles strictly from provided content.

RULES:
- Only use facts from the input
- Never add new information
- Never speculate or interpret
- If content is thin, say "Limited information available"
- Keep it 2-3 sentences max
- State the core fact, source, and date if present

Output format: Plain text summary, no markdown.`

interface GroqResponse {
    choices: Array<{
        message: { content: string }
    }>
}

export interface NewsContent {
    title: string
    description?: string
    content?: string
    sourceName: string
    publishedAt?: string
}

// generates a factual summary from available news content
export async function generateNewsSummary(news: NewsContent): Promise<string> {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY

    // build available text
    const parts: string[] = []
    parts.push(`Title: ${news.title}`)
    if (news.description) parts.push(`Description: ${news.description}`)
    if (news.content) parts.push(`Content: ${news.content}`)
    parts.push(`Source: ${news.sourceName}`)
    if (news.publishedAt) parts.push(`Published: ${news.publishedAt}`)

    const inputText = parts.join('\n')

    // no API key? return raw description
    if (!apiKey) {
        return news.description || news.content || 'Summary unavailable.'
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
                    { role: 'system', content: SUMMARIZER_PROMPT },
                    { role: 'user', content: inputText },
                ],
                temperature: 0.1,
                max_tokens: 200,
            }),
        })

        if (!response.ok) {
            return news.description || 'Summary unavailable.'
        }

        const data: GroqResponse = await response.json()
        const summary = data.choices[0]?.message?.content?.trim()

        return summary || news.description || 'Summary unavailable.'
    } catch {
        return news.description || 'Summary unavailable.'
    }
}

// check if we have enough content to summarize
export function hasEnoughContent(news: NewsContent): boolean {
    const total = (news.title?.length || 0) + 
                  (news.description?.length || 0) + 
                  (news.content?.length || 0)
    return total > 100
}

