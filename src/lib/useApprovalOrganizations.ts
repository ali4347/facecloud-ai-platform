import { useEffect, useState } from 'react'
import { USE_API } from './api/config'
import { listOrganizations, type MyOrganization } from './api/organizations'
import { personCache } from './personCache'

const cache = personCache<MyOrganization[]>()

/**
 * The shared organizations this person is an active member of that require a moderator's approval before a download.
 * Drives the "Download requests" menu entry and names organizations in the request dialog. Empty in the demo build,
 * on an older backend (no `download_approval_required` field), and for someone in no such organization.
 */
export function useApprovalOrganizations(enabled = true): { organizations: MyOrganization[]; loading: boolean } {
  const [organizations, setOrganizations] = useState<MyOrganization[]>(cache.get() ?? [])
  const [loading, setLoading] = useState(USE_API && enabled && cache.get() === undefined)
  useEffect(() => {
    if (!USE_API || !enabled || cache.get() !== undefined) return
    let active = true
    listOrganizations()
      .then(all => {
        const found = all.filter(o => !o.is_personal && o.download_approval_required === true && o.membership?.status === 'active')
        cache.set(found)
        if (active) setOrganizations(found)
      })
      .catch(() => { /* without the list the menu simply has no entry; the pages still work by address */ })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [enabled])
  return { organizations, loading }
}
