import { useCallback, useEffect, useMemo, useState } from 'react'
import { USE_API } from './api/config'
import { checkDownloadEligibility, type EligibilityItem } from './api/downloads'
import type { ImageListItem } from './api/images'

/** The check takes at most this many images at once (DOWNLOAD_REQUEST_MAX_ITEMS on the server). */
const CHUNK = 100

/**
 * For the photos on screen whose organization requires download approval: what the server says about each one
 * (eligible or why not, and the access already held), and whether that organization has anyone to decide.
 * Photos without approval (a personal workspace, or an organization with it off) are never sent, so for them nothing changes.
 */
export function useDownloadAccess(images: ImageListItem[]) {
  const gated = useMemo(() => images.filter(image => image.download_approval_required && image.organization_id), [images])
  const key = gated.map(image => `${image.organization_id}:${image.id}`).join(',')
  const [access, setAccess] = useState<Map<number, EligibilityItem>>(new Map())
  const [reviewerMissing, setReviewerMissing] = useState<Set<number>>(new Set())
  const [error, setError] = useState('')
  const [token, setToken] = useState(0)
  const refresh = useCallback(() => setToken(n => n + 1), [])

  useEffect(() => {
    if (!USE_API || gated.length === 0) { setAccess(new Map()); setReviewerMissing(new Set()); return }
    const controller = new AbortController()
    const byOrg = new Map<number, number[]>()
    for (const image of gated) byOrg.set(image.organization_id as number, [...(byOrg.get(image.organization_id as number) ?? []), image.id])
    const calls: Promise<{ org: number; reviewer: boolean; items: EligibilityItem[] }>[] = []
    for (const [org, ids] of byOrg) {
      for (let i = 0; i < ids.length; i += CHUNK) {
        const chunk = ids.slice(i, i + CHUNK)
        calls.push(checkDownloadEligibility(org, chunk.map(id => ({ image_id: id })), controller.signal)
          .then(answer => ({ org, reviewer: answer.reviewer_available, items: answer.items })))
      }
    }
    Promise.all(calls)
      .then(results => {
        if (controller.signal.aborted) return
        setAccess(new Map(results.flatMap(result => result.items.map(item => [item.image_id, item] as const))))
        setReviewerMissing(new Set(results.filter(result => !result.reviewer).map(result => result.org)))
        setError('')
      })
      .catch(caught => { if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : 'Could not check download access.') })
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, token])

  const eligibleIds = useMemo(() => gated.filter(image => access.get(image.id)?.eligible).map(image => image.id), [gated, access])
  return { gated, access, eligibleIds, reviewerMissing, error, refresh }
}
