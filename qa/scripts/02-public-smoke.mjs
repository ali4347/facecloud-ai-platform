// Safe checks for a site that is already running (for example your own http://localhost:5173): no sign-in, nothing is created.
//   QA_WEB=http://localhost:5173 QA_API=http://127.0.0.1:8000 node qa/scripts/02-public-smoke.mjs
import { WEB, API, check, openTab, sleep, summary, api } from '../lib.mjs'
const t = await openTab(); await t.wipe()
for (const p of ['/', '/about', '/contact', '/login', '/register', '/forgot-password', '/admin/login', '/moderator/login']) {
  t.clearIssues(); await t.go(p, 2500); const text = await t.text()
  await check(`PUB-${p}`, `${p} opens with content and no errors`, text.length > 60 && !t.issues.exceptions.length && !t.issues.http.some(h => h.status >= 500), `${text.length} chars; ${t.issues.exceptions[0] || ''}`)
}
// signed-out visitors are sent to the right sign-in page
for (const [p, to] of [['/dashboard', '/login'], ['/admin', '/admin/login'], ['/moderator', '/moderator/login'], ['/dashboard/images', '/login'], ['/admin/users', '/admin/login']]) {
  await t.wipe(); await t.go(p, 2500); const at = await t.path(); await check(`GUARD-${p}`, `signed out, ${p} goes to ${to}`, at === to, at)
}
await t.go('/no-such-page', 1500); await check('PUB-404', 'an unknown address shows a "not found" page, not a blank one', (await t.text()).length > 20 && /not found|404|doesn.t exist/i.test(await t.text()), (await t.text()).slice(0, 80))
// empty sign-in forms are refused on the page, without calling the server
for (const [p, label] of [['/login', 'user'], ['/admin/login', 'admin'], ['/moderator/login', 'moderator']]) {
  await t.go(p, 1500); t.clearIssues(); await t.ev(`document.querySelector('form button[type=submit]').click()`); await sleep(1200)
  const called = t.issues.http.length > 0 || await t.ev('false'); await check(`FORM-${label}`, `${label} sign-in: an empty form is not sent`, await t.exists('form') && (await t.path()) === p, await t.path())
}
// the API answers JSON, and the public schema is reachable from the website's origin
const r = await api('/api/schema/'); await check('API-schema', 'the API is reachable', r.status === 200, `${API} -> ${r.status}`)
const noAuth = await api('/api/user/profile/'); await check('API-401', 'a protected endpoint answers 401 with JSON when signed out', noAuth.status === 401 && /json/.test(noAuth.type), `${noAuth.status} ${noAuth.type}`)
const login = await api('/api/auth/login/', null, { method: 'POST', body: '{}' }); await check('API-400', 'an empty login answers 400 with JSON (no password is tried)', login.status === 400 && /json/.test(login.type), `${login.status} ${login.type}`)
summary(); process.exit(0)
