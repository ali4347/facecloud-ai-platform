import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ApiError } from '../lib/api/client'
import type { AdminOrganization } from '../lib/api/adminOrganizations'
import type { OrganizationDetail } from '../lib/api/organizations'
import { planAwareMessage, seatSummary, userSeats } from '../lib/seats'

vi.mock('../lib/api/config', () => ({ API_URL: 'http://api.test', USE_API: true }))
const list = vi.fn()
const update = vi.fn()
vi.mock('../lib/api/adminOrganizations', async importOriginal => ({
  ...(await importOriginal<object>()),
  listAdminOrganizations: (...a: unknown[]) => list(...a),
  updateAdminOrganization: (...a: unknown[]) => update(...a),
}))
const getOrganization = vi.fn()
const invite = vi.fn()
vi.mock('../lib/api/organizations', async importOriginal => ({
  ...(await importOriginal<object>()),
  getOrganization: (...a: unknown[]) => getOrganization(...a),
  listOrgMembers: async () => [],
  listOrgInvitations: async () => [],
  inviteOrgMember: (...a: unknown[]) => invite(...a),
}))
vi.mock('../lib/api/moderatorConsole', async importOriginal => ({
  ...(await importOriginal<object>()),
  listOrgAuditPage: async () => ({ results: [], next: null }),
}))
vi.mock('../lib/useOwnedOrganizations', () => ({
  useOwnedOrganizations: () => ({ owned: [{ id: 7, name: 'Event Planners', slug: 'event-planners', plan: 'team', status: 'active' }], loading: false }),
}))

import Organizations from '../pages/admin/Organizations'
import MyOrganization from '../pages/user/MyOrganization'

const adminOrg = (over: Partial<AdminOrganization> = {}): AdminOrganization => ({
  id: 7, name: 'Event Planners', slug: 'event-planners', status: 'active', plan: 'team', is_personal: false, created_at: '2026-11-27T10:00:00Z',
  updated_at: '2026-11-27T10:00:00Z', owner: { id: 3, username: 'boss' }, member_count: 4, ...over,
})
const detail = (over: Partial<OrganizationDetail> = {}): OrganizationDetail => ({
  id: 7, name: 'Event Planners', slug: 'event-planners', plan: 'team', status: 'active', is_personal: false, member_count: 3, moderator_count: 1,
  moderator_data_scope: 'own_members', created_at: '2026-11-27T10:00:00Z', updated_at: '2026-11-27T10:00:00Z', ...over,
} as OrganizationDetail)

beforeEach(() => { for (const f of [list, update, getOrganization, invite]) f.mockReset() })

describe('user seats (total people the plan allows)', () => {
  it('reads used / max for the three plans and what is left', () => {
    expect(seatSummary({ moderators: 0, members: 2, users: 3 }, { moderators: 1, members: 10, users: 5 })).toBe('3 / 5 users · 2 left')
    expect(seatSummary({ moderators: 1, members: 10, users: 12 }, { moderators: 5, members: 100, users: 25 })).toBe('12 / 25 users · 13 left')
    expect(seatSummary({ moderators: 9, members: 40, users: 57 }, { moderators: null, members: null, users: 100 })).toBe('57 / 100 users · 43 left')
  })
  it('says full at the limit and never goes negative above it', () => {
    expect(userSeats({ moderators: 0, members: 4, users: 5 }, { moderators: 1, members: 10, users: 5 })).toMatchObject({ full: true, remaining: 0 })
    expect(userSeats({ moderators: 0, members: 4, users: 7 }, { moderators: 1, members: 10, users: 5 })).toMatchObject({ full: true, remaining: 0, text: '7 / 5 users' })
  })
  it('shows no limit wording when the plan has none, and nothing at all from an older backend', () => {
    expect(seatSummary({ moderators: 0, members: 0, users: 9 }, { moderators: null, members: null, users: null })).toBe('9 users (no limit)')
    expect(userSeats({ moderators: 1, members: 1 }, { moderators: 5, members: 100 })).toBeNull()
    expect(userSeats(undefined, undefined)).toBeNull()
    expect(seatSummary({ moderators: 1, members: 1 }, { moderators: 5, members: 100 })).toBe('')
  })
  it('adds what to do next to the plan-limit refusals, once, and leaves other errors alone', () => {
    const limit = new ApiError(403, 'Your plan allows 5 users.', { detail: 'Your plan allows 5 users.', code: 'plan_limit_reached' })
    const first = planAwareMessage(limit, e => (e as Error).message)
    expect(first).toContain('Your plan allows 5 users.')
    expect(first).toContain('larger plan')
    expect(planAwareMessage(new ApiError(403, first, { code: 'plan_limit_reached' }), e => (e as Error).message)).toBe(first)
    const down = planAwareMessage(new ApiError(400, 'The organization has 12 users; Free allows 5.', { code: 'plan_downgrade_over_capacity' }), e => (e as Error).message)
    expect(down).toContain('has 12 users')
    expect(down).toContain('Nobody is removed automatically')
    expect(planAwareMessage(new ApiError(400, 'Enter a valid email address.', { code: 'invalid' }), e => (e as Error).message)).toBe('Enter a valid email address.')
  })
})

