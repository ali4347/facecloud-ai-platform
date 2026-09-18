import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Upload, XCircle, Users, Camera,
  Download, ArrowUpRight, FileText,
  FolderArchive, ChevronRight, CheckCircle2,
  Loader2, Clock
} from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { GradientButton } from '../../components/ui/GradientButton'
import { uploadStatusBadge } from '../../components/ui/StatusBadge'
import { userStats, recentUploads, mockActivity } from '../../data/mock'
import { formatDateTime } from '../../lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

// ─── Quick Action Cards (Four Unique Actions) ──────────────────────────────────
const ACTION_CARDS = [
  { title: 'Single Upload', desc: 'Upload and enhance one portrait photo.', path: '/dashboard/upload/single', icon: FileText },
  { title: 'Multiple Upload', desc: 'Upload several photos at once.', path: '/dashboard/upload/multiple', icon: Upload },
  { title: 'Upload ZIP Archive', desc: 'Drop a ZIP of portraits for batch processing.', path: '/dashboard/upload/zip', icon: FolderArchive },
  { title: 'Live Camera', desc: 'Try real-time AI enhancement via camera.', path: '/dashboard/live-enhancement', icon: Camera },
]

// ─── 7-day accepted vs rejected chart ─────────────────────────────────────────
const WEEKLY_DATA = [
  { day: 'Mon', accepted: 18, rejected: 3 },
  { day: 'Tue', accepted: 22, rejected: 4 },
  { day: 'Wed', accepted: 14, rejected: 2 },
  { day: 'Thu', accepted: 26, rejected: 5 },
  { day: 'Fri', accepted: 20, rejected: 4 },
  { day: 'Sat', accepted: 10, rejected: 2 },
  { day: 'Sun', accepted: 12, rejected: 2 },
]

