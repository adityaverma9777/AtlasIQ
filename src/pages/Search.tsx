import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { search, getEntityPath, type SearchResult as SearchResultType } from '../lib'
import { SectionHeader } from '../components/dashboard'
import { Loader, InlineLoader } from '../components/Loader'
import './Search.css'

export function Search() {
    const [searchParams] = useSearchParams()
    const query = searchParams.get('q') || ''

    const [result, setResult] = useState<SearchResultType | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!query.trim()) {
            setResult(null)
            return
        }

        setLoading(true)
        setError(null)

        search(query)
            .then((res) => {
                setResult(res)
                setLoading(false)
            })
            .catch(() => {
                setError('Search failed. Please try again.')
                setLoading(false)
            })
    }, [query])

    const article = result?.article

    return (
        <div className="container search-page">
            <header className="search-header">
                <h1>
                    Search: <span className="search-query">{query}</span>
                </h1>
                {loading && <InlineLoader text="Searching encyclopedia..." />}
            </header>

            {/* loading state */}
            {loading && (
                <div className="search-loading">
                    <Loader size="lg" text={`Looking up "${result?.searchedTopic || query}"...`} />
                </div>
            )}

            {/* error state */}
            {error && !loading && (
                <div className="no-results">
                    <h2>Search Error</h2>
                    <p>{error}</p>
                </div>
            )}

            {/* no result found */}
            {!loading && !error && result && !result.found && (
                <div className="no-results">
                    <h2>No encyclopedia article found</h2>
                    <p>We couldn't find a Wikipedia article for "{result.searchedTopic || query}".</p>
                    <p className="no-results-hint">Try a different topic or check your spelling.</p>
                </div>
            )}

            {/* article found */}
            {!loading && article && (
                <div className="search-results">
                    <section className="search-section knowledge-result">
                        <SectionHeader title="Encyclopedia Article" subtitle="From Wikipedia" />
                        <div className="knowledge-card">
                            {article.heroImage && (
                                <img
                                    src={article.heroImage.url}
                                    alt={article.title}
                                    className="knowledge-card-image"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none'
                                    }}
                                />
                            )}
                            <div className="knowledge-card-content">
                                <h3>{article.title}</h3>
                                <p className="knowledge-summary">{article.overview}</p>
                                {article.sections[0] && (
                                    <p className="knowledge-preview">
                                        {article.sections[0].content.slice(0, 250)}...
                                    </p>
                                )}
                                <Link
                                    to={getEntityPath('learn', article.slug)}
                                    className="knowledge-link"
                                >
                                    Read full article →
                                </Link>
                            </div>
                        </div>
                    </section>
                </div>
            )}
        </div>
    )
}
