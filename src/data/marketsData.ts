// unified market entity schema and orchestrator

export type MarketType = 'crypto' | 'index' | 'commodity' | 'forex'

export interface MarketKeyFact {
    label: string
    value: string
}

export interface MarketEntity {
    name: string
    slug: string
    symbol: string
    marketType: MarketType
    region: 'global' | string
    baseCurrency: string
    description: string
    keyFacts: MarketKeyFact[]
    context: string
    relatedMarkets: string[]
    sources: { name: string; url?: string }[]
    ttl: number
}

const marketStore: Record<string, MarketEntity> = {
    // crypto - will be enhanced by live API
    'bitcoin': {
        name: 'Bitcoin',
        slug: 'bitcoin',
        symbol: 'BTC',
        marketType: 'crypto',
        region: 'global',
        baseCurrency: 'USD',
        description: 'The first and largest cryptocurrency by market capitalization.',
        keyFacts: [
            { label: 'Symbol', value: 'BTC' },
            { label: 'Market Cap Rank', value: '#1' },
            { label: 'All-Time High', value: '$69,000' },
            { label: 'Launch', value: '2009' },
        ],
        context: 'Bitcoin operates on a decentralized peer-to-peer network using blockchain technology. It enables secure, borderless transactions without intermediaries.',
        relatedMarkets: ['ethereum', 'gold'],
        sources: [{ name: 'CoinGecko', url: 'https://coingecko.com' }],
        ttl: 2,
    },
    'ethereum': {
        name: 'Ethereum',
        slug: 'ethereum',
        symbol: 'ETH',
        marketType: 'crypto',
        region: 'global',
        baseCurrency: 'USD',
        description: 'A decentralized platform enabling smart contracts and decentralized applications.',
        keyFacts: [
            { label: 'Symbol', value: 'ETH' },
            { label: 'Market Cap Rank', value: '#2' },
            { label: 'Consensus', value: 'Proof of Stake' },
            { label: 'Launch', value: '2015' },
        ],
        context: 'Ethereum introduced smart contracts to blockchain technology, powering most DeFi protocols and NFT marketplaces.',
        relatedMarkets: ['bitcoin', 'solana'],
        sources: [{ name: 'CoinGecko', url: 'https://coingecko.com' }],
        ttl: 2,
    },
    // commodities
    'gold': {
        name: 'Gold',
        slug: 'gold',
        symbol: 'XAU',
        marketType: 'commodity',
        region: 'global',
        baseCurrency: 'USD',
        description: 'Precious metal traditionally used as a store of value and inflation hedge.',
        keyFacts: [
            { label: 'Symbol', value: 'XAU' },
            { label: 'Type', value: 'Precious Metal' },
            { label: 'Unit', value: 'Troy Ounce' },
            { label: 'Trading', value: '24/5' },
        ],
        context: 'Gold has been a trusted store of value for millennia. It serves as a hedge against inflation and currency devaluation, often rising during economic uncertainty.',
        relatedMarkets: ['silver', 'bitcoin'],
        sources: [{ name: 'World Gold Council' }],
        ttl: 24,
    },
    'silver': {
        name: 'Silver',
        slug: 'silver',
        symbol: 'XAG',
        marketType: 'commodity',
        region: 'global',
        baseCurrency: 'USD',
        description: 'Precious metal with both industrial and investment applications.',
        keyFacts: [
            { label: 'Symbol', value: 'XAG' },
            { label: 'Type', value: 'Precious Metal' },
            { label: 'Industrial Use', value: 'Electronics, Solar' },
            { label: 'Trading', value: '24/5' },
        ],
        context: 'Silver has dual demand from industrial applications and investment. It\'s more volatile than gold but offers higher upside potential.',
        relatedMarkets: ['gold', 'platinum'],
        sources: [{ name: 'Silver Institute' }],
        ttl: 24,
    },
    'crude-oil': {
        name: 'Crude Oil (WTI)',
        slug: 'crude-oil',
        symbol: 'CL',
        marketType: 'commodity',
        region: 'global',
        baseCurrency: 'USD',
        description: 'Benchmark crude oil price for the global energy market.',
        keyFacts: [
            { label: 'Symbol', value: 'CL' },
            { label: 'Benchmark', value: 'WTI' },
            { label: 'Unit', value: 'Barrel' },
            { label: 'Exchange', value: 'NYMEX' },
        ],
        context: 'Crude oil is the world\'s most traded commodity. Prices are influenced by OPEC policies, geopolitical events, and global demand.',
        relatedMarkets: ['natural-gas', 'gold'],
        sources: [{ name: 'EIA', url: 'https://eia.gov' }],
        ttl: 24,
    },
    // indices
    'sp500': {
        name: 'S&P 500',
        slug: 'sp500',
        symbol: 'SPX',
        marketType: 'index',
        region: 'US',
        baseCurrency: 'USD',
        description: 'Benchmark index of 500 largest US public companies.',
        keyFacts: [
            { label: 'Symbol', value: 'SPX' },
            { label: 'Components', value: '500' },
            { label: 'Exchange', value: 'NYSE, NASDAQ' },
            { label: 'Weighting', value: 'Market Cap' },
        ],
        context: 'The S&P 500 is the most followed equity index globally. It represents approximately 80% of US market capitalization.',
        relatedMarkets: ['nasdaq', 'dow-jones'],
        sources: [{ name: 'S&P Global' }],
        ttl: 24,
    },
    'nifty50': {
        name: 'Nifty 50',
        slug: 'nifty50',
        symbol: 'NIFTY',
        marketType: 'index',
        region: 'India',
        baseCurrency: 'INR',
        description: 'Benchmark index of 50 largest Indian companies on NSE.',
        keyFacts: [
            { label: 'Symbol', value: 'NIFTY' },
            { label: 'Components', value: '50' },
            { label: 'Exchange', value: 'NSE' },
            { label: 'Weighting', value: 'Free Float Market Cap' },
        ],
        context: 'The Nifty 50 is India\'s benchmark equity index, representing the most liquid and largest traded stocks on the National Stock Exchange.',
        relatedMarkets: ['sensex', 'sp500'],
        sources: [{ name: 'NSE India', url: 'https://nseindia.com' }],
        ttl: 24,
    },
    'sensex': {
        name: 'BSE Sensex',
        slug: 'sensex',
        symbol: 'SENSEX',
        marketType: 'index',
        region: 'India',
        baseCurrency: 'INR',
        description: 'Benchmark index of 30 largest Indian companies on BSE.',
        keyFacts: [
            { label: 'Symbol', value: 'SENSEX' },
            { label: 'Components', value: '30' },
            { label: 'Exchange', value: 'BSE' },
            { label: 'Oldest', value: 'Since 1986' },
        ],
        context: 'The Sensex is India\'s oldest stock market index and Asia\'s oldest equity index still in use.',
        relatedMarkets: ['nifty50', 'sp500'],
        sources: [{ name: 'BSE India', url: 'https://bseindia.com' }],
        ttl: 24,
    },
    // forex
    'usd-inr': {
        name: 'USD/INR',
        slug: 'usd-inr',
        symbol: 'USD/INR',
        marketType: 'forex',
        region: 'India',
        baseCurrency: 'INR',
        description: 'Exchange rate between US Dollar and Indian Rupee.',
        keyFacts: [
            { label: 'Pair', value: 'USD/INR' },
            { label: 'Base', value: 'USD' },
            { label: 'Quote', value: 'INR' },
            { label: 'Trading', value: '24/5' },
        ],
        context: 'USD/INR is influenced by RBI interventions, trade balance, FII flows, and global dollar strength.',
        relatedMarkets: ['eur-inr', 'gold'],
        sources: [{ name: 'RBI' }],
        ttl: 24,
    },
}

