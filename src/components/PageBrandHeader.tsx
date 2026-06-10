import { Logo } from './Logo'

interface PageBrandHeaderProps {
  title: string
  eyebrow?: string
  className?: string
}

export function PageBrandHeader({ title, eyebrow, className = '' }: PageBrandHeaderProps) {
  return (
    <header className={`page-header page-brand-header ${className}`.trim()}>
      <Logo variant="compact" />
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="page-title">{title}</h1>
      </div>
    </header>
  )
}
