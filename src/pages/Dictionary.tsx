import { useState, useRef } from 'react'
import { lookupWord, type DictionaryResult } from '../lib/dictionary'
import { Loader } from '../components/Loader'
import './Dictionary.css'

export function Dictionary() {
    const [query, setQuery] = useState('')
    const [result, setResult] = useState<DictionaryResult | null>(null)
    const [loading, setLoading] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    const handleSearch = async () => {
        if (!query.trim()) return
        setLoading(true)
        const res = await lookupWord(query)
        setResult(res)
        setLoading(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSearch()
    }

    const playAudio = (url: string) => {
        if (audioRef.current) {
            audioRef.current.src = url
            audioRef.current.play()
        }
    }

    const entry = result?.entry
    const audioUrl = entry?.phonetics.find(p => p.audio)?.audio

    return (
        <div className="container dictionary-page">
            <header className="dictionary-header">
                <h1>Dictionary</h1>
                <p>Look up word definitions</p>
            </header>

            <div className="dictionary-search">
                <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter a word..."
                    autoFocus
                />
                <button onClick={handleSearch} disabled={loading || !query.trim()}>
                    {loading ? 'Searching...' : 'Search'}
                </button>
            </div>

            {loading && <Loader size="md" text="Looking up definition..." />}

            {!loading && result && !result.found && (
                <div className="dictionary-error">
                    <h3>Word not found</h3>
                    <p>{result.error || 'Try a different word'}</p>
                </div>
            )}

            {!loading && entry && (
                <div className="dictionary-result">
                    <h2>{entry.word}</h2>
                    {(entry.phonetic || audioUrl) && (
                        <div className="phonetic">
                            {entry.phonetic && <span>{entry.phonetic}</span>}
                            {audioUrl && (
                                <button className="audio-btn" onClick={() => playAudio(audioUrl)}>
                                    🔊
                                </button>
                            )}
                        </div>
                    )}

                    {entry.meanings.map((meaning, i) => (
                        <div key={i} className="meaning">
                            <div className="part-of-speech">{meaning.partOfSpeech}</div>
                            <ol className="definitions">
                                {meaning.definitions.slice(0, 4).map((def, j) => (
                                    <li key={j}>
                                        <span className="definition-text">{def.definition}</span>
                                        {def.example && (
                                            <span className="example">"{def.example}"</span>
                                        )}
                                        {def.synonyms && def.synonyms.length > 0 && (
                                            <span className="synonyms">
                                                Synonyms: {def.synonyms.slice(0, 5).join(', ')}
                                            </span>
                                        )}
                                    </li>
                                ))}
                            </ol>
                        </div>
                    ))}

                    {entry.sourceUrl && (
                        <div className="source-link">
                            Source: <a href={entry.sourceUrl} target="_blank" rel="noopener">Wiktionary</a>
                        </div>
                    )}
                </div>
            )}

            {!loading && !result && (
                <div className="dictionary-empty">
                    <p>Search for any English word to see its definition, pronunciation, and examples.</p>
                </div>
            )}

            <audio ref={audioRef} hidden />
        </div>
    )
}
