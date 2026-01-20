/**
 * AtlasIQ Home Page - Bing-style Discovery Layout
 * 
 * Features:
 * - Large hero search bar with stunning background
 * - Bottom carousel of trending stories
 * - Discovery grid: News, Weather, Sports, Markets
 * - Entertainment section (Hollywood + Bollywood)
 * - Sports section with live scores
 * - Video carousel section
 * - Lifestyle section (Travel, Food, Culture)
 * - All items link to AtlasIQ-generated articles
 */

import { useEffect, useState, useRef, useCallback, type ReactNode } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAsync, useUserContext } from '../hooks'
import {
    fetchHeadlines,
    fetchCryptoMarkets,
    fetchWeather,
    fetchAQI,
    type Headline,
    type MarketData,
} from '../lib'
import { fetchEntertainmentFeed, type EntertainmentItem } from '../lib/entertainmentNews'
import { fetchSportsFeed, fetchLiveCricketMatches, type SportsItem } from '../lib/sportsNews'
import { fetchTrendingVideos, type YouTubeVideo } from '../lib/youtubeVideos'
import { fetchLifestyleFeed, type LifestyleItem } from '../lib/lifestyleContent'
import { ExploreGrid, ExploreCard, ExploreSectionHeader, CategoryPills, ExploreCardSkeleton } from '../components/ExploreGrid'
import { VideoGrid } from '../components/VideoCard'
import { LiveScoreWidget, useLiveScoreRefresh } from '../components/LiveScoreWidget'
import { cacheNewsArticle } from '../data/news'
import {
    Search,
    Sun, Cloud, CloudRain, Snowflake,
    TrendingUp, TrendingDown, Minus,
    MapPin, ChevronLeft, ChevronRight,
    Flame, Film, Trophy, Play, Compass, Newspaper,
} from 'lucide-react'
import './Home.css'

// ─────────────────────────────────────────────────────────────
// Hero Background Images (rotating daily)
// ─────────────────────────────────────────────────────────────

const HERO_IMAGES = [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80', // Mountains
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920&q=80', // Forest
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80', // Beach
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1920&q=80', // Snow mountain
    'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1920&q=80', // Ocean
]

function getDailyHeroImage(): string {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
    return HERO_IMAGES[dayOfYear % HERO_IMAGES.length]
}

// ─────────────────────────────────────────────────────────────
// URL Slug Helper
// ─────────────────────────────────────────────────────────────

function toUrlSlug(url: string): string {
    try {
        const encoded = btoa(unescape(encodeURIComponent(url)))
        return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
    } catch {
        return url.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80)
    }
}

// ─────────────────────────────────────────────────────────────
// Section Categories
// ─────────────────────────────────────────────────────────────

const SECTIONS = [
    { id: 'all', label: 'For You', icon: <Flame size={16} /> },
    { id: 'news', label: 'News', icon: <Newspaper size={16} /> },
    { id: 'entertainment', label: 'Entertainment', icon: <Film size={16} /> },
    { id: 'sports', label: 'Sports', icon: <Trophy size={16} /> },
    { id: 'videos', label: 'Videos', icon: <Play size={16} /> },
    { id: 'lifestyle', label: 'Lifestyle', icon: <Compass size={16} /> },
]

// ─────────────────────────────────────────────────────────────
// Home Page Component
// ─────────────────────────────────────────────────────────────

