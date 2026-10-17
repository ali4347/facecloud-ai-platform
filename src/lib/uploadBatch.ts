import type { BatchProgress } from './api/images'
import { useBatchProgress } from './imageData'

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
