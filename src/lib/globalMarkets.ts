export type DataSource = 'finnhub' | 'indianapi' | 'none'

export interface MarketIndex {
    symbol: string
    name: string
    slug: string
    finnhubSymbol?: string
    indianApiName?: string
    isIndex?: boolean
    primarySource: DataSource
    fallbackSource?: DataSource
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

export const MARKET_COUNTRIES: MarketCountry[] = [
    {
        code: 'IN',
        name: 'India',
        currency: 'INR',
        currencySymbol: '₹',
        indices: [
            { symbol: 'RELIANCE', name: 'Reliance Industries', slug: 'reliance', indianApiName: 'Reliance Industries', primarySource: 'indianapi' },
            { symbol: 'TCS', name: 'TCS', slug: 'tcs', indianApiName: 'Tata Consultancy Services', primarySource: 'indianapi' },
            { symbol: 'INFY', name: 'Infosys', slug: 'infosys', indianApiName: 'Infosys', primarySource: 'indianapi' },
            { symbol: 'HDFCBANK', name: 'HDFC Bank', slug: 'hdfc-bank', indianApiName: 'HDFC Bank', primarySource: 'indianapi' },
            { symbol: 'ICICIBANK', name: 'ICICI Bank', slug: 'icici-bank', indianApiName: 'ICICI Bank', primarySource: 'indianapi' },
            { symbol: 'BHARTIARTL', name: 'Bharti Airtel', slug: 'airtel', indianApiName: 'Bharti Airtel', primarySource: 'indianapi' },
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
            { symbol: 'SPY', name: 'S&P 500 (SPY)', slug: 'sp-500', finnhubSymbol: 'SPY', primarySource: 'finnhub' },
            { symbol: 'DIA', name: 'Dow Jones (DIA)', slug: 'dow-jones', finnhubSymbol: 'DIA', primarySource: 'finnhub' },
            { symbol: 'QQQ', name: 'NASDAQ (QQQ)', slug: 'nasdaq', finnhubSymbol: 'QQQ', primarySource: 'finnhub' },
            { symbol: 'AAPL', name: 'Apple', slug: 'apple', finnhubSymbol: 'AAPL', primarySource: 'finnhub' },
            { symbol: 'MSFT', name: 'Microsoft', slug: 'microsoft', finnhubSymbol: 'MSFT', primarySource: 'finnhub' },
            { symbol: 'GOOGL', name: 'Alphabet (Google)', slug: 'google', finnhubSymbol: 'GOOGL', primarySource: 'finnhub' },
            { symbol: 'AMZN', name: 'Amazon', slug: 'amazon', finnhubSymbol: 'AMZN', primarySource: 'finnhub' },
            { symbol: 'TSLA', name: 'Tesla', slug: 'tesla', finnhubSymbol: 'TSLA', primarySource: 'finnhub' },
            { symbol: 'META', name: 'Meta', slug: 'meta', finnhubSymbol: 'META', primarySource: 'finnhub' },
            { symbol: 'NVDA', name: 'NVIDIA', slug: 'nvidia', finnhubSymbol: 'NVDA', primarySource: 'finnhub' },
        ],
    },
    {
        code: 'GB',
        name: 'United Kingdom',
        currency: 'GBP',
        currencySymbol: '£',
        indices: [
            { symbol: 'ISF', name: 'FTSE 100 ETF', slug: 'ftse-100', primarySource: 'none' },
            { symbol: 'BP', name: 'BP', slug: 'bp', primarySource: 'none' },
        ],
    },
    {
        code: 'JP',
        name: 'Japan',
        currency: 'JPY',
        currencySymbol: '¥',
        indices: [
            { symbol: 'EWJ', name: 'iShares Japan (EWJ)', slug: 'nikkei-225', finnhubSymbol: 'EWJ', primarySource: 'finnhub' },
        ],
    },
    {
        code: 'DE',
        name: 'Germany',
        currency: 'EUR',
        currencySymbol: '€',
        indices: [
            { symbol: 'EWG', name: 'iShares Germany (EWG)', slug: 'dax', finnhubSymbol: 'EWG', primarySource: 'finnhub' },
        ],
    },
]

export function getMarketCountry(code: string): MarketCountry | undefined {
    return MARKET_COUNTRIES.find((c) => c.code === code.toUpperCase())
}

interface CacheEntry {
    data: MarketIndexData[]
    fetchedAt: number
}

const marketCache = new Map<string, CacheEntry>()
const CACHE_TTL_MS_DEFAULT = 15 * 60 * 1000
const CACHE_TTL_MS_INDIA = 48 * 60 * 60 * 1000

let lastRateLimitHit = 0
const RATE_LIMIT_COOLDOWN_MS = 60 * 1000

const isDev = import.meta.env.DEV

function logDev(msg: string, data?: unknown) {
    if (isDev) {
        console.log(`[Markets] ${msg}`, data ?? '')
    }
}

interface FinnhubQuote {
    c: number
    d: number
    dp: number
    h: number
    l: number
    o: number
    pc: number
    t: number
}

interface FinnhubErrorResponse {
    error?: string
}

function getFinnhubApiKey(): string {
    return import.meta.env.VITE_FINNHUB_API_KEY || ''
}

async function fetchFinnhubQuote(symbol: string): Promise<FinnhubQuote | null> {
    const apiKey = getFinnhubApiKey()
    if (!apiKey) {
        logDev('No Finnhub API key configured')
        return null
    }

    const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`
    logDev(`Finnhub fetching: ${symbol}`)

    try {
        const res = await fetch(url)
        if (!res.ok) {
            if (res.status === 429) {
                logDev('Finnhub rate limit hit')
                lastRateLimitHit = Date.now()
            }
            logDev(`Finnhub HTTP error for ${symbol}`, res.status)
            return null
        }
        const data: FinnhubQuote & FinnhubErrorResponse = await res.json()
        logDev(`Finnhub response for ${symbol}`, data)

        if (data.error) {
            logDev(`Finnhub API error for ${symbol}`, data.error)
            return null
        }

        return data
    } catch (err) {
        logDev(`Finnhub fetch error for ${symbol}`, err)
        return null
    }
}

interface IndianApiStockResponse {
    companyName?: string
    currentPrice?: {
        BSE?: number
        NSE?: number
    }
    percentChange?: number
}

function getIndianApiKey(): string {
    return import.meta.env.VITE_INDIANAPI_KEY || ''
}

async function fetchIndianApiStock(stockName: string): Promise<IndianApiStockResponse | null> {
    const apiKey = getIndianApiKey()
    if (!apiKey) {
        logDev('No IndianAPI key configured')
        return null
    }

    const url = `https://stock.indianapi.in/stock?name=${encodeURIComponent(stockName)}`
    logDev(`IndianAPI fetching: ${stockName}`)

    try {
        const res = await fetch(url, {
            headers: {
                'x-api-key': apiKey,
            },
        })

        if (!res.ok) {
            if (res.status === 429) {
                logDev('IndianAPI rate limit hit')
                lastRateLimitHit = Date.now()
            }
            logDev(`IndianAPI HTTP error for ${stockName}`, res.status)
            return null
        }

        const data: IndianApiStockResponse = await res.json()
        logDev(`IndianAPI response for ${stockName}`, data)
        return data
    } catch (err) {
        logDev(`IndianAPI fetch error for ${stockName}`, err)
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

    const cacheTtl = cacheKey === 'IN' ? CACHE_TTL_MS_INDIA : CACHE_TTL_MS_DEFAULT

    if (cached && !bypassCache) {
        const age = Date.now() - cached.fetchedAt
        if (age < cacheTtl) {
            logDev(`Cache hit for ${countryCode} (TTL: ${cacheTtl / 1000 / 60}min)`)
            return cached.data
        }
    }

    if (isRateLimited() && cached) {
        logDev('Rate limited, returning cache')
        return cached.data
    }

    const results: MarketIndexData[] = []
    const now = new Date()

    for (const idx of country.indices) {
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
                unavailableReason: 'Index data not available',
            })
            continue
        }

