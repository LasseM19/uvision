import { NavLink } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import { useI18n } from '../hooks/useI18n'
import { isTimerFinished } from './ActiveTimerStatus'

export function BottomNav() {
  const { activeTimer, phase } = useAppContext()
  const { t } = useI18n()
  const timerFinished = activeTimer ? isTimerFinished(phase) : false

  const links = [
    { to: '/', label: t('nav.home'), icon: '☀' },
    { to: '/timer', label: t('nav.timer'), icon: '⏱' },
    { to: '/account', label: t('nav.account'), icon: '👤' },
  ]

  return (
    <nav className="bottom-nav" aria-label={t('nav.main')}>
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
                aria-label={timerFinished ? t('nav.timerFinished') : t('nav.timerRunning')}
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
