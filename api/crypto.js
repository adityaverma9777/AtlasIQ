// Crypto prices API route - proxies CoinGecko to avoid CORS
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { ids = 'bitcoin,ethereum', vs_currencies = 'usd' } = req.query;

    try {
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=${vs_currencies}&include_24hr_change=true`;

        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'AtlasIQ/1.0'
            }
        });

        if (!response.ok) {
            throw new Error(`CoinGecko returned ${response.status}`);
        }

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        console.error('Crypto API error:', error);

        // Return fallback data
        return res.status(200).json({
            bitcoin: { usd: 97500, usd_24h_change: -2.5 },
            ethereum: { usd: 3200, usd_24h_change: -3.0 }
        });
    }
}

