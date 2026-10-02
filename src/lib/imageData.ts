import { useEffect, useRef, useState } from 'react'
import { USE_API } from './api/config'
import {
  getBatchProgress,
  getImage,
  isBatchFinished,
  listBatches,
  listMyImages,
  type BatchProgress,
  type DisplayStatus,
  type ImageListItem,
  type Page,
  type UploadBatch,
} from './api/images'
import { messageFor, useApiResource, type AsyncState } from './useApiResource'
import { mockImages, type ImageRecord } from '../data/mock'

/**
 * The user portal's screens over either the real API or the demo data, in one
 * shape so each screen is written once. Mirrors `moderationData.ts`.
 */

const DEMO_STATUS: Record<string, DisplayStatus> = {
  completed: 'accepted',
  processing: 'processing',
  rejected: 'rejected',
  pending: 'queued',
}

function bytesFromLabel(size: string): number {
  // The demo data stores sizes as "1.4 MB"; the API sends real byte counts.
  const match = /([\d.]+)\s*(KB|MB|GB)/i.exec(size)
  if (!match) return 0
  const scale = { kb: 1024, mb: 1024 ** 2, gb: 1024 ** 3 }[match[2].toLowerCase()] ?? 1
  return Math.round(Number(match[1]) * scale)
}

function demoImage(record: ImageRecord, index: number): ImageListItem {
  const [width, height] = record.dimensions.split('×').map(Number)
  return {
    id: index + 1,
    batch: 1,
    original_name: record.filename,
    file_extension: '.jpg',
    mime_type: 'image/jpeg',
    file_size: bytesFromLabel(record.size),
    width: Number.isFinite(width) ? width : null,
    height: Number.isFinite(height) ? height : null,
    status: record.status === 'rejected' ? 'rejected' : 'uploaded',
    display_status: DEMO_STATUS[record.status] ?? 'accepted',
    rejection_reason: record.rejectionReason ?? '',
    // No server, so no real file behind these: the tiles fall back to a
    // placeholder rather than pretending a download exists.
    download_url: null,
    thumbnail_url: null,
    batch_display_name: 'Demo upload',
    upload_type: 'single',
    quality_decision: {
      decision: record.qualityStatus === 'passed' ? 'accepted' : 'rejected',
      overall_score: record.blurScore,
      sharpness_score: record.blurScore,
      brightness_score: record.brightnessScore,
      contrast_score: record.faceSizeScore,
      exposure_score: record.brightnessScore,
      noise_score: record.blurScore,
      resolution_score: record.faceSizeScore,
      rejection_reasons: record.rejectionReason ? [record.rejectionReason] : [],
      status: 'completed',
    },
    face_validation: {
      decision: record.faceDetected ? 'accepted' : 'rejected',
      face_count: record.faceCount,
    },
    latest_enhancement: record.enhanced
      ? { id: index + 1, status: 'completed', applied_level: 'medium' }
      : null,
    created_at: record.uploadedAt,
    updated_at: record.uploadedAt,
  }
}

export function demoImages(): ImageListItem[] {
  return mockImages.map(demoImage)
}

function demoPage(): Page<ImageListItem> {
  const results = demoImages()
  return { count: results.length, next: null, previous: null, results }
}

export function useMyImages(page = 1, status?: string): AsyncState<Page<ImageListItem>> {
  return useApiResource(
    signal => listMyImages({ page, status }, signal),
    () => {
      const all = demoPage()
      if (!status) return all
      const results = all.results.filter(image => image.display_status === status)
      return { ...all, count: results.length, results }
    },
    [page, status],
  )
}

export function useImage(imageId: number | null): AsyncState<ImageListItem> {
  return useApiResource(
    signal => getImage(imageId as number, signal),
    () => demoImages()[0],
    [imageId],
    { skip: imageId === null },
  )
}

export function useBatches(): AsyncState<UploadBatch[]> {
  return useApiResource(
    signal => listBatches(signal),
    () => [],
    [],
  )
}

/**
 * A batch's progress, refreshed while it is still moving.
 *
 * Polls every `intervalMs` and **stops on a terminal status** rather than
 * running forever: a finished batch does not change again, and a tab left open
 * on a completed upload should not keep talking to the server. The timer is
 * cleared when the screen goes away.
 */
export function useBatchProgress(
  batchId: number | null, intervalMs = 2500,
): AsyncState<BatchProgress> & { finished: boolean } {
  const [progress, setProgress] = useState<BatchProgress | null>(null)
  const [loading, setLoading] = useState(USE_API && batchId !== null)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)
  const finished = isBatchFinished(progress)
  const finishedRef = useRef(finished)
  finishedRef.current = finished

  useEffect(() => {
    if (!USE_API || batchId === null) {
      setLoading(false)
      return
    }
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout> | null = null

    const tick = async () => {
      try {
        const next = await getBatchProgress(batchId, controller.signal)
        if (controller.signal.aborted) return
        setProgress(next)
        setError(null)
        if (!isBatchFinished(next)) timer = setTimeout(tick, intervalMs)
      } catch (caught) {
        if (controller.signal.aborted) return
        setError(messageFor(caught))
        // A failed poll is usually a blip, so keep trying -- but only while the
        // batch could still be moving.
        if (!finishedRef.current) timer = setTimeout(tick, intervalMs * 2)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    tick()
    return () => {
      controller.abort()
      if (timer) clearTimeout(timer)
    }
  }, [batchId, intervalMs, reloadToken])

  return {
    data: progress,
    loading,
    error,
    isDemo: !USE_API,
    reload: () => setReloadToken(token => token + 1),
    finished,
  }
}

const STATUS_LABELS: Record<string, string> = {
  queued: 'Queued',
  processing: 'Processing',
  accepted: 'Accepted',
  rejected: 'Rejected',
  needs_review: 'In review',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
  uploaded: 'Uploaded',
  partial: 'Partly done',
}

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status
}

/** Colour family for a status chip, kept in one place so screens agree. */
export function statusTone(status: string): 'good' | 'bad' | 'warn' | 'busy' | 'neutral' {
  if (status === 'accepted' || status === 'completed') return 'good'
  if (status === 'rejected' || status === 'failed') return 'bad'
  if (status === 'needs_review' || status === 'partial') return 'warn'
  if (status === 'processing' || status === 'queued') return 'busy'
  return 'neutral'
}

export function formatBytes(bytes: number): string {
  if (!bytes) return '--'
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${value < 10 && unit > 0 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`
}
