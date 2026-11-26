import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion, useInView } from 'framer-motion'
import {
  Shield, Zap, Check, ArrowUpRight, ArrowRight, Activity, AlertTriangle, FolderOpen,
  Cpu, Eye, Users, BarChart3, Upload, Mail,
  ChevronDown, HardDrive, Image, Briefcase, Building2, Camera, UserCheck,
  Code2, ExternalLink
} from 'lucide-react'
import { BeforeAfterSlider } from '../components/features/BeforeAfterSlider'
import { BackgroundVideo } from '../components/public/BackgroundVideo'
import { PublicNavbar } from '../components/public/PublicNavbar'
import { PublicFooter } from '../components/public/PublicFooter'
import { ExploreLinks } from '../components/public/ExploreLinks'
import { HeroSection } from '../components/public/HeroSection'
import { RevealOnScroll } from '../components/animation/RevealOnScroll'
import { StaggerChildren, StaggerItem } from '../components/animation/StaggerChildren'
import { CountUp } from '../components/animation/CountUp'
import FreedomSection from '../components/landing/FreedomSection'
import GallerySection from '../components/landing/GallerySection'
import MacBookDemoFrame from '../components/landing/MacBookDemoFrame'
import { ScrambleText } from '../components/animation/ScrambleText'

/* ═══════════════════════════════════════════════════════════════════════
   STATIC DATA
   ═══════════════════════════════════════════════════════════════════════ */

const LOGOS = ['DataMart', 'VisionGrid', 'NeuralStack', 'CloudNova', 'OrbitAI']

const PROBLEM_CARDS = [
  { icon: Zap,           title: 'Dark or low-light facial images', desc: 'Under-exposed cameras fail to capture distinct biometric markers.' },
  { icon: AlertTriangle, title: 'Blurry and poor-quality photos',   desc: 'Movement and out-of-focus capture nodes generate invalid details.' },
  { icon: Eye,           title: 'Multiple faces in one image',     desc: 'Single-subject identity systems throw errors on secondary inputs.' },
  { icon: Users,         title: 'Duplicate identity folders',       desc: 'Subject profiles clutter database schemas without similarity indexing.' },
  { icon: FolderOpen,    title: 'Manual sorting and weak tracking', desc: 'Organizations waste valuable developer hours categorizing face sets.' },
]

const USE_CASES = [
  { icon: UserCheck,  title: 'Identity Verification',       desc: 'Automate KYC photo validation with biometric quality checks and real-time face detection.' },
  { icon: Camera,     title: 'Event Photography',           desc: 'Process thousands of event photos, auto-group by person, generate downloadable albums.' },
  { icon: Briefcase,  title: 'HR & Onboarding',             desc: 'Validate employee ID photos against quality standards before archiving to secure storage.' },
  { icon: Building2,  title: 'Enterprise Photo Archives',   desc: 'Organize legacy photo databases with AI-powered face clustering and similarity indexing.' },
]

const TESTIMONIALS = [
  {
    initials: 'J.H.',
    role: 'Lead Architect, DataMart Beta Tester',
    quote: 'Clustering images into person folders has shaved hours off our batch indexing workflow. What used to take days of manual dragging is now automatic.',
  },
  {
    initials: 'S.K.',
    role: 'Systems Engineer, VisionGrid Beta Tester',
    quote: 'The Zero-DCE low-light enhancement is incredibly clean. It recovers facial details in dark event photos that standard algorithms completely wash out.',
  },
  {
    initials: 'T.L.',
    role: 'Fullstack Dev, NeuralStack Beta Tester',
    quote: 'Integrating the REST API took less than an hour. Simple endpoints, clean JWT auth, and the ZIP ingest endpoint works flawlessly.',
  },
]

const PIPELINE_ROWS = [
  { label: 'Original Image Saved',    value: 'portrait_underexposed.png' },
  { label: 'Zero-DCE Enhancement',     value: 'Exposure restored (+2.4 EV)' },
  { label: 'Face Bounds Detection',    value: 'Landmarks validated (1 face)' },
  { label: 'Quality Score Assessment', value: 'Exposure/Blur index: PASS' },
  { label: 'Person Cluster Match',     value: 'Mapped to grp-001 (Confidence 99.2%)' },
]



const FEATURE_GRID = [
  { icon: Zap,           t: 'Zero-DCE Illumination', d: 'Estimates lighting maps without reference curves.' },
  { icon: Upload,        t: 'ZIP Ingest Node',       d: 'Automatically decompresses and processes batches.' },
  { icon: Eye,           t: 'Biometric Scanner',     d: 'Validates facial landmarks and alignment ratios.' },
  { icon: Users,         t: 'Identity Clustering',   d: 'Groups matched records into clean profile directories.' },
  { icon: Shield,        t: 'Secure Cloud Buckets',  d: 'S3 architecture encrypts assets at rest.' },
  { icon: BarChart3,     t: 'Admin Statistics',      d: 'Provides high-level user metrics & performance charts.' },
  { icon: Mail,          t: 'Automated Notifications', d: 'Keeps team members updated on processing progress.' },
  { icon: Activity,      t: 'Cluster Live Diagnostics', d: 'Real-time microservice status indicator.' },
]

const PRICING_PLANS = [
  {
    name: 'Free', priceMonthly: 0, priceYearly: 0,
    storage: '500 MB', uploads: '10 images', highlight: false,
    features: ['Zero-DCE Enhancement', 'Face Detection', 'Basic Quality Checks', 'Single Upload Mode'],
    missing: ['Person Folder Clustering', 'Priority Processing', 'API Access', 'ZIP Upload'],
    cta: 'Get Started', link: '/login',
  },
  {
    name: 'Basic', priceMonthly: 19, priceYearly: 15,
    storage: '10 GB', uploads: '250 images', highlight: false,
    features: ['Zero-DCE Enhancement', 'Face Detection', 'Quality Checks', 'Person Folder Clustering', 'All Upload Modes'],
    missing: ['Priority Processing', 'API Access'],
    cta: 'Upgrade', link: '/login',
  },
  {
    name: 'Pro', priceMonthly: 49, priceYearly: 39,
    storage: '30 GB', uploads: '1,000 images', highlight: true,
    features: ['Zero-DCE Enhancement', 'Face Detection', 'Quality Checks', 'Person Folder Clustering', 'All Upload Modes', 'Priority Processing', 'API Access'],
    missing: [],
    cta: 'Go Pro', link: '/login',
  },
]

