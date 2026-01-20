/**
 * Explore Grid Component
 * Bing-style masonry grid with variable card sizes
 */

import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import './ExploreGrid.css'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type CardSize = 'featured' | 'large' | 'medium' | 'small'

export interface ExploreCardProps {
    size?: CardSize
    title: string
    subtitle?: string
    image?: string
    tag?: string
    badge?: string
    badgeColor?: 'hot' | 'live' | 'new' | 'trending'
    href?: string
    onClick?: () => void
    children?: ReactNode
    className?: string
}

export interface ExploreGridProps {
    children: ReactNode
    className?: string
}

// ─────────────────────────────────────────────────────────────
// Explore Grid Container
// ─────────────────────────────────────────────────────────────

export function ExploreGrid({ children, className = '' }: ExploreGridProps) {
    return (
        <div className={`explore-grid ${className}`}>
            {children}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────
// Explore Card
// ─────────────────────────────────────────────────────────────

export function ExploreCard({
    size = 'medium',
    title,
    subtitle,
    image,
    tag,
    badge,
    badgeColor = 'new',
    href,
    onClick,
    children,
    className = '',
}: ExploreCardProps) {
    const cardClass = `explore-card explore-card--${size} ${className}`

    const content = (
        <>
            {image && (
                <div className="explore-card__image">
                    <img src={image} alt="" loading="lazy" />
                    <div className="explore-card__overlay" />
                </div>
            )}
            <div className="explore-card__content">
                {badge && (
                    <span className={`explore-card__badge explore-card__badge--${badgeColor}`}>
                        {badge}
                    </span>
                )}
                {tag && <span className="explore-card__tag">{tag}</span>}
                <h3 className="explore-card__title">{title}</h3>
                {subtitle && <p className="explore-card__subtitle">{subtitle}</p>}
                {children}
            </div>
        </>
    )

    if (href) {
        return (
            <Link to={href} className={cardClass} onClick={onClick}>
                {content}
            </Link>
        )
    }

    return (
        <div className={cardClass} onClick={onClick}>
            {content}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────
// Section Header
// ─────────────────────────────────────────────────────────────

interface SectionHeaderProps {
    title: string
    subtitle?: string
    action?: { label: string; href?: string; onClick?: () => void }
    icon?: ReactNode
}

export function ExploreSectionHeader({ title, subtitle, action, icon }: SectionHeaderProps) {
    return (
        <div className="explore-section-header">
            <div className="explore-section-header__left">
                {icon && <span className="explore-section-header__icon">{icon}</span>}
                <div>
                    <h2 className="explore-section-header__title">{title}</h2>
                    {subtitle && <p className="explore-section-header__subtitle">{subtitle}</p>}
                </div>
            </div>
            {action && (
                action.href ? (
                    <Link to={action.href} className="explore-section-header__action">
                        {action.label}
                    </Link>
                ) : (
                    <button className="explore-section-header__action" onClick={action.onClick}>
                        {action.label}
                    </button>
                )
            )}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────
// Skeleton Loader
// ─────────────────────────────────────────────────────────────

export function ExploreCardSkeleton({ size = 'medium' }: { size?: CardSize }) {
    return (
        <div className={`explore-card explore-card--${size} explore-card--skeleton`}>
            <div className="explore-card__image skeleton-pulse" />
            <div className="explore-card__content">
                <div className="skeleton-pulse skeleton-tag" />
                <div className="skeleton-pulse skeleton-title" />
                <div className="skeleton-pulse skeleton-subtitle" />
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────
// Category Pills
// ─────────────────────────────────────────────────────────────

interface CategoryPillsProps {
    categories: Array<{ id: string; label: string; icon?: ReactNode }>
    activeId: string
    onChange: (id: string) => void
}

export function CategoryPills({ categories, activeId, onChange }: CategoryPillsProps) {
    return (
        <div className="category-pills">
            {categories.map(cat => (
                <button
                    key={cat.id}
                    className={`category-pill ${activeId === cat.id ? 'category-pill--active' : ''}`}
                    onClick={() => onChange(cat.id)}
                >
                    {cat.icon && <span className="category-pill__icon">{cat.icon}</span>}
                    {cat.label}
                </button>
            ))}
        </div>
    )
}
