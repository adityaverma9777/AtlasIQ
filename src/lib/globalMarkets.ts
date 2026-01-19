// multi-source market data layer

export type DataSource = 'alpha-vantage' | 'none'

export interface MarketIndex {
    symbol: string
    name: string
    slug: string
    avSymbol?: string           // Alpha Vantage symbol (if supported)
    isIndex?: boolean           // true = index (not supported by AV)
    primarySource: DataSource
    fallbackSource?: DataSource // for future use
}

export interface MarketCountry {
    code: string
    name: string
    currency: string
    currencySymbol: string
    indices: MarketIndex[]
}

export interface MarketIndexData {
    symbol: string
    name: string
    slug: string
    price: number
    change: number
    changePercent: number
    trend: 'positive' | 'negative' | 'neutral'
    currency: string
    currencySymbol: string
    lastUpdated: Date
    dataAvailable: boolean
    source: DataSource
    unavailableReason?: string
}

// India: equities work, indices don't
// US: ETFs as proxies for indices
export const MARKET_COUNTRIES: MarketCountry[] = [
    {
        code: 'IN',
        name: 'India',
        currency: 'INR',
        currencySymbol: '₹',
        indices: [
            // equities that work
            { symbol: 'RELIANCE.BSE', name: 'Reliance Industries', slug: 'reliance', avSymbol: 'RELIANCE.BSE', primarySource: 'alpha-vantage' },
            { symbol: 'TCS.BSE', name: 'TCS', slug: 'tcs', avSymbol: 'TCS.BSE', primarySource: 'alpha-vantage' },
            { symbol: 'INFY.BSE', name: 'Infosys', slug: 'infosys', avSymbol: 'INFY.BSE', primarySource: 'alpha-vantage' },
            { symbol: 'HDFCBANK.BSE', name: 'HDFC Bank', slug: 'hdfc-bank', avSymbol: 'HDFCBANK.BSE', primarySource: 'alpha-vantage' },
            // indices - NOT supported by Alpha Vantage
            { symbol: 'SENSEX', name: 'BSE Sensex', slug: 'bse-sensex', isIndex: true, primarySource: 'none' },
            { symbol: 'NIFTY50', name: 'Nifty 50', slug: 'nifty-50', isIndex: true, primarySource: 'none' },
        ],
    },
    {
        code: 'US',
        name: 'United States',
        currency: 'USD',
        currencySymbol: '$',
        indices: [
            { symbol: 'SPY', name: 'S&P 500 (SPY)', slug: 'sp-500', avSymbol: 'SPY', primarySource: 'alpha-vantage' },
            { symbol: 'DIA', name: 'Dow Jones (DIA)', slug: 'dow-jones', avSymbol: 'DIA', primarySource: 'alpha-vantage' },
            { symbol: 'QQQ', name: 'NASDAQ (QQQ)', slug: 'nasdaq', avSymbol: 'QQQ', primarySource: 'alpha-vantage' },
            { symbol: 'AAPL', name: 'Apple', slug: 'apple', avSymbol: 'AAPL', primarySource: 'alpha-vantage' },
            { symbol: 'MSFT', name: 'Microsoft', slug: 'microsoft', avSymbol: 'MSFT', primarySource: 'alpha-vantage' },
        ],
    },
    {
        code: 'GB',
        name: 'United Kingdom',
        currency: 'GBP',
        currencySymbol: '£',
        indices: [
            { symbol: 'ISF.LON', name: 'FTSE 100 ETF', slug: 'ftse-100', avSymbol: 'ISF.LON', primarySource: 'alpha-vantage' },
            { symbol: 'BP.LON', name: 'BP', slug: 'bp', avSymbol: 'BP.LON', primarySource: 'alpha-vantage' },
        ],
    },
    {
        code: 'JP',
        name: 'Japan',
        currency: 'JPY',
        currencySymbol: '¥',
        indices: [
            { symbol: 'EWJ', name: 'iShares Japan (EWJ)', slug: 'nikkei-225', avSymbol: 'EWJ', primarySource: 'alpha-vantage' },
        ],
    },
    {
        code: 'DE',
        name: 'Germany',
        currency: 'EUR',
        currencySymbol: '€',
        indices: [
            { symbol: 'EWG', name: 'iShares Germany (EWG)', slug: 'dax', avSymbol: 'EWG', primarySource: 'alpha-vantage' },
        ],
    },
]

export function getMarketCountry(code: string): MarketCountry | undefined {
    return MARKET_COUNTRIES.find((c) => c.code === code.toUpperCase())
}

// cache with 15-min TTL
interface CacheEntry {
    data: MarketIndexData[]
    fetchedAt: number
}

const marketCache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 15 * 60 * 1000

let lastRateLimitHit = 0
const RATE_LIMIT_COOLDOWN_MS = 60 * 1000

// dev logging
const isDev = import.meta.env.DEV

function logDev(msg: string, data?: unknown) {
    if (isDev) {
        console.log(`[Markets] ${msg}`, data ?? '')
    }
}

interface AVGlobalQuote {
    '01. symbol': string
    '05. price': string
    '09. change': string
    '10. change percent': string
}