        if (idx.primarySource === 'finnhub') {
            const result = await fetchFromFinnhub(idx, country, now)
            results.push(result)
        } else if (idx.primarySource === 'indianapi') {
            const result = await fetchFromIndianApi(idx, country, now)
            results.push(result)
        } else {
            results.push(createUnavailable(idx, country, 'Unknown data source', 'none'))
        }

        await new Promise((r) => setTimeout(r, 150))
    }

    marketCache.set(cacheKey, { data: results, fetchedAt: Date.now() })
    return results
}

async function fetchFromFinnhub(
    idx: MarketIndex,
    country: MarketCountry,
    now: Date
): Promise<MarketIndexData> {
    const apiKey = getFinnhubApiKey()
    if (!apiKey) {
        return createUnavailable(idx, country, 'Finnhub API key not configured', 'finnhub')
    }

    const symbol = idx.finnhubSymbol || idx.symbol
    const quote = await fetchFinnhubQuote(symbol)

    if (quote && quote.c > 0) {
        const price = quote.c
        const change = quote.d || 0
        const changePercent = quote.dp || 0
        const trend = change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral'

        return {
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
            source: 'finnhub',
        }
    }

    return createUnavailable(idx, country, 'Data not available', 'finnhub')
}

async function fetchFromIndianApi(
    idx: MarketIndex,
    country: MarketCountry,
    now: Date
): Promise<MarketIndexData> {
    const apiKey = getIndianApiKey()
    if (!apiKey) {
        return createUnavailable(idx, country, 'IndianAPI key not configured', 'indianapi')
    }

    const stockName = idx.indianApiName || idx.name
    const data = await fetchIndianApiStock(stockName)

    if (data && data.currentPrice) {
        const price = data.currentPrice.NSE || data.currentPrice.BSE || 0
        const percentChange = data.percentChange || 0
        const prevPrice = price / (1 + percentChange / 100)
        const change = price - prevPrice
        const trend = percentChange > 0 ? 'positive' : percentChange < 0 ? 'negative' : 'neutral'

        if (price > 0) {
            return {
                symbol: idx.symbol,
                name: idx.name,
                slug: idx.slug,
                price,
                change: Math.round(change * 100) / 100,
                changePercent: Math.round(percentChange * 100) / 100,
                trend,
                currency: country.currency,
                currencySymbol: country.currencySymbol,
                lastUpdated: now,
                dataAvailable: true,
                source: 'indianapi',
            }
        }
    }

    return createUnavailable(idx, country, 'Data not available', 'indianapi')
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
