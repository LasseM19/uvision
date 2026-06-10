import { Link } from 'react-router-dom'

interface AccountMenuLinkProps {
  to: string
  title: string
  subtitle?: string
}

export function AccountMenuLink({ to, title, subtitle }: AccountMenuLinkProps) {
  return (
    <Link to={to} className="account-menu-link">
      <span className="account-menu-link__text">
        <span className="account-menu-link__title">{title}</span>
        {subtitle && <span className="account-menu-link__subtitle">{subtitle}</span>}
      </span>
      <span className="account-menu-link__chevron" aria-hidden>
        ›
      </span>
    </Link>
  )
}