interface AVQuoteResponse {
    'Global Quote'?: AVGlobalQuote
    Note?: string
    Information?: string
}

function getApiKey(): string {
    return import.meta.env.VITE_ALPHA_VANTAGE_API_KEY || ''
}

async function fetchAVQuote(symbol: string): Promise<AVQuoteResponse | null> {
    const apiKey = getApiKey()
    if (!apiKey) {
        logDev('No API key configured')
        return null
    }

    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`
    logDev(`Fetching: ${symbol}`)

    try {
        const res = await fetch(url)
        if (!res.ok) {
            logDev(`HTTP error for ${symbol}`, res.status)
            return null
        }
        const data = await res.json()
        logDev(`Response for ${symbol}`, data)
        return data
    } catch (err) {
        logDev(`Fetch error for ${symbol}`, err)
        return null
    }
}

function isRateLimited(): boolean {
    return Date.now() - lastRateLimitHit < RATE_LIMIT_COOLDOWN_MS
}

export async function fetchMarketIndices(
    countryCode: string,
    bypassCache = false
): Promise<MarketIndexData[]> {
    const country = getMarketCountry(countryCode)
    if (!country) return []

    const cacheKey = countryCode.toUpperCase()
    const cached = marketCache.get(cacheKey)

    if (cached && !bypassCache) {
        const age = Date.now() - cached.fetchedAt
        if (age < CACHE_TTL_MS) {
            logDev(`Cache hit for ${countryCode}`)
            return cached.data
        }
    }

    if (isRateLimited() && cached) {
        logDev('Rate limited, returning cache')
        return cached.data
    }

    const apiKey = getApiKey()
    const results: MarketIndexData[] = []
    const now = new Date()

    for (const idx of country.indices) {
        // index not supported by any source
        if (idx.isIndex || idx.primarySource === 'none') {
            results.push({
                symbol: idx.symbol,
                name: idx.name,
                slug: idx.slug,
                price: 0,
                change: 0,
                changePercent: 0,
                trend: 'neutral',
                currency: country.currency,
                currencySymbol: country.currencySymbol,
                lastUpdated: now,
                dataAvailable: false,
                source: 'none',
                unavailableReason: 'Index data not available from current provider',
            })
            continue
        }

        // no API key
        if (!apiKey) {
            results.push(createUnavailable(idx, country, 'API key not configured', 'alpha-vantage'))
            continue
        }

        const avSymbol = idx.avSymbol || idx.symbol

        try {
            const response = await fetchAVQuote(avSymbol)

            // rate limit check
            if (response?.Note || response?.Information) {
                logDev('Rate limit hit', response.Note || response.Information)
                lastRateLimitHit = Date.now()
                results.push(createUnavailable(idx, country, 'Rate limit reached', 'alpha-vantage'))
                continue
            }

            const quote = response?.['Global Quote']
            if (quote && quote['05. price']) {
                const price = parseFloat(quote['05. price']) || 0
                const change = parseFloat(quote['09. change']) || 0
                const changeStr = quote['10. change percent'] || '0%'
                const changePercent = parseFloat(changeStr.replace('%', '')) || 0
                const trend = change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral'

                results.push({
                    symbol: idx.symbol,
                    name: idx.name,
                    slug: idx.slug,
                    price,
                    change,
                    changePercent,
                    trend,
                    currency: country.currency,
                    currencySymbol: country.currencySymbol,
                    lastUpdated: now,
                    dataAvailable: true,
                    source: 'alpha-vantage',
                })
            } else {
                logDev(`Empty quote for ${avSymbol}`)
                results.push(createUnavailable(idx, country, 'Symbol not supported by provider', 'alpha-vantage'))
            }
        } catch (err) {
            logDev(`Error fetching ${avSymbol}`, err)
            results.push(createUnavailable(idx, country, 'Fetch failed', 'alpha-vantage'))
        }

        // respect rate limits
        await new Promise((r) => setTimeout(r, 300))
    }

    marketCache.set(cacheKey, { data: results, fetchedAt: Date.now() })
    return results
}

function createUnavailable(
    idx: MarketIndex,
    country: MarketCountry,
    reason: string,
    source: DataSource
): MarketIndexData {
    return {
        symbol: idx.symbol,
        name: idx.name,
        slug: idx.slug,
        price: 0,
        change: 0,
        changePercent: 0,
        trend: 'neutral',
        currency: country.currency,
        currencySymbol: country.currencySymbol,
        lastUpdated: new Date(),
        dataAvailable: false,
        source,
        unavailableReason: reason,
    }
}

export function getMarketIndexBySlug(slug: string): {
    index: MarketIndex
    country: MarketCountry
} | null {
    for (const country of MARKET_COUNTRIES) {
        const index = country.indices.find((i) => i.slug === slug)
        if (index) return { index, country }
    }
    return null
}

export function getCacheAge(countryCode: string): number | null {
    const cached = marketCache.get(countryCode.toUpperCase())
    if (!cached) return null
    return Date.now() - cached.fetchedAt
}

export function canRefresh(countryCode: string): boolean {
    if (isRateLimited()) return false
    const age = getCacheAge(countryCode)
    return age === null || age > 60 * 1000
}
