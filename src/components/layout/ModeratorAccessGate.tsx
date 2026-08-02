import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Lock, AlertTriangle, ArrowLeft } from 'lucide-react'
import { mockUsers } from '../../data/mock'

interface ModeratorAccessGateProps {
  children: ReactNode
}

export function ModeratorAccessGate({ children }: ModeratorAccessGateProps) {
  const query = new URLSearchParams(window.location.search)
  if (query.get('dev_login') === 'moderator') {
    localStorage.setItem('facecloud_session', JSON.stringify({
      token: 'mock-jwt-moderator-token-lmn-45678',
      role: 'moderator',
      email: 'moderator@facecloud.ai',
      name: 'Vaneeza Sohaib',
      initials: 'VS',
      emailVerified: true
    }))
    window.location.href = window.location.pathname
    return null
  }

  const sessionStr = localStorage.getItem('facecloud_session')
  
  let hasSession = false
  let isModerator = false
  let isSuspended = false

  if (sessionStr) {
    try {
      const session = JSON.parse(sessionStr)
      hasSession = true
      if (session.role === 'moderator') {
        isModerator = true
        // Look up the user status in mockUsers
        const user = mockUsers.find(u => u.email === session.email)
        if (user && user.status === 'suspended') {
          isSuspended = true
        }
      }
    } catch (e) {
      // Ignore
    }
  }

  const isAccessDenied = !hasSession || !isModerator || isSuspended

  if (isAccessDenied) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center relative p-6 overflow-hidden text-[#F0F4FF]"
        style={{
          background: 'radial-gradient(circle at center, rgba(239, 68, 68, 0.08) 0%, transparent 70%), #05070A',
        }}
      >
        {/* Glow Effects */}
        <div className="absolute top-[20%] left-[20%] w-[400px] h-[400px] rounded-full blur-[120px]" 
          style={{ background: 'rgba(239, 68, 68, 0.05)' }} 
        />
        <div className="absolute bottom-[20%] right-[20%] w-[400px] h-[400px] rounded-full blur-[120px]" 
          style={{ background: 'rgba(249, 115, 22, 0.04)' }} 
        />

        <div className="w-full max-w-md relative z-10 text-center space-y-6">
          <div 
            className="fc-panel-strong p-8 backdrop-blur-xl border border-white/[0.08]"
            style={{ background: 'rgba(10, 13, 20, 0.8)' }}
          >
            {/* Lock/Warning Icon */}
            <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-400 mb-6 shadow-[0_0_20px_rgba(239,68,68,0.15)] animate-pulse">
              {isSuspended ? <AlertTriangle className="w-8 h-8" /> : <Lock className="w-8 h-8" />}
            </div>

            <h2 className="text-xl font-bold tracking-tight text-white mb-2">Access Denied</h2>
            
            <p className="text-xs text-white/50 leading-relaxed mb-8">
              {isSuspended 
                ? 'Your account has been deactivated. Please contact your organization administrator.'
                : 'You must be an active moderator to access this area.'}
            </p>

            <Link 
              to="/"
              className="fc-btn-secondary w-full justify-center text-xs py-3 gap-2 border-white/10 hover:border-white/20"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Home Page
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
