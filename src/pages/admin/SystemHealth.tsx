import { PageHeader } from '../../components/layout/PageHeader'
import { SystemHealthCard } from '../../components/features/SystemHealthCard'
import { mockServices } from '../../data/mock'
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react'

export default function SystemHealth() {
  const operational = mockServices.filter(s => s.status === 'operational').length
  const degraded = mockServices.filter(s => s.status === 'degraded').length
  const outage = mockServices.filter(s => s.status === 'outage').length

  return (
    <div>
      <PageHeader title="System Health" subtitle="Real-time status of all AI and infrastructure services." />

      {/* Summary banner */}
      <div className={`mb-5 flex items-center gap-3 p-4 rounded-2xl border ${
        outage > 0 ? 'bg-red-50 border-red-200' : degraded > 0 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'
      }`}>
        {outage > 0
          ? <XCircle className="w-5 h-5 text-error" />
          : degraded > 0
          ? <AlertTriangle className="w-5 h-5 text-warning" />
          : <CheckCircle className="w-5 h-5 text-success" />
        }
        <div>
          <p className="text-sm font-semibold text-ink">
            {outage > 0 ? `${outage} service(s) down` : degraded > 0 ? `${degraded} service(s) degraded` : 'All systems operational'}
          </p>
          <p className="text-xs text-ink-mute">
            {operational} operational · {degraded} degraded · {outage} outage · Last updated just now
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {mockServices.map(service => (
          <SystemHealthCard key={service.name} service={service} />
        ))}
      </div>
    </div>
  )
}
