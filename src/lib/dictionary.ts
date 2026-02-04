// dictionary lookup via Free Dictionary API

import { fetchWithCache } from './fetch'

const API_BASE = 'https://api.dictionaryapi.dev/api/v2/entries/en'
const CACHE_MINUTES = 24 * 60 // 24h

export interface Phonetic {
    text?: string
    audio?: string
}

export interface Definition {
    definition: string
    example?: string
    synonyms?: string[]
}

export interface Meaning {
    partOfSpeech: string
    definitions: Definition[]
}

export interface DictionaryEntry {
    word: string
    phonetic?: string
    phonetics: Phonetic[]
    meanings: Meaning[]
    sourceUrl?: string
}

export interface DictionaryResult {
    found: boolean
    entry?: DictionaryEntry
    error?: string
}

// raw API response shape
interface ApiPhonetic {
    text?: string
    audio?: string
}

interface ApiDefinition {
    definition: string
    example?: string
    synonyms?: string[]
}

interface ApiMeaning {
    partOfSpeech: string
    definitions: ApiDefinition[]
}

interface ApiEntry {
    word: string
    phonetic?: string
    phonetics?: ApiPhonetic[]
    meanings?: ApiMeaning[]
    sourceUrls?: string[]
}

export async function lookupWord(word: string): Promise<DictionaryResult> {
    const trimmed = word.trim().toLowerCase()
    if (!trimmed) {
        return { found: false, error: 'Please enter a word' }
    }

    try {
        const url = `${API_BASE}/${encodeURIComponent(trimmed)}`
        const data = await fetchWithCache<ApiEntry[]>(url, { cacheMinutes: CACHE_MINUTES })

        if (!data || data.length === 0) {
            return { found: false, error: 'Word not found' }
        }

        const first = data[0]
        const entry: DictionaryEntry = {
            word: first.word,
            phonetic: first.phonetic,
            phonetics: (first.phonetics || []).map(p => ({
                text: p.text,
                audio: p.audio,
            })),
            meanings: (first.meanings || []).map(m => ({
                partOfSpeech: m.partOfSpeech,
                definitions: m.definitions.map(d => ({
                    definition: d.definition,
                    example: d.example,
                    synonyms: d.synonyms,
                })),
            })),
            sourceUrl: first.sourceUrls?.[0],
        }

        return { found: true, entry }
    } catch (err) {
        // 404 means word not found
        if (err instanceof Error && err.message.includes('404')) {
            return { found: false, error: 'Word not found' }
        }
        return { found: false, error: 'Failed to fetch definition' }
    }
}

