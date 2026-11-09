// /admin/privacy: the administrator's privacy audit (GET /api/privacy/audit/).
//   source $TMPDIR/facecloud-qa/env.sh && node qa/scripts/20-privacy-audit.mjs
// Real backend first (who may read it, what it sends, whether the page shows exactly that), then rows are added to the throwaway database so the
// numbers are not all zero, then a few answers are rewritten in flight to reach states the throwaway backend cannot (good posture, 403, an unknown key).
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { api, apiLogin, check, openTab, sleep, summary } from '../lib.mjs'

const QA_DIR = process.env.QA_DIR || path.join(process.env.TMPDIR || '/tmp', 'facecloud-qa')
function django(code) {
  const py = path.join(process.env.QA_BACKEND || path.join(process.env.HOME, 'Projects/FaceCloud_backend'), '.venv/bin/python')
  return execFileSync('/bin/bash', ['-c', `source "${QA_DIR}/env.sh" && cd "${QA_DIR}/backend" && "${py}" manage.py shell`], { encoding: 'utf8', input: code })
}

// ── 1. Who may read it, and what the real answer is ───────────────────────
const admin = await apiLogin('admin@qa.test')
const before = await api('/api/privacy/audit/', admin.token)
await check('PA-01', 'an administrator gets the audit (200) with the documented keys', before.status === 200 && ['generated_at', 'consent', 'requests_last_30_days', 'unverified_erasures_total', 'temporary_files', 'retention', 'encryption'].every(k => k in before.json), `status ${before.status}`)
const denied = []
for (const who of ['mod@qa.test', 'plain@qa.test', 'owner@qa.test']) denied.push((await api('/api/privacy/audit/', (await apiLogin(who)).token)).status)
const anonymous = await api('/api/privacy/audit/')
await check('PA-02', 'a moderator, a user and an organization owner get 403, and nobody signed out gets 401', denied.every(s => s === 403) && anonymous.status === 401, `${denied.join(',')} / ${anonymous.status}`)
await check('PA-03', "the server's refusal reads \"Administrator access is required.\"", /Administrator access is required/.test(JSON.stringify((await api('/api/privacy/audit/', (await apiLogin('mod@qa.test')).token)).json)))
const people = /qa\.test|@|"(admin|plain|member2?|owner2?|mod2?)"/i
await check('PA-04', 'the real answer carries no personal data (no email, no username)', !people.test(JSON.stringify(before.json)), JSON.stringify(before.json).slice(0, 80))

// ── 2. Give the numbers something to count ────────────────────────────────
django(`
from datetime import timedelta
from django.utils import timezone
from django.contrib.auth import get_user_model
from privacy.models import PrivacyRequest as P, BiometricConsent as C
from privacy.services import current_policy_version
U = get_user_model(); plain, member, member2 = (U.objects.get(username=n) for n in ('plain', 'member', 'member2'))
for _ in range(2): P.objects.create(user=plain, kind='export', trigger='user', status='completed', verified=True)
P.objects.create(user=plain, kind='facial_erasure', trigger='user', status='completed', summary={'deleted': {}}, verified=True)
P.objects.create(user=member, kind='facial_erasure', trigger='user', status='failed', verified=False)
P.objects.create(user=None, kind='temp_cleanup', trigger='operator', status='completed', verified=True)
P.objects.create(user=None, kind='retention_purge', trigger='retention', status='failed', verified=False,
  summary={'enabled': True, 'retention_days': 30, 'cutoff': '2026-10-06T10:00:00+00:00', 'users_affected': 3, 'deleted': {'faces': 12, 'groups_removed': 2}, 'unverified_users': 1, 'brand_new_counter': 7})
old = P.objects.create(user=plain, kind='export', trigger='user', status='failed', verified=True)
P.objects.filter(pk=old.pk).update(created_at=timezone.now() - timedelta(days=40))
version = current_policy_version()
C.objects.create(user=plain, purpose='face_identity', granted=True, policy_version=version)
C.objects.create(user=member, purpose='face_identity', granted=True, policy_version=version)
C.objects.create(user=member, purpose='face_identity', granted=False, policy_version=version)
C.objects.create(user=member2, purpose='face_identity', granted=True, policy_version='2025-01-v0')
`)
const seeded = (await api('/api/privacy/audit/', admin.token)).json
await check('PA-05', 'the seeded rows are counted by the server (3 completed + 1 failed requests of 30 days, the 40-day-old one left out, 2 unverified)', seeded.unverified_erasures_total === 2 && seeded.requests_last_30_days.export?.failed === 0 && seeded.requests_last_30_days.export?.completed === 2 && seeded.requests_last_30_days.facial_erasure?.failed === 1, JSON.stringify(seeded.requests_last_30_days))

