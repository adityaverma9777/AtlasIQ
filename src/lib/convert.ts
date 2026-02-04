// unit, currency, and timezone conversions

import { fetchWithCache } from './fetch'

// --- UNITS ---

export type UnitCategory = 'length' | 'weight' | 'temperature'

export interface UnitDef {
    code: string
    name: string
    category: UnitCategory
}

export const UNITS: UnitDef[] = [
    // length
    { code: 'm', name: 'Meters', category: 'length' },
    { code: 'km', name: 'Kilometers', category: 'length' },
    { code: 'mi', name: 'Miles', category: 'length' },
    { code: 'ft', name: 'Feet', category: 'length' },
    // weight
    { code: 'kg', name: 'Kilograms', category: 'weight' },
    { code: 'g', name: 'Grams', category: 'weight' },
    { code: 'lb', name: 'Pounds', category: 'weight' },
    { code: 'oz', name: 'Ounces', category: 'weight' },
    // temperature
    { code: 'c', name: 'Celsius', category: 'temperature' },
    { code: 'f', name: 'Fahrenheit', category: 'temperature' },
    { code: 'k', name: 'Kelvin', category: 'temperature' },
]

// conversion to base unit (m, kg, celsius)
const toBase: Record<string, (v: number) => number> = {
    m: v => v,
    km: v => v * 1000,
    mi: v => v * 1609.344,
    ft: v => v * 0.3048,
    kg: v => v,
    g: v => v / 1000,
    lb: v => v * 0.453592,
    oz: v => v * 0.0283495,
    c: v => v,
    f: v => (v - 32) * 5 / 9,
    k: v => v - 273.15,
}

const fromBase: Record<string, (v: number) => number> = {
    m: v => v,
    km: v => v / 1000,
    mi: v => v / 1609.344,
    ft: v => v / 0.3048,
    kg: v => v,
    g: v => v * 1000,
    lb: v => v / 0.453592,
    oz: v => v / 0.0283495,
    c: v => v,
    f: v => v * 9 / 5 + 32,
    k: v => v + 273.15,
}

export function convertUnit(value: number, from: string, to: string): number {
    const base = toBase[from](value)
    return fromBase[to](base)
}

export function getUnitsForCategory(category: UnitCategory): UnitDef[] {
    return UNITS.filter(u => u.category === category)
}

// --- CURRENCY ---

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CNY', 'AUD', 'CAD']

interface ExchangeRates {
    rates: Record<string, number>
    expires: number
}

let cachedRates: ExchangeRates | null = null
const RATE_CACHE_MS = 12 * 60 * 60 * 1000 // 12h

export async function getExchangeRates(): Promise<Record<string, number>> {
    if (cachedRates && cachedRates.expires > Date.now()) {
        return cachedRates.rates
    }

    try {
        const data = await fetchWithCache<{ rates: Record<string, number> }>(
            'https://open.er-api.com/v6/latest/USD',
            { cacheMinutes: 720 } // 12h
        )
        cachedRates = { rates: data.rates, expires: Date.now() + RATE_CACHE_MS }
        return data.rates
    } catch {
        // return empty if failed
        return {}
    }
}

export async function convertCurrency(
    amount: number,
    from: string,
    to: string
): Promise<number | null> {
    const rates = await getExchangeRates()
    if (!rates[from] || !rates[to]) return null

    // convert via USD
    const inUsd = amount / rates[from]
    return inUsd * rates[to]
}

// --- TIMEZONES ---

export const TIMEZONES = [
    { code: 'America/New_York', name: 'New York (EST)' },
    { code: 'America/Los_Angeles', name: 'Los Angeles (PST)' },
    { code: 'Europe/London', name: 'London (GMT)' },
    { code: 'Europe/Paris', name: 'Paris (CET)' },
    { code: 'Asia/Kolkata', name: 'India (IST)' },
    { code: 'Asia/Tokyo', name: 'Tokyo (JST)' },
    { code: 'Asia/Shanghai', name: 'Shanghai (CST)' },
    { code: 'Australia/Sydney', name: 'Sydney (AEDT)' },
    { code: 'UTC', name: 'UTC' },
]

export function convertTime(date: Date, toTimezone: string): string {
    return new Intl.DateTimeFormat('en-US', {
        timeZone: toTimezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    }).format(date)
}

export function getCurrentTimeIn(timezone: string): string {
    return convertTime(new Date(), timezone)
}

