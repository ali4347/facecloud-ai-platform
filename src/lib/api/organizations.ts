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
 * id before it can ask for anything. Only a team (a shared organization) counts:
 * the personal workspace each account gets on sign-up has no other members and
 * is not something to moderate. Returns null when the account belongs to no team,
 * which the caller shows as "you are not part of an organization" rather than an error.
 */
export async function resolveModeratorOrganization(): Promise<Organization | null> {
  const organizations = await listOrganizations()
  // Only a team counts. A personal workspace has no other members, the backend refuses most moderator actions on it,
  // and a moderator who belongs to no team must see "no organization" rather than their own uploads dressed as a queue.
  return organizations.find(organization => !organization.is_personal && organization.status === 'active') ?? null
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

// ── Accepting an invitation (the emailed link) ───────────────────────────────

export interface InvitationPreview {
  organization_name: string
  email: string
  role: 'member' | 'moderator'
  expires_at: string
}

/**
 * Who is inviting, shown before anyone signs in, so no Authorization header is sent. An unknown, used, cancelled or
 * expired token all answer the same 404 sentence; show that sentence and nothing more.
 */
export function previewInvitation(token: string, signal?: AbortSignal): Promise<InvitationPreview> {
  return apiFetch<InvitationPreview>(`/api/organizations/invitations/${encodeURIComponent(token)}/`, { anonymous: true, signal })
}

/** The signed-in person (who must be using the invited email) joins the organization. */
export function acceptInvitation(token: string): Promise<OrgMembership> {
  return apiFetch<OrgMembership>('/api/organizations/invitations/accept/', { body: { token } })
}