// get single market
export function getMarket(slug: string): MarketEntity | null {
    return marketStore[slug] || null
}

// get all markets
export function getAllMarkets(): MarketEntity[] {
    return Object.values(marketStore)
}

// filter by type
export function getMarketsByType(type: MarketType): MarketEntity[] {
    return getAllMarkets().filter((m) => m.marketType === type)
}

// filter by region
export function getMarketsByRegion(region: string): MarketEntity[] {
    return getAllMarkets().filter(
        (m) => m.region === 'global' || m.region === region
    )
}

// get key markets for dashboard (crypto + commodities + regional index)
export function getKeyMarkets(region?: string): MarketEntity[] {
    const crypto = getMarketsByType('crypto').slice(0, 2)
    const commodities = getMarketsByType('commodity').slice(0, 2)
    const indices = region
        ? getMarketsByType('index').filter((m) => m.region === region || m.region === 'global').slice(0, 1)
        : getMarketsByType('index').slice(0, 1)
    return [...crypto, ...commodities, ...indices]
}

// currency conversion placeholder
export function convertToPreferredCurrency(
    value: number,
    _fromCurrency: string,
    toCurrency: string
): { value: number; formatted: string } {
    // placeholder - no actual conversion yet
    // just return original value with target currency symbol
    const symbols: Record<string, string> = {
        USD: '$',
        INR: '₹',
        GBP: '£',
        EUR: '€',
        AUD: 'A$',
        CAD: 'C$',
    }
    const symbol = symbols[toCurrency] || toCurrency
    return {
        value,
        formatted: `${symbol}${value.toLocaleString()}`,
    }
}
