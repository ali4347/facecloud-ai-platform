import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ApiError } from '../lib/api/client'

vi.mock('../lib/api/config', () => ({ API_URL: 'http://api.test', USE_API: true }))
vi.mock('../lib/api/images', async importOriginal => ({ ...(await importOriginal<object>()), getPhotoPicture: vi.fn(async () => new Blob(['x'])) }))
const check = vi.fn()
const create = vi.fn()
vi.mock('../lib/api/downloads', async importOriginal => ({
  ...(await importOriginal<object>()),
  checkDownloadEligibility: (...args: unknown[]) => check(...args),
  createDownloadRequest: (...args: unknown[]) => create(...args),
}))

import { RequestDownloadDialog } from '../components/downloads/RequestDownloadDialog'

const candidates = [
  { id: 1, name: 'ok-1.jpg', organizationId: 9 },
  { id: 2, name: 'ok-2.jpg', organizationId: 9 },
  { id: 3, name: 'in-review.jpg', organizationId: 9 },
]
const answer = (over: object = {}) => ({
  approval_required: true, reviewer_available: true,
  items: [
    { image_id: 1, artifact_type: 'enhanced', eligible: true, reason: '', detail: '', access_state: 'not_requested' },
    { image_id: 2, artifact_type: 'enhanced', eligible: true, reason: '', detail: '', access_state: 'not_requested' },
    { image_id: 3, artifact_type: 'enhanced', eligible: false, reason: 'not_approved', detail: 'This image has not been approved yet, so it cannot be requested.', access_state: 'not_requested' },
  ],
  ...over,
})
const created = { created: true, request: { id: 41, organization: 9, organization_name: 'Studio', status: 'pending', counts: { total: 2, pending: 2, approved: 0, denied: 0 }, items: [] } }
const renderDialog = (onCreated = vi.fn()) => render(<MemoryRouter><RequestDownloadDialog candidates={candidates} organizationNames={{ 9: 'Studio' }} onClose={vi.fn()} onCreated={onCreated} /></MemoryRouter>)

beforeEach(() => { check.mockReset(); create.mockReset() })

describe('RequestDownloadDialog', () => {
  it('lists every photo, disables the ineligible one with the server’s reason, and sends only the eligible ones with a token', async () => {
    check.mockResolvedValue(answer())
    create.mockResolvedValue(created)
    const onCreated = vi.fn()
    renderDialog(onCreated)
    expect(await screen.findByText('This image has not been approved yet, so it cannot be requested.')).toBeTruthy()
    expect(screen.getAllByText('Ready to request')).toHaveLength(2)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'For the album' } })
    fireEvent.click(screen.getByRole('button', { name: /Send request for 2 photos/ }))
    await screen.findByText(/Your request #41 for 2 photos was sent/)
    const [org, items, token, message] = create.mock.calls[0]
    expect(org).toBe(9)
    expect(items).toEqual([{ image_id: 1, artifact_type: 'enhanced' }, { image_id: 2, artifact_type: 'enhanced' }])
    expect(typeof token).toBe('string')
    expect(token.length).toBeGreaterThan(8)
    expect(message).toBe('For the album')
    expect(onCreated).toHaveBeenCalledOnce()
  })

  it('retries with the same client token after a failure', async () => {
    check.mockResolvedValue(answer())
    create.mockRejectedValueOnce(new ApiError(0, 'FaceCloud could not reach the server.')).mockResolvedValueOnce(created)
    renderDialog()
    const send = await screen.findByRole('button', { name: /Send request for 2 photos/ })
    fireEvent.click(send)
    expect(await screen.findByText(/could not reach the server/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Send request for 2 photos/ }))
    await screen.findByText(/Your request #41/)
    expect(create.mock.calls[0][2]).toBe(create.mock.calls[1][2])
  })

  it('shows 400 items_not_eligible per photo, saves nothing, and uses a new token for the rest', async () => {
    check.mockResolvedValue(answer())
    create.mockRejectedValueOnce(new ApiError(400, 'Some of the selected images cannot be requested.', {
      code: 'items_not_eligible', items: [{ image_id: 2, artifact_type: 'enhanced', reason: 'already_requested', detail: 'Already in an undecided request.' }],
    })).mockResolvedValueOnce({ ...created, request: { ...created.request, counts: { total: 1, pending: 1, approved: 0, denied: 0 } } })
    renderDialog()
    fireEvent.click(await screen.findByRole('button', { name: /Send request for 2 photos/ }))
    expect(await screen.findByText(/cannot be requested, so nothing was sent/)).toBeTruthy()
    expect(screen.getByText('Already in an undecided request.')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Send request for 1 photo$/ }))
    await screen.findByText(/Your request #41 for 1 photo was sent/)
    expect(create.mock.calls[1][1]).toEqual([{ image_id: 1, artifact_type: 'enhanced' }])
    expect(create.mock.calls[1][2]).not.toBe(create.mock.calls[0][2])
  })

  it.each([
    ['no_eligible_reviewer', /Nobody in this organization can approve/],
    ['approval_not_required', /no longer requires approval/],
    ['client_token_reused', /changed since it was first sent/],
    ['organization_suspended', /organization is suspended/],
  ])('explains 409/403 %s', async (code, text) => {
    check.mockResolvedValue(answer())
    create.mockRejectedValueOnce(new ApiError(code === 'organization_suspended' ? 403 : 409, 'x', { code }))
    renderDialog()
    fireEvent.click(await screen.findByRole('button', { name: /Send request for 2 photos/ }))
    expect(await screen.findByText(text)).toBeTruthy()
  })

  it('cannot be sent when nobody can review, and says why before anything is selected', async () => {
    check.mockResolvedValue(answer({ reviewer_available: false }))
    renderDialog()
    expect(await screen.findByText(/ask your organization owner or the FaceCloud administrator to add a moderator/i)).toBeTruthy()
    await waitFor(() => expect((screen.getByRole('button', { name: /Send request/ }) as HTMLButtonElement).disabled).toBe(true))
  })
})
