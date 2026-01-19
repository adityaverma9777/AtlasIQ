import { useEffect, useMemo, useState } from 'react'
import { SectionHeader, InfoCard, ListItem, MarketRow, AlertItem, AQICard, NewsFilters } from '../components/dashboard'
import { Loader, InlineLoader } from '../components/Loader'
import { useAsync, useUserContext } from '../hooks'
import {
    fetchHeadlines,
    fetchCryptoMarkets,
    fetchWeather,
    fetchClimateAlerts,
    fetchAQI,
    getEntityPath,
    type Headline,
    type MarketData,
    type NewsCountryCode,
} from '../lib'
import { cityToSlug } from '../data'
import { cacheNewsArticle } from '../data/news'
import './Home.css'

const fallbackHeadlines: Headline[] = [
    {
        title: 'Unable to load headlines',
        summary: 'Check your connection or API configuration.',
        tag: 'Error',
        url: 'about:blank',
    },
]

const fallbackMarkets: MarketData[] = [
    { name: 'Bitcoin', price: '—', change: '—', trend: 'neutral' },
    { name: 'Ethereum', price: '—', change: '—', trend: 'neutral' },
]

function getMarketSlug(name: string): string {
    return name.toLowerCase()
}

function toUrlSlug(url: string): string {
    try {
        const encoded = btoa(unescape(encodeURIComponent(url)))
        return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
    } catch {
        return url.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80)
    }
}

const NEWS_FILTERS_KEY = 'atlasiq_news_filters'

