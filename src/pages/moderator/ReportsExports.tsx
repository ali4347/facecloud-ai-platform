import { useState } from 'react'
import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import { mockReportHistory, mockModeratorAudit } from '../../data/mock'
import type { GeneratedReport } from '../../data/mock'
import { Download, Calendar, CheckCircle, FileText, FileSpreadsheet, Layers, BarChart2 } from 'lucide-react'

const REPORT_TYPES = [
  { id: 'review_activity', label: 'Review Activity', desc: 'Moderation decisions, approval/rejection counts, and overrides log.', icon: Layers },
  { id: 'batch_activity', label: 'Batch Activity', desc: 'ZIP and multi-upload pipeline throughput and stats.', icon: FileSpreadsheet },
  { id: 'quality_stats', label: 'Quality & Rejection Stats', desc: 'Blur, brightness, and face size failure distribution analysis.', icon: BarChart2 },
  { id: 'duplicate_stats', label: 'Duplicate Detection Stats', desc: 'Clustering similarity match overrides and false positive rates.', icon: CheckCircle },
  { id: 'general_activity', label: 'General Activity Log', desc: 'Organization-wide ingestion telemetry audit trail.', icon: FileText }
]

export default function ReportsExports() {
  const [reports, setReports] = useState<GeneratedReport[]>(mockReportHistory)
  const [selectedType, setSelectedType] = useState('review_activity')
  const [startDate, setStartDate] = useState('2026-07-01')
  const [endDate, setEndDate] = useState('2026-07-17')
  const [selectedFormat, setSelectedFormat] = useState<'CSV' | 'PDF' | 'JSON'>('PDF')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const sessionStr = localStorage.getItem('facecloud_session')
  const session = sessionStr ? JSON.parse(sessionStr) : { name: 'Vaneeza Sohaib' }

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Audit logging helper
  const logAudit = (action: string, target: string) => {
    mockModeratorAudit.unshift({
      id: `ma-${Date.now()}`,
      timestamp: new Date().toISOString(),
      moderatorName: session.name,
      filename: target,
      action: action,
      oldStatus: 'active',
      newStatus: 'completed',
      reason: `Reports & Exports: ${action} for ${target}`,
      userNotified: true
    })
  }

  const handleGenerateReport = (e: React.FormEvent) => {
    e.preventDefault()

    const typeLabel = REPORT_TYPES.find(r => r.id === selectedType)?.label || 'Report'
    const newReport: GeneratedReport = {
      id: `rep-${Date.now()}`,
      type: typeLabel,
      dateRange: `${startDate} to ${endDate}`,
      format: selectedFormat,
      generatedBy: session.name,
      generatedAt: new Date().toISOString(),
      downloadUrl: '#'
    }

    setReports(prev => [newReport, ...prev])
    logAudit('Generate Report', `${typeLabel} (${selectedFormat})`)
    showToast(`${typeLabel} generated successfully!`)
  }

  const handleDownloadReport = (report: GeneratedReport) => {
    logAudit('Download Report File', `${report.type} (${report.format}) - ID: ${report.id}`)
    showToast(`Downloading ${report.type} export in ${report.format} format...`)
  }

  return (
    <div className="space-y-6 page-enter relative">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-3xl bg-[#4FFFB0]/10 border border-[#4FFFB0]/20 text-xs font-bold text-[#4FFFB0] flex items-center gap-2 shadow-[0_4px_24px_rgba(79,255,176,0.15)] backdrop-blur-md animate-enter">
          <CheckCircle className="w-4.5 h-4.5" />
          <span>{toastMessage}</span>
        </div>
      )}

      <PageHeader 
        title="Reports & Exports"
        subtitle="Extract system audit logs and pipeline diagnostics reports."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Generator Form */}
        <div className="lg:col-span-8 space-y-6">
          <ChartCard title="Report Parameters Configurator" subtitle="Configure data scope and format exports">
            <form onSubmit={handleGenerateReport} className="space-y-6">
              
              {/* Type Selection Cards */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider block">1. Select Report Type</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {REPORT_TYPES.map(type => {
                    const isSelected = selectedType === type.id
                    const Icon = type.icon

                    return (
                      <div 
                        key={type.id}
                        onClick={() => setSelectedType(type.id)}
                        className={`p-4 rounded-3xl border transition-all cursor-pointer text-left flex gap-3.5 items-start ${
                          isSelected 
                            ? 'bg-[#F97316]/[0.06] border-[#F97316]/40 shadow-[0_4px_20px_rgba(249, 115, 22,0.05)]' 
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className={`p-2.5 rounded-2xl border shrink-0 ${
                          isSelected ? 'bg-[#F97316]/10 border-[#F97316]/20 text-[#FB923C]' : 'bg-white/5 border-white/10 text-white/40'
                        }`}>
                          <Icon className="w-4.5 h-4.5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-white/80'}`}>{type.label}</h4>
                          <p className="text-[10px] text-white/45 mt-1 leading-relaxed font-medium">{type.desc}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Date Inputs */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider block">2. Select Date Range</label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-white/40 pointer-events-none" />
                    <input 
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="fc-input !pl-11"
                      required
                    />
                  </div>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-white/40 pointer-events-none" />
                    <input 
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className="fc-input !pl-11"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Format Selector Tabs */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider block">3. Output Export Format</label>
                <div className="flex gap-2 p-1 bg-white/5 border border-white/10 rounded-2xl w-fit">
                  {(['PDF', 'CSV', 'JSON'] as const).map(fmt => {
                    const isFmtSelected = selectedFormat === fmt
                    return (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => setSelectedFormat(fmt)}
                        className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                          isFmtSelected ? 'bg-[#F97316] text-white shadow-lg' : 'text-white/60 hover:text-white'
                        }`}
                      >
                        {fmt}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Submit */}
              <button 
                type="submit"
                className="fc-btn-primary w-full justify-center py-3 text-xs font-bold"
              >
                Generate Report Export
              </button>

            </form>
          </ChartCard>
        </div>

        {/* Right Column: Historical generated outputs list */}
        <div className="lg:col-span-4">
          <ChartCard title="Security Export History" subtitle="Manual reports generated downloads logs">
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {reports.map(rep => (
                <div 
                  key={rep.id} 
                  className="p-4 rounded-3xl border border-white/10 bg-white/5 space-y-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">{rep.type}</h4>
                      <p className="text-[9px] text-white/40 mt-0.5">{rep.dateRange}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase bg-white/10 text-white/80 shrink-0">
                      {rep.format}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-white/40 pt-2 border-t border-white/5">
                    <span>By {rep.generatedBy}</span>
                    <button
                      onClick={() => handleDownloadReport(rep)}
                      className="inline-flex items-center gap-1 font-bold text-[#FB923C] hover:underline"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </button>
                  </div>
                </div>
              ))}

              {reports.length === 0 && (
                <p className="text-center py-12 text-xs text-white/35">No reports have been generated yet.</p>
              )}
            </div>
          </ChartCard>
        </div>

      </div>
    </div>
  )
}
