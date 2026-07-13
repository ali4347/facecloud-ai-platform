import { Link } from 'react-router-dom'
import { ShieldAlert, ArrowLeft } from 'lucide-react'

export default function Unauthorized() {
  return (
    <div
      className="min-h-screen flex items-center justify-center relative p-6 overflow-hidden"
      style={{
        background:
          'radial-gradient(circle at 20% 15%, rgba(239,68,68,0.12), transparent 38%),' +
          'radial-gradient(circle at 80% 85%, rgba(123,97,255,0.08), transparent 38%),' +
          '#000000',
      }}
    >
      {/* Glow */}
      <div className="absolute top-[20%] left-[20%] w-72 h-72 rounded-full blur-[80px]"
        style={{ background: 'rgba(239,68,68,0.05)' }} />
      
      <div className="w-full max-w-md relative z-10 space-y-6 text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
          style={{
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.30)',
            color: '#EF4444',
            boxShadow: '0 0 24px rgba(239,68,68,0.15)'
          }}
        >
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Access Denied</h1>
          <p className="text-xs max-w-xs mx-auto leading-relaxed" style={{ color: 'rgba(255,255,255,0.50)' }}>
            Your authenticated role does not possess permissions to view this directory block.
          </p>
        </div>

        <div className="fc-panel-strong p-6 space-y-4">
          <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.42)' }}>
            To resolve this, please sign out and sign in using a credential mapping with appropriate clearances.
          </p>
          <div className="flex gap-3">
            <Link to="/" className="fc-btn-secondary w-full text-xs font-bold py-3">
              <ArrowLeft className="w-3.5 h-3.5" /> Home Page
            </Link>
            <Link to="/login" className="fc-btn-primary w-full text-xs font-bold py-3">
              Re-Authenticate
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
