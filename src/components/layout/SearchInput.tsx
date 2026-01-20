import { useState, useEffect, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import './SearchInput.css'

const PLACEHOLDERS = [
    'Tell me a topic…',
    'Ask me anything…',
    'Search the encyclopedia…',
    'Discover history, science…',
]

export function SearchInput() {
    const [query, setQuery] = useState('')
    const [mobileOpen, setMobileOpen] = useState(false)
    const [placeholderIndex, setPlaceholderIndex] = useState(0)
    const [isFocused, setIsFocused] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        if (isFocused) return

        const interval = setInterval(() => {
            setPlaceholderIndex((i) => (i + 1) % PLACEHOLDERS.length)
        }, 3000)

        return () => clearInterval(interval)
    }, [isFocused])

    const placeholder = PLACEHOLDERS[placeholderIndex]

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()
        if (query.trim()) {
            navigate(`/search?q=${encodeURIComponent(query.trim())}`)
            setMobileOpen(false)
        }
    }

    return (
        <>
            <form className="search-input-wrapper desktop" onSubmit={handleSubmit}>
                <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                    type="text"
                    className="search-input"
                    placeholder={placeholder}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                />
            </form>

            <button className="search-toggle" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Search">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                </svg>
            </button>

            {mobileOpen && (
                <form className="search-mobile" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        className="search-input"
                        placeholder={placeholder}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        autoFocus
                    />
                </form>
            )}
        </>
    )
}
