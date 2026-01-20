import { useState, useRef, useEffect } from 'react'
import { sendChatMessage, type ChatMessage } from '../lib/chat'
import './AtlasChat.css'

export function AtlasChat() {
    const [isOpen, setIsOpen] = useState(false)
    const [isExpanded, setIsExpanded] = useState(false)
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [articleContext, setArticleContext] = useState<string | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // scroll to bottom on new message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // reset context when chat closes
    useEffect(() => {
        if (!isOpen) {
            setMessages([])
            setIsExpanded(false)
            setArticleContext(null)
        }
    }, [isOpen])

    // focus input when expanded or opened
    useEffect(() => {
        if (isExpanded || isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100)
        }
    }, [isExpanded, isOpen])

    // Listen for toggleAtlasChat event from mobile bottom nav
    useEffect(() => {
        const handleToggleChat = () => {
            setIsOpen(prev => !prev)
            setIsExpanded(true) // Open in expanded mode on mobile
        }

        window.addEventListener('toggleAtlasChat', handleToggleChat)
        return () => window.removeEventListener('toggleAtlasChat', handleToggleChat)
    }, [])

    // Listen for openAtlasChat event from ArticleView
    useEffect(() => {
        const handleOpenChat = (e: CustomEvent<{ context: string; topic: string }>) => {
            setArticleContext(e.detail.context)
            setIsOpen(true)
            setIsExpanded(true)
            // Add welcome message with context
            setMessages([{
                role: 'assistant',
                content: `I'm ready to help you understand more about "${e.detail.topic}". What would you like to know?`
            }])
        }

        window.addEventListener('openAtlasChat', handleOpenChat as EventListener)
        return () => window.removeEventListener('openAtlasChat', handleOpenChat as EventListener)
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || loading) return

        const userMessage: ChatMessage = { role: 'user', content: input.trim() }
        setMessages((prev) => [...prev, userMessage])
        setInput('')
        setLoading(true)

        try {
            // If we have article context, include it in the query for more relevant responses
            const queryWithContext = articleContext
                ? `[Context: ${articleContext}]\n\nUser question: ${input.trim()}`
                : input.trim()

            const reply = await sendChatMessage(queryWithContext, messages)
            const assistantMessage: ChatMessage = { role: 'assistant', content: reply }
            setMessages((prev) => [...prev, assistantMessage])
        } catch {
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: 'Atlas encountered an error. Please try again.' },
            ])
        } finally {
            setLoading(false)
        }
    }

    const panelClass = `chat-panel ${isOpen ? 'chat-panel--open' : ''} ${isExpanded ? 'chat-panel--expanded' : ''}`

    return (
        <>
            {/* FAB Button */}
            <button
                className={`chat-fab ${isOpen ? 'chat-fab--open' : ''} ${isExpanded ? 'chat-fab--hidden' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? 'Close chat' : 'Open Atlas Chat'}
            >
                {isOpen ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                    </svg>
                )}
            </button>

            {/* Chat Panel */}
            <div className={panelClass}>
                <header className="chat-header">
                    <div className="chat-header-info">
                        <span className="chat-logo">◆</span>
                        <div>
                            <h2>Atlas</h2>
                            <span className="chat-subtitle">AtlasIQ Intelligence</span>
                        </div>
                    </div>
                    <div className="chat-header-actions">
                        {/* Expand/minimize button */}
                        <button
                            className="chat-expand"
                            onClick={() => setIsExpanded(!isExpanded)}
                            aria-label={isExpanded ? 'Minimize chat' : 'Expand chat'}
                        >
                            {isExpanded ? (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3" />
                                </svg>
                            ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                                </svg>
                            )}
                        </button>
                        <button className="chat-close" onClick={() => setIsOpen(false)}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </header>

                <div className="chat-messages">
                    {messages.length === 0 && (
                        <div className="chat-welcome">
                            <p>Hello, I'm <strong>Atlas</strong>.</p>
                            <p>Ask me about any topic, exam, weather, or current affairs.</p>
                        </div>
                    )}
                    {messages.map((msg, i) => (
                        <div key={i} className={`chat-bubble chat-bubble--${msg.role}`}>
                            {msg.content}
                        </div>
                    ))}
                    {loading && (
                        <div className="chat-bubble chat-bubble--assistant chat-bubble--loading">
                            <span className="chat-typing">Atlas is thinking...</span>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <form className="chat-input-form" onSubmit={handleSubmit}>
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask Atlas anything..."
                        className="chat-input"
                        disabled={loading}
                    />
                    <button type="submit" className="chat-send" disabled={loading || !input.trim()}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                        </svg>
                    </button>
                </form>
            </div>

            {/* Backdrop */}
            {isOpen && <div className={`chat-backdrop ${isExpanded ? 'chat-backdrop--expanded' : ''}`} onClick={() => isExpanded ? setIsExpanded(false) : setIsOpen(false)} />}
        </>
    )
}
