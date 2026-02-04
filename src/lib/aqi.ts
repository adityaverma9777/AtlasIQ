import { fetchWithCache } from './fetch'

export interface AQIData {
    aqi: number
    category: AQICategory
    pm25: number
    pm10: number
    no2: number
    o3: number
    location: string
}

export type AQICategory = 'good' | 'moderate' | 'unhealthy-sensitive' | 'unhealthy' | 'very-unhealthy' | 'hazardous'

interface OpenMeteoAQIResponse {
    current: {
        european_aqi: number
        pm2_5: number
        pm10: number
        nitrogen_dioxide: number
        ozone: number
    }
}

// AQI category thresholds (European AQI scale)
function getCategory(aqi: number): AQICategory {
    if (aqi <= 20) return 'good'
    if (aqi <= 40) return 'moderate'
    if (aqi <= 60) return 'unhealthy-sensitive'
    if (aqi <= 80) return 'unhealthy'
    if (aqi <= 100) return 'very-unhealthy'
    return 'hazardous'
}

// health implications by category
export const healthImplications: Record<AQICategory, string> = {
    'good': 'Air quality is satisfactory. Outdoor activities are safe for everyone.',
    'moderate': 'Air quality is acceptable. Unusually sensitive people should limit prolonged outdoor exertion.',
    'unhealthy-sensitive': 'Members of sensitive groups may experience health effects. General public is less likely to be affected.',
    'unhealthy': 'Everyone may begin to experience health effects. Sensitive groups may experience more serious effects.',
    'very-unhealthy': 'Health alert: everyone may experience more serious health effects.',
    'hazardous': 'Health emergency. The entire population is likely to be affected.',
}

// color codes for display
export const aqiColors: Record<AQICategory, string> = {
    'good': '#00e400',
    'moderate': '#ffff00',
    'unhealthy-sensitive': '#ff7e00',
    'unhealthy': '#ff0000',
    'very-unhealthy': '#8f3f97',
    'hazardous': '#7e0023',
}

// category labels
export const categoryLabels: Record<AQICategory, string> = {
    'good': 'Good',
    'moderate': 'Moderate',
    'unhealthy-sensitive': 'Unhealthy for Sensitive Groups',
    'unhealthy': 'Unhealthy',
    'very-unhealthy': 'Very Unhealthy',
    'hazardous': 'Hazardous',
}

// Short labels for compact display
export const categoryShortLabels: Record<AQICategory, string> = {
    'good': 'Good',
    'moderate': 'Moderate',
    'unhealthy-sensitive': 'Poor',
    'unhealthy': 'Unhealthy',
    'very-unhealthy': 'Very Poor',
    'hazardous': 'Hazardous',
}

/**
 * Convert PM2.5 concentration to equivalent cigarettes per day.
 * Based on Berkeley Earth study: 22 μg/m³ PM2.5 ≈ 1 cigarette/day
 * Reference: https://berkeleyearth.org/air-pollution-and-cigarette-equivalence/
 */
export function getCigaretteEquivalent(pm25: number): { count: number; text: string } {
    const cigarettes = pm25 / 22
    const rounded = Math.round(cigarettes * 10) / 10

    if (rounded < 0.5) {
        return { count: rounded, text: 'Minimal exposure' }
    } else if (rounded < 1) {
        return { count: rounded, text: `~${rounded} cigarette/day equivalent` }
    } else {
        const display = rounded >= 10 ? Math.round(rounded) : rounded
        return { count: rounded, text: `~${display} cigarettes/day equivalent` }
    }
}

/**
 * Get severity level (0-4) for animation intensity
 */
export function getSeverityLevel(category: AQICategory): number {
    const levels: Record<AQICategory, number> = {
        'good': 0,
        'moderate': 1,
        'unhealthy-sensitive': 2,
        'unhealthy': 3,
        'very-unhealthy': 4,
        'hazardous': 5,
    }
    return levels[category]
}

export interface AQIOptions {
    lat: number
    lon: number
    name?: string
    bypassCache?: boolean
}

export async function fetchAQI(opts: AQIOptions): Promise<AQIData> {
    const { lat, lon, name = 'Your Location', bypassCache = false } = opts

    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi,pm2_5,pm10,nitrogen_dioxide,ozone`

    const data = await fetchWithCache<OpenMeteoAQIResponse>(url, {
        cacheMinutes: 60,
        bypassCache,
    })

    const aqi = Math.round(data.current.european_aqi)
    const category = getCategory(aqi)

    return {
        aqi,
        category,
        pm25: Math.round(data.current.pm2_5),
        pm10: Math.round(data.current.pm10),
        no2: Math.round(data.current.nitrogen_dioxide),
        o3: Math.round(data.current.ozone),
        location: name,
    }
}

