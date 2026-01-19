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

/**
 * Calculate pointer position on scale bar (0-100%)
 * European AQI scale: 0-20 Good, 20-40 Moderate, 40-60 Poor, 60-80 Unhealthy, 80-100+ Hazardous
 */
function getScalePosition(aqi: number): number {
    // Map AQI to percentage (capped at 120 for display)
    const capped = Math.min(aqi, 120)
    return (capped / 120) * 100
}

// Skeleton loading state
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

// Error state with retry
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
            {/* Header with label and animated cigarette icon */}
            <div className="aqi-card-header">
                <span className="aqi-card-label">Air Quality</span>
                <div className="aqi-cigarette">
                    <Cigarette />
                    {/* Smoke particles - animated based on severity */}
                    <div className="aqi-smoke">
                        <span className="smoke-particle" />
                        <span className="smoke-particle" />
                        <span className="smoke-particle" />
                    </div>
                </div>
            </div>

            {/* Main AQI value */}
            <div className="aqi-card-value">
                <span className="aqi-number" style={{ color }}>{data.aqi}</span>
            </div>

            {/* Scale bar with pointer */}
            <div className="aqi-scale-bar">
                <div className="aqi-scale-segment good" />
                <div className="aqi-scale-segment moderate" />
                <div className="aqi-scale-segment poor" />
                <div className="aqi-scale-segment very-poor" />
                <div className="aqi-scale-segment hazardous" />
                <div className="aqi-scale-pointer" style={{ left: `${scalePos}%` }} />
            </div>

            {/* Category label */}
            <span className="aqi-category" style={{ color }}>{label}</span>

            {/* Cigarette equivalent */}
            <div className="aqi-cigarette-text">
                <Cigarette />
                <span>{cigarette.text}</span>
            </div>

            {/* Location */}
            <span className="aqi-location">{data.location}</span>
        </Link>
    )
}
