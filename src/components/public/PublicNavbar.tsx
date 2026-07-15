import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { FaceCloudLogo } from '../branding/FaceCloudLogo'

const NAV_LINKS = ['Features', 'Methodology', 'Pricing', 'Security', 'Contact']

export function PublicNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-20 px-4 sm:px-6 pt-6 w-full"
    >
      {/* Pill container */}
      <div className="liquid-glass rounded-full px-5 py-3 flex items-center justify-between max-w-5xl mx-auto">

        {/* Logo */}
        <FaceCloudLogo variant="horizontal" size="md" href="/" priority={true} />

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-7 text-white/70 text-sm font-medium">
          {NAV_LINKS.map(item => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="hover:text-white transition-colors duration-200"
            >
              {item}
            </a>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-1">
          <Link
            to="/login"
            className="px-4 py-2 text-[13px] font-medium text-white/65 hover:text-white transition-colors duration-200"
          >
            User Login
          </Link>
          <Link
            to="/login"
            className="glass-pill px-5 py-2 text-[13px] font-medium text-white border border-white/15 hover:border-white/30 hover:bg-white/[0.06] transition-all duration-300 cursor-pointer ml-1"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(o => !o)}
          className="md:hidden p-2 text-white/60 hover:text-white transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute left-4 right-4 top-full mt-2 liquid-glass rounded-3xl p-6 flex flex-col gap-3 z-30"
          >
            {NAV_LINKS.map(item => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                onClick={() => setMobileOpen(false)}
                className="text-white/70 hover:text-white text-sm font-medium py-1 transition-colors"
              >
                {item}
              </a>
            ))}
            <div className="h-px bg-white/10 my-1" />
            <Link
              to="/login"
              className="text-white/65 hover:text-white text-sm font-medium py-1 transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              User Login
            </Link>
            <Link
              to="/login"
              className="glass-pill text-center py-2.5 text-sm font-medium text-white border border-white/15 hover:border-white/25 transition-all mt-1"
              onClick={() => setMobileOpen(false)}
            >
              Get Started
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
