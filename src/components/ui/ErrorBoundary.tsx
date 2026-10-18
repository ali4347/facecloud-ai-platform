import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props { children: ReactNode }
interface State { failed: boolean }

/**
 * Keeps one screen's crash from blanking the whole panel: the sidebar stays, the screen says what happened.
 * Give it a `key` (the route) so moving to another screen starts it fresh.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }
  static getDerivedStateFromError(): State { return { failed: true } }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('Screen crashed:', error, info.componentStack) }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div role="alert" className="text-center py-20">
        <AlertTriangle className="w-7 h-7 mx-auto mb-3 text-[#EF4444]" />
        <p className="text-sm font-semibold text-ink">This screen could not be shown.</p>
        <p className="text-xs text-ink-mute mt-1">The data it received was not in the shape it expects. Reload the page, or try another screen.</p>
      </div>
    )
  }
}
