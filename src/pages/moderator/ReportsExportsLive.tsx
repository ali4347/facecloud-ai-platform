import { useState } from 'react'
import { AlertTriangle, BarChart2, Calendar, CheckCircle, Download, FileSpreadsheet, FileText, Layers, Loader2, Users } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import { ModeratorGate } from '../../components/moderator/ModeratorGate'
import { createModeratorReport, downloadModeratorReport, listModeratorReports, type ModeratorReport } from '../../lib/api/moderatorConsole'
import { formatBytes } from '../../lib/imageData'
import { useModeratorOrganization, useModeratorResource } from '../../lib/moderationData'
import { saveBlob } from '../../lib/saveBlob'
import { messageFor } from '../../lib/useApiResource'
import { formatDateTime } from '../../lib/utils'

const TYPES = [
  { id: 'review_summary', label: 'Review summary', desc: 'Decisions taken, how many were approved, rejected or corrected.', icon: Layers },
  { id: 'moderator_activity', label: 'Moderator activity', desc: 'What each moderator did in the period.', icon: Users },
  { id: 'rejection_reasons', label: 'Rejection reasons', desc: 'Why photos were rejected, counted by reason.', icon: BarChart2 },
  { id: 'quality_scores', label: 'Quality scores', desc: 'How photo quality was distributed.', icon: BarChart2 },
  { id: 'batches', label: 'Batches', desc: 'Uploads submitted to the organization and how they ended.', icon: FileSpreadsheet },
  { id: 'duplicate_decisions', label: 'Duplicate decisions', desc: 'What was decided about suspected duplicates.', icon: CheckCircle },
  { id: 'general_activity', label: 'General activity', desc: 'Organization-wide activity trail.', icon: FileText },
] as const
const FORMATS = ['pdf', 'csv', 'json'] as const

const today = () => new Date().toISOString().slice(0, 10)
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10)
const typeLabel = (id: string) => TYPES.find(t => t.id === id)?.label ?? id.replace(/_/g, ' ')

