import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Home', icon: '☀' },
  { to: '/tracker', label: 'Tracker', icon: '🧴' },
  { to: '/forecast', label: 'Forecast', icon: '📅' },
  { to: '/learn', label: 'Learn', icon: '📖' },
]

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Main">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) => `bottom-nav__link${isActive ? ' bottom-nav__link--active' : ''}`}
          end={link.to === '/'}
        >
          <span className="bottom-nav__icon" aria-hidden>
            {link.icon}
          </span>
          <span className="bottom-nav__label">{link.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
