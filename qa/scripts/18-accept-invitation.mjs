// /accept-invitation: the page the administrator's emailed account invitation links to.
//   source $TMPDIR/facecloud-qa/env.sh && node qa/scripts/18-accept-invitation.mjs
// The server allows 30 invitation requests an hour per address and this run uses about 18, so run it once per stack
// (restart the stack for another run). The moderator invitation is made through the real admin Invitations screen; the rest through the same API it calls.
// Emails go to the backend's console, so each token is read from the backend log (the way a person reads it from the inbox).
import fs from 'node:fs/promises'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { API, PASSWORD, api, apiLogin, check, openTab, sleep, summary } from '../lib.mjs'

const QA_DIR = process.env.QA_DIR || path.join(process.env.TMPDIR || '/tmp', 'facecloud-qa')
const LOG = path.join(QA_DIR, 'backend.log')
const NEW_PASSWORD = 'Harbor-Lantern-Quartz-2026!'
const run = Date.now().toString(36)

/** The newest invitation link in the backend log for this address. The console prints the email quoted-printable ("=3D" for "=", "=" at the end of a line when a line was cut), as a mail client would decode it. */
async function tokenFor(email) {
  for (let i = 0; i < 20; i++) {
    const log = await fs.readFile(LOG, 'utf8')
    const at = log.lastIndexOf(`To: ${email}`)
    const found = at >= 0 && log.slice(at, at + 1500).replace(/=\r?\n/g, '').replace(/=3D/g, '=').match(/accept-invitation\?token=([\w-]+)/)
    if (found) return found[1]
    await sleep(500)
  }
  throw new Error(`no invitation email for ${email} in ${LOG}`)
}

/** Run a line of Django against the throwaway database (to age or block an invitation the way time or another admin would). */
function django(code) {
  const backend = path.join(QA_DIR, 'backend')
  const py = path.join(process.env.QA_BACKEND || path.join(process.env.HOME, 'Projects/FaceCloud_backend'), '.venv/bin/python')
  return execFileSync('/bin/bash', ['-c', `source "${QA_DIR}/env.sh" && cd "${backend}" && "${py}" manage.py shell -c ${JSON.stringify(code)}`], { encoding: 'utf8' })
}

const admin = await apiLogin('admin@qa.test')
const adminApi = (p, opts) => api(p, admin.token, opts)
const orgs = await adminApi('/api/organizations/admin/')
const qaTeam = (orgs.json?.results ?? orgs.json ?? []).find(o => o.name === 'QA Team')
await check('AI-00', 'the test stack has the QA Team organization to invite a moderator into', Boolean(qaTeam), `status ${orgs.status}`)
const invite = async (email, role, extra = {}) => {
  const r = await adminApi('/api/user/admin/invitations/', { method: 'POST', body: JSON.stringify({ email, role, ...extra }) })
  if (r.status !== 201) throw new Error(`invite ${email}: ${r.status} ${r.text.slice(0, 200)}`)
  return tokenFor(email)
}

const t = await openTab({ width: 1280, height: 900 })
const link = token => `/accept-invitation?token=${encodeURIComponent(token)}`
const fill = async (u, p, c = p) => { await t.type('#accept-username', u); await t.type('#accept-password', p); await t.type('#accept-confirm', c) }
const submit = () => t.ev(`document.querySelector('form button[type=submit]').click()`)
const hasHorizontalScroll = () => t.ev('document.documentElement.scrollWidth > window.innerWidth + 1')
const heading = () => t.ev(`document.querySelector('h1')?.textContent ?? ''`)
const fieldText = id => t.ev(`document.getElementById(${JSON.stringify(id)})?.textContent ?? ''`)
const storedSessions = () => t.ev(`Object.keys(localStorage).filter(k => /facecloud_(session|refresh)|fc_was_logged_in/.test(k)).join(',')`)
await t.wipe()

