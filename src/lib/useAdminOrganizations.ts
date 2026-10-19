import { listAdminOrganizations, type AdminOrganization } from './api/adminOrganizations'
import { useApiResource, type AsyncState } from './useApiResource'

const demoOrganizations = (): AdminOrganization[] => [
  { id: 1, name: 'Acme Team', slug: 'acme', status: 'active', plan: 'team', is_personal: false, created_at: '2026-07-01T09:00:00Z', updated_at: '2026-07-01T09:00:00Z',
    moderator_data_scope: 'own_members', owner: { id: 1, username: 'owner' }, member_count: 14, moderator_count: 3, limits: { moderators: 5, members: 100 }, usage: { moderators: 3, members: 11 } },
  { id: 2, name: 'Beta Studio', slug: 'beta', status: 'active', plan: 'free', is_personal: false, created_at: '2026-07-04T09:00:00Z', updated_at: '2026-07-04T09:00:00Z',
    moderator_data_scope: 'organization', owner: { id: 2, username: 'beta-owner' }, member_count: 3, moderator_count: 1, limits: { moderators: 1, members: 10 }, usage: { moderators: 1, members: 2 } },
]

/** Every organization for the admin screens (the demo build has two sample ones). */
export function useAdminOrganizations(): AsyncState<AdminOrganization[]> {
  return useApiResource(signal => listAdminOrganizations(signal), demoOrganizations, [])
}

/** The teams a moderator can be placed in: shared (not personal) and active. */
export const teamsOf = (organizations: AdminOrganization[] | null): AdminOrganization[] =>
  (organizations ?? []).filter(o => !o.is_personal && o.status === 'active')
