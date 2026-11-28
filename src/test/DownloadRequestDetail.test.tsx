import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ApiError } from '../lib/api/client'
import type { DownloadRequest, DownloadRequestItem } from '../lib/api/downloads'

vi.mock('../lib/api/config', () => ({ API_URL: 'http://api.test', USE_API: true }))
vi.mock('../lib/api/images', async importOriginal => ({ ...(await importOriginal<object>()), getPhotoPicture: vi.fn(async () => new Blob(['x'])) }))
vi.mock('../lib/saveBlob', () => ({ saveBlob: vi.fn() }))
const get = vi.fn()
const cancel = vi.fn()
const file = vi.fn()
vi.mock('../lib/api/downloads', async importOriginal => ({
  ...(await importOriginal<object>()),
  getMyDownloadRequest: (...a: unknown[]) => get(...a),
  cancelDownloadRequest: (...a: unknown[]) => cancel(...a),
  downloadRequestItemFile: (...a: unknown[]) => file(...a),
}))

import DownloadRequestDetail from '../pages/user/DownloadRequestDetail'

const later = new Date(Date.now() + 3_600_000).toISOString()
const earlier = new Date(Date.now() - 3_600_000).toISOString()
const item = (id: number, over: Partial<DownloadRequestItem> = {}): DownloadRequestItem => ({
  id, image_id: id, image_name: `p${id}.jpg`, artifact_type: 'enhanced', artifact_id: null, status: 'pending', denial_reason_code: '', denial_reason_text: '',
  reviewed_at: null, grant: null, file_url: null, ...over,
})
const approved = (id: number, expires = later) => item(id, {
  status: 'approved', reviewed_at: '2026-11-27T10:00:00Z', file_url: `/api/downloads/requests/1/items/${id}/file/`,
  grant: { id: 100 + id, expires_at: expires, revoked_at: null, revoke_reason: '', max_uses: 0, use_count: 0, active: expires === later, expired: expires !== later },
})
const denied = (id: number) => item(id, { status: 'denied', denial_reason_code: 'client_restriction', denial_reason_text: 'Client said no' })
const request = (status: DownloadRequest['status'], items: DownloadRequestItem[]): DownloadRequest => ({
  id: 1, organization: 9, organization_name: 'Studio', requester: { id: 3, username: 'm', email: 'm@x.test' }, status, requester_message: 'For the album', version: 1,
  counts: { total: items.length, pending: items.filter(i => i.status === 'pending').length, approved: items.filter(i => i.status === 'approved').length, denied: items.filter(i => i.status === 'denied').length },
  created_at: '2026-11-27T09:00:00Z', updated_at: '2026-11-27T10:00:00Z', decided_at: status === 'pending' ? null : '2026-11-27T10:00:00Z', items,
})
const renderPage = () => render(
  <MemoryRouter initialEntries={['/dashboard/download-requests/1']}>
    <Routes><Route path="/dashboard/download-requests/:id" element={<DownloadRequestDetail />} /></Routes>
  </MemoryRouter>,
)

beforeEach(() => { get.mockReset(); cancel.mockReset(); file.mockReset() })

describe('member request page', () => {
  it('pending: every photo waits and the request can be cancelled', async () => {
    get.mockResolvedValue(request('pending', [item(1), item(2)]))
    cancel.mockResolvedValue(request('cancelled', [item(1), item(2)]))
    renderPage()
    expect(await screen.findByText('Pending')).toBeTruthy()
    expect(screen.getAllByText('Waiting')).toHaveLength(2)
    expect(screen.queryByRole('button', { name: /Download selected/ })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel request' }))
    get.mockResolvedValue(request('cancelled', [item(1), item(2)]))
    const buttons = await screen.findAllByRole('button', { name: 'Cancel request' })
    fireEvent.click(buttons[buttons.length - 1])
    await waitFor(() => expect(cancel).toHaveBeenCalledWith(1))
    expect(await screen.findByText('Cancelled', { selector: 'span' })).toBeTruthy()
  })

  it('approved: downloads are offered, no cancel', async () => {
    get.mockResolvedValue(request('approved', [approved(1), approved(2)]))
    renderPage()
    expect((await screen.findAllByText('Approved')).length).toBe(3) // the request and its two photos
    expect(screen.getAllByText('Ready to download')).toHaveLength(2)
    expect(screen.getByRole('button', { name: /Download all approved \(ZIP\)/ })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Cancel request' })).toBeNull()
  })

  it('partially approved: the denied photo shows its reason; denied: nothing to download', async () => {
    get.mockResolvedValue(request('partially_approved', [approved(1), denied(2)]))
    const { unmount } = renderPage()
    expect(await screen.findByText('Partially approved')).toBeTruthy()
    expect(screen.getByText('Client restriction')).toBeTruthy()
    expect(screen.getByText(/Client said no/)).toBeTruthy()
    unmount()
    get.mockResolvedValue(request('denied', [denied(1), denied(2)]))
    renderPage()
    expect(await screen.findAllByText('Denied')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Download/ })).toBeNull()
  })

  it('an expired approval is shown as expired and cannot be selected', async () => {
    get.mockResolvedValue(request('approved', [approved(1, earlier)]))
    renderPage()
    expect(await screen.findByText('Approval expired')).toBeTruthy()
    expect((screen.getByLabelText('Select p1.jpg for download') as HTMLInputElement).disabled).toBe(true)
    expect(screen.getByText(/No approval on this request can be used any more/)).toBeTruthy()
  })

  it('a download refused as expired says so and reloads the request', async () => {
    get.mockResolvedValue(request('approved', [approved(1)]))
    file.mockRejectedValue(new ApiError(403, 'x', { code: 'download_approval_required', reason: 'expired', detail: 'x' }))
    renderPage()
    fireEvent.click(await screen.findByLabelText('Select p1.jpg for download'))
    get.mockResolvedValue(request('approved', [approved(1, earlier)]))
    fireEvent.click(screen.getByRole('button', { name: /Download selected/ }))
    expect(await screen.findByText(/Your approval for this photo has expired/)).toBeTruthy()
    expect(await screen.findByText('Approval expired')).toBeTruthy()
    expect(get).toHaveBeenCalledTimes(2)
  })
})
