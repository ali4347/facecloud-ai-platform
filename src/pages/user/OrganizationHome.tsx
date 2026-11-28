import { Loader2 } from 'lucide-react'
import MyOrganization from './MyOrganization'
import MemberOrganization from './MemberOrganization'
import { useOwnedOrganizations } from '../../lib/useOwnedOrganizations'

/** `/dashboard/organization`: the owner's management page for an owner, the member page (with "Request to Leave Organization") for everyone else. */
export default function OrganizationHome() {
  const { owned, loading } = useOwnedOrganizations()
  if (loading) return <div className="py-16 text-center text-xs text-ink-faint"><Loader2 className="w-5 h-5 mx-auto mb-2 animate-spin" />Loading…</div>
  return owned.length > 0 ? <MyOrganization /> : <MemberOrganization />
}
