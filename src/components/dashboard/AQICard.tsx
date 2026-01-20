import { Link } from 'react-router-dom'
import { aqiColors, categoryShortLabels, getCigaretteEquivalent, getSeverityLevel, type AQIData } from '../../lib'
import { Cigarette, RefreshCw } from 'lucide-react'
import './AQICard.css'

interface AQICardProps {
    data: AQIData | null
    loading?: boolean
    error?: string | null
    onRetry?: () => void
}

// Maps AQI value to position on the scale bar (0-100%)
function getScalePosition(aqi: number): number {
    const capped = Math.min(aqi, 120)
    return (capped / 120) * 100
}

function AQISkeleton() {
    return (
        <div className="aqi-card aqi-card-loading">
            <div className="aqi-card-header">
                <span className="aqi-card-label">Air Quality</span>
            </div>
            <div className="aqi-skeleton">
                <div className="skeleton-value" />
                <div className="skeleton-bar" />
                <div className="skeleton-text" />
            </div>
        </div>
    )
}

function AQIError({ onRetry }: { onRetry?: () => void }) {
    return (
        <div className="aqi-card aqi-card-error-state">
            <div className="aqi-card-header">
                <span className="aqi-card-label">Air Quality</span>
            </div>
            <span className="aqi-number" style={{ color: 'var(--color-text-muted)' }}>—</span>
            <div className="aqi-error">
                <span className="aqi-error-text">Couldn't load data</span>
                {onRetry && (
                    <button className="aqi-retry-button" onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        onRetry()
                    }}>
                        <RefreshCw size={12} />
                        <span>Retry</span>
                    </button>
                )}
            </div>
        </div>
    )
}

export function AQICard({ data, loading, error, onRetry }: AQICardProps) {
    if (loading) {
        return <AQISkeleton />
    }

    if (error || !data) {
        return <AQIError onRetry={onRetry} />
    }

    const color = aqiColors[data.category]
    const label = categoryShortLabels[data.category]
    const severity = getSeverityLevel(data.category)
    const cigarette = getCigaretteEquivalent(data.pm25)
    const scalePos = getScalePosition(data.aqi)

    return (
        <Link to="/air-quality" className="aqi-card" data-severity={severity}>
            <div className="aqi-card-header">
                <span className="aqi-card-label">Air Quality</span>
                <div className="aqi-cigarette">
                    <Cigarette />
                    <div className="aqi-smoke">
                        <span className="smoke-particle" />
                        <span className="smoke-particle" />
                        <span className="smoke-particle" />
                    </div>
                </div>
            </div>

            <div className="aqi-card-value">
                <span className="aqi-number" style={{ color }}>{data.aqi}</span>
            </div>

            <div className="aqi-scale-bar">
                <div className="aqi-scale-segment good" />
                <div className="aqi-scale-segment moderate" />
                <div className="aqi-scale-segment poor" />
                <div className="aqi-scale-segment very-poor" />
                <div className="aqi-scale-segment hazardous" />
                <div className="aqi-scale-pointer" style={{ left: `${scalePos}%` }} />
            </div>

            <span className="aqi-category" style={{ color }}>{label}</span>

            <div className="aqi-cigarette-text">
                <Cigarette />
                <span>{cigarette.text}</span>
            </div>

            <span className="aqi-location">{data.location}</span>
        </Link>
    )
}
