import { Link } from 'react-router-dom'
import { SearchInput } from './SearchInput'
import { LocationSelector } from './LocationSelector'
import './Header.css'

const navLinks = [
    { to: '/', label: 'Dashboard' },
    { to: '/markets', label: 'Markets' },
    { to: '/india', label: 'India' },
    { to: '/learn', label: 'Learn' },
]

export function Header() {
    return (
        <header className="header">
            <div className="container header-inner">
                <Link to="/" className="logo">
                    <img src="/logo.png" alt="AtlasIQ" className="logo-mark" />
                    <span className="logo-text">
                        <span className="logo-atlas">Atlas</span>
                        <span className="logo-iq">IQ</span>
                    </span>
                </Link>

                <nav className="nav">
                    {navLinks.map((link) => (
                        <Link key={link.to} to={link.to} className="nav-link">
                            {link.label}
                        </Link>
                    ))}
                </nav>

                <div className="header-actions">
                    <LocationSelector />
                    <SearchInput />
                </div>
            </div>
        </header>
    )
}


