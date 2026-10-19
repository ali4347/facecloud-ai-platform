import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { Building2 } from 'lucide-react'
import { USE_API } from '../../lib/api/config'
import { useModeratorOrganization } from '../../lib/moderationData'

/**
 * A moderator works for an organization and sees only its data. An account that was made a moderator but is not (yet)
 * in any organization has nothing to review, so the panel says that plainly instead of showing empty screens that look
 * like a quiet day. Settings still opens, because it is about the person, not the organization.
 */
export function NoOrganizationGuard({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const { organizationId, resolving, error } = useModeratorOrganization()
  const blocked = USE_API && !resolving && !error && organizationId === null && !pathname.endsWith('/settings')
  if (!blocked) return <>{children}</>
  return (
    <div className="max-w-md mx-auto text-center py-24">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-accent-tint flex items-center justify-center mb-5"><Building2 className="w-8 h-8 text-accent" /></div>
      <h1 className="text-lg font-bold text-ink mb-2">You are not part of an organization yet</h1>
      <p className="text-sm text-ink-mute leading-relaxed">
        A moderator works for one organization and only sees its members and photos. Ask a FaceCloud administrator to add you to an
        organization, then sign in again. Until then there is nothing for you to review.
      </p>
    </div>
  )
}
