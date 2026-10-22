import { ApiError, apiFetch, apiFetchBlob } from './client'

/* The administrator's read-only views of the whole system. Every shape below is what the backend sends
   (backend docs/FRONTEND_API_GUIDE.md section 10); a field the backend does not send is not here. */

export interface DayCount { date: string; count: number }

export interface UploadsOverview {
  total: number
  recent: { today: number; this_week: number; this_month: number }
  by_type: { single: number; multiple: number; zip: number }
  average_file_size_bytes: number | null
  per_day_by_type: { date: string; single: number; multiple: number; zip: number }[]
}
export interface RejectionsOverview { total: number; rate_percent: number | null; per_day: DayCount[] }
export interface WeeklySuccess {
  week: string; completed: number; failed: number; success_percent: number | null; failed_percent: number | null
}
export interface StorageOverview {
  originals_and_outputs_bytes: number
  zip_packages_bytes: number
  /** Already counted inside `originals_and_outputs_bytes`. */
  camera_snapshots_bytes: number
  /** Null on object storage, which has no fixed capacity: hide the gauge then. */
  capacity_bytes: number | null
  used_percent: number | null
  growth_by_month: { month: string; added_bytes: number; total_bytes: number }[]
}
/** Null means there is no earlier period to compare with: show a dash, never 0%. */
export interface ChangeVsPrevious {
  uploads_percent: number | null
  enhancements_percent: number | null
  rejections_percent: number | null
  live_sessions_percent: number | null
}
export interface AnalyticsOverview {
  uploads: UploadsOverview
  rejections: RejectionsOverview
  enhancement_success_per_week: WeeklySuccess[]
  live_sessions: { total: number; per_day: DayCount[] }
  storage: StorageOverview
  change_vs_previous_period: ChangeVsPrevious
}

export interface AdminAnalytics {
  range: { from: string; to: string }
  totals: {
    users: { total: number; verified: number; suspended: number }
    batches: number
    /** `accepted` counts photos not refused at upload, so a photo rejected by its quality decision is still in it. */
    images: { total: number; accepted: number; rejected: number }
    enhancements: { total: number; by_status: Record<string, number> }
    quality_decisions: { total: number; by_decision: Record<string, number> }
  }
  /** The share of quality decisions that were accepted. It is not an enhancement success rate. */
  success_rate_percent: number | null
  average_processing_time_ms: Record<string, number | null>
  /** Reason codes with how often each was recorded; one photo can carry several, and some are review-level reasons. */
  top_rejection_reasons: { value: string; count: number }[]
  model_usage: { value: string; count: number }[]
  storage_bytes: { originals: number; enhanced_outputs: number; total: number }
  charts: { uploads_per_day: DayCount[]; enhancements_per_day: DayCount[] }
  /** Missing on a backend older than PR #86. */
  overview?: AnalyticsOverview
  generated_at?: string
}

export function getAnalytics(range: { dateFrom?: string; dateTo?: string } = {}, signal?: AbortSignal): Promise<AdminAnalytics> {
  const query = new URLSearchParams()
  if (range.dateFrom) query.set('date_from', range.dateFrom)
  if (range.dateTo) query.set('date_to', range.dateTo)
  const suffix = query.toString() ? `?${query}` : ''
  return apiFetch<AdminAnalytics>(`/api/system/analytics/${suffix}`, { signal })
}

// ── Audit log ────────────────────────────────────────────────────────────────

export interface AuditRow {
  source: string
  id: number
  category: string
  event: string
  /** The address, recorded for sign-ins only. */
  ip_address: string | null
  created_at: string
  actor: { id: number; username: string; role: string } | null
  /** The username, or the typed identifier for a failed sign-in by someone unknown. */
  actor_name: string
  actor_role: string | null
  type: string
  status: 'success' | 'warning' | 'error' | 'info'
  message: string
  resource: string
}
export interface AuditPage {
  page: number; page_size: number; has_next: boolean; results: AuditRow[]
  /** True when the backend is older than PR #86: rows were worded here from category and event. */
  legacy?: boolean
}

