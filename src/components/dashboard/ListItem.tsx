import { Link } from 'react-router-dom'
import './ListItem.css'

interface ListItemProps {
    title: string
    summary: string
    tag?: string
    href?: string
    onClick?: () => void
}

export function ListItem({ title, summary, tag, href, onClick }: ListItemProps) {
    const content = (
        <>
            <div className="list-item-header">
                <h3 className="list-item-title">{title}</h3>
                {tag && <span className="list-item-tag">{tag}</span>}
            </div>
            <p className="list-item-summary">{summary}</p>
        </>
    )

    if (href) {
        return (
            <Link to={href} className="list-item list-item-link" onClick={onClick}>
                {content}
            </Link>
        )
    }

    return (
        <article className="list-item" onClick={onClick}>
            {content}
        </article>
    )
}
