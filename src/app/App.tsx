import { Component, type ErrorInfo, type ReactNode } from 'react'
import { sessionsClient } from '../features/sessions/api'
import { TrainingSessionsPage } from '../features/sessions/ui/TrainingSessionsPage'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

class AppErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Training sessions render error', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="fatal-error">
          <h1>Training sessions could not open.</h1>
          <p>Reload this page to try again.</p>
          <button className="button button-primary" type="button" onClick={() => window.location.reload()}>Reload page</button>
        </main>
      )
    }
    return this.props.children
  }
}

export function App() {
  return (
    <AppErrorBoundary>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <TrainingSessionsPage client={sessionsClient} />
    </AppErrorBoundary>
  )
}
