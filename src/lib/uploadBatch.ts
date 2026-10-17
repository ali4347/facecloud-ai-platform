import { useEffect, useState } from 'react'
import { getImage, type BatchProgress, type ImageListItem } from './api/images'
import { useBatchProgress } from './imageData'
import { explainReason, REJECTING_CODES, type ReasonInfo } from './reasons'

/**
 * A batch just uploaded, followed until it stops moving.
 *
 * `progress.images` carries each photo's stage while it runs and its final verdict
 * (accepted, sent to a moderator, rejected, failed) once it has finished.
 */
export function useFinishedBatch(batchId: number | null) {
  const progress = useBatchProgress(batchId)
  return { progress: progress.data as BatchProgress | null, pollError: progress.error, finished: progress.finished }
}

/** Counts of a batch's photos by what became of them. */
export function tally(progress: BatchProgress | null) {
  const rows = progress?.images ?? []
  const count = (status: string) => rows.filter(row => row.status === status).length
  return {
    total: rows.length,
    accepted: count('accepted'),
    inReview: count('needs_review'),
    rejected: count('rejected'),
    failed: count('failed'),
  }
}

export interface ReasonGroup extends ReasonInfo {
  /** The backend's code (or sentence) this group stands for. */
  code: string
  photos: { id: number; name: string }[]
}

/** The reasons found on one photo: quality reasons, the face check's, and any upload-time sentence. */
function reasonsOf(image: ImageListItem): string[] {
  const all = [...new Set([
    ...(image.quality_decision?.rejection_reasons ?? []),
    image.face_validation?.rejection_reason ?? '',
    image.rejection_reason ?? '',
  ].filter(Boolean))]
  /* The backend lists the reasons that rejected a photo together with milder ones that would only have sent
     it to review. For a rejected photo only the rejecting ones are the answer to "why"; for a photo sent to
     review only the milder ones are. Upload-time sentences (unsupported file and so on) always count. */
  const rejecting = (code: string) => REJECTING_CODES.has(code) || /\s/.test(code)
  const wanted = image.display_status === 'rejected' ? all.filter(rejecting) : all.filter(code => !REJECTING_CODES.has(code))
  return wanted.length > 0 ? wanted : all
}

/**
 * Why the photos of a finished batch that were rejected or sent to review were not accepted, grouped so
 * "12 of 40 were too small" is one line rather than twelve. Each such photo is read once from the API,
 * a few at a time.
 */
export function useReasonBreakdown(progress: BatchProgress | null, finished: boolean) {
  const [groups, setGroups] = useState<ReasonGroup[]>([])
  const [loading, setLoading] = useState(false)

  const key = finished && progress
    ? progress.images.filter(row => row.status === 'rejected' || row.status === 'needs_review').map(row => row.image_id).join(',')
    : ''

  useEffect(() => {
    if (!key) { setGroups([]); return }
    const ids = key.split(',').map(Number)
    const ctl = new AbortController()
    setLoading(true)
    ;(async () => {
      const found = new Map<string, ReasonGroup>()
      let next = 0
      const worker = async () => {
        while (next < ids.length && !ctl.signal.aborted) {
          const id = ids[next]; next += 1
          try {
            const image = await getImage(id, ctl.signal)
            const reasons = reasonsOf(image)
            for (const code of reasons.length ? reasons : ['unknown']) {
              const group = found.get(code) ?? {
                code,
                ...(code === 'unknown' ? { title: 'No reason recorded', hint: '' } : explainReason(code)),
                photos: [],
              }
              group.photos.push({ id, name: image.original_name })
              found.set(code, group)
            }
          } catch { /* a photo that cannot be read is simply left out */ }
        }
      }
      await Promise.all(Array.from({ length: Math.min(6, ids.length) }, worker))
      if (!ctl.signal.aborted) {
        setGroups([...found.values()].sort((a, b) => b.photos.length - a.photos.length))
        setLoading(false)
      }
    })()
    return () => ctl.abort()
  }, [key])

  return { groups, loading }
}
