import './Loader.css'

interface LoaderProps {
    size?: 'sm' | 'md' | 'lg'
    text?: string
    className?: string
}

export function Loader({ size = 'md', text, className = '' }: LoaderProps) {
    return (
        <div className={`lotus-loader lotus-loader--${size} ${className}`}>
            <div className="lotus-container">
                <div className="lotus-flower">
                    {/* Outer petals */}
                    <div className="petal petal-1"></div>
                    <div className="petal petal-2"></div>
                    <div className="petal petal-3"></div>
                    <div className="petal petal-4"></div>
                    <div className="petal petal-5"></div>
                    <div className="petal petal-6"></div>
                    <div className="petal petal-7"></div>
                    <div className="petal petal-8"></div>
                    {/* Inner glow */}
                    <div className="lotus-center"></div>
                </div>
            </div>
            {text && <span className="lotus-text">{text}</span>}
        </div>
    )
}

export function InlineLoader({ text }: { text?: string }) {
    return (
        <span className="inline-loader">
            <span className="inline-lotus">
                <span className="mini-petal"></span>
                <span className="mini-petal"></span>
                <span className="mini-petal"></span>
                <span className="mini-petal"></span>
            </span>
            {text && <span className="inline-text">{text}</span>}
        </span>
    )
}

