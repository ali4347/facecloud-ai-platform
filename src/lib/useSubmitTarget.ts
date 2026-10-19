import { useEffect, useState } from 'react'
import { USE_API } from './api/config'
import { listOrganizations, type Organization } from './api/organizations'

let cachedTeams: Organization[] | null = null

/**
 * Where an upload goes. Everyone has a personal workspace that only they can see; a person who belongs to a team
 * (an organization that is not personal) can instead submit the photos to it, which is what lets the team's moderators
 * see and review them. Sharing photos of faces with moderators is always an explicit choice, so the default is personal.
 */
export function useSubmitTarget() {
  const [teams, setTeams] = useState<Organization[]>(cachedTeams ?? [])
  const [organizationId, setOrganizationId] = useState<number | undefined>(undefined)

  useEffect(() => {
    if (!USE_API || cachedTeams !== null) return
    let active = true
    listOrganizations()
      .then(all => { cachedTeams = all.filter(o => !o.is_personal && o.status === 'active'); if (active) setTeams(cachedTeams) })
      .catch(() => { /* without the list the person simply uploads to their own workspace */ })
    return () => { active = false }
  }, [])

  return { teams, organizationId, setOrganizationId }
}
