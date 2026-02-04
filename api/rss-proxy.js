

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'Missing url parameter' });
    }

    // Validate URL 
    const allowedDomains = [
        'news.google.com',
        'www.youtube.com',
        'youtube.com',
        'rss.nytimes.com',
        'feeds.bbci.co.uk',
        'rss.cnn.com',
    ];

    try {
        const parsedUrl = new URL(url);
        const isAllowed = allowedDomains.some(domain =>
            parsedUrl.hostname === domain || parsedUrl.hostname.endsWith('.' + domain)
        );

        if (!isAllowed) {
            return res.status(403).json({
                error: 'Domain not allowed',
                allowed: allowedDomains
            });
        }

        // Fetch the RSS feed
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; AtlasIQ/1.0; +https://atlasiq.vercel.app)',
                'Accept': 'application/rss+xml, application/xml, text/xml, */*',
            },
        });

        if (!response.ok) {
            return res.status(response.status).json({
                error: `Upstream returned ${response.status}`
            });
        }

        const contentType = response.headers.get('content-type') || 'text/xml';
        const text = await response.text();

        // Set appropriate content type for RSS
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

        return res.status(200).send(text);

    } catch (error) {
        console.error('RSS Proxy error:', error);
        return res.status(500).json({
            error: 'Failed to fetch RSS feed',
            message: error.message
        });
    }
}