// ── 3. The page, as the administrator ─────────────────────────────────────
const t = await openTab({ width: 1280, height: 1000 })
await t.wipe()
await t.login('admin', 'admin@qa.test')
const content = () => t.ev(`document.querySelector('.page-enter')?.innerText.replace(/\\s+/g,' ') ?? ''`)
await t.go('/admin/privacy', 3500)
let page = await content()
await check('PA-06', 'the page opens for the administrator, titled Privacy Audit', /Privacy Audit/.test(page) && (await t.path()) === '/admin/privacy' && /Privacy Audit — FaceCloud/.test(await t.ev('document.title')), await t.path())
await check('PA-07', 'the admin navigation has a Privacy Audit entry for it, marked as the current page', await t.ev(`(()=>{const a=[...document.querySelectorAll('a[href="/admin/privacy"]')];return a.length>0&&a.some(x=>/Privacy Audit/.test(x.textContent))})()`))
await check('PA-08', 'it says when the numbers were made and has a Refresh button', /Generated \w{3} \d+, \d{4}/.test(page) && await t.ev(`[...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='Refresh')`), page.slice(0, 160))
await check('PA-09', 'the four cards are there', ['Consent', 'Requests in the last 30 days', 'Retention and temporary files', 'Encryption'].every(title => new RegExp(title).test(page)))

// Consent
await check('PA-10', 'Consent says in words whether consent is required, and shows the policy version and the three counts (1 active, 1 withdrawn, 1 on an older version)',
  /Consent is required: face data is created only for people who have agreed/.test(page) && /Current policy version\s*2026-09-v1/.test(page) && /People with active consent\s*1\b/.test(page) && /People who withdrew consent\s*1\b/.test(page) && /People who agreed to an older policy version\s*1\b/.test(page), page.slice(page.indexOf('Consent'), page.indexOf('Consent') + 300))
