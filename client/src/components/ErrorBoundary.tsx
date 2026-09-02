import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, message: error instanceof Error ? error.message : 'Terjadi kesalahan tak terduga' }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  private handleReset = () => {
    this.setState({ hasError: false, message: '' })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface)] p-6 text-[var(--color-ink)]">
          <div className="w-full max-w-md rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-6 shadow-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[var(--color-negative-soft)] text-[var(--color-negative)] text-lg font-bold">
              !
            </div>
            <h1 className="mt-3 text-base font-bold tracking-tight">Terjadi kesalahan</h1>
            <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
              Sesuatu tidak berjalan seperti seharusnya. Silakan muat ulang halaman.
            </p>
            <pre className="mt-3 max-h-24 overflow-auto rounded-[6px] bg-[var(--color-surface-sunken)] p-2 text-[11px] text-[var(--color-negative)]">
              {this.state.message}
            </pre>
            <button
              type="button"
              onClick={this.handleReset}
              className="mt-4 inline-flex w-full items-center justify-center rounded-[6px] bg-[var(--color-btn-primary-bg)] px-3 py-2 text-xs font-semibold text-[var(--color-btn-primary-text)] transition-opacity hover:opacity-90"
            >
              Muat Ulang
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
