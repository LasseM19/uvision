import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from './Button'
import { translate } from '../i18n'
import { clearAppCacheAndReload } from '../lib/clearCache'
import { loadState } from '../lib/storage'

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
      const lang = loadState().preferences.language

      return (
        <div className="error-boundary">
          <h1>{translate(lang, 'error.crashTitle')}</h1>
          <p>{translate(lang, 'error.crashBody')}</p>
          <Button fullWidth onClick={this.reload}>
            {translate(lang, 'error.reload')}
          </Button>
          <Button variant="secondary" fullWidth onClick={this.hardReset}>
            {translate(lang, 'error.clearCache')}
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
