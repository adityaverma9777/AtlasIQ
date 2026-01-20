// translation via MyMemory API (primary) and Lingva (fallback)
// Both are free, no authentication required

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

/**
 * Primary: MyMemory API - Free, no auth required
 * Supports 5000 chars/day without auth, much more with email
 * https://mymemory.translated.net/doc/spec.php
 */
async function tryMyMemory(
    text: string,
    targetLang: string,
    sourceLang: string
): Promise<TranslateResult | null> {
    const langPair = sourceLang === 'auto'
        ? `en|${targetLang}` // Default to en for auto-detect
        : `${sourceLang}|${targetLang}`

    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(langPair)}`

    try {
        const response = await fetch(url)
        if (!response.ok) return null

        const data = await response.json()
        if (data.responseStatus === 200 && data.responseData?.translatedText) {
            // MyMemory returns "MYMEMORY WARNING: ..." for quota issues
            const translated = data.responseData.translatedText
            if (translated.startsWith('MYMEMORY WARNING')) {
                return null // Try fallback
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

/**
 * Fallback: Lingva Translate - Free Google Translate frontend
 * Public instances available at various domains
 */
async function tryLingva(
    text: string,
    targetLang: string,
    sourceLang: string
): Promise<TranslateResult | null> {
    const source = sourceLang === 'auto' ? 'auto' : sourceLang

    // Try multiple Lingva instances
    const instances = [
        'https://lingva.ml',
        'https://translate.plausibility.cloud',
        'https://lingva.garudalinux.org',
    ]

    for (const instance of instances) {
        try {
            const url = `${instance}/api/v1/${source}/${targetLang}/${encodeURIComponent(text)}`
            const response = await fetch(url)

            if (!response.ok) continue

            const data = await response.json()
            if (data.translation) {
                return {
                    success: true,
                    text: data.translation,
                    detectedLanguage: data.info?.detectedSource,
                }
            }
        } catch {
            continue
        }
    }
    return null
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

    // check cache for short texts
    if (trimmed.length < 200) {
        const key = getCacheKey(trimmed, sourceLang, targetLang)
        const cached = translateCache.get(key)
        if (cached && cached.expires > Date.now()) {
            return { success: true, text: cached.text }
        }
    }

    // Try MyMemory first (primary)
    const myMemoryResult = await tryMyMemory(trimmed, targetLang, sourceLang)
    if (myMemoryResult?.success) {
        if (trimmed.length < 200) {
            const key = getCacheKey(trimmed, sourceLang, targetLang)
            translateCache.set(key, {
                text: myMemoryResult.text!,
                expires: Date.now() + CACHE_MS,
            })
        }
        return myMemoryResult
    }

    // Try Lingva as fallback
    const lingvaResult = await tryLingva(trimmed, targetLang, sourceLang)
    if (lingvaResult?.success) {
        if (trimmed.length < 200) {
            const key = getCacheKey(trimmed, sourceLang, targetLang)
            translateCache.set(key, {
                text: lingvaResult.text!,
                expires: Date.now() + CACHE_MS,
            })
        }
        return lingvaResult
    }

    return { success: false, error: 'Translation service unavailable. Please try again later.' }
}

export function getLanguageName(code: string): string {
    return LANGUAGES.find(l => l.code === code)?.name || code
}
