import { Component } from 'react'
import { Button } from './Button'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-sm font-medium text-white">Something went wrong loading this page.</p>
          <p className="max-w-md text-xs text-slate-400">{this.state.error.message}</p>
          <Button
            type="button"
            onClick={() => {
              this.setState({ error: null })
              window.location.reload()
            }}
          >
            Reload page
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
