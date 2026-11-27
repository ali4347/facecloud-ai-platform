import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ApiError } from '../lib/api/client'
import type { DownloadRequest, DownloadRequestItem } from '../lib/api/downloads'

vi.mock('../lib/api/config', () => ({ API_URL: 'http://api.test', USE_API: true }))
let me: { id: number | null; settled: boolean } = { id: 4, settled: true }
vi.mock('../lib/useCurrentUserId', () => ({ useCurrentUserId: () => me }))
const choose = vi.fn()
vi.mock('../lib/moderationData', () => ({
  useModeratorOrganization: () => ({ organizationId: 9, team: { id: 9 }, teams: [{ id: 9 }, { id: 10 }], resolving: false, error: null }),
  chooseModeratorOrganization: (id: number) => choose(id),
}))
const get = vi.fn()
const decide = vi.fn()
const revoke = vi.fn()
vi.mock('../lib/api/moderatorConsole', async importOriginal => ({
  ...(await importOriginal<object>()),
  getOrgDownloadRequest: (...a: unknown[]) => get(...a),
  decideDownloadRequest: (...a: unknown[]) => decide(...a),
  revokeDownloadGrant: (...a: unknown[]) => revoke(...a),
  listOrgImages: vi.fn(async () => [{ id: 1, overall_score: 82, decision: 'accepted' }]),
  getModeratorImagePreview: vi.fn(async () => new Blob(['x'])),
}))

import DownloadRequestReview from '../pages/moderator/DownloadRequestReview'

const item = (id: number, over: Partial<DownloadRequestItem> = {}): DownloadRequestItem => ({
  id, image_id: id, image_name: `p${id}.jpg`, artifact_type: 'enhanced', artifact_id: null, status: 'pending', denial_reason_code: '', denial_reason_text: '',
  reviewed_at: null, grant: null, file_url: null, ...over,
})
const request = (over: Partial<DownloadRequest> = {}, items = [item(1), item(2), item(3)]): DownloadRequest => ({
  id: 5, organization: 9, organization_name: 'Studio', requester: { id: 3, username: 'member', email: 'member@x.test' }, status: 'pending',
  requester_message: 'Need these', version: 7, counts: { total: items.length, pending: items.length, approved: 0, denied: 0 },
  created_at: '2026-11-27T09:00:00Z', updated_at: '2026-11-27T09:00:00Z', decided_at: null, items, ...over,
})
const renderPage = (path = '/moderator/download-requests/5?organization=9') => render(
  <MemoryRouter initialEntries={[path]}>
    <Routes><Route path="/moderator/download-requests/:id" element={<DownloadRequestReview />} /></Routes>
  </MemoryRouter>,
)
const confirmIn = (name: string) => {
  const dialog = screen.getByRole('alertdialog', { name: `${name}?` })
  return { dialog, button: within(dialog).getByRole('button', { name }) as HTMLButtonElement }
}

beforeEach(() => { get.mockReset(); decide.mockReset(); revoke.mockReset(); choose.mockReset(); me = { id: 4, settled: true } })

