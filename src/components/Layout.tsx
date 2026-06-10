import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { LocationServices } from './LocationServices'

export function Layout() {
  return (
    <div className="app-shell">
      <main className="app-main">
        <LocationServices />
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
