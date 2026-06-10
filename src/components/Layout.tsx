import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { LocationServices } from './LocationServices'
import { ReapplyAlarmOverlay } from './ReapplyAlarmOverlay'
import { usePushSync } from '../hooks/usePushSync'

function LayoutContent() {
  usePushSync()

  return (
    <>
      <main className="app-main">
        <LocationServices />
        <Outlet />
      </main>
      <BottomNav />
      <ReapplyAlarmOverlay />
    </>
  )
}

export function Layout() {
  return (
    <div className="app-shell">
      <LayoutContent />
    </div>
  )
}
