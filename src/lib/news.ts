import { fetchWithCache } from './fetch'

export interface Headline {
    title: string
    summary: string
    tag: string
    url: string
    imageUrl?: string
    author?: string
    publishedAt?: string
    content?: string
}

interface NewsApiArticle {
    title: string
    description: string | null
    content?: string | null
    url: string
    urlToImage?: string | null
    publishedAt?: string
    author?: string | null
    source: { name: string }
}

interface NewsApiResponse {
    status: string
    articles: NewsApiArticle[]
}

const API_KEY = import.meta.env.VITE_NEWS_API_KEY

export type NewsCountryCode = 'GLOBAL' | 'IN'

export const NEWSAPI_COUNTRIES: Array<{ code: string; name: string }> = [
    { code: 'GLOBAL', name: 'Global' },
    { code: 'IN', name: 'India' },
]

export interface NewsFilters {
    country: NewsCountryCode
}

function cleanSummary(text: string): string {
    return text.replace(/\[\+\d+\s*chars\]/g, '').trim()
}

export async function fetchHeadlines(
    filters: NewsFilters = { country: 'GLOBAL' },
    opts: { page?: number; pageSize?: number; bypassCache?: boolean } = {}
): Promise<Headline[]> {
    const { country } = filters
    const page = opts.page ?? 1
    const pageSize = opts.pageSize ?? 6
    const bypassCache = opts.bypassCache ?? false

    if (country === 'IN') {
        // India uses Google News RSS (no API key needed)
        const { fetchGoogleNewsIndiaHeadlines } = await import('./googleNews')
        return fetchGoogleNewsIndiaHeadlines({ page, pageSize, bypassCache })
    }

    // Global mode requires NewsAPI key
    if (!API_KEY) {
        throw new Error('News API key not configured. Set VITE_NEWS_API_KEY in your .env file.')
    }

    // Global mode: everything endpoint (stable without country/source constraints)
    const params = new URLSearchParams()
    params.set('language', 'en')
    params.set('pageSize', String(pageSize))
    params.set('page', String(page))
    params.set('sortBy', 'publishedAt')
    params.set('apiKey', API_KEY)
    params.set('q', 'world OR global OR international')
    const url = `https://newsapi.org/v2/everything?${params.toString()}`

    const data = await fetchWithCache<NewsApiResponse>(url, { cacheMinutes: 10, bypassCache })

    return data.articles
        .filter((a) => a.title && a.description && a.url)
        .map((article) => ({
            title: article.title,
            summary: cleanSummary(article.description || ''),
            tag: article.source.name,
            url: article.url,
            imageUrl: article.urlToImage || undefined,
            author: article.author || undefined,
            publishedAt: article.publishedAt,
            content: article.content || undefined,
        }))
}
