import { Link } from 'react-router-dom'
import { aqiColors, categoryLabels, type AQIData } from '../../lib'
import { getEntityPath } from '../../lib'
import { cityToSlug } from '../../data'
import { InlineLoader } from '../Loader'
import './AQICard.css'

interface AQICardProps {
    data: AQIData | null
    loading?: boolean
    error?: string | null
}

export function AQICard({ data, loading, error }: AQICardProps) {
    if (loading) {
        return (
            <div className="aqi-card">
                <span className="aqi-card-label">Air Quality</span>
                <InlineLoader />
            </div>
        )
    }

    if (error || !data) {
        return (
            <div className="aqi-card">
                <span className="aqi-card-label">Air Quality</span>
                <span className="aqi-loading">Unable to fetch</span>
            </div>
        )
    }

    const color = aqiColors[data.category]
    const label = categoryLabels[data.category]
    const slug = cityToSlug(data.location)

    return (
        <Link to={getEntityPath('air-quality', slug)} className="aqi-card">
            <div className="aqi-card-header">
                <span className="aqi-card-label">Air Quality</span>
                <span className="aqi-indicator" style={{ backgroundColor: color }} />
            </div>
            <div className="aqi-card-value">
                <span className="aqi-number" style={{ color }}>{data.aqi}</span>
            </div>
            <span className="aqi-category" style={{ color }}>{label}</span>
            <span className="aqi-location">{data.location}</span>
        </Link>
    )
}
