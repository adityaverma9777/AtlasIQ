import { fetchHeadlines } from './news'
import { fetchIndiaNews } from './indiaNews'
import { search } from './search'
import { fetchWikipediaSummary } from './wikipedia'

// ─────────────────────────────────────────────────────────────
// Smart Context Provider
// Aggregates News + Encyclopedia data for "Web Search" capability
// ─────────────────────────────────────────────────────────────

interface SmartContextResult {
    context: string
    sources: Array<{ title: string; url: string; source: string }>
}

export async function getSmartContext(query: string): Promise<SmartContextResult | null> {
    try {
        // Run searches in parallel
        const [newsGlobal, newsIndia, wikiResult] = await Promise.all([
            fetchHeadlines({ country: 'GLOBAL' }, { pageSize: 4 }).catch(() => []),
            fetchIndiaNews({ limit: 4 }).catch(() => []),
            search(query).catch(() => null)
        ])

        const parts: string[] = []
        const sources: Array<{ title: string; url: string; source: string }> = []

        // Normalize to common structure
        const normalizedNews = [
            ...newsIndia.map(a => ({
                title: a.title,
                summary: a.description,
                url: a.url,
                source: a.sources[0]?.name || 'News'
            })),
            ...newsGlobal.map(a => ({
                title: a.title,
                summary: a.summary,
                url: a.url,
                source: a.tag
            }))
        ]

        // Dedup locally
        const uniqueNews = normalizedNews.filter((article, index, self) =>
            index === self.findIndex((a) => a.url === article.url)
        ).slice(0, 5)

        if (uniqueNews.length > 0) {
            parts.push(`[LATEST NEWS / WEB SEARCH RESULTS]`)
            uniqueNews.forEach((article) => {
                if (article.title && article.summary) {
                    parts.push(`- TITLE: ${article.title}\n  SOURCE: ${article.source}\n  SUMMARY: ${article.summary.slice(0, 300)}...`)
                    sources.push({ title: article.title, url: article.url, source: article.source })
                }
            })
            parts.push('') // spacer
        }

        // 2. Process Encyclopedia/Static Knowledge
        if (wikiResult?.article) {
            parts.push(`[ENCYCLOPEDIA KNOWLEDGE: ${wikiResult.article.title}]`)
            parts.push(wikiResult.article.overview)
            // Add first 2 sections for depth
            wikiResult.article.sections.slice(0, 2).forEach(s => {
                parts.push(`\n${s.title}:\n${s.content.slice(0, 500)}...`)
            })
            sources.push({
                title: wikiResult.article.title,
                url: wikiResult.article.sources[0]?.url || '',
                source: 'Wikipedia'
            })
        } else {
            // Fallback: Try a direct wiki summary fetch if 'search' didn't return a full cached/generated entity
            // This is useful for quick facts that haven't been synthesized into an entity yet
            const rawWiki = await fetchWikipediaSummary(query).catch(() => null)
            if (rawWiki) {
                parts.push(`[ENCYCLOPEDIA KNOWLEDGE: ${rawWiki.title}]`)
                parts.push(rawWiki.summary)
                sources.push({ title: rawWiki.title, url: rawWiki.sourceUrl, source: 'Wikipedia' })
            }
        }

        if (parts.length === 0) return null

        return {
            context: parts.join('\n'),
            sources
        }

    } catch (err) {
        console.error('Error fetching smart context:', err)
        return null
    }
}
