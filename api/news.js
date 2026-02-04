// Robust news API with multiple source fallbacks
// Order: NewsAPI -> NewsData.io -> WorldNewsAPI -> Fallback mock

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { q = 'world', language = 'en', pageSize = 10, page = 1 } = req.query;

    // Try each source in order until one works
    const sources = [
        () => tryNewsAPI(q, language, pageSize, page),
        () => tryNewsDataIO(q, language, pageSize),
        () => tryWorldNewsAPI(q, pageSize),
    ];

    for (const source of sources) {
        try {
            const result = await source();
            if (result && result.articles && result.articles.length > 0) {
                return res.status(200).json(result);
            }
        } catch (error) {
            console.log('Source failed, trying next:', error.message);
            continue;
        }
    }

    // All sources failed - return fallback
    return res.status(200).json({
        status: 'ok',
        articles: getFallbackArticles(),
        source: 'fallback'
    });
}

// Source 1: NewsAPI
async function tryNewsAPI(q, language, pageSize, page) {
    const apiKey = process.env.VITE_NEWSAPI_KEY;
    if (!apiKey) throw new Error('NewsAPI key not configured');

    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&language=${language}&pageSize=${pageSize}&page=${page}&sortBy=publishedAt&apiKey=${apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`NewsAPI returned ${response.status}`);
    }

    const data = await response.json();
    if (data.status === 'error') {
        throw new Error(data.message || 'NewsAPI error');
    }

    return {
        status: 'ok',
        articles: data.articles.map(normalizeNewsAPIArticle),
        source: 'newsapi'
    };
}

// Source 2: NewsData.io
async function tryNewsDataIO(q, language, pageSize) {
    const apiKey = process.env.VITE_NEWSDATA_KEY;
    if (!apiKey) throw new Error('NewsData key not configured');

    const url = `https://newsdata.io/api/1/news?apikey=${apiKey}&q=${encodeURIComponent(q)}&language=${language}&size=${Math.min(pageSize, 10)}`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`NewsData returned ${response.status}`);
    }

    const data = await response.json();
    if (data.status !== 'success') {
        throw new Error(data.message || 'NewsData error');
    }

    return {
        status: 'ok',
        articles: (data.results || []).map(normalizeNewsDataArticle),
        source: 'newsdata'
    };
}

// Source 3: WorldNewsAPI
async function tryWorldNewsAPI(q, pageSize) {
    const apiKey = process.env.VITE_WORLDNEWS_API_KEY;
    if (!apiKey) throw new Error('WorldNews key not configured');

    const url = `https://api.worldnewsapi.com/search-news?api-key=${apiKey}&text=${encodeURIComponent(q)}&language=en&number=${pageSize}`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`WorldNewsAPI returned ${response.status}`);
    }

    const data = await response.json();

    return {
        status: 'ok',
        articles: (data.news || []).map(normalizeWorldNewsArticle),
        source: 'worldnews'
    };
}

// Normalize NewsAPI article
function normalizeNewsAPIArticle(article) {
    return {
        title: article.title,
        description: article.description,
        url: article.url,
        urlToImage: article.urlToImage,
        publishedAt: article.publishedAt,
        author: article.author,
        source: { name: article.source?.name || 'NewsAPI' }
    };
}

// Normalize NewsData article
function normalizeNewsDataArticle(article) {
    return {
        title: article.title,
        description: article.description,
        url: article.link,
        urlToImage: article.image_url,
        publishedAt: article.pubDate,
        author: article.creator?.join(', '),
        source: { name: article.source_id || 'NewsData' }
    };
}

// Normalize WorldNews article
function normalizeWorldNewsArticle(article) {
    return {
        title: article.title,
        description: article.text?.substring(0, 200) + '...',
        url: article.url,
        urlToImage: article.image,
        publishedAt: article.publish_date,
        author: article.author,
        source: { name: article.source_country || 'World News' }
    };
}

// Fallback articles when all sources fail
function getFallbackArticles() {
    return [
        {
            title: 'Global Markets Update',
            description: 'Stay tuned for the latest global market updates and economic news.',
            url: 'https://www.reuters.com/markets/',
            urlToImage: null,
            publishedAt: new Date().toISOString(),
            source: { name: 'AtlasIQ' }
        },
        {
            title: 'World News Summary',
            description: 'Check back soon for breaking news from around the world.',
            url: 'https://www.bbc.com/news/world',
            urlToImage: null,
            publishedAt: new Date().toISOString(),
            source: { name: 'AtlasIQ' }
        },
        {
            title: 'Technology & Innovation',
            description: 'Discover the latest in technology, science, and innovation.',
            url: 'https://www.theverge.com/',
            urlToImage: null,
            publishedAt: new Date().toISOString(),
            source: { name: 'AtlasIQ' }
        }
    ];
}

