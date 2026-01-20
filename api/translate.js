// Vercel Serverless Translation Proxy
// Uses Google Translate's free web API for accurate translations

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { text, source = 'auto', target } = req.method === 'POST' ? req.body : req.query;

    if (!text || !target) {
        return res.status(400).json({
            error: 'Missing required parameters: text, target'
        });
    }

    try {
        // Use Google Translate's free API via their web interface
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${source}&tl=${target}&dt=t&q=${encodeURIComponent(text)}`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        });

        if (!response.ok) {
            throw new Error(`Google API returned ${response.status}`);
        }

        const data = await response.json();

        // Google returns nested array: [[["translated text","original text",null,null,3]],null,"detected_lang"]
        let translatedText = '';
        if (Array.isArray(data) && Array.isArray(data[0])) {
            translatedText = data[0].map(item => item[0]).join('');
        }

        const detectedLanguage = data[2] || source;

        return res.status(200).json({
            success: true,
            translatedText,
            detectedLanguage,
            source: 'google'
        });

    } catch (error) {
        console.error('Translation error:', error);
        return res.status(500).json({
            success: false,
            error: 'Translation failed',
            message: error.message
        });
    }
}
