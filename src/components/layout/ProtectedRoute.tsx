import { Navigate, useLocation } from 'react-router-dom'
import type { Role } from '../../data/mock'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRole: Role
}

export function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
  const location = useLocation()
  
  // Read session from localStorage
  const sessionStr = localStorage.getItem('facecloud_session')
  
  if (!sessionStr) {
    // Redirect to corresponding login route with expired flag if there was a prior session
    const hadSession = !!document.cookie || !!localStorage.getItem('fc_was_logged_in')
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
    localStorage.setItem('fc_was_logged_in', '1')
  } catch (e) {
    localStorage.removeItem('facecloud_session')
    return <Navigate to="/login" state={{ sessionExpired: true }} replace />
  }

  return <>{children}</>
}
