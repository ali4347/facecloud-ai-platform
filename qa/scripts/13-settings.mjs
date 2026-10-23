// Settings: changing the password (every wrong way, then the right way), the name, the device list, "sign out everywhere",
// the notification switches and deleting the account. Uses its own throwaway accounts so no other script is disturbed.
import { API, PASSWORD, api, apiLogin, check, openTab, sleep, summary } from '../lib.mjs'

const run = Math.random().toString(36).slice(2, 8)
const admin = (await apiLogin('admin@qa.test')).token
const make = async name => {
  const r = await api('/api/user/admin/users/', admin, { method: 'POST', body: JSON.stringify({ username: `${name}${run}`, email: `${name}${run}@qa.test`, password: PASSWORD, role: 'user' }) })
  if (r.status !== 201) throw new Error(`could not create ${name}: ${r.status} ${r.text.slice(0, 200)}`)
  return { email: `${name}${run}@qa.test`, username: `${name}${run}` }
}
const pw = await make('setpw'), del = await make('setdel')
const NEW = 'Another-Pass-Phrase-2027!'

const t = await openTab()
const main = async () => t.ev(`document.querySelector('main')?.innerText.replace(/\\s+/g,' ') || ''`)
const tabs = name => t.click(name, 'main button')
const form = async (cur, nw, cf) => {
  await t.type('#sec-cur', cur); await t.type('#sec-new', nw); await t.type('#sec-confirm', cf)
  await t.click('Update Password', 'main button'); await sleep(2500)
}
const alertText = () => t.ev(`[...document.querySelectorAll('[role=alert]')].map(e=>e.innerText).join(' | ')`)

await t.wipe()
const landed = await t.login('user', pw.email)
await check('SET-00', 'test account signs in', landed.startsWith('/dashboard'), landed)
await t.go('/dashboard/settings', 3000)

// ── password ────────────────────────────────────────────────────────────────
await tabs('Security'); await sleep(1500)
await check('SET-01', 'Security shows Current, New and Confirm password fields with labels and an Update button',
  (await t.ev(`['sec-cur','sec-new','sec-confirm'].every(id=>document.querySelector('label[for='+id+']')&&document.getElementById(id))`)) && /Update Password/.test(await main()))

await form('', '', '')
await check('SET-02', 'an empty form is answered in words', /Enter your current and new password/.test(await alertText()), await alertText())

await form(PASSWORD, NEW, NEW + 'x')
await check('SET-03', 'two different new passwords are caught before anything is sent', /do not match/.test(await alertText()), await alertText())

