import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ApiError } from '../lib/api/client'
import type { AdminUser } from '../lib/api/adminUsers'

vi.mock('../lib/api/config', () => ({ API_URL: 'http://api.test', USE_API: true }))
const team = { id: 7, name: 'Event Planners', slug: 'ep', status: 'active', plan: 'team', is_personal: false, created_at: '', updated_at: '', limits: { moderators: 5, members: 50 }, usage: { moderators: 0, members: 0 } }
vi.mock('../lib/api/adminOrganizations', async importOriginal => ({ ...(await importOriginal<object>()), listAdminOrganizations: vi.fn(async () => [team]) }))
const listPage = vi.fn()
const create = vi.fn()
vi.mock('../lib/api/adminUsers', async importOriginal => ({
  ...(await importOriginal<object>()),
  listAdminUsersPage: (...a: unknown[]) => listPage(...a),
  createAdminUser: (...a: unknown[]) => create(...a),
}))
const invite = vi.fn()
vi.mock('../lib/api/adminOperations', async importOriginal => ({
  ...(await importOriginal<object>()),
  inviteAccount: (...a: unknown[]) => invite(...a),
  listAccountInvitations: vi.fn(async () => []),
}))
const preview = vi.fn()
vi.mock('../lib/api/organizations', async importOriginal => ({ ...(await importOriginal<object>()), previewInvitation: (...a: unknown[]) => preview(...a) }))
const registerInv = vi.fn()
vi.mock('../lib/api/auth', async importOriginal => ({ ...(await importOriginal<object>()), registerFromInvitation: (...a: unknown[]) => registerInv(...a) }))

import UsersPage from '../pages/admin/Users'
import Moderators from '../pages/admin/Moderators'
import Invitations from '../pages/admin/Invitations'
import Register from '../pages/Register'
import { normalizeReason, reasonProblem, serverReasonError } from '../lib/moderatorReason'
import { accountTypeLabel } from '../lib/api/adminUsers'

const REASON = 'Owner asked us to set up their first moderator.'
const user = (id: number, over: Partial<AdminUser> = {}): AdminUser => ({
  id, username: `user${id}`, email: `user${id}@example.com`, role: 'user', is_email_verified: true, is_suspended: false, suspension_reason: '',
  is_active: true, date_joined: '2026-11-01T10:00:00Z', ...over,
})
const page = (rows: AdminUser[]) => ({ count: rows.length, next: null, previous: null, results: rows })
const at = (el: React.ReactNode, path = '/') => render(<MemoryRouter initialEntries={[path]}>{el}</MemoryRouter>)

beforeEach(() => { for (const f of [listPage, create, invite, preview, registerInv]) f.mockReset(); listPage.mockResolvedValue(page([])) })

describe('moderator reason rules (backend PR #176)', () => {
  it('needs at least 8 meaningful characters; spaces do not count twice', () => {
    expect(reasonProblem('')).toMatch(/Give the reason/)
    expect(reasonProblem('   short  ')).toMatch(/at least 8 characters/)
    expect(reasonProblem('a  b  c  d')).toMatch(/at least 8 characters/) // "a b c d" is 7 once collapsed, as the server counts it
    expect(reasonProblem('Onboarding help')).toBe('')
    expect(reasonProblem('x'.repeat(501))).toMatch(/under 500/)
    expect(normalizeReason('  Owner   asked\n us ')).toBe('Owner asked us')
  })

  it('reads the server’s sentence about reason', () => {
    expect(serverReasonError(new ApiError(400, 'x', { reason: ['Say why an administrator is adding this moderator…'] }))).toMatch(/Say why/)
    expect(serverReasonError(new ApiError(400, 'x', { email: ['taken'] }))).toBe('')
  })

  it('labels accounts as Personal or Personal + N Organization(s)', () => {
    expect(accountTypeLabel('personal', 0)).toBe('Personal')
    expect(accountTypeLabel('organization', 1)).toBe('Personal + 1 Organization')
    expect(accountTypeLabel('organization', 3)).toBe('Personal + 3 Organizations')
    expect(accountTypeLabel('organization', undefined)).toBe('Personal + Organization(s)')
    expect(accountTypeLabel(undefined)).toBe('—')
  })
})

