import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useUserContext } from '../hooks'
import {
    MARKET_COUNTRIES,
    fetchMarketIndices,
    getMarketCountry,
    canRefresh,
    type MarketCountry,
    type MarketIndexData,
} from '../lib/globalMarkets'
import { getEntityPath } from '../lib'
import { SectionHeader } from '../components/dashboard'
import { Loader } from '../components/Loader'
import './Markets.css'

// country flag emojis
const FLAGS: Record<string, string> = {
    IN: '🇮🇳',
    US: '🇺🇸',
    GB: '🇬🇧',
    JP: '🇯🇵',
    CN: '🇨🇳',
    DE: '🇩🇪',
}

function useIsMobile() {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth < 768)
        window.addEventListener('resize', onResize)
        return () => window.removeEventListener('resize', onResize)
    }, [])
    return isMobile
}

export function Markets() {
    const { location } = useUserContext()
    const isMobile = useIsMobile()

    // default to user's country or India
    const defaultCode = getMarketCountry(location.countryCode)?.code || 'IN'
    const [selectedCode, setSelectedCode] = useState(defaultCode)
    const [selectorOpen, setSelectorOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // fetch data
    const [indices, setIndices] = useState<MarketIndexData[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [updatedAt, setUpdatedAt] = useState<Date | null>(null)
    const [refreshCount, setRefreshCount] = useState(0)

    const selectedCountry = getMarketCountry(selectedCode) as MarketCountry

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        setError(null)

        fetchMarketIndices(selectedCode, refreshCount > 0)
            .then((data) => {
                if (cancelled) return
                setIndices(data)
                setUpdatedAt(new Date())
                setLoading(false)
            })
            .catch((err) => {
                if (cancelled) return
                setError(err?.message || 'Failed to load markets')
                setLoading(false)
            })

        return () => { cancelled = true }
    }, [selectedCode, refreshCount])

    // close dropdown on outside click
    useEffect(() => {
        if (!selectorOpen || isMobile) return
        const onClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setSelectorOpen(false)
            }
        }
        document.addEventListener('click', onClick)
        return () => document.removeEventListener('click', onClick)
    }, [selectorOpen, isMobile])

    const handleSelect = (code: string) => {
        setSelectedCode(code)
        setSelectorOpen(false)
    }

    const refresh = () => {
        if (canRefresh(selectedCode)) {
            setRefreshCount((c) => c + 1)
        }
    }

    // format price
    const formatPrice = (price: number, symbol: string) => {
        if (price === 0) return '—'
        return `${symbol}${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
    }

    // format change
    const formatChange = (change: number, percent: number) => {
        if (change === 0 && percent === 0) return '—'
        const sign = change >= 0 ? '+' : ''
        return `${sign}${change.toFixed(2)} (${sign}${percent.toFixed(2)}%)`
    }

    return (
        <div className="container markets-page">
            <header className="markets-header">
                <h1>Global Markets</h1>
                <p>Track major indices across the world</p>
            </header>

            {/* country selector */}
            <div className="country-selector" ref={dropdownRef}>
                <button
                    className="country-btn"
                    onClick={() => setSelectorOpen(!selectorOpen)}
                >
                    <span className="flag">{FLAGS[selectedCode]}</span>
                    <span>{selectedCountry.name}</span>
                    <span className="arrow">▼</span>
                </button>

                {/* desktop dropdown */}
                {selectorOpen && !isMobile && (
                    <div className="country-dropdown">
                        {MARKET_COUNTRIES.map((c) => (
                            <button
                                key={c.code}
                                className={c.code === selectedCode ? 'active' : ''}
                                onClick={() => handleSelect(c.code)}
                            >
                                <span>{FLAGS[c.code]}</span>
                                <span>{c.name}</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* mobile bottom sheet */}
                {selectorOpen && isMobile && (
                    <div className="country-sheet-overlay" onClick={() => setSelectorOpen(false)}>
                        <div className="country-sheet" onClick={(e) => e.stopPropagation()}>
                            <div className="country-sheet-header">
                                <h3>Select Country</h3>
                                <button className="country-sheet-close" onClick={() => setSelectorOpen(false)}>
                                    ×
                                </button>
                            </div>
                            {MARKET_COUNTRIES.map((c) => (
                                <button
                                    key={c.code}
                                    className={`country-option ${c.code === selectedCode ? 'active' : ''}`}
                                    onClick={() => handleSelect(c.code)}
                                >
                                    <span>{FLAGS[c.code]}</span>
                                    <span>{c.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <SectionHeader
                title={`${selectedCountry.name} Indices`}
                updatedAt={updatedAt}
                onRefresh={refresh}
                loading={loading}
            />

            {/* loading state */}
            {loading && (
                <div className="container-loader">
                    <Loader size="md" text="Loading market data..." />
                </div>
            )}

            {/* error state */}
            {!loading && error && (
                <div className="markets-error">{error}</div>
            )}

            {/* indices grid */}
            {!loading && !error && (
                <div className="indices-grid">
                    {indices.map((idx) => (
                        <Link
                            key={idx.slug}
                            to={getEntityPath('market-index', idx.slug)}
                            className={`index-card ${!idx.dataAvailable ? 'unavailable' : ''}`}
                        >
                            <div className="index-card-header">
                                <span className="index-name">{idx.name}</span>
                                <span className="index-symbol">{idx.symbol}</span>
                            </div>
                            <div className="index-card-body">
                                {idx.dataAvailable ? (
                                    <>
                                        <span className="index-price">
                                            {formatPrice(idx.price, idx.currencySymbol)}
                                        </span>
                                        <span className={`index-change ${idx.trend}`}>
                                            {formatChange(idx.change, idx.changePercent)}
                                        </span>
                                    </>
                                ) : (
                                    <span className="index-unavailable">
                                        {idx.unavailableReason || 'Not supported by provider'}
                                    </span>
                                )}
                            </div>
                            <div className="index-updated">
                                {idx.dataAvailable
                                    ? `Updated ${idx.lastUpdated.toLocaleTimeString()}`
                                    : `Source: ${idx.source === 'indianapi' ? 'IndianAPI' : 'Finnhub'}`}
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}

