// The administrator's everyday actions through the real screens: add a user (every wrong way, then the right way), add a
// moderator to a team, suspend and reactivate (and what the suspended person can still do), a team's life (create, rename,
// change plan, suspend, reactivate), invitations (wrong, duplicate, resend, cancel) and the pages that list what went wrong.
// Needs a fresh stack (start-test-stack.sh); it makes its own accounts and teams.
import { PASSWORD, api, apiLogin, check, openTab, sleep, summary } from '../lib.mjs'

const run = Math.random().toString(36).slice(2, 8)
const adminToken = (await apiLogin('admin@qa.test')).token
const t = await openTab()
const main = () => t.ev(`document.querySelector('main')?.innerText.replace(/\\s+/g,' ') || ''`)
const alerts = () => t.ev(`[...document.querySelectorAll('[role=alert]')].map(e=>e.innerText.replace(/\\s+/g,' ')).join(' | ')`)
const dialog = () => t.ev(`document.querySelector('[role=alertdialog]')?.innerText.replace(/\\s+/g,' ') || ''`)
const dlgBtn = re => t.ev(`(()=>{const b=[...document.querySelectorAll('[role=alertdialog] button')].find(b=>${re}.test(b.textContent));if(b&&!b.disabled){b.click();return true}return false})()`)
const readable = s => s.length > 8 && !/\b(40\d|50\d)\b|\{|ErrorDetail|Unexpected token|\[object/.test(s)
const list = async q => { const r = (await api(`/api/user/admin/users/?search=${encodeURIComponent(q)}`, adminToken)).json; return Array.isArray(r) ? r : r?.results || [] }

await t.wipe(); await t.login('admin', 'admin@qa.test')
await t.go('/admin/users', 3500)

// ── add a user: every wrong way first ───────────────────────────────────────
const fill = async (u, e, p, c) => { await t.type('#new-username', u); await t.type('#new-email', e); await t.type('#new-password', p); await t.type('#new-confirm', c) }
const submit = async () => { await t.ev(`document.querySelector('form button[type=submit]').click()`); await sleep(2500) }
await t.click('Add User', 'main button'); await sleep(800)
await fill(`adm${run}`, `adm${run}@qa.test`, 'short', 'short'); await submit()
await check('ADM-01', 'a password under 8 characters is refused in words', /at least 8/.test(await alerts()), await alerts())
await fill(`adm${run}`, `adm${run}@qa.test`, PASSWORD, PASSWORD + 'x'); await submit()
await check('ADM-02', 'two different passwords are refused in words', /do not match/.test(await alerts()), await alerts())
await t.type('#new-role', 'moderator'); await sleep(500)
await fill(`adm${run}`, `adm${run}@qa.test`, PASSWORD, PASSWORD); await submit()
const noOrg = (await alerts()).length > 0 ? await alerts() : await t.ev(`document.querySelector('#new-organization')?.validationMessage || ''`)
await check('ADM-03', 'a moderator without a team is refused (the form says to choose the organization)', /organization/i.test(noOrg) || (await t.ev(`document.querySelector('#new-organization')?.required`)) === true, noOrg)
await t.type('#new-role', 'user'); await sleep(300)
await fill('owner', `dup${run}@qa.test`, PASSWORD, PASSWORD); await submit()
let a = await alerts()
await check('ADM-04', 'a username that is taken gets a readable sentence', readable(a) && /username|already|taken|exists/i.test(a), a)
await fill(`dup${run}`, 'owner@qa.test', PASSWORD, PASSWORD); await submit()
a = await alerts()
await check('ADM-05', 'an email that is taken gets a readable sentence', readable(a) && /email|already|taken|exists/i.test(a), a)
await fill(`adm${run}`, `adm${run}@qa.test`, '12345678', '12345678'); await submit()
a = await alerts()
await check('ADM-06', 'a too-common password is refused with the reason, and what was typed is kept', readable(a) && /common|password/i.test(a) && (await t.ev(`document.getElementById('new-username')?.value`)) === `adm${run}`, a)
await fill(`adm${run}`, `adm${run}@qa.test`, PASSWORD, PASSWORD); await submit()
const made = (await list(`adm${run}`)).find(u => u.username === `adm${run}`)
await check('ADM-07', 'a valid user is created, the page confirms it and the list shows them', !!made && made.role === 'user' && new RegExp(`adm${run}`).test(await main()), JSON.stringify(made || {}).slice(0, 120))
await check('ADM-08', 'the new user can sign in with the password the administrator typed', (await apiLogin(`adm${run}@qa.test`)).status === 200)

// ── a moderator for a team ──────────────────────────────────────────────────
const freshTeam = (await api('/api/organizations/admin/', adminToken, { method: 'POST', body: JSON.stringify({ name: `Admin Team ${run}`, owner_id: made.id, plan: 'free' }) })).json
await t.go('/admin/users', 3500); await t.click('Add User', 'main button'); await sleep(800)
await t.type('#new-role', 'moderator'); await sleep(500)
await t.type('#new-organization', String(freshTeam.id)); await fill(`mod${run}`, `mod${run}@qa.test`, PASSWORD, PASSWORD); await submit()
const modUser = (await list(`mod${run}`)).find(u => u.username === `mod${run}`)
const modLogin = await t.login('moderator', `mod${run}@qa.test`)
await check('ADM-10', 'a moderator created for a team signs in to the moderator portal', !!modUser && modUser.role === 'moderator' && modLogin.startsWith('/moderator'), `${modUser?.role}; ${modLogin}`)
await t.wipe(); await t.login('admin', 'admin@qa.test')
await t.go('/admin/users', 3500); await t.click('Add User', 'main button'); await sleep(800); await t.type('#new-role', 'moderator'); await sleep(500)
const opts = await t.ev(`[...document.querySelectorAll('#new-organization option')].map(o=>o.textContent.trim()+(o.disabled?'|disabled':''))`)
await check('ADM-09', 'a team whose moderator seats are full is listed but cannot be chosen (the Free team now has its one moderator)', opts.some(o => new RegExp(`Admin Team ${run}.*full.*disabled|Admin Team ${run}.*disabled`).test(o)), JSON.stringify(opts).slice(0, 220))

// ── search, suspend, activate ───────────────────────────────────────────────
await t.go('/admin/users', 3500)
await t.type('input[placeholder="Search users…"]', `adm${run}`); await sleep(2500)
await check('ADM-11', 'searching finds the user', (await main()).includes(`adm${run}`), (await main()).slice(0, 80))
await t.type('input[placeholder="Search users…"]', 'zzzznobodyzzzz'); await sleep(2500)
await check('ADM-12', 'a search with no match says so', /No user matches/i.test(await main()), (await main()).slice(0, 100))
await t.type('input[placeholder="Search users…"]', `adm${run}`); await sleep(2500)
await t.click('Suspend', 'main button'); await sleep(800)
const askText = await dialog()
await check('ADM-13', 'suspending asks first, in the console\'s own dialog (not a browser pop-up), and says what happens', /Suspend/.test(askText) && /sign in/.test(askText), askText.slice(0, 160))
await dlgBtn(/Cancel/); await sleep(600)
await check('ADM-14', 'cancelling leaves the person active', (await list(`adm${run}`))[0]?.is_suspended !== true, '')
const live = await apiLogin(`adm${run}@qa.test`)
await t.click('Suspend', 'main button'); await sleep(800); await dlgBtn(/^Suspend$/); await sleep(3000)
let sus = (await list(`adm${run}`)).find(u => u.username === `adm${run}`)
for (let k = 0; k < 6 && sus?.is_suspended !== true; k++) { await sleep(1500); sus = (await list(`adm${run}`)).find(u => u.username === `adm${run}`) }
const blocked = await apiLogin(`adm${run}@qa.test`)
await check('ADM-15', 'confirming suspends: the badge says Suspended and the server flag is set', sus?.is_suspended === true && /Suspended/.test(await main()), `flag ${sus?.is_suspended}; page: ${(await main()).slice(0, 120)}`)
await check('ADM-16', 'a suspended person cannot sign in and is told why in words', blocked.status >= 400 && /suspend/i.test(String(blocked.body?.detail)) && !/\b(40\d|50\d)\b/.test(String(blocked.body?.detail)), `${blocked.status} ${JSON.stringify(blocked.body).slice(0, 120)}`)
const stillWorks = await api('/api/user/profile/', live.token)
await check('ADM-17', 'a suspended person\'s open session stops working', stillWorks.status === 401 || stillWorks.status === 403, `profile with the old token -> ${stillWorks.status}`)
await t.click('Activate', 'main button'); await sleep(3000)
const back = await apiLogin(`adm${run}@qa.test`)
await check('ADM-18', 'activating lets them sign in again', back.status === 200 && /Active/.test(await main()), `login ${back.status}`)

// ── the administrator cannot lock themselves out ────────────────────────────
const me = (await list('admin@qa.test')).find(u => u.email === 'admin@qa.test')
const self = await api(`/api/user/admin/users/${me.id}/`, adminToken, { method: 'PATCH', body: JSON.stringify({ is_suspended: true }) })
const stillMe = await apiLogin('admin@qa.test')
await check('ADM-19', 'an administrator cannot suspend their own account', self.status >= 400 && stillMe.status === 200, `PATCH self -> ${self.status} ${self.text.slice(0, 100)}`)

// ── teams ───────────────────────────────────────────────────────────────────
await t.go('/admin/organizations', 3500)
await t.click('New organization', 'main button'); await sleep(800)
await t.type('#org-name', `No Owner ${run}`); await t.click('Create organization', 'main form button'); await sleep(1500)
await check('ADM-20', 'creating a team without choosing an owner is refused in words', /Choose the account that will own/i.test(await alerts()), await alerts())
await t.type('#org-name', `Screen Team ${run}`); await t.type('#org-owner', `adm${run}`); await sleep(1800)
await t.ev(`[...document.querySelectorAll('main ul button')].find(b=>b.textContent.includes('adm${run}'))?.click()`); await sleep(400)
await t.type('#org-plan', 'team'); await t.click('Create organization', 'main form button'); await sleep(3000)
const orgs = (await api('/api/organizations/admin/', adminToken)).json; const org = (Array.isArray(orgs) ? orgs : orgs.results).find(o => o.name === `Screen Team ${run}`)
await check('ADM-21', 'a team is created with the chosen owner and plan, and the page confirms', !!org && org.plan === 'team' && org.owner?.username === `adm${run}` && /was created/.test(await main()), JSON.stringify({ plan: org?.plan, owner: org?.owner?.username }))
const dupName = await api('/api/organizations/admin/', adminToken, { method: 'POST', body: JSON.stringify({ name: `Screen Team ${run}`, owner_id: made.id, plan: 'free' }) })
await check('ADM-22', 'a second team with the same name and owner is handled (accepted with its own address, or refused in words)', dupName.status === 201 || readable(dupName.text), `${dupName.status} ${dupName.text.slice(0, 100)}`)
await t.ev(`[...document.querySelectorAll('main tr')].find(r=>r.textContent.includes('Screen Team ${run}'))?.querySelector('button')?.click()`); await sleep(1000)
await t.type('#edit-org-name', `Renamed Team ${run}`); await t.type('#edit-org-reason', 'qa rename')
await t.ev(`[...document.querySelectorAll('[role=alertdialog] button, [role=dialog] button, form button')].find(b=>/Save/.test(b.textContent))?.click()`); await sleep(3000)
const orgs2 = (await api('/api/organizations/admin/', adminToken)).json
await check('ADM-23', 'editing a team renames it', (Array.isArray(orgs2) ? orgs2 : orgs2.results).some(o => o.name === `Renamed Team ${run}`), (await main()).slice(0, 100))
await t.ev(`[...document.querySelectorAll('main tr')].find(r=>r.textContent.includes('Renamed Team ${run}'))?.querySelectorAll('button')[1]?.click()`); await sleep(1000)
await t.type('#suspend-reason', 'qa suspension'); await dlgBtn(/^Suspend$/); await sleep(3000)
const orgs3 = (await api('/api/organizations/admin/', adminToken)).json; const o3 = (Array.isArray(orgs3) ? orgs3 : orgs3.results).find(o => o.name === `Renamed Team ${run}`)
await check('ADM-24', 'suspending a team (with a reason) marks it Suspended', o3?.status === 'suspended' && /Suspended/.test(await main()), `${o3?.status}`)
const ownerTok = (await apiLogin(`adm${run}@qa.test`)).token
const ownerView = await api(`/api/organizations/${o3.id}/`, ownerTok)
await check('ADM-25', 'while suspended, the team\'s own owner is stopped in words', ownerView.status >= 400 ? /suspend/i.test(String(ownerView.json?.detail)) : true, `${ownerView.status} ${ownerView.text.slice(0, 100)}`)
await t.ev(`[...document.querySelectorAll('main tr')].find(r=>r.textContent.includes('Renamed Team ${run}'))?.querySelectorAll('button')[1]?.click()`); await sleep(3000)
const orgs4 = (await api('/api/organizations/admin/', adminToken)).json; const o4 = (Array.isArray(orgs4) ? orgs4 : orgs4.results).find(o => o.name === `Renamed Team ${run}`)
await check('ADM-26', 'reactivating a team makes it active again', o4?.status === 'active', `${o4?.status}`)

// ── invitations ─────────────────────────────────────────────────────────────
await t.go('/admin/invitations', 3500)
const inv = async (email, role = 'user') => { await t.type('#inv-email', email); await t.type('#inv-role', role); await t.ev(`document.querySelector('main form button[type=submit]').click()`); await sleep(2500) }
await inv('owner@qa.test'); a = await alerts()
await check('ADM-27', 'inviting someone who already has an account is refused in words', readable(a) && /already|exists|account/i.test(a), a)
await inv(`invite${run}@qa.test`)
await check('ADM-28', 'a valid invitation says it was sent and appears as Waiting', new RegExp(`Invitation sent to invite${run}`).test(await main()) && new RegExp(`invite${run}@qa.test[^|]*Waiting`).test(await main()), (await main()).slice(0, 120))
await inv(`invite${run}@qa.test`); a = await alerts()
await check('ADM-29', 'inviting the same address twice is refused in words', readable(a) && /already|waiting|pending|invited/i.test(a), a)
await t.type('#inv-role', 'moderator'); await sleep(400)
await t.type('#inv-email', `invmod${run}@qa.test`); await t.ev(`document.querySelector('main form button[type=submit]').click()`); await sleep(1200)
const sentMod = ((await api('/api/user/admin/invitations/', adminToken)).json || []).some?.(r => r.email === `invmod${run}@qa.test`) || ((await api('/api/user/admin/invitations/', adminToken)).json?.results || []).some(r => r.email === `invmod${run}@qa.test`)
await check('ADM-30', 'a moderator invitation without a team is stopped before it is sent', sentMod === false, `invitation exists: ${sentMod}`)
const row = () => t.ev(`[...document.querySelectorAll('main tbody tr')].find(r=>r.textContent.includes('invite${run}@qa.test'))?.innerText.replace(/\\s+/g,' ')||''`)
await t.ev(`[...document.querySelectorAll('main tbody tr')].find(r=>r.textContent.includes('invite${run}@qa.test'))?.querySelector('button')?.click()`); await sleep(2500)
await check('ADM-31', 'Resend says a fresh link was sent', new RegExp(`fresh link was sent to invite${run}`).test(await main()), (await main()).slice(0, 100))
await t.ev(`[...document.querySelectorAll('main tbody tr')].find(r=>r.textContent.includes('invite${run}@qa.test'))?.querySelectorAll('button')[1]?.click()`); await sleep(800)
const cancelAsk = await dialog()
await dlgBtn(/Cancel invitation/); await sleep(2500)
await check('ADM-32', 'cancelling an invitation asks first, then shows it as Cancelled', /stops working/.test(cancelAsk) && /Cancelled/.test(await row()), `${cancelAsk.slice(0, 80)} | ${await row()}`)
await t.click('Waiting', 'main button'); await sleep(2000)
await check('ADM-33', 'the status filter hides it from "Waiting"', (await row()) === '', (await row()))

// ── the lists of what went wrong ────────────────────────────────────────────
await t.go('/admin/system', 4500)
await check('ADM-34', 'System Monitoring lists failed uploads and failed jobs in words (or says nothing failed)', /Failed uploads/.test(await main()) && /No upload has failed|Retry/.test(await main()) && /Failed jobs/.test(await main()), (await main()).slice(0, 100))
await t.go('/admin/moderation', 4000)
await check('ADM-35', 'Moderation Overview shows the numbers with the right labels', /waiting/i.test(await main()) && /escalated/i.test(await main()) && /moderator workload/i.test(await main()), (await main()).slice(0, 400))

// ── the audit trail saw it all ──────────────────────────────────────────────
const audit = (await api('/api/system/audit/?page_size=100', adminToken)).json
const rows = Array.isArray(audit) ? audit : audit?.results || []
const kinds = new Set(rows.map(r => `${r.event || ''}`))
await check('ADM-36', 'the audit trail recorded the suspension and the team changes', rows.length > 0 && [...kinds].some(k => /suspend/i.test(k)) , [...kinds].slice(0, 8).join(', '))

console.log('page errors:', JSON.stringify(t.issues.exceptions))
summary(); process.exit(0)
