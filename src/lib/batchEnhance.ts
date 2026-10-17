import { listMyImages, type ImageListItem } from './api/images'
import { enhanceImage, getEnhancementResult, isEnhancementSettled } from './api/enhancements'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/** Every photo of a batch, read page by page (the API gives at most 100 at a time). */
export async function listBatchPhotos(batchId: number, signal?: AbortSignal): Promise<ImageListItem[]> {
  const photos: ImageListItem[] = []
  for (let page = 1; page <= 3; page += 1) {
    const chunk = await listMyImages({ page, batch: batchId, pageSize: 100 }, signal)
    photos.push(...chunk.results)
    if (!chunk.next) break
  }
  return photos
}

/** Accepted photos that have no finished enhancement and none in progress. */
export function needsEnhancing(photo: ImageListItem): boolean {
  if (photo.display_status !== 'accepted') return false
  const status = photo.latest_enhancement?.status
  return !status || status === 'failed' || status === 'cancelled'
}

/**
 * Enhance the accepted photos of a batch, one request per photo, a few at a time.
 *
 * This deliberately does not use the backend's whole-batch call: that one enhances every photo of the
 * batch, including the ones that were rejected, which wastes work and leaves enhanced copies of photos
 * that should not have been processed. Three at a time stays well under the per-account limit on
 * enhancements in progress.
 */
export async function enhanceAcceptedPhotos(
  batchId: number,
  onProgress?: (done: number, total: number, failed: number) => void,
  signal?: AbortSignal,
): Promise<{ total: number; failed: number; firstError: string }> {
  const todo = (await listBatchPhotos(batchId, signal)).filter(needsEnhancing)
  let next = 0
  let done = 0
  let failed = 0
  let firstError = ''
  onProgress?.(0, todo.length, 0)

  const worker = async () => {
    while (next < todo.length && !signal?.aborted) {
      const photo = todo[next]; next += 1
      try {
        let result = await enhanceImage(photo.id)
        const deadline = Date.now() + 240_000
        while (!isEnhancementSettled(result)) {
          if (Date.now() > deadline) throw new Error('This photo is taking longer than expected.')
          await sleep(1500)
          result = await getEnhancementResult(result.id)
        }
        if (result.status !== 'completed') throw new Error(result.failure_reason || 'The enhancement did not finish.')
      } catch (caught) {
        failed += 1
        if (!firstError) firstError = caught instanceof Error ? caught.message : 'A photo could not be enhanced.'
      }
      done += 1
      onProgress?.(done, todo.length, failed)
    }
  }
  await Promise.all(Array.from({ length: Math.min(3, todo.length) }, worker))
  return { total: todo.length, failed, firstError }
}