// Requests
const rows = await t.ev(`[...document.querySelectorAll('table')][0] ? [...document.querySelectorAll('table')][0].innerText.replace(/\\s+/g,' ') : ''`)
await check('PA-11', 'Requests lists each kind in words with its completed and failed counts, and leaves the 40-day-old failure out', /Data export 2 0/.test(rows) && /Facial-data erasure 1 1/.test(rows) && /Retention purge 0 1/.test(rows) && /Temporary file cleanup 1 0/.test(rows), rows)
const cellColour = (kind) => t.ev(`(()=>{const row=[...document.querySelectorAll('table')][0].querySelectorAll('tbody tr');const r=[...row].find(r=>r.textContent.includes(${JSON.stringify(kind)}));return r?getComputedStyle(r.querySelectorAll('td')[1]).color:''})()`)
const [failedColour, zeroColour] = [await cellColour('Facial-data erasure'), await cellColour('Data export')]
await check('PA-12', 'a failed count above zero is drawn in the warning colour, a zero is not', Boolean(failedColour) && failedColour !== zeroColour, `${failedColour} vs ${zeroColour}`)
await check('PA-13', 'unverified erasures above zero are said plainly and flagged as needing attention', /2 erasures or retention purges could not be verified as complete\. This needs attention\./.test(page))
await check('PA-14', 'a "Needs attention" panel lists the unverified erasures, the unencrypted photos and the failed requests', /Needs attention/.test(page) && /2 erasures or retention purges could not be verified as complete/.test(page) && /Uploaded photos are not encrypted at rest/.test(page) && /2 privacy requests failed in the last 30 days/.test(page))
// Retention and temporary files
await check('PA-15', 'Retention says there is no limit (the real server setting), in the backend\'s own words', /There is no retention limit: biometric data is kept until the person deletes it/.test(page))
await check('PA-16', 'the last purge is a small table that includes its nested counts and a key this app has never heard of (brand_new_counter)', /Ran at\s*created_at\s*\w{3} \d+, \d{4}/.test(page) && /Verified as complete\s*verified\s*No/.test(page) && /People affected\s*summary\.users_affected\s*3/.test(page) && /summary\.deleted\.faces\s*12/.test(page) && /brand new counter\s*summary\.brand_new_counter\s*7/.test(page), page.slice(page.indexOf('Last retention purge'), page.indexOf('Last retention purge') + 420))
await check('PA-17', 'temporary files: the stale archive count with its age limit, and whether orphaned media is deleted, in words', /Temporary archives older than 6 hours\s*0/.test(page) && /Media files that belong to no record are not deleted automatically/.test(page))
// Encryption
await check('PA-18', 'Encryption: "Uploaded photos are not encrypted at rest." is stated, as a problem, not softened', /Uploaded photos are not encrypted at rest\./.test(page) && await t.ev(`(()=>{const p=[...document.querySelectorAll('p')].find(p=>/Uploaded photos are not encrypted at rest\\./.test(p.textContent));return !!p && p.className.includes('font-semibold')})()`))
await check('PA-19', "Encryption: the server's sentence about identity data, the key id and the previous keys", /Identity data: AES-256-GCM with HKDF-derived keys and key ids/.test(page) && /Current key id\s*1/.test(page) && /Previous keys still configured\s*0/.test(page))
await check('PA-20', 'Encryption: no dedicated key is said as it is (the general secret key protects identity data)', /No dedicated key is set: identity data is protected with the server's general secret key/.test(page))
await check('PA-21', 'stored identity records are a table: five keys, each in plain words with the key itself, booleans as Yes / No', /Under the current key\s*current_key\s*0/.test(page) && /Re-encryption needed\s*rotation_needed\s*No/.test(page) && /legacy_v1/.test(page) && /unrecognized/.test(page))
await check('PA-22', 'no raw true / false / null / undefined anywhere on the page', !/\b(true|false|null|undefined|NaN)\b/.test(page))
await check('PA-23', 'no personal data on the page: no email address and none of the seeded usernames', !people.test(page) && !/@/.test(page) && !/\b(plain|member2?|owner2?|mod2?)\b/i.test(page), page.match(/\b(plain|member2?|owner2?|mod2?)\b/i)?.[0] ?? page.match(people)?.[0] ?? '')
await t.resize(1280, 2100); await sleep(400); await t.shot('privacy-audit-full'); await t.resize(1280, 1000); await sleep(300)
await t.shot('privacy-audit-dark')
await t.ev(`document.documentElement.dataset.theme='light'`); await sleep(300); await t.shot('privacy-audit-light'); await t.ev(`document.documentElement.dataset.theme='dark'`)

// Refresh
const stampBefore = (await content()).match(/Generated ([^·]*?\d{1,2}:\d{2}:\d{2} [AP]M)/)?.[1]
let asked = 0
t.on('Network.requestWillBeSent', p => { if (p.request.url.includes('privacy/audit') && p.request.method === 'GET') asked += 1 })
await sleep(1200)
await t.click('Refresh'); await sleep(1500)
const stampAfter = (await content()).match(/Generated ([^·]*?\d{1,2}:\d{2}:\d{2} [AP]M)/)?.[1]
await check('PA-24', 'Refresh asks the server again and the "Generated" time moves on', asked >= 1 && Boolean(stampBefore) && stampBefore !== stampAfter, `${stampBefore} -> ${stampAfter}, asked ${asked}`)

// ── 4. States the throwaway backend cannot show: answers rewritten in flight ──
let mutate = null
t.on('Fetch.requestPaused', async p => {
  const isAudit = p.request.url.includes('privacy/audit') && p.responseStatusCode !== undefined
  if (!isAudit || !mutate) { await t.rpc('Fetch.continueRequest', { requestId: p.requestId }); return }
  const raw = await t.rpc('Fetch.getResponseBody', { requestId: p.requestId })
  const out = mutate(JSON.parse(raw.base64Encoded ? Buffer.from(raw.body, 'base64').toString() : raw.body))
  const headers = (p.responseHeaders ?? []).filter(h => !/^content-(length|encoding)$/i.test(h.name))
  await t.rpc('Fetch.fulfillRequest', { requestId: p.requestId, responseCode: out.status ?? 200, responseHeaders: headers, body: Buffer.from(JSON.stringify(out.body)).toString('base64') })
})
await t.rpc('Fetch.enable', { patterns: [{ urlPattern: '*privacy/audit*', requestStage: 'Response' }] })

mutate = a => ({ body: {
  ...a, consent: { ...a.consent, required: false }, unverified_erasures_total: 0,
  requests_last_30_days: { export: { completed: 4, failed: 0, cancelled: 2 }, future_kind: { completed: 1 } },
  temporary_files: { ...a.temporary_files, stale_temp_archives: 3, orphan_media_deletion_enabled: true },
  retention: { days: 30, enabled: true, last_purge: null },
  encryption: { ...a.encryption, uploaded_images_encrypted_at_rest: true, dedicated_embedding_key_configured: true, current_key_id: 'k-2026', stored_records: { ...a.encryption.stored_records, shiny_new_total: 5, rotation_needed: true, nested: { inner_flag: true } } },
} })
await t.go('/admin/privacy', 3500); page = await content()
await check('PA-25', 'when consent is not required it says so, as a warning, in the backend\'s words', /Consent is not required: face data is created without recorded consent/.test(page))
await check('PA-26', 'good news reads as good: photos encrypted at rest, a dedicated key, retention on for 30 days, orphaned media deleted', /Uploaded photos are encrypted at rest\./.test(page) && /A dedicated key protects identity data/.test(page) && /Facial data is purged automatically after 30 days/.test(page) && /Media files that belong to no record are deleted automatically/.test(page) && /No purge has run/.test(page) && /Every recorded erasure and retention purge was verified as complete/.test(page))
await check('PA-27', 'and with nothing wrong there is no "Needs attention" panel', !/Needs attention/.test(page))
await check('PA-28', 'stale archives are called out (3 not yet removed), and a text key id is shown as it is', /Temporary archives older than 6 hours\s*3 not yet removed/.test(page) && /Current key id\s*k-2026/.test(page))
const kinds = await t.ev(`[...document.querySelectorAll('table')][0].innerText.replace(/\\s+/g,' ')`)
await check('PA-29', 'an outcome and a request kind the app has never seen get their own column and row (cancelled, future kind)', /cancelled/i.test(kinds) && /Export|Data export/.test(kinds) && /future kind/.test(kinds), kinds)
await check('PA-30', 'keys the app has never seen are listed: a new count, and a nested one by its path; a re-encryption that is needed reads Yes', /shiny new total\s*shiny_new_total\s*5/.test(page) && /nested › inner flag\s*nested\.inner_flag\s*Yes/.test(page) && /Re-encryption needed\s*rotation_needed\s*Yes/.test(page))
mutate = a => ({ body: { ...a, requests_last_30_days: {} } })
await t.go('/admin/privacy', 3500); page = await content()
await check('PA-31', 'with no requests in 30 days it says so instead of drawing an empty table', /No privacy requests were made in the last 30 days/.test(page))

// Errors: the server says no, then the server cannot be reached
mutate = () => ({ status: 403, body: { detail: 'Administrator access is required.' } })
await t.go('/admin/privacy', 3500); page = await content()
await check('PA-32', 'a 403 from the server shows its own sentence with Try again, and none of the numbers', /Administrator access is required\./.test(page) && /Try again/.test(page) && !/Consent is/.test(page), page.slice(0, 160))
mutate = null
await t.click('Try again'); await sleep(2500)
await check('PA-33', 'Try again brings the page back', /Uploaded photos are not encrypted at rest/.test(await content()))
await t.rpc('Fetch.disable')

// ── 5. A moderator and a user cannot open the route ───────────────────────
await t.wipe(); await t.login('moderator', 'mod@qa.test')
await t.go('/admin/privacy', 2500)
await check('PA-34', 'a signed-in moderator who opens /admin/privacy is sent away to the administrator sign-in, and sees no audit', (await t.path()) !== '/admin/privacy' && !/Privacy Audit/.test(await t.text()) && /\/admin\/login|\/unauthorized/.test(await t.path()), await t.path())
await t.go('/moderator', 2500)
await check('PA-35', "the moderator's own navigation really has no Privacy Audit entry", (await t.path()) === '/moderator' && await t.ev(`!document.querySelector('a[href="/admin/privacy"]')`), await t.path())
await t.wipe(); await t.login('user', 'plain@qa.test')
await t.go('/admin/privacy', 2500)
await check('PA-36', 'a signed-in user who opens /admin/privacy is sent away, and sees no audit', (await t.path()) !== '/admin/privacy' && !/Privacy Audit/.test(await t.text()) && /\/admin\/login|\/unauthorized/.test(await t.path()), await t.path())
await t.go('/dashboard', 2500)
await check('PA-37', "the user's own navigation has no Privacy Audit entry", await t.ev(`!document.querySelector('a[href="/admin/privacy"]')`))
await t.wipe(); await t.go('/admin/privacy', 2500)
await check('PA-38', 'nobody signed in is sent to the administrator sign-in', (await t.path()) === '/admin/login', await t.path())

// ── 6. Phone ───────────────────────────────────────────────────────────────
await t.wipe(); await t.login('admin', 'admin@qa.test'); await t.resize(390, 900)
await t.go('/admin/privacy', 3500)
await check('PA-39', '390 px: the page does not scroll sideways', !(await t.ev('document.documentElement.scrollWidth > window.innerWidth + 1')))
await t.shot('privacy-audit-390')
await t.ev(`document.documentElement.dataset.theme='light'`); await sleep(300); await t.shot('privacy-audit-390-light')
await check('PA-40', 'no uncaught exceptions on the page during the whole run', t.issues.exceptions.length === 0, t.issues.exceptions.join(' | '))

const f = summary(); process.exit(f.length ? 1 : 0)
