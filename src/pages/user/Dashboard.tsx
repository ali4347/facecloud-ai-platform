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

// ─── Quick Action Cards ────────────────────────────────────────────────────────
const ACTION_CARDS = [
  { title: 'Single Upload', desc: 'Upload and enhance one portrait photo.', path: '/dashboard/upload/single', icon: FileText, delay: 0 },
  { title: 'Multiple Upload', desc: 'Upload several photos at once.', path: '/dashboard/upload/multiple', icon: Upload, delay: 0.05 },
  { title: 'Upload ZIP Archive', desc: 'Drop a ZIP of portraits for batch processing.', path: '/dashboard/upload/zip', icon: FolderArchive, delay: 0.1 },
  { title: 'Live Camera', desc: 'Try real-time AI enhancement via camera.', path: '/dashboard/live-enhancement', icon: Camera, delay: 0.15 },
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

  // Stat cards — 4 user-relevant ones only
  const statCards = useMemo(() => [
    {
      label: 'Total Uploads',
      value: userStats.totalUploads,
      icon: Upload,
      fill: '#F97316',
      glow: 'rgba(249, 115, 22,0.1)',
      sub: 'All time',
    },
    {
      label: 'Accepted',
      value: userStats.enhancedImages,
      icon: CheckCircle2,
      fill: '#4FFFB0',
      glow: 'rgba(79,255,176,0.1)',
      sub: 'Photos approved',
    },
    {
      label: 'Rejected',
      value: userStats.rejectedImages,
      icon: XCircle,
      fill: '#EF4444',
      glow: 'rgba(239,68,68,0.1)',
      sub: 'Did not pass checks',
    },
    {
      label: 'Groups',
      value: userStats.identityGroups,
      icon: Users,
      fill: '#EA580C',
      glow: 'rgba(234, 88, 12,0.1)',
      sub: 'Person folders',
    },
  ], [])

  return (
    <div className="page-enter space-y-6">

      {/* Page Header */}
      <PageHeader
        title="My Dashboard"
        subtitle="Your uploads, results and downloads — all in one place."
        action={
          <Link to="/dashboard/upload">
            <GradientButton leftIcon={<Upload className="w-4 h-4" />}>Upload Photos</GradientButton>
          </Link>
        }
      />

      {/* 1. Welcome Banner */}
      <div
        className="fc-card p-6 md:p-8 rounded-[28px] relative overflow-hidden backdrop-blur-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
        style={{
          background: 'radial-gradient(ellipse 70% 80% at 80% 20%, rgba(249, 115, 22, 0.08) 0%, transparent 60%), rgba(255, 255, 255, 0.035)'
        }}
      >
        <div className="space-y-2 max-w-xl">
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight leading-none">Welcome back, Ali Hassan</h2>
          <p className="text-sm text-white/50 leading-relaxed font-medium">
            Upload a photo, check your results, or download your enhanced images below.
          </p>
        </div>
        <Link
          to="/dashboard/upload"
          className="fc-btn-primary !py-3 !px-6 text-xs font-bold shrink-0"
          style={{ background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)', color: '#fff', boxShadow: 'none' }}
        >
          Upload Photos
        </Link>
      </div>

      {/* Processing-in-progress banner */}
      {isProcessing && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-5 py-3.5 rounded-2xl text-xs font-semibold text-[#F59E0B]"
          style={{
            background: 'rgba(245,158,11,0.06)',
            border: '1px solid rgba(245,158,11,0.2)',
          }}
        >
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          {userStats.processingInProgress} upload{userStats.processingInProgress > 1 ? 's are' : ' is'} still processing. Results will appear here when ready.
        </motion.div>
      )}

      {/* 2. Quick Action Cards */}
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
                whileHover={{ y: -3, borderColor: 'rgba(249, 115, 22,0.3)' }}
                className="fc-panel p-5 flex flex-col justify-between min-h-[140px] relative group h-full cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[#FB923C] group-hover:text-[#4FFFB0] transition-colors">
                    <card.icon className="w-4 h-4" />
                  </div>
                  <ChevronRight className={`w-4 h-4 text-white/20 transition-all ${isHovered ? 'translate-x-1 text-white/50' : ''}`} />
                </div>
                <div className="space-y-1.5 mt-5">
                  <h4 className="text-xs font-bold text-white tracking-tight">{card.title}</h4>
                  <p className="text-[10px] text-white/40 leading-snug font-medium">{card.desc}</p>
                </div>
              </motion.div>
            </Link>
          )
        })}
      </div>

      {/* 3. Stat Cards (4 only) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(stat => (
          <div
            key={stat.label}
            className="fc-card p-4 flex flex-col justify-between min-h-[120px] relative"
            style={{
              background: `radial-gradient(circle at top right, ${stat.glow} 0%, transparent 60%), rgba(255, 255, 255, 0.035)`
            }}
          >
            <div className="flex justify-between items-start">
              <span className="text-[9px] text-white/40 font-bold uppercase tracking-wider">{stat.label}</span>
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center border"
                style={{
                  borderColor: 'rgba(255,255,255,0.06)',
                  background: 'rgba(255,255,255,0.02)',
                  color: stat.fill,
                }}
              >
                <stat.icon className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-4 space-y-0.5">
              <span className="text-2xl font-extrabold text-white tracking-tight block">{stat.value}</span>
              <span className="text-[10px] text-white/30 font-medium">{stat.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main two-column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* Left: Chart + Recent Uploads table */}
        <div className="xl:col-span-8 space-y-6">

          {/* 4. This Week's Results Chart */}
          <div className="fc-card p-6 space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-white">Your uploads this week</h3>
              <p className="text-[10px] text-white/40 mt-0.5 font-medium">Accepted vs rejected photos — last 7 days</p>
            </div>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={WEEKLY_DATA} barSize={12} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                    contentStyle={{
                      background: 'rgba(5,7,10,0.95)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '14px',
                      fontSize: '11px',
                      color: '#fff',
                    }}
                  />
                  <Legend
                    formatter={(value) => (
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 600 }}>
                        {value === 'accepted' ? 'Accepted' : 'Rejected'}
                      </span>
                    )}
                  />
                  <Bar dataKey="accepted" fill="#4FFFB0" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="rejected" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 5. Recent Uploads */}
          <div className="fc-card p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-white/[0.08] pb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Recent Uploads</h3>
                <p className="text-[10px] text-white/40 mt-0.5 font-medium">Your latest photos and their results</p>
              </div>
              <Link to="/dashboard/images" className="text-xs text-[#FB923C] font-bold hover:underline flex items-center gap-1">
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
                <tbody className="divide-y divide-white/[0.04]">
                  {recentUploads.slice(0, 5).map(row => (
                    <tr key={row.id}>
                      <td>
                        <div
                          className="w-7 h-7 rounded-lg border border-white/10"
                          style={{ background: String(row.thumbnail) }}
                        />
                      </td>
                      <td className="font-bold text-white truncate max-w-[160px]">{row.filename}</td>
                      <td>{uploadStatusBadge(row.status)}</td>
                      <td>
                        {row.personFolderId ? (
                          <span className="badge-purple font-bold text-[9px] uppercase tracking-wider">{row.personFolderId}</span>
                        ) : (
                          <span className="text-white/20">—</span>
                        )}
                      </td>
                      <td className="text-white/40 font-mono text-[10px] whitespace-nowrap">{formatDateTime(row.uploadedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right: Activity feed + promo cards */}
        <div className="xl:col-span-4 space-y-6">

          {/* 6. Recent Activity */}
          <div className="fc-card p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-white/[0.08] pb-3">
              <div>
                <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
                <p className="text-[10px] text-white/40 mt-0.5 font-medium">What's happened with your photos</p>
              </div>
            </div>

            <div className="space-y-4 relative pl-4 border-l border-white/[0.08] ml-2">
              {mockActivity.slice(0, 8).map(act => {
                const Icon = ACTIVITY_ICON_MAP[act.type] ?? Clock
                const isError = act.status === 'error'
                const dotColor = isError ? '#EF4444' : act.status === 'success' ? '#4FFFB0' : '#FB923C'
                return (
                  <div key={act.id} className="relative space-y-0.5">
                    <span
                      className="absolute -left-[20.5px] top-1.5 w-2 h-2 rounded-full border border-black"
                      style={{ background: dotColor }}
                    />
                    <div className="flex items-start gap-2">
                      <Icon className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: dotColor }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold text-white/80 leading-snug">
                          {simplifyActivity(act)}
                        </p>
                        <p className="text-[9px] text-white/30 font-mono mt-0.5">
                          {relativeTime(act.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 7. Live Enhancement Promo */}
          <div
            className="fc-card p-6 space-y-4 rounded-[24px] border border-white/[0.08] relative overflow-hidden"
            style={{
              background: 'radial-gradient(circle at bottom left, rgba(79,255,176,0.06) 0%, transparent 60%), rgba(255, 255, 255, 0.035)'
            }}
          >
            <div className="w-8 h-8 rounded-lg bg-[#4FFFB0]/15 border border-[#4FFFB0]/20 flex items-center justify-center text-[#4FFFB0]">
              <Camera className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-white">Live Camera Enhancement</h3>
              <p className="text-[10px] text-white/45 leading-relaxed font-medium">
                Point your camera to see AI enhancement and face detection in real time.
              </p>
            </div>
            <Link
              to="/dashboard/live-enhancement"
              className="fc-btn-secondary !py-2 !px-4 text-[10px] font-bold w-full mt-2 flex items-center justify-center gap-1 border-[#4FFFB0]/35 hover:border-[#4FFFB0]"
            >
              Open Live Camera <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {/* 8. Downloads Promo */}
          <div
            className="fc-card p-6 space-y-4 rounded-[24px] border border-white/[0.08] relative overflow-hidden"
            style={{
              background: 'radial-gradient(circle at bottom right, rgba(234, 88, 12,0.06) 0%, transparent 60%), rgba(255, 255, 255, 0.035)'
            }}
          >
            <div className="w-8 h-8 rounded-lg bg-[#EA580C]/15 border border-[#EA580C]/20 flex items-center justify-center text-[#A78BFA]">
              <Download className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-white">Downloads</h3>
              <p className="text-[10px] text-white/45 leading-relaxed font-medium">
                {userStats.enhancedImages} photos are ready to download with secure, time-limited links.
              </p>
            </div>
            <Link
              to="/dashboard/downloads"
              className="fc-btn-secondary !py-2 !px-4 text-[10px] font-bold w-full mt-2 flex items-center justify-center gap-1 hover:border-[#EA580C]/40"
            >
              Open Downloads <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}
