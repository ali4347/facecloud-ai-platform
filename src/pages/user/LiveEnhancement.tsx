import { PageHeader } from '../../components/layout/PageHeader'
import { LiveEnhancementPanel } from '../../components/features/LiveEnhancementPanel'
import { Info, Sparkles, Camera, Wifi } from 'lucide-react'

export default function LiveEnhancement() {
  return (
    <div className="page-enter">
      <PageHeader
        title="Live Enhancement"
        subtitle="Real-time webcam AI enhancement powered by Zero-DCE. See before/after in real-time."
      />

      {/* Top explanation card */}
      <div
        className="mb-5 flex items-start gap-3 p-4 rounded-2xl border"
        style={{
          background: 'rgba(79,70,229, 0.04)',
          borderColor: 'rgba(79,70,229, 0.20)',
        }}
      >
        <Info className="w-4 h-4 text-[#6366F1] flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-ink">Live + Snapshot AI Enhancement</p>
          <p className="text-xs text-ink-mute mt-0.5">
            Live preview runs fast browser-based enhancement. For higher-quality face restoration, capture a frame and run FaceCloud's AI snapshot enhancement pipeline.
          </p>
        </div>
      </div>

      <LiveEnhancementPanel />

      {/* Specs */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Camera, title: 'Camera Support', desc: 'Any webcam or built-in camera via browser media API', iconColor: '#6366F1', border: 'rgba(79,70,229,0.20)', bg: 'rgba(79,70,229,0.06)' },
          { icon: Sparkles, title: 'AI Snapshot Enhancement', desc: 'Capture & enhance with Zero-DCE + face detail recovery pipeline', iconColor: '#6D28D9', border: 'rgba(67,56,202,0.20)', bg: 'rgba(67,56,202,0.06)' },
          { icon: Wifi, title: 'Real-time FPS', desc: 'Targets 24–30 FPS with face detection active', iconColor: '#059669', border: 'rgba(5,150,105,0.20)', bg: 'rgba(5,150,105,0.06)' },
        ].map(spec => (
          <div key={spec.title} className="fc-card p-4 flex items-start gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: spec.bg, border: `1px solid ${spec.border}` }}
            >
              <spec.icon className="w-4 h-4" style={{ color: spec.iconColor }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">{spec.title}</p>
              <p className="text-xs text-ink-mute mt-0.5">{spec.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
