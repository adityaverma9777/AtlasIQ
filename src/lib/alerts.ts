/**
 * Climate Alerts Module
 * Generates real-time climate alerts from multiple data sources:
 * - Open-Meteo weather data (temperature, conditions, wind)
 * - Open-Meteo AQI data (air quality warnings)
 * - Intelligent thresholds based on location context
 */

import { fetchWithCache } from './fetch'

export type AlertType = 'heatwave' | 'storm' | 'flood' | 'cold' | 'air-quality' | 'wind' | 'fog' | 'snow'
export type AlertSeverity = 'info' | 'warning' | 'danger'

export interface ClimateAlert {
    id: string
    type: AlertType
    title: string
    summary: string
    severity: AlertSeverity
    icon: string // lucide-react icon name
    expiresAt?: Date
}

export interface AlertOptions {
    lat: number
    lon: number
    name?: string
    bypassCache?: boolean
}

// Weather response with extended data for alerts
interface WeatherAlertResponse {
    current: {
        temperature_2m: number
        apparent_temperature: number
        relative_humidity_2m: number
        weather_code: number
        wind_speed_10m: number
        wind_gusts_10m: number
    }
    daily: {
        time: string[]
        temperature_2m_max: number[]
        temperature_2m_min: number[]
        weather_code: number[]
        precipitation_sum: number[]
        wind_speed_10m_max: number[]
    }
}

// AQI response for air quality alerts
interface AQIAlertResponse {
    current: {
        european_aqi: number
        pm2_5: number
        pm10: number
        uv_index: number
    }
}

// Alert thresholds - can be adjusted for different regions
const THRESHOLDS = {
    heatwave: { temp: 40, feelsLike: 42 },
    extremeHeat: { temp: 45 },
    cold: { temp: 5 },
    extremeCold: { temp: 0 },
    wind: { speed: 50, gusts: 80 },
    stormWind: { speed: 70, gusts: 100 },
    heavyRain: { mm: 50 },
    extremeRain: { mm: 100 },
    aqi: { poor: 60, unhealthy: 80, hazardous: 100 },
    uv: { high: 8, extreme: 11 },
}

// Weather codes that indicate severe conditions
const SEVERE_WEATHER_CODES = {
    thunderstorm: [95, 96, 99],
    heavyRain: [65, 67, 82],
    snow: [71, 73, 75, 77, 85, 86],
    fog: [45, 48],
    freezingRain: [66, 67],
}

function generateAlertId(type: string, severity: string): string {
    return `${type}-${severity}-${Date.now()}`
}

function getWeatherCodeAlerts(code: number): ClimateAlert[] {
    const alerts: ClimateAlert[] = []

    // Thunderstorm alerts
    if (SEVERE_WEATHER_CODES.thunderstorm.includes(code)) {
        alerts.push({
            id: generateAlertId('storm', code === 99 ? 'danger' : 'warning'),
            type: 'storm',
            title: code === 99 ? 'Severe Thunderstorm' : 'Thunderstorm Warning',
            summary: code === 99
                ? 'Severe thunderstorm with heavy hail. Seek shelter immediately.'
                : 'Thunderstorm activity in your area. Stay indoors if possible.',
            severity: code === 99 ? 'danger' : 'warning',
            icon: 'CloudLightning',
        })
    }

    // Heavy rain / flood risk
    if (SEVERE_WEATHER_CODES.heavyRain.includes(code)) {
        alerts.push({
            id: generateAlertId('flood', 'warning'),
            type: 'flood',
            title: 'Heavy Rain Warning',
            summary: 'Heavy rainfall may cause localized flooding. Avoid low-lying areas.',
            severity: 'warning',
            icon: 'CloudRain',
        })
    }

    // Snow alerts
    if (SEVERE_WEATHER_CODES.snow.includes(code)) {
        const isHeavy = [75, 77, 86].includes(code)
        alerts.push({
            id: generateAlertId('snow', isHeavy ? 'warning' : 'info'),
            type: 'snow',
            title: isHeavy ? 'Heavy Snow Warning' : 'Snow Advisory',
            summary: isHeavy
                ? 'Heavy snowfall expected. Travel may be hazardous.'
                : 'Light to moderate snow expected. Plan accordingly.',
            severity: isHeavy ? 'warning' : 'info',
            icon: 'Snowflake',
        })
    }

    // Fog alerts
    if (SEVERE_WEATHER_CODES.fog.includes(code)) {
        alerts.push({
            id: generateAlertId('fog', 'info'),
            type: 'fog',
            title: 'Dense Fog Advisory',
            summary: 'Reduced visibility due to fog. Drive with caution.',
            severity: 'info',
            icon: 'CloudFog',
        })
    }

    return alerts
}

