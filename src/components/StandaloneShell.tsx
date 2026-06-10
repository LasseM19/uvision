import type { ReactNode } from 'react'

export function StandaloneShell({ children }: { children: ReactNode }) {
  return (
    <div className="standalone-shell">
      <main className="standalone-main">{children}</main>
    </div>
  )
}