describe('Users → Add User', () => {
  const openForm = async () => { at(<UsersPage />); fireEvent.click(await screen.findByRole('button', { name: 'Add User' })) }
  const fill = () => {
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'mod1' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'mod1@example.com' } })
  }

  it('an ordinary personal user needs no reason and sends none', async () => {
    create.mockResolvedValue(user(3))
    await openForm()
    expect(screen.queryByLabelText(/Reason for Moderator Assignment/)).toBeNull()
    fill()
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))
    await waitFor(() => expect(create).toHaveBeenCalledWith({ username: 'mod1', email: 'mod1@example.com', role: 'user' }))
  })

  it('choosing Moderator shows the required reason; too short is refused before calling the server', async () => {
    await openForm()
    fill()
    fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'moderator' } })
    expect(screen.getByLabelText(/Reason for Moderator Assignment/)).toBeTruthy()
    expect(screen.getByText(/Recorded in the organization’s audit trail/)).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Organization'), { target: { value: '7' } })
    fireEvent.change(screen.getByLabelText(/Reason for Moderator Assignment/), { target: { value: 'too sh' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))
    expect(await screen.findByText(/Write at least 8 characters/)).toBeTruthy()
    expect(create).not.toHaveBeenCalled()
  })

  it('creates the moderator with organization_id and reason', async () => {
    create.mockResolvedValue(user(3, { role: 'moderator' }))
    await openForm()
    fill()
    fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'moderator' } })
    fireEvent.change(screen.getByLabelText('Organization'), { target: { value: '7' } })
    fireEvent.change(screen.getByLabelText(/Reason for Moderator Assignment/), { target: { value: `  ${REASON}  ` } })
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))
    await waitFor(() => expect(create).toHaveBeenCalledWith({ username: 'mod1', email: 'mod1@example.com', role: 'moderator', organization_id: 7, reason: REASON }))
  })

  it('the server’s 400 on reason is shown under the field', async () => {
    create.mockRejectedValue(new ApiError(400, 'x', { reason: ['Say why an administrator is adding this moderator instead of the organization’s owner inviting them.'] }))
    await openForm()
    fill()
    fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'moderator' } })
    fireEvent.change(screen.getByLabelText('Organization'), { target: { value: '7' } })
    fireEvent.change(screen.getByLabelText(/Reason for Moderator Assignment/), { target: { value: REASON } })
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))
    const message = await screen.findByText(/Say why an administrator is adding this moderator/)
    expect(message.id).toBe('new-moderator-reason-error')
  })
})

describe('Moderators → Create moderator', () => {
  it('always asks for the reason and sends it', async () => {
    create.mockResolvedValue(user(4, { role: 'moderator' }))
    at(<Moderators />)
    fireEvent.click(await screen.findByRole('button', { name: 'Create moderator' }))
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'mod2' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'mod2@example.com' } })
    await waitFor(() => expect((screen.getByLabelText('Organization') as HTMLSelectElement).options.length).toBeGreaterThan(1))
    fireEvent.change(screen.getByLabelText('Organization'), { target: { value: '7' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))
    expect(await screen.findByText(/Give the reason for this moderator assignment/)).toBeTruthy()
    expect(create).not.toHaveBeenCalled()
    fireEvent.change(screen.getByLabelText(/Reason for Moderator Assignment/), { target: { value: REASON } })
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))
    await waitFor(() => expect(create).toHaveBeenCalledWith(expect.objectContaining({ role: 'moderator', organization_id: 7, reason: REASON })))
  })
})

