import { PageHeader } from '../../components/layout/PageHeader'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { mockApiEndpoints } from '../../data/mock'
import { Code2, CheckCircle, Zap } from 'lucide-react'

const methodColors: Record<string, { bg: string; text: string }> = {
  GET:    { bg: 'rgba(5,150,105,0.12)',  text: '#059669' },
  POST:   { bg: 'rgba(79,70,229,0.15)',   text: '#6366F1' },
  PATCH:  { bg: 'rgba(217,119,6,0.12)',  text: '#B45309' },
  DELETE: { bg: 'rgba(239,68,68,0.15)',   text: '#DC2626' },
  PUT:    { bg: 'rgba(67,56,202,0.12)',  text: '#6D28D9' },
}

export default function ApiDocs() {
  return (
    <div className="page-enter">
      <PageHeader title="API Documentation" subtitle="FaceCloud REST API endpoints — Swagger/OpenAPI style reference." />

      {/* API info header */}
      <div className="fc-card p-5 mb-5">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #4F46E5, #4338CA)',
              boxShadow: '0 0 20px rgba(79,70,229,0.25)',
            }}
          >
            <Code2 className="w-5 h-5 text-ink" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-ink">FaceCloud API v1.0</h2>
            <p className="text-xs text-ink-faint mt-0.5">
              Base URL:{' '}
              <code className="bg-surface-mute px-1.5 py-0.5 rounded text-[#6366F1] font-mono text-[11px] border border-line">
                https://api.facecloud.io/api/v1
              </code>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 pt-2 border-t border-line">
          <div className="flex items-center gap-1.5 text-xs text-ink-mute">
            <CheckCircle className="w-3.5 h-3.5 text-[#059669]" />
            JWT Bearer Auth required
          </div>
          <div className="flex items-center gap-1.5 text-xs text-ink-mute">
            <Zap className="w-3.5 h-3.5 style={{ color: '#4F46E5' }}" />
            Django REST Framework
          </div>
          <div className="flex items-center gap-1.5 text-xs text-ink-mute">
            <Code2 className="w-3.5 h-3.5 text-[#6D28D9]" />
            OpenAPI 3.0 Compliant
          </div>
        </div>
      </div>

      {/* Endpoint list */}
      <div className="fc-card overflow-hidden">
        <div className="px-5 py-3 border-b border-line bg-surface-mute">
          <p className="text-xs font-semibold text-ink-faint uppercase tracking-wide">Endpoints ({mockApiEndpoints.length})</p>
        </div>
        <div className="divide-y divide-line">
          {mockApiEndpoints.map((ep, i) => {
            const methodStyle = methodColors[ep.method] ?? { bg: '#F1F3F7', text: '#64748B' }
            return (
              <div key={i} className="flex flex-wrap md:flex-nowrap items-center gap-4 px-5 py-3.5 hover:bg-surface-mute transition-colors">
                <span
                  className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold font-mono flex-shrink-0 w-16 text-center"
                  style={{ background: methodStyle.bg, color: methodStyle.text }}
                >
                  {ep.method}
                </span>
                <code className="text-xs font-mono text-ink flex-shrink-0">{ep.path}</code>
                <span className="text-xs text-ink-mute flex-1 truncate">{ep.description}</span>
                <StatusBadge
                  status={ep.status === 'stable' ? 'success' : 'warning'}
                  label={ep.status ?? 'stable'}
                  dot={false}
                />
              </div>
            )
          })}
        </div>
      </div>

      <div
        className="mt-4 p-4 rounded-2xl border"
        style={{
          background: 'rgba(79,70,229,0.04)',
          borderColor: 'rgba(79,70,229,0.20)',
        }}
      >
        <p className="text-xs text-ink-mute">
          <span className="font-semibold text-ink">Note:</span> Full interactive Swagger UI and OpenAPI JSON spec will be available at <code className="text-[#6366F1] font-mono">/api/docs/</code> and <code className="text-[#6366F1] font-mono">/api/openapi.json</code> when the Django backend is deployed.
        </p>
      </div>
    </div>
  )
}
