import { getSmartContext } from './smartContext'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'


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
- If context is provided, USE IT as the ground truth.

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


type QueryIntent = 'SEARCH' | 'GENERAL'

async function classifyIntent(query: string): Promise<QueryIntent> {
    const q = query.toLowerCase()


    const timeKeywords = ['today', 'yesterday', 'tomorrow', 'current', 'latest', 'news', 'price', 'now', 'update', 'recent']
    if (timeKeywords.some(w => q.includes(w))) {
        return 'SEARCH'
    }


    const apiKey = import.meta.env.VITE_GROQ_API_KEY
    if (!apiKey) return 'GENERAL'

    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile', // using versatile for speed
                messages: [
                    {
                        role: 'system',
                        content: `Classify if the user query requires external real-time data, news, specific facts, or recent events. 
                        Respond ONLY with "SEARCH" or "GENERAL".
                        
                        Examples:
                        "What is the price of Bitcoin?" -> SEARCH
                        "Who won the match yesterday?" -> SEARCH
                        "Write a python script" -> GENERAL
                        "Explain quantum physics" -> SEARCH (FACTUAL)
                        "Hello how are you" -> GENERAL
                        "Tell me a joke" -> GENERAL`
                    },
                    { role: 'user', content: query }
                ],
                temperature: 0.1,
                max_tokens: 10,
            }),
        })

        if (!response.ok) return 'GENERAL'

        const data: GroqResponse = await response.json()
        const verdict = data.choices[0]?.message?.content?.trim().toUpperCase()

        return verdict === 'SEARCH' ? 'SEARCH' : 'GENERAL'
    } catch {
        return 'GENERAL'
    }
}


export async function sendChatMessage(
    query: string,
    history: ChatMessage[]
): Promise<string> {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY

    if (!apiKey) {
        return 'Atlas is currently unavailable. Please check the API configuration.'
    }


    const intent = await classifyIntent(query)

    let context: string | null = null


    if (intent === 'SEARCH') {
        const smartResult = await getSmartContext(query)
        if (smartResult) {
            context = smartResult.context
        }
    }


    const messages: Array<{ role: string; content: string }> = [
        { role: 'system', content: ATLAS_SYSTEM_PROMPT },
    ]


    if (context) {
        messages.push({
            role: 'system',
            content: `Use the following REAL-TIME INTELLIGENCE found on the web to inform your response.
            Verify the user's question against this data.
            \n=== WEB CONTEXT ===\n${context}\n===================`,
        })
    }


    const recentHistory = history.slice(-8)
    for (const msg of recentHistory) {
        messages.push({ role: msg.role, content: msg.content })
    }

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