/** `q` searches the whole trail on the server (actor, event, category); a backend older than that ignores it. */
export async function getAudit(page: number, pageSize: number, signal?: AbortSignal, q = ''): Promise<AuditPage> {
  const search = q ? `&q=${encodeURIComponent(q)}` : ''
  const data = await apiFetch<AuditPage>(`/api/system/audit/?page=${page}&page_size=${pageSize}${search}`, { signal })
  const rows = Array.isArray(data.results) ? data.results : []
  // A backend older than PR #86 sends the raw event only (no actor_name, message, status, resource).
  const legacy = rows.some(r => r.message === undefined)
  if (!legacy) return { ...data, results: rows }
  const words = (v: string) => v.replace(/_/g, ' ')
  return {
    ...data, legacy: true,
    results: rows.map(r => {
      const raw = r as Partial<AuditRow> & { identifier?: string }
      return {
        ...r,
        actor_name: raw.actor_name ?? raw.actor?.username ?? raw.identifier ?? 'Unknown',
        actor_role: raw.actor_role ?? raw.actor?.role ?? null,
        type: raw.type ?? r.category,
        status: raw.status ?? 'info',
        message: raw.message ?? `${words(r.category)}: ${words(r.event)}`,
        resource: raw.resource ?? '',
      }
    }),
  }
}

// ── Security alerts ──────────────────────────────────────────────────────────

export interface SecurityAlertRow {
  id: number
  rule: string
  type: 'failed_login' | 'authorization_failure' | 'rate_limit' | string
  /** Only "medium" and "high" exist; the backend has no low or critical. */
  risk: 'medium' | 'high' | string
  status: 'open' | 'acknowledged' | string
  message: string
  ip_address: string | null
  event_count: number
  threshold: number
  window_minutes: number
  first_seen_at: string
  last_seen_at: string
  acknowledged_at: string | null
  acknowledgement_note: string
}
export interface SecurityRules {
  window_minutes: number
  failed_login_threshold: number
  authorization_failure_threshold: number
  rate_limit_threshold: number
  event_retention_days: number
}

interface MaybePaged<T> { results?: T[] }

export async function listAlerts(signal?: AbortSignal): Promise<SecurityAlertRow[]> {
  const data = await apiFetch<SecurityAlertRow[] | MaybePaged<SecurityAlertRow>>('/api/system/security/alerts/?page_size=100', { signal })
  return Array.isArray(data) ? data : data.results ?? []
}
export function getSecurityRules(signal?: AbortSignal): Promise<SecurityRules> {
  return apiFetch<SecurityRules>('/api/system/security/rules/', { signal })
}
export function acknowledgeAlert(id: number, note: string): Promise<SecurityAlertRow> {
  return apiFetch<SecurityAlertRow>(`/api/system/security/alerts/${id}/acknowledge/`, { body: { note } })
}

// ── Health and queues ────────────────────────────────────────────────────────

export interface ServiceRow {
  key: string
  name: string
  status: 'operational' | 'degraded' | 'down' | string
  latency_ms: number | null
  checked_at: string
  detail: string
  /** Only on "celery". Null means the job counts could not be read. */
  queue_size?: number | null
  workers?: number
  /** Only on "storage". */
  available_bytes?: number
}
export interface SystemHealth {
  status: string
  checked_at: string
  services: ServiceRow[]
  process: { started_at: string; uptime_seconds: number } | null
  /** True when the backend is older than PR #86: services were read from its `checks` object. */
  legacy?: boolean
}

const SERVICE_NAMES: Record<string, string> = {
  api: 'API', database: 'Database', redis: 'Cache and message broker', celery: 'Background workers',
  storage: 'File storage', email: 'Email', models: 'AI models',
}
const LEGACY_STATUS: Record<string, string> = { healthy: 'operational', degraded: 'degraded', unhealthy: 'down', unavailable: 'down', down: 'down', disabled: 'degraded' }

