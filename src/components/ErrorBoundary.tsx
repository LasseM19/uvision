import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from './Button'
import { clearAppCacheAndReload } from '../lib/clearCache'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('UVision crashed:', error, info.componentStack)
  }

  private reload = (): void => {
    window.location.reload()
  }

  private hardReset = (): void => {
    void clearAppCacheAndReload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h1>Something went wrong</h1>
          <p>UVision hit an unexpected error. Try reloading, or clear cached data if the app stays blank.</p>
          <Button fullWidth onClick={this.reload}>
            Reload app
          </Button>
          <Button variant="secondary" fullWidth onClick={this.hardReset}>
            Clear cache and reload
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
