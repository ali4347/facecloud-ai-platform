import { useId, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { RevealOnScroll } from '../animation/RevealOnScroll'
import type { FaqItem } from '../../content/faqs'

/**
 * An accordion of questions. Every answer stays in the page while closed
 * (folded to zero height and made `inert`), so search engines read it and it
 * matches the FAQPage structured data built from the same list.
 */
export function FaqList({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null)
  const baseId = useId()

  return (
    <div className="space-y-3">
      {items.map((item, idx) => {
        const isOpen = open === idx
        const buttonId = `${baseId}-q${idx}`
        const panelId = `${baseId}-a${idx}`
        return (
          <RevealOnScroll key={item.q} delay={idx * 0.05}>
            <div className="fc-panel overflow-hidden">
              <h3>
                <button
                  id={buttonId}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpen(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-left cursor-pointer group"
                >
                  <span className="font-sans text-sm font-bold text-ink group-hover:text-[#FB923C] transition-colors pr-4">{item.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 flex-shrink-0 text-ink-faint transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    aria-hidden
                  />
                </button>
              </h3>
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                inert={!isOpen}
                className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
              >
                <div className="overflow-hidden">
                  <p className="px-5 pb-5 text-xs text-ink-mute leading-relaxed font-medium border-t border-ink/[0.06] pt-4">
                    {item.a}
                  </p>
                </div>
              </div>
            </div>
          </RevealOnScroll>
        )
      })}
    </div>
  )
}
