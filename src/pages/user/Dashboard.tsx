import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Upload, Zap, XCircle, Users, Camera, Loader2,
  Download, ArrowUpRight, FileText,
  FolderArchive, ChevronRight, Check
} from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { GradientButton } from '../../components/ui/GradientButton'
import { uploadStatusBadge } from '../../components/ui/StatusBadge'
import { userStats, recentUploads, mockActivity } from '../../data/mock'
import { formatDateTime } from '../../lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'

const ACTION_CARDS = [
  { title: 'Single Image Upload', desc: 'Ingest and validate one portrait face file.', path: '/dashboard/upload/single', icon: FileText, delay: 0 },
  { title: 'Multiple Upload', desc: 'Enhance and crop multiple files in parallel.', path: '/dashboard/upload/multiple', icon: Upload, delay: 0.05 },
  { title: 'ZIP Archive Upload', desc: 'Ingest and catalog massive subject sets.', path: '/dashboard/upload/zip', icon: FolderArchive, delay: 0.1 },
  { title: 'Live Enhancement', desc: 'Test real-time camera AI and detectors.', path: '/dashboard/live-enhancement', icon: Camera, delay: 0.15 },
]

const PIPELINE_STEPS = [
  { label: 'Upload Ingest', latency: '24ms', status: 'completed' },
  { label: 'Original Save', latency: '8ms', status: 'completed' },
  { label: 'Zero-DCE Enhance', latency: '1.2s', status: 'completed' },
  { label: 'Face Validation', latency: '120ms', status: 'completed' },
  { label: 'Quality Audit', latency: '85ms', status: 'completed' },
  { label: 'Person Folder Match', latency: '94ms', status: 'completed' },
  { label: 'Secure Download', latency: '4ms', status: 'completed' }
]

const OVERVIEW_CHART_DATA = [
  { name: 'Ingested', count: 142, fill: '#0084FF' },
  { name: 'Enhanced', count: 120, fill: '#4FFFB0' },
  { name: 'Validated', count: 118, fill: '#7DEBFF' },
  { name: 'Grouped', count: 115, fill: '#7B61FF' },
  { name: 'Rejected', count: 22, fill: '#EF4444' },
  { name: 'Downloaded', count: 98, fill: '#60B1FF' }
]

