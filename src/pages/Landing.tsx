import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Shield, Zap, Check, ArrowUpRight, Activity, AlertTriangle, FolderOpen,
  Cpu, Eye, Users, BarChart3, Upload, Mail, ScrollText, Key, Terminal
} from 'lucide-react'
import { BeforeAfterSlider } from '../components/features/BeforeAfterSlider'
import { BackgroundVideo } from '../components/public/BackgroundVideo'
import { PublicNavbar } from '../components/public/PublicNavbar'
import { FaceCloudLogo } from '../components/branding/FaceCloudLogo'
import { HeroSection } from '../components/public/HeroSection'

const LOGOS = ['DataMart', 'VisionGrid', 'NeuralStack', 'CloudNova', 'OrbitAI']

const PROBLEM_CARDS = [
  { icon: Zap,           title: 'Dark or low-light facial images', desc: 'Under-exposed cameras fail to capture distinct biometric markers.' },
  { icon: AlertTriangle, title: 'Blurry and poor-quality photos',   desc: 'Movement and out-of-focus capture nodes generate invalid details.' },
  { icon: Eye,           title: 'Multiple faces in one image',     desc: 'Single-subject identity systems throw errors on secondary inputs.' },
  { icon: Users,         title: 'Duplicate identity folders',       desc: 'Subject profiles clutter database schemas without similarity indexing.' },
  { icon: FolderOpen,    title: 'Manual sorting and weak tracking', desc: 'Organizations waste valuable developer hours categorizing face sets.' },
]

const PIPELINE_STEPS = [
  { step: 1,  name: 'JWT Login',        d: 'JWT credentials', status: 'completed' },
  { step: 2,  name: 'Upload Images',    d: 'ZIP/Multipart POST', status: 'completed' },
  { step: 3,  name: 'Store Original',   d: 'AWS S3 asset buffer', status: 'completed' },
  { step: 4,  name: 'AI Enhance',       d: 'Zero-DCE lighting', status: 'active' },
  { step: 5,  name: 'Face Detection',   d: 'Rekognition check', status: 'pending' },
  { step: 6,  name: 'Quality Checks',   d: 'Blur & exposure', status: 'pending' },
  { step: 7,  name: 'Face Embedding',   d: '512-D vector extraction', status: 'pending' },
  { step: 8,  name: 'Person Folder',    d: 'Identity matching', status: 'pending' },
  { step: 9,  name: 'Secure Download',  d: 'Signed URL generation', status: 'pending' },
  { step: 10, name: 'Logs & Alerts',    d: 'In-app notification', status: 'pending' },
]

const FEATURE_GRID = [
  { icon: Zap,           t: 'Zero-DCE Illumination', d: 'Estimates lighting maps without reference curves.' },
  { icon: Upload,        t: 'ZIP Ingest Node',       d: 'Automatically decompresses and processes batches.' },
  { icon: Eye,           t: 'Biometric Scanner',     d: 'Validates facial landmarks and alignment ratios.' },
  { icon: Users,         t: 'Identity Clustering',   d: 'Groups matched records into clean profile directories.' },
  { icon: Shield,        t: 'Secure Cloud Buckets',  d: 'S3 architecture encrypts assets at rest.' },
  { icon: BarChart3,     t: 'Admin Statistics',      d: 'Provides high-level user metrics & performance charts.' },
  { icon: AlertTriangle, t: 'Moderator Review Queue', desc: 'Allows overriding of flagged quality rejections.' },
  { icon: ScrollText,    t: 'Detailed Audit Logs',   d: 'Complete session traceability for security audits.' },
  { icon: Mail,          t: 'Automated Notifications', d: 'Keeps team members updated on processing progress.' },
  { icon: Key,           t: 'JWT Authorization',     d: 'Zero-trust authentication for all system APIs.' },
  { icon: Terminal,      t: 'API Docs & Playgrounds', d: 'Swagger specification with live testing tool.' },
  { icon: Activity,      t: 'Cluster Live Diagnostics', d: 'Real-time microservice status indicator.' },
]

