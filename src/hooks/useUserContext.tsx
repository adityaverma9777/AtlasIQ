import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export interface UserLocation {
    country: string
    countryCode: string
    state?: string
    city?: string
    lat: number
    lon: number
    autoDetected?: boolean
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
    detectGPS: () => Promise<boolean>
    isAutoDetected: boolean
    isDetectingGPS: boolean
    isGPSActive: boolean
}

const STORAGE_KEY = 'atlasiq_user_context'
const DETECTED_KEY = 'atlasiq_location_detected'

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

// currency mapping for common countries
const currencyMap: Record<string, { currency: string; symbol: string }> = {
    IN: { currency: 'INR', symbol: '₹' },
    US: { currency: 'USD', symbol: '$' },
    GB: { currency: 'GBP', symbol: '£' },
    EU: { currency: 'EUR', symbol: '€' },
    DE: { currency: 'EUR', symbol: '€' },
    FR: { currency: 'EUR', symbol: '€' },
    JP: { currency: 'JPY', symbol: '¥' },
    CN: { currency: 'CNY', symbol: '¥' },
    AU: { currency: 'AUD', symbol: 'A$' },
    CA: { currency: 'CAD', symbol: 'C$' },
}

function loadFromStorage(): { location: UserLocation; preferences: UserPreferences } | null {
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
        // ignore
    }
    return null
}

function saveToStorage(location: UserLocation, preferences: UserPreferences) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ location, preferences }))
    } catch {
        // ignore
    }
}

function hasManuallySelected(): boolean {
    try {
        return localStorage.getItem(DETECTED_KEY) === 'manual'
    } catch {
        return false
    }
}

function markAsManual() {
    try {
        localStorage.setItem(DETECTED_KEY, 'manual')
    } catch {
        // ignore
    }
}

// IP geolocation via ipapi.co (free, no key)
interface IpApiResponse {
    city?: string
    region?: string
    country_name?: string
    country_code?: string
    latitude?: number
    longitude?: number
}

async function detectLocationByIP(): Promise<UserLocation | null> {
    try {
        const res = await fetch('https://ipapi.co/json/')
        if (!res.ok) return null
        const data: IpApiResponse = await res.json()

        if (!data.latitude || !data.longitude) return null

        return {
            country: data.country_name || 'Unknown',
            countryCode: data.country_code || 'US',
            state: data.region,
            city: data.city,
            lat: data.latitude,
            lon: data.longitude,
            autoDetected: true,
        }
    } catch {
        return null
    }
}

// Reverse geocode coordinates to get city name
interface NominatimResponse {
    address?: {
        city?: string
        town?: string
        village?: string
        state?: string
        country?: string
        country_code?: string
    }
}

async function reverseGeocode(lat: number, lon: number): Promise<{ city?: string; state?: string; country?: string; countryCode?: string }> {
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`, {
            headers: { 'User-Agent': 'AtlasIQ/1.0' }
        })
        if (!res.ok) return {}
        const data: NominatimResponse = await res.json()
        const addr = data.address || {}
        return {
            city: addr.city || addr.town || addr.village,
            state: addr.state,
            country: addr.country,
            countryCode: addr.country_code?.toUpperCase(),
        }
    } catch {
        return {}
    }
}

// GPS geolocation using browser API
function detectLocationByGPS(): Promise<UserLocation | null> {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            resolve(null)
            return
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords
                const geo = await reverseGeocode(latitude, longitude)

                resolve({
                    country: geo.country || 'Unknown',
                    countryCode: geo.countryCode || 'US',
                    state: geo.state,
                    city: geo.city,
                    lat: latitude,
                    lon: longitude,
                    autoDetected: true,
                })
            },
            () => {
                resolve(null)
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        )
    })
}

const UserContext = createContext<UserContextData | null>(null)

export function UserProvider({ children }: { children: ReactNode }) {
    const [location, setLocationState] = useState<UserLocation>(defaultLocation)
    const [preferences, setPreferencesState] = useState<UserPreferences>(defaultPreferences)
    const [isAutoDetected, setIsAutoDetected] = useState(false)
    const [isDetectingGPS, setIsDetectingGPS] = useState(false)
    const [isGPSActive, setIsGPSActive] = useState(false)

    useEffect(() => {
        const stored = loadFromStorage()

        if (stored) {
            // user has saved data
            setLocationState(stored.location)
            setPreferencesState(stored.preferences)
            setIsAutoDetected(!!stored.location.autoDetected)

            // If it was auto-detected before, try to refresh it silently
            if (stored.location.autoDetected && !hasManuallySelected()) {
                detectLocationByIP().then(detected => {
                    if (detected) {
                        setLocationState(detected)
                        setIsAutoDetected(true)
                        const cc = detected.countryCode?.toUpperCase() || ''
                        const curr = currencyMap[cc] || { currency: 'USD', symbol: '$' }
                        const prefs = { ...stored.preferences, ...curr }
                        setPreferencesState(prefs)
                        saveToStorage(detected, prefs)
                    }
                })
            }
        } else {
            // First visit - always auto-detect
            detectLocationByIP().then(detected => {
                if (detected) {
                    setLocationState(detected)
                    setIsAutoDetected(true)

                    // set currency based on country
                    const cc = detected.countryCode?.toUpperCase() || ''
                    const curr = currencyMap[cc] || { currency: 'USD', symbol: '$' }
                    const prefs = { ...defaultPreferences, ...curr }
                    setPreferencesState(prefs)
                    saveToStorage(detected, prefs)
                }
            })
        }
    }, [])

    const setLocation = (partial: Partial<UserLocation>) => {
        const updated = { ...location, ...partial, autoDetected: false }
        setLocationState(updated)
        setIsAutoDetected(false)
        markAsManual()
        saveToStorage(updated, preferences)
    }

    const setPreferences = (partial: Partial<UserPreferences>) => {
        const updated = { ...preferences, ...partial }
        setPreferencesState(updated)
        saveToStorage(location, updated)
    }

    // Detect location using GPS
    const detectGPS = async (): Promise<boolean> => {
        setIsDetectingGPS(true)
        try {
            const detected = await detectLocationByGPS()
            if (detected) {
                // Mark as explicitly GPS-detected (not auto/IP), set autoDetected to false
                const gpsLocation = { ...detected, autoDetected: false }
                setLocationState(gpsLocation)
                setIsAutoDetected(false) // GPS is explicit, not auto
                setIsGPSActive(true) // GPS was explicitly activated

                // set currency based on country
                const cc = detected.countryCode?.toUpperCase() || ''
                const curr = currencyMap[cc] || { currency: 'USD', symbol: '$' }
                const prefs = { ...preferences, ...curr }
                setPreferencesState(prefs)
                saveToStorage(gpsLocation, prefs)
                return true
            }
            return false
        } finally {
            setIsDetectingGPS(false)
        }
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
                autoDetected: false,
            }
            setLocationState(updated)
            setIsAutoDetected(false)
            markAsManual()

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
        <UserContext.Provider value={{ location, preferences, setLocation, setFullLocation, setPreferences, detectGPS, isAutoDetected, isDetectingGPS, isGPSActive }}>
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

// Helper: currency placeholder
export function formatCurrency(value: number, symbol: string) {
    return `${symbol}${value.toLocaleString()}`
}

