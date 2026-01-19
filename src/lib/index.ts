export { fetchWithCache } from './fetch'
export {
    fetchHeadlines,
    NEWSAPI_COUNTRIES,
    type Headline,
    type NewsFilters,
    type NewsCountryCode,
} from './news'
export { fetchCryptoMarkets, type MarketData } from './markets'
export { fetchWeather, fetchClimateAlerts, type WeatherData, type ClimateAlert, type WeatherOptions } from './weather'
export { fetchAQI, healthImplications, aqiColors, categoryLabels, type AQIData, type AQICategory, type AQIOptions } from './aqi'
export { search, type SearchResult, type SearchResults, type IndiaResult, type LearnResult } from './search'
export { getEntity, getEntityPath, getCachedEntity, type EntityType, type EntityData, type EntityFact, type EntitySource } from './entity'
export { fetchWikipediaSummary, checkWikipediaTopic, type WikipediaArticle, type WikipediaImage, type WikipediaSection } from './wikipedia'
export { resolveSearchTopic, formatWithAtlas, generateKnowledgeEntity, type FormattedArticle, type ArticleSection, type KnowledgeEntity, type KnowledgeType } from './atlas'
export {
    getKnowledgeArticle,
    getKnowledgeBySlug,
    getTodayTopic,
    getFeaturedTopics,
    canGenerateArticle,
    topicToSlug,
} from './knowledge'
export { sendChatMessage, type ChatMessage } from './chat'
export { startScheduler, getLastRun } from './scheduler'
export { registerScheduledTasks } from './tasks'
