import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ApiError } from '../lib/api/client'
import type { AdminOrganization, OwnerInvitation } from '../lib/api/adminOrganizations'

vi.mock('../lib/api/config', () => ({ API_URL: 'http://api.test', USE_API: true }))
const list = vi.fn()
const create = vi.fn()
const update = vi.fn()
const getInv = vi.fn()
const resend = vi.fn()
const cancel = vi.fn()
vi.mock('../lib/api/adminOrganizations', async importOriginal => ({
  ...(await importOriginal<object>()),
  listAdminOrganizations: (...a: unknown[]) => list(...a),
  createOrganizationForOwner: (...a: unknown[]) => create(...a),
  updateAdminOrganization: (...a: unknown[]) => update(...a),
  getOwnerInvitation: (...a: unknown[]) => getInv(...a),
  resendOwnerInvitation: (...a: unknown[]) => resend(...a),
  cancelOwnerInvitation: (...a: unknown[]) => cancel(...a),
}))

import Organizations from '../pages/admin/Organizations'
import { OwnerInvitationPanel } from '../components/admin/OwnerInvitationPanel'

const invitation = (over: Partial<OwnerInvitation> = {}): OwnerInvitation => ({
  id: 1, email: 'newowner@example.com', status: 'pending', expires_at: '2026-12-04T13:32:14Z', created_at: '2026-11-27T13:32:14Z', accepted_at: null,
  email_status: 'sent', email_sent_at: '2026-11-27T13:32:15Z', email_failure_reason: '', can_resend: true, accepted_by: null, ...over,
})
const org = (over: Partial<AdminOrganization> = {}): AdminOrganization => ({
  id: 7, name: 'Event Planners', slug: 'event-planners', status: 'active', plan: 'team', is_personal: false, created_at: '2026-11-27T10:00:00Z',
  updated_at: '2026-11-27T10:00:00Z', owner: { id: 3, username: 'boss' }, member_count: 4, ...over,
})
const renderPage = () => render(<MemoryRouter><Organizations /></MemoryRouter>)

beforeEach(() => { for (const f of [list, create, update, getInv, resend, cancel]) f.mockReset() })

