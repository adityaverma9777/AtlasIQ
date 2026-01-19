import { useParams, Link } from 'react-router-dom'
import { useAsync } from '../hooks'
import { getEntity, getEntityPath, getCachedEntity, type EntityType, type KnowledgeEntity } from '../lib'
import { SectionHeader } from '../components/dashboard'
import './EntityDetail.css'

interface LearnEntityData {
    _learn?: KnowledgeEntity
}

interface NewsEntityData {
    _news?: {
        url: string
        sourceName: string
        author?: string
        publishedAt?: string
        imageUrl?: string
        fullText?: string
        content?: string
        topics?: string[]
        images?: string[]
    }
}

// split long paragraphs
function formatContent(text: string): string[] {
    if (!text) return []

    const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0)
    const seen = new Set<string>()
    const result: string[] = []

    for (const p of paragraphs) {
        const trimmed = p.trim()
        if (!trimmed) continue

        const normalized = trimmed.toLowerCase().slice(0, 150)
        if (seen.has(normalized)) continue
        seen.add(normalized)

        if (trimmed.length > 500) {
            const sentences = trimmed.match(/[^.!?]+[.!?]+/g) || [trimmed]
            let chunk = ''
            for (const s of sentences) {
                if (chunk.length + s.length > 400 && chunk) {
                    result.push(chunk.trim())
                    chunk = s
                } else {
                    chunk += s
                }
            }
            if (chunk) result.push(chunk.trim())
        } else {
            result.push(trimmed)
        }
    }

    return result
}

