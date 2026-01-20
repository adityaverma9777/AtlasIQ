import { useState, useRef, useEffect } from 'react'
import { useUserContext } from '../../hooks'
import { countries, findCountry, findState } from '../../data'
import './LocationSelector.css'

export function LocationSelector() {
    const { location, setFullLocation } = useUserContext()
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    const [country, setCountry] = useState(location.country)
    const [state, setState] = useState(location.state || '')
    const [city, setCity] = useState(location.city || '')

    useEffect(() => {
        setCountry(location.country)
        setState(location.state || '')
        setCity(location.city || '')
    }, [location.country, location.state, location.city])

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        if (open) document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [open])

    const countryData = findCountry(country)
    const stateData = countryData ? findState(country, state) : null
    const availableStates = countryData?.states || []
    const availableCities = stateData?.cities || []

    function handleCountryChange(newCountry: string) {
        setCountry(newCountry)
        const newCountryData = findCountry(newCountry)
        const firstState = newCountryData?.states[0]
        const firstCity = firstState?.cities[0]
        setState(firstState?.name || '')
        setCity(firstCity?.name || '')
    }

    function handleStateChange(newState: string) {
        setState(newState)
        const newStateData = findState(country, newState)
        const firstCity = newStateData?.cities[0]
        setCity(firstCity?.name || '')
    }

    function handleCityChange(newCity: string) {
        setCity(newCity)
    }

    function handleApply() {
        setFullLocation(country, state, city)
        setOpen(false)
    }

    const displayText = city || state || country

    return (
        <div className="location-selector" ref={ref}>
            <button className="location-btn" onClick={() => setOpen(!open)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                </svg>
                <span className="location-btn-text">{displayText}</span>
            </button>

            {open && (
                <div className="location-dropdown">
                    <div className="location-dropdown-header">
                        <h3>Location</h3>
                        <button className="location-close" onClick={() => setOpen(false)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="location-field">
                        <label>Country</label>
                        <select
                            className="location-select"
                            value={country}
                            onChange={(e) => handleCountryChange(e.target.value)}
                        >
                            {countries.map((c) => (
                                <option key={c.code} value={c.name}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="location-field">
                        <label>State / Region</label>
                        <select
                            className="location-select"
                            value={state}
                            onChange={(e) => handleStateChange(e.target.value)}
                            disabled={availableStates.length === 0}
                        >
                            {availableStates.map((s) => (
                                <option key={s.name} value={s.name}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="location-field">
                        <label>City</label>
                        <select
                            className="location-select"
                            value={city}
                            onChange={(e) => handleCityChange(e.target.value)}
                            disabled={availableCities.length === 0}
                        >
                            {availableCities.map((c) => (
                                <option key={c.name} value={c.name}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <button className="location-btn" onClick={handleApply} style={{ width: '100%', marginTop: 'var(--space-3)', justifyContent: 'center' }}>
                        Apply
                    </button>
                </div>
            )}
        </div>
    )
}
