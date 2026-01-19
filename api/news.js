// Vercel serverless function to proxy NewsAPI requests (avoids CORS)
export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { q, language = 'en', pageSize = 10, page = 1 } = req.query;
    const apiKey = process.env.VITE_NEWSAPI_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'NewsAPI key not configured' });
    }

    try {
        const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q || 'world')}&language=${language}&pageSize=${pageSize}&page=${page}&sortBy=publishedAt&apiKey=${apiKey}`;

        const response = await fetch(url);
        const data = await response.json();

        res.status(response.status).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch news' });
    }
}
