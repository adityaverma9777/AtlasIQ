import { Sun, CloudLightning, CloudRain, Snowflake, Wind, CloudFog, AlertTriangle } from 'lucide-react'
import type { AlertType, AlertSeverity } from '../../lib/alerts'
import './AlertItem.css'

interface AlertItemProps {
    type?: AlertType
    title: string
    summary?: string
    severity: AlertSeverity | 'moderate' | 'severe' | 'extreme'
}

function getSeverityClass(severity: AlertItemProps['severity']): string {
    const mapping: Record<string, string> = {
        info: 'info',
        warning: 'warning',
        danger: 'danger',
        moderate: 'warning',
        severe: 'danger',
        extreme: 'danger',
    }
    return mapping[severity] || 'info'
}

function AlertIcon({ type }: { type?: AlertType }) {
    const iconProps = { size: 18, strokeWidth: 2 }

    switch (type) {
        case 'heatwave':
            return <Sun {...iconProps} />
        case 'storm':
            return <CloudLightning {...iconProps} />
        case 'flood':
            return <CloudRain {...iconProps} />
        case 'cold':
        case 'snow':
            return <Snowflake {...iconProps} />
        case 'wind':
        case 'air-quality':
            return <Wind {...iconProps} />
        case 'fog':
            return <CloudFog {...iconProps} />
        default:
            return <AlertTriangle {...iconProps} />
    }
}

export function AlertItem({ type, title, summary, severity }: AlertItemProps) {
    const severityClass = getSeverityClass(severity)

    return (
        <div className={`alert-item ${severityClass}`}>
            <div className="alert-item-icon">
                <AlertIcon type={type} />
            </div>
            <div className="alert-item-content">
                <span className="alert-item-title">{title}</span>
                {summary && <span className="alert-item-summary">{summary}</span>}
            </div>
            <span className={`alert-item-badge ${severityClass}`}>
                {severityClass === 'danger' ? 'DANGER' : severityClass === 'warning' ? 'WARNING' : 'INFO'}
            </span>
        </div>
    )
}