describe('admin Organizations: create from an owner e-mail', () => {
  it('sends name, owner_email and plan (no account search) and explains what happens next', async () => {
    list.mockResolvedValue([])
    create.mockResolvedValue({ ...org({ status: 'pending_owner', owner: null, owner_invitation: invitation() }), created: true, owner_account_exists: false })
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'New organization' }))
    expect(screen.queryByPlaceholderText(/Type a username/)).toBeNull()
    fireEvent.change(screen.getByLabelText('Organization name'), { target: { value: 'Event Planners' } })
    fireEvent.change(screen.getByLabelText('Owner email'), { target: { value: ' newowner@example.com ' } })
    fireEvent.change(screen.getByLabelText('Subscription plan'), { target: { value: 'team' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create Organization & Send Invitation' }))
    await waitFor(() => expect(create).toHaveBeenCalledWith({ name: 'Event Planners', owner_email: 'newowner@example.com', plan: 'team' }))
    expect(await screen.findByText(/was created and is waiting for its owner/)).toBeTruthy()
    expect(screen.getByText(/they will create one from the invitation/)).toBeTruthy()
    expect(list.mock.calls[0][1]).toBe('organization')
  })

  it('treats created:false as "already created", not as an error, and hints when the account exists', async () => {
    list.mockResolvedValue([])
    create.mockResolvedValue({ ...org({ status: 'pending_owner', owner: null, owner_invitation: invitation() }), created: false, owner_account_exists: true })
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'New organization' }))
    fireEvent.change(screen.getByLabelText('Organization name'), { target: { value: 'Event Planners' } })
    fireEvent.change(screen.getByLabelText('Owner email'), { target: { value: 'newowner@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create Organization & Send Invitation' }))
    expect(await screen.findByText(/already exists and is waiting for this owner/)).toBeTruthy()
    expect(screen.getByText(/already has a FaceCloud account: they will be asked to sign in/)).toBeTruthy()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('refuses an invalid e-mail before calling the server, and shows a server refusal', async () => {
    list.mockResolvedValue([])
    create.mockRejectedValue(new ApiError(400, 'Enter a valid email address.', { owner_email: ['Enter a valid email address.'] }))
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'New organization' }))
    fireEvent.change(screen.getByLabelText('Organization name'), { target: { value: 'X' } })
    fireEvent.change(screen.getByLabelText('Owner email'), { target: { value: 'not-an-email' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create Organization & Send Invitation' }))
    expect(await screen.findByText('Enter the owner’s e-mail address.')).toBeTruthy()
    expect(create).not.toHaveBeenCalled()
    fireEvent.change(screen.getByLabelText('Owner email'), { target: { value: 'a@b.co' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create Organization & Send Invitation' }))
    expect(await screen.findByText('Enter a valid email address.')).toBeTruthy()
  })

  it('labels a waiting organization, shows the invited address, never offers Activate, and opens its invitation', async () => {
    list.mockResolvedValue([
      org({ id: 7, status: 'pending_owner', owner: null, owner_invitation: invitation() }),
      org({ id: 8, name: 'Old Studio', status: 'suspended' }),
    ])
    getInv.mockResolvedValue(invitation())
    renderPage()
    expect(await screen.findByText('Waiting for owner')).toBeTruthy()
    expect(screen.getByText('Invited: newowner@example.com')).toBeTruthy()
    const waitingRow = screen.getByText('Event Planners').closest('tr') as HTMLElement
    expect(within(waitingRow).queryByRole('button', { name: /Reactivate|Activate/ })).toBeNull()
    expect(within(waitingRow).getByRole('button', { name: 'Suspend' })).toBeTruthy()
    const suspendedRow = screen.getByText('Old Studio').closest('tr') as HTMLElement
    expect(within(suspendedRow).getByRole('button', { name: 'Reactivate' })).toBeTruthy()
    fireEvent.click(within(waitingRow).getByRole('button', { name: 'Invitation' }))
    expect(await screen.findByRole('dialog', { name: /Owner invitation/ })).toBeTruthy()
    await waitFor(() => expect(getInv).toHaveBeenCalledWith(7, expect.anything()))
  })

  it('asks for personal workspaces only when the administrator chooses to see them', async () => {
    list.mockResolvedValue([])
    renderPage()
    await waitFor(() => expect(list).toHaveBeenCalledWith(expect.anything(), 'organization'))
    fireEvent.click(screen.getByLabelText('Also show personal workspaces'))
    await waitFor(() => expect(list).toHaveBeenLastCalledWith(expect.anything(), 'all'))
  })
})

describe('owner invitation panel', () => {
  const renderPanel = () => render(<OwnerInvitationPanel organizationId={7} organizationName="Event Planners" onChanged={vi.fn()} />)

  it('shows the status, the e-mail delivery and a failure reason; never a link', async () => {
    getInv.mockResolvedValue(invitation({ email_status: 'failed', email_failure_reason: 'SMTP connection refused' }))
    const { container } = renderPanel()
    expect(await screen.findByText(/Could not be sent/)).toBeTruthy()
    expect(screen.getByText('SMTP connection refused')).toBeTruthy()
    expect(container.innerHTML).not.toMatch(/\/invitations\//)
  })

  it('resends after a confirmation (the old link stops working) and cancels', async () => {
    getInv.mockResolvedValue(invitation())
    resend.mockResolvedValue(invitation({ expires_at: '2026-12-05T10:00:00Z' }))
    cancel.mockResolvedValue(invitation({ status: 'cancelled' }))
    renderPanel()
    fireEvent.click(await screen.findByRole('button', { name: 'Resend invitation' }))
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Resend invitation' }))
    expect(await screen.findByText(/The previous link no longer works/)).toBeTruthy()
    expect(resend).toHaveBeenCalledWith(7)
    fireEvent.click(screen.getByRole('button', { name: 'Cancel invitation' }))
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Cancel invitation' }))
    expect(await screen.findByText(/The invitation was cancelled/)).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Cancel invitation' })).toBeNull()
  })

  it('a 409 on resend (already accepted) is explained and the status reloaded', async () => {
    getInv.mockResolvedValueOnce(invitation()).mockResolvedValueOnce(invitation({ status: 'accepted', can_resend: false, accepted_by: { id: 9, username: 'newowner' }, accepted_at: '2026-11-28T09:00:00Z' }))
    resend.mockRejectedValue(new ApiError(409, 'x'))
    renderPanel()
    fireEvent.click(await screen.findByRole('button', { name: 'Resend invitation' }))
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Resend invitation' }))
    expect(await screen.findByText(/already accepted, or the invitation is no longer pending/)).toBeTruthy()
    expect(await screen.findByText(/Owner accepted by newowner/)).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Resend invitation' })).toBeNull()
  })

  it('an organization made with an existing owner has no invitation (404)', async () => {
    getInv.mockRejectedValue(new ApiError(404, 'Not found.'))
    renderPanel()
    expect(await screen.findByText(/was not created from an owner e-mail address/)).toBeTruthy()
  })
})
