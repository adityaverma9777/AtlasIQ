import { fetchWithCache } from './fetch'

export interface WeatherData {
    location: string
    temperature: number
    condition: string
    weatherCode: number
}

export interface ClimateAlert {
    title: string
    severity: 'moderate' | 'severe' | 'extreme'
}

// hourly forecast item
export interface HourlyForecast {
    time: string
    temperature: number
    weatherCode: number
}

// daily forecast item
export interface DailyForecast {
    date: string
    tempMax: number
    tempMin: number
    weatherCode: number
    sunrise: string
    sunset: string
}

// detailed weather for full page
export interface DetailedWeather {
    location: string
    current: {
        temperature: number
        feelsLike: number
        humidity: number
        windSpeed: number
        windDirection: number
        weatherCode: number
        condition: string
    }
    hourly: HourlyForecast[]
    daily: DailyForecast[]
    sunrise: string
    sunset: string
}

interface OpenMeteoResponse {
    current: {
        temperature_2m: number
        weather_code: number
    }
}

interface OpenMeteoDetailedResponse {
    current: {
        temperature_2m: number
        apparent_temperature: number
        relative_humidity_2m: number
        wind_speed_10m: number
        wind_direction_10m: number
        weather_code: number
    }
    hourly: {
        time: string[]
        temperature_2m: number[]
        weather_code: number[]
    }
    daily: {
        time: string[]
        temperature_2m_max: number[]
        temperature_2m_min: number[]
        weather_code: number[]
        sunrise: string[]
        sunset: string[]
    }
}

export function getCondition(code: number): string {
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
        weatherCode: data.current.weather_code,
    }
}

// fetch detailed weather with forecast
export async function fetchDetailedWeather(opts: WeatherOptions = {}): Promise<DetailedWeather> {
    const lat = opts.lat ?? DEFAULT_LOCATION.lat
    const lon = opts.lon ?? DEFAULT_LOCATION.lon
    const name = opts.name ?? DEFAULT_LOCATION.name
    const bypassCache = opts.bypassCache ?? false

    const params = [
        `latitude=${lat}`,
        `longitude=${lon}`,
        'current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code',
        'hourly=temperature_2m,weather_code',
        'daily=temperature_2m_max,temperature_2m_min,weather_code,sunrise,sunset',
        'timezone=auto',
        'forecast_days=10',
    ].join('&')

    const url = `https://api.open-meteo.com/v1/forecast?${params}`
    const data = await fetchWithCache<OpenMeteoDetailedResponse>(url, { cacheMinutes: 15, bypassCache })

    // get next 24 hours
    const now = new Date()
    const hourly: HourlyForecast[] = []
    for (let i = 0; i < Math.min(24, data.hourly.time.length); i++) {
        const t = new Date(data.hourly.time[i])
        if (t >= now) {
            hourly.push({
                time: data.hourly.time[i],
                temperature: Math.round(data.hourly.temperature_2m[i]),
                weatherCode: data.hourly.weather_code[i],
            })
        }
        if (hourly.length >= 24) break
    }

    const daily: DailyForecast[] = data.daily.time.map((date, i) => ({
        date,
        tempMax: Math.round(data.daily.temperature_2m_max[i]),
        tempMin: Math.round(data.daily.temperature_2m_min[i]),
        weatherCode: data.daily.weather_code[i],
        sunrise: data.daily.sunrise[i],
        sunset: data.daily.sunset[i],
    }))

    return {
        location: name,
        current: {
            temperature: Math.round(data.current.temperature_2m),
            feelsLike: Math.round(data.current.apparent_temperature),
            humidity: Math.round(data.current.relative_humidity_2m),
            windSpeed: Math.round(data.current.wind_speed_10m),
            windDirection: Math.round(data.current.wind_direction_10m),
            weatherCode: data.current.weather_code,
            condition: getCondition(data.current.weather_code),
        },
        hourly,
        daily,
        sunrise: data.daily.sunrise[0] || '',
        sunset: data.daily.sunset[0] || '',
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