// ── 1. No token, invented token ───────────────────────────────────────────
await t.go('/accept-invitation', 1500)
let page = await t.text()
await check('AI-01', 'no token: says the link is incomplete and asks for the email link or a new one', /This link is incomplete/.test(page) && /ask the person who invited you/i.test(page))
await check('AI-02', 'no token: links to sign in', await t.ev(`!!document.querySelector('a[href="/login"]')`))
await t.go(link('this-token-was-invented-by-a-test'), 2000)
page = await t.text()
await check('AI-03', "invented token: shows the server's own sentence", page.includes('This invitation is invalid, used or expired.'), page.slice(0, 160))
await check('AI-04', 'invented token: tells the person to ask for a new link, offers sign-in, no form', /Ask the person who invited you to send a new link/.test(page) && await t.ev(`!!document.querySelector('a[href="/login"]') && !document.querySelector('form')`))

// ── 2. A moderator invitation made from the real admin Invitations screen ──
const modEmail = `mod-${run}@qa.test`
await t.login('admin', 'admin@qa.test')
await t.go('/admin/invitations', 2500)
await t.type('#inv-email', modEmail)
await t.type('#inv-role', 'moderator'); await sleep(400)
await t.ev(`(()=>{const s=document.getElementById('inv-org');const o=[...s.options].find(o=>o.textContent.includes('QA Team'));return o&&(Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(s,o.value),s.dispatchEvent(new Event('change',{bubbles:true})),true)})()`)
await t.ev(`document.querySelector('form button[type=submit]').click()`); await sleep(2500)
await check('AI-05', 'the admin Invitations screen sent the moderator invitation', /Invitation sent to/.test(await t.text()))
const modToken = await tokenFor(modEmail)
await t.wipe()

// ── 3. Ready state: the facts, the form, the address bar ──────────────────
await t.go(link(modToken), 2500)
page = await t.text()
await check('AI-06', 'ready: shows the invited email, "Moderator for QA Team" and the expiry', page.includes(modEmail) && page.includes('Moderator for QA Team') && /Link valid until/i.test(page), page.slice(0, 220))
await check('AI-07', 'ready: the token was removed from the address bar', !(await t.ev('location.search')).includes('token'), await t.ev('location.href'))
await check('AI-08', 'ready: username, password and confirm fields; passwords hidden by default',
  await t.ev(`!!document.getElementById('accept-username') && document.getElementById('accept-password').type==='password' && document.getElementById('accept-confirm').type==='password'`))
await t.ev(`document.querySelector('#accept-password').closest('.relative').querySelector('button').click()`)
await check('AI-09', 'ready: the show button reveals the password field and the label flips to Hide', await t.ev(`document.getElementById('accept-password').type==='text' && document.querySelector('#accept-password').closest('.relative').querySelector('button').getAttribute('aria-label')==='Hide password'`))
await t.ev(`document.querySelector('#accept-password').closest('.relative').querySelector('button').click()`)
await t.shot('invitation-ready-dark')
await t.ev(`document.documentElement.dataset.theme='light'`); await sleep(300)
await t.shot('invitation-ready-light')
await t.ev(`document.documentElement.dataset.theme='dark'`)

// ── 4. Refusals, in the server's words, under the fields ──────────────────
await fill('newmod', NEW_PASSWORD, 'Something-Different-1!'); await submit(); await sleep(500)
await check('AI-10', 'passwords that differ: told under the confirm field, nothing sent', /do not match/.test(await fieldText('accept-confirm-error')) && !(await t.ev('document.body.innerText')).includes('Account created'))
await fill('newmod', '12345'); await submit(); await sleep(1500)
let passwordMessage = await fieldText('accept-password-error')
await check('AI-11', "a weak password: the server's messages appear under the password field", passwordMessage.length > 10, passwordMessage)
await check('AI-12', 'weak password: the form is still there and the cursor went to the password field', await t.ev(`!!document.querySelector('form') && document.activeElement?.id==='accept-password'`))
await t.shot('invitation-weak-password')
await fill('admin', NEW_PASSWORD); await submit(); await sleep(1500)
await check('AI-13', "a taken username: the server's message appears under the username field", /already exists/i.test(await fieldText('accept-username-error')), await fieldText('accept-username-error'))

