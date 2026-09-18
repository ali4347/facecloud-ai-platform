import { useParams, Link } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import { ArrowLeft, RefreshCw, CheckCircle2, Circle, AlertCircle } from 'lucide-react'

export default function ProcessingPage() {
  const { id } = useParams<{ id: string }>()

  const steps = [
    { label: 'Authentication Verified', desc: 'Checked JWT session validation', status: 'done' as const },
    { label: 'Upload Ingested', desc: 'Received multipart file request', status: 'done' as const },
    { label: 'Original Asset Saved', desc: 'Raw binary written to secure cloud storage', status: 'done' as const },
    { label: 'Zero-DCE Restorative Restores', desc: 'Restoring lighting curve coefficients', status: 'active' as const },
    { label: 'Enhanced Asset Saved', desc: 'Write restored high-resolution matrix', status: 'pending' as const },
    { label: 'Face Detection Boundary', desc: 'Verify exactly one face exists in frame', status: 'pending' as const },
    { label: 'Quality Parameters Check', desc: 'Audit brightness, size and motion blur index', status: 'pending' as const },
    { label: 'Embedding Features Extraction', desc: 'Generate 512-dimensional face key vector', status: 'pending' as const },
    { label: 'Cluster Directory Assignment', desc: 'Clustered matching folders or create new', status: 'pending' as const },
    { label: 'Security Link Mapping', desc: 'Created secure download token link', status: 'pending' as const }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/dashboard/jobs" className="p-2 rounded-xl hover:bg-surface-mute border border-line text-ink-mute hover:text-ink">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <PageHeader 
          title={`Job Tracking: ${id || 'job-002'}`}
          subtitle="Check active pipeline execution details in real-time."
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Job Step Tracker */}
        <div className="lg:col-span-8 space-y-6">
          <ChartCard title="Pipeline Execution Trace" subtitle="Detailed step logs mapping">
            <div className="space-y-4">
              {steps.map((step) => (
                <div 
                  key={step.label} 
                  className={`p-4 rounded-2xl border transition-all flex items-start gap-4 ${
                    step.status === 'done' ? 'bg-emerald-500/5 border-emerald-300/15 text-ink' :
                    step.status === 'active' ? 'bg-accent/5 border-accent/30 text-ink ring-1 ring-accent' :
                    'bg-surface-mute border-line text-ink-mute'
                  }`}
                >
                  <div className="mt-0.5">
                    {step.status === 'done' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                    {step.status === 'active' && <RefreshCw className="w-5 h-5 text-accent animate-spin" />}
                    {step.status === 'pending' && <Circle className="w-5 h-5 text-ink-mute/40" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold">{step.label}</h4>
                      {step.status === 'active' && (
                        <span className="text-[10px] text-accent font-bold uppercase tracking-wider animate-pulse">Running</span>
                      )}
                      {step.status === 'done' && (
                        <span className="text-[10px] text-emerald-600 uppercase font-bold tracking-wider">Completed</span>
                      )}
                    </div>
                    <p className="text-[10px] text-ink-mute mt-0.5">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>

        {/* Right Column: Ingest Summary */}
        <div className="lg:col-span-4">
          <ChartCard title="Job Parameters" subtitle="Execution details">
            <div className="space-y-6">
              
              <div className="p-4 rounded-3xl bg-surface-mute border border-line text-xs text-ink-mute space-y-3.5">
                <div className="flex justify-between">
                  <span>Job ID:</span>
                  <span className="font-bold text-ink">{id || 'job-002'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Target Image:</span>
                  <span className="font-bold text-ink">face_underexposed_002.jpg</span>
                </div>
                <div className="flex justify-between">
                  <span>Pipeline Model:</span>
                  <span className="font-bold text-accent">Zero-DCE (CNN Restorer)</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="text-accent font-bold animate-pulse">Enhancing...</span>
                </div>
              </div>

              <div className="p-4 rounded-3xl bg-[#4F46E5]/5 border border-[#4F46E5]/10 flex gap-3 text-xs text-ink-mute">
                <AlertCircle className="w-5 h-5 text-accent flex-shrink-0" />
                <p className="leading-relaxed">
                  The client browser session will receive an in-app and email alert immediately when biometric classification clusters complete.
                </p>
              </div>

            </div>
          </ChartCard>
        </div>

      </div>
    </div>
  )
}
