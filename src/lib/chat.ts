// Atlas Chat service - knowledge-aware chat with Groq

import { getKnowledgeArticle } from './knowledge'
import { search } from './search'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

// strict Atlas identity
const ATLAS_SYSTEM_PROMPT = `You are Atlas, the intelligence assistant of AtlasIQ.

IDENTITY:
- Always refer to yourself as "Atlas"
- You are part of AtlasIQ, an intelligence platform

RESPONSE RULES:
- Answer factually, clearly, and concisely
- Do NOT express opinions
- Do NOT hallucinate facts
- Cite context when provided
- Use structured responses (short paragraphs or bullets)
- No emojis, slang, or filler

SAFETY:
- Avoid speculation
- Avoid political opinions
- Avoid financial advice
- State uncertainty if data is unavailable

STYLE:
- Professional encyclopedia tone
- 2-4 short paragraphs max
- Use bullet points for lists
- Be helpful but concise`

export interface ChatMessage {
    role: 'user' | 'assistant'
    content: string
}

interface GroqResponse {
    choices: Array<{
        message: { content: string }
    }>
}

// detect query intent
type QueryIntent = 'knowledge' | 'exam' | 'weather' | 'aqi' | 'market' | 'government' | 'general'

function detectIntent(query: string): QueryIntent {
    const q = query.toLowerCase()

    if (q.includes('exam') || q.includes('upsc') || q.includes('jee') || q.includes('neet')) {
        return 'exam'
    }
    if (q.includes('weather') || q.includes('temperature') || q.includes('forecast')) {
        return 'weather'
    }
    if (q.includes('aqi') || q.includes('air quality') || q.includes('pollution')) {
        return 'aqi'
    }
    if (q.includes('market') || q.includes('bitcoin') || q.includes('crypto') || q.includes('stock')) {
        return 'market'
    }
    if (q.includes('government') || q.includes('policy') || q.includes('election') || q.includes('diplomacy')) {
        return 'government'
    }
    if (q.includes('what is') || q.includes('explain') || q.includes('tell me about') || q.includes('who is')) {
        return 'knowledge'
    }
    return 'general'
}

// get relevant context from AtlasIQ
async function getContext(query: string, intent: QueryIntent): Promise<string | null> {
    try {
        if (intent === 'knowledge') {
            // extract topic from query
            const topic = query
                .replace(/^(what is|explain|tell me about|who is|who was)\s*/i, '')
                .replace(/\?$/, '')
                .trim()

            if (topic.length > 2) {
                const article = await getKnowledgeArticle(topic)
                if (article) {
                    const sections = article.sections.slice(0, 2).map(s => s.content).join(' ')
                    return `[AtlasIQ Knowledge: ${article.title}]\n${article.overview}\n${sections.slice(0, 800)}`
                }
            }
        }

        // search for any matching entities
        const results = await search(query)
        if (results?.article) {
            const sections = results.article.sections.slice(0, 2).map(s => s.content).join(' ')
            return `[AtlasIQ Knowledge: ${results.article.title}]\n${results.article.overview}\n${sections.slice(0, 800)}`
        }

        return null
    } catch {
        return null
    }
}

// send message to Atlas
export async function sendChatMessage(
    query: string,
    history: ChatMessage[]
): Promise<string> {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY

    if (!apiKey) {
        return 'Atlas is currently unavailable. Please check the API configuration.'
    }

    const intent = detectIntent(query)
    const context = await getContext(query, intent)

    // build messages
    const messages: Array<{ role: string; content: string }> = [
        { role: 'system', content: ATLAS_SYSTEM_PROMPT },
    ]

    // add context if available
    if (context) {
        messages.push({
            role: 'system',
            content: `Use the following AtlasIQ data to inform your response:\n${context}`,
        })
    }

    // add conversation history (last 4 exchanges)
    const recentHistory = history.slice(-8)
    for (const msg of recentHistory) {
        messages.push({ role: msg.role, content: msg.content })
    }

    // add current query
    messages.push({ role: 'user', content: query })

    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages,
                temperature: 0.4,
                max_tokens: 800,
            }),
        })

        if (!response.ok) {
            throw new Error('API error')
        }

        const data: GroqResponse = await response.json()
        const reply = data.choices[0]?.message?.content?.trim()

        return reply || 'I could not generate a response. Please try again.'
    } catch {
        return 'Atlas encountered an error. Please try again.'
    }
}