export function Home() {
    const navigate = useNavigate()
    const { location } = useUserContext()
    const [searchQuery, setSearchQuery] = useState('')
    const [heroImage] = useState(getDailyHeroImage())
    const [activeSection, setActiveSection] = useState('all')

    // Handle search
    const handleSearch = useCallback((e: React.FormEvent) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
        }
    }, [searchQuery, navigate])

    // Fetch data - Core
    const headlines = useAsync(
        () => fetchHeadlines({ country: 'GLOBAL' }, { pageSize: 12 }),
        []
    )
    const markets = useAsync(fetchCryptoMarkets, [])
    const weather = useAsync(
        () => fetchWeather({ lat: location.lat, lon: location.lon, name: location.city }),
        [location.lat, location.lon]
    )
    const aqi = useAsync(
        () => fetchAQI({ lat: location.lat, lon: location.lon, name: location.city }),
        [location.lat, location.lon]
    )

    // Fetch data - Entertainment, Sports, Videos, Lifestyle
    const entertainment = useAsync(() => fetchEntertainmentFeed({ count: 8 }), [])
    const sports = useAsync(() => fetchSportsFeed({ count: 8 }), [])
    const videos = useAsync(() => fetchTrendingVideos({ count: 8 }), [])
    const lifestyle = useAsync(() => fetchLifestyleFeed({ count: 8 }), [])

    // Live scores with auto-refresh
    const liveScores = useLiveScoreRefresh(() => fetchLiveCricketMatches(), 60000)

    return (
        <div className="home-page">
            {/* Hero Section */}
            <section className="home-hero" style={{ backgroundImage: `url(${heroImage})` }}>
                <div className="home-hero-overlay" />
                <div className="home-hero-content">
                    <form className="home-search-form" onSubmit={handleSearch}>
                        <div className="home-search-box">
                            <Search className="home-search-icon" size={20} />
                            <input
                                type="text"
                                placeholder="Search any topic..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="home-search-input"
                            />
                        </div>
                    </form>
                    <p className="home-hero-tagline">
                        Discover knowledge, synthesized from trusted sources
                    </p>
                </div>

                {/* Bottom Carousel */}
                <BottomCarousel
                    items={headlines.data || []}
                    loading={headlines.loading}
                />
            </section>

            {/* Section Navigation */}
            <section className="home-sections">
                <div className="container">
                    <CategoryPills
                        categories={SECTIONS}
                        activeId={activeSection}
                        onChange={setActiveSection}
                    />
                </div>
            </section>

            {/* Discovery Grid */}
            <section className="home-discovery">
                <div className="container">
                    {/* Show all sections or filtered */}
                    {(activeSection === 'all' || activeSection === 'news') && (
                        <>
                            <div className="discovery-grid">
                                {/* Featured News */}
                                <div className="discovery-main">
                                    <FeaturedNews items={headlines.data?.slice(0, 6) || []} loading={headlines.loading} />
                                </div>

                                {/* Sidebar Widgets */}
                                <div className="discovery-sidebar">
                                    {/* Weather Widget */}
                                    <WeatherWidget
                                        data={weather.data}
                                        aqi={aqi.data}
                                        loading={weather.loading}
                                        location={location.city || location.country}
                                    />

                                    {/* Markets Widget */}
                                    <MarketsWidget
                                        data={markets.data || []}
                                        loading={markets.loading}
                                    />

                                    {/* Live Scores Widget */}
                                    <LiveScoreWidget
                                        matches={liveScores.matches}
                                        loading={liveScores.loading}
                                        onRefresh={liveScores.refresh}
                                    />
                                </div>
                            </div>

                            {/* More Stories Grid */}
                            <div className="more-stories">
                                <h2 className="section-heading">More Stories</h2>
                                <ExploreGrid>
                                    {headlines.data?.slice(6, 12).map((item, i) => {
                                        const slug = toUrlSlug(item.url)
                                        // Alternate pattern for variety
                                        const size = i === 0 ? 'large' : (i % 3 === 0 ? 'medium' : 'medium')
                                        return (
                                            <ExploreCard
                                                key={i}
                                                size={size as 'large' | 'medium'}
                                                title={item.title}
                                                subtitle={item.summary}
                                                image={item.imageUrl}
                                                tag={item.tag}
                                                href={`/entity/news-article/${slug}`}
                                                onClick={() => {
                                                    cacheNewsArticle({
                                                        slug,
                                                        url: item.url,
                                                        title: item.title,
                                                        description: item.summary,
                                                        sourceName: item.tag,
                                                        author: item.author,
                                                        publishedAt: item.publishedAt,
                                                        imageUrl: item.imageUrl,
                                                        content: item.content,
                                                        cachedAt: Date.now(),
                                                        ttlHours: 6,
                                                    })
                                                }}
                                            />
                                        )
                                    })}
                                </ExploreGrid>
                            </div>
                        </>
                    )}

                    {/* Entertainment Section */}
                    {(activeSection === 'all' || activeSection === 'entertainment') && (
                        <EntertainmentSection
                            items={entertainment.data || []}
                            loading={entertainment.loading}
                        />
                    )}

                    {/* Sports Section */}
                    {(activeSection === 'all' || activeSection === 'sports') && (
                        <SportsSection
                            items={sports.data || []}
                            loading={sports.loading}
                        />
                    )}

                    {/* Videos Section */}
                    {(activeSection === 'all' || activeSection === 'videos') && (
                        <VideosSection
                            videos={videos.data || []}
                            loading={videos.loading}
                        />
                    )}

                    {/* Lifestyle Section */}
                    {(activeSection === 'all' || activeSection === 'lifestyle') && (
                        <LifestyleSection
                            items={lifestyle.data || []}
                            loading={lifestyle.loading}
                        />
                    )}
                </div>
            </section>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────
// Bottom Carousel Component
// ─────────────────────────────────────────────────────────────

interface BottomCarouselProps {
    items: Headline[]
    loading: boolean
}

function BottomCarousel({ items, loading }: BottomCarouselProps) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(true)

    const updateScrollState = useCallback(() => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
            setCanScrollLeft(scrollLeft > 0)
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
        }
    }, [])

    useEffect(() => {
        updateScrollState()
        const el = scrollRef.current
        if (el) {
            el.addEventListener('scroll', updateScrollState)
            return () => el.removeEventListener('scroll', updateScrollState)
        }
    }, [updateScrollState, items])

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const amount = direction === 'left' ? -320 : 320
            scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' })
        }
    }

    if (loading) {
        return (
            <div className="bottom-carousel">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="carousel-skeleton" />
                ))}
            </div>
        )
    }

    return (
        <div className="bottom-carousel-wrapper">
            {canScrollLeft && (
                <button className="carousel-arrow carousel-arrow--left" onClick={() => scroll('left')}>
                    <ChevronLeft size={24} />
                </button>
            )}
            <div className="bottom-carousel" ref={scrollRef}>
                {items.slice(0, 10).map((item, i) => (
                    <CarouselCard key={i} headline={item} />
                ))}
            </div>
            {canScrollRight && (
                <button className="carousel-arrow carousel-arrow--right" onClick={() => scroll('right')}>
                    <ChevronRight size={24} />
                </button>
            )}
        </div>
    )
}

