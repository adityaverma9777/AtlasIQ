import { useMemo, useState } from 'react'
import { NEWSAPI_COUNTRIES, type NewsCountryCode } from '../../lib/news'
import './NewsFilters.css'

export interface NewsFilterState {
    country: NewsCountryCode
}

interface NewsFiltersProps {
    value: NewsFilterState
    onChange: (next: NewsFilterState) => void
}

export function NewsFilters({ value, onChange }: NewsFiltersProps) {
    const [open, setOpen] = useState(false)

    const countryLabel = useMemo(() => {
        return NEWSAPI_COUNTRIES.find((c) => c.code === value.country)?.name || value.country
    }, [value.country])

    return (
        <div className="news-filters">
            <div className="news-filters-bar" aria-label="News filters">
                <div className="news-filters-desktop">
                    <label className="news-filter">
                        <span className="news-filter-label">Country</span>
                        <select
                            className="news-filter-select"
                            value={value.country}
                            onChange={(e) => onChange({ ...value, country: e.target.value as NewsCountryCode })}
                        >
                            {NEWSAPI_COUNTRIES.map((c) => (
                                <option key={c.code} value={c.code}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                <button className="news-filters-mobile-btn" onClick={() => setOpen(true)}>
                    Filters • {countryLabel}
                </button>
            </div>

            {open && (
                <div className="news-filters-modal" role="dialog" aria-modal="true" aria-label="News filters">
                    <div className="news-filters-modal-card">
                        <div className="news-filters-modal-header">
                            <h3>News Filters</h3>
                            <button className="news-filters-close" onClick={() => setOpen(false)} aria-label="Close">
                                ✕
                            </button>
                        </div>

                        <div className="news-filters-modal-body">
                            <label className="news-filter">
                                <span className="news-filter-label">Country</span>
                                <select
                                    className="news-filter-select"
                                    value={value.country}
                                    onChange={(e) => onChange({ ...value, country: e.target.value as NewsCountryCode })}
                                >
                                    {NEWSAPI_COUNTRIES.map((c) => (
                                        <option key={c.code} value={c.code}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        <div className="news-filters-modal-actions">
                            <button className="news-filters-apply" onClick={() => setOpen(false)}>
                                Done
                            </button>
                        </div>
                    </div>
                    <div className="news-filters-backdrop" onClick={() => setOpen(false)} />
                </div>
            )}
        </div>
    )
}