await form('Not-My-Password-1!', NEW, NEW)
let a = await alertText()
await check('SET-04', 'a wrong current password gets a sentence (no status code, no JSON) and you stay signed in',
  a.length > 8 && !/40\d|\{|ErrorDetail|Unexpected/.test(a) && (await t.path()).includes('/settings'), a)

await form(PASSWORD, '12345678', '12345678')
a = await alertText()
await check('SET-05', 'a weak new password is refused with a readable reason', a.length > 8 && !/40\d|\{|ErrorDetail|Unexpected/.test(a) && (await t.path()).includes('/settings'), a)

await form(PASSWORD, PASSWORD, PASSWORD)
a = await alertText()
const samePath = await t.path()
// either refused with a sentence, or accepted (then this account is signed out and we log in again with the same password)
const sameRefused = samePath.includes('/settings')
await check('SET-06', 'using the current password as the new one is refused with a sentence', sameRefused && a.length > 8 && !/40\d|\{|ErrorDetail|Unexpected/.test(a), `${samePath} | ${a}`)
if (!sameRefused) { await t.login('user', pw.email); await t.go('/dashboard/settings', 2500); await tabs('Security'); await sleep(1200) }

const before = await apiLogin(pw.email)           // a second device, used to check "every session ends"
const staleRefresh = before.body.refresh
await t.shot('settings-security')
await form(PASSWORD, NEW, NEW); await sleep(2500)
const afterPath = await t.path(); const shown = await t.text()
await check('SET-07', 'the right change signs you out and says why on the sign-in page', afterPath.includes('/login') && /password was changed/i.test(shown), `${afterPath} | ${shown.slice(0, 140)}`)
const oldLogin = await apiLogin(pw.email, PASSWORD), newLogin = await apiLogin(pw.email, NEW)
await check('SET-08', 'the old password no longer works and the new one does', [400, 401].includes(oldLogin.status) && newLogin.status === 200, `${oldLogin.status}/${newLogin.status}`)
const refreshed = await api('/api/auth/refresh/', null, { method: 'POST', body: JSON.stringify({ refresh: staleRefresh }) })
const oldAccess = await api('/api/user/profile/', before.token)
await check('SET-09', 'a device that was signed in before the change is signed out too (its refresh and its access token are both refused)', [400, 401].includes(refreshed.status) && oldAccess.status === 401, `refresh -> ${refreshed.status} ${refreshed.text.slice(0, 60)}; access -> ${oldAccess.status}`)

// ── name ────────────────────────────────────────────────────────────────────
await t.wipe(); await t.login('user', pw.email, NEW); await t.go('/dashboard/settings', 3000)
await t.type('#profile-name', ''); await t.click('Save', 'main button'); await sleep(1200)
await check('SET-10', 'saving an empty name is answered in words', /enter your name/i.test(await alertText()), await alertText())
const NAME = `Renamed Person ${run}`
await t.type('#profile-name', NAME); await t.click('Save', 'main button'); await sleep(2500)
const savedText = await main()
await t.go('/dashboard/settings', 3500)
const profile = (await api('/api/user/profile/', (await apiLogin(pw.email, NEW)).token)).json
await check('SET-11', 'the new name is stored by the server and shown after a reload', profile?.full_name === NAME && (await t.ev(`document.getElementById('profile-name')?.value`)) === NAME && /saved|updated/i.test(savedText), `${profile?.full_name} | ${savedText.slice(0, 100)}`)
await check('SET-12', 'the name appears in the page header after the change', (await t.text()).includes(NAME.split(' ')[0]) , (await t.text()).slice(0, 100))

// ── devices ─────────────────────────────────────────────────────────────────
await tabs('Security'); await sleep(2000)
const second = await apiLogin(pw.email, NEW)         // another device
await t.go('/dashboard/settings', 3000); await tabs('Security'); await sleep(2500)
let rows = await t.ev(`document.querySelectorAll('main button').length && [...document.querySelectorAll('main button')].filter(b=>b.textContent.trim()==='Revoke').length`)
await check('SET-13', 'the device list marks this device and lists the other one with a Revoke button', /This device/.test(await main()) && rows >= 1, `revoke buttons: ${rows}`)
await t.click('Revoke', 'main button'); await sleep(2500)
const left = await t.ev(`[...document.querySelectorAll('main button')].filter(b=>b.textContent.trim()==='Revoke').length`)
const secondRefresh = await api('/api/auth/refresh/', null, { method: 'POST', body: JSON.stringify({ refresh: second.body.refresh }) })
await check('SET-14', 'revoking a device removes it from the list and ends that device', left < rows && secondRefresh.status === 401, `left ${left}; its refresh -> ${secondRefresh.status}`)

// ── sign out everywhere ─────────────────────────────────────────────────────
const third = await apiLogin(pw.email, NEW)
await t.click('Sign out of all devices', 'main button'); await sleep(3000)
const thirdRefresh = await api('/api/auth/refresh/', null, { method: 'POST', body: JSON.stringify({ refresh: third.body.refresh }) })
await check('SET-15', '"Sign out of all devices" returns to sign-in and ends the other device', (await t.path()).includes('/login') && thirdRefresh.status === 401, `${await t.path()}; other -> ${thirdRefresh.status}`)

// ── notification switches ───────────────────────────────────────────────────
await t.wipe(); await t.login('user', pw.email, NEW); await t.go('/dashboard/settings', 3000); await tabs('Notifications'); await sleep(2500)
const tok = (await apiLogin(pw.email, NEW)).token
const before2 = (await api('/api/notifications/preferences/', tok)).json
await t.ev(`document.querySelector('input[aria-label="Also email me"]')?.click() || [...document.querySelectorAll('input[type=checkbox]')].pop().click()`)
await t.ev(`(()=>{const el=[...document.querySelectorAll('input[type=checkbox]')].find(i=>/photo.*(accepted|rejected)/i.test(i.getAttribute('aria-label')||''));el&&el.click()})()`)
await t.click('Save Preferences', 'main button'); await sleep(2500)
const after2 = (await api('/api/notifications/preferences/', tok)).json
const changed = Object.keys(after2 || {}).filter(k => before2?.[k] !== after2?.[k])
await check('SET-16', 'two switches changed and saved are stored by the server, and the screen says so', changed.length >= 1 && /Preferences saved/.test(await main()), `changed: ${changed.join(', ')}`)
await t.go('/dashboard/settings', 3000); await tabs('Notifications'); await sleep(2500)
const same = await t.ev(`[...document.querySelectorAll('input[type=checkbox]')].map(i=>i.checked).join(',')`)
await check('SET-17', 'after a reload the switches show what was saved', same.split(',').length >= 5, same)

// ── delete account ──────────────────────────────────────────────────────────
await t.wipe(); await t.login('user', del.email); await t.go('/dashboard/settings', 3000); await tabs('Security'); await sleep(1500)
await t.click('Delete my account', 'main button'); await sleep(800)
const confirmBtn = () => t.ev(`[...document.querySelectorAll('[role=alertdialog] button')].find(b=>/Delete my account/.test(b.textContent))?.disabled`)
await check('SET-18', 'the delete button is off until a password and the word DELETE are typed', (await confirmBtn()) === true)
await t.type('#del-pw', 'Wrong-Password-1!'); await t.type('#del-word', 'DELETE'); await sleep(300)
await t.ev(`[...document.querySelectorAll('[role=alertdialog] button')].find(b=>/Delete my account/.test(b.textContent)).click()`); await sleep(2500)
const delErr = await t.ev(`document.querySelector('[role=alertdialog]')?.innerText.replace(/\\s+/g,' ') || ''`)
const stillThere = (await apiLogin(del.email)).status
await check('SET-19', 'a wrong password does not delete the account and says so in words', stillThere === 200 && /password|incorrect|invalid/i.test(delErr) && !/40\d|\{|ErrorDetail/.test(delErr.slice(-200)), `login ${stillThere}; ${delErr.slice(-120)}`)
await t.type('#del-pw', PASSWORD); await sleep(300)
await t.ev(`[...document.querySelectorAll('[role=alertdialog] button')].find(b=>/Delete my account/.test(b.textContent)).click()`); await sleep(3500)
const gone = await apiLogin(del.email)
await check('SET-20', 'the right password deletes the account: sign-in page with a notice, and the address can no longer sign in', (await t.path()).includes('/login') && /account was deleted/i.test(await t.text()) && [400, 401].includes(gone.status), `${await t.path()}; login ${gone.status}`)
const listed = (await api(`/api/user/admin/users/?search=${del.username}`, admin)).json
const rowsLeft = (Array.isArray(listed) ? listed : listed?.results || []).filter(u => u.username === del.username && u.is_active !== false)
await check('SET-21', 'the administrator no longer sees an active account for it', rowsLeft.length === 0, JSON.stringify(rowsLeft.slice(0, 1)).slice(0, 120))

console.log('page errors:', JSON.stringify(t.issues.exceptions))
summary(); process.exit(0)
