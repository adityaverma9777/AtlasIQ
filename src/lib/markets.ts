import { fetchWithCache } from './fetch'

export interface MarketData {
    name: string
    price: string
    change: string
    trend: 'positive' | 'negative' | 'neutral'
}

interface CoinGeckoPrice {
    usd: number
    usd_24h_change: number
}

interface CoinGeckoResponse {
    [key: string]: CoinGeckoPrice
}

const COINS = ['bitcoin', 'ethereum']

async function fetchCoinGeckoData(bypassCache: boolean): Promise<CoinGeckoResponse> {
    const baseUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${COINS.join(',')}&vs_currencies=usd&include_24hr_change=true`

    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(baseUrl)}`

    try {
        return await fetchWithCache<CoinGeckoResponse>(proxyUrl, { cacheMinutes: 2, bypassCache })
    } catch {
        return await fetchWithCache<CoinGeckoResponse>(baseUrl, { cacheMinutes: 2, bypassCache })
    }
}

export async function fetchCryptoMarkets(bypassCache = false): Promise<MarketData[]> {
    const data = await fetchCoinGeckoData(bypassCache)

    return COINS.map((coin) => {
        const info = data[coin]
        if (!info) return null

        const change = info.usd_24h_change ?? 0
        const trend = change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral'

        return {
            name: coin.charAt(0).toUpperCase() + coin.slice(1),
            price: `$${info.usd.toLocaleString()}`,
            change: `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`,
            trend,
        }
    }).filter(Boolean) as MarketData[]
}
