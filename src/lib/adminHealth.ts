import { getHealth, getQueue, type QueueStatus, type SystemHealth } from './api/adminSystem'
import { useApiResource, type AsyncState } from './useApiResource'
import { mockServices } from '../data/mock'

export interface HealthBundle { health: SystemHealth; queue: QueueStatus | null }

/** How long the process has been up, as "3 d 4 h", "5 h 12 min" or "42 s". */
export function formatUptime(seconds: number): string {
  const s = Math.max(0, Math.round(seconds))
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (d > 0) return `${d} d ${h} h`
  if (h > 0) return `${h} h ${m} min`
  if (m > 0) return `${m} min`
  return `${s} s`
}

/** The backend's short note on a service ("no_workers"), in words; anything else is shown as sent. */
export function serviceNote(detail: string): string {
  const known: Record<string, string> = { no_workers: 'No background worker is running, so jobs wait until one starts.' }
  return known[detail] ?? detail
}

/** Readable names for the queue's job kinds; anything unknown is shown as the backend names it. */
export function jobLabel(key: string): string {
  const known: Record<string, string> = {
    enhancement: 'Enhancement', enhancement_batch: 'Batch enhancement', model_comparison: 'Model comparison',
    gallery_edit: 'Gallery edit', identity_analysis: 'Face grouping', preprocessing: 'Preprocessing',
    upload_batch: 'Upload batch', download_package: 'ZIP download', collage: 'Collage', report: 'Report', identity_export: 'Identity export',
  }
  return known[key] ?? key.replace(/_/g, ' ')
}

/** Health and queue together. The queue is optional: a failure there should not hide the services. */
export function useSystemHealth(): AsyncState<HealthBundle> {
  return useApiResource(async signal => {
    const [health, queue] = await Promise.all([getHealth(signal), getQueue(signal).catch(() => null)])
    return { health, queue }
  }, demoBundle, [])
}

// ── Demo build only ──────────────────────────────────────────────────────────

function demoBundle(): HealthBundle {
  const at = new Date().toISOString()
  return {
    health: {
      status: mockServices.some(s => s.status === 'degraded') ? 'degraded' : 'operational',
      checked_at: at,
      services: mockServices.map(s => ({
        key: s.name, name: s.name, status: s.status === 'outage' ? 'down' : s.status,
        latency_ms: s.latency ? parseInt(s.latency, 10) : null, checked_at: at, detail: '', queue_size: s.queueSize,
      })),
      process: { started_at: at, uptime_seconds: 0 },
    },
    queue: null,
  }
}
