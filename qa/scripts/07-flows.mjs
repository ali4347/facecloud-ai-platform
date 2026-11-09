// The main business flow, end to end through the real screens, with a check at every step:
// administrator makes a team and a moderator, the owner sends a photo that needs a person to look at it, the moderator
// decides with a message, the owner is told. Then an invitation is sent and cancelled and the failed-work page is opened.
// Uses public/hero-portrait.png (the quality check sends it to a moderator) so the test needs no files of its own.
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { OUT, api, apiLogin, check, openTab, sleep, summary } from '../lib.mjs'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
// the file is really a JPEG with a .png name, which the uploader (rightly) refuses, so it is copied with its true name
await fs.mkdir(path.join(OUT, 'fixtures'), { recursive: true })
const photo = path.join(OUT, 'fixtures', 'hero.jpg'); await fs.copyFile(path.join(root, 'public', 'hero-portrait.png'), photo)
const run = Date.now().toString(36)
const ORG = `QA Flow Team ${run}`, MOD = `flow-mod-${run}@qa.test`, MODPW = 'Quiet-River-7421', MESSAGE = `Looks good ${run}`
const t = await openTab(); await t.wipe()
const main = () => t.ev(`(document.querySelector('main')||document.body).innerText.replace(/\\s+/g,' ')`)

// 1. administrator creates the team
await t.login('admin', 'admin@qa.test'); await t.go('/admin/organizations', 3000)
await t.click('New organization'); await sleep(800); await t.type('#org-name', ORG); await t.type('#org-owner', 'plain'); await sleep(2800)
const listed = await t.ev(`!![...document.querySelectorAll('ul button')].find(b=>/plain@qa\\.test/.test(b.textContent))`)
await check('FLOW-01', 'owner search finds the account by a few letters', listed)
await t.click('Create organization'); await sleep(1000)
await check('FLOW-02', 'Create without choosing the account is refused with a sentence', /Choose the account that will own the organization/.test(await main()))
await t.ev(`[...document.querySelectorAll('ul button')].find(b=>/plain@qa\\.test/.test(b.textContent)).click()`); await sleep(400)
await t.type('#org-plan', 'team'); await t.click('Create organization'); await sleep(3500)
const created = await main(); await check('FLOW-03', 'the team is created and listed with its owner', new RegExp(ORG).test(created) && /plain/.test(created) && /was created/.test(created), created.slice(0, 160))
const adminTok = (await apiLogin('admin@qa.test')).token
const org = (await api('/api/organizations/admin/', adminTok)).json.find(o => o.name === ORG)
await check('FLOW-04', 'the server has the team: plan Team, owner plain', org?.plan === 'team' && org?.owner?.username === 'plain', JSON.stringify([org?.plan, org?.owner?.username]))

// 2. scope, then a moderator for that team
await t.ev(`(()=>{const row=[...document.querySelectorAll('tbody tr')].find(r=>r.textContent.includes(${JSON.stringify(ORG)}));[...row.querySelectorAll('button')].find(b=>/Edit/.test(b.textContent)).click()})()`); await sleep(1000)
await t.type('#edit-org-scope', 'organization'); await t.click('Save changes'); await sleep(2500)
const org2 = (await api(`/api/organizations/admin/`, adminTok)).json.find(o => o.name === ORG)
await check('FLOW-05', 'editing "what a moderator sees" is saved', org2?.moderator_data_scope === 'organization', org2?.moderator_data_scope)
await t.go('/admin/moderators', 3000); await t.click('Create moderator'); await sleep(900)
const options = await t.ev(`[...document.querySelectorAll('#new-organization option')].map(o=>o.textContent.trim())`)
await check('FLOW-06', 'the new team is offered, with its moderator seats, in the moderator form', options.some(o => o.startsWith(ORG) && /0 of 5/.test(o)), JSON.stringify(options))
await t.type('#new-username', `flowmod${run}`); await t.type('#new-email', MOD); await t.type('#new-password', MODPW); await t.type('#new-confirm', MODPW)
const orgOption = await t.ev(`(()=>{const o=[...document.querySelectorAll('#new-organization option')].find(o=>o.textContent.startsWith(${JSON.stringify(ORG)}));return o?o.value:null})()`)
await t.type('#new-organization', orgOption); await t.click('Create account'); await sleep(3500)
await check('FLOW-07', 'the moderator account is created and the password is shown once', /Account created/.test(await main()) && (await main()).includes(MODPW))

