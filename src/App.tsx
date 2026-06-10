import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Layout } from './components/Layout'
import { StandaloneShell } from './components/StandaloneShell'
import { AppProvider, useAppContext } from './context/AppContext'
import { ForecastPage } from './pages/ForecastPage'
import { HomePage } from './pages/HomePage'
import { LearnPage } from './pages/LearnPage'
import { HistoryPage, OnboardingPage, SettingsPage } from './pages/SettingsPage'
import { TrackerPage } from './pages/TrackerPage'

function AppRoutes() {
  const { preferences } = useAppContext()
  const location = useLocation()

  if (!preferences.onboardingComplete && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  return (
    <Routes>
      <Route
        path="/onboarding"
        element={
          preferences.onboardingComplete ? (
            <Navigate to="/" replace />
          ) : (
            <StandaloneShell>
              <OnboardingPage />
            </StandaloneShell>
          )
        }
      />
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/tracker" element={<TrackerPage />} />
        <Route path="/forecast" element={<ForecastPage />} />
        <Route path="/learn" element={<LearnPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/history" element={<HistoryPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  )
}