function getTemperatureAlerts(temp: number, feelsLike: number): ClimateAlert[] {
    const alerts: ClimateAlert[] = []

    // Extreme heat
    if (temp >= THRESHOLDS.extremeHeat.temp) {
        alerts.push({
            id: generateAlertId('heatwave', 'danger'),
            type: 'heatwave',
            title: 'Extreme Heat Emergency',
            summary: `Dangerously high temperatures of ${temp}°C. Stay indoors, hydrate, and check on vulnerable individuals.`,
            severity: 'danger',
            icon: 'Thermometer',
        })
    } else if (temp >= THRESHOLDS.heatwave.temp || feelsLike >= THRESHOLDS.heatwave.feelsLike) {
        alerts.push({
            id: generateAlertId('heatwave', 'warning'),
            type: 'heatwave',
            title: 'Heat Advisory',
            summary: `High temperatures of ${temp}°C (feels like ${feelsLike}°C). Limit outdoor activities.`,
            severity: 'warning',
            icon: 'Sun',
        })
    }

    // Extreme cold
    if (temp <= THRESHOLDS.extremeCold.temp) {
        alerts.push({
            id: generateAlertId('cold', 'danger'),
            type: 'cold',
            title: 'Extreme Cold Warning',
            summary: `Dangerously cold temperatures of ${temp}°C. Risk of frostbite and hypothermia.`,
            severity: 'danger',
            icon: 'Snowflake',
        })
    } else if (temp <= THRESHOLDS.cold.temp) {
        alerts.push({
            id: generateAlertId('cold', 'info'),
            type: 'cold',
            title: 'Cold Weather Advisory',
            summary: `Cold temperatures of ${temp}°C. Dress warmly and limit exposure.`,
            severity: 'info',
            icon: 'Thermometer',
        })
    }

    return alerts
}

function getWindAlerts(speed: number, gusts: number): ClimateAlert[] {
    const alerts: ClimateAlert[] = []

    if (gusts >= THRESHOLDS.stormWind.gusts || speed >= THRESHOLDS.stormWind.speed) {
        alerts.push({
            id: generateAlertId('wind', 'danger'),
            type: 'wind',
            title: 'High Wind Warning',
            summary: `Damaging winds up to ${Math.round(gusts)} km/h. Secure loose objects and avoid travel.`,
            severity: 'danger',
            icon: 'Wind',
        })
    } else if (gusts >= THRESHOLDS.wind.gusts || speed >= THRESHOLDS.wind.speed) {
        alerts.push({
            id: generateAlertId('wind', 'warning'),
            type: 'wind',
            title: 'Wind Advisory',
            summary: `Strong winds of ${Math.round(speed)} km/h with gusts up to ${Math.round(gusts)} km/h.`,
            severity: 'warning',
            icon: 'Wind',
        })
    }

    return alerts
}

function getAQIAlerts(aqi: number, pm25: number): ClimateAlert[] {
    const alerts: ClimateAlert[] = []

    if (aqi >= THRESHOLDS.aqi.hazardous) {
        alerts.push({
            id: generateAlertId('air-quality', 'danger'),
            type: 'air-quality',
            title: 'Hazardous Air Quality',
            summary: `AQI ${aqi} - Health emergency. Everyone should avoid outdoor activities.`,
            severity: 'danger',
            icon: 'Wind',
        })
    } else if (aqi >= THRESHOLDS.aqi.unhealthy) {
        alerts.push({
            id: generateAlertId('air-quality', 'warning'),
            type: 'air-quality',
            title: 'Unhealthy Air Quality',
            summary: `AQI ${aqi} - Sensitive groups should limit outdoor exposure. PM2.5: ${pm25} μg/m³.`,
            severity: 'warning',
            icon: 'Wind',
        })
    } else if (aqi >= THRESHOLDS.aqi.poor) {
        alerts.push({
            id: generateAlertId('air-quality', 'info'),
            type: 'air-quality',
            title: 'Moderate Air Quality',
            summary: `AQI ${aqi} - Air quality is acceptable but may affect sensitive individuals.`,
            severity: 'info',
            icon: 'Wind',
        })
    }

    return alerts
}

