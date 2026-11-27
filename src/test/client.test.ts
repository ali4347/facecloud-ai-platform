import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('../lib/api/config', () => ({ API_URL: 'http://api.test', USE_API: true }))
vi.mock('../lib/api/tokens', () => ({
  getAccessToken: () => 'token', getRefreshToken: () => 'refresh', setAccessToken: vi.fn(), setRefreshToken: vi.fn(), clearTokens: vi.fn(),
}))

import { DOWNLOAD_APPROVAL_REFUSED, apiFetchBlob, isRestrictedPreview } from '../lib/api/client'

const refused = { detail: 'This image has not been approved for download. Request approval first.', code: 'download_approval_required', reason: 'expired' }

afterEach(() => vi.unstubAllGlobals())

describe('client', () => {
  it('announces a download-approval refusal once, with the path and reason', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(refused), { status: 403, headers: { 'Content-Type': 'application/json' } })))
    const heard = vi.fn()
    window.addEventListener(DOWNLOAD_APPROVAL_REFUSED, heard)
    await expect(apiFetchBlob('/api/images/5/download/')).rejects.toMatchObject({ status: 403 })
    window.removeEventListener(DOWNLOAD_APPROVAL_REFUSED, heard)
    expect(heard).toHaveBeenCalledTimes(1)
    expect((heard.mock.calls[0][0] as CustomEvent).detail).toEqual({ path: '/api/images/5/download/', reason: 'expired', message: refused.detail })
  })

  it('stays quiet when the caller handles the refusal itself', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(refused), { status: 403 })))
    const heard = vi.fn()
    window.addEventListener(DOWNLOAD_APPROVAL_REFUSED, heard)
    await expect(apiFetchBlob('/api/downloads/requests/1/items/2/file/', { handlesApprovalRefusal: true })).rejects.toBeTruthy()
    window.removeEventListener(DOWNLOAD_APPROVAL_REFUSED, heard)
    expect(heard).not.toHaveBeenCalled()
  })

  it('marks a preview the server says is restricted', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(new Blob(['x']), { status: 200, headers: { 'X-Preview-Restricted': 'approval-required' } })))
    expect(isRestrictedPreview(await apiFetchBlob('/api/images/5/thumbnail/?size=256'))).toBe(true)
    vi.stubGlobal('fetch', vi.fn(async () => new Response(new Blob(['x']), { status: 200 })))
    expect(isRestrictedPreview(await apiFetchBlob('/api/images/6/thumbnail/?size=256'))).toBe(false)
  })
})
