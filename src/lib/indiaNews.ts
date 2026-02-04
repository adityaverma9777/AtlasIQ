/**
 * India News Engine - Multi-source aggregation with deduplication
 * Sources: NewsAPI, NewsData.io, WorldNewsAPI, Google News RSS
 */

import { fetchWithCache } from './fetch'
import { fetchGoogleNewsIndiaHeadlines } from './googleNews'

// Article from any source (normalized)
export interface IndiaNewsArticle {
    id: string
    title: string
    description: string
    url: string
    imageUrl?: string
    publishedAt: string
    category?: string
    sources: Array<{ name: string; url: string }>
}

// Cache constants
const CACHE_KEY = 'atlasiq_india_news_cache'
const CACHE_TTL = 30 * 60 * 1000 // 30 minutes

// API keys
const NEWSAPI_KEY = import.meta.env.VITE_NEWS_API_KEY
const NEWSDATA_KEY = import.meta.env.VITE_NEWSDATA_API_KEY
const WORLDNEWS_KEY = import.meta.env.VITE_WORLDNEWS_API_KEY

// Normalize text for comparison
function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
}

// Simple word tokenizer
function tokenize(text: string): Set<string> {
    const normalized = normalizeText(text)
    const words = normalized.split(' ').filter(w => w.length > 3)
    return new Set(words)
}

// Jaccard similarity between two sets
function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
    const intersection = new Set([...a].filter(x => b.has(x)))
    const union = new Set([...a, ...b])
    return union.size > 0 ? intersection.size / union.size : 0
}

// Clean article title
function cleanTitle(title: string): string {
    return title
        .replace(/\s*[-–|]\s*[^-–|]+$/, '') // Remove source suffix
        .replace(/\[.*?\]/g, '')
        .trim()
}

// Clean article description
function cleanDescription(text: string): string {
    return text
        .replace(/<[^>]+>/g, ' ')
        .replace(/\[.*?\]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 300)
}

// Generate unique ID for article
function generateId(title: string, source: string): string {
    const normalized = normalizeText(title).slice(0, 50)
    return `${source}-${normalized.replace(/\s+/g, '-')}`
}

// Raw article from APIs
interface RawArticle {
    title: string
    description: string
    url: string
    imageUrl?: string
    publishedAt: string
    sourceName: string
    category?: string
}

// Fetch from NewsAPI
async function fetchNewsAPI(): Promise<RawArticle[]> {
    if (!NEWSAPI_KEY) return []

    try {
        const params = new URLSearchParams({
            country: 'in',
            pageSize: '20',
            apiKey: NEWSAPI_KEY,
        })
        const url = `https://newsapi.org/v2/top-headlines?${params}`
        const data = await fetchWithCache<{
            articles: Array<{
                title: string
                description: string | null
                url: string
                urlToImage: string | null
                publishedAt: string
                source: { name: string }
            }>
        }>(url, { cacheMinutes: 10 })

        return data.articles
            .filter(a => a.title && a.description && a.url)
            .map(a => ({
                title: a.title,
                description: a.description || '',
                url: a.url,
                imageUrl: a.urlToImage || undefined,
                publishedAt: a.publishedAt,
                sourceName: a.source.name,
            }))
    } catch (err) {
        console.warn('NewsAPI fetch failed:', err)
        return []
    }
}

// Fetch from NewsData.io
async function fetchNewsData(): Promise<RawArticle[]> {
    if (!NEWSDATA_KEY) return []

    try {
        const params = new URLSearchParams({
            country: 'in',
            language: 'en',
            apikey: NEWSDATA_KEY,
        })
        const url = `https://newsdata.io/api/1/news?${params}`
        const data = await fetchWithCache<{
            results: Array<{
                title: string
                description: string | null
                link: string
                image_url: string | null
                pubDate: string
                source_id: string
                category: string[]
            }>
        }>(url, { cacheMinutes: 10 })

        return (data.results || [])
            .filter(a => a.title && a.link)
            .map(a => ({
                title: a.title,
                description: a.description || '',
                url: a.link,
                imageUrl: a.image_url || undefined,
                publishedAt: a.pubDate || new Date().toISOString(),
                sourceName: a.source_id,
                category: a.category?.[0],
            }))
    } catch (err) {
        console.warn('NewsData.io fetch failed:', err)
        return []
    }
}

// Fetch from WorldNewsAPI
async function fetchWorldNews(): Promise<RawArticle[]> {
    if (!WORLDNEWS_KEY) return []

    try {
        const params = new URLSearchParams({
            'source-countries': 'in',
            language: 'en',
            number: '20',
            'api-key': WORLDNEWS_KEY,
        })
        const url = `https://api.worldnewsapi.com/search-news?${params}`
        const data = await fetchWithCache<{
            news: Array<{
                title: string
                text: string
                url: string
                image: string | null
                publish_date: string
                source_country: string
            }>
        }>(url, { cacheMinutes: 10 })

        return (data.news || [])
            .filter(a => a.title && a.url)
            .map(a => ({
                title: a.title,
                description: a.text?.slice(0, 300) || '',
                url: a.url,
                imageUrl: a.image || undefined,
                publishedAt: a.publish_date,
                sourceName: 'WorldNews',
            }))
    } catch (err) {
        console.warn('WorldNewsAPI fetch failed:', err)
        return []
    }
}

