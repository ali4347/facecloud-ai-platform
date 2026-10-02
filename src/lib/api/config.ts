/**
 * Where the API lives, and whether to use it at all.
 *
 * `VITE_USE_API=false` keeps every screen on the built-in mock data, so the
 * demo dashboard stays populated while screens are migrated one at a time.
 * Nothing calls the network until a screen opts in.
 */
const rawUrl = (import.meta.env.VITE_API_URL ?? '').trim()

/** Base URL with no trailing slash, so paths can start with "/api/". */
export const API_URL = rawUrl.replace(/\/+$/, '')

export const USE_API =
  String(import.meta.env.VITE_USE_API ?? '').toLowerCase() === 'true' && API_URL !== ''