type HealthBody = SystemHealth & { checks?: Record<string, { status: string; latency_ms?: number; code?: string; workers?: number; available_bytes?: number }> }

export async function getHealth(signal?: AbortSignal): Promise<SystemHealth> {
  let data: HealthBody
  try {
    data = await apiFetch<HealthBody>('/api/system/health/', { signal })
  } catch (caught) {
    // A required service (the database, Redis, storage) being down answers 503 *with* the full list of checks. That list is exactly
    // what the administrator needs, so show it instead of an error whose only text is the word "unavailable".
    const body = caught instanceof ApiError && caught.status === 503 ? (caught.body as Partial<HealthBody> | null) : null
    if (body && typeof body === 'object' && (Array.isArray(body.services) || body.checks)) data = body as HealthBody
    else throw caught
  }
  if (Array.isArray(data.services)) return { ...data, process: data.process ?? null }
  const checks = data.checks ?? {}
  return {
    status: LEGACY_STATUS[data.status] ?? data.status, checked_at: data.checked_at, process: null, legacy: true,
    services: Object.entries(checks).map(([key, c]) => ({
      key, name: SERVICE_NAMES[key] ?? key, status: LEGACY_STATUS[c.status] ?? c.status, latency_ms: c.latency_ms ?? null,
      checked_at: data.checked_at, detail: c.code ?? '',
      ...(c.workers !== undefined ? { workers: c.workers } : {}),
      ...(c.available_bytes !== undefined ? { available_bytes: c.available_bytes } : {}),
    })),
  }
}

export interface QueueCounts {
  queued: number; processing: number; stale: number; oldest_active_age_seconds: number | null; failed_total: number
}
export interface QueueStatus {
  generated_at: string
  processing_stale_after_seconds: number
  jobs: Record<string, QueueCounts>
}
export function getQueue(signal?: AbortSignal): Promise<QueueStatus> {
  return apiFetch<QueueStatus>('/api/system/queue/', { signal })
}

// ── Every photo, for the administrator ───────────────────────────────────────

export interface SystemImageRow {
  id: number
  original_name: string
  owner: { id: number; username: string; email: string }
  batch: number
  /** Whether the file arrived ("uploaded") or was refused at upload. The verdict is `quality.decision`. */
  status: string
  rejection_reason: string
  file_extension: string
  mime_type: string
  file_size: number
  width: number | null
  height: number | null
  created_at: string
  quality: {
    status: string
    /** accepted | rejected | needs_review, or null while the check has not finished. */
    decision: string | null
    overall_score: number | null
    sharpness_score: number | null
    brightness_score: number | null
  } | null
  latest_enhancement: {
    id: number; status: string; requested_level: string; applied_level: string; algorithm: string; identity_status: string | null
    created_at: string; finished_at: string | null
  } | null
}
export interface SystemImageDetail extends SystemImageRow {
  face_validation: { decision?: string; face_count?: number; rejection_reason?: string; message?: string } | null
  /** How many earlier photos this one matched; a count, not a list. */
  duplicate_matches: number
  enhancements: { id: number; status: string; applied_level: string; algorithm?: string; created_at: string }[]
}
export interface Paged<T> { count: number; next: string | null; previous: string | null; results: T[] }

export function listSystemImages(page: number, pageSize: number, signal?: AbortSignal): Promise<Paged<SystemImageRow>> {
  return apiFetch<Paged<SystemImageRow>>(`/api/system/images/?page=${page}&page_size=${pageSize}`, { signal })
}
export function getSystemImage(id: number, signal?: AbortSignal): Promise<SystemImageDetail> {
  return apiFetch<SystemImageDetail>(`/api/system/images/${id}/`, { signal })
}
/** The photo's preview, behind the token like every other file. */
export function getSystemImagePreview(id: number, signal?: AbortSignal): Promise<Blob> {
  return apiFetchBlob(`/api/system/images/${id}/preview/`, { signal })
}
