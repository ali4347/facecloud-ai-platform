import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ApiError } from '../lib/api/client'
import type { AdminUser } from '../lib/api/adminUsers'

vi.mock('../lib/api/config', () => ({ API_URL: 'http://api.test', USE_API: true }))
vi.mock('../lib/api/adminOrganizations', async importOriginal => ({ ...(await importOriginal<object>()), listAdminOrganizations: vi.fn(async () => []) }))
const listPage = vi.fn()
const create = vi.fn()
const reset = vi.fn()
const detail = vi.fn()
vi.mock('../lib/api/adminUsers', async importOriginal => ({
  ...(await importOriginal<object>()),
  listAdminUsersPage: (...a: unknown[]) => listPage(...a),
  createAdminUser: (...a: unknown[]) => create(...a),
  sendAdminPasswordReset: (...a: unknown[]) => reset(...a),
  getAdminUserDetail: (...a: unknown[]) => detail(...a),
}))

import UsersPage from '../pages/admin/Users'
import { personCache, forgetPersonCaches } from '../lib/personCache'

const user = (id: number, over: Partial<AdminUser> = {}): AdminUser => ({
  id, username: `user${id}`, email: `user${id}@example.com`, role: 'user', is_email_verified: true, is_suspended: false, suspension_reason: '',
  is_active: true, date_joined: '2026-11-01T10:00:00Z', last_login: null, uploads_count: 3, account_type: 'personal', shared_organization_count: 0, ...over,
})
const page = (rows: AdminUser[]) => ({ count: rows.length, next: null, previous: null, results: rows })
const renderPage = () => render(<MemoryRouter><UsersPage /></MemoryRouter>)

beforeEach(() => { for (const f of [listPage, create, reset, detail]) f.mockReset() })

describe('admin Users: personal and organization accounts', () => {
  it('shows the account type and filters on the server', async () => {
    listPage.mockResolvedValue(page([user(1), user(2, { account_type: 'organization', shared_organization_count: 2 })]))
    renderPage()
    expect(await screen.findByText('Personal')).toBeTruthy()
    // Not exclusive identities: an organization account keeps its personal workspace, and the label says so.
    expect(screen.getByText('Personal + 2 Organizations')).toBeTruthy()
    expect(screen.queryByText(/^Organization( ·|$)/)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Personal + Organization(s)' }))
    await waitFor(() => expect(listPage).toHaveBeenLastCalledWith(expect.objectContaining({ accountType: 'organization', page: 1 }), expect.anything()))
    fireEvent.click(screen.getByRole('button', { name: 'Personal only' }))
    await waitFor(() => expect(listPage).toHaveBeenLastCalledWith(expect.objectContaining({ accountType: 'personal' }), expect.anything()))
  })

  it('sends a password reset link after a confirmation; no password is ever shown', async () => {
    listPage.mockResolvedValue(page([user(1)]))
    reset.mockResolvedValue({ detail: "A password reset link was sent to the account's e-mail address.", email: 'user1@example.com' })
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Reset password' }))
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Send reset link' }))
    expect(await screen.findByText(/A password reset link was sent/)).toBeTruthy()
    expect(reset).toHaveBeenCalledWith(1)
  })

  it('a refused reset (409 account_not_resettable) stays in the dialog', async () => {
    listPage.mockResolvedValue(page([user(1)]))
    reset.mockRejectedValue(new ApiError(409, 'Only an active, not suspended account with an e-mail address can be sent a reset link.'))
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Reset password' }))
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Send reset link' }))
    expect(await within(screen.getByRole('alertdialog')).findByText(/Only an active, not suspended account/)).toBeTruthy()
  })

  it('details mark the private workspace apart from shared organizations and show storage', async () => {
    listPage.mockResolvedValue(page([user(1, { account_type: 'organization', shared_organization_count: 1 })]))
    detail.mockResolvedValue({ ...user(1, { account_type: 'organization', shared_organization_count: 1 }),
      organizations: [{ id: 5, name: 'user1', is_personal: true, role: 'owner', status: 'active' }, { id: 9, name: 'Event Planners', is_personal: false, role: 'moderator', status: 'active' }],
      usage: { storage_bytes: 2048, images: 3 } })
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Details' }))
    const dialog = await screen.findByRole('dialog')
    expect(await within(dialog).findByText('Personal workspace')).toBeTruthy()
    expect(within(dialog).getByText('Event Planners')).toBeTruthy()
    expect(within(dialog).getByText('Personal + 1 Organization')).toBeTruthy()
    expect(within(dialog).queryByText('user1', { selector: 'span.font-semibold' })).toBeNull()
  })

  it('a new account gets an e-mailed link by default: no password is sent or shown', async () => {
    listPage.mockResolvedValue(page([]))
    create.mockResolvedValue(user(3))
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Add User' }))
    expect(screen.queryByLabelText('Password')).toBeNull()
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'pat' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'pat@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))
    await waitFor(() => expect(create).toHaveBeenCalledOnce())
    expect(create.mock.calls[0][0]).toEqual({ username: 'pat', email: 'pat@example.com', role: 'user' })
    expect(await screen.findByText(/was sent a link to choose a password/)).toBeTruthy()
  })

  it('setting a password is still possible and it is sent once', async () => {
    listPage.mockResolvedValue(page([]))
    create.mockResolvedValue(user(3))
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Add User' }))
    fireEvent.click(screen.getByLabelText(/Set a password now/))
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'pat' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'pat@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Strong-Pass-2026' } })
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'Strong-Pass-2026' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))
    await waitFor(() => expect(create.mock.calls[0][0]).toEqual({ username: 'pat', email: 'pat@example.com', password: 'Strong-Pass-2026', role: 'user' }))
  })
})

describe('person caches', () => {
  it('forgetPersonCaches drops every remembered list', () => {
    const cache = personCache<number[]>()
    cache.set([1, 2])
    expect(cache.get()).toEqual([1, 2])
    forgetPersonCaches()
    expect(cache.get()).toBeUndefined()
  })
})
