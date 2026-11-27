/**
 * Production build safety: one set of rules, used by
 *  - vite.config.ts (a `vite build` in production mode refuses to start with the wrong settings, and refuses to finish
 *    when the bundle it made does not talk to the live API),
 *  - scripts/verify-bundle.mjs (checks a finished dist/ folder; for CI and the deploy script),
 *  - scripts/build-safety.test.mjs (node --test).
 *
 * Why: the app falls back to its built-in demo data when VITE_USE_API is not "true" or VITE_API_URL is empty
 * (src/lib/api/config.ts). A production bundle built without them looked fine and was deployed in demo mode.
 * Demo mode stays available on purpose: `npm run dev`, and `npm run build:demo` (mode "demo", .env.demo). A build against
 * your own backend is `npm run build:local` (mode "development", which reads .env.local).
 *
 * Plain JavaScript with no dependencies, so Node can run it without a build step.
 */

/** The only API a production bundle may talk to. */
export const PRODUCTION_API_URL = 'https://api.facecloudai.com'

/** Modes that are deliberately not the live site; every other mode is checked like production. */
export const UNCHECKED_MODES = ['development', 'demo', 'test']

/** True when this build must meet the production rules. */
export const isProductionBuild = (command, mode) => command === 'build' && !UNCHECKED_MODES.includes(mode)

const normalizeUrl = value => String(value ?? '').trim().replace(/\/+$/, '')

/**
 * What is wrong with the settings a production build would bake in, or [] when nothing is.
 * Mirrors src/lib/api/config.ts: USE_API is on only for "true" (any case) together with a non-empty URL.
 */
export function checkProductionEnv(env) {
  const problems = []
  const useApi = String(env.VITE_USE_API ?? '').trim().toLowerCase()
  const url = normalizeUrl(env.VITE_API_URL)
  if (useApi !== 'true') {
    problems.push(`VITE_USE_API is ${env.VITE_USE_API === undefined || env.VITE_USE_API === '' ? 'not set' : `"${env.VITE_USE_API}"`}; a production build must have VITE_USE_API=true, or it ships the demo data.`)
  }
  if (!url) {
    problems.push('VITE_API_URL is empty; a production build without it ships the demo data.')
  } else if (url !== PRODUCTION_API_URL) {
    problems.push(`VITE_API_URL is "${url}"; a production build must use ${PRODUCTION_API_URL}.`)
  }
  return problems
}

/**
 * API addresses that must never be in a production bundle (a developer's machine): 127.0.0.1, 0.0.0.0 or [::1] with
 * any port, and localhost WITH a port. A bare "http://localhost" is left alone: React Router uses it as a dummy base
 * for parsing paths, and it is not where any API runs.
 */
const LOCAL_API = /https?:\/\/(?:(?:127\.0\.0\.1|0\.0\.0\.0|\[::1\])(?::\d+)?|localhost:\d+)/gi

/** What is wrong with the JavaScript of a finished production bundle, or [] when nothing is. */
export function checkBundleCode(code) {
  const problems = []
  if (!code.includes(PRODUCTION_API_URL)) {
    problems.push(`The bundle does not contain ${PRODUCTION_API_URL}: it would run in demo mode.`)
  }
  const local = [...new Set(code.match(LOCAL_API) ?? [])]
  if (local.length) problems.push(`The bundle contains a local API address: ${local.join(', ')}.`)
  return problems
}

export function describeProblems(heading, problems) {
  return [
    heading,
    ...problems.map(problem => `  - ${problem}`),
    '  Production builds use .env.production (VITE_USE_API=true, VITE_API_URL=' + PRODUCTION_API_URL + ').',
    '  Something overrode it (an environment variable, or a .env.production.local file).',
    '  For a demo build run "npm run build:demo"; for a build against your own backend run "npm run build:local".',
  ].join('\n')
}
