/**
 * Video Card Component
 * YouTube video card with autoplay on hover
 */

import { useState, useRef, useCallback } from 'react'
import { Play, Clock } from 'lucide-react'
import './VideoCard.css'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface VideoCardProps {
    id: string
    title: string
    channelName: string
    thumbnail: string
    duration?: string
    viewCount?: string
    publishedAt?: string
    embedUrl?: string
    size?: 'small' | 'medium' | 'large'
    onClick?: () => void
}

// ─────────────────────────────────────────────────────────────
// Video Card Component
// ─────────────────────────────────────────────────────────────

export function VideoCard({
    id,
    title,
    channelName,
    thumbnail,
    duration,
    viewCount,
    size = 'medium',
    onClick,
}: VideoCardProps) {
    const [isHovering, setIsHovering] = useState(false)
    const [showEmbed, setShowEmbed] = useState(false)
    const hoverTimeoutRef = useRef<number | null>(null)

    const handleMouseEnter = useCallback(() => {
        hoverTimeoutRef.current = window.setTimeout(() => {
            setIsHovering(true)
            setShowEmbed(true)
        }, 800) // Delay before autoplay
    }, [])

    const handleMouseLeave = useCallback(() => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current)
        }
        setIsHovering(false)
        setShowEmbed(false)
    }, [])

    const handleClick = () => {
        // Open in new tab
        window.open(`https://www.youtube.com/watch?v=${id}`, '_blank')
        onClick?.()
    }

    return (
        <div
            className={`video-card video-card--${size} ${isHovering ? 'video-card--hovering' : ''}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
        >
            <div className="video-card__thumbnail">
                {showEmbed ? (
                    <iframe
                        src={`https://www.youtube.com/embed/${id}?autoplay=1&mute=1&controls=0&modestbranding=1`}
                        title={title}
                        frameBorder="0"
                        allow="autoplay; encrypted-media"
                        allowFullScreen
                        className="video-card__embed"
                    />
                ) : (
                    <>
                        <img src={thumbnail} alt={title} loading="lazy" />
                        <div className="video-card__play-overlay">
                            <Play size={48} fill="white" />
                        </div>
                    </>
                )}
                {duration && !showEmbed && (
                    <span className="video-card__duration">
                        <Clock size={12} />
                        {duration}
                    </span>
                )}
            </div>

            <div className="video-card__info">
                <h3 className="video-card__title">{title}</h3>
                <div className="video-card__meta">
                    <span className="video-card__channel">{channelName}</span>
                    {viewCount && (
                        <span className="video-card__views">{viewCount} views</span>
                    )}
                </div>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────
// Video Grid
// ─────────────────────────────────────────────────────────────

interface VideoGridProps {
    videos: Array<{
        id: string
        title: string
        channelName: string
        thumbnail: string
        duration?: string
        viewCount?: string
    }>
    loading?: boolean
}

export function VideoGrid({ videos, loading }: VideoGridProps) {
    if (loading) {
        return (
            <div className="video-grid">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="video-card video-card--skeleton">
                        <div className="video-card__thumbnail skeleton-pulse" />
                        <div className="video-card__info">
                            <div className="skeleton-pulse skeleton-title" />
                            <div className="skeleton-pulse skeleton-meta" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="video-grid">
            {videos.map((video, index) => (
                <VideoCard
                    key={video.id}
                    {...video}
                    size={index === 0 ? 'large' : 'medium'}
                />
            ))}
        </div>
    )
}
