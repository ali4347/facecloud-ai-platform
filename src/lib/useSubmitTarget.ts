import { useEffect, useState } from 'react'
import { USE_API } from './api/config'
import { listOrganizations, type Organization } from './api/organizations'
import { personCache } from './personCache'

const cache = personCache<Organization[]>()

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
      .then(all => { const teams = all.filter(o => !o.is_personal && o.status === 'active'); cache.set(teams); if (active) setTeams(teams) })
      .catch(() => { /* without the list the person simply uploads to their own workspace */ })
    return () => { active = false }
  }, [])

  return { teams, organizationId, setOrganizationId }
}