function getUVAlerts(uvIndex: number): ClimateAlert[] {
    const alerts: ClimateAlert[] = []

    if (uvIndex >= THRESHOLDS.uv.extreme) {
        alerts.push({
            id: generateAlertId('uv', 'danger'),
            type: 'heatwave',
            title: 'Extreme UV Index',
            summary: `UV Index ${uvIndex} - Avoid sun exposure between 10 AM and 4 PM. Sunburn in minutes.`,
            severity: 'danger',
            icon: 'Sun',
        })
    } else if (uvIndex >= THRESHOLDS.uv.high) {
        alerts.push({
            id: generateAlertId('uv', 'warning'),
            type: 'heatwave',
            title: 'High UV Index',
            summary: `UV Index ${uvIndex} - Use SPF 30+ sunscreen and wear protective clothing.`,
            severity: 'warning',
            icon: 'Sun',
        })
    }

    return alerts
}

/**
 * Fetch comprehensive climate alerts from multiple data sources
 */
export async function fetchClimateAlerts(opts: AlertOptions): Promise<ClimateAlert[]> {
    const { lat, lon, bypassCache = false } = opts

    const alerts: ClimateAlert[] = []

    try {
        // Fetch weather data with extended parameters
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_gusts_10m&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum,wind_speed_10m_max&timezone=auto&forecast_days=3`

        const weatherData = await fetchWithCache<WeatherAlertResponse>(weatherUrl, {
            cacheMinutes: 15,
            bypassCache,
        })

        const current = weatherData.current

        // Weather code alerts (storms, fog, snow)
        alerts.push(...getWeatherCodeAlerts(current.weather_code))

        // Temperature alerts
        alerts.push(...getTemperatureAlerts(current.temperature_2m, current.apparent_temperature))

        // Wind alerts
        alerts.push(...getWindAlerts(current.wind_speed_10m, current.wind_gusts_10m))

        // Check forecast for upcoming severe conditions
        if (weatherData.daily) {
            const tomorrow = weatherData.daily
            if (tomorrow.temperature_2m_max[1] >= THRESHOLDS.heatwave.temp) {
                alerts.push({
                    id: generateAlertId('heatwave-forecast', 'info'),
                    type: 'heatwave',
                    title: 'Heat Advisory Tomorrow',
                    summary: `Tomorrow's high: ${Math.round(tomorrow.temperature_2m_max[1])}°C. Plan to stay cool.`,
                    severity: 'info',
                    icon: 'Sun',
                })
            }
            if (tomorrow.precipitation_sum[0] >= THRESHOLDS.heavyRain.mm) {
                alerts.push({
                    id: generateAlertId('rain-forecast', 'warning'),
                    type: 'flood',
                    title: 'Heavy Rain Expected',
                    summary: `${Math.round(tomorrow.precipitation_sum[0])}mm rainfall expected. Possible flooding.`,
                    severity: 'warning',
                    icon: 'CloudRain',
                })
            }
        }

    } catch (error) {
        console.error('Failed to fetch weather alerts:', error)
    }

    try {
        // Fetch AQI data for air quality alerts
        const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi,pm2_5,pm10,uv_index`

        const aqiData = await fetchWithCache<AQIAlertResponse>(aqiUrl, {
            cacheMinutes: 30,
            bypassCache,
        })

        // AQI alerts
        alerts.push(...getAQIAlerts(aqiData.current.european_aqi, aqiData.current.pm2_5))

        // UV alerts
        if (aqiData.current.uv_index) {
            alerts.push(...getUVAlerts(aqiData.current.uv_index))
        }

    } catch (error) {
        console.error('Failed to fetch AQI alerts:', error)
    }

    // Sort by severity (danger > warning > info) and limit to 5
    const severityOrder: Record<AlertSeverity, number> = { danger: 0, warning: 1, info: 2 }
    alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

    return alerts.slice(0, 5)
}

/**
 * Get icon component name for alert type
 */
export function getAlertIcon(type: AlertType): string {
    const icons: Record<AlertType, string> = {
        heatwave: 'Sun',
        storm: 'CloudLightning',
        flood: 'CloudRain',
        cold: 'Snowflake',
        'air-quality': 'Wind',
        wind: 'Wind',
        fog: 'CloudFog',
        snow: 'Snowflake',
    }
    return icons[type]
}

