// government and geo-politics entity schema

export type GovtEntityType =
    | 'election'
    | 'bill'
    | 'policy'
    | 'speech'
    | 'conflict'
    | 'treaty'
    | 'diplomacy'
    | 'govt-update'

export interface TimelineEvent {
    date: string
    event: string
}

export interface GovtEntity {
    title: string
    slug: string
    entityType: GovtEntityType
    country: string
    relatedCountries: string[]
    summary: string
    background: string
    keyFacts: { label: string; value: string }[]
    timeline: TimelineEvent[]
    currentStatus: string
    relatedEntities: string[]
    sources: { name: string; url?: string }[]
    ttl: number
}

const govtStore: Record<string, GovtEntity> = {
    // elections
    'lok-sabha-2024': {
        title: 'Lok Sabha Elections 2024',
        slug: 'lok-sabha-2024',
        entityType: 'election',
        country: 'India',
        relatedCountries: [],
        summary: 'General elections for the 18th Lok Sabha conducted across April-June 2024.',
        background: 'The Lok Sabha elections are held every five years to elect 543 Members of Parliament. The 2024 elections saw participation from over 960 million eligible voters across 7 phases.',
        keyFacts: [
            { label: 'Seats', value: '543' },
            { label: 'Phases', value: '7' },
            { label: 'Eligible Voters', value: '968 million' },
            { label: 'Duration', value: 'Apr 19 - Jun 1, 2024' },
        ],
        timeline: [
            { date: '2024-03-16', event: 'Election dates announced by ECI' },
            { date: '2024-04-19', event: 'Phase 1 polling begins' },
            { date: '2024-06-01', event: 'Phase 7 polling concludes' },
            { date: '2024-06-04', event: 'Results declared' },
        ],
        currentStatus: 'Elections concluded. New government formed.',
        relatedEntities: ['union-budget-2024', 'india-us-relations'],
        sources: [{ name: 'Election Commission of India', url: 'https://eci.gov.in' }],
        ttl: 24,
    },
    // bills and policies
    'union-budget-2024': {
        title: 'Union Budget 2024-25',
        slug: 'union-budget-2024',
        entityType: 'policy',
        country: 'India',
        relatedCountries: [],
        summary: 'Annual financial statement outlining government revenue and expenditure for FY 2024-25.',
        background: 'The Union Budget is presented annually by the Finance Minister. It allocates funds across sectors, announces tax changes, and sets economic policy direction.',
        keyFacts: [
            { label: 'Fiscal Deficit Target', value: '5.1% of GDP' },
            { label: 'Capital Expenditure', value: '₹11.11 lakh crore' },
            { label: 'Defense Budget', value: '₹6.21 lakh crore' },
            { label: 'Infrastructure', value: '₹11.11 lakh crore' },
        ],
        timeline: [
            { date: '2024-02-01', event: 'Budget presented in Parliament' },
            { date: '2024-02-15', event: 'General discussion begins' },
            { date: '2024-03-15', event: 'Appropriation Bill passed' },
        ],
        currentStatus: 'Budget provisions in effect for FY 2024-25.',
        relatedEntities: ['lok-sabha-2024', 'gst-council-meeting'],
        sources: [{ name: 'Ministry of Finance', url: 'https://finmin.nic.in' }],
        ttl: 24,
    },
    // diplomacy
    'india-us-relations': {
        title: 'India-US Relations',
        slug: 'india-us-relations',
        entityType: 'diplomacy',
        country: 'India',
        relatedCountries: ['United States'],
        summary: 'Strategic partnership between India and United States covering defense, technology, and trade.',
        background: 'India-US relations have evolved from Cold War distance to strategic partnership. Key areas include defense cooperation (BECA, LEMOA agreements), technology transfer, trade, and educational exchange.',
        keyFacts: [
            { label: 'Framework', value: 'Comprehensive Global Strategic Partnership' },
            { label: 'Trade (2023)', value: '$191 billion' },
            { label: 'Defense Agreements', value: 'BECA, LEMOA, COMCASA, ISA' },
            { label: 'Indian Diaspora in US', value: '4.4 million' },
        ],
        timeline: [
            { date: '2023-06-22', event: 'PM Modi state visit to US' },
            { date: '2023-06-23', event: 'iCET initiative launched' },
            { date: '2024-01-15', event: 'Bilateral talks on semiconductor partnership' },
        ],
        currentStatus: 'Relations at historic high. Ongoing cooperation in defense, space, and critical technologies.',
        relatedEntities: ['quad-summit', 'india-china-relations'],
        sources: [{ name: 'MEA India', url: 'https://mea.gov.in' }],
        ttl: 24,
    },
    'india-china-relations': {
        title: 'India-China Relations',
        slug: 'india-china-relations',
        entityType: 'diplomacy',
        country: 'India',
        relatedCountries: ['China'],
        summary: 'Complex bilateral relationship marked by border disputes, trade, and regional competition.',
        background: 'India-China relations involve territorial disputes along the Line of Actual Control (LAC), significant bilateral trade, and competition for regional influence in South Asia and the Indo-Pacific.',
        keyFacts: [
            { label: 'Border', value: '3,488 km LAC' },
            { label: 'Trade (2023)', value: '$136 billion' },
            { label: 'Trade Deficit', value: '$83 billion (India)' },
            { label: 'Disputed Areas', value: 'Aksai Chin, Arunachal Pradesh' },
        ],
        timeline: [
            { date: '2020-06-15', event: 'Galwan Valley clash' },
            { date: '2022-09-08', event: 'Disengagement at Gogra-Hot Springs' },
            { date: '2024-10-21', event: 'Agreement on LAC patrolling' },
        ],
        currentStatus: 'Ongoing border talks. Trade continues despite political tensions.',
        relatedEntities: ['india-us-relations', 'quad-summit'],
        sources: [{ name: 'MEA India' }, { name: 'IDSA' }],
        ttl: 24,
    },
    // conflicts
    'kashmir-situation': {
        title: 'Kashmir Situation',
        slug: 'kashmir-situation',
        entityType: 'conflict',
        country: 'India',
        relatedCountries: ['Pakistan'],
        summary: 'Territorial dispute over the Kashmir region, administered by India, Pakistan, and China.',
        background: 'Kashmir has been a point of contention since 1947 partition. India administers Jammu & Kashmir and Ladakh as Union Territories. Pakistan administers Azad Kashmir and Gilgit-Baltistan. China controls Aksai Chin.',
        keyFacts: [
            { label: 'Status Change', value: 'Article 370 abrogated Aug 2019' },
            { label: 'India Admin', value: 'J&K and Ladakh UTs' },
            { label: 'LOC Length', value: '740 km' },
            { label: 'UN Resolutions', value: 'Multiple since 1948' },
        ],
        timeline: [
            { date: '2019-08-05', event: 'Article 370 abrogated' },
            { date: '2019-10-31', event: 'J&K and Ladakh become UTs' },
            { date: '2024-09-18', event: 'J&K Assembly elections held' },
        ],
        currentStatus: 'J&K under UT administration. Elections held in 2024.',
        relatedEntities: ['india-pakistan-relations'],
        sources: [{ name: 'Government of India' }],
        ttl: 24,
    },
    // treaties
    'quad-summit': {
        title: 'QUAD Summit',
        slug: 'quad-summit',
        entityType: 'treaty',
        country: 'India',
        relatedCountries: ['United States', 'Australia', 'Japan'],
        summary: 'Quadrilateral Security Dialogue between India, US, Australia, and Japan for Indo-Pacific cooperation.',
        background: 'QUAD is an informal strategic forum for the four democracies. Focus areas include maritime security, supply chain resilience, emerging technologies, climate, and health.',
        keyFacts: [
            { label: 'Members', value: 'India, US, Australia, Japan' },
            { label: 'Formed', value: '2007 (revived 2017)' },
            { label: 'Focus', value: 'Free and open Indo-Pacific' },
            { label: 'Last Summit', value: 'Wilmington, Sept 2024' },
        ],
        timeline: [
            { date: '2021-09-24', event: 'First in-person QUAD summit' },
            { date: '2022-05-24', event: 'Tokyo summit' },
            { date: '2024-09-21', event: 'Wilmington summit' },
        ],
        currentStatus: 'Annual summits ongoing. Focus on technology and maritime security.',
        relatedEntities: ['india-us-relations', 'india-australia-relations'],
        sources: [{ name: 'MEA India' }],
        ttl: 24,
    },
    // govt updates
    'gst-council-meeting': {
        title: 'GST Council 54th Meeting',
        slug: 'gst-council-meeting',
        entityType: 'govt-update',
        country: 'India',
        relatedCountries: [],
        summary: 'Decisions on GST rate changes and compliance measures from the 54th GST Council meeting.',
        background: 'The GST Council is a constitutional body that makes recommendations on GST rates, exemptions, and other matters. It comprises Union and State Finance Ministers.',
        keyFacts: [
            { label: 'Date', value: 'September 9, 2024' },
            { label: 'Key Decision', value: 'Health insurance GST review' },
            { label: 'Chair', value: 'Union Finance Minister' },
            { label: 'Venue', value: 'New Delhi' },
        ],
        timeline: [
            { date: '2024-09-09', event: 'Council meeting held' },
            { date: '2024-09-10', event: 'Decisions notified' },
        ],
        currentStatus: 'Decisions under implementation.',
        relatedEntities: ['union-budget-2024'],
        sources: [{ name: 'GST Council', url: 'https://gstcouncil.gov.in' }],
        ttl: 24,
    },
}

