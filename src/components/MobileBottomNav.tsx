/**
 * Mobile Bottom Navigation Bar
 * App-like navigation for mobile devices
 */

import { Link, useLocation } from 'react-router-dom'
import {
    LayoutDashboard,
    TrendingUp,
    MapPin,
    GraduationCap,
} from 'lucide-react'
import './MobileBottomNav.css'

interface NavItem {
    path: string
    label: string
    icon: React.ReactNode
    isAtlasAI?: boolean
}

const NAV_ITEMS: NavItem[] = [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/markets', label: 'Markets', icon: <TrendingUp size={20} /> },
    { path: '/india', label: 'India', icon: <MapPin size={20} /> },
    { path: '/learn', label: 'Learn', icon: <GraduationCap size={20} /> },
    { path: '#atlas', label: 'Atlas AI', icon: null, isAtlasAI: true },
]

export function MobileBottomNav() {
    const location = useLocation()

    const handleAtlasClick = () => {
        // Dispatch custom event to open Atlas Chat
        window.dispatchEvent(new CustomEvent('toggleAtlasChat'))
    }

    return (
        <nav className="mobile-bottom-nav">
            {NAV_ITEMS.map((item) => {
                if (item.isAtlasAI) {
                    return (
                        <button
                            key="atlas-ai"
                            className="mobile-nav-item mobile-nav-item--atlas"
                            onClick={handleAtlasClick}
                        >
                            <span className="atlas-ai-icon">
                                <span className="atlas-ai-orb"></span>
                                <span className="atlas-ai-ring atlas-ai-ring--1"></span>
                                <span className="atlas-ai-ring atlas-ai-ring--2"></span>
                                <span className="atlas-ai-ring atlas-ai-ring--3"></span>
                            </span>
                            <span className="mobile-nav-label">{item.label}</span>
                        </button>
                    )
                }

                const isActive = location.pathname === item.path ||
                    (item.path === '/' && location.pathname === '/dashboard')

                return (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`mobile-nav-item ${isActive ? 'mobile-nav-item--active' : ''}`}
                    >
                        <span className="mobile-nav-icon">{item.icon}</span>
                        <span className="mobile-nav-label">{item.label}</span>
                    </Link>
                )
            })}
        </nav>
    )
}

export default MobileBottomNav
