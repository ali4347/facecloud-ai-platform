import { describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

vi.mock('../lib/api/config', () => ({ API_URL: 'http://api.test', USE_API: true }))
const getProfile = vi.fn()
vi.mock('../lib/api/auth', () => ({ getProfile: () => getProfile() }))

describe('useCurrentUserId', () => {
  it('reads the id from GET /api/user/profile/', async () => {
    getProfile.mockResolvedValueOnce({ id: 42, email: 'a@x.test' })
    const { useCurrentUserId } = await import('../lib/useCurrentUserId')
    const { result } = renderHook(() => useCurrentUserId())
    expect(result.current).toEqual({ id: null, settled: false })
    await waitFor(() => expect(result.current).toEqual({ id: 42, settled: true }))
  })
})