function cleanInlineText(text: string): string {
    return text
        .replace(/&nbsp;|\u00A0/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim()
}

export function EntityDetail() {
    const { type, slug } = useParams<{ type: EntityType; slug: string }>()

    const cachedData = getCachedEntity(type as EntityType, slug || '')

    const entity = useAsync(
        () => getEntity(type as EntityType, slug || ''),
        [type, slug]
    )

    const data = entity.data || cachedData
    const learnData = (data as LearnEntityData)?._learn
    const newsData = (data as NewsEntityData)?._news

    if (!data && entity.loading) {
        return (
            <div className="container entity-page">
                <p className="loading-message">Loading article...</p>
            </div>
        )
    }

    if (!data) {
        return (
            <div className="container entity-page">
                <div className="entity-not-found">
                    <h1>Entity Not Found</h1>
                    <p>The requested {type} could not be found.</p>
                    <Link to="/" className="back-link">Back to Dashboard</Link>
                </div>
            </div>
        )
    }

    if (type === 'news-article' && newsData) {
        const published = newsData.publishedAt ? new Date(newsData.publishedAt) : null
        const titleClean = cleanInlineText(data.title)
        const summaryText = newsData.fullText || data.context || data.summary || ''
        const hasSummary = summaryText.length > 30

        // format summary into paragraphs
        const paragraphs = hasSummary ? formatContent(summaryText) : []

        return (
            <div className="container entity-page learn-article news-article">
                {/* hero image or placeholder */}
                {newsData.imageUrl ? (
                    <figure className="article-hero">
                        <img
                            src={newsData.imageUrl}
                            alt={titleClean}
                            loading="lazy"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none'
                            }}
                        />
                    </figure>
                ) : (
                    <div className="news-placeholder-hero">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M2 12h20" />
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                        </svg>
                    </div>
                )}

                <header className="entity-header">
                    <span className="entity-type">News</span>
                    <h1>{titleClean}</h1>
                    <div className="news-meta">
                        <span className="news-source-label">{newsData.sourceName}</span>
                        {newsData.author && <span className="news-meta-item">• {newsData.author}</span>}
                        {published && (
                            <span className="news-meta-item">
                                • {published.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                {' '}{published.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        )}
                    </div>
                </header>

                <section className="entity-section">
                    <SectionHeader
                        title="Article Summary"
                        updatedAt={data.updatedAt}
                        onRefresh={entity.refresh}
                        loading={entity.loading}
                    />
                    <div className="article-content">
                        {paragraphs.length > 0 ? (
                            paragraphs.map((p, i) => (
                                <p key={i}>{cleanInlineText(p)}</p>
                            ))
                        ) : (
                            <p className="news-summary-fallback">
                                {data.summary || 'Summary not available for this article.'}
                            </p>
                        )}
                    </div>

                    {/* attribution and external link */}
                    <div className="news-attribution">
                        <div className="news-disclaimer">
                            <span>Source: {newsData.sourceName}</span>
                            <span className="disclaimer-text">Full article available on source website.</span>
                        </div>
                        <a
                            href={newsData.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="news-external"
                        >
                            Read original article →
                        </a>
                    </div>
                </section>

                {newsData.topics && newsData.topics.length > 0 && (
                    <section className="entity-section">
                        <h2 className="section-title">Related Topics</h2>
                        <div className="related-grid">
                            {newsData.topics.slice(0, 6).map((t) => (
                                <Link key={t} to={getEntityPath('learn', t)} className="related-link">
                                    {t.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        )
    }


    // knowledge article layout
    if (type === 'learn' && learnData) {
        const seenTitles = new Set<string>()

        return (
            <div className="container entity-page learn-article">
                {/* Hero */}
                {learnData.heroImage && (
                    <figure className="article-hero">
                        <img
                            src={learnData.heroImage.url}
                            alt={data.title}
                            loading="lazy"
                        />
                    </figure>
                )}

                <header className="entity-header">
                    <span className="entity-type">{learnData.type.replace('-', ' ')}</span>
                    <h1>{data.title}</h1>
                    <p className="entity-summary">{learnData.overview}</p>
                </header>

                {/* Section nav */}
                {learnData.sections.length > 1 && (
                    <nav className="article-nav">
                        {learnData.sections.map((sec, i) => {
                            if (seenTitles.has(sec.title.toLowerCase())) return null
                            seenTitles.add(sec.title.toLowerCase())
                            return (
                                <a key={i} href={`#section-${i}`} className="nav-link">
                                    {sec.title}
                                </a>
                            )
                        })}
                    </nav>
                )}

                {/* Key Facts */}
                {learnData.keyFacts.length > 0 && (
                    <section className="entity-section">
                        <SectionHeader
                            title="Key Facts"
                            updatedAt={data.updatedAt}
                            onRefresh={entity.refresh}
                            loading={entity.loading}
                        />
                        <div className="facts-grid">
                            {learnData.keyFacts.slice(0, 8).map((fact, i) => (
                                <div key={i} className="fact-card">
                                    <span className="fact-label">{fact.label}</span>
                                    <span className="fact-value">{fact.value}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Sections - deduplicated */}
                {(() => {
                    const rendered = new Set<string>()
                    return learnData.sections.map((section, i) => {
                        const titleKey = section.title.toLowerCase()
                        if (rendered.has(titleKey)) return null
                        rendered.add(titleKey)

                        const paragraphs = formatContent(section.content)
                        const sectionImage = learnData.images[Math.min(i, learnData.images.length - 1)]

                        return (
                            <section key={i} id={`section-${i}`} className="entity-section article-section">
                                <h2 className="section-title">{section.title}</h2>
                                <div className="article-content">
                                    {paragraphs.map((p, j) => (
                                        <p key={j}>{p}</p>
                                    ))}
                                </div>
                                {i === 0 && sectionImage && (
                                    <figure className="inline-image">
                                        <img
                                            src={sectionImage.url}
                                            alt={section.title}
                                            loading="lazy"
                                        />
                                    </figure>
                                )}
                            </section>
                        )
                    })
                })()}

                {/* Timeline */}
                {learnData.timeline && learnData.timeline.length > 0 && (
                    <section className="entity-section">
                        <h2 className="section-title">Timeline</h2>
                        <div className="timeline-list">
                            {learnData.timeline.slice(0, 8).map((item, i) => (
                                <div key={i} className="timeline-item">
                                    <span className="timeline-date">{item.date}</span>
                                    <span className="timeline-event">{item.event}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Significance */}
                {learnData.significance && (
                    <section className="entity-section">
                        <h2 className="section-title">Significance</h2>
                        <div className="significance-box">{learnData.significance}</div>
                    </section>
                )}

                {/* Related */}
                {learnData.relatedTopics.length > 0 && (
                    <section className="entity-section">
                        <h2 className="section-title">Related Topics</h2>
                        <div className="related-grid">
                            {learnData.relatedTopics.slice(0, 6).map((topic: string, i: number) => (
                                <Link key={i} to={getEntityPath('learn', topic)} className="related-link">
                                    {topic.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* Sources */}
                <footer className="article-footer">
                    <div className="sources-list">
                        {learnData.sources.map((source, i) => (
                            <span key={i} className="source-item">
                                {source.url ? (
                                    <a href={source.url} target="_blank" rel="noopener noreferrer">
                                        {source.name}
                                    </a>
                                ) : source.name}
                            </span>
                        ))}
                    </div>
                    <span className="last-updated">
                        Updated {data.updatedAt.toLocaleDateString()}
                    </span>
                </footer>
            </div>
        )
    }

    // default entity layout
    return (
        <div className="container entity-page">
            <header className="entity-header">
                <span className="entity-type">{data.type}</span>
                <h1>{data.title}</h1>
                <p className="entity-summary">{data.summary}</p>
            </header>

            <section className="entity-section">
                <SectionHeader
                    title="Key Facts"
                    updatedAt={data.updatedAt}
                    onRefresh={entity.refresh}
                    loading={entity.loading}
                />
                <div className="facts-grid">
                    {data.facts.map((fact, i) => (
                        <div key={i} className="fact-card">
                            <span className="fact-label">{fact.label}</span>
                            <span className="fact-value">{fact.value}</span>
                        </div>
                    ))}
                </div>
            </section>

            <section className="entity-section">
                <SectionHeader title="Background" />
                <div className="entity-context">{data.context}</div>
            </section>

            {data.relevance && (
                <section className="entity-section">
                    <SectionHeader title="Relevance" />
                    <div className="significance-box">{data.relevance}</div>
                </section>
            )}

            {data.updates.length > 0 && (
                <section className="entity-section">
                    <SectionHeader title="Updates" />
                    <div className="updates-list">
                        {data.updates.map((u, i) => (
                            <div key={i} className="update-item">
                                <span className="update-title">{u.title}</span>
                                <span className="update-time">{u.timestamp}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {data.related.length > 0 && (
                <section className="entity-section">
                    <SectionHeader title="Related" />
                    <div className="related-grid">
                        {data.related.map((item, i) => (
                            <Link key={i} to={getEntityPath(item.type, item.slug)} className="related-link">
                                {item.title}
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {data.sources?.length > 0 && (
                <footer className="article-footer">
                    <div className="sources-list">
                        {data.sources.map((s, i) => (
                            <span key={i} className="source-item">
                                {s.url ? <a href={s.url} target="_blank" rel="noopener noreferrer">{s.name}</a> : s.name}
                            </span>
                        ))}
                    </div>
                </footer>
            )}
        </div>
    )
}