export default function Landing() {
  const [activeStep, setActiveStep] = useState(4)
  const [logs, setLogs] = useState<string[]>([
    '[SYSTEM] Ingesting zip payload: batch_portraits_2026.zip',
    '[SYSTEM] Validation checksum: SUCCESS (MD5 matches database reference)',
    '[MODEL-DCE] running exposure restoration on frame 014...'
  ])

  useEffect(() => {
    const logsPool = [
      '[MODEL-DCE] Exposure mapping completed: 94.2% gain',
      '[MODEL-NET] Face detected: Confidence 98.8%',
      '[SYSTEM] Landmark verification: SUCCESS (Landmarks OK)',
      '[MODEL-NET] Generating 512-D embedding representation...',
      '[SYSTEM] Matching cluster... Person Folder "Person 001" matched',
      '[SYSTEM] Saved to AWS storage buffer: grp-001/ali_enhanced.jpg',
      '[SYSTEM] User email notification queued successfully',
      '[FIREWALL] Request rate: 12 req/sec (Safe threshold)',
    ]
    const timer = setInterval(() => {
      setLogs(prev => {
        const nextLog = logsPool[Math.floor(Math.random() * logsPool.length)]
        const withNew = [...prev, `[${new Date().toLocaleTimeString()}] ${nextLog}`]
        return withNew.slice(-6)
      })
    }, 3000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="bg-[#020508] text-[#F0F4FF] font-sans selection:bg-[#0084FF] selection:text-white overflow-x-hidden relative min-h-screen">
      
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[120vh] left-[-20%] w-[60%] h-[50vh] rounded-full blur-[160px]" style={{ background: 'radial-gradient(circle, rgba(0,132,255,0.06) 0%, transparent 70%)' }} />
        <div className="absolute top-[240vh] right-[-20%] w-[50%] h-[50vh] rounded-full blur-[160px]" style={{ background: 'radial-gradient(circle, rgba(123,97,255,0.05) 0%, transparent 70%)' }} />
        <div className="absolute top-[380vh] left-[-10%] w-[60%] h-[50vh] rounded-full blur-[160px]" style={{ background: 'radial-gradient(circle, rgba(79,255,176,0.04) 0%, transparent 70%)' }} />
      </div>

      {/* ══════════════════════════════════════════════════════════
          SECTION 1 — Fullscreen video hero (100vh)
          ══════════════════════════════════════════════════════════ */}
      <main className="relative bg-black h-screen w-screen flex flex-col overflow-hidden selection:bg-white selection:text-black shrink-0 z-10">
        <BackgroundVideo />
        <PublicNavbar />
        <HeroSection />
      </main>

      {/* ══════════════════════════════════════════════════════════
          SCROLLABLE SECTIONS BELOW-THE-FOLD
          ══════════════════════════════════════════════════════════ */}
      <div className="relative z-10">

        {/* ── 2. Trusted Logos Section ──────────────────────────── */}
        <section className="py-14 border-y border-white/[0.06] bg-black/40 relative z-10">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-[10px] text-white/40 font-bold uppercase tracking-[0.25em] mb-7"
            >
              Trusted by AI-driven teams and secure image workflows
            </motion.p>
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap justify-center items-center gap-10 md:gap-20"
            >
              {LOGOS.map(logo => (
                <span 
                  key={logo} 
                  className="text-sm font-extrabold tracking-[0.15em] text-white/50 hover:text-white/90 transition-all duration-300 select-none cursor-default"
                >
                  {logo.toUpperCase()}
                </span>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── 3. Problem Section ────────────────────────────────── */}
        <section className="py-24 max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <motion.span 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-xs font-bold text-[#0084FF] tracking-widest uppercase block"
            >
              The Dataset Challenge
            </motion.span>
            <motion.h2 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-5xl font-medium text-white tracking-tight leading-[1.15]" 
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Facial image workflows are still too manual
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-sm text-white/50 max-w-xl mx-auto font-medium"
            >
              Low-quality images, duplicate identities, and manual sorting slow down secure image management.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
            {PROBLEM_CARDS.map((card, idx) => (
              <motion.div 
                key={card.title} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08, duration: 0.5 }}
                whileHover={{ y: -4, borderColor: 'rgba(0,132,255,0.3)' }}
                className="fc-panel p-6 flex flex-col justify-between relative group"
              >
                <div 
                  className="absolute -top-4 -left-4 w-16 h-16 rounded-full blur-[20px] opacity-10 group-hover:opacity-20 transition-opacity"
                  style={{ background: 'radial-gradient(circle, #4FFFB0 0%, transparent 70%)' }}
                />
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/[0.04] border border-white/[0.08] text-[#4FFFB0] mb-5">
                  <card.icon className="w-4 h-4" />
                </div>
                <div className="space-y-2 mt-4">
                  <h3 className="text-xs font-bold text-white tracking-tight">{card.title}</h3>
                  <p className="text-[11px] text-white/40 leading-relaxed font-medium">{card.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── 4. AI Solution Section ───────────────────────────── */}
        <section className="py-24 bg-black/40 border-y border-white/[0.05] relative">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Info Columns */}
            <div className="lg:col-span-5 space-y-6">
              <motion.span 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-xs font-bold text-[#0084FF] tracking-widest uppercase block"
              >
                AI Infrastructure
              </motion.span>
              <motion.h2 
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl sm:text-5xl font-medium text-white leading-[1.1]" 
                style={{ fontFamily: "'Instrument Serif', serif" }}
              >
                FaceCloud turns raw uploads <br />
                <span className="text-[#60B1FF] font-medium">into organized AI-ready folders</span>
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-sm text-white/55 leading-relaxed font-medium"
              >
                We automate exposure curves, crop structures, biometric validation, and identity matching parameters under a zero-trust compliance model.
              </motion.p>
              
              <div className="space-y-3 pt-4 text-xs font-bold text-white/60">
                {[
                  { title: 'Zero-DCE enhancement', desc: 'Estimates lighting maps on underexposed faces.' },
                  { title: 'Face validation',     desc: 'Ensures only one subject is present in the frame.' },
                  { title: 'Quality scoring',     desc: 'Flags blurry or low-resolution face sets.' },
                  { title: 'Identity grouping',   desc: 'Maps 512-D vectors directly into clusters.' }
                ].map((spec, i) => (
                  <motion.div 
                    key={spec.title} 
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-5 h-5 rounded-lg bg-[#4FFFB0]/15 border border-[#4FFFB0]/25 flex items-center justify-center text-[#4FFFB0] mt-0.5">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-white block font-bold">{spec.title}</span>
                      <span className="text-[10px] text-white/40 block font-medium mt-0.5">{spec.desc}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Right animated panel */}
            <div className="lg:col-span-7">
              <motion.div 
                initial={{ opacity: 0, scale: 0.97 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="fc-panel p-6 relative overflow-hidden"
              >
                <div className="flex justify-between items-center pb-4 border-b border-white/[0.08] mb-6">
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Active AI Restructuring</span>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#0084FF]/20 text-[#60B1FF] font-bold">PIPELINE: ACTIVE</span>
                </div>

                <div className="space-y-4">
                  {[
                    { label: 'Original Image Saved',    value: 'portrait_underexposed.png', status: 'SUCCESS' },
                    { label: 'Zero-DCE Enhancement',     value: 'Exposure restored (+2.4 EV)', status: 'ACTIVE' },
                    { label: 'Face Bounds Detection',    value: 'Landmarks validated (1 face)', status: 'SUCCESS' },
                    { label: 'Quality Score Assessment', value: 'Exposure/Blur index: PASS', status: 'PENDING' },
                    { label: 'Person Cluster Match',     value: 'Mapped to grp-001 (Confidence 99.2%)', status: 'PENDING' },
                  ].map((proc, index) => (
                    <div 
                      key={proc.label} 
                      className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center bg-white/[0.04] text-xs font-mono font-bold text-white/40">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-white">{proc.label}</p>
                          <p className="text-[10px] text-white/40 font-medium mt-0.5">{proc.value}</p>
                        </div>
                      </div>
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        proc.status === 'SUCCESS' ? 'bg-[#4FFFB0]/15 text-[#4FFFB0]' :
                        proc.status === 'ACTIVE' ? 'bg-[#0084FF]/20 text-[#60B1FF] animate-pulse' :
                        'bg-white/5 text-white/30'
                      }`}>
                        {proc.status}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── 5. Features Grid Section ──────────────────────────── */}
        <section id="features" className="py-24 max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <span className="text-xs font-bold text-[#0084FF] tracking-widest uppercase block">Ingestion Suite</span>
            <h2 className="text-3xl sm:text-5xl font-medium text-white tracking-tight leading-[1.15]" style={{ fontFamily: "'Instrument Serif', serif" }}>
              Everything needed for AI facial image processing
            </h2>
            <p className="text-sm text-white/50 max-w-xl mx-auto font-medium">
              12 specialized components engineered for rapid asset enhancement, sorting, and monitoring.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURE_GRID.map((feat, index) => (
              <motion.div 
                key={feat.t}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05, duration: 0.5 }}
                whileHover={{ y: -3, borderColor: 'rgba(96,177,255,0.3)' }}
                className="fc-panel p-6 flex flex-col justify-between min-h-[170px]"
              >
                <feat.icon className="w-5 h-5 text-[#60B1FF]" />
                <div className="mt-6 space-y-1">
                  <h3 className="text-xs font-bold text-white tracking-tight">{feat.t}</h3>
                  <p className="text-[10px] text-white/45 leading-relaxed font-medium">{feat.d}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── 6. Methodology / Pipeline Section ─────────────────── */}
        <section id="methodology" className="py-24 bg-black/40 border-y border-white/[0.05] relative">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16 space-y-4">
              <span className="text-xs font-bold text-[#0084FF] tracking-widest uppercase block">Methodology</span>
              <h2 className="text-3xl sm:text-5xl font-medium text-white tracking-tight leading-[1.15]" style={{ fontFamily: "'Instrument Serif', serif" }}>
                From upload to secure download
              </h2>
              <p className="text-sm text-white/50 max-w-xl mx-auto font-medium">
                Our unified REST pipeline checks biometric details and matches subjects with micro-node GPU tasks.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Desktop Horizontal / Mobile Vertical Pipeline Flow */}
              <div className="lg:col-span-8 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {PIPELINE_STEPS.map(item => {
                    const isActive = activeStep === item.step
                    return (
                      <div 
                        key={item.step}
                        onClick={() => setActiveStep(item.step)}
                        className={`fc-panel p-4 flex flex-col justify-between min-h-[120px] transition-all cursor-pointer ${
                          isActive ? 'border-[#0084FF]/60 ring-1 ring-[#0084FF]/40' : ''
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            isActive ? 'bg-[#0084FF] text-white' : 'bg-white/10 text-white/50'
                          }`}>
                            {item.step}
                          </span>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            isActive ? 'bg-[#4FFFB0] animate-pulse' : 'bg-white/20'
                          }`} />
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="text-[10px] font-bold text-white truncate">{item.name}</h4>
                          <p className="text-[9px] text-white/40 leading-snug truncate">{item.d}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Side Stats Job preview */}
              <div className="lg:col-span-4">
                <div className="fc-panel p-5 space-y-4 bg-black/60 relative">
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#0084FF]/10 border border-[#0084FF]/20 text-[#60B1FF] text-[8px] font-bold">
                    JOB PREVIEW
                  </div>
                  <div className="flex items-center gap-2">
                    <FileCheckIcon />
                    <div>
                      <h4 className="text-xs font-bold text-white">portrait_ali_001.jpg</h4>
                      <p className="text-[9px] text-white/40 font-mono mt-0.5">Job ID: job-001</p>
                    </div>
                  </div>
                  <div className="h-px bg-white/[0.08]" />
                  <div className="grid grid-cols-2 gap-3 text-[10px] font-medium text-white/60">
                    <div>
                      <span className="block text-white/30 text-[9px] uppercase tracking-wider">AI Model</span>
                      <span className="block text-white font-bold mt-0.5">Zero-DCE Suite</span>
                    </div>
                    <div>
                      <span className="block text-white/30 text-[9px] uppercase tracking-wider">Quality Score</span>
                      <span className="block text-[#4FFFB0] font-bold mt-0.5">94% (Passed)</span>
                    </div>
                    <div>
                      <span className="block text-white/30 text-[9px] uppercase tracking-wider">Face Count</span>
                      <span className="block text-white font-bold mt-0.5">1 Subject</span>
                    </div>
                    <div>
                      <span className="block text-white/30 text-[9px] uppercase tracking-wider">Clustered folder</span>
                      <span className="block text-[#A78BFA] font-bold mt-0.5">Person 001</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── 7. Before/After Showcase Section ──────────────────── */}
        <section className="py-24 max-w-4xl mx-auto px-6 text-center space-y-10">
          <div className="space-y-4">
            <span className="text-xs font-bold text-[#0084FF] tracking-widest uppercase block">Interactive Demo</span>
            <h2 className="text-3xl sm:text-5xl font-medium text-white tracking-tight leading-[1.15]" style={{ fontFamily: "'Instrument Serif', serif" }}>
              See the enhancement difference instantly
            </h2>
            <p className="text-sm text-white/50 font-medium">
              Drag the central divider handle to view real-time shadow recovery.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center text-left">
            <div className="lg:col-span-8">
              <div className="fc-panel p-4">
                <div className="aspect-[16/10] rounded-3xl overflow-hidden relative border border-white/[0.06]">
                  <BeforeAfterSlider
                    beforeSrc="/demo/facecloud-enhancement-demo-original.jpg"
                    afterSrc="/demo/facecloud-enhancement-demo-original.jpg"
                    beforeStyle={{ filter: 'brightness(0.72) contrast(0.88) saturate(0.84)' }}
                    afterStyle={{ filter: 'brightness(1.08) contrast(1.08) saturate(1.03)' }}
                    beforeLabel="BEFORE"
                    afterLabel="AFTER"
                  />
                </div>
              </div>
              <p className="text-[10px] text-white/35 mt-2.5 text-center font-medium">
                Frontend enhancement preview. Production processing uses the FaceCloud AI pipeline.
              </p>
            </div>
            
            <div className="lg:col-span-4 space-y-4">
              <div className="fc-panel p-5 bg-white/[0.02]">
                <h4 className="text-xs font-bold text-white mb-3">AI METADATA PARAMETERS</h4>
                <div className="space-y-3 text-[10px] font-medium text-white/60">
                  <div className="flex justify-between">
                    <span>AI Model:</span>
                    <span className="text-white font-bold font-mono">Zero-DCE (V1)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Brightness check:</span>
                    <span className="text-[#4FFFB0] font-bold">RESTORED (+2.2 EV)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Blur check threshold:</span>
                    <span className="text-[#4FFFB0] font-bold">PASSED (Score 88/100)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Face size validation:</span>
                    <span className="text-[#4FFFB0] font-bold">PASSED (128x128px)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Faces detected:</span>
                    <span className="text-[#4FFFB0] font-bold">1</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dataset payload status:</span>
                    <span className="text-[#60B1FF] font-bold font-mono">ENHANCED & READY</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 8. Upload Modes Section ───────────────────────────── */}
        <section className="py-24 bg-black/40 border-y border-white/[0.05]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16 space-y-4">
              <span className="text-xs font-bold text-[#0084FF] tracking-widest uppercase block">Processing Options</span>
              <h2 className="text-3xl sm:text-5xl font-medium text-white tracking-tight leading-[1.15]" style={{ fontFamily: "'Instrument Serif', serif" }}>
                Upload your way
              </h2>
              <p className="text-sm text-white/50 max-w-xl mx-auto font-medium">
                Choose the upload mechanism that aligns with your active workflow.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: 'Single Image Upload', desc: 'Ingest and enhance one face photo. Performs instant biometric landmark checks.', cta: 'Try Single Upload', link: '/dashboard/upload/single', delay: 0 },
                { title: 'Multiple Images Upload', desc: 'Process multiple face assets in one transaction. Runs parallel Zero-DCE tasks.', cta: 'Try Multiple Upload', link: '/dashboard/upload/multiple', delay: 0.1 },
                { title: 'ZIP Archive Upload', desc: 'Decompress and analyze massive datasets. Extracts person clusters automatically.', cta: 'Try ZIP Upload', link: '/dashboard/upload/zip', delay: 0.2 },
              ].map(card => (
                <motion.div 
                  key={card.title}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: card.delay }}
                  className="fc-panel p-6 flex flex-col justify-between min-h-[190px]"
                >
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-white tracking-tight">{card.title}</h3>
                    <p className="text-[11px] text-white/45 leading-relaxed font-medium">{card.desc}</p>
                  </div>
                  <Link 
                    to={card.link}
                    className="fc-btn-secondary !py-2 !px-4 text-[11px] font-bold w-fit mt-4 flex items-center gap-1.5 hover:border-[#0084FF]/40"
                  >
                    {card.cta} <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 9. Dashboard Preview Section ──────────────────────── */}
        <section className="py-24 max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <span className="text-xs font-bold text-[#0084FF] tracking-widest uppercase block">User Interface</span>
            <h2 className="text-3xl sm:text-5xl font-medium text-white tracking-tight leading-[1.15]" style={{ fontFamily: "'Instrument Serif', serif" }}>
              A complete workspace for users and teams
            </h2>
            <p className="text-sm text-white/50 max-w-xl mx-auto font-medium">
              A high-fidelity layout overview of our active platform screens.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'User Dashboard Preview',
                desc: 'Observe processing counts, track pipeline latency, and access ingestion queues.',
                mock: (
                  <div className="space-y-3 font-mono text-[9px] text-white/50">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded bg-white/[0.04] border border-white/[0.08]">
                        <span className="block text-[8px] text-white/30">TOTAL FILES</span>
                        <span className="block text-white font-bold text-[11px] mt-0.5">142 assets</span>
                      </div>
                      <div className="p-2.5 rounded bg-white/[0.04] border border-white/[0.08]">
                        <span className="block text-[8px] text-white/30">STABILITY</span>
                        <span className="block text-[#4FFFB0] font-bold text-[11px] mt-0.5">99.8%</span>
                      </div>
                    </div>
                    <div className="p-2.5 rounded bg-white/[0.04] border border-white/[0.08] flex items-center justify-between">
                      <span className="truncate">Processing job-002...</span>
                      <span className="text-[#60B1FF] animate-pulse">active</span>
                    </div>
                  </div>
                )
              },
              {
                title: 'Image Detail Preview',
                desc: 'Toggle exposure Restorations, verify blur scores, and check person index maps.',
                mock: (
                  <div className="space-y-2.5 font-mono text-[9px] text-white/50">
                    <div className="h-20 bg-white/[0.03] border border-white/[0.08] rounded-xl flex items-center justify-center relative overflow-hidden">
                      <span className="text-[10px] text-white/30">[Face scanner Active]</span>
                      <div className="absolute inset-x-0 h-0.5 bg-[#4FFFB0]/40 top-1/2 animate-bounce" />
                    </div>
                    <div className="flex justify-between text-[8px] text-white/40 px-1">
                      <span>Landmarks: 68 points</span>
                      <span>Confidence: 99.84%</span>
                    </div>
                  </div>
                )
              },
              {
                title: 'Person Folders Preview',
                desc: 'Verify vector matching confidence scores and cluster similar faces instantly.',
                mock: (
                  <div className="space-y-2 font-mono text-[9px] text-white/50">
                    {[
                      { grp: 'Person Folder 001', pct: '99.2%' },
                      { grp: 'Person Folder 002', pct: '94.8%' },
                    ].map(f => (
                      <div key={f.grp} className="p-2 rounded bg-white/[0.03] border border-white/[0.08] flex justify-between items-center">
                        <span className="text-white font-bold">{f.grp}</span>
                        <span className="text-[#A78BFA]">{f.pct} confidence</span>
                      </div>
                    ))}
                  </div>
                )
              }
            ].map((mockup, index) => (
              <motion.div 
                key={mockup.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="fc-panel p-6 flex flex-col justify-between min-h-[290px] relative group overflow-hidden"
              >
                <div className="space-y-4">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#0084FF]/10 text-[#60B1FF] uppercase w-fit block">{mockup.title}</span>
                  <p className="text-xs text-white/50 leading-relaxed font-medium">{mockup.desc}</p>
                </div>
                
                {/* Browser Frame Mockup */}
                <div className="mt-6 border border-white/[0.08] bg-black/60 rounded-2xl p-4 relative pt-7 flex flex-col justify-end">
                  <div className="absolute top-3 left-4 flex gap-1.5">
                    <span className="w-1.5 h-1.5 bg-[#F87171] rounded-full" />
                    <span className="w-1.5 h-1.5 bg-[#FCD34D] rounded-full" />
                    <span className="w-1.5 h-1.5 bg-[#4FFFB0] rounded-full" />
                  </div>
                  {mockup.mock}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── 10. Admin + Moderator Preview Section ─────────────── */}
        <section className="py-24 bg-black/40 border-y border-white/[0.05]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16 space-y-4">
              <span className="text-xs font-bold text-[#0084FF] tracking-widest uppercase block">Administrative Control</span>
              <h2 className="text-3xl sm:text-5xl font-medium text-white tracking-tight leading-[1.15]" style={{ fontFamily: "'Instrument Serif', serif" }}>
                Control, review, and monitor every workflow
              </h2>
              <p className="text-sm text-white/50 max-w-xl mx-auto font-medium">
                Separate workspaces for dataset administration and manual overrides.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Admin console mockup preview */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="fc-panel p-8 flex flex-col justify-between min-h-[340px]"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-white">
                    <div className="w-8 h-8 rounded-xl bg-[#7B61FF]/15 border border-[#7B61FF]/30 flex items-center justify-center text-[#A78BFA]">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <h3 className="text-lg font-bold tracking-tight">Admin Console</h3>
                  </div>
                  <p className="text-xs text-white/50 leading-relaxed font-medium">
                    Monitor microservice health latency checks, manage API documents, run live playground queries, inspect security audit events, and analyze rejection metrics dashboard grids.
                  </p>
                  
                  {/* Visual list */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-white/40 pt-2">
                    <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#4FFFB0]" /> User Registries</div>
                    <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#4FFFB0]" /> System Health</div>
                    <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#4FFFB0]" /> Upload statistics</div>
                    <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#4FFFB0]" /> Swagger Playgrounds</div>
                  </div>
                </div>

                <Link 
                  to="/admin/login" 
                  className="fc-btn-primary !py-2.5 !px-5 text-xs font-bold w-fit mt-6"
                  style={{ background: 'linear-gradient(135deg, #7B61FF 0%, #0084FF 100%)', color: '#fff', boxShadow: 'none' }}
                >
                  Open Admin Console
                </Link>
              </motion.div>

              {/* Moderator Review mockup preview */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="fc-panel p-8 flex flex-col justify-between min-h-[340px]"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-white">
                    <div className="w-8 h-8 rounded-xl bg-[#4FFFB0]/15 border border-[#4FFFB0]/30 flex items-center justify-center text-[#4FFFB0]">
                      <Eye className="w-4 h-4" />
                    </div>
                    <h3 className="text-lg font-bold tracking-tight">Moderator Review</h3>
                  </div>
                  <p className="text-xs text-white/50 leading-relaxed font-medium">
                    Manually audit failed low-light or blurry images. Override automatic system classifications, re-group mismatched subject clusters, and dispatch notification updates to users.
                  </p>
                  
                  {/* Visual list */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-white/40 pt-2">
                    <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#4FFFB0]" /> Rejected Queue</div>
                    <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#4FFFB0]" /> Override Decider</div>
                    <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#4FFFB0]" /> Subject Re-grouping</div>
                    <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#4FFFB0]" /> Email notifications</div>
                  </div>
                </div>

                <Link 
                  to="/moderator/login" 
                  className="fc-btn-primary !py-2.5 !px-5 text-xs font-bold w-fit mt-6"
                  style={{ background: 'linear-gradient(135deg, #4FFFB0 0%, #0084FF 100%)', color: '#000000', boxShadow: 'none' }}
                >
                  Open Moderator Review
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── 11. Security + Logs Section ──────────────────────── */}
        <section id="security" className="py-24 max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left security points */}
            <div className="lg:col-span-5 space-y-6">
              <span className="text-xs font-bold text-[#0084FF] tracking-widest uppercase block">Enterprise Security</span>
              <h2 className="text-3xl sm:text-5xl font-medium text-white tracking-tight leading-[1.15]" style={{ fontFamily: "'Instrument Serif', serif" }}>
                Built for secure image workflows
              </h2>
              <p className="text-sm text-white/50 leading-relaxed font-medium">
                Strict directory boundary splits and zero-trust identity policies protect all ingested dataset assets.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                {[
                  { title: 'JWT Sessions', desc: 'Secure short-term session tokens.' },
                  { title: 'RBAC boundary',  desc: 'Strict authorization tiers.' },
                  { title: 'User-owned data', desc: 'Zero data persistence option.' },
                  { title: 'Secure Storage',  desc: 'Encrypted buffer repositories.' }
                ].map(pt => (
                  <div key={pt.title} className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
                    <span className="text-xs font-bold text-white block">{pt.title}</span>
                    <span className="text-[10px] text-white/40 block mt-0.5 font-medium">{pt.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right log stream in JetBrains Mono */}
            <div className="lg:col-span-7">
              <div className="fc-panel p-5 bg-black/80 font-mono text-[10px] text-white/60 space-y-4">
                <div className="flex justify-between items-center text-[9px] font-bold text-white/30 border-b border-white/[0.08] pb-2">
                  <span>LIVE FIREWALL SECURITY AUDIT FEED</span>
                  <span className="text-[#4FFFB0] animate-pulse">ONLINE</span>
                </div>
                
                {/* Simulated Log stream */}
                <div className="space-y-2 h-44 overflow-y-auto font-mono text-[9px] leading-relaxed">
                  {logs.map((log, i) => (
                    <div key={i} className="flex gap-2.5 items-start">
                      <span className="text-white/20 select-none">{i + 1}</span>
                      <span className="text-[#60B1FF] flex-shrink-0">➜</span>
                      <span className="text-white/80">{log}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2.5 border-t border-white/[0.08] flex justify-between text-[8px] text-white/30 font-bold">
                  <span>Tripped alerts: 0 logs</span>
                  <span>Compliance score: HIPAA / ISO 27001</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ── 12. Final CTA Section ─────────────────────────────── */}
        <section id="contact" className="py-28 relative overflow-hidden flex flex-col items-center">
          {/* Subtle glowing orb */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-[140px] pointer-events-none opacity-20"
            style={{ background: 'radial-gradient(circle, #0084FF 0%, #7B61FF 100%)' }} />

          <motion.div 
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto px-6 text-center space-y-8 flex flex-col items-center relative z-10"
          >
            <span className="text-xs font-bold text-[#0084FF] tracking-widest uppercase block">Ingestion Suite</span>
            <h2
              className="text-4xl sm:text-6xl font-medium text-white leading-tight tracking-tight"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Ready to enhance, validate, and <br />
              organize facial images with AI?
            </h2>
            <p className="text-xs text-white/50 max-w-md mx-auto leading-relaxed font-medium">
              Start with the user portal or explore the admin console for monitoring and control.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <Link to="/login" className="fc-btn-primary font-bold px-8 py-4 cursor-pointer">Start as User</Link>
              <Link to="/admin/login" className="fc-btn-secondary font-semibold px-8 py-4 cursor-pointer hover:border-[#0084FF]/40">Admin Console</Link>
            </div>
          </motion.div>
        </section>

        {/* ── 13. Footer ────────────────────────────────────────── */}
        <footer className="py-16 bg-[#030508] border-t border-white/[0.06] relative">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10 text-xs text-white/40">
            {/* Logo Column */}
            <div className="space-y-3.5">
              <FaceCloudLogo variant="horizontal" size="sm" href="/" priority={false} />
              <p className="text-[10px] text-white/30 font-medium leading-relaxed">
                Powered by DATAMART / DTM.IO. Advanced facial image organization, quality check, and Zero-DCE restorative node suite.
              </p>
            </div>

            {/* Ingestion Links */}
            <div className="space-y-3">
              <h4 className="font-bold text-white uppercase tracking-wider text-[10px]">Product</h4>
              <ul className="space-y-2 font-medium">
                <li><a href="#features" className="hover:text-[#60B1FF] transition-colors">Features</a></li>
                <li><a href="#methodology" className="hover:text-[#60B1FF] transition-colors">Methodology</a></li>
                <li><a href="#security" className="hover:text-[#60B1FF] transition-colors">Security</a></li>
              </ul>
            </div>

            {/* Portals */}
            <div className="space-y-3">
              <h4 className="font-bold text-white uppercase tracking-wider text-[10px]">Portals</h4>
              <ul className="space-y-2 font-medium">
                <li><Link to="/login" className="hover:text-[#60B1FF] transition-colors">User Login</Link></li>
                <li><Link to="/admin/login" className="hover:text-[#60B1FF] transition-colors">Admin Console</Link></li>
                <li><Link to="/moderator/login" className="hover:text-[#60B1FF] transition-colors">Moderator Review</Link></li>
              </ul>
            </div>

            {/* Copyright */}
            <div className="space-y-3">
              <h4 className="font-bold text-white uppercase tracking-wider text-[10px]">Registry Compliance</h4>
              <p className="text-[10px] text-white/30 leading-relaxed font-medium">
                &copy; {new Date().getFullYear()} FaceCloud. Registered datasets under local Django SQL configurations. All rights reserved.
              </p>
            </div>
          </div>
        </footer>

      </div>
    </div>
  )
}



function FileCheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-[#60B1FF] flex-shrink-0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <polyline points="9 15 11 17 15 13" />
    </svg>
  )
}
