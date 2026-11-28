import { useEffect, useState } from 'react'
import { USE_API } from './api/config'
import { listOrganizations, type MyOrganization, type Organization } from './api/organizations'
import { personCache } from './personCache'

const cache = personCache<Organization[]>()

/** A team the person may file photos under: shared, active, and their membership in it active. */
export const isUploadTeam = (o: MyOrganization): boolean =>
  !o.is_personal && o.status === 'active' && o.membership?.status === 'active'

/**
 * Where an upload goes. Everyone has a personal workspace that only they can see; a person who belongs to a team
 * (an organization that is not personal) can instead submit the photos to it, which is what lets the team's moderators
 * see and review them. Sharing photos of faces with moderators is always an explicit choice, so the default is personal.
 */
export function useSubmitTarget() {
  const [teams, setTeams] = useState<Organization[]>(cache.get() ?? [])
  const [organizationId, setOrganizationId] = useState<number | undefined>(undefined)

  useEffect(() => {
    if (!USE_API || cache.get() !== undefined) return
    let active = true
    listOrganizations()
      // Only a shared organization that is active and where the person's own membership is active (the server lists only
      // those today; checked here too so an invited, suspended or removed membership, or an organization still waiting for
      // its owner, can never be offered as an upload target).
      .then(all => { const teams = all.filter(isUploadTeam); cache.set(teams); if (active) setTeams(teams) })
      .catch(() => { /* without the list the person simply uploads to their own workspace */ })
    return () => { active = false }
  }, [])

  return { teams, organizationId, setOrganizationId }
}
