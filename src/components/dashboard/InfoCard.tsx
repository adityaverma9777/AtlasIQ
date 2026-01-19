import { Link } from 'react-router-dom'
import './InfoCard.css'

interface InfoCardProps {
    label: string
    value?: string
    children?: React.ReactNode
    href?: string
}

export function InfoCard({ label, value, children, href }: InfoCardProps) {
    const content = (
        <>
            <span className="info-card-label">{label}</span>
            {value && <span className="info-card-value">{value}</span>}
            {children && <div className="info-card-content">{children}</div>}
        </>
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