export function LiveReportsExports() {
  const { organizationId } = useModeratorOrganization()
  const state = useModeratorResource((org, signal) => listModeratorReports(org, signal), () => [] as ModeratorReport[], [])
  const [type, setType] = useState<string>('review_summary')
  const [from, setFrom] = useState(daysAgo(30))
  const [to, setTo] = useState(today())
  const [format, setFormat] = useState<(typeof FORMATS)[number]>('pdf')
  const [busy, setBusy] = useState(false)
  const [downloading, setDownloading] = useState<number | null>(null)
  const [toast, setToast] = useState<{ text: string; bad?: boolean } | null>(null)
  const say = (text: string, bad = false) => { setToast({ text, bad }); setTimeout(() => setToast(null), 4000) }

  const generate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (organizationId === null) return
    setBusy(true)
    try {
      const report = await createModeratorReport(organizationId, { report_type: type, format, date_from: from, date_to: to })
      say(report.status === 'failed' ? `The report could not be made: ${report.failure_reason || 'unknown reason'}` : `${typeLabel(type)} is ready.`, report.status === 'failed')
      state.reload()
    } catch (caught) { say(messageFor(caught), true) } finally { setBusy(false) }
  }

  const download = async (report: ModeratorReport) => {
    if (!report.download_url) return
    setDownloading(report.id)
    try { saveBlob(await downloadModeratorReport(report.download_url), `${report.report_type}-${report.id}.${report.format}`) }
    catch (caught) { say(messageFor(caught), true) } finally { setDownloading(null) }
  }

  return (
    <div className="space-y-6 page-enter relative">
      {toast && (
        <div role="status" className={`fixed top-6 right-6 z-50 p-4 rounded-3xl border text-xs font-bold flex items-center gap-2 backdrop-blur-md ${
          toast.bad ? 'bg-[#EF4444]/10 border-[#EF4444]/25 text-[#F87171]' : 'bg-[#10B981]/10 border-[#10B981]/20 text-[#10B981]'}`}>
          {toast.bad ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}<span>{toast.text}</span>
        </div>
      )}
      <PageHeader title="Reports & Exports" subtitle="Make a report about your organization's reviews, batches and activity, then download it." />

      <ModeratorGate state={state} what="the reports">
        {reports => (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8">
              <ChartCard title="Report parameters" subtitle="Choose what to measure, for which days, in which file type">
                <form onSubmit={generate} className="space-y-6">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-ink-mute uppercase tracking-wider block">1. Report type</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {TYPES.map(t => {
                        const selected = type === t.id
                        return (
                          <button key={t.id} type="button" onClick={() => setType(t.id)} aria-pressed={selected}
                            className={`p-4 rounded-3xl border transition-all cursor-pointer text-left flex gap-3.5 items-start ${selected ? 'bg-[#F97316]/[0.06] border-[#F97316]/40' : 'bg-surface-mute border-line'}`}>
                            <div className={`p-2.5 rounded-2xl border shrink-0 ${selected ? 'bg-[#F97316]/10 border-[#F97316]/20 text-[#FB923C]' : 'bg-surface-mute border-line text-ink-faint'}`}><t.icon className="w-4 h-4" /></div>
                            <div className="min-w-0"><h4 className={`text-xs font-bold ${selected ? 'text-ink' : 'text-ink-soft'}`}>{t.label}</h4><p className="text-[10px] text-ink-mute mt-1 leading-relaxed">{t.desc}</p></div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-ink-mute uppercase tracking-wider block">2. Days</span>
                    <div className="grid grid-cols-2 gap-4">
                      {([['From', from, setFrom], ['To', to, setTo]] as const).map(([label, value, set]) => (
                        <div key={label} className="relative">
                          <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-ink-faint pointer-events-none" />
                          <input type="date" aria-label={label} value={value} max={today()} onChange={e => set(e.target.value)} className="fc-input !pl-11" required />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-ink-mute uppercase tracking-wider block">3. File type</span>
                    <div className="flex gap-2 p-1 bg-surface-mute border border-line rounded-2xl w-fit">
                      {FORMATS.map(f => (
                        <button key={f} type="button" onClick={() => setFormat(f)} aria-pressed={format === f}
                          className={`px-5 py-2 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${format === f ? 'bg-[#F97316] text-white shadow-lg' : 'text-ink-mute hover:text-ink'}`}>{f}</button>
                      ))}
                    </div>
                  </div>
                  <button type="submit" disabled={busy || from > to} className="fc-btn-primary w-full justify-center py-3 text-xs font-bold disabled:opacity-60">
                    {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Making the report…</> : 'Generate report'}
                  </button>
                  {from > to && <p className="text-xs text-[#F87171]">The first day must not be after the last.</p>}
                </form>
              </ChartCard>
            </div>

            <div className="lg:col-span-4">
              <ChartCard title="Report history" subtitle="Kept for a day, then they expire">
                <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
                  {reports.map(r => {
                    const expired = r.expires_at ? new Date(r.expires_at) < new Date() : false
                    return (
                      <div key={r.id} className="p-4 rounded-3xl border border-line bg-surface-mute space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-ink truncate">{typeLabel(r.report_type)}</h4>
                            <p className="text-[9px] text-ink-faint mt-0.5">{r.date_from && r.date_to ? `${r.date_from} to ${r.date_to}` : 'No date range'}</p>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase bg-surface text-ink-soft shrink-0">{r.format}</span>
                        </div>
                        {r.status === 'failed' && <p className="text-[10px] text-[#F87171]">{r.failure_reason || 'The report could not be made.'}</p>}
                        <div className="flex justify-between items-center text-[10px] text-ink-faint pt-2 border-t border-line gap-2">
                          <span className="min-w-0">By {r.requested_by_name}<br />{formatDateTime(r.generated_at ?? r.created_at)}{r.file_size ? ` · ${formatBytes(r.file_size)}` : ''}</span>
                          {r.status === 'ready' && r.download_url && !expired ? (
                            <button type="button" disabled={downloading === r.id} onClick={() => download(r)} className="inline-flex items-center gap-1 font-bold text-[#FB923C] hover:underline cursor-pointer disabled:opacity-50">
                              <Download className="w-3.5 h-3.5" /> {downloading === r.id ? 'Downloading…' : 'Download'}
                            </button>
                          ) : <span className="font-semibold">{expired ? 'Expired' : r.status}</span>}
                        </div>
                      </div>
                    )
                  })}
                  {reports.length === 0 && <p className="text-center py-12 text-xs text-ink-faint">No reports have been made yet.</p>}
                </div>
              </ChartCard>
            </div>
          </div>
        )}
      </ModeratorGate>
    </div>
  )
}
