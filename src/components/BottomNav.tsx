import { NavLink } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import { isTimerFinished } from './ActiveTimerStatus'

const links = [
  { to: '/', label: 'Home', icon: '☀' },
  { to: '/timer', label: 'Timer', icon: '⏱' },
  { to: '/account', label: 'Account', icon: '👤' },
]

export function BottomNav() {
  const { activeTimer, phase } = useAppContext()
  const timerFinished = activeTimer ? isTimerFinished(phase) : false

  return (
    <nav className="bottom-nav" aria-label="Main">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            `bottom-nav__link${isActive ? ' bottom-nav__link--active' : ''}`
          }
          end={link.to === '/'}
        >
          <span className="bottom-nav__icon-wrap">
            {link.to === '/timer' && activeTimer && (
              <span
                className={`bottom-nav__timer-live${timerFinished ? ' bottom-nav__timer-live--finished' : ''}`}
                aria-label={timerFinished ? 'Timer finished' : 'Timer running'}
              />
            )}
            <span className="bottom-nav__icon" aria-hidden>
              {link.icon}
            </span>
          </span>
          <span className="bottom-nav__label">{link.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
