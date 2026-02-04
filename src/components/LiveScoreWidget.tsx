/**
 * Live Score Widget Component
 * Displays live cricket/sports scores with auto-refresh
 */

import { useState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import type { LiveMatch } from '../lib/sportsNews'
import './LiveScoreWidget.css'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface LiveScoreWidgetProps {
    matches: LiveMatch[]
    loading?: boolean
    onRefresh?: () => void
}

// ─────────────────────────────────────────────────────────────
// Live Score Widget
// ─────────────────────────────────────────────────────────────

export function LiveScoreWidget({ matches, loading, onRefresh }: LiveScoreWidgetProps) {
    const [refreshing, setRefreshing] = useState(false)

    const handleRefresh = async () => {
        setRefreshing(true)
        await onRefresh?.()
        setTimeout(() => setRefreshing(false), 1000)
    }

    if (loading) {
        return (
            <div className="live-score-widget live-score-widget--loading">
                <div className="live-score-widget__header">
                    <span className="skeleton-pulse" style={{ width: 100, height: 16 }} />
                </div>
                <div className="live-score-widget__content">
                    {[1, 2].map(i => (
                        <div key={i} className="live-score-match live-score-match--skeleton">
                            <div className="skeleton-pulse" style={{ width: '100%', height: 60 }} />
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    if (matches.length === 0) {
        return (
            <div className="live-score-widget live-score-widget--empty">
                <div className="live-score-widget__header">
                    <span className="live-score-widget__title">🏏 Live Cricket</span>
                </div>
                <div className="live-score-widget__empty-message">
                    No live matches right now
                </div>
            </div>
        )
    }

    return (
        <div className="live-score-widget">
            <div className="live-score-widget__header">
                <span className="live-score-widget__title">
                    <span className="live-indicator" />
                    Live Cricket
                </span>
                <button
                    className={`live-score-widget__refresh ${refreshing ? 'refreshing' : ''}`}
                    onClick={handleRefresh}
                    disabled={refreshing}
                >
                    <RefreshCw size={16} />
                </button>
            </div>

            <div className="live-score-widget__content">
                {matches.slice(0, 3).map((match, index) => (
                    <LiveMatchCard key={match.id || index} match={match} />
                ))}
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────
// Match Card
// ─────────────────────────────────────────────────────────────

function LiveMatchCard({ match }: { match: LiveMatch }) {
    return (
        <a
            href={typeof match.id === 'string' && match.id.startsWith('http') ? match.id : '#'}
            target="_blank"
            rel="noopener noreferrer"
            className={`live-score-match live-score-match--${match.status}`}
        >
            <div className="live-score-match__teams">
                <div className="live-score-match__team">
                    <span className="team-name">{match.team1}</span>
                    {match.score1 && <span className="team-score">{match.score1}</span>}
                </div>
                <span className="vs-badge">vs</span>
                <div className="live-score-match__team">
                    <span className="team-name">{match.team2}</span>
                    {match.score2 && <span className="team-score">{match.score2}</span>}
                </div>
            </div>

            <div className="live-score-match__status">
                {match.status === 'live' && (
                    <span className="status-badge status-badge--live">LIVE</span>
                )}
                {match.status === 'upcoming' && (
                    <span className="status-badge status-badge--upcoming">Upcoming</span>
                )}
                {match.status === 'completed' && (
                    <span className="status-badge status-badge--completed">Completed</span>
                )}
            </div>
        </a>
    )
}

// ─────────────────────────────────────────────────────────────
// Auto-refresh Hook
// ─────────────────────────────────────────────────────────────

export function useLiveScoreRefresh(
    fetchFn: () => Promise<LiveMatch[]>,
    intervalMs = 60000
) {
    const [matches, setMatches] = useState<LiveMatch[]>([])
    const [loading, setLoading] = useState(true)

    const refresh = async () => {
        try {
            const data = await fetchFn()
            setMatches(data)
        } catch (error) {
            console.error('Failed to fetch live scores:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        refresh()
        const interval = setInterval(refresh, intervalMs)
        return () => clearInterval(interval)
    }, [intervalMs])

    return { matches, loading, refresh }
}

