import { fetchWithCache } from './fetch'

export interface WeatherData {
    location: string
    temperature: number
    condition: string
}

export interface ClimateAlert {
    title: string
    severity: 'moderate' | 'severe' | 'extreme'
}

interface OpenMeteoResponse {
    current: {
        temperature_2m: number
        weather_code: number
    }
}

function getCondition(code: number): string {
    if (code === 0) return 'Clear'
    if (code <= 3) return 'Partly cloudy'
    if (code <= 49) return 'Foggy'
    if (code <= 59) return 'Drizzle'
    if (code <= 69) return 'Rain'
    if (code <= 79) return 'Snow'
    if (code <= 84) return 'Showers'
    if (code <= 94) return 'Thunderstorm'
    return 'Severe weather'
}

// Default location fallback
const DEFAULT_LOCATION = { lat: 28.6139, lon: 77.209, name: 'New Delhi' }

export interface WeatherOptions {
    lat?: number
    lon?: number
    name?: string
    bypassCache?: boolean
}

export async function fetchWeather(opts: WeatherOptions = {}): Promise<WeatherData> {
    const lat = opts.lat ?? DEFAULT_LOCATION.lat
    const lon = opts.lon ?? DEFAULT_LOCATION.lon
    const name = opts.name ?? DEFAULT_LOCATION.name
    const bypassCache = opts.bypassCache ?? false

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`

    const data = await fetchWithCache<OpenMeteoResponse>(url, { cacheMinutes: 10, bypassCache })

    return {
        location: name,
        temperature: Math.round(data.current.temperature_2m),
        condition: getCondition(data.current.weather_code),
    }
}

export async function fetchClimateAlerts(opts: WeatherOptions = {}): Promise<ClimateAlert[]> {
    const weather = await fetchWeather(opts)

    const alerts: ClimateAlert[] = []

    if (weather.condition === 'Thunderstorm') {
        alerts.push({ title: 'Thunderstorm warning in effect', severity: 'severe' })
    }
    if (weather.condition === 'Severe weather') {
        alerts.push({ title: 'Extreme weather alert', severity: 'extreme' })
    }
    if (weather.temperature > 40) {
        alerts.push({ title: 'Heat advisory in effect', severity: 'moderate' })
    }
    if (weather.temperature < 5) {
        alerts.push({ title: 'Cold weather alert', severity: 'moderate' })
    }

    return alerts.slice(0, 3)
}
