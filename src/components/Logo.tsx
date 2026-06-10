interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'full' | 'compact'
  className?: string
}

const sizes = {
  sm: 72,
  md: 132,
  lg: 240,
} as const

const compactHeight = 96

export function Logo({ size = 'md', variant = 'full', className = '' }: LogoProps) {
  const px = sizes[size]
  const isCompact = variant === 'compact'

  return (
    <img
      src="/logo.png"
      alt="UVision"
      width={isCompact ? undefined : px}
      height={isCompact ? compactHeight : px}
      className={`app-logo${isCompact ? ' app-logo--compact' : ''} ${className}`.trim()}
      style={isCompact ? { height: compactHeight, width: 'auto' } : { width: px, height: 'auto' }}
    />
  )
}
