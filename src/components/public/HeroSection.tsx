import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ArrowRight, Check, Zap, Shield, Users, Download } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ScrambleText } from '../animation/ScrambleText'

const SUBMITTED_TEXT = "You're on the list — we'll be in touch."

const STATS = [
  { icon: Zap,      label: 'Zero-DCE Enhancement' },
  { icon: Shield,   label: 'Std Face Validation' },
  { icon: Users,    label: 'Person Folder Matching' },
  { icon: Download, label: 'Secure ZIP + Report' },
]

export function HeroSection() {
  const [email, setEmail]           = useState('')
  const [submitted, setSubmitted]   = useState(false)
  const prefersReduced              = useReducedMotion()
  const resetTimeoutRef             = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current)
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setSubmitted(true)
    resetTimeoutRef.current = setTimeout(() => {
      setEmail('')
      setSubmitted(false)
    }, 4000)
  }

  const stagger = prefersReduced ? 0 : 0.12

  return (
    <div className="relative flex-1 flex flex-col items-center justify-center px-6 pb-8">
      {/* ── Decorative drifting swirl ─────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <svg
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-[0.05] hero-drift"
          viewBox="0 0 800 800"
          fill="none"
        >
          <circle cx="400" cy="400" r="300" stroke="url(#swirl-grad)" strokeWidth="1.5" strokeDasharray="12 8" />
          <circle cx="400" cy="400" r="220" stroke="url(#swirl-grad)" strokeWidth="1" strokeDasharray="8 12" />
          <circle cx="400" cy="400" r="140" stroke="url(#swirl-grad)" strokeWidth="0.8" strokeDasharray="6 10" />
          <ellipse cx="400" cy="400" rx="360" ry="180" stroke="url(#swirl-grad)" strokeWidth="0.8" strokeDasharray="10 14" />
          <defs>
            <linearGradient id="swirl-grad" x1="0" y1="0" x2="800" y2="800">
              <stop offset="0%" stopColor="#F97316" />
              <stop offset="50%" stopColor="#FB923C" />
              <stop offset="100%" stopColor="#EA580C" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="relative z-10 text-center max-w-5xl mx-auto flex flex-col items-center justify-center w-full gap-10">

        {/* ── Tagline ────────────────────────────────────────── */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.7 }}
          className="text-white/75 text-[10px] md:text-[11px] font-mono font-bold tracking-[0.22em] uppercase"
        >
          AI Face Enhancement&nbsp;•&nbsp;Validation&nbsp;•&nbsp;Identity Grouping
        </motion.p>

        {/* ── Heading (single h1, staggered animated lines) ───── */}
        <motion.h1
          className="space-y-1 text-4xl md:text-[56px] font-extrabold tracking-tight leading-[1.15] max-w-4xl font-display"
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: prefersReduced ? 0 : stagger } } }}
        >
          <motion.span
            variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 1, ease: [0.16, 1, 0.3, 1] } } }}
            className="block text-white"
          >
            <ScrambleText text="A new way to enhance" />
          </motion.span>
          <motion.span
            variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 1, ease: [0.16, 1, 0.3, 1] } } }}
            className="block"
          >
            <span className="text-white">and organize </span>
            <span className="bg-[#F97316] text-white px-2 py-1 inline-block font-bold">
              <ScrambleText text="facial images" />
            </span>
          </motion.span>
        </motion.h1>

        {/* ── Supporting paragraph ───────────────────────────── */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.8 }}
          className="max-w-2xl text-white/60 text-sm md:text-[15px] leading-7"
        >
          Upload single images, multiple photos, or ZIP files. FaceCloud improves
          low-light images with Zero-DCE, validates face quality, groups identities
          into person folders, and generates secure downloads.
        </motion.p>

        {/* ── CTA: Inline email capture ───────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.8 }}
          className="flex flex-col items-center gap-4 w-full"
        >
          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.form
                key="email-form"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSubmit}
                className="flex items-center gap-2 pl-5 pr-1.5 py-1.5 border border-white/15 rounded-full
                           bg-white/[0.03] backdrop-blur-sm w-full max-w-[420px]
                           focus-within:border-[#F97316]/50 transition-colors duration-300"
              >
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your email for early access"
                  className="flex-1 bg-transparent text-white text-sm outline-none
                             placeholder:text-white/35 min-w-0"
                />
                <button
                  type="submit"
                  className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-r from-[#F97316] to-[#FB923C] hover:from-[#FB923C] hover:to-[#FFA43A]
                             flex items-center justify-center transition-all cursor-pointer shadow-[0_2px_12px_rgba(249,115,22,0.4)]"
                >
                  <ArrowRight className="w-4 h-4 text-white" />
                </button>
              </motion.form>
            ) : (
              <motion.div
                key="success-pill"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25 }}
                className="flex items-center gap-2.5 px-6 py-3 rounded-full border border-emerald-500/25
                           bg-emerald-500/[0.06] backdrop-blur-sm"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-400/90">{SUBMITTED_TEXT}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Demo link */}
          <Link
            to="/dashboard"
            className="text-white/55 hover:text-[#F97316] transition-colors duration-300
                       text-[13px] font-medium tracking-wide"
          >
            Watch FaceCloud processing demo →
          </Link>
        </motion.div>

        {/* ── Pill badges (staggered pop-in) ──────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="hidden sm:flex flex-wrap justify-center gap-2.5"
        >
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: 0.65 + i * 0.08,
                duration: 0.35,
                type: 'spring',
                stiffness: 300,
                damping: 20,
              }}
              className="glass-media rounded-full flex items-center gap-2 px-4 py-2 text-[11px] font-medium
                         text-white/55 border border-white/[0.07]"
            >
              <s.icon className="w-3.5 h-3.5 text-[#F97316] flex-shrink-0" />
              {s.label}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
