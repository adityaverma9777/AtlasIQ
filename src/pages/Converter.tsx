import { useState, useEffect } from 'react'
import {
    convertUnit,
    getUnitsForCategory,
    convertCurrency,
    getCurrentTimeIn,
    CURRENCIES,
    TIMEZONES,
    type UnitCategory,
} from '../lib/convert'
import './Converter.css'

type ConverterType = 'units' | 'currency' | 'time'

export function Converter() {
    const [activeTab, setActiveTab] = useState<ConverterType>('units')

    return (
        <div className="container converter-page">
            <header className="converter-header">
                <h1>Converter</h1>
                <p>Units, currency, and time zones</p>
            </header>

            <div className="converter-tabs">
                <button
                    className={`tab-btn ${activeTab === 'units' ? 'active' : ''}`}
                    onClick={() => setActiveTab('units')}
                >
                    Units
                </button>
                <button
                    className={`tab-btn ${activeTab === 'currency' ? 'active' : ''}`}
                    onClick={() => setActiveTab('currency')}
                >
                    Currency
                </button>
                <button
                    className={`tab-btn ${activeTab === 'time' ? 'active' : ''}`}
                    onClick={() => setActiveTab('time')}
                >
                    Time Zones
                </button>
            </div>

            <div className="converter-box">
                {activeTab === 'units' && <UnitConverter />}
                {activeTab === 'currency' && <CurrencyConverter />}
                {activeTab === 'time' && <TimezoneConverter />}
            </div>
        </div>
    )
}

function UnitConverter() {
    const [category, setCategory] = useState<UnitCategory>('length')
    const [value, setValue] = useState('1')
    const [fromUnit, setFromUnit] = useState('m')
    const [toUnit, setToUnit] = useState('km')

    const units = getUnitsForCategory(category)

    // reset units when category changes
    useEffect(() => {
        const catUnits = getUnitsForCategory(category)
        if (catUnits.length >= 2) {
            setFromUnit(catUnits[0].code)
            setToUnit(catUnits[1].code)
        }
    }, [category])

    const num = parseFloat(value) || 0
    const result = convertUnit(num, fromUnit, toUnit)

    return (
        <>
            <div className="unit-category">
                <select value={category} onChange={e => setCategory(e.target.value as UnitCategory)}>
                    <option value="length">Length</option>
                    <option value="weight">Weight</option>
                    <option value="temperature">Temperature</option>
                </select>
            </div>

            <div className="convert-row">
                <input
                    type="number"
                    className="convert-input"
                    value={value}
                    onChange={e => setValue(e.target.value)}
                />
                <select
                    className="convert-select"
                    value={fromUnit}
                    onChange={e => setFromUnit(e.target.value)}
                >
                    {units.map(u => (
                        <option key={u.code} value={u.code}>{u.name}</option>
                    ))}
                </select>
                <span className="convert-label">=</span>
                <select
                    className="convert-select"
                    value={toUnit}
                    onChange={e => setToUnit(e.target.value)}
                >
                    {units.map(u => (
                        <option key={u.code} value={u.code}>{u.name}</option>
                    ))}
                </select>
            </div>

            <div className="convert-result large">
                {result.toLocaleString(undefined, { maximumFractionDigits: 4 })}
            </div>
        </>
    )
}

function CurrencyConverter() {
    const [amount, setAmount] = useState('100')
    const [fromCurrency, setFromCurrency] = useState('USD')
    const [toCurrency, setToCurrency] = useState('INR')
    const [result, setResult] = useState<number | null>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const num = parseFloat(amount) || 0
        if (num <= 0) {
            setResult(null)
            return
        }

        setLoading(true)
        convertCurrency(num, fromCurrency, toCurrency).then(r => {
            setResult(r)
            setLoading(false)
        })
    }, [amount, fromCurrency, toCurrency])

    return (
        <>
            <div className="convert-row">
                <input
                    type="number"
                    className="convert-input"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                />
                <select
                    className="convert-select"
                    value={fromCurrency}
                    onChange={e => setFromCurrency(e.target.value)}
                >
                    {CURRENCIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
                <span className="convert-label">→</span>
                <select
                    className="convert-select"
                    value={toCurrency}
                    onChange={e => setToCurrency(e.target.value)}
                >
                    {CURRENCIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
            </div>

            <div className="convert-result large">
                {loading ? '...' : result !== null
                    ? `${toCurrency} ${result.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                    : '—'
                }
            </div>
        </>
    )
}

function TimezoneConverter() {
    const [times, setTimes] = useState<Record<string, string>>({})

    useEffect(() => {
        const update = () => {
            const newTimes: Record<string, string> = {}
            for (const tz of TIMEZONES) {
                newTimes[tz.code] = getCurrentTimeIn(tz.code)
            }
            setTimes(newTimes)
        }

        update()
        const interval = setInterval(update, 1000)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="timezone-list">
            {TIMEZONES.map(tz => (
                <div key={tz.code} className="timezone-item">
                    <span className="timezone-name">{tz.name}</span>
                    <span className="timezone-time">{times[tz.code] || '...'}</span>
                </div>
            ))}
        </div>
    )
}

