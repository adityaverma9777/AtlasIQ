export type EntityType =
    | 'market'
    | 'market-index'
    | 'weather'
    | 'concept'
    | 'exam'
    | 'country'
    | 'alert'
    | 'learn'
    | 'air-quality'
    | 'govt'
    | 'news-article'

export interface EntityFact {
    label: string
    value: string
}

export interface EntityUpdate {
    title: string
    summary: string
    timestamp: string
}

export interface RelatedEntity {
    type: EntityType
    slug: string
    title: string
}

export interface EntitySource {
    name: string
    url?: string
}

export interface EntityData {
    type: EntityType
    slug: string
    title: string
    summary: string
    facts: EntityFact[]
    context: string
    relevance: string
    updates: EntityUpdate[]
    related: RelatedEntity[]
    sources: EntitySource[]
    updatedAt: Date
    ttl: number // in hours
}

export interface NewsArticleEntityData {
    url: string
    sourceName: string
    author?: string
    publishedAt?: string
    imageUrl?: string
    content?: string
    fullText?: string
    topics?: string[]
    images?: string[]
}

const ENTITY_TTL = 24 // hours

const entityStore: Record<string, Omit<EntityData, 'updatedAt'>> = {
    'market/bitcoin': {
        type: 'market',
        slug: 'bitcoin',
        title: 'Bitcoin (BTC)',
        summary: 'The first and largest cryptocurrency by market capitalization, created in 2009 by the pseudonymous Satoshi Nakamoto.',
        facts: [
            { label: 'Symbol', value: 'BTC' },
            { label: 'Market Cap Rank', value: '#1' },
            { label: 'All-Time High', value: '$69,000' },
            { label: 'Launch Year', value: '2009' },
        ],
        context: 'Bitcoin operates on a decentralized peer-to-peer network using blockchain technology. It enables secure, borderless transactions without intermediaries. Mining secures the network through proof-of-work consensus.',
        relevance: 'Bitcoin remains the benchmark for the cryptocurrency market. Recent ETF approvals have increased institutional adoption, making it relevant for both retail and institutional investors.',
        updates: [
            { title: 'Bitcoin ETF approval', summary: 'SEC approves multiple spot Bitcoin ETFs', timestamp: '2h ago' },
            { title: 'Network upgrade', summary: 'Taproot activation improves privacy and efficiency', timestamp: '1d ago' },
        ],
        related: [
            { type: 'market', slug: 'ethereum', title: 'Ethereum' },
            { type: 'concept', slug: 'blockchain', title: 'Blockchain' },
        ],
        sources: [
            { name: 'CoinGecko', url: 'https://coingecko.com' },
            { name: 'Bitcoin.org' },
        ],
        ttl: ENTITY_TTL,
    },
    'market/ethereum': {
        type: 'market',
        slug: 'ethereum',
        title: 'Ethereum (ETH)',
        summary: 'A decentralized platform enabling smart contracts and decentralized applications (dApps).',
        facts: [
            { label: 'Symbol', value: 'ETH' },
            { label: 'Market Cap Rank', value: '#2' },
            { label: 'Consensus', value: 'Proof of Stake' },
            { label: 'Launch Year', value: '2015' },
        ],
        context: 'Ethereum introduced smart contracts to blockchain technology, enabling programmable money and decentralized applications. The network transitioned from proof-of-work to proof-of-stake in 2022.',
        relevance: 'Ethereum powers most DeFi protocols and NFT marketplaces. Layer 2 scaling solutions are making transactions faster and cheaper.',
        updates: [
            { title: 'Layer 2 growth', summary: 'Rollup solutions reduce gas fees significantly', timestamp: '4h ago' },
        ],
        related: [
            { type: 'market', slug: 'bitcoin', title: 'Bitcoin' },
            { type: 'concept', slug: 'smart-contracts', title: 'Smart Contracts' },
        ],
        sources: [
            { name: 'CoinGecko', url: 'https://coingecko.com' },
            { name: 'Ethereum Foundation' },
        ],
        ttl: ENTITY_TTL,
    },
    'concept/photosynthesis': {
        type: 'concept',
        slug: 'photosynthesis',
        title: 'Photosynthesis',
        summary: 'The process by which green plants and some other organisms use sunlight to synthesize foods from carbon dioxide and water.',
        facts: [
            { label: 'Type', value: 'Biological Process' },
            { label: 'Occurs In', value: 'Chloroplasts' },
            { label: 'Key Pigment', value: 'Chlorophyll' },
            { label: 'Products', value: 'Glucose + Oxygen' },
        ],
        context: 'Photosynthesis is fundamental to life on Earth. It converts solar energy into chemical energy, produces oxygen, and forms the base of most food chains. The process occurs in two stages: light-dependent reactions and the Calvin cycle.',
        relevance: 'Understanding photosynthesis is crucial for climate science and agriculture. Artificial photosynthesis research aims to create sustainable energy solutions.',
        updates: [
            { title: 'Research breakthrough', summary: 'Scientists improve artificial photosynthesis efficiency', timestamp: '1w ago' },
        ],
        related: [
            { type: 'concept', slug: 'chlorophyll', title: 'Chlorophyll' },
            { type: 'learn', slug: 'biology', title: 'Biology' },
        ],
        sources: [
            { name: 'Encyclopedia Britannica' },
            { name: 'Nature Journal' },
        ],
        ttl: ENTITY_TTL,
    },
    'exam/ssc-cgl': {
        type: 'exam',
        slug: 'ssc-cgl',
        title: 'SSC CGL 2026',
        summary: 'Staff Selection Commission Combined Graduate Level Examination for Group B and C posts in Government of India.',
        facts: [
            { label: 'Conducting Body', value: 'SSC' },
            { label: 'Eligibility', value: 'Graduate' },
            { label: 'Posts', value: 'Group B & C' },
            { label: 'Application Deadline', value: 'March 15, 2026' },
        ],
        context: 'SSC CGL is one of the most competitive examinations in India, recruiting for various ministries and departments. The exam consists of four tiers testing quantitative aptitude, reasoning, English, and general awareness.',
        relevance: 'Applications are currently open for 2026. Candidates should focus on the updated syllabus and practice previous year papers.',
        updates: [
            { title: 'Notification released', summary: 'Official notification published on SSC website', timestamp: '2d ago' },
            { title: 'Exam dates announced', summary: 'Tier 1 scheduled for June 2026', timestamp: '1w ago' },
        ],
        related: [
            { type: 'exam', slug: 'upsc-cse', title: 'UPSC CSE' },
            { type: 'country', slug: 'india', title: 'India' },
        ],
        sources: [
            { name: 'SSC Official', url: 'https://ssc.nic.in' },
            { name: 'Employment News' },
        ],
        ttl: ENTITY_TTL,
    },
    'weather/new-delhi': {
        type: 'weather',
        slug: 'new-delhi',
        title: 'New Delhi Weather',
        summary: 'Current weather conditions and forecast for New Delhi, the capital city of India.',
        facts: [
            { label: 'Region', value: 'North India' },
            { label: 'Climate', value: 'Humid Subtropical' },
            { label: 'Best Season', value: 'Oct - Mar' },
            { label: 'Monsoon', value: 'Jul - Sep' },
        ],
        context: 'New Delhi experiences extreme temperatures, with hot summers exceeding 45°C and cold winters dropping to 5°C. Air quality is a significant concern, especially during winter months.',
        relevance: 'Current conditions show moderate temperatures. Air quality advisories may be in effect during winter months.',
        updates: [
            { title: 'Temperature drop', summary: 'Cold wave expected this week', timestamp: '3h ago' },
        ],
        related: [
            { type: 'alert', slug: 'delhi-aqi', title: 'Delhi AQI' },
            { type: 'country', slug: 'india', title: 'India' },
        ],
        sources: [
            { name: 'Open-Meteo' },
            { name: 'IMD' },
        ],
        ttl: 1, // weather updates hourly
    },
}

