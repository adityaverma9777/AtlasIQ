// Location data for global context engine

export interface City {
    name: string
    lat: number
    lon: number
}

export interface StateRegion {
    name: string
    cities: City[]
}

export interface Country {
    name: string
    code: string
    currency: string
    currencySymbol: string
    states: StateRegion[]
}

export const countries: Country[] = [
    {
        name: 'India',
        code: 'IN',
        currency: 'INR',
        currencySymbol: '₹',
        states: [
            {
                name: 'Delhi',
                cities: [
                    { name: 'New Delhi', lat: 28.6139, lon: 77.209 },
                ],
            },
            {
                name: 'Maharashtra',
                cities: [
                    { name: 'Mumbai', lat: 19.076, lon: 72.8777 },
                    { name: 'Pune', lat: 18.5204, lon: 73.8567 },
                    { name: 'Nagpur', lat: 21.1458, lon: 79.0882 },
                ],
            },
            {
                name: 'Karnataka',
                cities: [
                    { name: 'Bengaluru', lat: 12.9716, lon: 77.5946 },
                    { name: 'Mysuru', lat: 12.2958, lon: 76.6394 },
                ],
            },
            {
                name: 'Tamil Nadu',
                cities: [
                    { name: 'Chennai', lat: 13.0827, lon: 80.2707 },
                    { name: 'Coimbatore', lat: 11.0168, lon: 76.9558 },
                ],
            },
            {
                name: 'West Bengal',
                cities: [
                    { name: 'Kolkata', lat: 22.5726, lon: 88.3639 },
                ],
            },
            {
                name: 'Telangana',
                cities: [
                    { name: 'Hyderabad', lat: 17.385, lon: 78.4867 },
                ],
            },
            {
                name: 'Gujarat',
                cities: [
                    { name: 'Ahmedabad', lat: 23.0225, lon: 72.5714 },
                    { name: 'Surat', lat: 21.1702, lon: 72.8311 },
                ],
            },
            {
                name: 'Rajasthan',
                cities: [
                    { name: 'Jaipur', lat: 26.9124, lon: 75.7873 },
                    { name: 'Udaipur', lat: 24.5854, lon: 73.7125 },
                ],
            },
            {
                name: 'Uttar Pradesh',
                cities: [
                    { name: 'Lucknow', lat: 26.8467, lon: 80.9462 },
                    { name: 'Varanasi', lat: 25.3176, lon: 82.9739 },
                    { name: 'Noida', lat: 28.5355, lon: 77.391 },
                ],
            },
            {
                name: 'Punjab',
                cities: [
                    { name: 'Chandigarh', lat: 30.7333, lon: 76.7794 },
                    { name: 'Amritsar', lat: 31.634, lon: 74.8723 },
                ],
            },
        ],
    },
    {
        name: 'United States',
        code: 'US',
        currency: 'USD',
        currencySymbol: '$',
        states: [
            {
                name: 'California',
                cities: [
                    { name: 'Los Angeles', lat: 34.0522, lon: -118.2437 },
                    { name: 'San Francisco', lat: 37.7749, lon: -122.4194 },
                    { name: 'San Diego', lat: 32.7157, lon: -117.1611 },
                ],
            },
            {
                name: 'New York',
                cities: [
                    { name: 'New York City', lat: 40.7128, lon: -74.006 },
                    { name: 'Buffalo', lat: 42.8864, lon: -78.8784 },
                ],
            },
            {
                name: 'Texas',
                cities: [
                    { name: 'Houston', lat: 29.7604, lon: -95.3698 },
                    { name: 'Austin', lat: 30.2672, lon: -97.7431 },
                    { name: 'Dallas', lat: 32.7767, lon: -96.797 },
                ],
            },
            {
                name: 'Florida',
                cities: [
                    { name: 'Miami', lat: 25.7617, lon: -80.1918 },
                    { name: 'Orlando', lat: 28.5383, lon: -81.3792 },
                ],
            },
            {
                name: 'Washington',
                cities: [
                    { name: 'Seattle', lat: 47.6062, lon: -122.3321 },
                ],
            },
        ],
    },
    {
        name: 'United Kingdom',
        code: 'GB',
        currency: 'GBP',
        currencySymbol: '£',
        states: [
            {
                name: 'England',
                cities: [
                    { name: 'London', lat: 51.5074, lon: -0.1278 },
                    { name: 'Manchester', lat: 53.4808, lon: -2.2426 },
                    { name: 'Birmingham', lat: 52.4862, lon: -1.8904 },
                ],
            },
            {
                name: 'Scotland',
                cities: [
                    { name: 'Edinburgh', lat: 55.9533, lon: -3.1883 },
                    { name: 'Glasgow', lat: 55.8642, lon: -4.2518 },
                ],
            },
        ],
    },
    {
        name: 'Canada',
        code: 'CA',
        currency: 'CAD',
        currencySymbol: 'C$',
        states: [
            {
                name: 'Ontario',
                cities: [
                    { name: 'Toronto', lat: 43.6532, lon: -79.3832 },
                    { name: 'Ottawa', lat: 45.4215, lon: -75.6972 },
                ],
            },
            {
                name: 'British Columbia',
                cities: [
                    { name: 'Vancouver', lat: 49.2827, lon: -123.1207 },
                    { name: 'Victoria', lat: 48.4284, lon: -123.3656 },
                ],
            },
            {
                name: 'Quebec',
                cities: [
                    { name: 'Montreal', lat: 45.5017, lon: -73.5673 },
                    { name: 'Quebec City', lat: 46.8139, lon: -71.208 },
                ],
            },
        ],
    },
    {
        name: 'Australia',
        code: 'AU',
        currency: 'AUD',
        currencySymbol: 'A$',
        states: [
            {
                name: 'New South Wales',
                cities: [
                    { name: 'Sydney', lat: -33.8688, lon: 151.2093 },
                ],
            },
            {
                name: 'Victoria',
                cities: [
                    { name: 'Melbourne', lat: -37.8136, lon: 144.9631 },
                ],
            },
            {
                name: 'Queensland',
                cities: [
                    { name: 'Brisbane', lat: -27.4698, lon: 153.0251 },
                    { name: 'Gold Coast', lat: -28.0167, lon: 153.4 },
                ],
            },
        ],
    },
]

// helper to find location data
export function findCountry(name: string): Country | undefined {
    return countries.find((c) => c.name === name)
}

export function findState(countryName: string, stateName: string): StateRegion | undefined {
    return findCountry(countryName)?.states.find((s) => s.name === stateName)
}

export function findCity(countryName: string, stateName: string, cityName: string): City | undefined {
    return findState(countryName, stateName)?.cities.find((c) => c.name === cityName)
}

// slug generator for entity paths
export function cityToSlug(cityName: string): string {
    return cityName.toLowerCase().replace(/\s+/g, '-')
}
