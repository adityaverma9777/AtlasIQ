// translation via LibreTranslate (free, no key)

export interface Language {
    code: string
    name: string
}

export const LANGUAGES: Language[] = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'Hindi' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
]

export interface TranslateResult {
    success: boolean
    text?: string
    detectedLanguage?: string
    error?: string
}

// cache for short translations
const translateCache = new Map<string, { text: string; expires: number }>()
const CACHE_MS = 30 * 60 * 1000 // 30min

function getCacheKey(text: string, source: string, target: string): string {
    return `${source}:${target}:${text.slice(0, 100)}`
}

// list of public LibreTranslate instances
const ENDPOINTS = [
    'https://libretranslate.com/translate',
    'https://translate.argosopentech.com/translate',
    'https://translate.terraprint.co/translate',
]

export async function translate(
    text: string,
    targetLang: string,
    sourceLang = 'auto'
): Promise<TranslateResult> {
    const trimmed = text.trim()
    if (!trimmed) {
        return { success: false, error: 'Please enter text to translate' }
    }

    // check cache for short texts
    if (trimmed.length < 200) {
        const key = getCacheKey(trimmed, sourceLang, targetLang)
        const cached = translateCache.get(key)
        if (cached && cached.expires > Date.now()) {
            return { success: true, text: cached.text }
        }
    }

    // try each endpoint
    for (const endpoint of ENDPOINTS) {
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    q: trimmed,
                    source: sourceLang === 'auto' ? 'auto' : sourceLang,
                    target: targetLang,
                    format: 'text',
                }),
            })

            if (!response.ok) continue

            const data = await response.json()
            if (data.translatedText) {
                // cache result
                if (trimmed.length < 200) {
                    const key = getCacheKey(trimmed, sourceLang, targetLang)
                    translateCache.set(key, {
                        text: data.translatedText,
                        expires: Date.now() + CACHE_MS,
                    })
                }
                return {
                    success: true,
                    text: data.translatedText,
                    detectedLanguage: data.detectedLanguage?.language,
                }
            }
        } catch {
            continue
        }
    }

    return { success: false, error: 'Translation service unavailable' }
}

export function getLanguageName(code: string): string {
    return LANGUAGES.find(l => l.code === code)?.name || code
}
