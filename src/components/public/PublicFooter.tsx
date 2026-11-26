import { Link, useLocation } from 'react-router-dom'
import { FaceCloudLogo } from '../branding/FaceCloudLogo'

export function PublicFooter() {
  const location = useLocation()
  const isHomePage = location.pathname === '/'

  const getHref = (hash: string) => {
    return isHomePage ? hash : `/${hash}`
  }

  return (
    <footer className="py-16 bg-surface-soft border-t border-ink/[0.06] relative z-10">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10 text-xs text-ink-faint">
        {/* Logo Column */}
        <div className="space-y-3.5">
          <FaceCloudLogo variant="horizontal" size="sm" href="/" priority={false} tone="app" />
          <p className="text-[10px] text-ink-faint font-medium leading-relaxed">
            A creative platform to direct your best work. To facilitate the studios, creators and agencies. Powered by DATAMART Inc.
          </p>
        </div>

        {/* Product Links */}
        <div className="space-y-3">
          <h4 className="font-bold text-ink uppercase tracking-wider text-[10px]">Product</h4>
          <ul className="space-y-2 font-medium">
            <li><a href={getHref('#features')} className="hover:text-[#F97316] transition-colors">Features</a></li>
            <li><a href={getHref('#methodology')} className="hover:text-[#F97316] transition-colors">Methodology</a></li>
            <li><a href={getHref('#pricing')} className="hover:text-[#F97316] transition-colors">Pricing</a></li>
            <li><a href={getHref('#security')} className="hover:text-[#F97316] transition-colors">Security</a></li>
            <li><a href={getHref('#faq')} className="hover:text-[#F97316] transition-colors">FAQ</a></li>
          </ul>
        </div>

        {/* Company Links */}
        <div className="space-y-3">
          <h4 className="font-bold text-ink uppercase tracking-wider text-[10px]">Company</h4>
          <ul className="space-y-2 font-medium">
            <li><Link to="/about" className="hover:text-[#F97316] transition-colors">About Us</Link></li>
            <li><Link to="/roles/moderator" className="hover:text-[#F97316] transition-colors">Moderator Role &amp; Plans</Link></li>
            <li><Link to="/contact" className="hover:text-[#F97316] transition-colors">Contact</Link></li>
          </ul>
        </div>

        {/* Portals & Copyright */}
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-bold text-ink uppercase tracking-wider text-[10px]">Portals</h4>
            <ul className="space-y-2 font-medium">
              <li><Link to="/login" className="hover:text-[#F97316] transition-colors">Login</Link></li>
              <li><Link to="/register" className="hover:text-[#F97316] transition-colors">Create Account</Link></li>
            </ul>
          </div>
          <div className="space-y-1 pt-1">
            <h4 className="font-bold text-ink uppercase tracking-wider text-[10px]">Registry Compliance</h4>
            <p className="text-[10px] text-ink-faint leading-relaxed font-medium">
              &copy; {new Date().getFullYear()} FaceCloud. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
