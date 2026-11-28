import { ApiError } from './api/client'
import type { PlanLimits, PlanUsage } from './api/organizations'

/** The organization's total user seats (owner, moderators, members and invitations still waiting): "3 / 5 users". */
export interface UserSeats { used: number; limit: number | null; remaining: number | null; full: boolean; text: string }

/** `null` when the backend does not report total seats (an older backend): the screens then show nothing extra. */
export function userSeats(usage?: PlanUsage, limits?: PlanLimits): UserSeats | null {
  if (!usage || !limits || typeof usage.users !== 'number' || limits.users === undefined) return null
  const used = usage.users
  const limit = limits.users
  if (limit === null) return { used, limit, remaining: null, full: false, text: `${used} users (no limit)` }
  return { used, limit, remaining: Math.max(limit - used, 0), full: used >= limit, text: `${used} / ${limit} users` }
}

/** "3 / 5 users · 2 left", or the same with "full". Empty when the backend does not say. */
export function seatSummary(usage?: PlanUsage, limits?: PlanLimits): string {
  const seats = userSeats(usage, limits)
  if (!seats) return ''
  if (seats.remaining === null) return seats.text
  return `${seats.text} · ${seats.full ? 'full' : `${seats.remaining} left`}`
}

const UPGRADE_HINT = 'Ask the platform administrator to move the organization to a larger plan, or cancel invitations that are still waiting.'
const DOWNGRADE_HINT = 'Remove people or cancel waiting invitations first, or keep the larger plan. Nobody is removed automatically.'

/** The API's own sentence, plus what to do next when the plan's user limit stopped the action. */
export function planAwareMessage(caught: unknown, fallback: (caught: unknown) => string): string {
  const text = fallback(caught)
  const code = caught instanceof ApiError && caught.body && typeof caught.body === 'object' ? (caught.body as Record<string, unknown>).code : undefined
  if (code === 'plan_limit_reached') return text.includes(UPGRADE_HINT) ? text : `${text} ${UPGRADE_HINT}`
  if (code === 'plan_downgrade_over_capacity') return text.includes(DOWNGRADE_HINT) ? text : `${text} ${DOWNGRADE_HINT}`
  return text
}
