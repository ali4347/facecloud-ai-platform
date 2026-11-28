import { useCallback, useEffect, useState } from 'react'
import { USE_API } from './api/config'
import { listOrganizations, type MyOrganization } from './api/organizations'
import { NOTIFICATIONS_CHANGED } from './api/notifications'

/**
 * The shared organizations this person belongs to as a plain member (active membership). Not remembered between screens: an approved leave request
 * ends the membership while the tab is open, so it asks the server again on mount, when a notification arrives, and when the tab is shown again.
 */
export function useMemberOrganizations(enabled = true): { organizations: MyOrganization[]; loading: boolean; reload: () => void } {
  const [organizations, setOrganizations] = useState<MyOrganization[]>([])
  const [loading, setLoading] = useState(USE_API && enabled)
  const load = useCallback(() => {
    if (!USE_API || !enabled) return
    listOrganizations()
      .then(all => setOrganizations(all.filter(o => !o.is_personal && o.membership?.role === 'member' && o.membership.status === 'active')))
      .catch(() => { /* without the list there is simply no member menu */ })
      .finally(() => setLoading(false))
  }, [enabled])
  useEffect(() => {
    load()
    window.addEventListener(NOTIFICATIONS_CHANGED, load)
    const onShow = () => { if (document.visibilityState === 'visible') load() }
    document.addEventListener('visibilitychange', onShow)
    return () => { window.removeEventListener(NOTIFICATIONS_CHANGED, load); document.removeEventListener('visibilitychange', onShow) }
  }, [load])
  return { organizations, loading, reload: load }
}