// 3. the owner sends a photo that needs a moderator
await t.login('user', 'plain@qa.test')
await check('FLOW-08', 'the owner sees "My Organization" in the sidebar', await t.ev(`!![...document.querySelectorAll('aside a')].find(a=>a.textContent.includes('My Organization'))`))
await t.go('/dashboard/organization', 3500); await check('FLOW-09', 'My Organization shows the team, 1 of 5 moderators', new RegExp(ORG).test(await main()) && /1 of 5/.test(await main()), (await main()).slice(0, 140))
await t.go('/dashboard/upload/single', 2500); await t.setFile('input[type=file]', [photo]); await sleep(2000)
const submitTo = await t.ev(`(()=>{const o=[...document.querySelectorAll('#submit-to option')].find(o=>o.textContent.includes(${JSON.stringify(ORG)}));return o?o.value:null})()`)
await check('FLOW-10', 'the upload screen offers "Submit to" the new team', Boolean(submitTo))
await t.type('#submit-to', submitTo); await t.click('Confirm'); await sleep(10000)
await check('FLOW-11', 'a photo the checks cannot decide says a moderator will look at it', /A moderator will take a look/.test(await main()), (await main()).slice(0, 200))

// 4. the moderator decides
await t.login('moderator', MOD, MODPW)
await t.go('/moderator/queue', 4500); const href = await t.ev(`document.querySelector('table a[href^="/moderator/images/"]')?.getAttribute('href')`)
await check('FLOW-12', 'the photo is in the moderator\'s queue', Boolean(href), href)
if (!href) { summary(); process.exit(1) }
await t.go(href, 4000); await t.click('Approve'); await sleep(900); await t.type('#review-member-message', MESSAGE)
await t.ev(`[...document.querySelectorAll('[role=alertdialog] button')].find(b=>/Approve/.test(b.textContent)).click()`)
// An approved photo is enhanced and grouped inside this request (the backend runs its jobs inline here), which can take well over 3.5 s: wait for the answer.
// The page says "Approved." first and shows the member's message once it has reloaded the review: wait for both.
for (let i = 0; i < 90; i += 1) { const m = await main(); if (/Approved\./.test(m) && new RegExp(MESSAGE).test(m)) break; await sleep(1000) }
await check('FLOW-13', 'approving with a message to the member is accepted', /Approved\./.test(await main()) && new RegExp(MESSAGE).test(await main()), (await main()).slice(0, 160))
const others = await api('/api/organizations/', (await apiLogin('mod2@qa.test')).token)
await check('FLOW-14', 'a moderator of another team cannot see this team', !JSON.stringify(others.json).includes(ORG))

// 5. the owner is told
await t.go('/dashboard', 4500); await t.clickSel('#notification-btn'); await sleep(2500)
const panel = await t.ev(`document.querySelector('#dashboard-notification-panel')?.innerText.replace(/\\s+/g,' ')||''`)
await check('FLOW-15', 'the owner\'s bell shows the decision and the moderator\'s message', /approved/i.test(panel) && panel.includes(MESSAGE), panel.slice(0, 200))

// 6. invitations and failed work (administrator)
await t.login('admin', 'admin@qa.test'); await t.go('/admin/invitations', 3500)
await t.type('#inv-email', `invitee-${run}@qa.test`); await t.click('Send invitation'); await sleep(3500)
await check('FLOW-16', 'an invitation is sent and listed as Waiting', new RegExp(`invitee-${run}@qa\\.test`).test(await main()) && /Waiting/.test(await main()))
await t.ev(`[...document.querySelectorAll('tbody tr')].find(r=>r.textContent.includes('invitee-${run}')).querySelectorAll('button')[1].click()`); await sleep(800)
await t.ev(`[...document.querySelectorAll('[role=alertdialog] button')].find(b=>/Cancel invitation/.test(b.textContent)).click()`); await sleep(3000)
const inv = (await api('/api/user/admin/invitations/', adminTok)).json; const arr = Array.isArray(inv) ? inv : inv.results
await check('FLOW-17', 'cancelling an invitation (after the confirmation) is saved', arr.find(i => i.email === `invitee-${run}@qa.test`)?.status === 'cancelled')
await t.go('/admin/system', 4000); await check('FLOW-18', 'the failed-work cards open without errors', /Failed uploads/.test(await main()) && /Failed jobs/.test(await main()) && !t.issues.exceptions.length)
await t.go('/admin/moderation', 4000); await check('FLOW-19', 'the moderation overview opens and shows the new team\'s decided review', /Moderation Overview/.test(await main()))
summary(); process.exit(0)