export function Home() {
    const { location } = useUserContext()

    const defaultCountry = useMemo<NewsCountryCode>(() => {
        const code = (location.countryCode || '').toUpperCase() as NewsCountryCode
        return code === 'IN' ? 'IN' : 'GLOBAL'
    }, [location.countryCode])

    const [newsFilters, setNewsFilters] = useState<{ country: NewsCountryCode }>({
        country: defaultCountry,
    })

    useEffect(() => {
        try {
            const raw = sessionStorage.getItem(NEWS_FILTERS_KEY)
            if (raw) {
                const parsed = JSON.parse(raw) as { country?: NewsCountryCode }
                setNewsFilters({
                    country: parsed.country || defaultCountry,
                })
                return
            }
        } catch {
            // ignore
        }
        setNewsFilters((s) => ({ ...s, country: s.country || defaultCountry }))
    }, [defaultCountry])

    useEffect(() => {
        try {
            sessionStorage.setItem(NEWS_FILTERS_KEY, JSON.stringify(newsFilters))
        } catch {
            // ignore
        }
    }, [newsFilters])

    const [headlinePage, setHeadlinePage] = useState(1)
    const [headlineItems, setHeadlineItems] = useState<Headline[]>([])
    const [headlineLoading, setHeadlineLoading] = useState(true)
    const [headlineError, setHeadlineError] = useState<string | null>(null)
    const [headlineUpdatedAt, setHeadlineUpdatedAt] = useState<Date | null>(null)
    const [headlineRefresh, setHeadlineRefresh] = useState(0)

    // reset pagination when country changes
    useEffect(() => {
        setHeadlinePage(1)
        setHeadlineItems([])
    }, [newsFilters.country])

    useEffect(() => {
        let cancelled = false
        const bypassCache = headlineRefresh > 0 && headlinePage === 1

        setHeadlineLoading(true)
        setHeadlineError(null)

        fetchHeadlines(newsFilters, { page: headlinePage, pageSize: 6, bypassCache })
            .then((items) => {
                if (cancelled) return
                setHeadlineItems((prev) => (headlinePage === 1 ? items : [...prev, ...items]))
                setHeadlineLoading(false)
                setHeadlineUpdatedAt(new Date())
            })
            .catch((err) => {
                if (cancelled) return
                setHeadlineError(err?.message || 'Unable to fetch')
                setHeadlineLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [newsFilters.country, headlinePage, headlineRefresh])

    const refreshHeadlines = () => {
        setHeadlinePage(1)
        setHeadlineItems([])
        setHeadlineRefresh((c) => c + 1)
    }

    const markets = useAsync(fetchCryptoMarkets, [])
    const weather = useAsync(
        () => fetchWeather({ lat: location.lat, lon: location.lon, name: location.city }),
        [location.lat, location.lon]
    )
    const aqi = useAsync(
        () => fetchAQI({ lat: location.lat, lon: location.lon, name: location.city }),
        [location.lat, location.lon]
    )
    const alerts = useAsync(
        () => fetchClimateAlerts({ lat: location.lat, lon: location.lon }),
        [location.lat, location.lon]
    )

    const displayHeadlines = headlineItems.length > 0 ? headlineItems : (headlineLoading ? [] : fallbackHeadlines)
    const displayMarkets = markets.data ?? (markets.loading ? [] : fallbackMarkets)

    const headlineCount = headlineItems.length
    const marketStatus = markets.data
        ? markets.data.some((m) => m.trend === 'positive')
            ? 'Mostly up'
            : 'Mixed'
        : '—'

    return (
        <div className="container dashboard">
            {/* World Snapshot */}
            <section className="dashboard-section">
                <SectionHeader title="World Snapshot" subtitle="Real-time global overview" />
                <div className="snapshot-grid">
                    <InfoCard label="Headlines" value={headlineCount > 0 ? `${headlineCount} stories` : '—'}>
                        {headlineLoading && <InlineLoader />}
                        {headlineError && <span>Unable to fetch</span>}
                        {headlineItems.length > 0 && <span>Top stories from global sources</span>}
                    </InfoCard>
                    <InfoCard label="Markets" value={marketStatus}>
                        {markets.loading && <InlineLoader />}
                        {markets.error && <span>Unable to fetch</span>}
                        {markets.data && <span>Crypto markets update</span>}
                    </InfoCard>
                    <InfoCard
                        label={weather.data?.location ?? 'Weather'}
                        value={weather.data ? `${weather.data.temperature}°C` : '—'}
                        href={getEntityPath('weather', cityToSlug(location.city || 'weather'))}
                    >
                        {weather.loading && <InlineLoader />}
                        {weather.error && <span>Unable to fetch</span>}
                        {weather.data && <span>{weather.data.condition}</span>}
                    </InfoCard>
                    <AQICard data={aqi.data} loading={aqi.loading} error={aqi.error} />
                </div>
            </section>

            {/* Headlines + Markets columns */}
            <div className="dashboard-columns">
                <section className="dashboard-section">
                    <SectionHeader
                        title="Global Headlines"
                        updatedAt={headlineUpdatedAt}
                        onRefresh={refreshHeadlines}
                        loading={headlineLoading}
                    />
                    <NewsFilters value={newsFilters} onChange={setNewsFilters} />
                    <div>
                        {headlineLoading && <Loader size="sm" text="Loading headlines..." />}
                        {displayHeadlines.map((item, i) => (
                            <ListItem
                                key={i}
                                title={item.title}
                                summary={item.summary}
                                tag={item.tag}
                                href={getEntityPath('news-article', toUrlSlug(item.url))}
                                onClick={() => {
                                    const slug = toUrlSlug(item.url)
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
                        ))}

                        {!headlineLoading && headlineItems.length > 0 && (
                            <button
                                className="news-load-more"
                                onClick={() => setHeadlinePage((p) => p + 1)}
                            >
                                Load more
                            </button>
                        )}
                    </div>
                </section>

                <section className="dashboard-section">
                    <SectionHeader
                        title="Markets Overview"
                        updatedAt={markets.updatedAt}
                        onRefresh={markets.refresh}
                        loading={markets.loading}
                    />
                    <div>
                        {markets.loading && <Loader size="sm" text="Loading markets..." />}
                        {displayMarkets.map((item, i) => (
                            <MarketRow
                                key={i}
                                name={item.name}
                                price={item.price}
                                change={item.change}
                                trend={item.trend}
                                href={getEntityPath('market', getMarketSlug(item.name))}
                            />
                        ))}
                        {/* Commodities - placeholder prices */}
                        <MarketRow name="Gold" price="$2,350" change="+0.4%" trend="positive" href={getEntityPath('market', 'gold')} />
                        <MarketRow name="Silver" price="$28.50" change="-0.2%" trend="negative" href={getEntityPath('market', 'silver')} />
                        <MarketRow name="Crude Oil" price="$78.25" change="+1.2%" trend="positive" href={getEntityPath('market', 'crude-oil')} />
                    </div>
                </section>
            </div>

            {/* Climate Alerts */}
            <section className="dashboard-section">
                <SectionHeader
                    title="Climate Alerts"
                    updatedAt={alerts.updatedAt}
                    onRefresh={alerts.refresh}
                    loading={alerts.loading}
                />
                <div>
                    {alerts.loading && <Loader size="sm" text="Checking alerts..." />}
                    {alerts.error && <p className="no-alerts">Unable to check alerts</p>}
                    {alerts.data && alerts.data.length === 0 && (
                        <p className="no-alerts">No active alerts</p>
                    )}
                    {alerts.data?.map((alert, i) => (
                        <AlertItem key={i} title={alert.title} severity={alert.severity} />
                    ))}
                </div>
            </section>
        </div>
    )
}
