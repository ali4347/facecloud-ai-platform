// When things go wrong around the app: the server cannot be reached, it answers with an error page, it says "too many
// requests", it is slow, the session ends somewhere else, the person double-clicks, the address does not exist.
// The server is never touched: Chrome is told to refuse, delay or replace specific replies (DevTools "Fetch" domain).
import { API, PASSWORD, WEB, api, apiLogin, check, openTab, sleep, summary } from '../lib.mjs'

const t = await openTab()
const main = () => t.ev(`document.querySelector('main')?.innerText.replace(/\\s+/g,' ') || document.body.innerText.replace(/\\s+/g,' ')`)
const body = () => t.ev(`document.body.innerText.replace(/\\s+/g,' ')`)
const raw = /Failed to fetch|Load failed|NetworkError|TypeError|Unexpected token|ErrorDetail|\[object|undefined|\bnull\b/

// ── a switch for refusing / delaying / replacing the server's replies ───────────────────────────────────────────────
let rules = []
const hits = []
await t.rpc('Fetch.enable', { patterns: [{ urlPattern: `${API}/api/*`, requestStage: 'Request' }] })
t.on('Fetch.requestPaused', async p => {
  const { requestId, request } = p
  const rule = request.method === 'OPTIONS' ? null : rules.find(r => r.when(request.url.replace(API, ''), request.method))
  if (!rule) return t.rpc('Fetch.continueRequest', { requestId })
  rule.count = (rule.count || 0) + 1; hits.push(`${request.method} ${request.url.replace(API, '')}`)
  if (rule.fail) return t.rpc('Fetch.failRequest', { requestId, errorReason: 'ConnectionRefused' })
  if (rule.delay) await sleep(rule.delay)
  if (!rule.status) return t.rpc('Fetch.continueRequest', { requestId })
  return t.rpc('Fetch.fulfillRequest', {
    requestId, responseCode: rule.status,
    responseHeaders: [{ name: 'content-type', value: rule.type || 'application/json' }, { name: 'access-control-allow-origin', value: WEB }, ...(rule.headers || [])],
    body: Buffer.from(rule.body ?? '{}').toString('base64'),
  })
})
const when = (rule) => { const r = { ...rule }; rules.push(r); return r }
const clear = () => { rules = []; hits.length = 0 }
const isList = p => /^\/api\/(enhancements|images|uploads|identities|notifications)\b/.test(p)

await t.wipe(); const landed = await t.login('user', 'member2@qa.test')
await check('RES-00', 'signed in as an ordinary member', landed.startsWith('/dashboard'), landed)

// ── the server cannot be reached ────────────────────────────────────────────────────────────────────────────────────
when({ when: p => p.startsWith('/api/') && !p.includes('/auth/'), fail: true })
await t.go('/dashboard/images', 4500)
let txt = await main(); await t.shot('res-server-down')
await check('RES-01', 'when the server cannot be reached, a list page says so in words (not "Failed to fetch")', !raw.test(txt) && /could not reach the server/i.test(txt), txt.slice(0, 200))
await check('RES-02', '…and offers a way to try again', await t.ev(`[...document.querySelectorAll('main button, main a')].some(b=>/try again|retry|reload|refresh/i.test(b.textContent))`), '')
clear()
await t.click('Try again', 'main button'); await sleep(3500); txt = await main()
await check('RES-03', 'once the server is back, "Try again" shows the page', !/reach|connect/i.test(txt.slice(0, 400)) || /My Images/i.test(txt), txt.slice(0, 160))

// the sign-in form while the server is down
await t.wipe(); await t.go('/login', 1500)
when({ when: p => p.startsWith('/api/'), fail: true })
await t.type('input[type=email]', 'member2@qa.test'); await t.type('input[type=password]', PASSWORD)
await t.ev(`document.querySelector('form button[type=submit]').click()`); await sleep(3000)
txt = await body()
await check('RES-04', 'signing in while the server is down gives a sentence, and the typed email stays', !raw.test(txt.replace(/Welcome Back.*?PORTAL/i, '')) && /could not reach the server/i.test(txt) && (await t.ev(`document.querySelector('input[type=email]')?.value`)) === 'member2@qa.test', txt.slice(0, 260))
clear()

// ── the server answers with something that is not the API ───────────────────────────────────────────────────────────
await t.wipe(); await t.login('user', 'member2@qa.test')
when({ when: isList, status: 500, type: 'text/html', body: '<!doctype html><title>Server Error (500)</title><h1>Server Error (500)</h1>' })
await t.go('/dashboard/images', 4000); txt = await main()
await check('RES-05', 'an HTML error page from the server is explained, not shown as "Unexpected token"', !raw.test(txt) && /server|error/i.test(txt), txt.slice(0, 200))
clear()

// ── "too many requests" ─────────────────────────────────────────────────────────────────────────────────────────────
when({ when: isList, status: 429, body: JSON.stringify({ detail: 'Request was throttled. Expected available in 3000 seconds.' }), headers: [{ name: 'retry-after', value: '3000' }] })
await t.go('/dashboard/images', 4000); txt = await main()
await check('RES-06', 'a 429 reads "Too many requests. You can try again in about 50 minutes."', /Too many requests.*(50 minutes)/i.test(txt), txt.slice(0, 200))
clear()

// ── slow server ─────────────────────────────────────────────────────────────────────────────────────────────────────
when({ when: isList, delay: 6000 })
await t.go('/dashboard/images', 800); const slowTxt = await main()
await check('RES-07', 'while a list is slow the page shows that it is loading (not an empty or broken page)', /loading|please wait|…|\.\.\./i.test(slowTxt) || (await t.ev(`!!document.querySelector('[role=status], .animate-spin, [aria-busy=true]')`)), slowTxt.slice(0, 160))
await sleep(7500); const doneTxt = await main()
await check('RES-08', 'and it finishes by itself when the answer arrives', !/loading/i.test(doneTxt.slice(0, 300)) || doneTxt.length > slowTxt.length, doneTxt.slice(0, 160))
clear()

// ── the session ends somewhere else ─────────────────────────────────────────────────────────────────────────────────
await t.wipe(); await t.login('user', 'member2@qa.test'); await t.go('/dashboard', 2500)
const other = await apiLogin('member2@qa.test')
await api('/api/user/logout-all/', other.token, { method: 'POST' })
await t.click('My Images', 'a'); await sleep(4000)
const afterPath = await t.path(); const afterTxt = await body()
await check('RES-09', 'when the session was ended elsewhere, the next click leads to the sign-in page (not a page of errors)', afterPath.includes('/login') && !/credentials|token/i.test(afterTxt), `${afterPath} | ${afterTxt.slice(0, 160)}`)
await check('RES-10', '…and the sign-in page says why', /signed out|session|sign in again/i.test(afterTxt), afterTxt.slice(0, 200))

// ── back button after signing out ───────────────────────────────────────────────────────────────────────────────────
await t.wipe(); await t.login('user', 'member2@qa.test'); await t.go('/dashboard/images', 3000)
await t.ev(`localStorage.clear()`)                 // what signing out leaves behind
await t.ev(`history.back()`); await sleep(2500)
const backPath = await t.path()
await t.go('/dashboard/images', 2500)
await check('RES-11', 'a private page opened without a session sends you to sign in', (await t.path()).includes('/login'), await t.path())

// ── double click ────────────────────────────────────────────────────────────────────────────────────────────────────
await t.wipe(); await t.login('admin', 'admin@qa.test'); await t.go('/admin/invitations', 3500)
const email = `double${Math.random().toString(36).slice(2, 7)}@qa.test`
clear(); const spy = when({ when: (p, m) => m === 'POST' && p.startsWith('/api/user/admin/invitations/'), delay: 1500 })
await t.type('#inv-email', email)
await t.ev(`(()=>{const b=document.querySelector('main form button[type=submit]');b.click();b.click();b.click()})()`); await sleep(5000)
await check('RES-12', 'clicking "Send invitation" three times sends one request', spy.count === 1, `requests: ${spy.count}`)
clear()

// ── an address that does not exist ──────────────────────────────────────────────────────────────────────────────────
await t.wipe(); await t.go('/this/page/does/not/exist', 2500); txt = await body()
await check('RES-13', 'an unknown address shows a "not found" page with a way back', /not found|404|does not exist|can.t find/i.test(txt) && (await t.ev(`!![...document.querySelectorAll('a')].find(a=>/home|back|dashboard|FaceCloud|Face Cloud/i.test(a.textContent))`)), txt.slice(0, 160))
await t.login('user', 'member2@qa.test'); await t.go('/dashboard/nothing-here', 2500); txt = await body()
await check('RES-14', 'signed in, an unknown address inside the portal also says so (no blank page)', txt.length > 60 && /not found|404|does not exist|can.t find/i.test(txt), txt.slice(0, 160))

// ── a person from the wrong portal ──────────────────────────────────────────────────────────────────────────────────
await t.go('/admin/users', 2500)
await check('RES-15', 'a member who opens an administrator address is sent to the administrator sign-in, not shown the page', (await t.path()).includes('/admin/login') || (await t.path()).includes('/login'), await t.path())

// ── the keyboard ────────────────────────────────────────────────────────────────────────────────────────────────────
await t.wipe(); await t.login('admin', 'admin@qa.test'); await t.go('/admin/organizations', 3500)
await t.ev(`[...document.querySelectorAll('main tr')].find(r=>/Suspend/.test(r.textContent))?.querySelectorAll('button')[1]?.click()`); await sleep(700)
const opened = await t.ev(`!!document.querySelector('[role=alertdialog]')`)
const focused = await t.ev(`document.activeElement?.textContent.trim()`)
await t.rpc('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }); await t.rpc('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }); await sleep(600)
await check('RES-16', 'a confirmation dialog opens with focus on Cancel and closes with Escape', opened && /Cancel/.test(focused) && !(await t.ev(`!!document.querySelector('[role=alertdialog]')`)), `opened=${opened} focus="${focused}"`)

console.log('page errors:', JSON.stringify(t.issues.exceptions))
await t.rpc('Fetch.disable')
summary(); process.exit(0)
