import { useMemo } from 'react'
import { SectionHeader, InfoCard, ListItem, AQICard } from '../components/dashboard'
import { useAsync, useUserContext } from '../hooks'
import { fetchWeather, fetchAQI, getEntityPath } from '../lib'
import { getExamsForContext, getGovtForContext, getForeignRelations, govtTypeLabels } from '../data'
import './India.css'

export function India() {
    const { location, preferences } = useUserContext()
    const weather = useAsync(
        () => fetchWeather({ lat: location.lat, lon: location.lon, name: location.city }),
        [location.lat, location.lon]
    )
    const aqi = useAsync(
        () => fetchAQI({ lat: location.lat, lon: location.lon, name: location.city }),
        [location.lat, location.lon]
    )

    // filter exams by user's state and preferred domains
    const exams = useMemo(() => {
        return getExamsForContext(location.state, preferences.examDomains).slice(0, 6)
    }, [location.state, preferences.examDomains])

    // get govt entities for India
    const govtUpdates = useMemo(() => {
        return getGovtForContext('India', ['policy', 'govt-update', 'election']).slice(0, 4)
    }, [])

    // foreign relations
    const foreignRelations = useMemo(() => {
        return getForeignRelations('India').slice(0, 4)
    }, [])

    return (
        <div className="container india-page">
            <header className="india-header">
                <h1>India Intelligence</h1>
                <p>Real-time updates for India</p>
            </header>

            {/* India Snapshot */}
            <section className="india-section">
                <SectionHeader title="India Snapshot" subtitle="Key indicators" />
                <div className="india-snapshot-grid">
                    <InfoCard
                        label={weather.data?.location ?? 'Weather'}
                        value={weather.data ? `${weather.data.temperature}°C` : '—'}
                    >
                        {weather.loading && <span>Loading...</span>}
                        {weather.error && <span>Unable to fetch</span>}
                        {weather.data && <span>{weather.data.condition}</span>}
                    </InfoCard>
                    <AQICard data={aqi.data} loading={aqi.loading} error={aqi.error} />
                    <InfoCard label="Fuel Prices" value="₹94.72">
                        <span>Petrol in {location.city || location.state || 'India'} • Diesel ₹87.62</span>
                    </InfoCard>
                    <InfoCard label="Govt Updates">
                        <span>{govtUpdates[0]?.title || 'Loading...'}</span>
                    </InfoCard>
                </div>
            </section>

            {/* Government & Politics */}
            <section className="india-section">
                <SectionHeader title="Government & Politics" subtitle="Policies, elections, updates" />
                <div className="jobs-list">
                    {govtUpdates.map((item) => (
                        <ListItem
                            key={item.slug}
                            title={item.title}
                            summary={item.summary}
                            tag={govtTypeLabels[item.entityType]}
                            href={getEntityPath('govt', item.slug)}
                        />
                    ))}
                </div>
            </section>

            {/* Foreign Relations */}
            <section className="india-section">
                <SectionHeader title="Foreign Relations" subtitle="Diplomacy, treaties, conflicts" />
                <div className="jobs-list">
                    {foreignRelations.map((item) => (
                        <ListItem
                            key={item.slug}
                            title={item.title}
                            summary={item.summary}
                            tag={item.relatedCountries[0] || 'Global'}
                            href={getEntityPath('govt', item.slug)}
                        />
                    ))}
                </div>
            </section>

            {/* Jobs & Exams */}
            <section className="india-section">
                <SectionHeader title="Jobs & Exams" subtitle="Government opportunities" />
                <div className="jobs-list">
                    {exams.map((exam) => (
                        <ListItem
                            key={exam.slug}
                            title={exam.name}
                            summary={`${exam.conductingBody} • ${exam.eligibility.split('.')[0]}`}
                            tag={exam.examType === 'central' ? 'Central' : exam.states[0] || 'State'}
                            href={getEntityPath('exam', exam.slug)}
                        />
                    ))}
                </div>
            </section>
        </div>
    )
}
