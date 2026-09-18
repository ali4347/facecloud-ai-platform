import { Link } from 'react-router-dom'
import { AlertCircle, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center relative p-6 overflow-hidden"
      style={{
        background:
          'radial-gradient(circle at 20% 15%, rgba(249, 115, 22,0.12), transparent 38%),' +
          'radial-gradient(circle at 80% 85%, rgba(234, 88, 12,0.08), transparent 38%),' +
          'rgb(var(--a-surface-soft))',
      }}
    >
      <div className="absolute top-[20%] left-[20%] w-72 h-72 rounded-full blur-[80px]"
        style={{ background: 'rgba(249, 115, 22,0.05)' }} />
      
      <div className="w-full max-w-md relative z-10 space-y-6 text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
          style={{
            background: 'rgba(249, 115, 22,0.12)',
            border: '1px solid rgba(249, 115, 22,0.30)',
            color: '#FB923C',
            boxShadow: '0 0 24px rgba(249, 115, 22,0.15)'
          }}
        >
          <AlertCircle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">Page Not Found</h1>
          <p className="text-xs max-w-xs mx-auto leading-relaxed" style={{ color: 'rgb(var(--a-ink) / 0.50)' }}>
            The requested page does not exist or has been moved to a new folder path.
          </p>
        </div>

        <div className="fc-panel-strong p-6 space-y-4">
          <p className="text-[11px]" style={{ color: 'rgb(var(--a-ink) / 0.42)' }}>
            Please check the web URL or navigate back to the main user/admin control center.
          </p>
          <Link to="/" className="fc-btn-primary w-full text-xs font-bold py-3 flex items-center justify-center gap-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Return Home
          </Link>
        </div>
      </div>
    </div>
  )
}
