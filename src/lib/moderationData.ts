import { useEffect, useMemo, useState } from 'react'
import { USE_API } from './api/config'
import { messageFor, useApiResource, type AsyncState } from './useApiResource'
import { listModeratorTeams } from './api/organizations'
import { getSession } from './session'
import { personCache } from './personCache'
import {
  getDashboard,
  getPerformance,
  listReviews,
  type ModeratorDashboard,
  type ModeratorPerformance,
  type ModeratorReview,
  type ReviewQueueFilters,
} from './api/moderation'
import { mockReviewItems, type ReviewItem } from '../data/mock'

/**
 * Moderator screens over either the real API or the built-in demo data.
 *
 * `VITE_USE_API=false` keeps the panel populated from `mockReviewItems` so the
 * demo still shows a full queue. The mock rows are adapted into the same shape
 * the API returns, so each screen is written once against one type instead of
 * branching on which source it got.
 */

const MOCK_SOURCES = ['quality', 'duplicate', 'identity'] as const

function mockReviewToApiShape(item: ReviewItem, index: number): ModeratorReview {
  const createdAt = new Date(item.uploadedAt)
  // Deadlines the demo can show off: the first few rows run late, the rest are
  // comfortably inside. Derived from the index so a reload looks the same.
  const hoursUntilDue = index === 0 ? -6 : index === 1 ? -1 : index === 2 ? 3 : 18
  const decided = item.status !== 'pending'
  return {
    id: index + 1,
    organization: 1,
    image_id: index + 1,
    image_name: item.filename,
    source: item.isDuplicate ? 'duplicate' : MOCK_SOURCES[index % MOCK_SOURCES.length],
    status: item.status === 'pending' ? 'pending' : item.status,
    ai_recommendation: item.isDuplicate ? 'perceptual' : item.rejectionReason,
    ai_confidence: item.isDuplicate ? (item.similarityScore ?? 0) : item.qualityScore,
    assigned_moderator: null,
    claimed_by: null,
    is_claimed: false,
    claim_expires_at: null,
    due_at: new Date(Date.now() + hoursUntilDue * 3_600_000).toISOString(),
    is_overdue: !decided && hoursUntilDue < 0,
    sla_breached_at: null,
    decision_reason: '',
    decision_notes: '',
    decided_by: null,
    decided_at: decided ? item.uploadedAt : null,
    created_at: createdAt.toISOString(),
    updated_at: createdAt.toISOString(),
  }
}

function mockQueue(): ModeratorReview[] {
  return mockReviewItems.map(mockReviewToApiShape)
}

function applyFilters(reviews: ModeratorReview[], filters: ReviewQueueFilters): ModeratorReview[] {
  let rows = reviews
  if (filters.status) rows = rows.filter(row => row.status === filters.status)
  if (filters.source) rows = rows.filter(row => row.source === filters.source)
  if (filters.overdue) rows = rows.filter(row => row.is_overdue)
  if (filters.assignment === 'unassigned') rows = rows.filter(row => !row.assigned_moderator)
  if (filters.ordering === 'due_at') {
    rows = [...rows].sort((a, b) => {
      if (!a.due_at) return 1
      if (!b.due_at) return -1
      return new Date(a.due_at).getTime() - new Date(b.due_at).getTime()
    })
  }
  return rows
}

const OPEN_STATUSES = new Set(['pending', 'in_review', 'escalated'])

function mockDashboard(): ModeratorDashboard {
  const rows = mockQueue()
  const open = rows.filter(row => OPEN_STATUSES.has(row.status) && !row.decided_at)
  const count = (status: string) => rows.filter(row => row.status === status).length
  const oldest = open.reduce<number | null>((oldestAge, row) => {
    const age = (Date.now() - new Date(row.created_at).getTime()) / 3_600_000
    return oldestAge === null || age > oldestAge ? age : oldestAge
  }, null)
  return {
    pending: count('pending'),
    in_review: count('in_review'),
    escalated: count('escalated'),
    completed_today: 0,
    approved_total: count('approved'),
    rejected_total: count('rejected'),
    corrected_total: count('corrected'),
    overdue: open.filter(row => row.is_overdue).length,
    due_soon: open.filter(row => {
      if (row.is_overdue || !row.due_at) return false
      return (new Date(row.due_at).getTime() - Date.now()) / 3_600_000 <= 4
    }).length,
    unassigned: open.length,
    claimed_now: 0,
    oldest_open_age_hours: oldest === null ? null : Math.round(oldest * 100) / 100,
    sla_hours: 24,
  }
}

function mockPerformance(days: number): ModeratorPerformance {
  const rows = mockQueue().filter(row => row.decided_at)
  return {
    window_days: days,
    since: new Date(Date.now() - days * 86_400_000).toISOString(),
    sla_hours: 24,
    moderators: rows.length
      ? [{
          moderator_id: 1,
          username: 'demo-moderator',
          decided_count: rows.length,
          approved: rows.filter(row => row.status === 'approved').length,
          rejected: rows.filter(row => row.status === 'rejected').length,
          corrected: 0,
          on_time: rows.length,
          late: 0,
          on_time_rate: 1,
          average_decision_hours: 2.4,
          slowest_decision_hours: 6.1,
        }]
      : [],
    totals: {
      decided_count: rows.length,
      on_time: rows.length,
      late: 0,
      on_time_rate: rows.length ? 1 : null,
      average_decision_hours: rows.length ? 2.4 : null,
      open_now: mockQueue().filter(row => OPEN_STATUSES.has(row.status)).length,
      overdue_now: mockQueue().filter(row => row.is_overdue).length,
    },
  }
}

