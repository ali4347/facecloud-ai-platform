import { Navigate, useLocation } from 'react-router-dom'
import type { Role } from '../../data/mock'
import { clearSession, readSessionRaw } from '../../lib/session'
import { wasSignedInKey } from '../../lib/portal'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRole: Role
}

export function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
  const location = useLocation()
  
  // This portal's own session: the user, admin and moderator sessions are stored apart, so signing in to one
  // portal never signs another out or sends it to "Access Denied".
  const sessionStr = readSessionRaw(allowedRole)
  
  if (!sessionStr) {
    // Redirect to corresponding login route with expired flag if there was a prior session
    const hadSession = !!document.cookie || !!localStorage.getItem(wasSignedInKey(allowedRole))
    const state = hadSession ? { sessionExpired: true } : undefined
    if (allowedRole === 'admin') {
      return <Navigate to="/admin/login" state={state ?? { from: location }} replace />
    }
    if (allowedRole === 'moderator') {
      return <Navigate to="/moderator/login" state={state ?? { from: location }} replace />
    }
    return <Navigate to="/login" state={state ?? { from: location }} replace />
  }

  try {
    const session = JSON.parse(sessionStr)

    if (session.role !== allowedRole) {
      return <Navigate to="/unauthorized" replace />
    }
    // Mark that user was logged in, so we can detect expiry on next redirect
    localStorage.setItem(wasSignedInKey(allowedRole), '1')
  } catch (e) {
    clearSession(allowedRole)
    return <Navigate to="/login" state={{ sessionExpired: true }} replace />
  }

  return <>{children}</>
}
