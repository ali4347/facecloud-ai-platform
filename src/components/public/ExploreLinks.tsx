import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

interface ExploreItem {
  /** Route or route#section. */
  href: string
  /** Descriptive link text: search engines read it as what the target page is about. */
  label: string
  blurb: string
  /** The page this item points at, so that page can leave itself out. */
  page: string
}

const ITEMS: ExploreItem[] = [
  { page: '/', href: '/', label: 'AI facial image enhancement platform', blurb: 'How FaceCloud enhances, checks and groups facial images.' },
  { page: '/#pricing', href: '/#pricing', label: 'Plans and pricing', blurb: 'Free, Basic and Pro: storage and image limits side by side.' },
  { page: '/about', href: '/about', label: 'About FaceCloud and the team', blurb: 'Our mission, how we work, the owners and the team.' },
  { page: '/roles/moderator', href: '/roles/moderator', label: 'Moderator role and team plans', blurb: 'What moderators review, and the Team, Business and Enterprise plans.' },
  { page: '/contact', href: '/contact', label: 'Contact sales and support', blurb: 'Ask about plans, team accounts, early access or support.' },
  { page: '/register', href: '/register', label: 'Create a free account', blurb: 'Start with 10 free images and see your photos grouped by face.' },
]

/**
 * "Explore FaceCloud": links from one public page to the others, placed just
 * above the footer. Gives every public page crawlable, descriptive links to
 * the rest of the site. `current` is the page it sits on; Home also drops
 * Pricing, which is a section of the same page.
 */
export function ExploreLinks({ current }: { current: string }) {
  const hide = current === '/' ? ['/', '/#pricing'] : [current]
  const items = ITEMS.filter(item => !hide.includes(item.page)).slice(0, 4)

  return (
    <nav aria-labelledby="explore-heading" className="relative z-10 border-t border-ink/[0.06] py-16">
      <div className="max-w-7xl mx-auto px-6">
        <h2 id="explore-heading" className="text-xs font-bold text-[#F97316] tracking-widest uppercase mb-6">
          Explore FaceCloud
        </h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map(item => (
            <li key={item.href}>
              <Link
                to={item.href}
                className="group h-full flex flex-col gap-2 rounded-2xl border border-ink/[0.06] bg-ink/[0.04] p-5 transition-colors hover:border-[#F97316]/40"
              >
                <span className="flex items-start justify-between gap-3 text-sm font-bold text-ink group-hover:text-[#F97316] transition-colors">
                  {item.label}
                  <ArrowRight className="w-4 h-4 shrink-0 mt-0.5 text-[#FB923C]" aria-hidden />
                </span>
                <span className="text-xs text-ink-mute leading-relaxed">{item.blurb}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