function CarouselCard({ headline }: { headline: Headline }) {
    const slug = toUrlSlug(headline.url)

    return (
        <Link
            to={`/entity/news-article/${slug}`}
            className="carousel-card"
            onClick={() => {
                cacheNewsArticle({
                    slug,
                    url: headline.url,
                    title: headline.title,
                    description: headline.summary,
                    sourceName: headline.tag,
                    author: headline.author,
                    publishedAt: headline.publishedAt,
                    imageUrl: headline.imageUrl,
                    content: headline.content,
                    cachedAt: Date.now(),
                    ttlHours: 6,
                })
            }}
        >
            {headline.imageUrl && (
                <div className="carousel-card-image">
                    <img src={headline.imageUrl} alt="" loading="lazy" />
                </div>
            )}
            <div className="carousel-card-content">
                <span className="carousel-card-source">{headline.tag}</span>
                <h3 className="carousel-card-title">{headline.title}</h3>
            </div>
        </Link>
    )
}

// ─────────────────────────────────────────────────────────────
// Featured News Grid
// ─────────────────────────────────────────────────────────────

interface FeaturedNewsProps {
    items: Headline[]
    loading: boolean
}

function FeaturedNews({ items, loading }: FeaturedNewsProps) {
    // Bing-style varied card sizes pattern for news
    const getSizeForIndex = (i: number): 'featured' | 'large' | 'medium' | 'small' => {
        if (i === 0) return 'featured'  // 2x3 hero
        if (i === 1 || i === 2) return 'medium'  // Side cards
        if (i === 3 || i === 4) return 'small'   // Compact tiles
        if (i === 5) return 'large'  // Wide card
        return 'medium'
    }

    if (loading) {
        return (
            <ExploreGrid>
                {[0, 1, 2, 3, 4, 5].map(i => (
                    <ExploreCardSkeleton key={i} size={getSizeForIndex(i)} />
                ))}
            </ExploreGrid>
        )
    }

    return (
        <ExploreGrid>
            {items.slice(0, 6).map((item, i) => {
                const slug = toUrlSlug(item.url)
                return (
                    <ExploreCard
                        key={i}
                        size={getSizeForIndex(i)}
                        title={item.title}
                        subtitle={item.summary}
                        image={item.imageUrl}
                        tag={item.tag}
                        badge={i === 0 ? 'TOP STORY' : undefined}
                        badgeColor="trending"
                        href={`/entity/news-article/${slug}`}
                        onClick={() => {
                            cacheNewsArticle({
                                slug,
                                url: item.url,
                                title: item.title,
                                description: item.summary,
                                sourceName: item.tag,
                                author: item.author,
                                publishedAt: item.publishedAt,
                                imageUrl: item.imageUrl,
                                content: item.content,
                                cachedAt: Date.now(),
                                ttlHours: 6,
                            })
                        }}
                    />
                )
            })}
        </ExploreGrid>
    )
}

// ─────────────────────────────────────────────────────────────
// Story Card
// ─────────────────────────────────────────────────────────────

