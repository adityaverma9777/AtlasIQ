import { fetchTextWithCache } from './fetch'

export interface ArticleImage {
    url: string
    alt?: string
}

export interface ParsedArticle {
    text: string
    images: ArticleImage[]
}

function extractImages(markdown: string): ArticleImage[] {
    const images: ArticleImage[] = []
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g
    let match
    
    while ((match = imageRegex.exec(markdown)) !== null) {
        const alt = match[1] || ''
        const url = match[2]
        if (url && !url.startsWith('data:')) {
            images.push({ url, alt })
        }
    }
    
    return images.slice(0, 10)
}

function stripJinaBoilerplate(text: string): string {
    return text
        .replace(/^Title:.*$/gm, '')
        .replace(/^URL Source:.*$/gm, '')
        .replace(/^Published Time:.*$/gm, '')
        .replace(/^Markdown Content:$/gm, '')
        .replace(/^={3,}$/gm, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
}

function cleanMarkdownText(text: string): string {
    return text
        .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '$1')
        .replace(/\[\+\d+\s*chars\]/g, '')
        .replace(/^#{1,6}\s+/gm, '')
        .replace(/[*_`]/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
}

function removeDuplicateParagraphs(text: string): string {
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0)
    const seen = new Set<string>()
    const unique: string[] = []
    
    for (const para of paragraphs) {
        const normalized = para.trim().toLowerCase().slice(0, 100)
        if (!seen.has(normalized)) {
            seen.add(normalized)
            unique.push(para.trim())
        }
    }
    
    return unique.join('\n\n')
}

export async function fetchReadableArticleText(url: string, bypassCache = false): Promise<string | null> {
    if (!url) return null

    try {
        const readerUrl = `https://r.jina.ai/${url}?mode=markdown`
        const text = await fetchTextWithCache(readerUrl, { cacheMinutes: 60 * 6, bypassCache })
        if (!text) return null
        
        const cleaned = stripJinaBoilerplate(text)
        const textOnly = cleaned.replace(/!\[[^\]]*\]\([^)]+\)/g, '')
        const finalText = cleanMarkdownText(textOnly)
        const deduplicated = removeDuplicateParagraphs(finalText)
        
        return deduplicated.length > 200 ? deduplicated : deduplicated || null
    } catch {
        return null
    }
}

export async function fetchReadableArticleWithImages(url: string, bypassCache = false): Promise<ParsedArticle | null> {
    if (!url) return null

    try {
        const readerUrl = `https://r.jina.ai/${url}?mode=markdown`

        const text = await fetchTextWithCache(readerUrl, { cacheMinutes: 60 * 6, bypassCache })
        if (!text) return null
        const cleaned = stripJinaBoilerplate(text)
        const images = extractImages(cleaned)
        const textOnly = cleaned.replace(/!\[[^\]]*\]\([^)]+\)/g, '')
        const finalText = cleanMarkdownText(textOnly)
        const deduplicated = removeDuplicateParagraphs(finalText)
        
        if (deduplicated.length < 200) return null
        
        return {
            text: deduplicated,
            images: images.slice(0, 5)
        }
    } catch {
        return null
    }
}



