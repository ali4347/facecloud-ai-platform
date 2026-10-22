// Opens every page of every portal, signed in as the right person, at desktop and phone width, and records what is wrong:
// uncaught errors, console errors, failed or 5xx requests, blank pages, a page that is wider than the screen, demo-data banners.
import { WEB, check, openTab, sleep, summary } from '../lib.mjs'

const PORTALS = {
  public: { login: null, routes: ['/', '/about', '/contact', '/roles/moderator', '/login', '/register', '/forgot-password', '/unauthorized', '/admin/login', '/moderator/login', '/no-such-page'] },
  user: { login: ['user', 'owner@qa.test'], routes: ['/dashboard', '/dashboard/upload', '/dashboard/upload/single', '/dashboard/upload/multiple', '/dashboard/upload/zip', '/dashboard/images', '/dashboard/groups', '/dashboard/groups/review', '/dashboard/downloads', '/dashboard/notifications', '/dashboard/activity', '/dashboard/organization', '/dashboard/settings', '/dashboard/live-enhancement', '/dashboard/jobs'] },
  admin: { login: ['admin', 'admin@qa.test'], routes: ['/admin', '/admin/statistics', '/admin/users', '/admin/audit-logs', '/admin/security', '/admin/organizations', '/admin/moderators', '/admin/moderation', '/admin/invitations', '/admin/system', '/admin/upload-statistics', '/admin/rejection-summary', '/admin/images'] },
  moderator: { login: ['moderator', 'mod@qa.test'], routes: ['/moderator', '/moderator/members', '/moderator/queue', '/moderator/identity', '/moderator/rejected', '/moderator/batches', '/moderator/notifications', '/moderator/reports', '/moderator/logs', '/moderator/audit', '/moderator/settings'] },
}
const only = process.argv[2]
const t = await openTab()
for (const [portal, cfg] of Object.entries(PORTALS)) {
  if (only && only !== portal) continue
  await t.wipe()
  if (cfg.login) { const at = await t.login(...cfg.login); await check(`AUTH-${portal}`, `${portal}: sign-in lands inside the portal`, at.startsWith({ user: '/dashboard', admin: '/admin', moderator: '/moderator' }[portal]), at) }
  for (const route of cfg.routes) {
    await t.resize(1440, 900); t.clearIssues()
    await t.go(route, 3200)
    const [path, text, overflowDesktop, h1] = [await t.path(), await t.text(), await t.ev('document.documentElement.scrollWidth>innerWidth+2'), await t.ev(`document.querySelectorAll('h1,h2').length`)]
    const bad = []
    if (t.issues.exceptions.length) bad.push('uncaught: ' + t.issues.exceptions[0])
    const real = t.issues.http.filter(h => h.status >= 500 || (h.status >= 400 && ![401, 403, 404].includes(h.status)))
    if (real.length) bad.push('HTTP ' + real.map(h => `${h.status} ${h.url}`).slice(0, 2).join(', '))
    const err5 = t.issues.http.filter(h => h.status >= 500); if (err5.length && !real.length) bad.push('5xx')
    // kGpuService: the headless Chrome used here has no GPU, so MediaPipe falls back to the CPU and logs this; not an app fault
    const consoleErrors = t.issues.console.filter(c => !/Failed to load resource|favicon|kGpuService/i.test(c)); if (consoleErrors.length) bad.push('console: ' + consoleErrors[0])
    if (text.length < 40 && route !== '/no-such-page') bad.push('page is blank')
    if (/Showing demo data/i.test(text)) bad.push('shows the demo-data banner while connected to the API')
    if (/Unexpected token|<!DOCTYPE|undefined|NaN|\[object Object\]/.test(text)) bad.push('raw/garbled text on screen: ' + (text.match(/Unexpected token|<!DOCTYPE|undefined|NaN|\[object Object\]/) || [''])[0])
    if (overflowDesktop) bad.push('scrolls sideways on desktop')
    if (cfg.login && route.startsWith({ user: '/dashboard', admin: '/admin', moderator: '/moderator' }[portal]) && !path.startsWith({ user: '/dashboard', admin: '/admin', moderator: '/moderator' }[portal])) bad.push('sent to ' + path)
    const name = `crawl-${portal}-${route.replace(/[^a-z0-9]+/gi, '_')}`
    if (bad.length) await t.shot(name)
    await check(`CRAWL-${portal}${route}`, `${portal} ${route} loads cleanly (desktop)`, bad.length === 0, bad.join('; '))
    // phone width: the same page must fit the screen
    await t.resize(390, 800); await t.go(route, 2200)
    const overflowPhone = await t.ev('document.documentElement.scrollWidth>innerWidth+2')
    const wide = overflowPhone ? await t.ev(`[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>innerWidth+2&&getComputedStyle(e).position!=='fixed').slice(0,3).map(e=>e.tagName+'.'+String(e.className).slice(0,40)).join(' | ')`) : ''
    if (overflowPhone) await t.shot(name + '-phone')
    await check(`PHONE-${portal}${route}`, `${portal} ${route} fits a 390 px phone screen`, !overflowPhone, wide)
  }
}
const failed = summary(); process.exit(failed.length ? 1 : 0)
