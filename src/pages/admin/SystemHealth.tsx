import { PageHeader } from '../../components/layout/PageHeader'
import { SystemHealthCard } from '../../components/features/SystemHealthCard'
import { AsyncGate } from '../../components/admin/AsyncGate'
import { OldBackendNotice } from '../../components/admin/OldBackendNotice'
import { useSystemHealth } from '../../lib/adminHealth'
import { formatDateTime } from '../../lib/utils'
import { CheckCircle, AlertTriangle, XCircle, RefreshCw } from 'lucide-react'

export default function SystemHealth() {
  const state = useSystemHealth()

  return (
    <div>
      <PageHeader title="System Health" subtitle="Status of the services this backend depends on, checked when you open the page." />

      <AsyncGate state={state} what="the system health">
        {({ health }) => {
          const count = (status: string) => health.services.filter(s => s.status === status).length
          const down = count('down')
          const degraded = count('degraded')
          return (
            <>
              {health.legacy && <OldBackendNotice what="some service details are not reported" />}
              <div className={`mb-5 flex items-center gap-3 p-4 rounded-2xl border ${
                down > 0 ? 'bg-red-500/10 border-red-500/30' : degraded > 0 ? 'bg-amber-50 border-amber-500/30' : 'bg-green-50 border-green-200'
              }`}>
                {down > 0 ? <XCircle className="w-5 h-5 text-error" /> : degraded > 0 ? <AlertTriangle className="w-5 h-5 text-warning" /> : <CheckCircle className="w-5 h-5 text-success" />}
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ink">
                    {down > 0 ? `${down} service(s) down` : degraded > 0 ? `${degraded} service(s) degraded` : 'All services operational'}
                  </p>
                  <p className="text-xs text-ink-mute">
                    {count('operational')} operational · {degraded} degraded · {down} down · Checked {formatDateTime(health.checked_at)}
                  </p>
                </div>
                <button type="button" onClick={state.reload} className="text-xs font-bold text-[#FB923C] hover:underline inline-flex items-center gap-1.5 cursor-pointer">
                  <RefreshCw className="w-3.5 h-3.5" />Check again
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {health.services.map(service => <SystemHealthCard key={service.key} service={service} />)}
              </div>
            </>
          )
        }}
      </AsyncGate>
    </div>
  )
}
