// /verify-email-change/:uid/:token: the page the link emailed to a new address opens.
//   source $TMPDIR/facecloud-qa/env.sh && node qa/scripts/21-verify-email-change.mjs
// The backend still mails a link to ITSELF (the owner is changing that to the frontend address), so the uid and token are taken from that
// mail and opened on the frontend route, which is the link the changed mail will carry. Run once per stack: the server allows 10 of these
// requests an hour per address and this run uses all of them, on purpose, to reach the 429.
import fs from 'node:fs/promises'
import path from 'node:path'
import { PASSWORD, api, apiLogin, check, openTab, sleep, summary } from '../lib.mjs'

const QA_DIR = process.env.QA_DIR || path.join(process.env.TMPDIR || '/tmp', 'facecloud-qa')
const run = Date.now().toString(36)

/** The newest link in the backend log for this address, decoded the way a mail client would (quoted-printable). */
async function linkFor(email) {
  for (let i = 0; i < 20; i++) {
    const log = await fs.readFile(path.join(QA_DIR, 'backend.log'), 'utf8')
    const at = log.lastIndexOf(`To: ${email}`)
    const found = at >= 0 && log.slice(at, at + 1500).replace(/=\r?\n/g, '').replace(/=3D/g, '=').match(/verify-email\/change\/([\w-]+)\/([\w-]+)\//)
    if (found) return { uid: found[1], token: found[2] }
    await sleep(500)
  }
  throw new Error(`no confirmation mail for ${email}`)
}
const changeEmail = async (from, to) => {
  const token = (await apiLogin(from)).token
  const r = await api('/api/user/profile/', token, { method: 'PATCH', body: JSON.stringify({ email: to, current_password: PASSWORD }) })
  if (r.status !== 200) throw new Error(`change ${from}: ${r.status} ${r.text.slice(0, 200)}`)
  return linkFor(to)
}
const loginApi = async (email) => api('/api/auth/login/', null, { method: 'POST', body: JSON.stringify({ identifier: email, password: PASSWORD }) })

// ── Two real email changes ────────────────────────────────────────────────
const newA = `confirmed-a-${run}@qa.test`, newB = `confirmed-b-${run}@qa.test`
const linkA = await changeEmail('owner@qa.test', newA)
const linkB = await changeEmail('owner2@qa.test', newB)
const refused = await loginApi(newA)
await check('EC-01', 'after an email change the account is unverified and cannot sign in until the link is opened (the reason every outcome has to say what to do next)', refused.status === 400 && /Email verification is required/.test(refused.text), `${refused.status} ${refused.text.slice(0, 80)}`)
console.log('INFO  the mail still carries a link to the BACKEND today (', `${process.env.QA_API || 'the API'}/api/auth/verify-email/change/<uid>/<token>/`, '), which shows raw JSON; the owner is changing it to the frontend route tested here')

const t = await openTab({ width: 1280, height: 900 })
await t.wipe()
const open = async (link, wait = 2500) => { await t.go(`/verify-email-change/${link.uid}/${link.token}`, wait) }
const text = () => t.ev(`document.querySelector('main, #root')?.innerText.replace(/\\s+/g,' ') ?? ''`)
const heading = () => t.ev(`document.querySelector('h1')?.textContent ?? ''`)
const sideScroll = () => t.ev('document.documentElement.scrollWidth > window.innerWidth + 1')
let confirmRequests = 0
t.on('Network.requestWillBeSent', p => { if (p.request.url.includes('verify-email/change') && p.request.method === 'GET') confirmRequests += 1 })
/** One load, three looks: desktop dark, phone dark, phone light; then back. */
const looks = async name => {
  await t.shot(name + '-dark')
  await t.resize(390, 800); await sleep(300)
  const flat = !(await sideScroll()); await t.shot(name + '-390')
  await t.ev(`document.documentElement.dataset.theme='light'`); await sleep(300); await t.shot(name + '-390-light')
  await t.ev(`document.documentElement.dataset.theme='dark'`); await t.resize(1280, 900); await sleep(200)
  return flat
}

// ── A link that belongs to no account, and a real account with a wrong token ──
await t.go('/verify-email-change/zzzz/not-a-real-token', 2500)
let page = await text()
await check('EC-03', 'a garbage link ("Invalid link.") says the link is no longer valid, what to do, and offers sign-in and help', (await heading()) === 'This link is no longer valid' && /newer email may have replaced it/.test(page) && /start the change again from Settings/.test(page) && await t.ev(`!!document.querySelector('a[href="/login"]') && !!document.querySelector('a[href="/contact"]')`), page.slice(0, 200))
await check('EC-04', "it also shows the server's own sentence, small", /The server said: Invalid link\./.test(page))
await check('EC-05', 'the raw JSON page is not what is shown: no {"detail": on screen, still on the frontend', !/\{"detail"/.test(page) && (await t.ev('location.origin')) === 'http://localhost:5240', page.slice(0, 80))
const invalidFlat = await looks('email-change-invalid')
await check('EC-06', '390 px: the invalid state does not scroll sideways', invalidFlat)
await open({ uid: linkB.uid, token: 'abc-123' })
page = await text()
await check('EC-07', 'a real account with a wrong token ("Invalid or expired token.") reads the same, with the server\'s sentence', (await heading()) === 'This link is no longer valid' && /The server said: Invalid or expired token\./.test(page), page.slice(0, 160))
await check('EC-08', 'and that account is still unverified (a wrong token changed nothing)', (await loginApi(newB)).status === 400)

// ── The server cannot be reached: Try again, and the same real link then works ──
let failOnce = true
t.on('Fetch.requestPaused', async p => { if (failOnce && p.request.url.includes('verify-email/change')) { failOnce = false; await t.rpc('Fetch.failRequest', { requestId: p.requestId, errorReason: 'Failed' }) } else await t.rpc('Fetch.continueRequest', { requestId: p.requestId }) })
await t.rpc('Fetch.enable', { patterns: [{ urlPattern: '*verify-email/change*', requestStage: 'Request' }] })
await open(linkB, 3000)
page = await text()
await check('EC-09', 'an unreachable server is not called an invalid link: it says it could not confirm, with the reason, and offers Try again', (await heading()) === "Couldn't confirm your email address" && /could not reach the server/i.test(page) && /Try again/.test(page) && !/no longer valid/.test(page), page.slice(0, 200))
const failedFlat = await looks('email-change-failed')
await check('EC-10', '390 px: the could-not-confirm state does not scroll sideways', failedFlat)
await t.click('Try again'); await sleep(2500)
await t.rpc('Fetch.disable')
await check('EC-11', 'Try again confirms the address with the same link', (await heading()) === 'Your email address is confirmed', await heading())
await check('EC-12', 'the second account can now sign in', (await loginApi(newB)).status === 200)

// ── A good link ────────────────────────────────────────────────────────────
confirmRequests = 0
await open(linkA, 3000)
page = await text()
await check('EC-13', 'a good link: "Your email address is confirmed", and tells the person they can sign in again', (await heading()) === 'Your email address is confirmed' && /You can sign in again now\./.test(page) && !/already confirmed/.test(page), page.slice(0, 200))
await check('EC-14', 'the page asked the server exactly once as it opened', confirmRequests === 1, `${confirmRequests} request(s)`)
await check('EC-15', 'the account is verified now: it can sign in (the server did the confirming)', (await loginApi(newA)).status === 200)
const confirmedFlat = await looks('email-change-confirmed')
await check('EC-16', '390 px: the confirmed state does not scroll sideways', confirmedFlat)
await check('EC-17', 'the button leads to /login', await t.ev(`document.querySelector('a.fc-btn-primary')?.getAttribute('href')`) === '/login' && await t.click('Sign in') && (await sleep(800), (await t.path()) === '/login'), await t.path())
await check('EC-18', 'the person signs in with the new address and lands on their dashboard', (await t.login('user', newA)) === '/dashboard')
await t.wipe()

// ── The same link again, and a wrong token for an account that is already verified ──
await open(linkA, 2500)
page = await text()
await check('EC-19', 'a used link is not an error: it says the address was already confirmed and that they can sign in', (await heading()) === 'Your email address is confirmed' && /already confirmed, so there was nothing more to do/.test(page) && /You can sign in again now\./.test(page), page.slice(0, 200))
const alreadyFlat = await looks('email-change-already')
await check('EC-20', '390 px: the already-confirmed state does not scroll sideways', alreadyFlat)
await open({ uid: linkA.uid, token: 'garbage-token' }, 2500)
console.log('INFO  a garbage TOKEN with the uid of an account that is already verified shows:', JSON.stringify(await heading()), '(the backend answers 200 "Email is already verified." before it looks at the token)')

// ── Too many tries (the server allows 10 an hour per address) ─────────────
let throttled = 0
for (let i = 0; i < 12 && !throttled; i++) { const r = await api(`/api/auth/verify-email/change/${linkA.uid}/${linkA.token}/`); if (r.status === 429) throttled = i + 1 }
await open(linkA, 2500)
page = await text()
await check('EC-21', 'after too many tries the page says so in the server\'s words (how long to wait) and offers Try again', (await heading()) === 'Too many tries' && /Too many requests\. You can try again in/.test(page) && /Try again/.test(page), page.slice(0, 200))
const throttledFlat = await looks('email-change-throttled')
await check('EC-22', '390 px: the too-many-tries state does not scroll sideways', throttledFlat)
await check('EC-23', 'no uncaught exceptions on the page during the whole run', t.issues.exceptions.length === 0, t.issues.exceptions.join(' | '))

const f = summary(); process.exit(f.length ? 1 : 0)