// ─── Relative timestamp helper ─────────────────────────────────────────────────
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return mins <= 1 ? 'Just now' : `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return hrs === 1 ? '1 hr ago' : `${hrs} hrs ago`
  const days = Math.floor(hrs / 24)
  return days === 1 ? 'Yesterday' : `${days} days ago`
}

// ─── Activity message rewriter ────────────────────────────────────────────────
const ACTIVITY_ICON_MAP: Record<string, React.ElementType> = {
  upload: CheckCircle2,
  enhance: CheckCircle2,
  validate: XCircle,
  download: Download,
  live: Camera,
  group: Users,
  reject: XCircle,
  login: Clock,
  admin: Clock,
  email: Clock,
}

function simplifyActivity(act: { type: string; message: string; status: string }) {
  const msg = act.message
  if (msg.includes('enhancement completed')) return 'Your photo was enhanced successfully.'
  if (msg.includes('grouped into Person Folder')) {
    const folder = msg.match(/grp-\d+/)?.[0] ?? 'a group'
    return `Photo grouped into ${folder}.`
  }
  if (msg.includes('Face validation failed: Image too blurry')) return 'Photo rejected — image too blurry.'
  if (msg.includes('Face validation failed: Multiple faces')) return 'Photo rejected — multiple faces detected.'
  if (msg.includes('Face validation failed: Face not detected')) return 'Photo rejected — no face found in image.'
  if (msg.includes('Face validation') && msg.includes('passed')) return 'Photo passed quality checks.'
  if (msg.includes('Rejection notification sent')) return 'Rejection email sent to you.'
  if (msg.includes('Email notification sent')) return 'Confirmation email sent to you.'
  if (msg.includes('Secure download link created')) return 'Your download link is ready.'
  if (msg.includes('logged in')) return 'You signed in.'
  if (msg.includes('Original image') && msg.includes('saved')) return 'Photo uploaded.'
  if (msg.includes('Email address verified')) return 'Email address verified.'
  return msg
}

export default function Dashboard() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  const isProcessing = userStats.processingInProgress > 0

  // Stat cards — 4 user-relevant metrics
  const statCards = useMemo(() => [
    {
      label: 'Total Uploads',
      value: userStats.totalUploads,
      icon: Upload,
      fill: '#4F46E5',
      glow: 'rgba(79,70,229,0.1)',
      sub: 'All time',
    },
    {
      label: 'Accepted',
      value: userStats.enhancedImages,
      icon: CheckCircle2,
      fill: '#059669',
      glow: 'rgba(5,150,105,0.1)',
      sub: 'Photos approved',
    },
    {
      label: 'Rejected',
      value: userStats.rejectedImages,
      icon: XCircle,
      fill: '#DC2626',
      glow: 'rgba(239,68,68,0.1)',
      sub: 'Did not pass checks',
    },
    {
      label: 'Groups',
      value: userStats.identityGroups,
      icon: Users,
      fill: '#4338CA',
      glow: 'rgba(67,56,202,0.1)',
      sub: 'Person folders',
    },
  ], [])

  return (
    <div className="page-enter space-y-6">

      {/* Row 1: Page Header with single primary Upload Photos button */}
      <PageHeader
        title="My Dashboard"
        subtitle="Your uploads, results and downloads — all in one place."
        action={
          <Link to="/dashboard/upload">
            <GradientButton leftIcon={<Upload className="w-4 h-4" />}>Upload Photos</GradientButton>
          </Link>
        }
      />

      {/* Row 2: Compact Welcome Banner (text-only) */}
      <div
        className="fc-card p-5 md:p-6 rounded-[24px] relative overflow-hidden backdrop-blur-lg border border-line"
        style={{
          background: 'radial-gradient(ellipse 70% 80% at 80% 20%, rgba(79,70,229, 0.08) 0%, transparent 60%), #FFFFFF'
        }}
      >
        <div className="space-y-1">
          <h2 className="text-lg md:text-xl font-bold text-ink tracking-tight leading-snug">Welcome back, Ali Hassan</h2>
          <p className="text-xs text-ink-mute leading-relaxed font-medium">
            Upload a photo, review your results, or download your enhanced images below.
          </p>
        </div>
      </div>

      {/* Row 3: Processing-in-progress banner */}
      {isProcessing && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-5 py-3.5 rounded-2xl text-xs font-semibold text-[#D97706]"
          style={{
            background: 'rgba(217,119,6,0.06)',
            border: '1px solid rgba(217,119,6,0.2)',
          }}
        >
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          {userStats.processingInProgress} upload{userStats.processingInProgress > 1 ? 's are' : ' is'} still processing. Results will appear here when ready.
        </motion.div>
      )}

      {/* Row 4: Four Unique Quick Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {ACTION_CARDS.map(card => {
          const isHovered = hoveredCard === card.title
          return (
            <Link
              to={card.path}
              key={card.title}
              onMouseEnter={() => setHoveredCard(card.title)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <motion.div
                whileHover={{ y: -3, borderColor: 'rgba(79,70,229,0.3)' }}
                className="fc-panel p-5 flex flex-col justify-between min-h-[140px] relative group h-full cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <div className="w-9 h-9 rounded-xl bg-surface-mute border border-line flex items-center justify-center text-[#6366F1] group-hover:text-[#059669] transition-colors">
                    <card.icon className="w-4 h-4" />
                  </div>
                  <ChevronRight className={`w-4 h-4 text-ink-faint transition-all ${isHovered ? 'translate-x-1 text-ink-mute' : ''}`} />
                </div>
                <div className="space-y-1.5 mt-5">
                  <h4 className="text-xs font-bold text-ink tracking-tight">{card.title}</h4>
                  <p className="text-[10px] text-ink-faint leading-snug font-medium">{card.desc}</p>
                </div>
              </motion.div>
            </Link>
          )
        })}
      </div>

      {/* Row 5: Four Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(stat => (
          <div
            key={stat.label}
            className="fc-card p-4 flex flex-col justify-between min-h-[120px] relative"
            style={{
              background: `radial-gradient(circle at top right, ${stat.glow} 0%, transparent 60%), #FFFFFF`
            }}
          >
            <div className="flex justify-between items-start">
              <span className="text-[9px] text-ink-faint font-bold uppercase tracking-wider">{stat.label}</span>
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center border"
                style={{
                  borderColor: '#F1F3F7',
                  background: '#F1F3F7',
                  color: stat.fill,
                }}
              >
                <stat.icon className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-4 space-y-0.5">
              <span className="text-2xl font-extrabold text-ink tracking-tight block">{stat.value}</span>
              <span className="text-[10px] text-ink-faint font-medium">{stat.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* Left Column: Weekly Uploads Chart + Recent Uploads Table */}
        <div className="xl:col-span-8 space-y-6">

          {/* Weekly Results Chart */}
          <div className="fc-card p-6 space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-ink">Your uploads this week</h3>
              <p className="text-[10px] text-ink-faint mt-0.5 font-medium">Accepted vs rejected photos — last 7 days</p>
            </div>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={WEEKLY_DATA} barSize={12} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F7" />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 10, fill: '#94A3B8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#94A3B8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: '#F1F3F7' }}
                    contentStyle={{
                      background: '#FFFFFF',
                      border: '1px solid #E6E9EF',
                      borderRadius: '14px',
                      fontSize: '11px',
                      color: '#0F172A',
                    }}
                  />
                  <Legend
                    formatter={(value) => (
                      <span style={{ color: '#64748B', fontSize: 10, fontWeight: 600 }}>
                        {value === 'accepted' ? 'Accepted' : 'Rejected'}
                      </span>
                    )}
                  />
                  <Bar dataKey="accepted" fill="#059669" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="rejected" fill="#DC2626" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Uploads Table */}
          <div className="fc-card p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-line pb-4">
              <div>
                <h3 className="text-sm font-semibold text-ink">Recent Uploads</h3>
                <p className="text-[10px] text-ink-faint mt-0.5 font-medium">Your latest photos and their results</p>
              </div>
              <Link to="/dashboard/images" className="text-xs text-[#6366F1] font-bold hover:underline flex items-center gap-1">
                View All <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="fc-table text-left w-full">
                <thead>
                  <tr>
                    <th>Preview</th>
                    <th>Filename</th>
                    <th>Status</th>
                    <th>Folder</th>
                    <th>Uploaded</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {recentUploads.slice(0, 5).map(row => (
                    <tr key={row.id}>
                      <td>
                        <div
                          className="w-7 h-7 rounded-lg border border-line"
                          style={{ background: String(row.thumbnail) }}
                        />
                      </td>
                      <td className="font-bold text-ink truncate max-w-[160px]">{row.filename}</td>
                      <td>{uploadStatusBadge(row.status)}</td>
                      <td>
                        {row.personFolderId ? (
                          <span className="badge-purple font-bold text-[9px] uppercase tracking-wider">{row.personFolderId}</span>
                        ) : (
                          <span className="text-ink-faint">—</span>
                        )}
                      </td>
                      <td className="text-ink-faint font-mono text-[10px] whitespace-nowrap">{formatDateTime(row.uploadedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Column: Recent Activity Feed + Downloads Status Card */}
        <div className="xl:col-span-4 space-y-6">

          {/* Recent Activity Feed */}
          <div className="fc-card p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-line pb-3">
              <div>
                <h3 className="text-sm font-semibold text-ink">Recent Activity</h3>
                <p className="text-[10px] text-ink-faint mt-0.5 font-medium">What's happened with your photos</p>
              </div>
            </div>

            <div className="space-y-4 relative pl-4 border-l border-line ml-2">
              {mockActivity.slice(0, 10).map(act => {
                const Icon = ACTIVITY_ICON_MAP[act.type] ?? Clock
                const isError = act.status === 'error'
                const dotColor = isError ? '#DC2626' : act.status === 'success' ? '#059669' : '#6366F1'
                return (
                  <div key={act.id} className="relative space-y-0.5">
                    <span
                      className="absolute -left-[20.5px] top-1.5 w-2 h-2 rounded-full border border-black"
                      style={{ background: dotColor }}
                    />
                    <div className="flex items-start gap-2">
                      <Icon className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: dotColor }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold text-ink-soft leading-snug">
                          {simplifyActivity(act)}
                        </p>
                        <p className="text-[9px] text-ink-faint font-mono mt-0.5">
                          {relativeTime(act.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Downloads Status Card (Informational with metadata) */}
          <div
            className="fc-card p-5 space-y-4 rounded-[24px] border border-line relative overflow-hidden"
            style={{
              background: 'radial-gradient(circle at bottom right, rgba(67,56,202,0.06) 0%, transparent 60%), #FFFFFF'
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#4338CA]/15 border border-[#4338CA]/20 flex items-center justify-center text-[#6366F1] shrink-0">
                <Download className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-bold text-ink">Downloads</h3>
                <p className="text-[10px] text-ink-faint font-medium truncate">Secure, time-limited download links</p>
              </div>
            </div>
            <div className="p-3 bg-surface-mute border border-line rounded-xl flex items-center justify-between">
              <span className="text-xs text-ink-mute font-medium">Enhanced files ready</span>
              <span className="text-sm font-extrabold text-[#059669] font-mono">{userStats.enhancedImages} photos</span>
            </div>
            <Link
              to="/dashboard/downloads"
              className="fc-btn-secondary !py-2.5 !px-4 text-[11px] font-bold w-full flex items-center justify-center gap-1.5 hover:border-[#4338CA]/40 transition-colors"
            >
              Open Downloads <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}