// Entity cache with timestamps
const entityCache: Map<string, { data: EntityData; fetchedAt: number }> = new Map()

function isCacheValid(key: string, ttlHours: number): boolean {
    const cached = entityCache.get(key)
    if (!cached) return false
    const ageMs = Date.now() - cached.fetchedAt
    const ttlMs = ttlHours * 60 * 60 * 1000
    return ageMs < ttlMs
}

export async function getEntity(
    type: EntityType,
    slug: string,
    bypassCache = false
): Promise<EntityData | null> {
    const key = `${type}/${slug}`

    // dynamic news article entities (session-cached)
    if (type === 'news-article') {
        if (!bypassCache && isCacheValid(key, 12)) {
            return entityCache.get(key)!.data
        }

        const { getCachedNewsArticle, cacheNewsArticle } = await import('../data/news')
        const cached = getCachedNewsArticle(slug)
        if (!cached) return null

        // generate AI summary from available content
        const { generateNewsSummary, hasEnoughContent } = await import('./newsSummarizer')

        let aiSummary = ''
        if (hasEnoughContent({
            title: cached.title,
            description: cached.description,
            content: cached.content,
            sourceName: cached.sourceName,
            publishedAt: cached.publishedAt,
        })) {
            aiSummary = await generateNewsSummary({
                title: cached.title,
                description: cached.description,
                content: cached.content,
                sourceName: cached.sourceName,
                publishedAt: cached.publishedAt,
            })
        }



        const ttlHours = cached.ttlHours || 6

        const entity: EntityData = {
            type: 'news-article',
            slug,
            title: cached.title,
            summary: cached.description || 'Read more on the source website.',
            facts: [
                { label: 'Source', value: cached.sourceName },
                ...(cached.author ? [{ label: 'Author', value: cached.author }] : []),
                ...(cached.publishedAt ? [{ label: 'Published', value: new Date(cached.publishedAt).toLocaleString() }] : []),
            ],
            context: aiSummary || cached.description || '',
            relevance: 'Full article available on source website.',
            updates: [],
            related: (cached.topics || []).slice(0, 6).map((t) => ({
                type: 'learn' as EntityType,
                slug: t,
                title: t.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            })),
            sources: [
                { name: cached.sourceName },
                { name: 'Read original source', url: cached.url },
            ],
            updatedAt: new Date(cached.cachedAt),
            ttl: ttlHours,
        }

        const newsEntityData = entity as EntityData & { _news?: NewsArticleEntityData }
        newsEntityData._news = {
            url: cached.url,
            sourceName: cached.sourceName,
            author: cached.author,
            publishedAt: cached.publishedAt,
            imageUrl: cached.imageUrl,
            content: cached.content,
            fullText: aiSummary || undefined,
            topics: cached.topics,
            images: cached.images,
        }

        // update cache
        cacheNewsArticle({
            ...cached,
            cachedAt: cached.cachedAt || Date.now(),
            ttlHours,
        })

        entityCache.set(key, { data: entity, fetchedAt: Date.now() })
        return entity
    }

    // dynamic air-quality entities
    if (type === 'air-quality') {
        if (!bypassCache && isCacheValid(key, 1)) {
            return entityCache.get(key)!.data
        }

        const { fetchAQI, healthImplications, categoryLabels } = await import('./aqi')
        const { countries } = await import('../data/locations')

        // find city by slug
        let cityData: { name: string; lat: number; lon: number } | null = null
        for (const country of countries) {
            for (const state of country.states) {
                for (const city of state.cities) {
                    if (city.name.toLowerCase().replace(/\s+/g, '-') === slug) {
                        cityData = city
                        break
                    }
                }
            }
        }

        if (!cityData) {
            // fallback to user context
            return null
        }

        try {
            const aqi = await fetchAQI({ lat: cityData.lat, lon: cityData.lon, name: cityData.name, bypassCache })
            const entity: EntityData = {
                type: 'air-quality',
                slug,
                title: `${cityData.name} Air Quality`,
                summary: `Current air quality conditions for ${cityData.name}.`,
                facts: [
                    { label: 'AQI', value: String(aqi.aqi) },
                    { label: 'Category', value: categoryLabels[aqi.category] },
                    { label: 'PM2.5', value: `${aqi.pm25} µg/m³` },
                    { label: 'PM10', value: `${aqi.pm10} µg/m³` },
                    { label: 'NO₂', value: `${aqi.no2} µg/m³` },
                    { label: 'O₃', value: `${aqi.o3} µg/m³` },
                ],
                context: healthImplications[aqi.category],
                relevance: 'Air quality affects respiratory health and outdoor activities. Check levels before exercise.',
                updates: [],
                related: [
                    { type: 'weather', slug, title: `${cityData.name} Weather` },
                ],
                sources: [
                    { name: 'Open-Meteo', url: 'https://open-meteo.com' },
                    { name: 'CAMS', url: 'https://atmosphere.copernicus.eu' },
                ],
                updatedAt: new Date(),
                ttl: 1,
            }
            entityCache.set(key, { data: entity, fetchedAt: Date.now() })
            return entity
        } catch {
            return null
        }
    }

    // dynamic exam entities
    if (type === 'exam') {
        if (!bypassCache && isCacheValid(key, 24)) {
            return entityCache.get(key)!.data
        }

        const { getExam } = await import('../data/exams')
        const exam = getExam(slug)
        if (!exam) return null

        // format dates for display
        const datesText = exam.importantDates
            .map((d) => `${d.label}: ${d.date}`)
            .join('\n')

        const entity: EntityData = {
            type: 'exam',
            slug,
            title: exam.name,
            summary: `${exam.conductingBody} examination for ${exam.domains.join(', ')} domains.`,
            facts: [
                { label: 'Conducting Body', value: exam.conductingBody },
                { label: 'Type', value: exam.examType === 'central' ? 'Central Govt' : exam.examType === 'state' ? 'State Govt' : 'Private' },
                { label: 'Eligibility', value: exam.eligibility },
                { label: 'Domains', value: exam.domains.join(', ') },
            ],
            context: `Syllabus:\n• ${exam.syllabus.join('\n• ')}\n\nImportant Dates:\n${datesText}`,
            relevance: exam.states.length > 0
                ? `This exam is for candidates from ${exam.states.join(', ')}.`
                : 'This is a central government exam open to candidates from all states.',
            updates: exam.updates,
            related: exam.relatedExams.map((slug) => ({
                type: 'exam' as EntityType,
                slug,
                title: slug.toUpperCase().replace(/-/g, ' '),
            })),
            sources: exam.sources,
            updatedAt: new Date(),
            ttl: exam.ttl,
        }
        entityCache.set(key, { data: entity, fetchedAt: Date.now() })
        return entity
    }

    // dynamic market entities from marketsData
    if (type === 'market') {
        // check static store first
        const staticMarket = entityStore[key]
        if (!staticMarket) {
            // try marketsData
            const { getMarket } = await import('../data/marketsData')
            const market = getMarket(slug)
            if (!market) return null

            if (!bypassCache && isCacheValid(key, market.ttl)) {
                return entityCache.get(key)!.data
            }

            const entity: EntityData = {
                type: 'market',
                slug,
                title: `${market.name} (${market.symbol})`,
                summary: market.description,
                facts: market.keyFacts,
                context: market.context,
                relevance: `This is a ${market.marketType} asset traded in ${market.baseCurrency}. Region: ${market.region}.`,
                updates: [],
                related: market.relatedMarkets.map((s) => ({
                    type: 'market' as EntityType,
                    slug: s,
                    title: s.charAt(0).toUpperCase() + s.slice(1),
                })),
                sources: market.sources,
                updatedAt: new Date(),
                ttl: market.ttl,
            }
            entityCache.set(key, { data: entity, fetchedAt: Date.now() })
            return entity
        }
    }

    // dynamic market-index entities (global indices)
    if (type === 'market-index') {
        if (!bypassCache && isCacheValid(key, 15)) {
            return entityCache.get(key)!.data
        }

        const { getMarketIndexBySlug, fetchMarketIndices } = await import('./globalMarkets')
        const indexInfo = getMarketIndexBySlug(slug)
        if (!indexInfo) return null

        const { index, country } = indexInfo

        // fetch current price
        let priceText = 'Data not available'
        let changeText = '—'
        let dataAvailable = false
        try {
            const indices = await fetchMarketIndices(country.code, bypassCache)
            const current = indices.find((i) => i.slug === slug)
            if (current?.dataAvailable && current.price > 0) {
                priceText = `${country.currencySymbol}${current.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                const sign = current.change >= 0 ? '+' : ''
                changeText = `${sign}${current.change.toFixed(2)} (${sign}${current.changePercent.toFixed(2)}%)`
                dataAvailable = true
            }
        } catch {
            // fallback to unavailable
        }

        const entity: EntityData = {
            type: 'market-index',
            slug,
            title: index.name,
            summary: `${index.name} is a major market instrument from ${country.name}.`,
            facts: [
                { label: 'Symbol', value: index.symbol },
                { label: 'Country', value: country.name },
                { label: 'Currency', value: `${country.currency} (${country.currencySymbol})` },
                { label: 'Current Value', value: priceText },
                { label: 'Change', value: changeText },
                { label: 'Data Available', value: dataAvailable ? 'Yes' : 'Limited' },
            ],
            context: `${index.name} tracks market performance in ${country.name}. Data provided by Alpha Vantage API with 15-minute caching.`,
            relevance: `This instrument is traded in ${country.currency}. Monitor it for insights into ${country.name}'s market conditions.`,
            updates: [],
            related: country.indices
                .filter((i) => i.slug !== slug)
                .map((i) => ({
                    type: 'market-index' as EntityType,
                    slug: i.slug,
                    title: i.name,
                })),
            sources: [
                { name: 'Alpha Vantage', url: 'https://www.alphavantage.co' },
            ],
            updatedAt: new Date(),
            ttl: 15, // 15 min cache
        }
        entityCache.set(key, { data: entity, fetchedAt: Date.now() })
        return entity
    }

    // dynamic govt entities
    if (type === 'govt') {
        if (!bypassCache && isCacheValid(key, 24)) {
            return entityCache.get(key)!.data
        }

        const { getGovtEntity, govtTypeLabels } = await import('../data/government')
        const govt = getGovtEntity(slug)
        if (!govt) return null

        // format timeline for context
        const timelineText = govt.timeline
            .map((t) => `${t.date}: ${t.event}`)
            .join('\n')

        const entity: EntityData = {
            type: 'govt',
            slug,
            title: govt.title,
            summary: govt.summary,
            facts: [
                { label: 'Type', value: govtTypeLabels[govt.entityType] },
                { label: 'Country', value: govt.country },
                { label: 'Status', value: govt.currentStatus },
                ...govt.keyFacts,
            ],
            context: `${govt.background}\n\nTimeline:\n${timelineText}`,
            relevance: govt.relatedCountries.length > 0
                ? `Related countries: ${govt.relatedCountries.join(', ')}`
                : `This is a domestic ${govt.entityType} for ${govt.country}.`,
            updates: [],
            related: govt.relatedEntities.map((s) => ({
                type: 'govt' as EntityType,
                slug: s,
                title: s.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            })),
            sources: govt.sources,
            updatedAt: new Date(),
            ttl: govt.ttl,
        }
        entityCache.set(key, { data: entity, fetchedAt: Date.now() })
        return entity
    }

    // dynamic learn/knowledge entities
    if (type === 'learn') {
        if (!bypassCache && isCacheValid(key, 24)) {
            return entityCache.get(key)!.data
        }

        const { getKnowledgeBySlug } = await import('./knowledge')
        const knowledge = await getKnowledgeBySlug(slug, bypassCache)
        if (!knowledge) return null

        // build context from sections
        const sectionsText = knowledge.sections
            .map((s) => `## ${s.title}\n${s.content}`)
            .join('\n\n')

        const entity: EntityData = {
            type: 'learn',
            slug,
            title: knowledge.title,
            summary: knowledge.overview,
            facts: knowledge.keyFacts,
            context: sectionsText,
            relevance: knowledge.significance,
            updates: knowledge.timeline?.map((t) => ({
                title: t.event,
                summary: '',
                timestamp: t.date,
            })) || [],
            related: knowledge.relatedTopics.map((t: string) => ({
                type: 'learn' as EntityType,
                slug: t,
                title: t.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            })),
            sources: knowledge.sources,
            updatedAt: knowledge.lastUpdated,
            ttl: knowledge.ttl,
        }

            // attach extra learn data for enhanced rendering
            ; (entity as EntityData & { _learn?: typeof knowledge })._learn = knowledge

        entityCache.set(key, { data: entity, fetchedAt: Date.now() })
        return entity
    }

    const stored = entityStore[key]
    if (!stored) return null

    // Check cache
    if (!bypassCache && isCacheValid(key, stored.ttl)) {
        return entityCache.get(key)!.data
    }

    // Fetch fresh data (simulated)
    const freshData: EntityData = {
        ...stored,
        updatedAt: new Date(),
    }

    // Update cache
    entityCache.set(key, { data: freshData, fetchedAt: Date.now() })

    return freshData
}

export function getEntityPath(type: EntityType, slug: string): string {
    return `/entity/${type}/${slug}`
}

export function getCachedEntity(type: EntityType, slug: string): EntityData | null {
    const key = `${type}/${slug}`
    const cached = entityCache.get(key)
    return cached?.data || null
}

