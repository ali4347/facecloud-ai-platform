import { listAdminOrganizations } from './api/adminOrganizations'
import type { Organization } from './api/organizations'
import { useApiResource, type AsyncState } from './useApiResource'

const demoOrganizations = (): Organization[] => [
  { id: 1, name: 'Acme Team', slug: 'acme', status: 'active', plan: 'team', is_personal: false, created_at: '2026-07-01T09:00:00Z', updated_at: '2026-07-01T09:00:00Z' },
  { id: 2, name: 'Beta Studio', slug: 'beta', status: 'active', plan: 'free', is_personal: false, created_at: '2026-07-04T09:00:00Z', updated_at: '2026-07-04T09:00:00Z' },
]

/** Every organization for the admin screens (the demo build has two sample ones). */
export function useAdminOrganizations(): AsyncState<Organization[]> {
  return useApiResource(signal => listAdminOrganizations(signal), demoOrganizations, [])
}

/** The teams a moderator can be placed in: shared (not personal) and active. */
export const teamsOf = (organizations: Organization[] | null): Organization[] =>
  (organizations ?? []).filter(o => !o.is_personal && o.status === 'active')