/**
 * The organization every moderator request is scoped to.
 *
 * The teams this person can moderate are fetched once per signed-in person and remembered. A moderator of several teams
 * works in one at a time: the choice is kept in this browser (per person) and changing it makes every moderator screen
 * ask again for the new team's data.
 */
export interface Team { id: number; name: string; brandName: string; accent: string; logoUrl: string | null; scope: 'own_members' | 'organization' | null; /** This person's role there: a moderator decides, an owner only reads. */ role?: 'owner' | 'moderator' | null }
const teamsCache = personCache<Team[]>()
const CHOICE_EVENT = 'fc:moderator-organization'
/** True when someone other than the signed-in moderator holds this review; the server refuses their Release with a 409. */
export function heldByAnother(review: ModeratorReview): boolean {
  if (!review.is_claimed || !review.claimed_by) return false
  const me = (getSession()?.email ?? '').trim().toLowerCase()
  return me !== '' && review.claimed_by.email.trim().toLowerCase() !== me
}

const choiceKey = () => `facecloud:moderator-organization:${getSession()?.email ?? ''}`

function chosenTeam(teams: Team[]): number | null {
  let saved = NaN
  try { saved = Number(localStorage.getItem(choiceKey())) } catch { /* no remembered choice */ }
  return teams.find(team => team.id === saved)?.id ?? teams[0]?.id ?? null
}

/** Work in another of your teams. */
export function chooseModeratorOrganization(id: number): void {
  try { localStorage.setItem(choiceKey(), String(id)) } catch { /* the choice just will not be remembered */ }
  window.dispatchEvent(new Event(CHOICE_EVENT))
}

export function useModeratorOrganization(enabled = true) {
  const [teams, setTeams] = useState<Team[]>(teamsCache.get() ?? [])
  const [organizationId, setOrganizationId] = useState<number | null>(() => { const known = teamsCache.get(); return known ? chosenTeam(known) : null })
  const [resolving, setResolving] = useState(USE_API && enabled && teamsCache.get() === undefined)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!USE_API || !enabled || teamsCache.get() !== undefined) return
    let active = true
    listModeratorTeams()
      .then(found => {
        const list: Team[] = found.map(o => ({ id: o.id, name: o.name, brandName: o.brand_name?.trim() || o.name, accent: o.brand_accent ?? '', logoUrl: o.logo_url ?? null, scope: o.moderator_data_scope ?? null, role: (o as { membership?: { role?: string } }).membership?.role === 'owner' ? 'owner' : 'moderator' }))
        teamsCache.set(list)
        if (!active) return
        setTeams(list)
        setOrganizationId(chosenTeam(list))
      })
      .catch(caught => active && setError(messageFor(caught)))
      .finally(() => active && setResolving(false))
    return () => { active = false }
  }, [enabled])

  useEffect(() => {
    const onChoice = () => setOrganizationId(chosenTeam(teamsCache.get() ?? []))
    window.addEventListener(CHOICE_EVENT, onChoice)
    return () => window.removeEventListener(CHOICE_EVENT, onChoice)
  }, [])

  const team = teams.find(t => t.id === organizationId) ?? null
  return { organizationId, team, teams, resolving, error }
}

/** A moderator resource: the shared loader, plus the organization it needs first. */
export function useModeratorResource<T>(
  load: (organizationId: number, signal: AbortSignal) => Promise<T>,
  demo: () => T,
  dependencies: unknown[],
): AsyncState<T> {
  const { organizationId, resolving, error: organizationError } = useModeratorOrganization()
  const state = useApiResource(
    signal => load(organizationId as number, signal),
    demo,
    [organizationId, ...dependencies],
    { ready: !resolving, skip: organizationId === null },
  )
  return organizationError ? { ...state, error: organizationError, loading: false } : state
}

export function useModeratorDashboard(): AsyncState<ModeratorDashboard> {
  return useModeratorResource(
    (organizationId, signal) => getDashboard(organizationId, signal),
    mockDashboard,
    [],
  )
}

export function useReviewQueue(filters: ReviewQueueFilters): AsyncState<ModeratorReview[]> {
  const key = JSON.stringify(filters)
  const stable = useMemo(() => filters, [key]) // eslint-disable-line react-hooks/exhaustive-deps
  return useModeratorResource(
    (organizationId, signal) => listReviews(organizationId, stable, signal),
    () => applyFilters(mockQueue(), stable),
    [key],
  )
}

export function useModeratorPerformance(days: number): AsyncState<ModeratorPerformance> {
  return useModeratorResource(
    (organizationId, signal) => getPerformance(organizationId, days, signal),
    () => mockPerformance(days),
    [days],
  )
}
