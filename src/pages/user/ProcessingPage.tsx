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
        <Link to="/dashboard/jobs" className="p-2 rounded-xl hover:bg-white/5 border border-white/10 text-muted hover:text-white">
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
                    step.status === 'done' ? 'bg-mint/5 border-mint/15 text-dark' :
                    step.status === 'active' ? 'bg-primary/5 border-primary/30 text-dark ring-1 ring-primary' :
                    'bg-white/2 border-white/5 text-muted'
                  }`}
                >
                  <div className="mt-0.5">
                    {step.status === 'done' && <CheckCircle2 className="w-5 h-5 text-mint" />}
                    {step.status === 'active' && <RefreshCw className="w-5 h-5 text-primary animate-spin" />}
                    {step.status === 'pending' && <Circle className="w-5 h-5 text-muted/40" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold">{step.label}</h4>
                      {step.status === 'active' && (
                        <span className="text-[10px] text-primary font-bold uppercase tracking-wider animate-pulse">Running</span>
                      )}
                      {step.status === 'done' && (
                        <span className="text-[10px] text-mint uppercase font-bold tracking-wider">Completed</span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted mt-0.5">{step.desc}</p>
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
              
              <div className="p-4 rounded-3xl bg-white/5 border border-white/10 text-xs text-muted space-y-3.5">
                <div className="flex justify-between">
                  <span>Job ID:</span>
                  <span className="font-bold text-dark">{id || 'job-002'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Target Image:</span>
                  <span className="font-bold text-dark">face_underexposed_002.jpg</span>
                </div>
                <div className="flex justify-between">
                  <span>Pipeline Model:</span>
                  <span className="font-bold text-primary">Zero-DCE (CNN Restorer)</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="text-primary font-bold animate-pulse">Enhancing...</span>
                </div>
              </div>

              <div className="p-4 rounded-3xl bg-[#F97316]/5 border border-[#F97316]/10 flex gap-3 text-xs text-muted">
                <AlertCircle className="w-5 h-5 text-primary flex-shrink-0" />
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
