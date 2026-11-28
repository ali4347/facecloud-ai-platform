import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ApiError } from '../lib/api/client'
import type { LeaveRequest } from '../lib/api/leave'
import type { MyOrganization } from '../lib/api/organizations'

vi.mock('../lib/api/config', () => ({ API_URL: 'http://api.test', USE_API: true }))
const getMine = vi.fn()
const ask = vi.fn()
const cancel = vi.fn()
const list = vi.fn()
const decide = vi.fn()
vi.mock('../lib/api/leave', async importOriginal => ({
  ...(await importOriginal<object>()),
  getMyLeaveRequest: (...a: unknown[]) => getMine(...a),
  requestToLeave: (...a: unknown[]) => ask(...a),
  cancelLeaveRequest: (...a: unknown[]) => cancel(...a),
  listLeaveRequests: (...a: unknown[]) => list(...a),
  decideLeaveRequest: (...a: unknown[]) => decide(...a),
}))
const orgs = vi.fn()
vi.mock('../lib/api/organizations', async importOriginal => ({
  ...(await importOriginal<object>()),
  listOrganizations: (...a: unknown[]) => orgs(...a),
  // the real one calls its own listOrganizations binding, which the mock above cannot reach
  listModeratorTeams: async () => ((await orgs()) as MyOrganization[]).filter(o => !o.is_personal && o.status === 'active' && o.membership?.status === 'active' && (o.membership.role === 'moderator' || o.membership.role === 'owner')),
}))
vi.mock('../lib/personCache', () => {
  const caches = new Set<{ clear: () => void }>()
  return {
    personCache: <T,>() => { let v: T | undefined; const c = { get: () => v, set: (n: T) => { v = n }, clear: () => { v = undefined } }; caches.add(c); return c },
    forgetPersonCaches: () => caches.forEach(c => c.clear()),
  }
})

import MemberOrganization, { OrganizationAccessEnded } from '../pages/user/MemberOrganization'
import LeaveRequests from '../pages/moderator/LeaveRequests'
import { resolveNotificationPath } from '../lib/api/notifications'
import { notificationKind } from '../lib/notificationKinds'
import { leaveSentence } from '../lib/leave'
import { forgetPersonCaches } from '../lib/personCache'

const myOrg = (over: Partial<MyOrganization> = {}): MyOrganization => ({
  id: 3, name: 'Event Planners', slug: 'event-planners', status: 'active', plan: 'team', is_personal: false, created_at: '2026-11-27T10:00:00Z', updated_at: '2026-11-27T10:00:00Z',
  membership: { id: 9, role: 'member', status: 'active' }, capabilities: {}, ...over,
})
const leave = (over: Partial<LeaveRequest> = {}): LeaveRequest => ({
  id: 7, organization_id: 3, organization_name: 'Event Planners', member: { id: 21, username: 'sam', full_name: 'Sam Rao', email: 'sam@example.com' },
  status: 'pending', reason: 'Changing teams', submitted_at: '2026-11-28T09:00:00Z', reviewed_by: null, decided_at: null, decision_reason: '', admin_override: false,
  membership_status: 'active', ...over,
})
const body = (code: string, detail = 'x') => ({ detail, code })
const page = (el: React.ReactNode) => render(<MemoryRouter>{el}</MemoryRouter>)

beforeEach(() => { for (const f of [getMine, ask, cancel, list, decide, orgs]) f.mockReset(); forgetPersonCaches() })

