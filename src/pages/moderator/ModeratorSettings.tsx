import { useState, useEffect } from 'react'
import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import { ShieldCheck, Mail, RefreshCw } from 'lucide-react'

export default function ModeratorSettings() {
  const [session, setSession] = useState<any>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [notifyRisk, setNotifyRisk] = useState(true)

  useEffect(() => {
    const sessionStr = localStorage.getItem('facecloud_session')
    if (sessionStr) {
      try {
        setSession(JSON.parse(sessionStr))
      } catch (e) {
        // Ignore
      }
    }
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Moderator Settings"
        subtitle="Manage queue polling preferences and inspect active session certificates."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Moderator preferences */}
        <div className="lg:col-span-7 space-y-6">
          <ChartCard title="Review Preferences" subtitle="Queue polling options">
            <div className="space-y-4">
              
              <label className="flex items-start gap-3 p-4 rounded-3xl bg-surface-mute border border-line cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={autoRefresh}
                  onChange={e => setAutoRefresh(e.target.checked)}
                  className="rounded mt-1 cursor-pointer"
                />
                <div className="text-xs">
                  <h4 className="font-bold text-ink flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5" /> Auto-Refresh Review Queue</h4>
                  <p className="text-[#8A96AD] mt-0.5 leading-relaxed">Regularly pull newly rejected image files from validator service worker nodes.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 rounded-3xl bg-surface-mute border border-line cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={notifyRisk}
                  onChange={e => setNotifyRisk(e.target.checked)}
                  className="rounded mt-1 cursor-pointer"
                />
                <div className="text-xs">
                  <h4 className="font-bold text-ink flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> High Risk Alerts Email</h4>
                  <p className="text-[#8A96AD] mt-0.5 leading-relaxed">Dispatches an email ping alert when an asset matches high/critical risk parameters.</p>
                </div>
              </label>

              <button 
                onClick={() => alert('Settings saved successfully!')}
                className="fc-btn-primary text-xs py-3 w-full justify-center"
              >
                Save Preferences
              </button>

            </div>
          </ChartCard>
        </div>

        {/* Right Column: Active session inspection */}
        <div className="lg:col-span-5">
          <ChartCard title="Session Credentials Registry" subtitle="Active JWT certificate audits">
            <div className="space-y-6">
              
              <div className="p-4 rounded-3xl bg-surface-mute border border-line text-xs text-ink-mute space-y-3.5">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider pb-1.5 border-b border-line">
                  <span>Session parameter</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> ACTIVE</span>
                </div>
                <div className="flex justify-between">
                  <span>Authenticated User:</span>
                  <span className="font-bold text-ink">{session?.name || 'Vaneeza Sohaib'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Assigned Role:</span>
                  <span className="font-bold text-accent capitalize">{session?.role || 'moderator'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Active JWT token signature:</span>
                  <span className="font-bold text-ink truncate max-w-[160px]">{session?.token || 'mock-jwt-token-expired'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cert Encryption algorithm:</span>
                  <span className="font-bold text-ink">HS256 SHA-256</span>
                </div>
              </div>

            </div>
          </ChartCard>
        </div>

      </div>
    </div>
  )
}
