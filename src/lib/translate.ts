// Translation service using our Vercel serverless proxy
// Falls back to MyMemory API in local development

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
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ar', name: 'Arabic' },
    { code: 'ko', name: 'Korean' },
    { code: 'bn', name: 'Bengali' },
    { code: 'ta', name: 'Tamil' },
    { code: 'te', name: 'Telugu' },
    { code: 'mr', name: 'Marathi' },
    { code: 'gu', name: 'Gujarati' },
    { code: 'pa', name: 'Punjabi' },
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

function getBaseUrl(): string {
    if (typeof window !== 'undefined') {
        return window.location.origin
    }
    return ''
}

/**
 * Primary: Our Vercel serverless proxy (uses Google Translate)
 */
async function tryServerlessProxy(
    text: string,
    targetLang: string,
    sourceLang: string
): Promise<TranslateResult | null> {
    const baseUrl = getBaseUrl()
    if (!baseUrl) return null

    try {
        const url = `${baseUrl}/api/translate?text=${encodeURIComponent(text)}&source=${sourceLang}&target=${targetLang}`
        const response = await fetch(url)

        if (!response.ok) return null

        const data = await response.json()
        if (data.success && data.translatedText) {
            return {
                success: true,
                text: data.translatedText,
                detectedLanguage: data.detectedLanguage,
            }
        }
        return null
    } catch {
        return null
    }
}

/**
 * Fallback: Direct Google Translate API (may not work in all browsers due to CORS)
 */
async function tryGoogleDirect(
    text: string,
    targetLang: string,
    sourceLang: string
): Promise<TranslateResult | null> {
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`

        const response = await fetch(url)
        if (!response.ok) return null

        const data = await response.json()

        let translatedText = ''
        if (Array.isArray(data) && Array.isArray(data[0])) {
            translatedText = data[0].map((item: string[]) => item[0]).join('')
        }

        if (translatedText) {
            return {
                success: true,
                text: translatedText,
                detectedLanguage: data[2] || undefined,
            }
        }
        return null
    } catch {
        return null
    }
}

/**
 * Last resort: MyMemory API
 */
async function tryMyMemory(
    text: string,
    targetLang: string,
    sourceLang: string
): Promise<TranslateResult | null> {
    const langPair = sourceLang === 'auto'
        ? `en|${targetLang}`
        : `${sourceLang}|${targetLang}`

    try {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(langPair)}`
        const response = await fetch(url)
        if (!response.ok) return null

        const data = await response.json()
        if (data.responseStatus === 200 && data.responseData?.translatedText) {
            const translated = data.responseData.translatedText
            if (translated.startsWith('MYMEMORY WARNING')) {
                return null
            }
            return {
                success: true,
                text: translated,
                detectedLanguage: data.responseData.detectedLanguage || undefined,
            }
        }
        return null
    } catch {
        return null
    }
}

export async function translate(
    text: string,
    targetLang: string,
    sourceLang = 'auto'
): Promise<TranslateResult> {
    const trimmed = text.trim()
    if (!trimmed) {
        return { success: false, error: 'Please enter text to translate' }
    }

    // Check cache
    if (trimmed.length < 500) {
        const key = getCacheKey(trimmed, sourceLang, targetLang)
        const cached = translateCache.get(key)
        if (cached && cached.expires > Date.now()) {
            return { success: true, text: cached.text }
        }
    }

    // Try our serverless proxy first (most reliable)
    const serverlessResult = await tryServerlessProxy(trimmed, targetLang, sourceLang)
    if (serverlessResult?.success) {
        cacheResult(trimmed, sourceLang, targetLang, serverlessResult.text!)
        return serverlessResult
    }

    // Try direct Google API (may work in some cases)
    const googleResult = await tryGoogleDirect(trimmed, targetLang, sourceLang)
    if (googleResult?.success) {
        cacheResult(trimmed, sourceLang, targetLang, googleResult.text!)
        return googleResult
    }

    // Fall back to MyMemory
    const myMemoryResult = await tryMyMemory(trimmed, targetLang, sourceLang)
    if (myMemoryResult?.success) {
        cacheResult(trimmed, sourceLang, targetLang, myMemoryResult.text!)
        return myMemoryResult
    }

    return { success: false, error: 'Translation service unavailable. Please try again later.' }
}

function cacheResult(text: string, source: string, target: string, result: string) {
    if (text.length < 500) {
        const key = getCacheKey(text, source, target)
        translateCache.set(key, {
            text: result,
            expires: Date.now() + CACHE_MS,
        })
    }
}

export function getLanguageName(code: string): string {
    return LANGUAGES.find(l => l.code === code)?.name || code
}