describe('member: Request to Leave Organization', () => {
  it('is offered to a member only: the owner, the moderator and the personal workspace get no card', async () => {
    orgs.mockResolvedValue([
      myOrg({ id: 1, name: 'Mine As Owner', membership: { id: 1, role: 'owner', status: 'active' } }),
      myOrg({ id: 2, name: 'Mod Here', membership: { id: 2, role: 'moderator', status: 'active' } }),
      myOrg({ id: 4, name: 'My personal', is_personal: true, membership: { id: 4, role: 'owner', status: 'active' } }),
      myOrg({ id: 3, name: 'Event Planners' }),
    ])
    getMine.mockResolvedValue(null)
    page(<MemberOrganization />)
    expect(await screen.findByTestId('member-org-3')).toBeTruthy()
    expect(await screen.findAllByRole('button', { name: 'Request to Leave Organization' })).toHaveLength(1)
    expect(screen.queryByTestId('member-org-1')).toBeNull(); expect(screen.queryByTestId('member-org-2')).toBeNull(); expect(screen.queryByTestId('member-org-4')).toBeNull()
    expect(getMine).toHaveBeenCalledTimes(1); expect(getMine.mock.calls[0][0]).toBe(3)
  })

  it('confirms with what happens, sends the optional reason, then shows the pending card and no second request button', async () => {
    orgs.mockResolvedValue([myOrg()]); getMine.mockResolvedValue(null); ask.mockResolvedValue(leave())
    page(<MemberOrganization />)
    fireEvent.click(await screen.findByRole('button', { name: 'Request to Leave Organization' }))
    const dialog = await screen.findByRole('alertdialog')
    for (const text of [/goes to the organization’s moderator/, /keep your access until the moderator approves/, /Approval suspends your access/, /files and records stay stored securely/, /personal FaceCloud workspace is not affected/]) expect(within(dialog).getByText(text)).toBeTruthy()
    fireEvent.change(within(dialog).getByLabelText(/Reason/), { target: { value: '  Changing teams ' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Send request' }))
    await waitFor(() => expect(ask).toHaveBeenCalledWith(3, '  Changing teams '))
    expect(await screen.findByText('Leave Request Pending Moderator Approval')).toBeTruthy()
    expect(screen.getByText(/Your reason: “Changing teams”/)).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Request to Leave Organization' })).toBeNull()      // duplicates are not offered
    expect(screen.getByRole('button', { name: 'Cancel request' })).toBeTruthy()
  })

  it('refuses a reason over 500 characters before sending', async () => {
    orgs.mockResolvedValue([myOrg()]); getMine.mockResolvedValue(null)
    page(<MemberOrganization />)
    fireEvent.click(await screen.findByRole('button', { name: 'Request to Leave Organization' }))
    fireEvent.change(await screen.findByLabelText(/Reason/), { target: { value: 'x'.repeat(501) } })
    expect((screen.getByRole('button', { name: 'Send request' }) as HTMLButtonElement).disabled).toBe(true)
    expect(ask).not.toHaveBeenCalled()
  })

  it('cancels a pending request and can ask again', async () => {
    orgs.mockResolvedValue([myOrg()]); getMine.mockResolvedValue(leave()); cancel.mockResolvedValue(leave({ status: 'cancelled' }))
    page(<MemberOrganization />)
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel request' }))
    expect(await screen.findByText(/Your request was cancelled/)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Request to Leave Organization' })).toBeTruthy()
  })

  it('explains a cancel that lost the race (409 leave_request_not_pending) and shows the real state', async () => {
    orgs.mockResolvedValue([myOrg()])
    getMine.mockResolvedValueOnce(leave()).mockResolvedValueOnce(leave({ status: 'denied', decision_reason: 'We need you this month', decided_at: '2026-11-28T10:00:00Z' }))
    cancel.mockRejectedValue(new ApiError(409, 'not pending', body('leave_request_not_pending')))
    page(<MemberOrganization />)
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel request' }))
    expect(await screen.findByText(/already decided this request, so it could not be cancelled/)).toBeTruthy()
    expect(await screen.findByTestId('leave-denied')).toBeTruthy()
    expect(screen.getByText(/Moderator’s reason: “We need you this month”/)).toBeTruthy()
  })

  it('shows a denied request with its reason, and an approved one as suspended access', async () => {
    orgs.mockResolvedValue([myOrg()]); getMine.mockResolvedValue(leave({ status: 'denied', decision_reason: 'Please finish the event first' }))
    const first = page(<MemberOrganization />)
    expect(await screen.findByText(/Moderator’s reason: “Please finish the event first”/)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Request to Leave Organization' })).toBeTruthy()        // may ask again
    first.unmount()
    getMine.mockResolvedValue(leave({ status: 'approved' }))
    page(<MemberOrganization />)
    expect(await screen.findByTestId('leave-approved')).toBeTruthy()
    expect(screen.getByText(/Your personal workspace is not affected/)).toBeTruthy()
  })

  it('turns the API refusals into clear sentences', async () => {
    orgs.mockResolvedValue([myOrg()]); getMine.mockResolvedValue(null)
    for (const [code, expected] of [['no_eligible_reviewer', /No moderator is available/], ['leave_request_pending', /already have a leave request waiting/], ['leave_not_available', /owner and the moderators cannot ask to leave/]] as const) {
      ask.mockRejectedValueOnce(new ApiError(409, 'raw', body(code)))
      const view = page(<MemberOrganization />)
      fireEvent.click(await screen.findByRole('button', { name: 'Request to Leave Organization' }))
      fireEvent.click(await screen.findByRole('button', { name: 'Send request' }))
      expect(await screen.findByText(expected)).toBeTruthy()
      view.unmount()
    }
    expect(leaveSentence(new ApiError(403, 'raw', body('personal_workspace_is_private')), 'f')).toMatch(/nothing to leave/)
    expect(leaveSentence(new Error('boom'), 'fallback')).toBe('boom')
  })

  it('a 404 (access already ended) shows the calm explanation instead of an error', async () => {
    orgs.mockResolvedValue([myOrg()]); getMine.mockRejectedValue(new ApiError(404, 'Not found.', { detail: 'Not found.' }))
    page(<MemberOrganization />)
    expect(await screen.findByTestId('org-access-ended')).toBeTruthy()
    expect(screen.queryByRole('alert')).toBeNull()
  })
})

describe('organization access ended', () => {
  it('is calm, grants nothing organizational and points to the personal workspace', () => {
    page(<OrganizationAccessEnded />)
    expect(screen.getByText('You have no organization access right now')).toBeTruthy()
    expect(screen.getByText(/own photos, albums, person folders and sign-in are exactly as you left them/)).toBeTruthy()
    expect(screen.getByRole('link', { name: /personal photos/ }).getAttribute('href')).toBe('/dashboard/images')
    expect(screen.queryByRole('button')).toBeNull()
  })
  it('shows it when the member list is empty (the organization is gone from GET /api/organizations/)', async () => {
    orgs.mockResolvedValue([myOrg({ id: 4, is_personal: true, name: 'mine', membership: { id: 4, role: 'owner', status: 'active' } })])
    page(<MemberOrganization />)
    expect(await screen.findByTestId('org-access-ended')).toBeTruthy()
  })
})

describe('moderator: Membership Leave Requests', () => {
  const moderatorOrgs = (role: 'moderator' | 'owner') => orgs.mockResolvedValue([myOrg({ membership: { id: 5, role, status: 'active' } })])

  it('lists pending requests by default with member, email, organization, date, reason and status', async () => {
    moderatorOrgs('moderator'); list.mockResolvedValue([leave(), leave({ id: 8, member: { id: 22, username: 'ana', full_name: '', email: 'ana@example.com' }, reason: '' })])
    page(<LeaveRequests />)
        const row = await screen.findByTestId('leave-row-7')
    for (const text of ['Sam Rao', 'sam@example.com', 'Event Planners', '“Changing teams”', 'Pending']) expect(within(row).getByText(new RegExp(text.replace(/[“”]/g, '.')))).toBeTruthy()
    expect(list.mock.calls[0][1]).toBe('pending')
    expect(screen.getByTestId('leave-row-8').textContent).toContain('ana')
    fireEvent.click(screen.getByRole('button', { name: 'Denied' }))
    await waitFor(() => expect(list.mock.calls.at(-1)?.[1]).toBe('denied'))
  })

  it('approves after a confirmation that says access is suspended, and refreshes', async () => {
    moderatorOrgs('moderator'); list.mockResolvedValue([leave()]); decide.mockResolvedValue(leave({ status: 'approved' }))
    page(<LeaveRequests />)
    fireEvent.click(await screen.findByRole('button', { name: 'Approve & Suspend Access' }))
    const dialog = await screen.findByRole('alertdialog')
    expect(within(dialog).getByText(/Their membership is suspended/)).toBeTruthy()
    expect(within(dialog).getByText(/Nothing is deleted/)).toBeTruthy()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Approve & Suspend Access' }))
    await waitFor(() => expect(decide).toHaveBeenCalledWith(3, 7, 'approve', ''))
    expect(await screen.findByText(/organization access is suspended\. Nothing was deleted/)).toBeTruthy()
    await waitFor(() => expect(list.mock.calls.length).toBeGreaterThan(1))
  })

  it('denies only with a reason of at least 3 characters', async () => {
    moderatorOrgs('moderator'); list.mockResolvedValue([leave()]); decide.mockResolvedValue(leave({ status: 'denied' }))
    page(<LeaveRequests />)
    fireEvent.click(await screen.findByRole('button', { name: 'Deny Request' }))
    const dialog = await screen.findByRole('alertdialog')
    const confirm = within(dialog).getByRole('button', { name: 'Deny Request' }) as HTMLButtonElement
    expect(confirm.disabled).toBe(true)
    fireEvent.change(within(dialog).getByLabelText(/Reason/), { target: { value: 'ab' } })
    expect(confirm.disabled).toBe(true)
    fireEvent.change(within(dialog).getByLabelText(/Reason/), { target: { value: ' Busy week ' } })
    expect(confirm.disabled).toBe(false)
    fireEvent.click(confirm)
    await waitFor(() => expect(decide).toHaveBeenCalledWith(3, 7, 'deny', ' Busy week '))
  })

  it('explains a 409 (already decided or cancelled) and a 403 moderator_required', async () => {
    moderatorOrgs('moderator'); list.mockResolvedValue([leave()])
    decide.mockRejectedValueOnce(new ApiError(409, 'raw', body('leave_request_not_pending')))
    page(<LeaveRequests />)
    fireEvent.click(await screen.findByRole('button', { name: 'Approve & Suspend Access' }))
    fireEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Approve & Suspend Access' }))
    expect(await screen.findByText(/already decided or cancelled, so nothing changed/)).toBeTruthy()
    decide.mockRejectedValueOnce(new ApiError(403, 'raw', body('moderator_required')))
    fireEvent.click(await screen.findByRole('button', { name: 'Approve & Suspend Access' }))
    fireEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Approve & Suspend Access' }))
    expect(await screen.findByText(/Only an organization moderator can decide leave requests/)).toBeTruthy()
  })

  it('shows the owner a read-only list: no decision buttons', async () => {
    moderatorOrgs('owner'); list.mockResolvedValue([leave()])
    page(<LeaveRequests />)
    expect(await screen.findByTestId('leave-readonly')).toBeTruthy()
    expect(screen.getByTestId('leave-row-7')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Approve & Suspend Access' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Deny Request' })).toBeNull()
  })

  it('shows an empty state when nothing is pending', async () => {
    moderatorOrgs('moderator'); list.mockResolvedValue([])
    page(<LeaveRequests />)
    expect(await screen.findByText('Nothing to decide')).toBeTruthy()
  })
})

describe('notifications for the five leave_request_* events', () => {
  it('the backend links lead somewhere: the moderator list and the member organization page', () => {
    expect(resolveNotificationPath('/moderator/leave-requests')).toBe('/moderator/leave-requests')
    expect(resolveNotificationPath('/dashboard/organization')).toBe('/dashboard/organization')
    expect(resolveNotificationPath('/dashboard/organization?x=1')).toBe('/dashboard/organization?x=1')
    expect(resolveNotificationPath('/somewhere/else')).toBeNull()
  })
  it('each type has its own label and icon instead of the generic notice', () => {
    for (const type of ['leave_request_submitted', 'leave_request_received', 'leave_request_approved', 'leave_request_denied', 'leave_request_cancelled'])
      expect(notificationKind(type).label).toBe('Leave request')
    expect(notificationKind('something_new').label).toBe('Notice')
  })
})
