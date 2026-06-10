import { useMemo } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { AccountSubpageHeader } from '../components/AccountSubpageHeader'
import { ApplicationLogCard } from '../components/ApplicationLogCard'
import { Logo } from '../components/Logo'
import { useAppContext } from '../context/AppContext'
import { useI18n } from '../hooks/useI18n'
import { getSpfLabel } from '../lib/storage'

export function HistoryPage() {
  const { logs, deleteApplicationLog } = useAppContext()
  const { t } = useI18n()

  const stats = useMemo(() => {
    const now = Date.now()
    const fourteenDaysAgo = now - 14 * 86400_000
    const recent = logs.filter((l) => new Date(l.appliedAt).getTime() >= fourteenDaysAgo)
    const daysWithApplication = new Set(
      recent.map((l) => new Date(l.appliedAt).toDateString()),
    ).size
    return { daysWithApplication, total: recent.length }
  }, [logs])

  return (
    <div className="page">
      <AccountSubpageHeader title={t('history.title')} />

      <Card className="stats-card">
        <p className="stats-value">{stats.daysWithApplication}</p>
        <p className="stats-label">{t('history.daysProtected')}</p>
        <p className="stats-sub">{t('history.applicationsLogged', { count: stats.total })}</p>
      </Card>

      {logs.length === 0 ? (
        <Card>
          <p>{t('history.empty')}</p>
          <Link to="/timer">
            <Button variant="secondary" fullWidth>
              {t('history.goToTimer')}
            </Button>
          </Link>
        </Card>
      ) : (
        <>
          <p className="hint-text log-list-hint">{t('timer.swipeToDelete')}</p>
          <div className="log-list">
            {logs.map((log) => (
              <ApplicationLogCard key={log.id} log={log} onDelete={deleteApplicationLog} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export function OnboardingPage() {
  const { preferences, setPreferences } = useAppContext()
  const { t, skinTypeLabel } = useI18n()

  function finish() {
    setPreferences({ onboardingComplete: true })
  }

  if (preferences.onboardingComplete) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="page onboarding-page">
      <div className="onboarding-brand">
        <Logo size="lg" />
      </div>
      <header className="page-header onboarding-header">
        <div>
          <p className="eyebrow">{t('onboarding.welcome')}</p>
          <h1 className="page-title">{t('onboarding.title')}</h1>
        </div>
      </header>

      <p className="intro-text">{t('onboarding.intro')}</p>

      <section className="section">
        <h2 className="section-title">{t('onboarding.skinType')}</h2>
        <div className="option-list">
          {([1, 2, 3, 4, 5, 6] as const).map((type) => (
            <button
              key={type}
              type="button"
              className={`option-row${preferences.skinType === type ? ' option-row--active' : ''}`}
              onClick={() => setPreferences({ skinType: type })}
            >
              <span>{t('skinPage.typeN', { n: type })}</span>
              <span className="option-sub">{skinTypeLabel(type)}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">{t('onboarding.usualSpf')}</h2>
        <div className="pill-group">
          {([15, 30, 50] as const).map((spf) => (
            <button
              key={spf}
              type="button"
              className={`pill${preferences.spf === spf ? ' pill--active' : ''}`}
              onClick={() => setPreferences({ spf })}
            >
              {getSpfLabel(spf)}
            </button>
          ))}
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">{t('onboarding.morningReminder')}</h2>
        <Card>
          <label className="field-label" htmlFor="onboard-time">
            {t('onboarding.morningHint')}
          </label>
          <input
            id="onboard-time"
            type="time"
            className="time-input"
            value={preferences.morningCheckTime}
            onChange={(e) => setPreferences({ morningCheckTime: e.target.value })}
          />
        </Card>
      </section>

      <Button fullWidth onClick={finish}>
        {t('onboarding.getStarted')}
      </Button>
    </div>
  )
}
