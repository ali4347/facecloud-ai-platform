import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Check, Zap, Shield, Users, Download } from 'lucide-react'
import { Link } from 'react-router-dom'

const TYPEWRITER_TEXT = 'Enter your email for FaceCloud early access'
const SUBMITTED_TEXT  = 'You will receive FaceCloud updates by email'
const TYPEWRITER_SPEED_MS = 60

const STATS = [
  { icon: Zap,      label: 'Zero-DCE Enhancement' },
  { icon: Shield,   label: 'One Face Validation' },
  { icon: Users,    label: 'Person Folder Matching' },
  { icon: Download, label: 'Secure ZIP + Report' },
]

export function HeroSection() {
  const [showForm, setShowForm]     = useState(false)
  const [email, setEmail]           = useState('')
  const [submitted, setSubmitted]   = useState(false)
  const [placeholder, setPlaceholder] = useState('')

  const typeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Typewriter effect whenever form opens or submitted state changes
  useEffect(() => {
    if (!showForm) {
      setPlaceholder('')
      return
    }
    const text = submitted ? SUBMITTED_TEXT : TYPEWRITER_TEXT
    let i = 0
    setPlaceholder('')
    if (typeIntervalRef.current) clearInterval(typeIntervalRef.current)
    typeIntervalRef.current = setInterval(() => {
      i++
      setPlaceholder(text.slice(0, i))
      if (i >= text.length && typeIntervalRef.current) {
        clearInterval(typeIntervalRef.current)
      }
    }, TYPEWRITER_SPEED_MS)

    return () => {
      if (typeIntervalRef.current) clearInterval(typeIntervalRef.current)
    }
  }, [showForm, submitted])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typeIntervalRef.current)  clearInterval(typeIntervalRef.current)
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current)
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setSubmitted(true)
    // Reset everything after 4 seconds
    resetTimeoutRef.current = setTimeout(() => {
      setShowForm(false)
      setEmail('')
      setSubmitted(false)
    }, 4000)
  }

  return (
    <div className="relative flex-1 flex flex-col items-center justify-center px-6 pb-8">
      <div className="relative z-10 text-center max-w-5xl mx-auto flex flex-col items-center justify-center w-full gap-10">

        {/* ── Tagline ────────────────────────────────────────── */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.7 }}
          className="text-white/75 text-[10px] md:text-[11px] font-medium tracking-[0.22em] uppercase"
        >
          AI Face Enhancement&nbsp;•&nbsp;Validation&nbsp;•&nbsp;Identity Grouping
        </motion.p>

        {/* ── Heading ────────────────────────────────────────── */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="text-4xl md:text-[64px] font-medium tracking-[-0.01em] leading-[1.1]
                     bg-gradient-to-b from-white via-white/95 to-white/65
                     bg-clip-text text-transparent max-w-4xl"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          A new way to enhance{' '}
          <br className="hidden md:block" />
          and organize facial images
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

        {/* ── CTA: Email capture ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.8 }}
          className="flex flex-col items-center gap-4 w-full"
        >
          <AnimatePresence mode="wait">
            {!showForm ? (
              /* ── Initial button ── */
              <motion.button
                key="cta-btn"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                onClick={() => setShowForm(true)}
                className="px-10 py-3 text-[14px] font-medium border border-white/10 rounded-full
                           hover:border-white/30 hover:bg-white/[0.02] transition-all duration-300
                           text-white/85 backdrop-blur-sm cursor-pointer"
              >
                Get early access
              </motion.button>
            ) : (
              /* ── Email form ── */
              <motion.form
                key="email-form"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSubmit}
                className="flex items-center gap-2 pl-5 pr-1.5 py-1.5 border border-white/20 rounded-full
                           bg-white/[0.02] backdrop-blur-sm w-full max-w-[360px]
                           focus-within:border-white/40 transition-colors duration-300"
              >
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={placeholder}
                  autoFocus
                  disabled={submitted}
                  className="flex-1 bg-transparent text-white text-sm outline-none
                             placeholder:text-white/40 min-w-0 disabled:cursor-default"
                />
                <button
                  type="submit"
                  disabled={submitted}
                  className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20
                             flex items-center justify-center transition-colors disabled:cursor-default"
                >
                  {submitted
                    ? <Check className="w-4 h-4 text-[#4FFFB0]" />
                    : <ArrowRight className="w-4 h-4 text-white" />
                  }
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Demo link */}
          <Link
            to="/dashboard"
            className="text-white/55 hover:text-white/80 transition-colors duration-300
                       text-[13px] font-medium tracking-wide"
          >
            Watch FaceCloud processing demo →
          </Link>
        </motion.div>

        {/* ── Micro stats ────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="hidden sm:flex flex-wrap justify-center gap-2.5"
        >
          {STATS.map(s => (
            <div
              key={s.label}
              className="glass-pill flex items-center gap-2 px-4 py-2 text-[11px] font-medium
                         text-white/55 border border-white/[0.07]"
            >
              <s.icon className="w-3.5 h-3.5 text-[#4FFFB0] flex-shrink-0" />
              {s.label}
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
