import { Link } from 'react-router-dom'
import {
  AlertTriangle, ArrowUpRight, Camera, CheckCircle2, Clock, FileText, FolderArchive,
  Loader2, RefreshCw, Upload, Users, XCircle,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { PageHeader } from '../../components/layout/PageHeader'
import { GradientButton } from '../../components/ui/GradientButton'
import { ChartCard } from '../../components/ui/ChartCard'
import { uploadStatusBadge } from '../../components/ui/StatusBadge'
import { useUserDashboard, dayLabel, formatBytes, statusLabel } from '../../lib/imageData'
import { useSessionUser } from '../../lib/session'

const ACTION_CARDS = [
  { title: 'Single Upload', desc: 'Upload and enhance one portrait photo.', path: '/dashboard/upload/single', icon: FileText },
  { title: 'Multiple Upload', desc: 'Upload several photos at once.', path: '/dashboard/upload/multiple', icon: Upload },
  { title: 'Upload ZIP Archive', desc: 'Drop a ZIP of portraits for batch processing.', path: '/dashboard/upload/zip', icon: FolderArchive },
  { title: 'Live Camera', desc: 'Try real-time enhancement with your camera.', path: '/dashboard/live-enhancement', icon: Camera },
]

/** How long ago, in the words someone would actually use. */
function relativeTime(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (minutes < 60) return minutes <= 1 ? 'Just now' : `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return hours === 1 ? '1 hr ago' : `${hours} hrs ago`
  const days = Math.floor(hours / 24)
  return days === 1 ? 'Yesterday' : `${days} days ago`
}

const ACTIVITY_ICONS: Record<string, React.ElementType> = {
  upload: Upload,
  enhancement: CheckCircle2,
  validation: CheckCircle2,
  quality: CheckCircle2,
  rejected: XCircle,
  failed: XCircle,
}

export default function Dashboard() {
  const account = useSessionUser('user')
  const { data, loading, error, isDemo, reload } = useUserDashboard()
  const summary = data?.summary

  const statCards = summary ? [
    { label: 'Total uploads', value: summary.total_images, icon: Upload, fill: '#F97316', sub: 'All time' },
    { label: 'Accepted', value: summary.accepted_images, icon: CheckCircle2, fill: '#10B981', sub: 'Passed every check' },
    { label: 'Rejected', value: summary.rejected_images, icon: XCircle, fill: '#EF4444', sub: 'Did not pass' },
    summary.identity_groups_available
      ? { label: 'Person folders', value: summary.identity_groups, icon: Users, fill: '#EA580C', sub: 'People found' }
      : { label: 'In review', value: summary.needs_review_images, icon: Clock, fill: '#F59E0B', sub: 'With a moderator' },
  ] : []

  const chartData = (data?.uploads_last_7_days ?? []).map(day => ({
    day: dayLabel(day.date),
    accepted: day.accepted,
    rejected: day.rejected,
  }))
  const chartHasData = chartData.some(day => day.accepted > 0 || day.rejected > 0)

  return (
    <div className="page-enter space-y-6">
      <PageHeader
        title={`Welcome back, ${account.name.split(' ')[0]}`}
        subtitle={
          loading ? 'Loading your figures…'
          : summary ? `${summary.total_images} photo${summary.total_images === 1 ? '' : 's'} · ${formatBytes(summary.storage_bytes)} stored`
          : 'Upload a photo to get started.'
        }
        action={
          <Link to="/dashboard/upload">
            <GradientButton>Upload photos</GradientButton>
          </Link>
        }
      />

      {isDemo && (
        <div className="p-3 rounded-2xl text-xs flex items-center gap-2 bg-surface-mute border border-line text-ink-soft">
          <AlertTriangle className="w-4 h-4 text-[#F59E0B] flex-shrink-0" />
          Showing demo data. Set <code className="fc-kbd">VITE_USE_API=true</code> for your real figures.
        </div>
      )}

      {loading && (
        <div className="fc-card p-16 text-center text-ink-faint">
          <Loader2 className="w-6 h-6 mx-auto mb-3 animate-spin" />
          <p className="text-xs font-semibold">Loading your dashboard…</p>
        </div>
      )}

      {!loading && error && (
        <div className="fc-card p-16 text-center">
          <AlertTriangle className="w-7 h-7 mx-auto mb-3 text-[#EF4444]" />
          <p className="text-xs font-semibold text-ink">{error}</p>
          <button
            type="button"
            onClick={reload}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#FB923C] hover:underline cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />Try again
          </button>
        </div>
      )}

      {!loading && !error && summary && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map(card => (
              <div key={card.label} className="fc-card p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-ink-mute font-bold uppercase tracking-wider">
                    {card.label}
                  </span>
                  <card.icon className="w-4 h-4" style={{ color: card.fill }} />
                </div>
                <span className="text-2xl font-bold block" style={{ color: card.fill }}>
                  {card.value.toLocaleString()}
                </span>
                <span className="text-[10px] text-ink-faint block">{card.sub}</span>
              </div>
            ))}
          </div>

          {summary.processing_images > 0 && (
            <div className="p-3 rounded-2xl text-xs flex items-center gap-2 bg-[#F97316]/10 border border-[#F97316]/25 text-[#FB923C]">
              <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
              {summary.processing_images} photo{summary.processing_images === 1 ? ' is' : 's are'} still processing.
              <Link to="/dashboard/jobs" className="font-bold underline ml-1">Follow them</Link>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ACTION_CARDS.map(card => (
              <Link
                key={card.title}
                to={card.path}
                className="fc-card p-5 group hover:border-line-strong transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <card.icon className="w-5 h-5 text-[#FB923C]" />
                  <ArrowUpRight className="w-4 h-4 text-ink-faint group-hover:text-[#FB923C] transition-colors" />
                </div>
                <p className="text-sm font-bold text-ink">{card.title}</p>
                <p className="text-[11px] text-ink-faint mt-1 leading-relaxed">{card.desc}</p>
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-6">
              <ChartCard title="The last seven days" subtitle="Accepted against rejected, by day">
                {chartHasData ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--a-line))" vertical={false} />
                      <XAxis dataKey="day" stroke="rgb(var(--a-ink-faint))" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="rgb(var(--a-ink-faint))" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          background: 'rgb(var(--a-surface))',
                          border: '1px solid rgb(var(--a-line))',
                          borderRadius: 12,
                          fontSize: 12,
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="accepted" fill="#10B981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="rejected" fill="#EF4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="py-16 text-center text-ink-faint">
                    <p className="text-xs font-semibold">Nothing uploaded in the last seven days.</p>
                    <Link to="/dashboard/upload" className="text-xs font-bold text-[#FB923C] hover:underline mt-2 inline-block">
                      Upload a photo
                    </Link>
                  </div>
                )}
              </ChartCard>

              <ChartCard title="Recent uploads" subtitle="Your five most recent photos">
                {data.recent_uploads.length > 0 ? (
                  <div className="space-y-3">
                    {data.recent_uploads.map(upload => (
                      <Link
                        key={upload.id}
                        to={`/dashboard/images/${upload.id}`}
                        className="p-3 rounded-2xl bg-surface-mute border border-line flex items-center justify-between gap-3 hover:border-line-strong transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-ink truncate max-w-[260px]">{upload.filename}</p>
                          <p className="text-[10px] text-ink-faint mt-0.5">{relativeTime(upload.uploaded_at)}</p>
                        </div>
                        {uploadStatusBadge(upload.status)}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-ink-faint py-10 text-center">No uploads yet.</p>
                )}
              </ChartCard>
            </div>

            <div className="lg:col-span-5 space-y-6">
              <ChartCard title="How your photos did" subtitle="Across everything you have uploaded">
                <div className="p-4 rounded-3xl bg-surface-mute border border-line space-y-3.5 text-xs text-ink-mute">
                  <div className="flex justify-between">
                    <span>Enhanced:</span>
                    <span className="font-bold text-ink">{summary.enhanced_images}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>In review:</span>
                    <span className="font-bold text-ink">{summary.needs_review_images}</span>
                  </div>
                  {summary.failed_images > 0 && (
                    <div className="flex justify-between">
                      <span>Failed:</span>
                      <span className="font-bold text-[#F87171]">{summary.failed_images}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Uploads:</span>
                    <span className="font-bold text-ink">{summary.upload_batches}</span>
                  </div>
                  {/* Only claimed when something has actually been measured. */}
                  {summary.average_quality_score !== null && (
                    <div className="flex justify-between">
                      <span>Average quality:</span>
                      <span className="font-bold text-ink">
                        {Math.round(summary.average_quality_score)}%
                      </span>
                    </div>
                  )}
                  {summary.most_common_rejection_reason && (
                    <div className="pt-2 border-t border-line-soft">
                      <span className="text-[10px] font-bold uppercase tracking-wider block mb-1">
                        Most common reason for rejection
                      </span>
                      <span className="text-ink">{summary.most_common_rejection_reason}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-line-soft">
                    <span>Storage used:</span>
                    <span className="font-bold text-ink">{formatBytes(summary.storage_bytes)}</span>
                  </div>
                </div>
              </ChartCard>

              <ChartCard title="Recent activity" subtitle="What has happened on your account">
                {data.recent_activity.length > 0 ? (
                  <div className="space-y-3">
                    {data.recent_activity.map((event, index) => {
                      const Icon = ACTIVITY_ICONS[event.type] ?? Clock
                      return (
                        <div key={`${event.created_at}-${index}`} className="flex gap-3 items-start">
                          <Icon className="w-4 h-4 text-ink-faint flex-shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <p className="text-xs text-ink-soft leading-snug">{event.message}</p>
                            <p className="text-[10px] text-ink-faint mt-0.5">
                              {relativeTime(event.created_at)}
                              {event.status && ` · ${statusLabel(event.status)}`}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-ink-faint py-10 text-center">
                    {isDemo ? 'Activity appears once the API is connected.' : 'Nothing has happened yet.'}
                  </p>
                )}
                <Link
                  to="/dashboard/activity"
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#FB923C] hover:underline"
                >
                  See everything <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </ChartCard>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
