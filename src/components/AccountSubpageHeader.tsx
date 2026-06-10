import { Link } from 'react-router-dom'

interface AccountSubpageHeaderProps {
  title: string
  eyebrow?: string
}

export function AccountSubpageHeader({ title, eyebrow = 'Account' }: AccountSubpageHeaderProps) {
  return (
    <header className="page-header account-subpage-header">
      <div>
        <Link to="/account" className="account-back-link">
          ← Account
        </Link>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="page-title">{title}</h1>
      </div>
    </header>
  )
}
