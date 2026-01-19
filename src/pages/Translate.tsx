import { useState } from 'react'
import { translate, LANGUAGES, getLanguageName } from '../lib/translate'
import { Loader } from '../components/Loader'
import './Translate.css'

export function Translate() {
    const [sourceText, setSourceText] = useState('')
    const [sourceLang, setSourceLang] = useState('auto')
    const [targetLang, setTargetLang] = useState('hi')
    const [result, setResult] = useState('')
    const [detectedLang, setDetectedLang] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleTranslate = async () => {
        if (!sourceText.trim()) return
        setLoading(true)
        setError(null)

        const res = await translate(sourceText, targetLang, sourceLang)

        if (res.success && res.text) {
            setResult(res.text)
            setDetectedLang(res.detectedLanguage || null)
        } else {
            setError(res.error || 'Translation failed')
            setResult('')
        }
        setLoading(false)
    }

    const handleSwap = () => {
        if (sourceLang === 'auto' || !result) return
        // swap languages and text
        const tempLang = sourceLang
        const tempText = sourceText
        setSourceLang(targetLang)
        setTargetLang(tempLang)
        setSourceText(result)
        setResult(tempText)
    }

    return (
        <div className="container translate-page">
            <header className="translate-header">
                <h1>Translator</h1>
                <p>Translate between languages</p>
            </header>

            <div className="language-row">
                <select value={sourceLang} onChange={e => setSourceLang(e.target.value)}>
                    <option value="auto">Auto-detect</option>
                    {LANGUAGES.map(l => (
                        <option key={l.code} value={l.code}>{l.name}</option>
                    ))}
                </select>

                <button
                    className="swap-btn"
                    onClick={handleSwap}
                    disabled={sourceLang === 'auto' || !result}
                    title="Swap languages"
                >
                    ⇄
                </button>

                <select value={targetLang} onChange={e => setTargetLang(e.target.value)}>
                    {LANGUAGES.map(l => (
                        <option key={l.code} value={l.code}>{l.name}</option>
                    ))}
                </select>
            </div>

            <div className="translate-boxes">
                <div className="translate-box">
                    <label>Source text</label>
                    <textarea
                        value={sourceText}
                        onChange={e => setSourceText(e.target.value)}
                        placeholder="Enter text to translate..."
                    />
                </div>

                <div className="translate-box">
                    <label>Translation</label>
                    <textarea
                        value={result}
                        readOnly
                        placeholder="Translation will appear here..."
                    />
                    {detectedLang && sourceLang === 'auto' && (
                        <div className="detected-lang">
                            Detected: {getLanguageName(detectedLang)}
                        </div>
                    )}
                </div>
            </div>

            <div className="translate-actions">
                <button
                    className="translate-btn"
                    onClick={handleTranslate}
                    disabled={loading || !sourceText.trim()}
                >
                    {loading ? 'Translating...' : 'Translate'}
                </button>
            </div>

            {loading && <Loader size="sm" text="Translating..." />}

            {error && (
                <div className="translate-error">{error}</div>
            )}
        </div>
    )
}
