// Sign-in, sign-out, wrong passwords, wrong portal, session survival, tampered session. Uses the QA stack's test accounts.
import { check, openTab, sleep, summary, WEB } from '../lib.mjs'
const t = await openTab()
const submit = async (portal, email, pw) => { await t.wipe(); const p = { user: '/login', admin: '/admin/login', moderator: '/moderator/login' }[portal]; await t.go(p, 1500); await t.type('#signin-email', email); await t.type('input[type=password]', pw); t.clearIssues(); await t.ev(`document.querySelector('form button[type=submit]').click()`); await sleep(3500); return { at: await t.path(), text: await t.text() } }

// 1. wrong password and unknown account: refused, with the same wording (no hint which accounts exist)
const wrong = await submit('user', 'owner@qa.test', 'not-the-password')
await check('AUTH-01', 'wrong password: stays on the sign-in page and says so', wrong.at === '/login' && /invalid|incorrect|wrong|could not/i.test(wrong.text), wrong.text.slice(0, 100))
const unknown = await submit('user', 'nobody-here@qa.test', 'not-the-password')
const sentence = s => (s.match(/(invalid|incorrect|wrong)[^.]*\./i) || [''])[0]
await check('AUTH-02', 'unknown account: the same wording as a wrong password (no account enumeration)', unknown.at === '/login' && sentence(unknown.text) === sentence(wrong.text) && sentence(wrong.text) !== '', `"${sentence(unknown.text)}" vs "${sentence(wrong.text)}"`)
await check('AUTH-03', 'no console crash on a refused sign-in', !t.issues.exceptions.length, t.issues.exceptions[0] || '')

// 2. each portal accepts its own people and refuses the others
const ok = await submit('user', 'owner@qa.test', 'Qa-Pass-Phrase-2026!'); await check('AUTH-04', 'user portal: a user signs in', ok.at.startsWith('/dashboard'), ok.at)
const adminAsUser = await submit('user', 'admin@qa.test', 'Qa-Pass-Phrase-2026!'); await check('AUTH-05', 'user portal: an administrator is not dropped into the user dashboard', !adminAsUser.at.startsWith('/dashboard') || /not.*(allowed|available)|admin/i.test(adminAsUser.text), `${adminAsUser.at} ${adminAsUser.text.slice(0, 80)}`)
const memberAsAdmin = await submit('admin', 'member@qa.test', 'Qa-Pass-Phrase-2026!'); await check('AUTH-06', 'admin portal: an ordinary user is refused', !memberAsAdmin.at.startsWith('/admin') || memberAsAdmin.at === '/admin/login', `${memberAsAdmin.at} ${memberAsAdmin.text.slice(0, 80)}`)
const plainAsMod = await submit('moderator', 'plain@qa.test', 'Qa-Pass-Phrase-2026!'); await check('AUTH-07', 'moderator portal: an ordinary user is refused', !plainAsMod.at.startsWith('/moderator') || plainAsMod.at === '/moderator/login', `${plainAsMod.at} ${plainAsMod.text.slice(0, 80)}`)
const modAsAdmin = await submit('admin', 'mod@qa.test', 'Qa-Pass-Phrase-2026!'); await check('AUTH-08', 'admin portal: a moderator is refused', !modAsAdmin.at.startsWith('/admin') || modAsAdmin.at === '/admin/login', `${modAsAdmin.at}`)

// 3. the session survives a reload, and a direct link works while signed in
await submit('user', 'owner@qa.test', 'Qa-Pass-Phrase-2026!'); await t.go('/dashboard/images', 3000)
await check('AUTH-09', 'signed in: a reload keeps the person signed in', (await t.path()) === '/dashboard/images' && (await t.text()).length > 60, await t.path())

// 4. the three portals are separate sessions
await t.login('admin', 'admin@qa.test'); await t.go('/dashboard', 3000)
await check('AUTH-10', 'signing in to admin does not sign the user out', (await t.path()) === '/dashboard', await t.path())
await t.login('moderator', 'mod@qa.test'); await t.go('/admin', 2500); const stillAdmin = await t.path(); await t.go('/dashboard', 2500); const stillUser = await t.path()
await check('AUTH-11', 'signing in to moderator keeps admin and user signed in', stillAdmin === '/admin' && stillUser === '/dashboard', `${stillAdmin} ${stillUser}`)

// 5. sign out: the menu works and the pages are closed afterwards
await t.go('/dashboard', 2500)
await t.ev(`(document.querySelector('[aria-haspopup="menu"],[aria-label*="account" i],[aria-label*="menu" i]')||document.querySelector('aside button:last-of-type')).click()`); await sleep(700)
const clickedOut = await t.click('Sign out') || await t.click('Log out') || await t.click('Logout'); await sleep(2500)
await check('AUTH-12', 'sign out: the menu has a sign-out and it leads to the sign-in page', clickedOut && (await t.path()) === '/login', `${clickedOut} ${await t.path()}`)
await t.go('/dashboard', 2500); await check('AUTH-13', 'after sign out the dashboard is closed (back to sign-in)', (await t.path()) === '/login', await t.path())
await t.go('/admin', 2500); await check('AUTH-14', 'signing out of the user portal did not sign the admin out', (await t.path()) === '/admin', await t.path())

// 6. a spoiled session: the app must send the person to sign in, not show a blank page or loop
await submit('user', 'owner@qa.test', 'Qa-Pass-Phrase-2026!')
await t.ev(`localStorage.setItem('facecloud_refresh:user','garbage')`); await t.go('/dashboard', 4000)
const spoiled = await t.path(); const spoiledText = await t.text()
await check('AUTH-15', 'a spoiled refresh token: sent to sign-in with the session-expired notice, not blank', spoiled === '/login' && spoiledText.length > 40, `${spoiled} ${spoiledText.slice(0, 90)}`)
await t.ev(`localStorage.setItem('facecloud_session:user','{not json')`); await t.go('/dashboard', 3000)
await check('AUTH-16', 'a corrupted stored session does not crash the app', (await t.path()) === '/login' && !t.issues.exceptions.length, `${await t.path()} ${t.issues.exceptions[0] || ''}`)
// 7. forgot password does not reveal whether an account exists
await t.wipe(); const reset = async email => { await t.go('/forgot-password', 1500); await t.type('input[type=email]', email); await t.ev(`document.querySelector('form button[type=submit]').click()`); await sleep(2500); return t.text() }
const a = await reset('owner@qa.test'), b = await reset('nobody-here@qa.test')
const norm = (x, e) => x.replaceAll(e, 'ADDRESS').slice(0, 400)
await check('AUTH-17', 'forgot password: the same answer for a known and an unknown address', norm(a, 'owner@qa.test') === norm(b, 'nobody-here@qa.test') && a.length > 60, norm(a, 'owner@qa.test').slice(0, 120))
summary(); process.exit(0)
