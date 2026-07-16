import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { FaceCloudLogo } from '../branding/FaceCloudLogo'
import { cn } from '../../lib/utils'

export function PublicNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const isHomePage = location.pathname === '/'

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setScrolled(true)
      } else {
        setScrolled(false)
      }
    }
    window.addEventListener('scroll', handleScroll)
    handleScroll() // Initialize on load
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const menuItems = [
    { label: 'Features', isHash: true },
    { label: 'Methodology', isHash: true },
    { label: 'Pricing', isHash: true },
    { label: 'Security', isHash: true },
    { label: 'About', isHash: false },
    { label: 'Contact', isHash: false },
  ]

  const getHref = (item: { label: string; isHash: boolean }) => {
    if (item.isHash) {
      return isHomePage ? `#${item.label.toLowerCase()}` : `/#${item.label.toLowerCase()}`
    }
    return `/${item.label.toLowerCase()}`
  }

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ease-in-out",
        scrolled
          ? "bg-[#050816]/80 backdrop-blur-md border-b border-white/10 py-3 shadow-lg"
          : "bg-transparent py-5"
      )}
    >
      {/* Outer container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Pill container */}
        <div className={cn(
          "transition-all duration-300 ease-in-out flex items-center justify-between w-full",
          scrolled 
            ? "px-2 py-0 bg-transparent border-transparent shadow-none" 
            : "liquid-glass rounded-full px-5 py-3"
        )}>
          {/* Logo */}
          <FaceCloudLogo variant="horizontal" size="md" href="/" priority={true} />

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-7 text-white/70 text-sm font-medium">
            {menuItems.map(item => {
              if (item.isHash) {
                return (
                  <a
                    key={item.label}
                    href={getHref(item)}
                    className="hover:text-white transition-colors duration-200"
                  >
                    {item.label}
                  </a>
                )
              } else {
                return (
                  <Link
                    key={item.label}
                    to={getHref(item)}
                    className={cn(
                      "transition-colors duration-200",
                      location.pathname === getHref(item)
                        ? "text-white font-semibold"
                        : "hover:text-white text-white/70"
                    )}
                  >
                    {item.label}
                  </Link>
                )
              }
            })}
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
            {menuItems.map(item => {
              if (item.isHash) {
                return (
                  <a
                    key={item.label}
                    href={getHref(item)}
                    onClick={() => setMobileOpen(false)}
                    className="text-white/70 hover:text-white text-sm font-medium py-1 transition-colors"
                  >
                    {item.label}
                  </a>
                )
              } else {
                return (
                  <Link
                    key={item.label}
                    to={getHref(item)}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "text-sm font-medium py-1 transition-colors",
                      location.pathname === getHref(item)
                        ? "text-white font-semibold"
                        : "text-white/70 hover:text-white"
                    )}
                  >
                    {item.label}
                  </Link>
                )
              }
            })}
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
    </header>
  )
}
