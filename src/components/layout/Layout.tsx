import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { AtlasChat } from '../AtlasChat'
import './Layout.css'

export function Layout() {
    return (
        <div className="layout">
            <Header />
            <main className="main">
                <Outlet />
            </main>
            <footer className="footer">
                <div className="container">
                    <span>© 2026 AtlasIQ</span>
                </div>
            </footer>
            <AtlasChat />
        </div>
    )
}
