import type { ReactNode } from 'react'
import './SectionHeader.css'

interface SectionHeaderProps {
    title: string
    subtitle?: ReactNode
    updatedAt?: Date | null
    onRefresh?: () => void
    loading?: boolean
}

function formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function SectionHeader({
    title,
    subtitle,
    updatedAt,
    onRefresh,
    loading,
}: SectionHeaderProps) {
    return (
        <header className="section-header">
            <div className="section-header-content">
                <h2>{title}</h2>
                {subtitle && <p className="section-header-sub">{subtitle}</p>}
            </div>

            {(updatedAt || onRefresh) && (
                <div className="section-header-meta">
                    {updatedAt && (
                        <span className="section-header-time">Updated {formatTime(updatedAt)}</span>
                    )}
                    {onRefresh && (
                        <button
                            className="refresh-btn"
                            onClick={onRefresh}
                            disabled={loading}
                            aria-label="Refresh"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M4 4v5h5M20 20v-5h-5" />
                                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L4 9m16 6l-1.64 3.36A9 9 0 0 1 3.51 15" />
                            </svg>
                        </button>
                    )}
                </div>
            )}
        </header>
    )
}