describe('admin organizations table', () => {
  it('shows "used / max users" under the plan, with the remaining seats and a limit-reached marker', async () => {
    list.mockResolvedValue([
      adminOrg({ id: 1, name: 'Studio Free', plan: 'free', usage: { moderators: 0, members: 2, users: 3 }, limits: { moderators: 1, members: 10, users: 5 } }),
      adminOrg({ id: 2, name: 'Studio Team', plan: 'team', usage: { moderators: 1, members: 10, users: 25 }, limits: { moderators: 5, members: 100, users: 25 } }),
      adminOrg({ id: 3, name: 'Old Backend', plan: 'enterprise' }),
    ])
    render(<MemoryRouter><Organizations /></MemoryRouter>)
    expect((await screen.findByTestId('seats-1')).textContent).toBe('3 / 5 users · 2 left')
    expect(screen.getByTestId('seats-2').textContent).toContain('25 / 25 users · full')
    expect(screen.getByTestId('seats-2').textContent).toContain('limit reached')
    expect(screen.queryByTestId('seats-3')).toBeNull()           // an older backend: the row still renders, without the line
    expect(screen.getByText('Old Backend')).toBeTruthy()
  })

  it('shows the API sentence and the guidance when a downgrade is refused, and nothing is removed', async () => {
    list.mockResolvedValue([adminOrg({ id: 2, name: 'Studio Team', plan: 'team', usage: { moderators: 1, members: 10, users: 12 }, limits: { moderators: 5, members: 100, users: 25 } })])
    update.mockRejectedValue(new ApiError(400, 'Studio Team has 12 users; the Free plan allows 5.', { detail: 'Studio Team has 12 users; the Free plan allows 5.', code: 'plan_downgrade_over_capacity' }))
    render(<MemoryRouter><Organizations /></MemoryRouter>)
    await screen.findByText('Studio Team')
    fireEvent.click(screen.getByRole('button', { name: /Edit/ }))
    fireEvent.change(await screen.findByLabelText(/Plan/i, { selector: 'select' }), { target: { value: 'free' } })
    fireEvent.click(screen.getByRole('button', { name: /Save/ }))
    expect(await screen.findByText(/has 12 users; the Free plan allows 5\./)).toBeTruthy()
    expect(screen.getByTestId('edit-org-error').textContent).toContain('the Free plan allows 5.')      // inside the open dialog, not behind it
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(screen.getByText(/Nobody is removed automatically/)).toBeTruthy()
    expect(update).toHaveBeenCalledWith(2, expect.objectContaining({ plan: 'free' }))
  })
})

describe('owner organization screen', () => {
  it('shows used / max users next to the plan and stops inviting when the plan is full', async () => {
    getOrganization.mockResolvedValue(detail({ usage: { moderators: 1, members: 4, users: 5 }, limits: { moderators: 5, members: 100, users: 5 } }))
    render(<MemoryRouter><MyOrganization /></MemoryRouter>)
    expect((await screen.findByTestId('plan-seats')).textContent).toBe('5 / 5 users · full')
    const send = await screen.findByRole('button', { name: /Send invitation|Invite/i })
    expect((send as HTMLButtonElement).disabled).toBe(true)
  })

  it('shows the remaining seats and the API refusal with guidance', async () => {
    getOrganization.mockResolvedValue(detail({ usage: { moderators: 1, members: 4, users: 12 }, limits: { moderators: 5, members: 100, users: 25 } }))
    invite.mockRejectedValue(new ApiError(403, 'Your plan allows 25 users.', { detail: 'Your plan allows 25 users.', code: 'plan_limit_reached' }))
    render(<MemoryRouter><MyOrganization /></MemoryRouter>)
    expect((await screen.findByTestId('plan-seats')).textContent).toBe('12 / 25 users · 13 left')
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'new@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /Send invitation|Invite/i }))
    await waitFor(() => expect(invite).toHaveBeenCalled())
    expect(await screen.findByText(/Your plan allows 25 users\..*larger plan/)).toBeTruthy()
    expect((screen.getByLabelText('Email address') as HTMLInputElement).value).toBe('new@example.com')      // a refused invitation keeps what was typed
  })

  it('shows no user line from an older backend', async () => {
    getOrganization.mockResolvedValue(detail({ usage: { moderators: 1, members: 4 }, limits: { moderators: 5, members: 100 } }))
    render(<MemoryRouter><MyOrganization /></MemoryRouter>)
    await screen.findByText('Plan')
    expect(screen.queryByTestId('plan-seats')).toBeNull()
  })
})

describe('administrator forms skip an organization whose plan has no user seat left', () => {
  it('disables a full plan in the new-moderator form and says why', async () => {
    const { NewAccountForm } = await import('../components/admin/NewAccountForm')
    const orgs = [
      adminOrg({ id: 1, name: 'Roomy Org', usage: { moderators: 0, members: 2, users: 3 }, limits: { moderators: 5, members: 10, users: 5 } }),
      adminOrg({ id: 2, name: 'Packed Org', usage: { moderators: 0, members: 4, users: 5 }, limits: { moderators: 5, members: 10, users: 5 } }),
    ]
    render(<NewAccountForm title="New" subtitle="s" roles={['user', 'moderator']} organizations={orgs} onCreate={async () => {}} onCancel={() => {}} />)
    fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'moderator' } })
    const packed = (await screen.findByRole('option', { name: /Packed Org/ })) as HTMLOptionElement
    expect(packed.textContent).toContain('plan full')
    expect(packed.disabled).toBe(true)
    expect((screen.getByRole('option', { name: /Roomy Org/ }) as HTMLOptionElement).disabled).toBe(false)
  })
})
