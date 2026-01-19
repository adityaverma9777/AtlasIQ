import { useState, useEffect, useCallback } from 'react'
import { SectionHeader, InfoCard, AQICard } from '../components/dashboard'
import { useAsync, useUserContext } from '../hooks'
import { fetchWeather, fetchAQI } from '../lib'
import { fetchIndiaNews, type IndiaNewsArticle } from '../lib/indiaNews'
import { RefreshCw, ExternalLink, CheckCircle2, Newspaper, Clock, Navigation, MapPin } from 'lucide-react'
import './India.css'

// Format relative time
function formatTimeAgo(dateStr: string): string {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
}

// Section header with refresh
function RefreshableHeader({
    title,
    subtitle,
    lastUpdated,
    onRefresh,
    loading
}: {
    title: string
    subtitle?: string
    lastUpdated?: string
    onRefresh?: () => void
    loading?: boolean
}) {
    return (
        <div className="india-section-header">
            <SectionHeader title={title} subtitle={subtitle} />
            <div className="india-section-meta">
                {lastUpdated && (
                    <span className="india-last-updated">
                        Updated {formatTimeAgo(lastUpdated)}
                    </span>
                )}
                {onRefresh && (
                    <button
                        className="india-refresh-btn"
                        onClick={onRefresh}
                        disabled={loading}
                        title="Refresh data"
                    >
                        <RefreshCw size={14} className={loading ? 'spinning' : ''} />
                    </button>
                )}
            </div>
        </div>
    )
}

// News card component
function NewsCard({ article }: { article: IndiaNewsArticle }) {
    const isFused = article.sources.length > 1

    return (
        <article className={`india-news-card ${isFused ? 'india-news-card--featured' : ''}`}>
            {article.imageUrl && (
                <div className="india-news-image">
                    <img src={article.imageUrl} alt="" loading="lazy" />
                </div>
            )}
            <div className="india-news-content">
                <div className="india-news-meta">
                    {isFused && (
                        <span className="india-verified-badge">
                            <CheckCircle2 size={12} />
                            Verified by {article.sources.length} sources
                        </span>
                    )}
                    {article.category && (
                        <span className="india-news-category">{article.category}</span>
                    )}
                </div>
                <h3 className="india-news-title">
                    <a href={article.url} target="_blank" rel="noopener noreferrer">
                        {article.title}
                    </a>
                </h3>
                <p className="india-news-summary">{article.description}</p>
                <div className="india-news-footer">
                    <span className="india-news-time">
                        <Clock size={12} />
                        {formatTimeAgo(article.publishedAt)}
                    </span>
                    <div className="india-news-sources">
                        {article.sources.map((source: { name: string; url: string }, i: number) => (
                            <a
                                key={i}
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="india-source-link"
                            >
                                <ExternalLink size={10} />
                                {source.name}
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </article>
    )
}

// Loading skeleton
function NewsSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className="india-news-grid">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="india-news-skeleton">
                    <div className="skeleton-image" />
                    <div className="skeleton-content">
                        <div className="skeleton-title" />
                        <div className="skeleton-summary" />
                        <div className="skeleton-meta" />
                    </div>
                </div>
            ))}
        </div>
    )
}

// Auto-refresh interval (30 minutes)
const REFRESH_INTERVAL = 30 * 60 * 1000
const INITIAL_LIMIT = 12
const LOAD_MORE_COUNT = 12

