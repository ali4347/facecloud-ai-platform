import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { DOWNLOAD_APPROVAL_REFUSED } from '../lib/api/client'

vi.mock('../lib/api/config', () => ({ API_URL: 'http://api.test', USE_API: true }))
vi.mock('../lib/api/images', async importOriginal => ({
  ...(await importOriginal<object>()),
  getImage: vi.fn(async (id: number) => ({ id, original_name: `photo-${id}.jpg`, organization_id: 9, download_approval_required: true })),
  getPhotoPicture: vi.fn(async () => new Blob(['x'])),
}))
vi.mock('../lib/api/organizations', async importOriginal => ({ ...(await importOriginal<object>()), listOrganizations: vi.fn(async () => [{ id: 9, name: 'Studio' }]) }))
vi.mock('../lib/api/enhancements', async importOriginal => ({ ...(await importOriginal<object>()), getEnhancementResult: vi.fn(async (id: number) => ({ id, image: 40 + id })) }))
vi.mock('../lib/api/editor', async importOriginal => ({ ...(await importOriginal<object>()), getEdit: vi.fn(async (id: number) => ({ id, enhancement_result: 2 })) }))
const check = vi.fn()
vi.mock('../lib/api/downloads', async importOriginal => ({ ...(await importOriginal<object>()), checkDownloadEligibility: (...a: unknown[]) => check(...a) }))

import { DownloadAccessHost } from '../components/downloads/DownloadAccessHost'
import { resolveRefusedFile } from '../lib/refusedFile'

const refuse = (path: string, reason = 'no_grant') => act(() => {
  window.dispatchEvent(new CustomEvent(DOWNLOAD_APPROVAL_REFUSED, { detail: { path, reason, message: 'server sentence' } }))
})

beforeEach(() => check.mockReset())

describe('download refused anywhere in the user portal', () => {
  it('maps every gated file route to its photo and file', async () => {
    expect(await resolveRefusedFile('/api/images/5/download/')).toEqual({ imageId: 5, artifact: 'original' })
    expect(await resolveRefusedFile('/api/images/5/preprocessing/download/')).toEqual({ imageId: 5, artifact: 'original' })
    expect(await resolveRefusedFile('/api/enhancements/results/3/download/')).toEqual({ imageId: 43, artifact: 'enhanced' })
    expect(await resolveRefusedFile('/api/enhancements/edits/8/download/')).toEqual({ imageId: 42, artifact: 'edited', artifactId: 8 })
    expect(await resolveRefusedFile('/api/downloads/packages/1/download/')).toBeNull()
  })

  it('explains the refusal and opens the request for that photo and file', async () => {
    check.mockResolvedValue({ approval_required: true, reviewer_available: true, items: [{ image_id: 5, artifact_type: 'original', eligible: true, reason: '', detail: '', access_state: 'not_requested' }] })
    render(<MemoryRouter><DownloadAccessHost /></MemoryRouter>)
    refuse('/api/images/5/download/')
    expect(await screen.findByText('Download needs approval')).toBeTruthy()
    expect(await screen.findByText('photo-5.jpg')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Request download access' }))
    expect(await screen.findByText('Ready to request')).toBeTruthy()
    expect(check.mock.calls[0][1]).toEqual([{ image_id: 5, artifact_type: 'original' }])
  })

  it('a ZIP or share link refused as bulk_not_allowed points to choosing photos instead', async () => {
    render(<MemoryRouter><DownloadAccessHost /></MemoryRouter>)
    refuse('/api/downloads/packages/1/download/', 'bulk_not_allowed')
    expect(await screen.findByText(/approves downloads photo by photo/)).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Choose photos to request' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Request download access' })).toBeNull()
  })

  it('a refusal that asking cannot fix offers no request', async () => {
    render(<MemoryRouter><DownloadAccessHost /></MemoryRouter>)
    refuse('/api/images/5/download/', 'organization_suspended')
    expect(await screen.findByText(/organization is suspended/)).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Request download access' })).toBeNull()
  })
})