describe('moderator request page', () => {
  it('shows the requester, message, quality and previews, and approves all with expected_version', async () => {
    get.mockResolvedValue(request())
    decide.mockResolvedValue(request({ status: 'approved', version: 8 }, [item(1, { status: 'approved' }), item(2, { status: 'approved' }), item(3, { status: 'approved' })]))
    renderPage()
    expect(await screen.findByText('Need these')).toBeTruthy()
    expect(screen.getByText('member@x.test')).toBeTruthy()
    expect(await screen.findByText(/quality 82\/100/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Approve all' }))
    const { button } = confirmIn('Approve all')
    expect(button.disabled).toBe(false)
    fireEvent.click(button)
    await waitFor(() => expect(decide).toHaveBeenCalledWith(9, 5, { action: 'approve_all', expected_version: 7 }))
    expect(await screen.findByText(/Decision saved/)).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Approve all' })).toBeNull()
  })

  it('approve selected: the others are denied, so a reason is required; "other" needs text', async () => {
    get.mockResolvedValue(request())
    decide.mockResolvedValue(request({ status: 'partially_approved', version: 8 }, [item(1, { status: 'approved' }), item(2, { status: 'denied' }), item(3, { status: 'denied' })]))
    renderPage()
    fireEvent.click(await screen.findByLabelText('Select p1.jpg'))
    fireEvent.click(screen.getByRole('button', { name: 'Approve selected' }))
    const { dialog, button } = confirmIn('Approve selected')
    expect(within(dialog).getByText(/Deny/)).toBeTruthy()
    expect(button.disabled).toBe(true)
    fireEvent.change(within(dialog).getByLabelText('Reason'), { target: { value: 'other' } })
    expect(within(dialog).getByText(/Explain the reason when you choose “Other”/)).toBeTruthy()
    expect(confirmIn('Approve selected').button.disabled).toBe(true)
    fireEvent.change(within(dialog).getByLabelText(/Explanation/), { target: { value: 'Not for this client' } })
    fireEvent.click(confirmIn('Approve selected').button)
    await waitFor(() => expect(decide).toHaveBeenCalledWith(9, 5, {
      action: 'approve_selected', item_ids: [1], reason: { code: 'other', text: 'Not for this client' }, expected_version: 7,
    }))
  })

  it('deny selected sends the selection; deny all sends every reason including a photo’s own', async () => {
    get.mockResolvedValue(request())
    decide.mockResolvedValue(request({ status: 'in_review', version: 8 }, [item(1, { status: 'denied' }), item(2), item(3)]))
    const { unmount } = renderPage()
    fireEvent.click(await screen.findByLabelText('Select p1.jpg'))
    fireEvent.click(screen.getByRole('button', { name: 'Deny selected' }))
    fireEvent.change(within(confirmIn('Deny selected').dialog).getByLabelText('Reason'), { target: { value: 'incorrect_selection' } })
    fireEvent.click(confirmIn('Deny selected').button)
    await waitFor(() => expect(decide).toHaveBeenLastCalledWith(9, 5, { action: 'deny_selected', item_ids: [1], reason: { code: 'incorrect_selection', text: '' }, expected_version: 7 }))
    unmount()

    get.mockResolvedValue(request())
    renderPage()
    const own = await screen.findAllByRole('button', { name: 'Own reason if denied' })
    fireEvent.click(own[1])
    fireEvent.change(screen.getAllByLabelText('Reason')[0], { target: { value: 'distribution_rights' } })
    fireEvent.click(screen.getByRole('button', { name: 'Deny all' }))
    fireEvent.change(within(confirmIn('Deny all').dialog).getByLabelText('Reason'), { target: { value: 'policy_restriction' } })
    fireEvent.click(confirmIn('Deny all').button)
    await waitFor(() => expect(decide).toHaveBeenLastCalledWith(9, 5, {
      action: 'deny_all', reason: { code: 'policy_restriction', text: '' }, item_reasons: { 2: { code: 'distribution_rights', text: '' } }, expected_version: 7,
    }))
  })

  it.each([
    ['request_closed', /already decided or cancelled/],
    ['item_already_decided', /Another reviewer decided some of these photos/],
    ['request_changed', /changed while you were looking at it/],
  ])('409 %s: says so and reloads the request', async (code, text) => {
    get.mockResolvedValue(request())
    decide.mockRejectedValue(new ApiError(409, 'x', { code }))
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Approve all' }))
    get.mockResolvedValue(request({ status: 'approved', version: 9 }, [item(1, { status: 'approved' }), item(2, { status: 'approved' }), item(3, { status: 'approved' })]))
    fireEvent.click(confirmIn('Approve all').button)
    expect(await screen.findByText(text)).toBeTruthy()
    await waitFor(() => expect(get).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Approve all' })).toBeNull())
  })

  it('the moderator’s own request (same user id) has no decision controls', async () => {
    get.mockResolvedValue(request({ requester: { id: 4, username: 'mod', email: 'mod@x.test' } }))
    renderPage()
    expect(await screen.findByText(/You made this request yourself/)).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Approve all' })).toBeNull()
    expect(screen.queryByLabelText('Select p1.jpg')).toBeNull()
  })

  it('identity is the user id, not the e-mail: another person with the same address text is not "own"', async () => {
    get.mockResolvedValue(request({ requester: { id: 99, username: 'other', email: 'mod@x.test' } }))
    renderPage()
    expect(await screen.findByRole('button', { name: 'Approve all' })).toBeTruthy()
    expect(screen.queryByText(/You made this request yourself/)).toBeNull()
  })

  it('controls wait until the own id is known; if it cannot be had the server decides', async () => {
    me = { id: null, settled: false }
    get.mockResolvedValue(request())
    const { unmount } = renderPage()
    expect(await screen.findByText('Need these')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Approve all' })).toBeNull()
    unmount()
    me = { id: null, settled: true }
    renderPage()
    expect(await screen.findByRole('button', { name: 'Approve all' })).toBeTruthy()
  })

  it('a 403 cannot_decide_own_request from the server is explained', async () => {
    me = { id: null, settled: true }
    get.mockResolvedValue(request())
    decide.mockRejectedValue(new ApiError(403, 'x', { code: 'cannot_decide_own_request' }))
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Approve all' }))
    fireEvent.click(confirmIn('Approve all').button)
    expect(await screen.findByText(/You made this request yourself/)).toBeTruthy()
  })

  it('a request this moderator may not see is explained, not shown as an error page', async () => {
    get.mockRejectedValue(new ApiError(404, 'Not found.'))
    renderPage()
    expect(await screen.findByText(/not one you may review/)).toBeTruthy()
  })

  it('switches the panel to the organization named in a notification link', async () => {
    get.mockResolvedValue(request({ organization: 10 }))
    renderPage('/moderator/download-requests/5?organization=10')
    await waitFor(() => expect(choose).toHaveBeenCalledWith(10))
    await waitFor(() => expect(get).toHaveBeenCalledWith(10, 5, expect.anything()))
  })

  it('withdraws an approval', async () => {
    const active = { id: 77, expires_at: new Date(Date.now() + 3_600_000).toISOString(), revoked_at: null, revoke_reason: '', max_uses: 0, use_count: 0, active: true, expired: false }
    get.mockResolvedValue(request({ status: 'approved' }, [item(1, { status: 'approved', grant: active })]))
    revoke.mockResolvedValue({})
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: /Withdraw approval/ }))
    const dialog = screen.getByRole('alertdialog', { name: 'Withdraw this approval?' })
    fireEvent.change(within(dialog).getByRole('textbox'), { target: { value: 'Shared by mistake' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Withdraw approval' }))
    await waitFor(() => expect(revoke).toHaveBeenCalledWith(9, 77, 'Shared by mistake'))
  })
})
