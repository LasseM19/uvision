import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Layout } from './components/Layout'
import { StandaloneShell } from './components/StandaloneShell'
import { AppProvider, useAppContext } from './context/AppContext'
import { useDocumentLanguage } from './hooks/useI18n'
import { AccountPage } from './pages/AccountPage'
import {
  AccountHomePage,
  AccountLanguagePage,
  AccountLocationPage,
  AccountNotificationsPage,
  AccountProfilePage,
  AccountSkinPage,
  AccountTroubleshootingPage,
} from './pages/account/AccountSubpages'
import { HomePage } from './pages/HomePage'
import { LearnPage } from './pages/LearnPage'
import { HistoryPage, OnboardingPage } from './pages/SettingsPage'
import { TimerPage } from './pages/TimerPage'

function AppRoutes() {
  const { preferences } = useAppContext()
  const location = useLocation()
  useDocumentLanguage()

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
        <Route path="/timer" element={<TimerPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/account/profile" element={<AccountProfilePage />} />
        <Route path="/account/location" element={<AccountLocationPage />} />
        <Route path="/account/skin" element={<AccountSkinPage />} />
        <Route path="/account/language" element={<AccountLanguagePage />} />
        <Route path="/account/home" element={<AccountHomePage />} />
        <Route path="/account/notifications" element={<AccountNotificationsPage />} />
        <Route path="/account/troubleshooting" element={<AccountTroubleshootingPage />} />
        <Route path="/account/learn" element={<LearnPage />} />
        <Route path="/account/history" element={<HistoryPage />} />
        <Route path="/tracker" element={<Navigate to="/timer" replace />} />
        <Route path="/map" element={<Navigate to="/account" replace />} />
        <Route path="/forecast" element={<Navigate to="/" replace />} />
        <Route path="/settings" element={<Navigate to="/account" replace />} />
        <Route path="/learn" element={<Navigate to="/account/learn" replace />} />
        <Route path="/history" element={<Navigate to="/account/history" replace />} />
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
