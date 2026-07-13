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
    // Redirect to corresponding login route
    if (allowedRole === 'admin') {
      return <Navigate to="/admin/login" state={{ from: location }} replace />
    }
    if (allowedRole === 'moderator') {
      return <Navigate to="/moderator/login" state={{ from: location }} replace />
    }
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  try {
    const session = JSON.parse(sessionStr)
    
    if (session.role !== allowedRole) {
      // Role mismatch, redirect to unauthorized
      return <Navigate to="/unauthorized" replace />
    }
  } catch (e) {
    localStorage.removeItem('facecloud_session')
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
