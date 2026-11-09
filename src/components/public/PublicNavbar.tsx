import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Sun, Moon } from 'lucide-react'
import { FaceCloudLogo } from '../branding/FaceCloudLogo'
import { cn } from '../../lib/utils'
import { useAppearance } from '../../lib/theme'

export function PublicNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const isHomePage = location.pathname === '/'
  const [appearance, toggleAppearance] = useAppearance()

  /* At the top of the home page, in the dark appearance, the bar floats over the hero video, so the text there stays
     white. In the light appearance the hero is light too, and once the bar docks, or on any other page, it sits on the
     page itself and follows the tokens. */
  const onMedia = isHomePage && !scrolled && appearance === 'dark'

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

  // Prevent background page scrolling when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

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

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    item: { label: string; isHash: boolean }
  ) => {
    setMobileOpen(false)
    if (item.isHash && isHomePage) {
      const targetId = item.label.toLowerCase()
      const targetEl = document.getElementById(targetId)
      if (targetEl) {
        e.preventDefault()
        targetEl.scrollIntoView({ block: 'start', behavior: 'smooth' })
        window.history.pushState(null, '', `#${targetId}`)
      }
    }
  }

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ease-in-out",
          scrolled
            ? "bg-surface-soft/85 backdrop-blur-md border-b border-ink/10 py-3 shadow-lg"
            : "bg-transparent py-5"
        )}
      >
        {/* Outer container */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Pill container */}
          <div
            className={cn(
              "transition-all duration-300 ease-in-out flex items-center justify-between w-full",
              scrolled
                ? "px-2 py-0 bg-transparent border-transparent shadow-none"
                : cn("rounded-full px-5 py-3", onMedia ? "on-dark glass-media" : "liquid-glass")
            )}
          >
            {/* Logo */}
            <FaceCloudLogo variant="horizontal" size="md" href="/" priority={true} tone={onMedia ? "dark" : "app"} />

            {/* Desktop nav links */}
            <div className={cn(
              "hidden lg:flex items-center gap-7 text-sm font-medium",
              onMedia ? "text-white/70" : "text-ink-mute"
            )}>
              {menuItems.map(item => {
                if (item.isHash) {
                  return (
                    <a
                      key={item.label}
                      href={getHref(item)}
                      onClick={(e) => handleNavClick(e, item)}
                      className={cn(
                        "transition-colors duration-200",
                        onMedia ? "hover:text-white" : "hover:text-ink"
                      )}
                    >
                      {item.label}
                    </a>
                  )
                } else {
                  return (
                    <Link
                      key={item.label}
                      to={getHref(item)}
                      onClick={(e) => handleNavClick(e, item)}
                      className={cn(
                        "transition-colors duration-200",
                        location.pathname === getHref(item)
                          ? (onMedia ? "text-white font-semibold" : "text-ink font-semibold")
                          : (onMedia ? "text-white/70 hover:text-white" : "text-ink-mute hover:text-ink")
                      )}
                    >
                      {item.label}
                    </Link>
                  )
                }
              })}
            </div>

            {/* Desktop CTAs */}
            <div className="hidden lg:flex items-center gap-1">
              <Link
                to="/roles/moderator"
                className={cn(
                  "px-4 py-2 text-[13px] font-medium transition-colors duration-200",
                  location.pathname === '/roles/moderator'
                    ? (onMedia ? "text-white font-semibold" : "text-ink font-semibold")
                    : (onMedia ? "text-white/65 hover:text-white" : "text-ink-mute hover:text-ink")
                )}
              >
                Moderator
              </Link>
              <Link
                to="/login"
                className={cn(
                  "px-5 py-2 rounded-full text-[13px] font-medium transition-all duration-300 cursor-pointer ml-1",
                  onMedia ? "on-dark glass-media" : "glass-pill",
                  onMedia ? "text-white border border-white/15 hover:border-white/30"
                          : "text-ink border border-ink/15 hover:border-ink/30"
                )}
              >
                Get Started
              </Link>

              <button
                type="button"
                onClick={toggleAppearance}
                aria-label={appearance === 'dark' ? 'Switch to light appearance' : 'Switch to dark appearance'}
                title={appearance === 'dark' ? 'Light appearance' : 'Dark appearance'}
                aria-pressed={appearance === 'light'}
                className={cn(
                  "ml-1 p-2 rounded-full transition-colors duration-200 cursor-pointer",
                  onMedia ? "text-white/65 hover:text-white hover:bg-white/10"
                          : "text-ink-mute hover:text-ink hover:bg-ink/10"
                )}
              >
                {appearance === 'dark'
                  ? <Sun className="w-[18px] h-[18px]" />
                  : <Moon className="w-[18px] h-[18px]" />}
              </button>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(o => !o)}
              className={cn(
                "lg:hidden p-2 transition-colors",
                onMedia ? "text-white/70 hover:text-white" : "text-ink-mute hover:text-ink"
              )}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay & panel */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Dark backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-xs z-[90] lg:hidden"
              aria-hidden="true"
            />

            {/* Solid opaque panel */}
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-x-0 top-0 z-[100] w-full bg-surface-soft border-b border-ink/15 px-6 pt-5 pb-8 flex flex-col gap-5 shadow-2xl lg:hidden overflow-y-auto max-h-[100vh]"
            >
              {/* Header row: Logo + Close button */}
              <div className="flex items-center justify-between pb-4 border-b border-ink/10">
                <FaceCloudLogo variant="horizontal" size="md" href="/" priority={true} tone="app" />
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 text-ink-mute hover:text-ink transition-colors rounded-lg bg-ink/5 border border-ink/10"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation links (left-aligned, clean vertical layout) */}
              <div className="flex flex-col gap-3.5 py-1">
                {menuItems.map(item => {
                  const href = getHref(item)
                  const isActive = !item.isHash && location.pathname === href
                  if (item.isHash) {
                    return (
                      <a
                        key={item.label}
                        href={href}
                        onClick={(e) => handleNavClick(e, item)}
                        className="text-left text-ink-soft hover:text-ink text-base font-medium py-1.5 transition-colors"
                      >
                        {item.label}
                      </a>
                    )
                  } else {
                    return (
                      <Link
                        key={item.label}
                        to={href}
                        onClick={(e) => handleNavClick(e, item)}
                        className={cn(
                          "text-left text-base font-medium py-1.5 transition-colors",
                          isActive
                            ? "text-[#F97316] font-semibold"
                            : "text-ink-soft hover:text-ink"
                        )}
                      >
                        {item.label}
                      </Link>
                    )
                  }
                })}
              </div>

              {/* Separator */}
              <div className="h-px bg-ink/10 my-1" />

              {/* CTAs */}
              <div className="flex flex-col gap-3">
                <Link
                  to="/roles/moderator"
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "text-left text-sm font-medium py-2 transition-colors",
                    location.pathname === '/roles/moderator'
                      ? "text-[#F97316] font-semibold"
                      : "text-ink-soft hover:text-ink"
                  )}
                >
                  Moderator
                </Link>
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="w-full text-center py-3 text-sm font-bold text-white rounded-full bg-gradient-to-r from-[#F97316] to-[#FB923C] hover:from-[#FB923C] hover:to-[#FFA43A] shadow-[0_2px_12px_rgba(249,115,22,0.4)] transition-all cursor-pointer"
                >
                  Get Started
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