// ── 5. Success: nothing is signed in, the right sign-in page is offered ───
await fill('newmod', NEW_PASSWORD); await submit(); await sleep(2500)
page = await t.text()
await check('AI-14', 'created: says "Account created" with the chosen username', page.includes('Account created') && page.includes('newmod') && page.includes(modEmail), page.slice(0, 200))
await check('AI-15', 'created: the moderator is pointed at the moderator sign-in page', await t.ev(`document.querySelector('a[href="/moderator/login"]')?.textContent`) === 'Go to moderator sign in')
await check('AI-16', 'created: no tokens or session were stored by this page', (await storedSessions()) === '', await storedSessions())
await t.shot('invitation-created')
await t.go('/moderator/login', 1200)
await t.type('#signin-email', modEmail); await t.type('input[type=password]', NEW_PASSWORD)
await t.ev(`document.querySelector('form button[type=submit]').click()`); await sleep(4500)
await check('AI-17', 'the new moderator signs in at /moderator/login with the invited email and the password just chosen (the sign-in field is an email field, so a username is refused by the browser)', (await t.path()).startsWith('/moderator') && !(await t.path()).includes('login'), await t.path())
await t.wipe()

// ── 6. The same link again, and a link that expired, and one that was cancelled ──
await t.go(link(modToken), 2000)
await check('AI-18', 'the same link a second time: the used-invitation sentence, no form', (await t.text()).includes('This invitation is invalid, used or expired.') && !(await t.exists('form')))
const agedEmail = `aged-${run}@qa.test`
const agedToken = await invite(agedEmail, 'user')
django(`from accounts.models import AccountInvitation as A; from django.utils import timezone; A.objects.filter(email='${agedEmail}').update(expires_at=timezone.now())`)
await t.go(link(agedToken), 2000)
await check('AI-19', 'an expired link: the plain message, no form', (await t.text()).includes('This invitation is invalid, used or expired.') && !(await t.exists('form')))
const cancelledEmail = `cancelled-${run}@qa.test`
const cancelledToken = await invite(cancelledEmail, 'user')
const rows = await adminApi('/api/user/admin/invitations/?status=pending')
const cancelId = (rows.json?.results ?? rows.json).find(r => r.email === cancelledEmail).id
await adminApi(`/api/user/admin/invitations/${cancelId}/`, { method: 'DELETE' })
await t.go(link(cancelledToken), 2000)
await check('AI-20', 'a cancelled invitation: the plain message, no form', (await t.text()).includes('This invitation is invalid, used or expired.') && !(await t.exists('form')))

// ── 7. User and administrator invitations ─────────────────────────────────
const userEmail = `person-${run}@qa.test`
const userToken = await invite(userEmail, 'user')
await t.go(link(userToken), 2000)
await check('AI-21', 'a user invitation reads "User"', /Account type\s*User\b/i.test(await t.text()), (await t.text()).slice(0, 200))
// A slow answer shows the working state and the button cannot be pressed twice.
await fill('regular', NEW_PASSWORD)
await t.rpc('Fetch.enable', { patterns: [{ urlPattern: '*invitations/accept*', requestStage: 'Request' }] })
let held = null
t.on('Fetch.requestPaused', p => { held = p.requestId })
await submit(); await sleep(600)
await check('AI-22', 'while the account is being made the button says so and is disabled', await t.ev(`(()=>{const b=document.querySelector('form button[type=submit]');return b.disabled && b.textContent.includes('Creating account')})()`))
await t.rpc('Fetch.continueRequest', { requestId: held }); await t.rpc('Fetch.disable'); await sleep(2000)
await check('AI-23', 'a user is pointed at the ordinary sign-in page', await t.ev(`document.querySelector('a[href="/login"]')?.textContent`) === 'Go to sign in')
await t.go('/login', 1200)
await t.type('#signin-email', userEmail); await t.type('input[type=password]', NEW_PASSWORD)
await t.ev(`document.querySelector('form button[type=submit]').click()`); await sleep(4000)
await check('AI-24', 'the new user signs in at /login', (await t.path()).startsWith('/dashboard'), await t.path())
await t.wipe()