const FAQ_ITEMS = [
  { q: 'What image formats are supported?', a: 'FaceCloud accepts JPEG, PNG, and WebP image formats. ZIP archives containing these formats are also supported for batch processing.' },
  { q: 'How is my data secured?', a: 'All uploads are encrypted at rest using AES-256 and in transit via TLS 1.3. JWT-based authentication enforces role-based access control across all API endpoints.' },
  { q: 'Can I delete my data?', a: 'Yes. Users can delete individual images or entire person folders from the dashboard at any time. Deleted data is permanently removed from all storage systems within 24 hours.' },
  { q: 'What happens to rejected images?', a: 'Images that fail quality checks (blur, exposure, or face detection) are flagged for moderator review. Moderators can override rejections or confirm the automated decision.' },
  { q: 'Is there an API for integrations?', a: 'API access for integrations is planned together with paid plans, in a later version. Interactive API documentation is generated from the backend.' },
  { q: 'What are the plan limits?', a: 'Plans, pricing and limits are coming in a later version, so the figures on the pricing cards are not final and are not enforced yet.' },
]

const SECURITY_LOGS_POOL = [
  '[MODEL-DCE] Exposure mapping completed: 94.2% gain',
  '[MODEL-NET] Face detected: Confidence 98.8%',
  '[SYSTEM] Landmark verification: SUCCESS (Landmarks OK)',
  '[MODEL-NET] Generating 512-D embedding representation...',
  '[SYSTEM] Matching cluster… Person Folder "Person 001" matched',
  '[SYSTEM] Saved to AWS storage buffer: grp-001/ali_enhanced.jpg',
  '[SYSTEM] User email notification queued successfully',
  '[FIREWALL] Request rate: 12 req/sec (Safe threshold)',
]

/* ═══════════════════════════════════════════════════════════════════════
   SECTION HEADING COMPONENT
   ═══════════════════════════════════════════════════════════════════════ */

function parseTitle(title: string) {
  const parts: { text: string; highlight: boolean }[] = []
  let current = ''
  let inHighlight = false
  for (let i = 0; i < title.length; i++) {
    const char = title[i]
    if (char === '[') {
      if (current) {
        parts.push({ text: current, highlight: inHighlight })
        current = ''
      }
      inHighlight = true
    } else if (char === ']') {
      if (current) {
        parts.push({ text: current, highlight: inHighlight })
        current = ''
      }
      inHighlight = false
    } else {
      current += char
    }
  }
  if (current) {
    parts.push({ text: current, highlight: inHighlight })
  }
  return parts
}

function SectionHeading({ tag, title, subtitle, titleHtml, num }: {
  tag: string
  title?: string
  subtitle?: string
  titleHtml?: React.ReactNode
  num?: string
}) {
  const parts = title ? parseTitle(title) : []

  return (
    <div className="text-center mb-16 space-y-4">
      {num && (
        <RevealOnScroll>
          <span className="font-silkscreen text-[#F97316] text-[11px] block tracking-widest mb-1">{num}</span>
        </RevealOnScroll>
      )}
      <RevealOnScroll delay={num ? 0.03 : 0}>
        <span className="text-xs font-bold text-[#F97316] tracking-widest uppercase block">{tag}</span>
      </RevealOnScroll>
      <RevealOnScroll delay={num ? 0.06 : 0.03}>
        <h2 className="text-2xl sm:text-4xl font-bold text-ink tracking-tight leading-relaxed font-display">
          {titleHtml || (
            <span>
              {parts.map((p, idx) => (
                p.highlight ? (
                  <span key={idx} className="bg-[#F97316] text-white px-2 py-0.5 inline-block font-bold mx-1">
                    <ScrambleText text={p.text} />
                  </span>
                ) : (
                  <ScrambleText key={idx} text={p.text} />
                )
              ))}
            </span>
          )}
        </h2>
      </RevealOnScroll>
      {subtitle && (
        <RevealOnScroll delay={num ? 0.09 : 0.06}>
          <p className="text-xs sm:text-sm text-ink-mute max-w-xl mx-auto font-medium">{subtitle}</p>
        </RevealOnScroll>
      )}
    </div>
  )
}


/* ═══════════════════════════════════════════════════════════════════════
   MAIN LANDING COMPONENT
   ═══════════════════════════════════════════════════════════════════════ */

