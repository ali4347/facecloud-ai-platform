import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ImageListItem } from '../lib/api/images'

vi.mock('../lib/api/config', () => ({ API_URL: 'http://api.test', USE_API: true }))
vi.mock('../lib/api/images', async importOriginal => ({ ...(await importOriginal<object>()), getPhotoPicture: vi.fn(async () => new Blob(['x'])) }))
vi.mock('../components/features/LibraryTabs', () => ({ LibraryTabs: () => null }))
vi.mock('../lib/consent', () => ({ useFaceConsent: () => ({ needsConsent: false }) }))
const listOrganizations = vi.fn()
vi.mock('../lib/api/organizations', async importOriginal => ({ ...(await importOriginal<object>()), listOrganizations: () => listOrganizations() }))
const check = vi.fn()
vi.mock('../lib/api/downloads', async importOriginal => ({ ...(await importOriginal<object>()), checkDownloadEligibility: (...args: unknown[]) => check(...args) }))
let images: ImageListItem[] = []
vi.mock('../lib/imageData', async importOriginal => ({
  ...(await importOriginal<object>()),
  useMyImages: () => ({ data: { count: images.length, next: null, previous: null, results: images }, loading: false, error: null, isDemo: false, reload: vi.fn() }),
}))

import MyImages from '../pages/user/MyImages'

const photo = (id: number, over: Partial<ImageListItem> = {}): ImageListItem => ({
  id, batch: 1, original_name: `photo-${id}.jpg`, file_extension: '.jpg', mime_type: 'image/jpeg', file_size: 1000, width: 10, height: 10,
  status: 'uploaded', display_status: 'completed', rejection_reason: '', download_url: `/api/images/${id}/download/`, thumbnail_url: `/api/images/${id}/thumbnail/`,
  batch_display_name: 'b', upload_type: 'single', quality_decision: { decision: 'accepted' }, face_validation: null, latest_enhancement: null, identity_groups: null,
  created_at: '2026-11-27T10:00:00Z', updated_at: '2026-11-27T10:00:00Z', ...over,
})
const gated = (id: number) => photo(id, { organization_id: 9, download_approval_required: true })
const renderPage = () => render(<MemoryRouter initialEntries={['/dashboard/images']}><MyImages /></MemoryRouter>)

beforeEach(() => {
  check.mockReset()
  listOrganizations.mockResolvedValue([{ id: 9, name: 'Studio', is_personal: false, download_approval_required: true, membership: { id: 1, role: 'member', status: 'active' } }])
})

describe('My Images with download approval', () => {
  it('approval OFF and the personal workspace: nothing changes and nothing is checked', async () => {
    images = [photo(1, { organization_id: 2, download_approval_required: false }), photo(2, { organization_id: 9, download_approval_required: false })]
    renderPage()
    await screen.findByText('2 images')
    expect(check).not.toHaveBeenCalled()
    expect(screen.queryByText(/requires a moderator’s approval/)).toBeNull()
    expect(screen.queryByText(/Preview only/)).toBeNull()
    fireEvent.click(screen.getByLabelText('Select photo-1.jpg'))
    expect(screen.queryByRole('button', { name: /Request download access/ })).toBeNull()
  })

  it('approval ON: only the gated photos are checked; chips, reasons and Select all eligible / Clear work', async () => {
    images = [photo(1, { organization_id: 2, download_approval_required: false }), gated(2), gated(3), gated(4)]
    check.mockResolvedValue({
      approval_required: true, reviewer_available: true, items: [
        { image_id: 2, artifact_type: 'enhanced', eligible: true, reason: '', detail: '', access_state: 'not_requested' },
        { image_id: 3, artifact_type: 'enhanced', eligible: false, reason: 'already_requested', detail: 'Already in an undecided request.', access_state: 'pending' },
        { image_id: 4, artifact_type: 'enhanced', eligible: true, reason: '', detail: '', access_state: 'expired' },
      ],
    })
    renderPage()
    expect(await screen.findByText(/3 photos on this page belong to Studio/)).toBeTruthy()
    expect(check).toHaveBeenCalledTimes(1)
    expect(check.mock.calls[0][0]).toBe(9)
    expect(check.mock.calls[0][1]).toEqual([{ image_id: 2 }, { image_id: 3 }, { image_id: 4 }])
    expect(await screen.findByText('Requested')).toBeTruthy()
    expect(screen.getByText('Approval expired')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Select all eligible (2)' }))
    expect(screen.getByText('2 selected')).toBeTruthy()
    expect((screen.getByLabelText('Select photo-2.jpg') as HTMLInputElement).checked).toBe(true)
    expect((screen.getByLabelText('Select photo-3.jpg') as HTMLInputElement).checked).toBe(false)
    expect(screen.getByRole('button', { name: 'Request download access (2)' })).toBeTruthy()

    // The personal photo can be picked with them, but is not part of the request.
    fireEvent.click(screen.getByLabelText('Select photo-1.jpg'))
    expect(screen.getByText('3 selected')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Request download access (2)' })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
    expect(screen.queryByText(/selected$/)).toBeNull()
  })

  it('opens the request dialog with exactly the selected gated photos', async () => {
    images = [gated(2), gated(4)]
    check.mockResolvedValue({
      approval_required: true, reviewer_available: true, items: [
        { image_id: 2, artifact_type: 'enhanced', eligible: true, reason: '', detail: '', access_state: 'not_requested' },
        { image_id: 4, artifact_type: 'enhanced', eligible: true, reason: '', detail: '', access_state: 'not_requested' },
      ],
    })
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Select all eligible (2)' }))
    fireEvent.click(screen.getByRole('button', { name: 'Request download access (2)' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('photo-2.jpg')).toBeTruthy()
    expect(within(dialog).getByText('photo-4.jpg')).toBeTruthy()
    await waitFor(() => expect(within(dialog).getAllByText('Ready to request')).toHaveLength(2))
  })

  it('warns when the organization has nobody to review', async () => {
    images = [gated(2)]
    check.mockResolvedValue({ approval_required: true, reviewer_available: false, items: [{ image_id: 2, artifact_type: 'enhanced', eligible: true, reason: '', detail: '', access_state: 'not_requested' }] })
    renderPage()
    expect(await screen.findByText(/Nobody in this organization can approve your request yet/)).toBeTruthy()
  })
})
