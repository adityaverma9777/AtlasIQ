/**
 * Search Page - Article Synthesis Mode
 * 
 * When user searches any topic, this page:
 * 1. Gathers information from news + Wikipedia + trusted sources
 * 2. Synthesizes a single, clean, original article
 * 3. Displays the full article inline (NOT a link list)
 */

import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ArticleView, ArticleSkeleton } from '../components/ArticleView'
import { getOrSynthesizeArticle, resolveArticleTopic, type SynthesizedArticle } from '../lib/articleSynthesizer'
import { Search as SearchIcon, ArrowLeft } from 'lucide-react'
import './Search.css'

export function Search() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const query = searchParams.get('q') || ''

    const [article, setArticle] = useState<SynthesizedArticle | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [resolvedTopic, setResolvedTopic] = useState<string>('')
    const [searchInput, setSearchInput] = useState(query)

    // Synthesize article when query changes
    useEffect(() => {
        if (!query.trim()) {
            setArticle(null)
            return
        }

        let cancelled = false

        const synthesize = async () => {
            setLoading(true)
            setError(null)
            setArticle(null)

            try {
                // Resolve to best topic name
                const topic = await resolveArticleTopic(query)
                if (cancelled) return
                setResolvedTopic(topic)

                // Synthesize article
                const result = await getOrSynthesizeArticle(topic)
                if (cancelled) return

                if (result) {
                    setArticle(result)
                } else {
                    setError(`We couldn't find enough information about "${topic}" to write an article.`)
                }
            } catch (err) {
                if (!cancelled) {
                    setError('Something went wrong. Please try a different search.')
                }
            } finally {
                if (!cancelled) {
                    setLoading(false)
                }
            }
        }

        synthesize()

        return () => {
            cancelled = true
        }
    }, [query])

    // Handle new search
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (searchInput.trim() && searchInput.trim() !== query) {
            navigate(`/search?q=${encodeURIComponent(searchInput.trim())}`)
        }
    }

    return (
        <div className="search-page">
            {/* Sticky Search Bar */}
            <div className="search-bar-sticky">
                <div className="container">
                    <form className="search-bar-form" onSubmit={handleSearch}>
                        <button
                            type="button"
                            className="search-back-btn"
                            onClick={() => navigate('/')}
                            aria-label="Go back"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div className="search-bar-box">
                            <SearchIcon className="search-bar-icon" size={18} />
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Search any topic..."
                                className="search-bar-input"
                            />
                        </div>
                    </form>
                </div>
            </div>

            {/* Main Content */}
            <div className="container search-content">
                {/* Loading State */}
                {loading && (
                    <div className="search-loading">
                        <div className="loading-message">
                            <div className="loading-spinner" />
                            <p className="loading-text">
                                Writing an article about <strong>{resolvedTopic || query}</strong>...
                            </p>
                            <p className="loading-subtext">
                                Gathering information from trusted sources
                            </p>
                        </div>
                        <ArticleSkeleton />
                    </div>
                )}

                {/* Error State */}
                {!loading && error && (
                    <div className="search-error">
                        <div className="error-icon">📭</div>
                        <h2>No Article Available</h2>
                        <p>{error}</p>
                        <div className="error-suggestions">
                            <p>Try searching for:</p>
                            <div className="suggestion-chips">
                                {['Climate change', 'Artificial intelligence', 'Indian economy', 'Space exploration'].map(topic => (
                                    <button
                                        key={topic}
                                        className="suggestion-chip"
                                        onClick={() => navigate(`/search?q=${encodeURIComponent(topic)}`)}
                                    >
                                        {topic}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Article Display */}
                {!loading && article && (
                    <ArticleView
                        article={article}
                        showFollowUp={true}
                        onAskAtlas={() => {
                            // Dispatch custom event to open Atlas chat with article context
                            const event = new CustomEvent('openAtlasChat', {
                                detail: {
                                    context: `I'm reading an article about "${article.title}". ${article.summary}`,
                                    topic: article.topic,
                                }
                            })
                            window.dispatchEvent(event)
                        }}
                    />
                )}

                {/* Empty State (no query) */}
                {!query && !loading && (
                    <div className="search-empty">
                        <div className="empty-icon">🔍</div>
                        <h2>Search any topic</h2>
                        <p>We'll write a comprehensive article for you, synthesizing information from trusted sources.</p>
                        <div className="popular-topics">
                            <p>Popular topics:</p>
                            <div className="suggestion-chips">
                                {['Electric vehicles', 'Quantum computing', 'Indian startups', 'Renewable energy'].map(topic => (
                                    <button
                                        key={topic}
                                        className="suggestion-chip"
                                        onClick={() => navigate(`/search?q=${encodeURIComponent(topic)}`)}
                                    >
                                        {topic}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

