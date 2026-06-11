import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { NotificationIcon, MenuIcon, CancelIcon } from '../lib/icons.jsx'
import { fetchNotifications } from '../lib/api.js'
import NotificationPanel from './NotificationPanel.jsx'
import './Navbar.css'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showNotif, setShowNotif] = useState(false)
  const [unread, setUnread] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    fetchNotifications()
      .then(notifs => {
        const lastSeen = localStorage.getItem('rcf_notif_seen') || '1970-01-01'
        setUnread(notifs.filter(n => n.created_at > lastSeen).length)
      })
      .catch(() => {})
  }, [])

  const handleBell = () => {
    setShowNotif(s => !s)
    localStorage.setItem('rcf_notif_seen', new Date().toISOString())
    setUnread(0)
  }

  return (
    <>
      <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
        <div className="navbar__inner container">
          <button className="navbar__logo" onClick={() => navigate('/')}>
            <span className="navbar__logo-badge">RCF</span>
            <span className="navbar__logo-name">FUTA</span>
          </button>

          <div className="navbar__links">
            <NavLink to="/" end className={({ isActive }) => `navbar__link ${isActive ? 'active' : ''}`}>Home</NavLink>
            <NavLink to="/gallery" className={({ isActive }) => `navbar__link ${isActive ? 'active' : ''}`}>Gallery</NavLink>
            <NavLink to="/playlist" className={({ isActive }) => `navbar__link ${isActive ? 'active' : ''}`}>Playlist</NavLink>
          </div>

          <div className="navbar__right">
            <button className="navbar__bell" onClick={handleBell} aria-label="Notifications">
              <NotificationIcon size={20} />
              {unread > 0 && <span className="navbar__badge">{unread > 9 ? '9+' : unread}</span>}
            </button>
            <button className="navbar__toggle" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
              {menuOpen ? <CancelIcon size={20} /> : <MenuIcon size={20} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="navbar__mobile">
            <NavLink to="/" end onClick={() => setMenuOpen(false)} className={({ isActive }) => `navbar__mobile-link ${isActive ? 'active' : ''}`}>Home</NavLink>
            <NavLink to="/gallery" onClick={() => setMenuOpen(false)} className={({ isActive }) => `navbar__mobile-link ${isActive ? 'active' : ''}`}>Gallery</NavLink>
            <NavLink to="/playlist" onClick={() => setMenuOpen(false)} className={({ isActive }) => `navbar__mobile-link ${isActive ? 'active' : ''}`}>Playlist</NavLink>
          </div>
        )}
      </nav>

      {showNotif && <NotificationPanel onClose={() => setShowNotif(false)} />}
    </>
  )
}