export default function Landing() {
  const prefersReduced = useReducedMotion()

  /* ── AI Infrastructure live-loop state ───────────────────────── */
  const [pipelineActiveIdx, setPipelineActiveIdx] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setPipelineActiveIdx(prev => (prev + 1) % PIPELINE_ROWS.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [])



  /* ── Security log animation ─────────────────────────────────── */
  const [logs, setLogs] = useState<string[]>([
    '[SYSTEM] Ingesting zip payload: batch_portraits_2026.zip',
    '[SYSTEM] Validation checksum: SUCCESS (MD5 matches database reference)',
    '[MODEL-DCE] running exposure restoration on frame 014...'
  ])

  useEffect(() => {
    const timer = setInterval(() => {
      setLogs(prev => {
        const nextLog = SECURITY_LOGS_POOL[Math.floor(Math.random() * SECURITY_LOGS_POOL.length)]
        const withNew = [...prev, `[${new Date().toLocaleTimeString()}] ${nextLog}`]
        return withNew.slice(-6)
      })
    }, 2800)
    return () => clearInterval(timer)
  }, [])

  /* ── Before/After slider auto-demo ──────────────────────────── */
  const sliderSectionRef = useRef<HTMLDivElement>(null)
  const sliderInView = useInView(sliderSectionRef, { once: true, amount: 0.4 })
  const [sliderAutoPos, setSliderAutoPos] = useState(0)
  const sliderAutoComplete = useRef(false)

  useEffect(() => {
    if (!sliderInView || sliderAutoComplete.current || prefersReduced) return
    sliderAutoComplete.current = true
    const startTime = performance.now()
    const duration = 1500

    function tick(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setSliderAutoPos(eased * 50)
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [sliderInView, prefersReduced])

  /* ── Pricing toggle ─────────────────────────────────────────── */
  const [yearlyBilling, setYearlyBilling] = useState(false)

  /* ── FAQ accordion ──────────────────────────────────────────── */
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  /* ── Pipeline row status helper ─────────────────────────────── */
  const getPipelineStatus = useCallback((rowIdx: number) => {
    if (rowIdx < pipelineActiveIdx) return 'SUCCESS'
    if (rowIdx === pipelineActiveIdx) return 'ACTIVE'
    return 'PENDING'
  }, [pipelineActiveIdx])



  return (
    <div className="bg-surface-soft text-ink font-sans selection:bg-[#F97316] selection:text-white overflow-x-hidden relative min-h-screen">
      
      <PublicNavbar />

      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[120vh] left-[-20%] w-[60%] h-[50vh] rounded-full blur-[160px]" style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.06) 0%, transparent 70%)' }} />
        <div className="absolute top-[240vh] right-[-20%] w-[50%] h-[50vh] rounded-full blur-[160px]" style={{ background: 'radial-gradient(circle, rgba(234,88,12,0.05) 0%, transparent 70%)' }} />
        <div className="absolute top-[380vh] left-[-10%] w-[60%] h-[50vh] rounded-full blur-[160px]" style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.04) 0%, transparent 70%)' }} />
        <div className="absolute top-[520vh] right-[-15%] w-[50%] h-[40vh] rounded-full blur-[160px]" style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.05) 0%, transparent 70%)' }} />
      </div>

      {/* ══════════════════════════════════════════════════════════
          SECTION 1 — Fullscreen video hero (100vh)
          ══════════════════════════════════════════════════════════ */}
      <main className="fc-hero-main relative min-h-[100svh] h-screen w-full flex flex-col overflow-hidden shrink-0 z-10">
        <BackgroundVideo />
        <HeroSection />
      </main>

      {/* ══════════════════════════════════════════════════════════
          SCROLLABLE SECTIONS BELOW-THE-FOLD
          ══════════════════════════════════════════════════════════ */}
      <div className="relative z-10">

        {/* ── 2. Trusted Logos Marquee ──────────────────────────── */}
        <section className="py-14 border-y border-ink/[0.06] bg-ink/[0.03] relative z-10 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <RevealOnScroll>
              <p className="text-[10px] text-ink-faint font-bold uppercase tracking-[0.25em] mb-7">
                Trusted by AI-driven teams and secure image workflows
              </p>
            </RevealOnScroll>
            <div className="logos-container-mask relative overflow-hidden flex flex-col gap-6 w-full">
              {/* Top Row: Right to Left */}
              <div className="logos-marquee-rtl flex items-center gap-20 w-max">
                {[...LOGOS, ...LOGOS, ...LOGOS, ...LOGOS].map((logo, i) => (
                  <span 
                    key={`logo-rtl-${logo}-${i}`} 
                    className="text-sm font-extrabold tracking-[0.15em] text-ink-faint hover:text-ink-soft transition-all duration-300 select-none cursor-default whitespace-nowrap"
                  >
                    {logo.toUpperCase()}
                  </span>
                ))}
              </div>
              {/* Bottom Row: Left to Right */}
              <div className="logos-marquee-ltr flex items-center gap-20 w-max">
                {[...LOGOS, ...LOGOS, ...LOGOS, ...LOGOS].reverse().map((logo, i) => (
                  <span 
                    key={`logo-ltr-${logo}-${i}`} 
                    className="text-sm font-extrabold tracking-[0.15em] text-ink-faint hover:text-ink-soft transition-all duration-300 select-none cursor-default whitespace-nowrap"
                  >
                    {logo.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 2.5 Stats / Metrics Bar ──────────────────────────── */}
        <section className="py-16 max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { end: 99.2, suffix: '%',   label: 'Detection Accuracy',    decimals: 1 },
              { end: 2,    prefix: '<', suffix: 's', label: 'Avg. Processing Time', decimals: 0 },
              { end: 10000, suffix: '+',  label: 'Images Processed (Testing)', decimals: 0 },
              { end: 3,    suffix: '-role RBAC', label: 'Access Control', decimals: 0 },
            ].map((stat, i) => (
              <RevealOnScroll key={stat.label} delay={i * 0.1}>
                <div className="fc-panel p-5 text-center space-y-2">
                  <div className="text-2xl md:text-3xl font-bold text-ink tracking-tight">
                    <CountUp
                      end={stat.end}
                      suffix={stat.suffix}
                      prefix={stat.prefix}
                      decimals={stat.decimals}
                      duration={2.2}
                    />
                  </div>
                  <p className="text-[10px] text-ink-faint font-bold uppercase tracking-wider">{stat.label}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
          <p className="text-center text-[9px] text-ink-faint mt-4 font-medium">
            Platform capability figures based on internal testing benchmarks
          </p>
        </section>

        {/* ── 2.7 Testimonials / Early Feedback ────────────────── */}
        <section className="py-24 max-w-7xl mx-auto px-6 border-t border-ink/[0.03]">
          <SectionHeading
            num="01"
            tag="Early Access Feedback"
            title="What our [beta testers] are saying"
            subtitle="Real developer and systems architect feedback from our closed preview release."
          />

          <StaggerChildren staggerDelay={0.1} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, idx) => (
              <StaggerItem key={idx}>
                <motion.div
                  whileHover={{ y: -4, borderColor: 'rgba(249,115,22,0.25)' }}
                  transition={{ duration: 0.2 }}
                  className="fc-panel p-6 flex flex-col justify-between h-full relative"
                >
                  <p className="text-[12px] text-ink-soft leading-relaxed italic mb-6">
                    "{t.quote}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F97316]/20 to-[#EA580C]/20 border border-ink/10 flex items-center justify-center text-xs font-bold text-white tracking-wider">
                      {t.initials}
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold text-ink-faint uppercase tracking-wider">{t.role}</h4>
                    </div>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerChildren>
        </section>

        {/* ── 3. Problem Section ────────────────────────────────── */}
        <section className="py-24 max-w-7xl mx-auto px-6">
          <SectionHeading
            num="02"
            tag="The Dataset Challenge"
            title="Facial image workflows [are still too manual]"
            subtitle="Low-quality images, duplicate identities, and manual sorting slow down secure image management."
          />

          <StaggerChildren staggerDelay={0.08} className="grid grid-cols-1 md:grid-cols-5 gap-5">
            {PROBLEM_CARDS.map((card) => (
              <StaggerItem key={card.title}>
                <motion.div
                  whileHover={{ y: -4, borderColor: 'rgba(249,115,22,0.3)' }}
                  transition={{ duration: 0.2 }}
                  className="fc-panel p-6 flex flex-col justify-between relative group h-full"
                >
                  <div 
                    className="absolute -top-4 -left-4 w-16 h-16 rounded-full blur-[20px] opacity-10 group-hover:opacity-20 transition-opacity"
                    style={{ background: 'radial-gradient(circle, #4FFFB0 0%, transparent 70%)' }}
                  />
                  <motion.div
                    initial={{ scale: 0.7 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.15 }}
                    className="w-10 h-10 rounded-2xl flex items-center justify-center bg-ink/[0.04] border border-ink/[0.08] text-[var(--s-ok)] mb-5"
                  >
                    <card.icon className="w-4 h-4" />
                  </motion.div>
                  <div className="space-y-2 mt-4">
                    <h3 className="text-xs font-bold text-ink tracking-tight">{card.title}</h3>
                    <p className="text-[11px] text-ink-faint leading-relaxed font-medium">{card.desc}</p>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerChildren>
        </section>

        {/* ── 3.5 Use Cases / Who It's For ─────────────────────── */}
        <section className="py-24 bg-ink/[0.03] border-y border-ink/[0.05]">
          <div className="max-w-7xl mx-auto px-6">
            <SectionHeading
              num="03"
              tag="Who It's For"
              title="Built for teams that [depend on face data]"
              subtitle="From identity verification to enterprise photo management — FaceCloud replaces fragmented manual workflows."
            />

            <StaggerChildren staggerDelay={0.1} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {USE_CASES.map((uc) => (
                <StaggerItem key={uc.title}>
                  <motion.div
                    whileHover={{ y: -4, borderColor: 'rgba(249, 115, 22,0.3)' }}
                    transition={{ duration: 0.2 }}
                    className="fc-panel p-6 flex flex-col gap-4 h-full"
                  >
                    <motion.div
                      initial={{ scale: 0.7 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
                      className="w-10 h-10 rounded-2xl flex items-center justify-center bg-[#F97316]/10 border border-[#F97316]/20 text-[#FB923C]"
                    >
                      <uc.icon className="w-4 h-4" />
                    </motion.div>
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-ink tracking-tight">{uc.title}</h3>
                      <p className="text-[11px] text-ink-faint leading-relaxed font-medium">{uc.desc}</p>
                    </div>
                  </motion.div>
                </StaggerItem>
              ))}
            </StaggerChildren>
          </div>
        </section>

        {/* ── 4. AI Solution Section (Live-loop pipeline) ──────── */}
        <section className="py-24 relative">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Info Columns */}
            <div className="lg:col-span-5 space-y-6">
              <RevealOnScroll>
                <span className="font-silkscreen text-[#F97316] text-[11px] block tracking-widest mb-1">04</span>
                <span className="text-xs font-bold text-[#F97316] tracking-widest uppercase block">AI Infrastructure</span>
              </RevealOnScroll>
              <RevealOnScroll delay={0.05}>
                <h2 className="text-2xl sm:text-4xl font-bold text-ink leading-relaxed font-display">
                  <ScrambleText text="FaceCloud turns raw uploads " /> <br />
                  <span className="bg-[#F97316] text-white px-2 py-0.5 inline-block font-bold">
                    <ScrambleText text="into organized AI-ready folders" />
                  </span>
                </h2>
              </RevealOnScroll>
              <RevealOnScroll delay={0.1}>
                <p className="text-sm text-ink-mute leading-relaxed font-medium">
                  We automate exposure curves, crop structures, biometric validation, and identity matching parameters under a zero-trust compliance model.
                </p>
              </RevealOnScroll>
              
              <div className="space-y-3 pt-4 text-xs font-bold text-ink-mute">
                {[
                  { title: 'Zero-DCE enhancement', desc: 'Estimates lighting maps on underexposed faces.' },
                  { title: 'Face validation',     desc: 'Ensures only one subject is present in the frame.' },
                  { title: 'Quality scoring',     desc: 'Flags blurry or low-resolution face sets.' },
                  { title: 'Identity grouping',   desc: 'Maps 512-D vectors directly into clusters.' }
                ].map((spec, i) => (
                  <RevealOnScroll key={spec.title} delay={0.15 + i * 0.08} direction="left">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-lg bg-[var(--s-ok)]/15 border border-[var(--s-ok)]/25 flex items-center justify-center text-[var(--s-ok)] mt-0.5">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-ink block font-bold">{spec.title}</span>
                        <span className="text-[10px] text-ink-faint block font-medium mt-0.5">{spec.desc}</span>
                      </div>
                    </div>
                  </RevealOnScroll>
                ))}
              </div>
            </div>

            {/* Right animated pipeline panel */}
            <div className="lg:col-span-7">
              <RevealOnScroll direction="right">
                <div className="fc-panel p-6 relative overflow-hidden">
                  <div className="flex justify-between items-center pb-4 border-b border-ink/[0.08] mb-6">
                    <span className="text-[10px] font-bold text-ink-faint uppercase tracking-widest">Active AI Restructuring</span>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#F97316]/20 text-[#FB923C] font-bold">PIPELINE: ACTIVE</span>
                  </div>

                  <div className="space-y-4">
                    {PIPELINE_ROWS.map((proc, index) => {
                      const status = getPipelineStatus(index)
                      return (
                        <div 
                          key={proc.label} 
                          className="p-3.5 rounded-2xl bg-ink/[0.02] border border-ink/[0.06] flex items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center bg-ink/[0.04] text-xs font-mono font-bold text-ink-faint">
                              {index + 1}
                            </div>
                            <div>
                              <p className="text-[11px] font-bold text-ink">{proc.label}</p>
                              <p className="text-[10px] text-ink-faint font-medium mt-0.5">{proc.value}</p>
                            </div>
                          </div>
                          <AnimatePresence mode="wait">
                            <motion.span
                              key={`${index}-${status}`}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              transition={{ duration: 0.25 }}
                              className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                status === 'SUCCESS' ? 'bg-[var(--s-ok)]/15 text-[var(--s-ok)]' :
                                status === 'ACTIVE' ? 'bg-[#F97316]/20 text-[#FB923C] animate-pulse' :
                                'bg-ink/5 text-ink-faint'
                              }`}
                            >
                              {status}
                            </motion.span>
                          </AnimatePresence>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </RevealOnScroll>
            </div>
          </div>
        </section>

        {/* ── 5. Features Grid Section ──────────────────────────── */}
        <section id="features" className="py-24 max-w-7xl mx-auto px-6">
          <SectionHeading
            num="05"
            tag="Ingestion Suite"
            title="Everything needed for [AI facial image processing]"
            subtitle="12 specialized components engineered for rapid asset enhancement, sorting, and monitoring."
          />

          <StaggerChildren staggerDelay={0.06} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURE_GRID.map((feat) => (
              <StaggerItem key={feat.t}>
                <motion.div
                  whileHover={{ y: -3, borderColor: 'rgba(249, 115, 22,0.3)' }}
                  transition={{ duration: 0.2 }}
                  className="fc-panel p-6 flex flex-col justify-between min-h-[170px]"
                >
                  <motion.div
                    initial={{ scale: 0.7, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
                  >
                    <feat.icon className="w-5 h-5 text-[#FB923C]" />
                  </motion.div>
                  <div className="mt-6 space-y-1">
                    <h3 className="text-xs font-bold text-ink tracking-tight">{feat.t}</h3>
                    <p className="text-[10px] text-ink-mute leading-relaxed font-medium">{feat.d}</p>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerChildren>
        </section>

        {/* ── 6. Methodology / Pipeline Section ─────────────────── */}
        <FreedomSection />

        {/* ── 7. Before/After Showcase Section ──────────────────── */}
        <section ref={sliderSectionRef} className="py-24 max-w-6xl mx-auto px-6 text-center space-y-10">
          <SectionHeading
            num="06"
            tag="Interactive Demo"
            title="See the [enhancement difference] instantly"
            subtitle="Drag the central divider handle to view real-time shadow recovery."
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center text-left">
            <div className="lg:col-span-8">
              <RevealOnScroll>
                <MacBookDemoFrame>
                  <BeforeAfterSlider
                    beforeSrc="/demo/facecloud-enhancement-demo-original.jpg"
                    afterSrc="/demo/facecloud-enhancement-demo-original.jpg"
                    beforeStyle={{ filter: 'brightness(0.72) contrast(0.88) saturate(0.84)' }}
                    afterStyle={{ filter: 'brightness(1.08) contrast(1.08) saturate(1.03)' }}
                    beforeLabel="BEFORE"
                    afterLabel="AFTER"
                    initialPosition={sliderAutoPos}
                  />
                </MacBookDemoFrame>
              </RevealOnScroll>
              <p className="text-[10px] text-ink-faint mt-6 text-center font-medium">
                Frontend enhancement preview. Production processing uses the FaceCloud AI pipeline.
              </p>
            </div>
            
            <div className="lg:col-span-4 space-y-4">
              <RevealOnScroll direction="right" delay={0.15}>
                <div className="fc-panel p-5 bg-ink/[0.02]">
                  <h4 className="text-xs font-bold text-ink mb-3">AI METADATA PARAMETERS</h4>
                  <div className="space-y-3 text-[10px] font-medium text-ink-mute">
                    <div className="flex justify-between">
                      <span>AI Model:</span>
                      <span className="text-ink font-bold font-mono">Zero-DCE (V1)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Brightness check:</span>
                      <span className="text-[var(--s-ok)] font-bold">RESTORED (+2.2 EV)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Blur check threshold:</span>
                      <span className="text-[var(--s-ok)] font-bold">PASSED (Score 88/100)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Face size validation:</span>
                      <span className="text-[var(--s-ok)] font-bold">PASSED (128x128px)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Faces detected:</span>
                      <span className="text-[var(--s-ok)] font-bold">1</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dataset payload status:</span>
                      <span className="text-[#FB923C] font-bold font-mono">ENHANCED & READY</span>
                    </div>
                  </div>
                </div>
              </RevealOnScroll>
            </div>
          </div>
        </section>

        {/* ── 7b. Gallery ───────────────────────────────────────── */}
        <GallerySection />

        {/* ── 8. Upload Modes Section ───────────────────────────── */}
        <section className="py-24 bg-ink/[0.03] border-y border-ink/[0.05]">
          <div className="max-w-7xl mx-auto px-6">
            <SectionHeading
              num="07"
              tag="Processing Options"
              title="Upload [your way]"
              subtitle="Choose the upload mechanism that aligns with your active workflow."
            />

            <StaggerChildren staggerDelay={0.1} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: 'Single Image Upload', desc: 'Ingest and enhance one face photo. Performs instant biometric landmark checks.', cta: 'Try Single Upload', link: '/dashboard/upload/single', icon: Image },
                { title: 'Multiple Images Upload', desc: 'Process multiple face assets in one transaction. Runs parallel Zero-DCE tasks.', cta: 'Try Multiple Upload', link: '/dashboard/upload/multiple', icon: Upload },
                { title: 'ZIP Archive Upload', desc: 'Decompress and analyze massive datasets. Extracts person clusters automatically.', cta: 'Try ZIP Upload', link: '/dashboard/upload/zip', icon: FolderOpen },
              ].map(card => (
                <StaggerItem key={card.title}>
                  <motion.div
                    whileHover={{ y: -4, borderColor: 'rgba(249, 115, 22,0.3)' }}
                    transition={{ duration: 0.2 }}
                    className="fc-panel p-6 flex flex-col justify-between min-h-[190px]"
                  >
                    <div className="space-y-2">
                      <h3 className="text-sm font-bold text-ink tracking-tight">{card.title}</h3>
                      <p className="text-[11px] text-ink-mute leading-relaxed font-medium">{card.desc}</p>
                    </div>
                    <Link 
                      to={card.link}
                      className="fc-btn-secondary !py-2 !px-4 text-[11px] font-bold w-fit mt-4 flex items-center gap-1.5 hover:border-[#F97316]/40"
                    >
                      {card.cta} <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </motion.div>
                </StaggerItem>
              ))}
            </StaggerChildren>
          </div>
        </section>

        {/* ── 8.5 Pricing Section ──────────────────────────────── */}
        <section id="pricing" className="py-24 max-w-5xl mx-auto px-6">
          <SectionHeading
            num="08"
            tag="Pricing"
            title="Simple, [transparent pricing]"
            subtitle="Start free. Scale when you need to."
          />

          {/* Monthly / Yearly Toggle */}
          <RevealOnScroll>
            <div className="flex items-center justify-center gap-3 mb-12">
              <span className={`text-sm font-medium transition-colors ${!yearlyBilling ? 'text-ink' : 'text-ink-faint'}`}>Monthly</span>
              <button
                onClick={() => setYearlyBilling(v => !v)}
                className="relative w-14 h-7 rounded-full bg-ink/[0.08] border border-ink/[0.12] cursor-pointer transition-colors hover:border-ink/20"
                aria-label="Toggle billing period"
              >
                <motion.div
                  layout
                  className="absolute top-0.5 w-6 h-6 rounded-full bg-gradient-to-r from-[#F97316] to-[#FB923C] shadow-[0_2px_8px_rgba(249,115,22,0.5)]"
                  style={{ left: yearlyBilling ? '30px' : '2px' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
              <span className={`text-sm font-medium transition-colors ${yearlyBilling ? 'text-ink' : 'text-ink-faint'}`}>
                Yearly <span className="text-[var(--s-ok)] text-xs font-bold">Save 20%</span>
              </span>
            </div>
          </RevealOnScroll>

          <StaggerChildren staggerDelay={0.12} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PRICING_PLANS.map(plan => {
              const price = yearlyBilling ? plan.priceYearly : plan.priceMonthly
              return (
                <StaggerItem key={plan.name}>
                  <div className={`fc-panel p-6 flex flex-col h-full relative ${
                    plan.highlight ? 'ring-2 ring-[#F97316]/50 border-[#F97316]/40' : ''
                  }`}>
                    <div className="space-y-4 mb-6">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-lg font-bold text-ink">{plan.name}</h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-[#F97316]/10 border border-[#F97316]/30 text-[9px] font-bold text-[#FB923C] uppercase tracking-wider">
                          Coming soon
                        </span>
                      </div>
                      <div className="flex items-end gap-1">
                        <span className="text-4xl font-bold text-ink tracking-tight">${price}</span>
                        {price > 0 && <span className="text-sm text-ink-faint font-medium pb-1">/mo</span>}
                      </div>
                      <div className="flex items-center gap-4 text-[10px] font-medium text-ink-mute">
                        <span className="flex items-center gap-1"><HardDrive className="w-3 h-3" /> {plan.storage}</span>
                        <span className="flex items-center gap-1"><Image className="w-3 h-3" /> {plan.uploads}/mo</span>
                      </div>
                    </div>

                    <div className="h-px bg-ink/[0.08] mb-4" />

                    <div className="space-y-2.5 flex-1">
                      {plan.features.map(f => (
                        <div key={f} className="flex items-center gap-2 text-[11px] text-ink-soft font-medium">
                          <Check className="w-3.5 h-3.5 text-[var(--s-ok)] flex-shrink-0" />
                          {f}
                        </div>
                      ))}
                      {plan.missing.map(f => (
                        <div key={f} className="flex items-center gap-2 text-[11px] text-ink-faint font-medium">
                          <span className="w-3.5 h-3.5 flex items-center justify-center text-ink-faint flex-shrink-0">—</span>
                          {f}
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      disabled
                      aria-label={`${plan.name} plan, coming soon`}
                      className="mt-6 text-center text-sm font-bold py-3 rounded-2xl block w-full bg-ink/[0.04] border border-ink/[0.08] text-ink-faint cursor-not-allowed"
                    >
                      Coming soon
                    </button>
                  </div>
                </StaggerItem>
              )
            })}
          </StaggerChildren>

          <RevealOnScroll delay={0.3}>
            <p className="text-center text-xs text-ink-faint mt-8 font-medium">
              Plans and pricing are coming in a later version. Need a custom enterprise plan?{' '}
              <a href="#contact" className="text-[#FB923C] hover:text-ink transition-colors underline underline-offset-2">Contact us</a>.
            </p>
          </RevealOnScroll>
        </section>

        {/* ── 9. Dashboard Preview Section ──────────────────────── */}
        <section className="py-24 bg-ink/[0.03] border-y border-ink/[0.05]">
          <div className="max-w-7xl mx-auto px-6">
            <SectionHeading
              num="09"
              tag="User Interface"
              title="A complete workspace for [users and teams]"
              subtitle="A high-fidelity layout overview of our active platform screens."
            />

            <StaggerChildren staggerDelay={0.1} className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: 'User Dashboard Preview',
                  desc: 'Observe processing counts, track pipeline latency, and access ingestion queues.',
                  mock: (
                    <div className="space-y-3 font-mono text-[9px] text-ink-mute">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2.5 rounded bg-ink/[0.04] border border-ink/[0.08]">
                          <span className="block text-[8px] text-ink-faint">TOTAL FILES</span>
                          <span className="block text-ink font-bold text-[11px] mt-0.5">142 assets</span>
                        </div>
                        <div className="p-2.5 rounded bg-ink/[0.04] border border-ink/[0.08]">
                          <span className="block text-[8px] text-ink-faint">STABILITY</span>
                          <span className="block text-[var(--s-ok)] font-bold text-[11px] mt-0.5">99.8%</span>
                        </div>
                      </div>
                      <div className="p-2.5 rounded bg-ink/[0.04] border border-ink/[0.08] flex items-center justify-between">
                        <span className="truncate">Processing job-002...</span>
                        <span className="text-[#FB923C] animate-pulse">active</span>
                      </div>
                    </div>
                  )
                },
                {
                  title: 'Image Detail Preview',
                  desc: 'Toggle exposure Restorations, verify blur scores, and check person index maps.',
                  mock: (
                    <div className="space-y-2.5 font-mono text-[9px] text-ink-mute">
                      <div className="h-20 bg-ink/[0.03] border border-ink/[0.08] rounded-xl flex items-center justify-center relative overflow-hidden">
                        <span className="text-[10px] text-ink-faint">[Face scanner Active]</span>
                        <div className="absolute inset-x-0 h-0.5 bg-[var(--s-ok)]/40 top-1/2 animate-bounce" />
                      </div>
                      <div className="flex justify-between text-[8px] text-ink-faint px-1">
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
                    <div className="space-y-2 font-mono text-[9px] text-ink-mute">
                      {[
                        { grp: 'Person Folder 001', pct: '99.2%' },
                        { grp: 'Person Folder 002', pct: '94.8%' },
                      ].map(f => (
                        <div key={f.grp} className="p-2 rounded bg-ink/[0.03] border border-ink/[0.08] flex justify-between items-center">
                          <span className="text-ink font-bold">{f.grp}</span>
                          <span className="text-[#A78BFA]">{f.pct} confidence</span>
                        </div>
                      ))}
                    </div>
                  )
                }
              ].map((mockup) => (
                <StaggerItem key={mockup.title}>
                  <div className="fc-panel p-6 flex flex-col justify-between min-h-[290px] relative group overflow-hidden">
                    <div className="space-y-4">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#F97316]/10 text-[#FB923C] uppercase w-fit block">{mockup.title}</span>
                      <p className="text-xs text-ink-mute leading-relaxed font-medium">{mockup.desc}</p>
                    </div>
                    
                    {/* Browser Frame Mockup */}
                    <div className="mt-6 border border-ink/[0.08] bg-ink/[0.04] rounded-2xl p-4 relative pt-7 flex flex-col justify-end">
                      <div className="absolute top-3 left-4 flex gap-1.5">
                        <span className="w-1.5 h-1.5 bg-[#F87171] rounded-full" />
                        <span className="w-1.5 h-1.5 bg-[#FCD34D] rounded-full" />
                        <span className="w-1.5 h-1.5 bg-[var(--s-ok)] rounded-full" />
                      </div>
                      {mockup.mock}
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerChildren>
          </div>
        </section>

        {/* ── 10. Admin + Moderator Preview Section ─────────────── */}
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-6">
            <SectionHeading
              num="10"
              tag="Administrative Control"
              title="Control, review, and [monitor every workflow]"
              subtitle="Separate workspaces for dataset administration and manual overrides."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Admin console and Moderator Review share one height: the grid row
                  stretches both wrappers, h-full makes the card fill its wrapper,
                  and both use the same min-height. Previously 340px against 300px
                  with no h-full, so the two cards were never the same size. */}
              <RevealOnScroll direction="left" className="h-full">
                <motion.div
                  whileHover={{ y: -4, borderColor: 'rgba(234, 88, 12,0.4)', boxShadow: '0 0 40px rgba(234, 88, 12,0.15)' }}
                  transition={{ duration: 0.25 }}
                  className="fc-panel p-8 flex flex-col justify-between h-full min-h-[320px]"
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-ink">
                      <div className="w-8 h-8 rounded-xl bg-[#EA580C]/15 border border-[#EA580C]/30 flex items-center justify-center text-[#A78BFA]">
                        <Cpu className="w-4 h-4" />
                      </div>
                      <h3 className="text-lg font-bold tracking-tight">Admin Console</h3>
                    </div>
                    <p className="text-xs text-ink-mute leading-relaxed font-medium">
                      Monitor microservice health latency checks, manage API documents, run live playground queries, inspect security audit events, and analyze rejection metrics dashboard grids.
                    </p>
                    
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-ink-faint pt-2">
                      <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[var(--s-ok)]" /> User Registries</div>
                      <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[var(--s-ok)]" /> System Health</div>
                      <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[var(--s-ok)]" /> Upload statistics</div>
                      <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[var(--s-ok)]" /> Swagger Playgrounds</div>
                    </div>
                  </div>
                </motion.div>
              </RevealOnScroll>

              {/* Moderator Review */}
              <RevealOnScroll direction="right" className="h-full">
                <motion.div
                  whileHover={{ y: -4, borderColor: 'rgba(79,255,176,0.35)', boxShadow: '0 0 40px rgba(79,255,176,0.12)' }}
                  transition={{ duration: 0.25 }}
                  className="fc-panel p-8 flex flex-col justify-between h-full min-h-[320px]"
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-ink">
                      <div className="w-8 h-8 rounded-xl bg-[var(--s-ok)]/15 border border-[var(--s-ok)]/30 flex items-center justify-center text-[var(--s-ok)]">
                        <Eye className="w-4 h-4" />
                      </div>
                      <h3 className="text-lg font-bold tracking-tight">Moderator Review</h3>
                    </div>
                    <p className="text-xs text-ink-mute leading-relaxed font-medium">
                      Manually audit failed low-light or blurry images. Override automatic system classifications, re-group mismatched subject clusters, and dispatch notification updates to users.
                    </p>
                    
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-ink-faint pt-2">
                      <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[var(--s-ok)]" /> Rejected Queue</div>
                      <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[var(--s-ok)]" /> Override Decider</div>
                      <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[var(--s-ok)]" /> Subject Re-grouping</div>
                      <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[var(--s-ok)]" /> Email notifications</div>
                    </div>

                    <Link
                      to="/roles/moderator"
                      className="inline-flex items-center gap-1.5 pt-2 text-[11px] font-bold text-[#FB923C] hover:underline"
                    >
                      How the moderator role works <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </motion.div>
              </RevealOnScroll>
            </div>
          </div>
        </section>

        {/* ── 11. Security + Logs Section ──────────────────────── */}
        <section id="security" className="py-24 bg-ink/[0.03] border-y border-ink/[0.05]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Left security points */}
              <div className="lg:col-span-5 space-y-6">
                <RevealOnScroll>
                  <span className="font-silkscreen text-[#F97316] text-[11px] block tracking-widest mb-1">11</span>
                  <span className="text-xs font-bold text-[#F97316] tracking-widest uppercase block">Enterprise Security</span>
                </RevealOnScroll>
                <RevealOnScroll delay={0.05}>
                  <h2 className="text-2xl sm:text-4xl font-bold text-ink tracking-tight leading-relaxed font-display">
                    <ScrambleText text="Built for secure " /> <br />
                    <span className="bg-[#F97316] text-white px-2 py-0.5 inline-block font-bold">
                      <ScrambleText text="image workflows" />
                    </span>
                  </h2>
                </RevealOnScroll>
                <RevealOnScroll delay={0.1}>
                  <p className="text-sm text-ink-mute leading-relaxed font-medium">
                    Strict directory boundary splits and zero-trust identity policies protect all ingested dataset assets.
                  </p>
                </RevealOnScroll>
                
                <StaggerChildren staggerDelay={0.08} className="grid grid-cols-2 gap-4">
                  {[
                    { title: 'JWT Sessions', desc: 'Secure short-term session tokens.' },
                    { title: 'RBAC boundary',  desc: 'Strict authorization tiers.' },
                    { title: 'User-owned data', desc: 'Zero data persistence option.' },
                    { title: 'Secure Storage',  desc: 'Encrypted buffer repositories.' }
                  ].map(pt => (
                    <StaggerItem key={pt.title}>
                      <div className="p-3 bg-ink/[0.02] border border-ink/[0.06] rounded-2xl">
                        <span className="text-xs font-bold text-ink block">{pt.title}</span>
                        <span className="text-[10px] text-ink-faint block mt-0.5 font-medium">{pt.desc}</span>
                      </div>
                    </StaggerItem>
                  ))}
                </StaggerChildren>
              </div>

              {/* Right log stream with typewriter effect */}
              <div className="lg:col-span-7">
                <RevealOnScroll direction="right">
                  <div className="on-dark fc-panel p-5 bg-black/80 font-mono text-[10px] text-ink-mute space-y-4">
                    <div className="flex justify-between items-center text-[9px] font-bold text-ink-faint border-b border-ink/[0.08] pb-2">
                      <span>LIVE FIREWALL SECURITY AUDIT FEED</span>
                      <span className="text-[var(--s-ok)] animate-pulse">ONLINE</span>
                    </div>
                    
                    <div className="space-y-2 h-44 overflow-y-auto font-mono text-[9px] leading-relaxed">
                      {logs.map((log, i) => (
                        <motion.div
                          key={`${i}-${log}`}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: i === logs.length - 1 ? [0, 0.5, 1] : 1, y: 0 }}
                          transition={{ duration: 0.4 }}
                          className="flex gap-2.5 items-start"
                        >
                          <span className="text-ink-faint select-none">{i + 1}</span>
                          <span className="text-[#FB923C] flex-shrink-0">➜</span>
                          <span className={i === logs.length - 1 ? 'text-ink' : 'text-ink-soft'}>{log}</span>
                        </motion.div>
                      ))}
                    </div>

                    <div className="pt-2.5 border-t border-ink/[0.08] flex justify-between text-[8px] text-ink-faint font-bold">
                      <span>Tripped alerts: 0 logs</span>
                      <span>Compliance score: HIPAA / ISO 27001</span>
                    </div>
                  </div>
                </RevealOnScroll>
              </div>

            </div>
          </div>
        </section>

        {/* ── 11.5 FAQ Section ─────────────────────────────────── */}
        <section id="faq" className="py-24 max-w-3xl mx-auto px-6">
          <SectionHeading
            num="12"
            tag="FAQ"
            title="Frequently [asked questions]"
            subtitle="Everything you need to know about using FaceCloud."
          />

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, idx) => (
              <RevealOnScroll key={idx} delay={idx * 0.05}>
                <div className="fc-panel overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full flex items-center justify-between p-5 text-left cursor-pointer group"
                  >
                    <span className="text-sm font-bold text-ink group-hover:text-[#FB923C] transition-colors pr-4">{item.q}</span>
                    <motion.div
                      animate={{ rotate: openFaq === idx ? 180 : 0 }}
                      transition={{ duration: 0.25 }}
                      className="flex-shrink-0"
                    >
                      <ChevronDown className="w-4 h-4 text-ink-faint" />
                    </motion.div>
                  </button>
                  <AnimatePresence initial={false}>
                    {openFaq === idx && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 text-xs text-ink-mute leading-relaxed font-medium border-t border-ink/[0.06] pt-4">
                          {item.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </section>

        {/* ── 11.7 API / Integrations Teaser ───────────────────── */}
        <section className="py-24 bg-ink/[0.03] border-y border-ink/[0.05]">
          <div className="max-w-4xl mx-auto px-6">
            <SectionHeading
              num="13"
              tag="Integrations"
              title="Built [to integrate]"
              subtitle="Connect your applications directly to the FaceCloud processing pipeline."
            />

            <RevealOnScroll>
              <div className="on-dark fc-panel p-6 bg-black/80 font-mono text-[10px] relative overflow-hidden">
                <div className="flex items-center justify-between pb-3 border-b border-ink/[0.08] mb-4">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-[#FB923C]" />
                    <span className="text-[10px] font-bold text-ink-faint uppercase tracking-widest">API Request Example</span>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[var(--s-ok)]/15 text-[var(--s-ok)] font-bold">REST</span>
                </div>

                <div className="space-y-1 text-[10px] leading-relaxed">
                  <div><span className="text-[#A78BFA]">POST</span> <span className="text-[#FB923C]">/api/v1/images/enhance</span></div>
                  <div className="text-ink-faint">Content-Type: multipart/form-data</div>
                  <div className="text-ink-faint">Authorization: Bearer {'<'}your_jwt_token{'>'}</div>
                  <div className="mt-3 text-ink-faint">{'{'}</div>
                  <div className="pl-4"><span className="text-[var(--s-ok)]">"file"</span>: <span className="text-ink-mute">"portrait_001.jpg"</span>,</div>
                  <div className="pl-4"><span className="text-[var(--s-ok)]">"enhance"</span>: <span className="text-[#A78BFA]">true</span>,</div>
                  <div className="pl-4"><span className="text-[var(--s-ok)]">"detect_faces"</span>: <span className="text-[#A78BFA]">true</span>,</div>
                  <div className="pl-4"><span className="text-[var(--s-ok)]">"auto_cluster"</span>: <span className="text-[#A78BFA]">true</span></div>
                  <div className="text-ink-faint">{'}'}</div>
                </div>

                <div className="mt-6 pt-4 border-t border-ink/[0.08] flex items-center justify-between">
                  <p className="text-[10px] text-ink-faint font-medium">API documentation is generated from the backend; API access for integrations is planned for a later version.</p>
                  <Link to="/docs" className="flex items-center gap-1.5 text-[11px] font-bold text-[#FB923C] hover:text-ink transition-colors">
                    View API Docs <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </section>

        {/* ── 12. Final CTA Section ─────────────────────────────── */}
        <section id="contact" className="py-28 relative overflow-hidden flex flex-col items-center">
          {/* Subtle glowing orb */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-[140px] pointer-events-none opacity-20"
            style={{ background: 'radial-gradient(circle, #F97316 0%, #EA580C 100%)' }} />

          <RevealOnScroll>
            <div className="max-w-4xl mx-auto px-6 text-center space-y-8 flex flex-col items-center relative z-10">
              <span className="text-xs font-bold text-[#F97316] tracking-widest uppercase block">Ingestion Suite</span>
              <h2 className="text-3xl sm:text-5xl font-bold text-ink leading-tight tracking-tight font-display">
                Ready to enhance, validate, and <br />
                organize facial images <span className="bg-[#F97316] text-white px-2 py-0.5 inline-block font-bold">with AI?</span>
              </h2>
              <p className="text-xs text-ink-mute max-w-md mx-auto leading-relaxed font-medium">
                Start with the user portal to enhance and organize your facial image datasets.
              </p>
              <div className="flex flex-wrap justify-center gap-4 pt-4">
                <Link to="/login" className="fc-btn-primary font-bold px-8 py-4 cursor-pointer">Start as User</Link>
              </div>
            </div>
          </RevealOnScroll>
        </section>

        {/* ── 13. Footer ────────────────────────────────────────── */}
        {/* ── 13. Footer ────────────────────────────────────────── */}
        <ExploreLinks current="/" />
        <PublicFooter />

      </div>
    </div>
  )
}