interface StoryCardProps {
    headline: Headline
    compact?: boolean
    onClick?: () => void
}

function StoryCard({ headline, compact = false, onClick }: StoryCardProps) {
    const slug = toUrlSlug(headline.url)

    const handleClick = () => {
        cacheNewsArticle({
            slug,
            url: headline.url,
            title: headline.title,
            description: headline.summary,
            sourceName: headline.tag,
            author: headline.author,
            publishedAt: headline.publishedAt,
            imageUrl: headline.imageUrl,
            content: headline.content,
            cachedAt: Date.now(),
            ttlHours: 6,
        })
        onClick?.()
    }

    return (
        <Link
            to={`/entity/news-article/${slug}`}
            className={`story-card ${compact ? 'story-card--compact' : ''}`}
            onClick={handleClick}
        >
            {headline.imageUrl && (
                <div className="story-card-image">
                    <img src={headline.imageUrl} alt="" loading="lazy" />
                </div>
            )}
            <div className="story-card-content">
                <span className="story-card-source">{headline.tag}</span>
                <h3 className="story-card-title">{headline.title}</h3>
                {!compact && <p className="story-card-summary">{headline.summary}</p>}
            </div>
        </Link>
    )
}

// ─────────────────────────────────────────────────────────────
// Entertainment Section
// ─────────────────────────────────────────────────────────────

interface EntertainmentSectionProps {
    items: EntertainmentItem[]
    loading: boolean
}

function EntertainmentSection({ items, loading }: EntertainmentSectionProps) {
    // Bing-style varied card sizes pattern
    const getSizeForIndex = (i: number): 'featured' | 'large' | 'medium' | 'small' => {
        if (i === 0) return 'featured'
        if (i === 1 || i === 2) return 'medium'
        if (i === 3 || i === 4) return 'small'
        if (i === 5) return 'large'
        return 'medium'
    }

    return (
        <div className="explore-section">
            <ExploreSectionHeader
                title="Entertainment"
                subtitle="Hollywood & Bollywood"
                icon={<Film size={20} />}
            />

            {loading ? (
                <ExploreGrid>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <ExploreCardSkeleton key={i} size={getSizeForIndex(i - 1)} />
                    ))}
                </ExploreGrid>
            ) : (
                <ExploreGrid>
                    {items.slice(0, 8).map((item, i) => (
                        <ExploreCard
                            key={i}
                            size={getSizeForIndex(i)}
                            title={item.title}
                            subtitle={item.summary}
                            image={item.imageUrl}
                            tag={item.category === 'hollywood' ? '🎬 Hollywood' : '🎭 Bollywood'}
                            badge={i < 2 ? 'HOT' : undefined}
                            badgeColor="hot"
                            href={item.url}
                            onClick={() => window.open(item.url, '_blank')}
                        />
                    ))}
                </ExploreGrid>
            )}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────
// Sports Section
// ─────────────────────────────────────────────────────────────

interface SportsSectionProps {
    items: SportsItem[]
    loading: boolean
}

function SportsSection({ items, loading }: SportsSectionProps) {
    // Bing-style varied card sizes pattern
    const getSizeForIndex = (i: number): 'featured' | 'large' | 'medium' | 'small' => {
        if (i === 0) return 'featured'
        if (i === 1 || i === 2) return 'medium'
        if (i === 3 || i === 4) return 'small'
        if (i === 5) return 'large'
        return 'medium'
    }

    return (
        <div className="explore-section">
            <ExploreSectionHeader
                title="Sports"
                subtitle="Cricket, Football & More"
                icon={<Trophy size={20} />}
            />

            {loading ? (
                <ExploreGrid>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <ExploreCardSkeleton key={i} size={getSizeForIndex(i - 1)} />
                    ))}
                </ExploreGrid>
            ) : (
                <ExploreGrid>
                    {items.slice(0, 8).map((item, i) => (
                        <ExploreCard
                            key={i}
                            size={getSizeForIndex(i)}
                            title={item.title}
                            subtitle={item.summary}
                            image={item.imageUrl}
                            tag={item.sport === 'cricket' ? '🏏 Cricket' : '⚽ Sports'}
                            badge={item.isLive ? 'LIVE' : undefined}
                            badgeColor="live"
                            href={item.url}
                            onClick={() => window.open(item.url, '_blank')}
                        />
                    ))}
                </ExploreGrid>
            )}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────
// Videos Section
// ─────────────────────────────────────────────────────────────

interface VideosSectionProps {
    videos: YouTubeVideo[]
    loading: boolean
}