export default function Dashboard() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  return (
    <div className="page-enter space-y-6">
      
      {/* Page Header */}
      <PageHeader
        title="Dashboard Overview"
        subtitle="Control center for your AI facial processing, clustering, and ingestion pipeline."
        action={
          <Link to="/dashboard/upload">
            <GradientButton leftIcon={<Upload className="w-4 h-4" />}>Upload Images</GradientButton>
          </Link>
        }
      />

      {/* 1. Hero Welcome Header Panel */}
      <div 
        className="fc-card p-6 md:p-8 rounded-[28px] relative overflow-hidden backdrop-blur-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
        style={{
          background: 'radial-gradient(ellipse 70% 80% at 80% 20%, rgba(0, 132, 255, 0.08) 0%, transparent 60%), rgba(255, 255, 255, 0.035)'
        }}
      >
        <div className="space-y-3 max-w-2xl">
          <span className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em] block">FaceCloud Control System</span>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight leading-none">Welcome back, Ali Hassan</h2>
          <p className="text-xs text-white/50 leading-relaxed font-medium">
            Monitor your image enhancement, validation, person folders, and secure downloads in one workspace.
          </p>
          
          {/* Status pills wrapper */}
          <div className="flex flex-wrap gap-2.5 pt-2">
            {[
              { label: 'JWT Session Active', status: 'success' },
              { label: 'Email Verified', status: 'success' },
              { label: 'Zero-DCE Ready', status: 'success' },
              { label: 'Face Validation Online', status: 'success' },
            ].map((pill, idx) => (
              <div key={idx} className="flex items-center gap-1.5 px-3 py-1 bg-white/[0.04] border border-white/[0.06] rounded-full text-[9px] font-bold text-white/70">
                <span className="w-1.5 h-1.5 bg-[#4FFFB0] rounded-full animate-pulse" />
                <span>{pill.label}</span>
              </div>
            ))}
          </div>
        </div>

        <Link 
          to="/dashboard/upload"
          className="fc-btn-primary !py-3 !px-6 text-xs font-bold shrink-0 shadow-lg"
          style={{ background: 'linear-gradient(135deg, #0084FF 0%, #7B61FF 100%)', color: '#fff', boxShadow: 'none' }}
        >
          Upload Images
        </Link>
      </div>

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
                whileHover={{ y: -3, borderColor: 'rgba(0,132,255,0.3)' }}
                className="fc-panel p-5 flex flex-col justify-between min-h-[140px] relative group h-full cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[#60B1FF] group-hover:text-[#4FFFB0] transition-colors">
                    <card.icon className="w-4.5 h-4.5" />
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

      {/* 3. Premium Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Uploads', value: userStats.totalUploads, trend: '+12%', icon: Upload, fill: '#0084FF', glow: 'rgba(0,132,255,0.1)' },
          { label: 'Enhanced Images', value: userStats.enhancedImages, trend: '+8%', icon: Zap, fill: '#4FFFB0', glow: 'rgba(79,255,176,0.1)' },
          { label: 'Rejected Images', value: userStats.rejectedImages, trend: '-3%', icon: XCircle, fill: '#EF4444', glow: 'rgba(239,68,68,0.1)' },
          { label: 'Person Folders', value: userStats.identityGroups, trend: '+1', icon: Users, fill: '#7B61FF', glow: 'rgba(123,97,255,0.1)' },
          { label: 'Live Sessions', value: userStats.liveSessions, trend: '+2', icon: Camera, fill: '#7DEBFF', glow: 'rgba(125,235,255,0.1)' },
          { label: 'Processing Jobs', value: userStats.processingInProgress, trend: 'Active', icon: Loader2, fill: '#F59E0B', glow: 'rgba(245,158,11,0.1)' }
        ].map(stat => (
          <div 
            key={stat.label} 
            className="fc-card p-4 flex flex-col justify-between min-h-[120px] relative group"
            style={{
              background: `radial-gradient(circle at top right, ${stat.glow} 0%, transparent 60%), rgba(255, 255, 255, 0.035)`
            }}
          >
            <div className="flex justify-between items-start">
              <span className="text-[9px] text-white/40 font-bold uppercase tracking-wider">{stat.label}</span>
              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
                stat.trend.startsWith('+') ? 'bg-[#4FFFB0]/10 text-[#4FFFB0]' : 
                stat.trend === 'Active' ? 'bg-[#0084FF]/20 text-[#60B1FF] animate-pulse' :
                'bg-white/10 text-white/50'
              }`}>
                {stat.trend}
              </span>
            </div>
            
            <div className="flex items-end justify-between mt-4">
              <span className="text-xl font-extrabold text-white tracking-tight">{stat.value}</span>
              <div 
                className="w-7 h-7 rounded-lg flex items-center justify-center border transition-all duration-300"
                style={{ 
                  borderColor: 'rgba(255,255,255,0.06)',
                  background: 'rgba(255,255,255,0.02)',
                  color: stat.fill
                }}
              >
                <stat.icon className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Layout Grid split */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left column large analytics */}
        <div className="xl:col-span-8 space-y-6">
          
          {/* 4. Processing Overview Chart */}
          <div className="fc-card p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-white">Processing Overview</h3>
                <p className="text-[10px] text-white/40 mt-0.5 font-medium">AI pipeline status for this week</p>
              </div>
              
              {/* Summary chips */}
              <div className="flex flex-wrap gap-2">
                {[
                  { text: '94% success rate', color: 'text-[#4FFFB0]', bg: 'bg-[#4FFFB0]/10' },
                  { text: '4.2s avg processing', color: 'text-[#60B1FF]', bg: 'bg-[#60B1FF]/10' },
                  { text: '18 ZIP reports', color: 'text-[#A78BFA]', bg: 'bg-[#A78BFA]/10' },
                  { text: '32 secure links', color: 'text-[#7DEBFF]', bg: 'bg-[#7DEBFF]/10' }
                ].map((chip, idx) => (
                  <span key={idx} className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${chip.color} ${chip.bg}`}>
                    {chip.text}
                  </span>
                ))}
              </div>
            </div>

            {/* Recharts Bar Chart */}
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={OVERVIEW_CHART_DATA} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                    contentStyle={{ 
                      background: 'rgba(5,7,10,0.95)', 
                      border: '1px solid rgba(255,255,255,0.12)', 
                      borderRadius: '16px', 
                      fontSize: '11px', 
                      color: '#fff' 
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {OVERVIEW_CHART_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 5. AI Pipeline Health Methodology Stepper */}
          <div className="fc-card p-6 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white">AI Pipeline Health</h3>
              <p className="text-[10px] text-white/40 mt-0.5 font-medium">Latencies and micro-node connectivity audit</p>
            </div>

            {/* Stepper progress block */}
            <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-4 pt-2">
              {PIPELINE_STEPS.map((step, idx) => (
                <div key={step.label} className="flex-1 flex items-center min-w-[110px]">
                  <div className="flex flex-col items-center text-center gap-1.5">
                    <div className="w-7 h-7 rounded-lg border border-[#4FFFB0]/30 bg-[#4FFFB0]/15 text-[#4FFFB0] flex items-center justify-center text-[10px] font-bold">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-bold text-white/80 leading-none truncate max-w-[80px]">{step.label}</p>
                      <p className="text-[8px] text-white/40 font-mono font-semibold">{step.latency}</p>
                    </div>
                  </div>

                  {idx < PIPELINE_STEPS.length - 1 && (
                    <div className="hidden lg:block h-0.5 flex-1 bg-[#4FFFB0]/40 mx-2" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 7. Recent Uploads Grid / Table */}
          <div className="fc-card p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-white/[0.08] pb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Recent Ingestion Uploads</h3>
                <p className="text-[10px] text-white/40 mt-0.5 font-medium">Your latest files moving through verification</p>
              </div>
              <Link to="/dashboard/images" className="text-xs text-[#60B1FF] font-bold hover:underline flex items-center gap-1">
                View All <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Scrollable table wrapper */}
            <div className="overflow-x-auto">
              <table className="fc-table text-left">
                <thead>
                  <tr>
                    <th>Preview</th>
                    <th>Filename</th>
                    <th>Status</th>
                    <th>Format</th>
                    <th>Size</th>
                    <th>Dimensions</th>
                    <th>Folder Match</th>
                    <th>Uploaded</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {recentUploads.slice(0, 4).map(row => (
                    <tr key={row.id}>
                      <td>
                        <div 
                          className="w-6 h-6 rounded border border-white/10"
                          style={{ background: String(row.thumbnail) }}
                        />
                      </td>
                      <td className="font-bold text-white truncate max-w-[140px]">{row.filename}</td>
                      <td>{uploadStatusBadge(row.status)}</td>
                      <td>
                        <span className="px-2 py-0.5 bg-white/[0.04] border border-white/[0.08] text-[9px] rounded font-bold uppercase text-white/60">
                          {row.filename.endsWith('.zip') ? 'ZIP' : 'Single'}
                        </span>
                      </td>
                      <td className="font-mono text-xs">{row.size}</td>
                      <td className="font-mono text-[10px] text-white/40">{row.dimensions}</td>
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

        {/* Right column activity / promo widgets */}
        <div className="xl:col-span-4 space-y-6">
          
          {/* 6. Recent Activity Timeline */}
          <div className="fc-card p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-white/[0.08] pb-3">
              <div>
                <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
                <p className="text-[10px] text-white/40 mt-0.5 font-medium">Platform telemetry timeline</p>
              </div>
              <Link to="/dashboard/activity" className="text-xs text-[#60B1FF] font-semibold hover:underline">
                View all
              </Link>
            </div>

            {/* Vertical timeline stepper */}
            <div className="space-y-4 relative pl-4 border-l border-white/[0.08] ml-2">
              {mockActivity.slice(0, 5).map(act => (
                <div key={act.id} className="relative space-y-1">
                  {/* Timeline dot */}
                  <span className={`absolute -left-[20.5px] top-1.5 w-2 h-2 rounded-full border border-black ${
                    act.status === 'success' ? 'bg-[#4FFFB0]' : 'bg-[#60B1FF]'
                  }`} />
                  <div className="flex justify-between items-start text-[10px] font-bold text-white/70">
                    <span className="truncate max-w-[150px]">{act.message}</span>
                    <span className="text-[9px] text-white/30 font-mono font-medium ml-1 whitespace-nowrap">{formatDateTime(act.timestamp)}</span>
                  </div>
                  <div className="text-[9px] text-white/40 font-medium">
                    Status: {act.status.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 8. Live Enhancement Preview Promo Card */}
          <div 
            className="fc-card p-6 space-y-4 rounded-[24px] border border-white/[0.08] relative overflow-hidden"
            style={{
              background: 'radial-gradient(circle at bottom left, rgba(79,255,176,0.06) 0%, transparent 60%), rgba(255, 255, 255, 0.035)'
            }}
          >
            <div className="w-8 h-8 rounded-lg bg-[#4FFFB0]/15 border border-[#4FFFB0]/20 flex items-center justify-center text-[#4FFFB0]">
              <Camera className="w-4.5 h-4.5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-white">Live Enhancement Panel</h3>
              <p className="text-[10px] text-white/45 leading-relaxed font-medium">
                Test real-time browser camera enhancement with frontend Zero-DCE simulation and face detection.
              </p>
            </div>

            <div className="h-px bg-white/[0.08] my-1" />
            
            <div className="space-y-1.5 text-[9px] font-mono text-white/60">
              <div className="flex justify-between">
                <span>Camera status:</span>
                <span className="text-[#4FFFB0] font-bold">READY</span>
              </div>
              <div className="flex justify-between">
                <span>WASM Detector:</span>
                <span className="text-[#4FFFB0] font-bold">READY</span>
              </div>
              <div className="flex justify-between">
                <span>AI Pipeline Model:</span>
                <span className="text-[#60B1FF] font-bold">Zero-DCE Demo</span>
              </div>
            </div>

            <Link 
              to="/dashboard/live-enhancement"
              className="fc-btn-secondary !py-2 !px-4 text-[10px] font-bold w-full mt-2 flex items-center justify-center gap-1 border-[#4FFFB0]/35 hover:border-[#4FFFB0]"
            >
              Open Live Enhancement <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {/* 9. Downloads / Reports Promo Card */}
          <div 
            className="fc-card p-6 space-y-4 rounded-[24px] border border-white/[0.08] relative overflow-hidden"
            style={{
              background: 'radial-gradient(circle at bottom right, rgba(123,97,255,0.06) 0%, transparent 60%), rgba(255, 255, 255, 0.035)'
            }}
          >
            <div className="w-8 h-8 rounded-lg bg-[#7B61FF]/15 border border-[#7B61FF]/20 flex items-center justify-center text-[#A78BFA]">
              <Download className="w-4.5 h-4.5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-white">Downloads &amp; ZIP Reports</h3>
              <p className="text-[10px] text-white/45 leading-relaxed font-medium">
                Access your generated identity spreadsheets and compressed enhanced batch folders.
              </p>
            </div>

            <div className="h-px bg-white/[0.08] my-1" />

            <div className="space-y-1.5 text-[9px] font-mono text-white/60">
              <div className="flex justify-between">
                <span>Enhanced downloads:</span>
                <span className="text-[#4FFFB0] font-bold">READY</span>
              </div>
              <div className="flex justify-between">
                <span>Secure Links active:</span>
                <span className="text-[#60B1FF] font-bold">32 LINKS</span>
              </div>
            </div>

            <Link 
              to="/dashboard/downloads"
              className="fc-btn-secondary !py-2 !px-4 text-[10px] font-bold w-full mt-2 flex items-center justify-center gap-1 hover:border-[#7B61FF]/40"
            >
              Open Downloads <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

        </div>

      </div>
    </div>
  )
}
