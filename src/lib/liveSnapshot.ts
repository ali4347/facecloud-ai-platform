import {
  getBatchProgress, getImage, isBatchFinished, uploadSingle,
  type ImageListItem,
} from './api/images'
import { uploadCameraSnapshot } from './api/camera'
import {
  ENHANCE_WAIT_MS, downloadEnhanced, enhanceImage, getEnhancementResult, isEnhancementSettled,
  type EnhancementLevel, type EnhancementLighting, type EnhancementResult, type EnhancementStyle,
} from './api/enhancements'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/** The steps shown while a captured frame goes through the real pipeline. */
export const LIVE_SNAPSHOT_STEPS = [
  { label: 'Uploading your frame', icon: '📤' },
  { label: 'Checking face and quality', icon: '🔍' },
  { label: 'Enhancing the whole image', icon: '✨' },
  { label: 'Preparing the result', icon: '🖼️' },
]

/** A captured frame as a high-quality JPEG file, ready to upload. */
export function dataUrlToJpegFile(dataUrl: string, name: string): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('Could not read the captured frame.')); return }
      ctx.drawImage(img, 0, 0)
      canvas.toBlob(
        blob => (blob ? resolve(new File([blob], name, { type: 'image/jpeg' })) : reject(new Error('Could not encode the captured frame.'))),
        'image/jpeg', 0.95,
      )
    }
    img.onerror = () => reject(new Error('Could not read the captured frame.'))
    img.src = dataUrl
  })
}

/**
 * Upload the frame and wait until the pipeline has judged it. The photo is stored in My Images from here on.
 * With a camera session the frame is saved into it (so the session counts its snapshots); without one it is a plain upload.
 */
export async function submitSnapshot(file: File, cameraSessionId?: string | null): Promise<ImageListItem> {
  const batch = cameraSessionId ? (await uploadCameraSnapshot(cameraSessionId, file)).batch : await uploadSingle(file)
  const deadline = Date.now() + 180_000
  for (;;) {
    const progress = await getBatchProgress(batch.id)
    if (isBatchFinished(progress)) {
      const imageId = progress.images[0]?.image_id
      if (!imageId) throw new Error(progress.status === 'failed' ? 'The frame could not be processed.' : 'The frame was not stored.')
      return getImage(imageId)
    }
    if (Date.now() > deadline) throw new Error('Processing is taking longer than expected. Check My Images in a minute.')
    await sleep(1500)
  }
}

export interface SnapshotEnhancement {
  result: EnhancementResult
  /** The enhanced photo, at the size the backend produced. */
  blob: Blob
}

/** Enhance a stored photo with the chosen style and strength, and fetch the finished file. */
export async function enhanceStoredPhoto(
  imageId: number, style: EnhancementStyle, level: EnhancementLevel, lighting: EnhancementLighting = 'auto',
): Promise<SnapshotEnhancement> {
  let result = await enhanceImage(imageId, { style, level, lighting })
  const deadline = Date.now() + ENHANCE_WAIT_MS
  while (!isEnhancementSettled(result)) {
    if (Date.now() > deadline) throw new Error('The enhancement is taking longer than expected.')
    await sleep(1500)
    result = await getEnhancementResult(result.id)
  }
  if (result.status !== 'completed') throw new Error(result.failure_reason || 'The enhancement did not finish.')
  return { result, blob: await downloadEnhanced(result.id) }
}

/** Plain words for a backend reason code such as "face_too_small". */
export function reasonText(code: string): string {
  const text = code.replace(/_/g, ' ').trim()
  return text.charAt(0).toUpperCase() + text.slice(1)
}
