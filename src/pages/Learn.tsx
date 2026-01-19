import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { SectionHeader, InfoCard } from '../components/dashboard'
import { Loader } from '../components/Loader'
import { getFeaturedTopics, getKnowledgeArticle, getEntityPath, type KnowledgeEntity } from '../lib'
import './Learn.css'

const utilities = [
    { label: 'Dictionary', value: 'Look up', desc: 'Word definitions and meanings' },
    { label: 'Translation', value: 'Translate', desc: 'Multi-language text translation' },
    { label: 'Converter', value: 'Convert', desc: 'Units, currency, time zones' },
]

function getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
        'history-event': 'History',
        'science-concept': 'Science',
        'geography-place': 'Geography',
        'general-topic': 'Topic',
    }
    return labels[type] || 'Topic'
}

export function Learn() {
    const [featuredArticles, setFeaturedArticles] = useState<KnowledgeEntity[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let cancelled = false
        setLoading(true)

        const topics = getFeaturedTopics()
        Promise.all(topics.map((t) => getKnowledgeArticle(t)))
            .then((articles) => {
                if (!cancelled) {
                    setFeaturedArticles(articles.filter(Boolean) as KnowledgeEntity[])
                    setLoading(false)
                }
            })
            .catch(() => {
                if (!cancelled) setLoading(false)
            })

        return () => { cancelled = true }
    }, [])

    return (
        <div className="container learn-page">
            <header className="learn-header">
                <h1>Learn & Discover</h1>
                <p>Knowledge utilities and daily insights</p>
            </header>

            {/* Utilities */}
            <section className="learn-section">
                <SectionHeader title="Knowledge Utilities" subtitle="Quick tools for learning" />
                <div className="utilities-grid">
                    {utilities.map((item, i) => (
                        <InfoCard key={i} label={item.label} value={item.value}>
                            <span>{item.desc}</span>
                        </InfoCard>
                    ))}
                </div>
            </section>

            {/* Today in Knowledge */}
            <section className="learn-section">
                <SectionHeader title="Today in Knowledge" subtitle="Daily encyclopedia articles" />
                <div className="knowledge-grid">
                    {loading && <Loader size="sm" text="Loading articles..." />}
                    {!loading && featuredArticles.length === 0 && (
                        <p className="no-articles">No articles available</p>
                    )}
                    {featuredArticles.map((article) => (
                        <Link
                            key={article.slug}
                            to={getEntityPath('learn', article.slug)}
                            className="knowledge-preview-card"
                        >
                            {article.heroImage && (
                                <img
                                    src={article.heroImage.url}
                                    alt={article.title}
                                    className="knowledge-preview-image"
                                />
                            )}
                            <div className="knowledge-preview-content">
                                <span className="knowledge-preview-type">{getTypeLabel(article.type)}</span>
                                <h3>{article.title}</h3>
                                <p>{article.overview}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Featured article */}
            {featuredArticles[0] && (
                <section className="learn-section">
                    <SectionHeader title="Featured Article" subtitle="Deep dive" />
                    <div className="featured-article-card">
                        {featuredArticles[0].heroImage && (
                            <img
                                src={featuredArticles[0].heroImage.url}
                                alt={featuredArticles[0].title}
                                className="featured-image"
                            />
                        )}
                        <div className="featured-content">
                            <h3>{featuredArticles[0].title}</h3>
                            <p className="featured-overview">{featuredArticles[0].overview}</p>
                            {featuredArticles[0].sections[0] && (
                                <p className="featured-excerpt">
                                    {featuredArticles[0].sections[0].content.slice(0, 300)}...
                                </p>
                            )}
                            <Link
                                to={getEntityPath('learn', featuredArticles[0].slug)}
                                className="featured-link"
                            >
                                Read full article →
                            </Link>
                        </div>
                    </div>
                </section>
            )}
        </div>
    )
}