// Fetch from Google News RSS
async function fetchGoogleNews(): Promise<RawArticle[]> {
    try {
        const headlines = await fetchGoogleNewsIndiaHeadlines({
            page: 1,
            pageSize: 15,
            bypassCache: false,
        })

        return headlines.map(h => ({
            title: h.title,
            description: h.summary,
            url: h.url,
            imageUrl: h.imageUrl,
            publishedAt: h.publishedAt || new Date().toISOString(),
            sourceName: h.tag || 'Google News',
        }))
    } catch (err) {
        console.warn('Google News fetch failed:', err)
        return []
    }
}

// Cluster similar articles
interface ArticleCluster {
    articles: RawArticle[]
    titleTokens: Set<string>
}

function clusterArticles(articles: RawArticle[]): ArticleCluster[] {
    const clusters: ArticleCluster[] = []
    const SIMILARITY_THRESHOLD = 0.5

    for (const article of articles) {
        const tokens = tokenize(article.title)
        let addedToCluster = false

        for (const cluster of clusters) {
            const similarity = jaccardSimilarity(tokens, cluster.titleTokens)
            if (similarity >= SIMILARITY_THRESHOLD) {
                cluster.articles.push(article)
                // Merge tokens
                tokens.forEach(t => cluster.titleTokens.add(t))
                addedToCluster = true
                break
            }
        }

        if (!addedToCluster) {
            clusters.push({ articles: [article], titleTokens: tokens })
        }
    }

    return clusters
}

// Merge cluster into single article (fusion)
function mergeCluster(cluster: ArticleCluster): IndiaNewsArticle {
    const articles = cluster.articles

    // Use first article as base (usually highest quality)
    const primary = articles[0]

    // Collect all sources
    const sources = articles.map(a => ({
        name: a.sourceName,
        url: a.url,
    }))

    // Dedupe sources by name
    const uniqueSources = sources.filter(
        (s, i, arr) => arr.findIndex(x => x.name === s.name) === i
    )

    // Select best image (prefer first non-null)
    const imageUrl = articles.find(a => a.imageUrl)?.imageUrl

    // Use earliest publish date
    const dates = articles
        .map(a => new Date(a.publishedAt).getTime())
        .filter(d => !isNaN(d))
    const earliestDate = dates.length > 0
        ? new Date(Math.min(...dates)).toISOString()
        : new Date().toISOString()

    return {
        id: generateId(primary.title, 'merged'),
        title: cleanTitle(primary.title),
        description: cleanDescription(primary.description),
        url: primary.url,
        imageUrl,
        publishedAt: earliestDate,
        category: primary.category,
        sources: uniqueSources,
    }
}

// Check cache validity
function getCachedNews(): IndiaNewsArticle[] | null {
    try {
        const stored = localStorage.getItem(CACHE_KEY)
        if (stored) {
            const { articles, timestamp } = JSON.parse(stored)
            if (Date.now() - timestamp < CACHE_TTL) {
                return articles
            }
        }
    } catch {
        // ignore
    }
    return null
}

// Save to cache
function saveToCache(articles: IndiaNewsArticle[]) {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
            articles,
            timestamp: Date.now(),
        }))
    } catch {
        // ignore
    }
}

// Main fetch function
export async function fetchIndiaNews(opts: {
    limit?: number
    bypassCache?: boolean
} = {}): Promise<IndiaNewsArticle[]> {
    const { limit = 12, bypassCache = false } = opts

    // Check cache first
    if (!bypassCache) {
        const cached = getCachedNews()
        if (cached && cached.length > 0) {
            return cached.slice(0, limit)
        }
    }

    // Fetch from all sources in parallel
    const [newsapi, newsdata, worldnews, googlenews] = await Promise.all([
        fetchNewsAPI(),
        fetchNewsData(),
        fetchWorldNews(),
        fetchGoogleNews(),
    ])

    // Combine all articles
    const allArticles = [...newsapi, ...newsdata, ...worldnews, ...googlenews]

    console.log(`[IndiaNews] Fetched: NewsAPI=${newsapi.length}, NewsData=${newsdata.length}, WorldNews=${worldnews.length}, GoogleNews=${googlenews.length}`)

    if (allArticles.length === 0) {
        return []
    }

    // Sort by publish date (newest first)
    allArticles.sort((a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    )

    // Cluster similar articles
    const clusters = clusterArticles(allArticles)

    // Merge clusters into final articles
    const mergedArticles = clusters.map(mergeCluster)

    // Sort and limit
    const result = mergedArticles
        .sort((a, b) =>
            new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        )
        .slice(0, limit)

    // Cache result
    saveToCache(result)

    return result
}


