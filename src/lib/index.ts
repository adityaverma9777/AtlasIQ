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
export { fetchClimateAlerts as fetchRealClimateAlerts, type ClimateAlert as RealClimateAlert, type AlertType, type AlertSeverity, type AlertOptions } from './alerts'
export { fetchAQI, healthImplications, aqiColors, categoryLabels, categoryShortLabels, getCigaretteEquivalent, getSeverityLevel, type AQIData, type AQICategory, type AQIOptions } from './aqi'
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
export { lookupWord, type DictionaryEntry, type DictionaryResult, type Meaning, type Definition } from './dictionary'
export { translate, LANGUAGES, getLanguageName, type Language, type TranslateResult } from './translate'
export { convertUnit, convertCurrency, getCurrentTimeIn, getUnitsForCategory, getExchangeRates, UNITS, CURRENCIES, TIMEZONES, type UnitCategory, type UnitDef } from './convert'

// India News Engine
export { fetchIndiaNews, type IndiaNewsArticle } from './indiaNews'

// India Governance Engine
export * from './india'
