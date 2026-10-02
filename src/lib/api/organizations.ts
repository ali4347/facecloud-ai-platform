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