const adminEmail = `chief-${run}@qa.test`
const adminToken = await invite(adminEmail, 'admin')
await t.go(link(adminToken), 2000)
await check('AI-25', 'an administrator invitation reads "Administrator"', /Account type\s*Administrator/i.test(await t.text()))
await fill('chief', NEW_PASSWORD); await submit(); await sleep(2500)
await check('AI-26', 'an administrator is pointed at the administrator sign-in page', await t.ev(`document.querySelector('a[href="/admin/login"]')?.textContent`) === 'Go to administrator sign in')
await t.go('/admin/login', 1200)
await t.type('#signin-email', adminEmail); await t.type('input[type=password]', NEW_PASSWORD)
await t.ev(`document.querySelector('form button[type=submit]').click()`); await sleep(4000)
await check('AI-27', 'the new administrator signs in at /admin/login', (await t.path()).startsWith('/admin') && !(await t.path()).includes('login'), await t.path())
await t.wipe()

// ── 8. The address got an account in the meantime (409) ───────────────────
const clashEmail = `clash-${run}@qa.test`
const clashToken = await invite(clashEmail, 'user')
django(`from accounts.models import User; User.objects.create_user('already-here', email='${clashEmail}', password='${NEW_PASSWORD}', is_email_verified=True)`)
await t.go(link(clashToken), 2000)
await fill('clashing', NEW_PASSWORD); await submit(); await sleep(2000)
page = await t.text()
await check('AI-28', "409: the server's sentence is shown above the form with a sign-in link", /already exists/i.test(page) && await t.ev(`!!document.querySelector('[role=alert] a[href="/login"]')`), page.slice(0, 260))

// ── 9. The check itself fails (network): another try, not "invalid" ───────
const retryEmail = `retry-${run}@qa.test`
const retryToken = await invite(retryEmail, 'user')
await t.rpc('Fetch.enable', { patterns: [{ urlPattern: '*invitations/inspect*', requestStage: 'Request' }] })
let failures = 0
t.on('Fetch.requestPaused', async p => {
  if (!p.request.url.includes('invitations/inspect')) return
  if (failures++ === 0) await t.rpc('Fetch.failRequest', { requestId: p.requestId, errorReason: 'Failed' })
  else await t.rpc('Fetch.continueRequest', { requestId: p.requestId })
})
await t.go(link(retryToken), 2500)
page = await t.text()
await check('AI-29', 'a network failure while checking: says it could not check, offers Try again (does not call the link invalid)', /Couldn't check your invitation/.test(page) && /Try again/.test(page) && !/invalid, used or expired/.test(page), page.slice(0, 200))
await t.click('Try again'); await sleep(2000)
await check('AI-30', 'Try again then shows the form', (await t.text()).includes(retryEmail) && await t.exists('form'))
await t.rpc('Fetch.disable')

// ── 10. Phone width, light and dark ───────────────────────────────────────
const phoneEmail = `phone-${run}@qa.test`
const phoneToken = await invite(phoneEmail, 'moderator', { organization_id: qaTeam?.id })
await t.resize(390, 800)
await t.go(link(phoneToken), 2500)
await check('AI-31', '390 px: the ready state does not scroll sideways', !(await hasHorizontalScroll()))
await t.shot('invitation-ready-390')
await fill('phonemod', '12345'); await submit(); await sleep(1500)
await check('AI-32', '390 px: field errors do not scroll sideways', !(await hasHorizontalScroll()))
await t.shot('invitation-error-390')
await t.go('/accept-invitation', 1500)
await check('AI-33', '390 px: the incomplete-link state does not scroll sideways', !(await hasHorizontalScroll()))
await t.ev(`document.documentElement.dataset.theme='light'`); await sleep(200)
await t.go(link(phoneToken), 2500)
await t.ev(`document.documentElement.dataset.theme='light'`); await sleep(300)
await t.shot('invitation-ready-390-light')

await check('AI-34', 'no uncaught exceptions on the page during the whole run', t.issues.exceptions.length === 0, t.issues.exceptions.join(' | '))
const f = summary(); process.exit(f.length ? 1 : 0)