// get single entity
export function getGovtEntity(slug: string): GovtEntity | null {
    return govtStore[slug] || null
}

// get all entities
export function getAllGovtEntities(): GovtEntity[] {
    return Object.values(govtStore)
}

// filter by country
export function getGovtByCountry(country: string): GovtEntity[] {
    return getAllGovtEntities().filter(
        (e) => e.country === country || e.relatedCountries.includes(country)
    )
}

// filter by entity type
export function getGovtByType(type: GovtEntityType): GovtEntity[] {
    return getAllGovtEntities().filter((e) => e.entityType === type)
}

// get foreign relations for a country
export function getForeignRelations(country: string): GovtEntity[] {
    return getAllGovtEntities().filter(
        (e) =>
            (e.entityType === 'diplomacy' || e.entityType === 'treaty' || e.entityType === 'conflict') &&
            (e.country === country || e.relatedCountries.includes(country))
    )
}

// combined filter for user context
export function getGovtForContext(country: string, types?: GovtEntityType[]): GovtEntity[] {
    let entities = getGovtByCountry(country)
    if (types && types.length > 0) {
        entities = entities.filter((e) => types.includes(e.entityType))
    }
    return entities
}

// type labels for display
export const govtTypeLabels: Record<GovtEntityType, string> = {
    'election': 'Election',
    'bill': 'Bill',
    'policy': 'Policy',
    'speech': 'Speech',
    'conflict': 'Conflict',
    'treaty': 'Treaty',
    'diplomacy': 'Diplomacy',
    'govt-update': 'Update',
}
