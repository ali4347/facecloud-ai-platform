import { PageHeader } from '../../components/layout/PageHeader'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { mockApiEndpoints } from '../../data/mock'
import { Code2, CheckCircle, Zap } from 'lucide-react'

const methodColors: Record<string, { bg: string; text: string }> = {
  GET:    { bg: 'rgba(79,255,176,0.12)',  text: '#4FFFB0' },
  POST:   { bg: 'rgba(249, 115, 22,0.15)',   text: '#FB923C' },
  PATCH:  { bg: 'rgba(245,158,11,0.12)',  text: '#FCD34D' },
  DELETE: { bg: 'rgba(239,68,68,0.15)',   text: '#F87171' },
  PUT:    { bg: 'rgba(234, 88, 12,0.12)',  text: '#A78BFA' },
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
              background: 'linear-gradient(135deg, #F97316, #EA580C)',
              boxShadow: '0 0 20px rgba(249, 115, 22,0.25)',
            }}
          >
            <Code2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">FaceCloud API v1.0</h2>
            <p className="text-xs text-white/40 mt-0.5">
              Base URL:{' '}
              <code className="bg-white/[0.04] px-1.5 py-0.5 rounded text-[#FB923C] font-mono text-[11px] border border-white/[0.08]">
                https://api.facecloud.io/api/v1
              </code>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 pt-2 border-t border-white/[0.06]">
          <div className="flex items-center gap-1.5 text-xs text-white/60">
            <CheckCircle className="w-3.5 h-3.5 text-[#4FFFB0]" />
            JWT Bearer Auth required
          </div>
          <div className="flex items-center gap-1.5 text-xs text-white/60">
            <Zap className="w-3.5 h-3.5 style={{ color: '#F97316' }}" />
            Django REST Framework
          </div>
          <div className="flex items-center gap-1.5 text-xs text-white/60">
            <Code2 className="w-3.5 h-3.5 text-[#A78BFA]" />
            OpenAPI 3.0 Compliant
          </div>
        </div>
      </div>

      {/* Endpoint list */}
      <div className="fc-card overflow-hidden">
        <div className="px-5 py-3 border-b border-white/[0.08] bg-white/[0.02]">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wide">Endpoints ({mockApiEndpoints.length})</p>
        </div>
        <div className="divide-y divide-white/[0.06]">
          {mockApiEndpoints.map((ep, i) => {
            const methodStyle = methodColors[ep.method] ?? { bg: 'rgba(255,255,255,0.06)', text: 'rgba(255,255,255,0.5)' }
            return (
              <div key={i} className="flex flex-wrap md:flex-nowrap items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                <span
                  className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold font-mono flex-shrink-0 w-16 text-center"
                  style={{ background: methodStyle.bg, color: methodStyle.text }}
                >
                  {ep.method}
                </span>
                <code className="text-xs font-mono text-white flex-shrink-0">{ep.path}</code>
                <span className="text-xs text-white/50 flex-1 truncate">{ep.description}</span>
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
          background: 'rgba(249, 115, 22,0.04)',
          borderColor: 'rgba(249, 115, 22,0.20)',
        }}
      >
        <p className="text-xs text-white/60">
          <span className="font-semibold text-white">Note:</span> Full interactive Swagger UI and OpenAPI JSON spec will be available at <code className="text-[#FB923C] font-mono">/api/docs/</code> and <code className="text-[#FB923C] font-mono">/api/openapi.json</code> when the Django backend is deployed.
        </p>
      </div>
    </div>
  )
}
