import { Button, Result } from 'antd'
import type { ErrorInfo, ReactNode } from 'react'
import { Component } from 'react'

export interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

// React has no hook-based error boundary — getDerivedStateFromError/componentDidCatch
// only exist on class components, so this is the one deliberate exception to the
// project's functional-components-only convention.
//
// Without this, an uncaught render error anywhere in the tree (e.g. a page reading a
// field off a malformed API response) unmounts the entire app, leaving a blank white
// screen with no sidebar, no header, nothing — see the /masters/customers/:id crash
// this was added after. This catches that instead of letting it blank the page.
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Unhandled error in app tree:', error, info.componentStack)
  }

  handleReload = (): void => {
    window.location.reload()
  }

  handleGoHome = (): void => {
    window.location.href = '/'
  }

  render(): ReactNode {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <Result
          status="error"
          title="Something went wrong"
          subTitle={error.message || 'An unexpected error occurred.'}
          extra={[
            <Button key="reload" type="primary" onClick={this.handleReload}>
              Reload Page
            </Button>,
            <Button key="home" onClick={this.handleGoHome}>
              Go to Dashboard
            </Button>,
          ]}
        />
      </div>
    )
  }
}
