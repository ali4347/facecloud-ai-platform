import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Info, Loader2 } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { LeaveRequestCard } from '../../components/organization/LeaveRequestCard'
import { displayName } from '../../lib/api/organizations'
import { useMemberOrganizations } from '../../lib/useMemberOrganizations'

/** What a person sees where "My Organization" would be when they hold no organization workspace: calm, and nothing organizational is granted. */
export function OrganizationAccessEnded() {
  return (
    <div className="fc-card p-8 text-center max-w-xl mx-auto" data-testid="org-access-ended">
      <Info className="w-7 h-7 mx-auto mb-3 text-accent" aria-hidden />
      <h2 className="text-base font-bold text-ink">You have no organization access right now</h2>
      <p className="text-sm text-ink-mute mt-2">Your access to the organization workspace has ended or is suspended, so organization photos and tools are not shown here.</p>
      <p className="text-sm text-ink-mute mt-2">Nothing was deleted: the organization keeps its files and records, and your own photos, albums, person folders and sign-in are exactly as you left them.</p>
      <Link to="/dashboard/images" className="fc-btn-primary inline-flex justify-center mt-5 text-xs py-2.5 px-5">Go to my personal photos</Link>
      <p className="text-[11px] text-ink-faint mt-4">If this is unexpected, ask the organization’s owner or the FaceCloud administrator.</p>
    </div>
  )
}

/** The organization page for someone who is a plain member (not the owner): where they are, what they are, and the way to ask to leave. */
export default function MemberOrganization() {
  const { organizations, loading, reload } = useMemberOrganizations()
  const [ended, setEnded] = useState(false)
  const onAccessEnded = useCallback(() => { setEnded(true); reload() }, [reload])

  if (loading) return <div className="py-16 text-center text-xs text-ink-faint"><Loader2 className="w-5 h-5 mx-auto mb-2 animate-spin" />Loading your organization…</div>
  return (
    <div className="page-enter">
      <PageHeader title="My Organization" subtitle="The organization you belong to. Your personal workspace is separate and stays yours." />
      {(organizations.length === 0 || ended) ? <OrganizationAccessEnded /> : (
        <div className="space-y-5">
          {organizations.map(org => (
            <div key={org.id} className="space-y-3">
              <div className="fc-card p-5 flex items-center justify-between" data-testid={`member-org-${org.id}`}>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-ink-faint">Organization</span>
                  <p className="text-xl font-bold text-ink mt-1">{displayName(org)}</p>
                  <p className="text-xs text-ink-mute mt-0.5">You are a member · {org.plan.charAt(0).toUpperCase() + org.plan.slice(1)} plan</p>
                </div>
                <Building2 className="w-5 h-5 text-accent" aria-hidden />
              </div>
              <LeaveRequestCard organizationId={org.id} organizationName={displayName(org)} onAccessEnded={onAccessEnded} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
