import { useEffect, useState } from 'react'
import { useUserContext } from '../hooks'
import { fetchAQI, healthImplications, aqiColors, categoryLabels, getCigaretteEquivalent, getSeverityLevel, type AQIData } from '../lib'
import { Loader } from '../components/Loader'
import { Wind, Droplets, Activity, AlertTriangle, Shield, Cigarette, MapPin } from 'lucide-react'
import './AirQuality.css'

// Pollutant info
const pollutantInfo = {
    pm25: {
        name: 'PM2.5',
        fullName: 'Fine Particulate Matter',
        description: 'Tiny particles that can penetrate deep into lungs and bloodstream',
        unit: 'μg/m³',
        icon: Droplets,
    },
    pm10: {
        name: 'PM10',
        fullName: 'Coarse Particulate Matter',
        description: 'Larger particles from dust, pollen, and mold',
        unit: 'μg/m³',
        icon: Wind,
    },
    no2: {
        name: 'NO₂',
        fullName: 'Nitrogen Dioxide',
        description: 'Gas from vehicle emissions and industrial processes',
        unit: 'μg/m³',
        icon: Activity,
    },
    o3: {
        name: 'O₃',
        fullName: 'Ozone',
        description: 'Ground-level ozone formed by sunlight and pollutants',
        unit: 'μg/m³',
        icon: Shield,
    },
}

// AQI scale segments
const aqiScale = [
    { label: 'Good', range: '0-20', color: '#00e400', description: 'Air quality is satisfactory' },
    { label: 'Moderate', range: '21-40', color: '#ffff00', description: 'Acceptable for most' },
    { label: 'Poor', range: '41-60', color: '#ff7e00', description: 'Sensitive groups affected' },
    { label: 'Unhealthy', range: '61-80', color: '#ff0000', description: 'Health effects possible' },
    { label: 'Very Poor', range: '81-100', color: '#8f3f97', description: 'Health alert' },
    { label: 'Hazardous', range: '100+', color: '#7e0023', description: 'Health emergency' },
]

// Health recommendations by category
const recommendations: Record<string, string[]> = {
    'good': [
        'Enjoy outdoor activities',
        'No special precautions needed',
        'Great day for exercise outside',
    ],
    'moderate': [
        'Unusually sensitive people should limit prolonged outdoor exertion',
        'Keep windows open for ventilation',
        'Monitor air quality if you have respiratory conditions',
    ],
    'unhealthy-sensitive': [
        'Sensitive groups should reduce prolonged outdoor exertion',
        'Keep outdoor activities short',
        'Consider wearing a mask if outdoors for long periods',
    ],
    'unhealthy': [
        'Everyone should reduce prolonged outdoor exertion',
        'Keep windows closed',
        'Use air purifiers indoors if available',
        'Wear N95 masks outdoors',
    ],
    'very-unhealthy': [
        'Avoid all outdoor activities',
        'Stay indoors with windows closed',
        'Use air purifiers',
        'Seek medical attention if experiencing symptoms',
    ],
    'hazardous': [
        'Stay indoors at all times',
        'Avoid all physical exertion',
        'Use air purifiers on highest setting',
        'Seek medical help if needed',
        'Consider temporary relocation',
    ],
}

export function AirQuality() {
    const { location } = useUserContext()
    const [data, setData] = useState<AQIData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        setLoading(true)
        setError(null)
        fetchAQI({
            lat: location.lat,
            lon: location.lon,
            name: location.city || location.country,
        })
            .then(setData)
            .catch(() => setError('Failed to load air quality data'))
            .finally(() => setLoading(false))
    }, [location.lat, location.lon, location.city, location.country])

    if (loading) {
        return (
            <div className="container aqi-page">
                <div className="aqi-loading">
                    <Loader size="lg" text="Loading air quality data..." />
                </div>
            </div>
        )
    }

    if (error || !data) {
        return (
            <div className="container aqi-page">
                <div className="aqi-page-header">
                    <h1>Air Quality</h1>
                    <p>{error || 'Unable to load air quality data'}</p>
                </div>
            </div>
        )
    }

    const color = aqiColors[data.category]
    const categoryLabel = categoryLabels[data.category]
    const severity = getSeverityLevel(data.category)
    const cigarette = getCigaretteEquivalent(data.pm25)
    const healthInfo = healthImplications[data.category]
    const recs = recommendations[data.category] || []

    return (
        <div className="container aqi-page">
            <header className="aqi-page-header">
                <h1>Air Quality Index</h1>
                <p className="aqi-page-location">
                    <MapPin size={14} />
                    {data.location}
                </p>
            </header>

            {/* Main AQI Display */}
            <section className="aqi-main" data-severity={severity}>
                <div className="aqi-main-value" style={{ color }}>
                    <span className="aqi-main-number">{data.aqi}</span>
                    <span className="aqi-main-label">European AQI</span>
                </div>
                <div className="aqi-main-info">
                    <span className="aqi-main-category" style={{ background: color }}>
                        {categoryLabel}
                    </span>
                    <p className="aqi-main-health">{healthInfo}</p>
                </div>
            </section>

            {/* Cigarette Equivalent */}
            <section className="aqi-cigarette-section">
                <div className="aqi-cigarette-card">
                    <Cigarette size={24} />
                    <div className="aqi-cigarette-info">
                        <span className="aqi-cigarette-value">{cigarette.text}</span>
                        <span className="aqi-cigarette-note">
                            Based on PM2.5 concentration of {data.pm25} μg/m³
                        </span>
                    </div>
                </div>
            </section>

            {/* Pollutant Breakdown */}
            <section className="aqi-pollutants">
                <h2>Pollutant Levels</h2>
                <div className="aqi-pollutants-grid">
                    {Object.entries(pollutantInfo).map(([key, info]) => {
                        const value = data[key as keyof typeof data] as number
                        const Icon = info.icon
                        return (
                            <div key={key} className="aqi-pollutant-card">
                                <div className="aqi-pollutant-header">
                                    <Icon size={18} />
                                    <span className="aqi-pollutant-name">{info.name}</span>
                                </div>
                                <div className="aqi-pollutant-value">
                                    <span className="aqi-pollutant-number">{value}</span>
                                    <span className="aqi-pollutant-unit">{info.unit}</span>
                                </div>
                                <p className="aqi-pollutant-desc">{info.fullName}</p>
                            </div>
                        )
                    })}
                </div>
            </section>

            {/* Health Recommendations */}
            <section className="aqi-recommendations">
                <h2>
                    <AlertTriangle size={18} />
                    Health Recommendations
                </h2>
                <ul className="aqi-recommendations-list">
                    {recs.map((rec, i) => (
                        <li key={i}>{rec}</li>
                    ))}
                </ul>
            </section>

            {/* AQI Scale Reference */}
            <section className="aqi-scale-section">
                <h2>AQI Scale</h2>
                <div className="aqi-scale-grid">
                    {aqiScale.map((item) => (
                        <div key={item.label} className="aqi-scale-item">
                            <div className="aqi-scale-color" style={{ background: item.color }} />
                            <div className="aqi-scale-info">
                                <span className="aqi-scale-label">{item.label}</span>
                                <span className="aqi-scale-range">{item.range}</span>
                            </div>
                            <p className="aqi-scale-desc">{item.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Data Source */}
            <footer className="aqi-footer">
                <p>Data source: Open-Meteo Air Quality API (European AQI)</p>
                <p className="aqi-footer-note">
                    Air quality can vary significantly within short distances.
                    This data provides a general overview for your area.
                </p>
            </footer>
        </div>
    )
}
