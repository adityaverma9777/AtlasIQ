import { useEffect, useState, type ReactNode } from 'react'
import { useUserContext } from '../hooks'
import { fetchDetailedWeather, getCondition, type DetailedWeather } from '../lib/weather'
import { Loader } from '../components/Loader'
import {
    Sun, Cloud, CloudRain, CloudLightning, CloudSnow, CloudFog, Snowflake,
    Thermometer, Droplets, Wind, Sunrise, Sunset, Compass
} from 'lucide-react'
import './Weather.css'

// weather code to icon
function getWeatherIcon(code: number, size = 24): ReactNode {
    const props = { width: size, height: size }
    if (code === 0) return <Sun {...props} />
    if (code <= 3) return <Cloud {...props} />
    if (code <= 49) return <CloudFog {...props} />
    if (code <= 69) return <CloudRain {...props} />
    if (code <= 79) return <Snowflake {...props} />
    if (code <= 84) return <CloudSnow {...props} />
    if (code <= 94) return <CloudLightning {...props} />
    return <Cloud {...props} />
}

// format time from ISO string
function formatHour(iso: string): string {
    const d = new Date(iso)
    return d.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })
}

// format date
function formatDay(iso: string): string {
    const d = new Date(iso)
    const today = new Date()
    if (d.toDateString() === today.toDateString()) return 'Today'
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

// format sunrise/sunset time
function formatSunTime(iso: string): string {
    const d = new Date(iso)
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

// wind direction to compass
function windDirection(deg: number): string {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
    return dirs[Math.round(deg / 45) % 8]
}

export function Weather() {
    const { location } = useUserContext()
    const [data, setData] = useState<DetailedWeather | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        setLoading(true)
        setError(null)
        fetchDetailedWeather({
            lat: location.lat,
            lon: location.lon,
            name: location.city || location.country,
        })
            .then(setData)
            .catch(() => setError('Failed to load weather'))
            .finally(() => setLoading(false))
    }, [location.lat, location.lon, location.city, location.country])

    if (loading) {
        return (
            <div className="container weather-page">
                <div className="weather-loading">
                    <Loader size="lg" text="Loading weather..." />
                </div>
            </div>
        )
    }

    if (error || !data) {
        return (
            <div className="container weather-page">
                <div className="weather-header">
                    <h1>Weather</h1>
                    <p>{error || 'Unable to load weather data'}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="container weather-page">
            <header className="weather-header">
                <h1>{data.location} Weather</h1>
                <p>10-day forecast and hourly updates</p>
            </header>

            {/* Current Weather */}
            <div className="weather-current">
                <div className="current-main">
                    <div className="current-temp">{data.current.temperature}°</div>
                    <div className="current-condition">{data.current.condition}</div>
                </div>

                <div className="weather-metrics">
                    <div className="metric-card">
                        <span className="metric-icon"><Thermometer /></span>
                        <span className="metric-value">{data.current.feelsLike}°</span>
                        <span className="metric-label">Feels Like</span>
                    </div>
                    <div className="metric-card">
                        <span className="metric-icon"><Droplets /></span>
                        <span className="metric-value">{data.current.humidity}%</span>
                        <span className="metric-label">Humidity</span>
                    </div>
                    <div className="metric-card">
                        <span className="metric-icon"><Wind /></span>
                        <span className="metric-value">{data.current.windSpeed} km/h</span>
                        <span className="metric-label">Wind</span>
                    </div>
                    <div className="metric-card">
                        <span className="metric-icon"><Compass /></span>
                        <span className="metric-value">{windDirection(data.current.windDirection)}</span>
                        <span className="metric-label">Direction</span>
                    </div>
                    <div className="metric-card">
                        <span className="metric-icon"><Sunrise /></span>
                        <span className="metric-value">{formatSunTime(data.sunrise)}</span>
                        <span className="metric-label">Sunrise</span>
                    </div>
                    <div className="metric-card">
                        <span className="metric-icon"><Sunset /></span>
                        <span className="metric-value">{formatSunTime(data.sunset)}</span>
                        <span className="metric-label">Sunset</span>
                    </div>
                </div>

                <div className="current-icon">
                    {getWeatherIcon(data.current.weatherCode, 80)}
                </div>
            </div>

            {/* Hourly Forecast */}
            <section className="weather-hourly">
                <h2 className="section-title">Next 24 Hours</h2>
                <div className="hourly-scroll">
                    {data.hourly.slice(0, 24).map((h, i) => (
                        <div key={i} className="hourly-item">
                            <div className="hourly-time">{formatHour(h.time)}</div>
                            <div className="hourly-icon">{getWeatherIcon(h.weatherCode, 24)}</div>
                            <div className="hourly-temp">{h.temperature}°</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Daily Forecast */}
            <section className="weather-daily">
                <h2 className="section-title">10-Day Forecast</h2>
                <div className="daily-list">
                    {data.daily.map((d, i) => (
                        <div key={i} className="daily-row">
                            <span className="daily-day">{formatDay(d.date)}</span>
                            <span className="daily-icon">{getWeatherIcon(d.weatherCode, 24)}</span>
                            <div className="daily-bar" />
                            <span className="daily-temps">
                                <span className="daily-high">{d.tempMax}°</span>
                                <span className="daily-low">{d.tempMin}°</span>
                            </span>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
}