function VideosSection({ videos, loading }: VideosSectionProps) {
    return (
        <div className="explore-section">
            <ExploreSectionHeader
                title="Trending Videos"
                subtitle="Educational & News Content"
                icon={<Play size={20} />}
            />

            <VideoGrid videos={videos} loading={loading} />
        </div>
    )
}

// ─────────────────────────────────────────────────────────────
// Lifestyle Section
// ─────────────────────────────────────────────────────────────

interface LifestyleSectionProps {
    items: LifestyleItem[]
    loading: boolean
}

function LifestyleSection({ items, loading }: LifestyleSectionProps) {
    const getCategoryEmoji = (cat: string) => {
        switch (cat) {
            case 'travel': return '✈️ Travel'
            case 'food': return '🍽️ Food'
            case 'culture': return '🎨 Culture'
            default: return '🌟 Lifestyle'
        }
    }

    // Bing-style varied card sizes pattern
    const getSizeForIndex = (i: number): 'featured' | 'large' | 'medium' | 'small' => {
        if (i === 0) return 'featured'
        if (i === 1 || i === 2) return 'medium'
        if (i === 3 || i === 4) return 'small'
        if (i === 5) return 'large'
        return 'medium'
    }

    return (
        <div className="explore-section">
            <ExploreSectionHeader
                title="Lifestyle"
                subtitle="Travel, Food & Culture"
                icon={<Compass size={20} />}
            />

            {loading ? (
                <ExploreGrid>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <ExploreCardSkeleton key={i} size={getSizeForIndex(i - 1)} />
                    ))}
                </ExploreGrid>
            ) : (
                <ExploreGrid>
                    {items.slice(0, 8).map((item, i) => (
                        <ExploreCard
                            key={i}
                            size={getSizeForIndex(i)}
                            title={item.title}
                            subtitle={item.summary}
                            image={item.imageUrl}
                            tag={getCategoryEmoji(item.category)}
                            href={item.url}
                            onClick={() => window.open(item.url, '_blank')}
                        />
                    ))}
                </ExploreGrid>
            )}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────
// Weather Widget
// ─────────────────────────────────────────────────────────────

interface WeatherWidgetProps {
    data: { temperature: number; condition: string; weatherCode: number } | null | undefined
    aqi: { aqi: number; category: string } | null | undefined
    loading: boolean
    location: string
}

function WeatherWidget({ data, aqi, loading, location }: WeatherWidgetProps) {
    if (loading) {
        return (
            <div className="widget widget--weather">
                <div className="widget-skeleton" />
            </div>
        )
    }

    if (!data) return null

    const getWeatherIcon = (code: number): ReactNode => {
        if (code === 0) return <Sun size={48} />
        if (code <= 3) return <Cloud size={48} />
        if (code <= 69) return <CloudRain size={48} />
        return <Snowflake size={48} />
    }

    return (
        <Link to="/weather" className="widget widget--weather">
            <div className="weather-main">
                <div className="weather-icon">{getWeatherIcon(data.weatherCode)}</div>
                <div className="weather-temp">{data.temperature}°</div>
            </div>
            <div className="weather-info">
                <div className="weather-location">
                    <MapPin size={14} />
                    <span>{location}</span>
                </div>
                <div className="weather-condition">{data.condition}</div>
                {aqi && (
                    <div className={`weather-aqi weather-aqi--${aqi.category}`}>
                        AQI {aqi.aqi}
                    </div>
                )}
            </div>
        </Link>
    )
}

// ─────────────────────────────────────────────────────────────
// Markets Widget
// ─────────────────────────────────────────────────────────────

interface MarketsWidgetProps {
    data: MarketData[]
    loading: boolean
}

function MarketsWidget({ data, loading }: MarketsWidgetProps) {
    if (loading) {
        return (
            <div className="widget widget--markets">
                <div className="widget-skeleton" />
            </div>
        )
    }

    return (
        <Link to="/markets" className="widget widget--markets">
            <h3 className="widget-title">Markets</h3>
            <div className="market-list">
                {data.slice(0, 4).map((market, i) => (
                    <div key={i} className="market-row">
                        <span className="market-name">{market.name}</span>
                        <span className="market-price">{market.price}</span>
                        <span className={`market-change market-change--${market.trend}`}>
                            {market.trend === 'positive' && <TrendingUp size={12} />}
                            {market.trend === 'negative' && <TrendingDown size={12} />}
                            {market.trend === 'neutral' && <Minus size={12} />}
                            {market.change}
                        </span>
                    </div>
                ))}
            </div>
        </Link>
    )
}

export default Home
