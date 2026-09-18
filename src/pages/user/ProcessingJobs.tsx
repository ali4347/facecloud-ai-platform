import { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Briefcase, Search, Filter, ChevronDown, ChevronUp, FileText, FolderArchive,
  AlertCircle, Key, Upload, Shield, Zap, Eye, Cpu, Users, Download, ArrowUpRight, HelpCircle
} from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { mockJobs } from '../../data/mock'
import { formatDateTime } from '../../lib/utils'

// Icon mapper for the 9-step pipeline
const STEP_ICONS: Record<string, any> = {
  'Authentication': Key,
  'Upload Ingest': Upload,
  'Original Saved': Shield,
  'Zero-DCE Enhance': Zap,
  'Face Validation': Eye,
  'Quality Audit': Cpu,
  'Embedding Extraction': Cpu,
  'Person Folder Match': Users,
  'Secure Download': Download,
}

export default function ProcessingJobs() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('All')
  const [sortBy, setSortBy] = useState('Newest')
  
  // Expanded card tracking
  const [expandedJobs, setExpandedJobs] = useState<Record<string, boolean>>({
    'job-002': true // keep the active processing job expanded by default for cool visuals
  })

  const toggleExpand = (id: string) => {
    setExpandedJobs(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // Summary counts
  const totalJobs = mockJobs.length
  const completedJobs = mockJobs.filter(j => j.currentStage === 'completed').length
  const rejectedJobs = mockJobs.filter(j => j.currentStage === 'rejected').length
  const processingJobs = totalJobs - completedJobs - rejectedJobs
  const avgTime = '4.8s'

  // Filter & Sort Logic
  const filteredJobs = mockJobs.filter(job => {
    const matchesSearch = job.filename.toLowerCase().includes(search.toLowerCase())
    
    let matchesStatus = true
    if (statusFilter !== 'All') {
      if (statusFilter === 'Processing') {
        matchesStatus = job.currentStage !== 'completed' && job.currentStage !== 'rejected'
      } else if (statusFilter === 'Completed') {
        matchesStatus = job.currentStage === 'completed'
      } else if (statusFilter === 'Rejected') {
        matchesStatus = job.currentStage === 'rejected'
      }
    }

    let matchesType = true
    if (typeFilter !== 'All') {
      matchesType = job.uploadType === typeFilter
    }

    return matchesSearch && matchesStatus && matchesType
  }).sort((a, b) => {
    if (sortBy === 'Newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
    if (sortBy === 'Oldest') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    }
    if (sortBy === 'Progress') {
      return (b.progress || 0) - (a.progress || 0)
    }
    return 0
  })

  // Get status details for badges
  const getStageBadge = (stage: string) => {
    switch (stage) {
      case 'completed':
        return <StatusBadge status="success" label="Completed" />
      case 'rejected':
        return <StatusBadge status="error" label="Rejected" />
      case 'enhancing':
        return <StatusBadge status="processing" label="Enhancing" />
      case 'validating':
        return <StatusBadge status="info" label="Validating" />
      case 'uploaded':
        return <StatusBadge status="muted" label="Queued" />
      default:
        return <StatusBadge status="muted" label={stage} />
    }
  }

  return (
    <div className="page-enter space-y-6">
      <PageHeader
        title="Processing Jobs"
        subtitle="Track every upload as it moves through FaceCloud’s AI enhancement, validation, and identity grouping pipeline."
      />

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Jobs', value: totalJobs, border: '#E6E9EF' },
          { label: 'Processing', value: processingJobs, border: 'rgba(79,70,229,0.25)', highlight: 'text-[#6366F1]' },
          { label: 'Completed', value: completedJobs, border: 'rgba(5,150,105,0.25)', highlight: 'text-[#059669]' },
          { label: 'Rejected', value: rejectedJobs, border: 'rgba(239,68,68,0.25)', highlight: 'text-[#DC2626]' },
          { label: 'Avg Time', value: avgTime, border: '#E6E9EF' }
        ].map((stat, i) => (
          <div 
            key={i} 
            className="fc-card p-4 flex flex-col justify-between min-h-[90px] backdrop-blur-md"
            style={{ borderColor: stat.border }}
          >
            <span className="text-[10px] text-ink-faint font-bold uppercase tracking-wider">{stat.label}</span>
            <span className={`text-2xl font-extrabold tracking-tight mt-2 ${stat.highlight || 'text-ink'}`}>
              {stat.value}
            </span>
          </div>
        ))}
      </div>

      {/* Filter and search bar */}
      <div className="fc-card p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-ink-faint" />
          <input
            type="text"
            placeholder="Search by filename…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="fc-input !pl-10 !py-2.5"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-ink-faint" />
            <span className="text-xs text-ink-faint font-bold uppercase">Filter:</span>
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="fc-input !py-2 !px-3 text-xs !w-32 bg-surface-sunk cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Processing">Processing</option>
            <option value="Completed">Completed</option>
            <option value="Rejected">Rejected</option>
          </select>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="fc-input !py-2 !px-3 text-xs !w-32 bg-surface-sunk cursor-pointer"
          >
            <option value="All">All Types</option>
            <option value="Single">Single Image</option>
            <option value="Multiple">Multiple Files</option>
            <option value="ZIP">ZIP Archive</option>
          </select>

          {/* Sort selection */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="fc-input !py-2 !px-3 text-xs !w-32 bg-surface-sunk cursor-pointer"
          >
            <option value="Newest">Newest First</option>
            <option value="Oldest">Oldest First</option>
            <option value="Progress">Highest Progress</option>
          </select>
        </div>

      </div>

      {/* Jobs Grid List */}
      <div className="space-y-4">
        {filteredJobs.length > 0 ? (
          filteredJobs.map(job => {
            const isExpanded = !!expandedJobs[job.id]
            const FileIcon = job.uploadType === 'ZIP' ? FolderArchive : FileText
            const isFailed = job.currentStage === 'rejected'

            return (
              <div 
                key={job.id} 
                className={`fc-card p-6 transition-all duration-300 ${
                  isExpanded ? 'border-[#4F46E5]/25 shadow-[0_4px_30px_rgba(79,70,229,0.04)]' : ''
                }`}
              >
                {/* Upper Summary Row */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-surface-mute border border-line flex items-center justify-center text-[#6366F1]">
                      <FileIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-ink tracking-tight">{job.filename}</h3>
                      <p className="text-[11px] text-ink-faint font-semibold mt-0.5">
                        Uploaded at {formatDateTime(job.createdAt)} • Type: {job.uploadType}
                      </p>
                    </div>
                  </div>

                  {/* Actions & Badges */}
                  <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-ink-faint font-bold uppercase tracking-wider">Duration: {job.duration}</span>
                      {getStageBadge(job.currentStage)}
                    </div>
                    <button
                      onClick={() => toggleExpand(job.id)}
                      className="fc-btn-secondary !py-2 !px-4 text-xs font-bold flex items-center gap-1.5 hover:border-[#4F46E5]/30"
                    >
                      {isExpanded ? 'Hide Details' : 'View Details'}
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Progress bar container */}
                <div className="mt-5 space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-ink-mute uppercase tracking-wider">
                    <span>Processing Ingestion Status</span>
                    <span className={isFailed ? 'text-[#DC2626]' : 'text-[#059669]'}>
                      {isFailed ? 'Execution Halted' : `${job.progress}% complete`}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-surface-mute overflow-hidden relative">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        isFailed ? 'bg-[#DC2626]' : 'bg-gradient-to-r from-[#4F46E5] to-[#059669]'
                      }`}
                      style={{ width: `${job.progress}%` }}
                    />
                  </div>
                </div>

                {/* Expandable detailed views */}
                {isExpanded && (
                  <div className="mt-6 pt-6 border-t border-line space-y-6">
                    {/* Failure details alert if rejected */}
                    {isFailed && job.failureReason && (
                      <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-[#DC2626] font-semibold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{job.failureReason}</span>
                      </div>
                    )}

                    {/* Metadata specs grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-surface-mute p-5 rounded-2xl border border-line">
                      <div className="space-y-3.5 text-xs font-medium text-ink-mute">
                        <div className="flex justify-between">
                          <span>Original file saved:</span>
                          <span className="text-ink font-bold">{job.details?.originalSaved}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>AI model resolver:</span>
                          <span className="text-ink font-bold font-mono">{job.details?.aiModel}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Detections count:</span>
                          <span className="text-ink font-bold">{job.details?.faceCount} faces</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Blur checks score:</span>
                          <span className="text-ink font-bold">{job.details?.blurScore}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Illumination curve score:</span>
                          <span className="text-ink font-bold">{job.details?.brightnessScore}</span>
                        </div>
                      </div>

                      <div className="space-y-3.5 text-xs font-medium text-ink-mute">
                        <div className="flex justify-between">
                          <span>Minimal size validation:</span>
                          <span className="text-ink font-bold">{job.details?.faceSizeScore}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Identity Person folder:</span>
                          <span className="text-[#6D28D9] font-bold">{job.details?.personFolder}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Status alerts sent:</span>
                          <span className="text-ink font-bold">{job.details?.notificationSent}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Logged tracing ID:</span>
                          <span className="text-ink font-bold font-mono">{job.details?.activityLog}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Download generated:</span>
                          {job.currentStage === 'completed' && job.details?.secureDownload ? (
                            <a 
                              href={job.details.secureDownload}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#6366F1] font-bold hover:underline flex items-center gap-1 text-[11px]"
                            >
                              Download Assets <ArrowUpRight className="w-3.5 h-3.5" />
                            </a>
                          ) : (
                            <span className="text-ink-faint font-bold font-mono">N/A</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Stepper Pipeline timeline */}
                    <div className="space-y-3">
                      <span className="text-[10px] text-ink-faint font-bold uppercase tracking-wider block">Pipeline Progress Stages</span>
                      
                      {/* Horizontal timeline on desktop / vertical on mobile */}
                      <div className="hidden lg:flex items-start gap-1 justify-between pt-2">
                        {job.stages.map((stage, idx) => {
                          const isDone = stage.status === 'done'
                          const isActive = stage.status === 'active'
                          const isFailed = stage.status === 'failed'
                          const IconComp = STEP_ICONS[stage.label] || HelpCircle

                          return (
                            <div key={stage.label} className="flex-1 flex items-center">
                              <div className="flex flex-col items-center text-center gap-2">
                                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${
                                  isDone ? 'bg-[#059669]/10 border-[#059669]/30 text-[#059669]' :
                                  isActive ? 'bg-[#4F46E5]/20 border-[#4F46E5]/30 text-[#6366F1] animate-pulse' :
                                  isFailed ? 'bg-[#DC2626]/10 border-[#DC2626]/30 text-[#DC2626]' :
                                  'bg-surface-mute border-transparent text-ink-faint'
                                }`}>
                                  <IconComp className="w-4.5 h-4.5" />
                                </div>
                                <div className="space-y-0.5">
                                  <p className="text-[9px] font-bold text-ink-soft leading-none truncate max-w-[80px]">{stage.label}</p>
                                  <p className="text-[8px] text-ink-faint font-mono">{stage.time || 'Pending'}</p>
                                </div>
                              </div>

                              {idx < job.stages.length - 1 && (
                                <div className={`h-0.5 flex-1 mx-2 ${
                                  isDone ? 'bg-[#059669]/40' :
                                  isActive ? 'bg-[#4F46E5]/40 border-dashed border-[#4F46E5]' :
                                  'bg-surface-mute'
                                }`} />
                              )}
                            </div>
                          )
                        })}
                      </div>

                      {/* Vertical timeline stacked on mobile */}
                      <div className="lg:hidden flex flex-col gap-3 pt-2">
                        {job.stages.map((stage) => {
                          const isDone = stage.status === 'done'
                          const isActive = stage.status === 'active'
                          const isFailed = stage.status === 'failed'
                          const IconComp = STEP_ICONS[stage.label] || HelpCircle

                          return (
                            <div key={stage.label} className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 ${
                                isDone ? 'bg-[#059669]/10 border-[#059669]/30 text-[#059669]' :
                                isActive ? 'bg-[#4F46E5]/20 border-[#4F46E5]/30 text-[#6366F1] animate-pulse' :
                                isFailed ? 'bg-[#DC2626]/10 border-[#DC2626]/30 text-[#DC2626]' :
                                'bg-surface-mute border-transparent text-ink-faint'
                              }`}>
                                <IconComp className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex-1 flex justify-between items-center text-xs">
                                <span className="font-bold text-ink">{stage.label}</span>
                                <span className="text-[10px] text-ink-faint font-mono">{stage.time || 'Pending'}</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>

                    </div>
                  </div>
                )}
              </div>
            )
          })
        ) : (
          /* Empty state */
          <div className="fc-card p-12 text-center flex flex-col items-center justify-center space-y-4">
            <Briefcase className="w-12 h-12 text-ink-faint" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-ink">No processing jobs found</h3>
              <p className="text-xs text-ink-mute max-w-sm">
                Try changing filters or upload a new image to start a FaceCloud AI processing job.
              </p>
            </div>
            <Link 
              to="/dashboard/upload" 
              className="fc-btn-primary font-bold px-6 py-2.5 text-xs"
              style={{ minHeight: 'auto' }}
            >
              Go to Upload Center
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
