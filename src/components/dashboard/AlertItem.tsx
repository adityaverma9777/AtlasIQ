import './AlertItem.css'

interface AlertItemProps {
    title: string
    severity: 'moderate' | 'severe' | 'extreme'
}

export function AlertItem({ title, severity }: AlertItemProps) {
    return (
        <div className="alert-item">
            <span className={`alert-item-indicator ${severity}`} />
            <span className="alert-item-text">{title}</span>
        </div>
    )
}
