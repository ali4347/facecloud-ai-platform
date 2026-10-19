import { useEffect, useState } from 'react'
import { USE_API } from './api/config'
import { listOrganizations, type MyOrganization } from './api/organizations'
import { personCache } from './personCache'

const cache = personCache<MyOrganization[]>()

/** The teams this person owns (an active owner membership in a shared organization; a suspended one is still theirs). Empty in the demo build. */
export function useOwnedOrganizations(enabled = true): { owned: MyOrganization[]; loading: boolean } {
  const [owned, setOwned] = useState<MyOrganization[]>(cache.get() ?? [])
  const [loading, setLoading] = useState(USE_API && enabled && cache.get() === undefined)
  useEffect(() => {
    if (!USE_API || !enabled || cache.get() !== undefined) return
    let active = true
    listOrganizations()
      .then(all => {
        const mine = all.filter(o => !o.is_personal && o.membership?.role === 'owner' && o.membership.status === 'active')
        cache.set(mine)
        if (active) setOwned(mine)
      })
      .catch(() => { /* without the list there is simply no owner menu */ })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [enabled])
  return { owned, loading }
}