describe('Invitations → Invite a person', () => {
  const fillEmail = (value: string) => fireEvent.change(screen.getByLabelText('Email'), { target: { value } })

  it('an ordinary user invitation sends no reason', async () => {
    invite.mockResolvedValue({ id: 1 })
    at(<Invitations />)
    await screen.findByRole('button', { name: 'Send invitation' })
    expect(screen.queryByLabelText(/Reason for Moderator Assignment/)).toBeNull()
    fillEmail('pat@example.com')
    fireEvent.click(screen.getByRole('button', { name: 'Send invitation' }))
    await waitFor(() => expect(invite).toHaveBeenCalledWith({ email: 'pat@example.com', role: 'user' }))
  })

  it('a moderator invitation requires the reason and sends it with the organization', async () => {
    invite.mockResolvedValue({ id: 2 })
    at(<Invitations />)
    await screen.findByRole('button', { name: 'Send invitation' })
    fillEmail('mod3@example.com')
    fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'moderator' } })
    await waitFor(() => expect((screen.getByLabelText('Organization') as HTMLSelectElement).options.length).toBeGreaterThan(1))
    fireEvent.change(screen.getByLabelText('Organization'), { target: { value: '7' } })
    fireEvent.change(screen.getByLabelText(/Reason for Moderator Assignment/), { target: { value: 'abc' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send invitation' }))
    expect(await screen.findByText(/Write at least 8 characters/)).toBeTruthy()
    expect(invite).not.toHaveBeenCalled()
    fireEvent.change(screen.getByLabelText(/Reason for Moderator Assignment/), { target: { value: REASON } })
    fireEvent.click(screen.getByRole('button', { name: 'Send invitation' }))
    await waitFor(() => expect(invite).toHaveBeenCalledWith({ email: 'mod3@example.com', role: 'moderator', organization_id: 7, reason: REASON }))
    expect(await screen.findByText(/Invitation sent to mod3@example.com/)).toBeTruthy()
  })

  it('the server’s 400 on reason is shown under the field', async () => {
    invite.mockRejectedValue(new ApiError(400, 'x', { reason: ['Say why an administrator is adding this moderator…'] }))
    at(<Invitations />)
    await screen.findByRole('button', { name: 'Send invitation' })
    fillEmail('mod3@example.com')
    fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'moderator' } })
    await waitFor(() => expect((screen.getByLabelText('Organization') as HTMLSelectElement).options.length).toBeGreaterThan(1))
    fireEvent.change(screen.getByLabelText('Organization'), { target: { value: '7' } })
    fireEvent.change(screen.getByLabelText(/Reason for Moderator Assignment/), { target: { value: REASON } })
    fireEvent.click(screen.getByRole('button', { name: 'Send invitation' }))
    expect((await screen.findByText(/Say why an administrator is adding this moderator/)).id).toBe('inv-moderator-reason-error')
  })
})

describe('Register from an invitation: signing in returns to it', () => {
  it('an existing address gets a Sign in link back to the invitation, and so does the footer link', async () => {
    preview.mockResolvedValue({ organization_name: 'Event Planners', email: 'taken@example.com', role: 'owner', expires_at: '2026-12-04T13:32:14Z' })
    registerInv.mockRejectedValue(new ApiError(400, 'A user with this email already exists.'))
    at(<Register />, '/register?invitation=tok123')
    await screen.findByText(/You were invited to be the owner of/)
    const inputs = [...document.querySelectorAll('form input')] as HTMLInputElement[]
    fireEvent.change(inputs.find(i => i.type === 'text') as HTMLInputElement, { target: { value: 'Taken Person' } })
    for (const p of inputs.filter(i => i.type === 'password')) fireEvent.change(p, { target: { value: 'Strong-Pass-2026' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create account and become the owner' }))
    expect(await screen.findByText(/you come straight back to the invitation/)).toBeTruthy()
    const links = screen.getAllByRole('link', { name: /Sign in/i }).map(a => a.getAttribute('href'))
    expect(links).toEqual(['/login?next=%2Finvitations%2Ftok123', '/login?next=%2Finvitations%2Ftok123'])
  })

  it('without an invitation the sign-in link is the plain one', () => {
    at(<Register />, '/register')
    expect(screen.getByRole('link', { name: 'Sign In' }).getAttribute('href')).toBe('/login')
  })
})
