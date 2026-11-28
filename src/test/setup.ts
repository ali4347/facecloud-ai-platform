import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

/* jsdom has no object URLs; AuthedImage only needs a string back. */
if (!URL.createObjectURL) URL.createObjectURL = vi.fn(() => 'blob:test') as unknown as typeof URL.createObjectURL
if (!URL.revokeObjectURL) URL.revokeObjectURL = vi.fn() as unknown as typeof URL.revokeObjectURL

afterEach(() => {
  cleanup()
  localStorage.clear()
})
