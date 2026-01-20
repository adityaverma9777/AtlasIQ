import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { AtlasChat } from '../AtlasChat'
import { MobileBottomNav } from '../MobileBottomNav'
import './Layout.css'

export function Layout() {
    return (
        <div className="layout">
            <Header />
            <main className="main">
                <Outlet />
            </main>
            <footer className="footer desktop-only">
                <div className="container">
                    <span>© 2026 AtlasIQ</span>
                </div>
            </footer>
            <MobileBottomNav />
            <AtlasChat />
        </div>
    )
}

