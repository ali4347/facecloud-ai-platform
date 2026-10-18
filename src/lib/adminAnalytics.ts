import { getAnalytics, type AdminAnalytics } from './api/adminSystem'
import { explainReason } from './reasons'
import { useApiResource, type AsyncState } from './useApiResource'
import {
  adminStats, enhancementSuccessData, liveSessionData, mockRejectionStats, mockUploadStats, storageData, uploadTrendData,
} from '../data/mock'

export const RANGES = [7, 30, 90] as const
export type RangeDays = (typeof RANGES)[number]

const isoDay = (d: Date) => d.toISOString().slice(0, 10)

/** The window the admin picked, as the dates the backend takes. It always ends today. */
export function rangeFor(days: RangeDays) {
  const end = new Date()
  const start = new Date(end.getTime() - (days - 1) * 86_400_000)
  return { dateFrom: isoDay(start), dateTo: isoDay(end) }
}

/** "2026-10-18" becomes "Oct 18"; text that is not a date (the demo's own labels) is left as it is. */
export function shortDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  return new Date(`${value}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

/** "2026-10" becomes "Oct 2026". */
export function shortMonth(value: string): string {
  if (!/^\d{4}-\d{2}$/.test(value)) return value
  return new Date(`${value}-01T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
}

/** A percentage that may not exist. Null is a dash, never 0%. */
export const percentOrDash = (value: number | null | undefined) => (value === null || value === undefined ? '—' : `${value}%`)

/** The analytics for a window, from the API or (demo build) from the built-in sample numbers. */
export function useAdminAnalytics(days: RangeDays): AsyncState<AdminAnalytics> {
  return useApiResource(signal => getAnalytics(rangeFor(days), signal), demoAnalytics, [days])
}

/** Uploads, enhanced and rejected per day, merged by date. */
export function trendRows(a: AdminAnalytics) {
  const enhanced = new Map(a.charts.enhancements_per_day.map(d => [d.date, d.count]))
  const rejected = new Map((a.overview?.rejections.per_day ?? []).map(d => [d.date, d.count]))
  return a.charts.uploads_per_day.map(d => ({
    date: shortDate(d.date), uploads: d.count, enhanced: enhanced.get(d.date) ?? 0, rejected: rejected.get(d.date) ?? 0,
  }))
}

const PALETTE = ['#FF8A02', '#EF4444', '#EA580C', '#F97316', '#4FFFB0', '#38BDF8', '#A78BFA', '#FBBF24']

export interface ReasonSlice { code: string; name: string; hint: string; count: number; color: string }

/**
 * The reasons recorded, worded for people. The counts are how often each reason was recorded: a photo can carry
 * several, and a few are review-level reasons, so they do not add up to the number of rejected photos.
 */
export function reasonSlices(a: AdminAnalytics): ReasonSlice[] {
  return a.top_rejection_reasons.map((item, i) => {
    const info = explainReason(item.value)
    return { code: item.value, name: info.title, hint: info.hint, count: item.count, color: PALETTE[i % PALETTE.length] }
  })
}

// ── Demo build only: the built-in sample numbers, in the same shape the API sends ──────────────────────────────

function demoAnalytics(): AdminAnalytics {
  const day = (i: number) => uploadTrendData[i].date
  return {
    range: { from: '', to: '' },
    totals: {
      users: { total: adminStats.totalUsers, verified: adminStats.totalUsers, suspended: 0 },
      batches: 0,
      images: { total: adminStats.totalUploads, accepted: adminStats.totalUploads - adminStats.rejectedImages, rejected: adminStats.rejectedImages },
      enhancements: { total: adminStats.enhancedImages, by_status: { completed: adminStats.enhancedImages } },
      quality_decisions: { total: adminStats.totalUploads, by_decision: {} },
    },
    success_rate_percent: adminStats.successRate,
    average_processing_time_ms: {},
    top_rejection_reasons: mockRejectionStats.reasons.map(r => ({ value: r.name, count: r.value })),
    model_usage: [],
    storage_bytes: { originals: 6.2e9, enhanced_outputs: 5.8e9, total: adminStats.storageUsedGB * 1e9 },
    charts: {
      uploads_per_day: uploadTrendData.map(d => ({ date: d.date, count: d.uploads })),
      enhancements_per_day: uploadTrendData.map(d => ({ date: d.date, count: d.enhanced })),
    },
    overview: {
      uploads: {
        total: mockUploadStats.totalUploads,
        recent: { today: mockUploadStats.uploadsToday, this_week: mockUploadStats.uploadsThisWeek, this_month: mockUploadStats.uploadsThisMonth },
        by_type: { single: mockUploadStats.singleUploadsCount, multiple: mockUploadStats.multipleUploadsCount, zip: mockUploadStats.zipUploadsCount },
        average_file_size_bytes: 1.62 * 1024 * 1024,
        per_day_by_type: mockUploadStats.uploadsPerDay,
      },
      rejections: {
        total: adminStats.rejectedImages, rate_percent: adminStats.rejectionRate,
        per_day: mockRejectionStats.rejectionsPerDay,
      },
      enhancement_success_per_week: enhancementSuccessData.map(w => ({
        week: w.name, completed: w.success, failed: w.failed, success_percent: w.success, failed_percent: w.failed,
      })),
      live_sessions: { total: adminStats.liveSessions, per_day: liveSessionData.map(d => ({ date: d.date, count: d.sessions })) },
      storage: {
        originals_and_outputs_bytes: (6.2 + 5.8) * 1e9, zip_packages_bytes: 2.1e9, camera_snapshots_bytes: 1.2e9,
        capacity_bytes: adminStats.storageTotalGB * 1e9, used_percent: Math.round((adminStats.storageUsedGB / adminStats.storageTotalGB) * 100),
        growth_by_month: storageData.map(m => ({ month: m.name, added_bytes: 0, total_bytes: m.gb * 1e9 })),
      },
      change_vs_previous_period: { uploads_percent: 15, enhancements_percent: 12, rejections_percent: -5, live_sessions_percent: null },
    },
    generated_at: day(0),
  }
}