export function India() {
    const { location, detectGPS, isDetectingGPS, isAutoDetected, isGPSActive } = useUserContext()
    const [newsRefreshKey, setNewsRefreshKey] = useState(0)
    const [lastFetched, setLastFetched] = useState<string>()
    const [displayLimit, setDisplayLimit] = useState(INITIAL_LIMIT)
    const [loadingMore, setLoadingMore] = useState(false)
    const [gpsError, setGpsError] = useState<string | null>(null)

    const forceRefreshNews = useCallback(() => {
        setDisplayLimit(INITIAL_LIMIT) // Reset to initial limit on refresh
        setNewsRefreshKey(k => k + 1)
    }, [])

    // Handle GPS detection
    const handleGPSClick = useCallback(async () => {
        setGpsError(null)
        const success = await detectGPS()
        if (!success) {
            setGpsError('Unable to get GPS location')
            // Clear error after 3 seconds
            setTimeout(() => setGpsError(null), 3000)
        }
    }, [detectGPS])

    // Weather and AQI
    const weather = useAsync(
        () => fetchWeather({ lat: location.lat, lon: location.lon, name: location.city }),
        [location.lat, location.lon]
    )
    const aqi = useAsync(
        () => fetchAQI({ lat: location.lat, lon: location.lon, name: location.city }),
        [location.lat, location.lon]
    )

    // Multi-source India news - fetch more than we display initially
    const news = useAsync(
        async () => {
            const articles = await fetchIndiaNews({ limit: 50 }) // Fetch more for pagination
            setLastFetched(new Date().toISOString())
            return articles
        },
        [newsRefreshKey]
    )

    // Load more handler
    const handleLoadMore = useCallback(() => {
        setLoadingMore(true)
        // Simulate small delay for UX
        setTimeout(() => {
            setDisplayLimit(prev => prev + LOAD_MORE_COUNT)
            setLoadingMore(false)
        }, 300)
    }, [])

    // Auto-refresh every 30 minutes
    useEffect(() => {
        const interval = setInterval(forceRefreshNews, REFRESH_INTERVAL)
        return () => clearInterval(interval)
    }, [forceRefreshNews])

    // Get articles to display based on current limit
    const displayedArticles = news.data?.slice(0, displayLimit) ?? []
    const hasMore = (news.data?.length ?? 0) > displayLimit

    return (
        <div className="container india-page">
            <header className="india-header">
                <h1>India Intelligence</h1>
                <p>Verified news from multiple trusted sources</p>
            </header>

            {/* India Snapshot */}
            <section className="india-section">
                <div className="india-snapshot-header">
                    <SectionHeader
                        title="India Snapshot"
                        subtitle={
                            <span className="india-location-info">
                                <MapPin size={12} />
                                {location.city || location.country}
                                {isAutoDetected && !isGPSActive && (
                                    <span className="india-location-source">Based on your IP</span>
                                )}
                                {isGPSActive && (
                                    <span className="india-location-source india-location-gps">
                                        <Navigation size={10} />
                                        GPS Location
                                    </span>
                                )}
                            </span>
                        }
                    />
                    <button
                        className={`india-gps-btn ${isDetectingGPS ? 'loading' : ''} ${isGPSActive ? 'active' : ''}`}
                        onClick={handleGPSClick}
                        disabled={isDetectingGPS}
                        title="Get accurate GPS location"
                    >
                        <Navigation size={14} className={isDetectingGPS ? 'spinning' : ''} />
                        <span>{isDetectingGPS ? 'Detecting...' : 'Use GPS'}</span>
                    </button>
                </div>
                {gpsError && (
                    <div className="india-gps-error">
                        {gpsError}
                    </div>
                )}
                <div className="india-snapshot-grid">
                    <InfoCard
                        label={weather.data?.location ?? 'Weather'}
                        value={weather.data ? `${weather.data.temperature}°C` : undefined}
                        href="/weather"
                        loading={weather.loading}
                        error={weather.error}
                        onRetry={weather.refresh}
                    >
                        {weather.data && <span>{weather.data.condition}</span>}
                    </InfoCard>
                    <AQICard
                        data={aqi.data}
                        loading={aqi.loading}
                        error={aqi.error}
                        onRetry={aqi.refresh}
                    />
                </div>
            </section>

            {/* India News - Multi-source verified */}
            <section className="india-section india-news-section">
                <RefreshableHeader
                    title="India News – Verified from Multiple Sources"
                    subtitle="Latest updates from trusted sources"
                    lastUpdated={lastFetched}
                    onRefresh={forceRefreshNews}
                    loading={news.loading}
                />

                {news.loading && !news.data && <NewsSkeleton count={6} />}

                {news.error && (
                    <div className="india-news-error">
                        <Newspaper size={24} />
                        <span>Unable to load news. Please try again.</span>
                        <button onClick={forceRefreshNews}>Retry</button>
                    </div>
                )}

                {displayedArticles.length > 0 && (
                    <>
                        <div className="india-news-grid">
                            {displayedArticles.map((article: IndiaNewsArticle) => (
                                <NewsCard key={article.id} article={article} />
                            ))}
                        </div>

                        {/* Load More Button */}
                        {hasMore && (
                            <div className="india-load-more">
                                <button
                                    className="india-load-more-btn"
                                    onClick={handleLoadMore}
                                    disabled={loadingMore}
                                >
                                    {loadingMore ? (
                                        <>
                                            <RefreshCw size={16} className="spinning" />
                                            Loading...
                                        </>
                                    ) : (
                                        <>Load More News</>
                                    )}
                                </button>
                                <span className="india-load-more-count">
                                    Showing {displayedArticles.length} of {news.data?.length ?? 0}
                                </span>
                            </div>
                        )}
                    </>
                )}

                {news.data && news.data.length === 0 && (
                    <div className="india-news-empty">
                        <Newspaper size={24} />
                        <span>No news available at the moment</span>
                    </div>
                )}
            </section>
        </div>
    )
}

