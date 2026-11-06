import type { ReactNode } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { Lock, ArrowLeft, LogIn } from 'lucide-react'
import { getSession } from '../../lib/session'

interface ModeratorAccessGateProps {
  children: ReactNode
}

/**
 * Guards the moderator portal.
 *
 * Two outcomes, deliberately different:
 *  - no session at all → send them to the moderator login, the way the admin
 *    portal does. Showing "Access Denied" here left a moderator who typed
 *    /moderator with no way in but to guess the login URL.
 *  - signed in as someone else → refuse, and offer the moderator login so they
 *    can switch accounts on purpose rather than by wandering.
 * A suspended moderator is not handled here: the server refuses a suspended account at sign-in and on every request.
 */
export function ModeratorAccessGate({ children }: ModeratorAccessGateProps) {
  const location = useLocation()
  const session = getSession()

  if (!session) {
    return <Navigate to="/moderator/login" state={{ from: location }} replace />
  }

  if (session.role === 'moderator') {
    return <>{children}</>
  }

  return (
    <div className="fc-app min-h-screen flex items-center justify-center relative p-6 overflow-hidden">
      {/* Ambient wash, kept subtle in both appearances */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(circle at center, rgba(239,68,68,0.07) 0%, transparent 70%)' }}
      />

      <div className="w-full max-w-md relative z-10 text-center">
        <div className="fc-panel-strong p-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-500 mb-6">
            <Lock className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-bold tracking-tight text-ink mb-2">Access Denied</h2>

          <p className="text-[13px] text-ink-mute leading-relaxed mb-8">
            You are signed in with an account that does not have moderator access.
          </p>

          <div className="flex flex-col gap-2.5">
            <Link
              to="/moderator/login"
              className="fc-btn-primary w-full justify-center text-[13px] py-3 gap-2"
            >
              <LogIn className="w-3.5 h-3.5" /> Sign in as moderator
            </Link>
            <Link
              to="/"
              className="fc-btn-secondary w-full justify-center text-[13px] py-3 gap-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Home Page
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
