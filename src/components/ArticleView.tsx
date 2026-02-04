/**
 * ArticleView Component
 * 
 * Displays AtlasIQ-synthesized articles with editorial styling.
 * Used across all pages where articles are shown.
 */

import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { SynthesizedArticle, SourceAttribution } from '../lib/articleSynthesizer'
import './ArticleView.css'

interface ArticleViewProps {
    article: SynthesizedArticle
    showFollowUp?: boolean
    onAskAtlas?: () => void
    children?: ReactNode
}

export function ArticleView({ article, showFollowUp = true, onAskAtlas, children }: ArticleViewProps) {
    return (
        <article className="article-view">
            {/* Hero Image */}
            {article.heroImage && (
                <figure className="article-hero">
                    <img
                        src={article.heroImage.url}
                        alt={article.title}
                        loading="lazy"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none'
                        }}
                    />
                    {article.heroImage.caption && (
                        <figcaption>{article.heroImage.caption}</figcaption>
                    )}
                </figure>
            )}

            {/* Header */}
            <header className="article-header">
                <h1 className="article-title">{article.title}</h1>
                <p className="article-summary">{article.summary}</p>
                <div className="article-meta">
                    <time dateTime={article.generatedAt.toISOString()}>
                        Updated {formatTimeAgo(article.generatedAt)}
                    </time>
                </div>
            </header>

            {/* Main Content */}
            <div className="article-content">
                {article.sections.map((section, i) => (
                    <section key={i} className="article-section">
                        <h2>{section.title}</h2>
                        {section.content.split('\n\n').map((para, j) => (
                            <p key={j}>{para}</p>
                        ))}
                        {/* Inline image for first section */}
                        {i === 0 && article.inlineImages[0] && (
                            <figure className="article-inline-image">
                                <img
                                    src={article.inlineImages[0].url}
                                    alt={section.title}
                                    loading="lazy"
                                />
                            </figure>
                        )}
                    </section>
                ))}

                {/* India Context */}
                {article.indiaContext && (
                    <section className="article-section article-india-context">
                        <h2>🇮🇳 Indian Perspective</h2>
                        <p>{article.indiaContext}</p>
                    </section>
                )}
            </div>

            {/* Source Attribution */}
            <footer className="article-sources">
                <h3>Compiled from</h3>
                <div className="source-list">
                    {article.sources.map((source, i) => (
                        <SourceBadge key={i} source={source} />
                    ))}
                </div>
                <p className="article-disclaimer">
                    This article was synthesized from multiple verified sources.
                    For complete information, refer to the original sources.
                </p>
            </footer>

            {/* Follow-up with Atlas */}
            {showFollowUp && (
                <div className="article-followup">
                    <p className="followup-prompt">
                        Have questions about this topic?
                        <button
                            className="followup-btn"
                            onClick={onAskAtlas}
                            aria-label="Ask Atlas about this topic"
                        >
                            Ask Atlas
                        </button>
                    </p>
                </div>
            )}

            {children}
        </article>
    )
}

function SourceBadge({ source }: { source: SourceAttribution }) {
    const typeIcons: Record<string, string> = {
        encyclopedia: '📚',
        news: '📰',
        official: '🏛️',
        data: '📊',
    }

    const content = (
        <>
            <span className="source-icon">{typeIcons[source.type] || '📄'}</span>
            <span className="source-name">{source.name}</span>
        </>
    )

    if (source.url) {
        return (
            <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`source-badge source-badge--${source.type}`}
            >
                {content}
            </a>
        )
    }

    return <span className={`source-badge source-badge--${source.type}`}>{content}</span>
}

function formatTimeAgo(date: Date): string {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
}

// ─────────────────────────────────────────────────────────────
// Article Skeleton Loader
// ─────────────────────────────────────────────────────────────

export function ArticleSkeleton() {
    return (
        <div className="article-skeleton">
            <div className="skeleton-hero" />
            <div className="skeleton-header">
                <div className="skeleton-title" />
                <div className="skeleton-summary" />
                <div className="skeleton-summary short" />
            </div>
            <div className="skeleton-content">
                <div className="skeleton-section-title" />
                <div className="skeleton-paragraph" />
                <div className="skeleton-paragraph" />
                <div className="skeleton-paragraph short" />
            </div>
            <div className="skeleton-content">
                <div className="skeleton-section-title" />
                <div className="skeleton-paragraph" />
                <div className="skeleton-paragraph short" />
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────
// Compact Article Card (for grids)
// ─────────────────────────────────────────────────────────────

interface ArticleCardProps {
    title: string
    summary: string
    imageUrl?: string
    source?: string
    time?: string
    href: string
    trending?: boolean
    size?: 'small' | 'medium' | 'large'
}

export function ArticleCard({
    title,
    summary,
    imageUrl,
    source,
    time,
    href,
    trending = false,
    size = 'medium',
}: ArticleCardProps) {
    return (
        <Link to={href} className={`article-card article-card--${size}`}>
            {imageUrl && (
                <div className="article-card-image">
                    <img src={imageUrl} alt="" loading="lazy" />
                </div>
            )}
            <div className="article-card-content">
                <h3 className="article-card-title">{title}</h3>
                <p className="article-card-summary">{summary}</p>
                <div className="article-card-meta">
                    {source && <span className="article-card-source">{source}</span>}
                    {time && <span className="article-card-time">{time}</span>}
                    {trending && <span className="article-card-trending">Trending</span>}
                </div>
            </div>
        </Link>
    )
}

// ─────────────────────────────────────────────────────────────
// Video Card (for video carousels)
// ─────────────────────────────────────────────────────────────

interface VideoCardProps {
    title: string
    thumbnail: string
    duration?: string
    source?: string
    href: string
}

export function VideoCard({ title, thumbnail, duration, source, href }: VideoCardProps) {
    return (
        <Link to={href} className="video-card">
            <div className="video-card-thumbnail">
                <img src={thumbnail} alt="" loading="lazy" />
                {duration && <span className="video-card-duration">{duration}</span>}
                <div className="video-card-play">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                </div>
            </div>
            <div className="video-card-info">
                <h4 className="video-card-title">{title}</h4>
                {source && <span className="video-card-source">{source}</span>}
            </div>
        </Link>
    )
}

