import { apiFetch } from './client'

export interface Organization {
  id: number
  name: string
  slug: string
  status: string
  plan: string
  is_personal: boolean
  created_at: string
  updated_at: string
}

export function listOrganizations(): Promise<Organization[]> {
  return apiFetch<Organization[]>('/api/organizations/')
}

/**
 * The organization whose moderator queue to show.
 *
 * Every moderator endpoint is scoped to one organization, so a screen needs an
 * id before it can ask for anything. A shared organization is preferred over
 * the personal one each account gets on sign-up, because the personal one has
 * no other members and therefore nothing to moderate. Returns null when the
 * account belongs to no organization at all, which the caller shows as an
 * empty state rather than an error.
 */
export async function resolveModeratorOrganization(): Promise<Organization | null> {
  const organizations = await listOrganizations()
  return organizations.find(organization => !organization.is_personal) ?? organizations[0] ?? null
}

// ── Members and invitations (owner or moderator) ─────────────────────────────

export interface OrgPerson { id: number; username: string; email: string }

export interface OrgMembership {
  id: number
  organization: number
  user: OrgPerson
  role: 'owner' | 'moderator' | 'member'
  status: 'invited' | 'active' | 'suspended' | 'removed'
  /** Who brought them in: an invitation sender, or the administrator who created the account. */
  invited_by: OrgPerson | null
  created_at: string
  updated_at: string
}

export interface OrgInvitation {
  id: number
  organization: number
  email: string
  role: 'moderator' | 'member'
  status: 'pending' | 'accepted' | 'expired' | 'cancelled' | 'rejected'
  invited_by: OrgPerson | null
  expires_at: string
  accepted_at: string | null
  created_at: string
}

/** The backend answers a plain array here unless `?page=` is sent. Only this organization's members come back. */
export function listOrgMembers(organizationId: number, signal?: AbortSignal): Promise<OrgMembership[]> {
  return apiFetch<OrgMembership[]>(`/api/organizations/${organizationId}/members/`, { signal })
}

export function listOrgInvitations(organizationId: number, signal?: AbortSignal): Promise<OrgInvitation[]> {
  return apiFetch<OrgInvitation[]>(`/api/organizations/${organizationId}/invitations/`, { signal })
}

/** A moderator may only invite the plain member role; the backend refuses anything else. */
export function inviteOrgMember(organizationId: number, email: string): Promise<OrgInvitation> {
  return apiFetch<OrgInvitation>(`/api/organizations/${organizationId}/invitations/`, { body: { email, role: 'member' } })
}

export function resendOrgInvitation(organizationId: number, invitationId: number): Promise<OrgInvitation> {
  return apiFetch<OrgInvitation>(`/api/organizations/${organizationId}/invitations/${invitationId}/resend/`, { method: 'POST', body: {} })
}

export function cancelOrgInvitation(organizationId: number, invitationId: number): Promise<OrgInvitation> {
  return apiFetch<OrgInvitation>(`/api/organizations/${organizationId}/invitations/${invitationId}/`, { method: 'DELETE' })
}

export function setOrgMemberStatus(organizationId: number, membershipId: number, status: 'active' | 'suspended'): Promise<OrgMembership> {
  return apiFetch<OrgMembership>(`/api/organizations/${organizationId}/members/${membershipId}/`, { method: 'PATCH', body: { status } })
}

/** Removes organization access only; the person's account stays. */
export function removeOrgMember(organizationId: number, membershipId: number): Promise<OrgMembership> {
  return apiFetch<OrgMembership>(`/api/organizations/${organizationId}/members/${membershipId}/`, { method: 'DELETE' })
}
