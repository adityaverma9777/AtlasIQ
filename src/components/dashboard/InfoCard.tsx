import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { RefreshCw } from 'lucide-react'
import './InfoCard.css'

interface InfoCardProps {
    label: string
    value?: string
    children?: ReactNode
    href?: string
    icon?: ReactNode
    loading?: boolean
    error?: string | null
    onRetry?: () => void
}

// Loading skeleton component
function CardSkeleton() {
    return (
        <div className="info-card-skeleton">
            <div className="skeleton-label" />
            <div className="skeleton-value" />
            <div className="skeleton-content" />
        </div>
    )
}

// Error state with retry button
function CardError({ message, onRetry }: { message: string; onRetry?: () => void }) {
    return (
        <div className="info-card-error">
            <span className="error-message">{message}</span>
            {onRetry && (
                <button className="retry-button" onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onRetry()
                }}>
                    <RefreshCw size={14} />
                    <span>Retry</span>
                </button>
            )}
        </div>
    )
}

export function InfoCard({ label, value, children, href, icon, loading, error, onRetry }: InfoCardProps) {
    // Skeleton loading state
    if (loading) {
        const content = (
            <div className="info-card-inner">
                <div className="info-card-text">
                    <span className="info-card-label">{label}</span>
                    <CardSkeleton />
                </div>
                {icon && <div className="info-card-icon skeleton-icon">{icon}</div>}
            </div>
        )

        if (href) {
            return <Link to={href} className="info-card info-card-link info-card-loading">{content}</Link>
        }
        return <article className="info-card info-card-loading">{content}</article>
    }

    // Error state
    if (error) {
        const content = (
            <div className="info-card-inner">
                <div className="info-card-text">
                    <span className="info-card-label">{label}</span>
                    <span className="info-card-value">—</span>
                    <CardError message="Couldn't load data" onRetry={onRetry} />
                </div>
            </div>
        )

        if (href) {
            return <Link to={href} className="info-card info-card-link info-card-error-state">{content}</Link>
        }
        return <article className="info-card info-card-error-state">{content}</article>
    }

    // Normal state
    const content = (
        <div className="info-card-inner">
            <div className="info-card-text">
                <span className="info-card-label">{label}</span>
                {value && <span className="info-card-value">{value}</span>}
                {children && <div className="info-card-content">{children}</div>}
            </div>
            {icon && <div className="info-card-icon">{icon}</div>}
        </div>
    )

    if (href) {
        return (
            <Link to={href} className="info-card info-card-link">
                {content}
            </Link>
        )
    }

    return <article className="info-card">{content}</article>
}
