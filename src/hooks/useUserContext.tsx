import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export interface UserLocation {
    country: string
    countryCode: string
    state?: string
    city?: string
    lat: number
    lon: number
}

export interface UserPreferences {
    currency: string
    currencySymbol: string
    examDomains: string[]
}

export interface UserContextData {
    location: UserLocation
    preferences: UserPreferences
    setLocation: (location: Partial<UserLocation>) => void
    setFullLocation: (country: string, state?: string, city?: string) => void
    setPreferences: (prefs: Partial<UserPreferences>) => void
}

const STORAGE_KEY = 'atlasiq_user_context'

const defaultLocation: UserLocation = {
    country: 'India',
    countryCode: 'IN',
    state: 'Delhi',
    city: 'New Delhi',
    lat: 28.6139,
    lon: 77.209,
}

const defaultPreferences: UserPreferences = {
    currency: 'INR',
    currencySymbol: '₹',
    examDomains: ['ssc', 'upsc', 'banking'],
}

function loadFromStorage(): { location: UserLocation; preferences: UserPreferences } {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
            const parsed = JSON.parse(stored)
            return {
                location: { ...defaultLocation, ...parsed.location },
                preferences: { ...defaultPreferences, ...parsed.preferences },
            }
        }
    } catch {
        // ignore errors
    }
    return { location: defaultLocation, preferences: defaultPreferences }
}

function saveToStorage(location: UserLocation, preferences: UserPreferences) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ location, preferences }))
    } catch {
        // ignore errors
    }
}

const UserContext = createContext<UserContextData | null>(null)

export function UserProvider({ children }: { children: ReactNode }) {
    const [location, setLocationState] = useState<UserLocation>(defaultLocation)
    const [preferences, setPreferencesState] = useState<UserPreferences>(defaultPreferences)

    useEffect(() => {
        const stored = loadFromStorage()
        setLocationState(stored.location)
        setPreferencesState(stored.preferences)
    }, [])

    const setLocation = (partial: Partial<UserLocation>) => {
        const updated = { ...location, ...partial }
        setLocationState(updated)
        saveToStorage(updated, preferences)
    }

    const setPreferences = (partial: Partial<UserPreferences>) => {
        const updated = { ...preferences, ...partial }
        setPreferencesState(updated)
        saveToStorage(location, updated)
    }

    // updates location with automatic lat/lon lookup
    const setFullLocation = (country: string, state?: string, city?: string) => {
        import('../data/locations').then(({ findCountry, findCity }) => {
            const countryData = findCountry(country)
            if (!countryData) return

            let lat = location.lat
            let lon = location.lon

            if (state && city) {
                const cityData = findCity(country, state, city)
                if (cityData) {
                    lat = cityData.lat
                    lon = cityData.lon
                }
            }

            const updated: UserLocation = {
                country,
                countryCode: countryData.code,
                state,
                city,
                lat,
                lon,
            }
            setLocationState(updated)

            // also update currency preference
            const newPrefs = {
                ...preferences,
                currency: countryData.currency,
                currencySymbol: countryData.currencySymbol,
            }
            setPreferencesState(newPrefs)
            saveToStorage(updated, newPrefs)
        })
    }

    return (
        <UserContext.Provider value={{ location, preferences, setLocation, setFullLocation, setPreferences }}>
            {children}
        </UserContext.Provider>
    )
}

export function useUserContext(): UserContextData {
    const ctx = useContext(UserContext)
    if (!ctx) {
        throw new Error('useUserContext must be used within UserProvider')
    }
    return ctx
}

// Helper: get location for API calls
export function getLocationForAPI(location: UserLocation) {
    return {
        lat: location.lat,
        lon: location.lon,
        city: location.city || location.country,
    }
}

// Helper: currency placeholder (no actual conversion yet)
export function formatCurrency(value: number, symbol: string) {
    return `${symbol}${value.toLocaleString()}`
}
