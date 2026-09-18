import { useState } from 'react'
import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import { mockSecurityAlerts } from '../../data/mock'
import { ShieldAlert, AlertOctagon, Lock, CheckCircle } from 'lucide-react'

export default function Security() {
  const [alerts, setAlerts] = useState(mockSecurityAlerts)

  const handleResolve = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id))
  }

  return (
    <div className="space-y-6 page-enter">
      <PageHeader 
        title="Security & Suspicious Activity"
        subtitle="Audit failed console authentication attempts and API rate limit threshold alerts."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Security Alerts List */}
        <div className="lg:col-span-8 space-y-6">
          <ChartCard title="Security Events Registry" subtitle="Real-time network security logs">
            {alerts.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center text-ink-mute gap-2">
                <CheckCircle className="w-8 h-8 text-[#10B981] animate-bounce" />
                <p className="text-xs font-semibold">Zero security threats detected inside current firewall buffer.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {alerts.map(a => (
                  <div 
                    key={a.id} 
                    className="p-4 rounded-3xl border transition-all flex items-start justify-between gap-4"
                    style={{
                      background: a.risk === 'critical' ? 'rgba(239,68,68,0.06)' : a.risk === 'high' ? 'rgba(245,158,11,0.06)' : 'rgb(var(--a-surface-mute))',
                      borderColor: a.risk === 'critical' ? 'rgba(239,68,68,0.20)' : a.risk === 'high' ? 'rgba(245,158,11,0.20)' : 'rgb(var(--a-line))'
                    }}
                  >
                    <div className="flex gap-3 text-xs">
                      <div 
                        className={`p-2.5 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                          a.risk === 'critical' || a.risk === 'high' ? 'animate-pulse' : ''
                        }`}
                        style={{
                          background: 'rgb(var(--a-surface-mute))',
                          border: '1px solid rgb(var(--a-line))',
                          color: a.risk === 'critical' || a.risk === 'high' ? '#EF4444' : 'rgb(var(--a-ink-mute))'
                        }}
                      >
                        {a.type === 'failed_login' ? <Lock className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-ink">{a.message}</h4>
                          <span className={`badge text-[9px] ${
                            a.risk === 'critical' ? 'badge-error' :
                            a.risk === 'high' ? 'badge-warning' : 'badge-info'
                          }`}>
                            {a.risk} risk
                          </span>
                        </div>
                        <p className="text-[10px] text-ink-faint">IP Address: {a.ip} &bull; Timestamp: {new Date(a.timestamp).toLocaleString()}</p>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleResolve(a.id)}
                      className="fc-btn-secondary !py-1.5 !px-3 !text-[10px] font-bold"
                    >
                      Dismiss Event
                    </button>
                  </div>
                ))}
              </div>
            )}
          </ChartCard>
        </div>

        {/* Right Column: Threats Overview */}
        <div className="lg:col-span-4 space-y-6">
          <ChartCard title="Firewall Shield Status" subtitle="Active threat counters">
            <div className="space-y-6">
              
              <div className="p-4 rounded-3xl bg-surface-mute border border-line text-xs text-ink-mute space-y-3.5">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider pb-1.5 border-b border-line text-ink-faint">
                  <span>Audit Parameter</span>
                  <span>Shield Status</span>
                </div>
                <div className="flex justify-between">
                  <span>Failed Authentications:</span>
                  <span className="font-bold text-ink">
                    {alerts.filter(a => a.type === 'failed_login').length} logs
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Rate limits tripped:</span>
                  <span className="font-bold text-ink">
                    {alerts.filter(a => a.type === 'rate_limit').length} events
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Current Threat Index:</span>
                  <span className={`font-bold ${alerts.some(a => a.risk === 'critical') ? 'text-[#EF4444]' : 'text-[#10B981]'}`}>
                    {alerts.some(a => a.risk === 'critical') ? 'CRITICAL' : 'SECURE'}
                  </span>
                </div>
              </div>

              <div
                className="p-4 rounded-3xl flex gap-3 text-xs"
                style={{
                  background: 'rgba(245,158,11,0.06)',
                  borderColor: 'rgba(245,158,11,0.20)',
                  color: 'rgb(var(--a-ink-mute))'
                }}
              >
                <AlertOctagon className="w-5 h-5 text-[#FCD34D] flex-shrink-0" />
                <p className="leading-relaxed">
                  Firewall rates limit locks IP addresses automatically on encountering 15 failed logins in a 10-second window.
                </p>
              </div>

            </div>
          </ChartCard>
        </div>

      </div>
    </div>
  )
}
