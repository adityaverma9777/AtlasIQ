import { Link } from 'react-router-dom'
import './MarketRow.css'

interface MarketRowProps {
    name: string
    price: string
    change: string
    trend: 'positive' | 'negative' | 'neutral'
    href?: string
}

export function MarketRow({ name, price, change, trend, href }: MarketRowProps) {
    const content = (
        <>
            <span className="market-row-name">{name}</span>
            <div className="market-row-values">
                <span className="market-row-price">{price}</span>
                <span className={`market-row-change ${trend}`}>{change}</span>
            </div>
        </>
    )

    if (href) {
        return (
            <Link to={href} className="market-row market-row-link">
                {content}
            </Link>
        )
    }

    return <div className="market-row">{content}</div>
}

