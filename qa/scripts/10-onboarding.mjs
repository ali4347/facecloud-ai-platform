// How a person arrives: signs up alone (a personal workspace, no team), is invited into a team, signs up from an invitation.
// The emails the backend prints in development are read from its log file (QA_DIR/backend.log).
import fs from 'node:fs/promises'
import path from 'node:path'
import { OUT, PASSWORD, WEB, api, apiLogin, check, openTab, sleep, summary } from '../lib.mjs'

const QA = process.env.QA_DIR || `${process.env.TMPDIR || '/tmp'}/facecloud-qa`
const hero = path.join(OUT, 'fixtures', 'hero.jpg')
await fs.mkdir(path.dirname(hero), { recursive: true })
await fs.copyFile(path.join(path.dirname(new URL(import.meta.url).pathname), '..', '..', 'public', 'hero-portrait.png'), hero)   // really a JPEG; needs a moderator's look
const mails = async () => (await fs.readFile(QA + '/backend.log', 'utf8')).replace(/=\r?\n/g, '').replace(/=([0-9A-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
const linkIn = async (subject, pattern) => { const text = await mails(); const hit = text.slice(text.lastIndexOf('Subject: ' + subject)).match(pattern); return hit && hit[0].replace(/^https?:\/\/[^/]+/, WEB) }
const t = await openTab(); await t.wipe()
const main = () => t.ev(`(document.querySelector('main')||document.body).innerText.replace(/\\s+/g,' ')`)
const run = Date.now().toString(36), email = `self${run}@qa.test`

// 1. signs up alone
await t.go('/register', 2000)
await t.type('#register-full-name', 'Self Signup'); await t.type('#register-email-address', email); await t.type('#register-password', PASSWORD); await t.type('#register-confirm-password', PASSWORD)
await t.ev(`document.querySelector('form button[type=submit]').click()`); await sleep(4000)
await check('ONB-01', 'sign-up asks the person to confirm the email address', (await t.path()) === '/verify-email' && /verification link/i.test(await main()), await t.path())
const verify = await linkIn('Verify your FaceCloud email address', /https?:\/\/[^\s"<]*verify-email\?[^\s"<]+/)
await check('ONB-02', 'the verification email has a working link', Boolean(verify))
await t.go(verify, 3500); await t.click('Verify Email'); await sleep(3500)
await check('ONB-03', 'confirming the address leads to the sign-in page', (await t.path()) === '/login', await t.path())
await check('ONB-04', 'the new person signs in to the user portal', (await t.login('user', email)).startsWith('/dashboard'))
await t.go('/dashboard/organization', 3000); await check('ONB-05', 'with no team, My Organization says the person does not own one', /do not own an organization/i.test(await main()), (await main()).slice(0, 90))

// 2. a photo the checks are unsure about, in the person's own workspace (no moderator exists there)
await t.go('/dashboard/upload/single', 2500); await t.setFile('input[type=file]', [hero]); await sleep(1800)
await check('ONB-06', 'with no team there is no "Submit to" choice', !(await t.exists('#submit-to')))
await t.click('Confirm'); await sleep(26000); const own = await main()
await check('ONB-07', 'an unsure photo in one\'s own workspace is not promised a moderator (the backend treats it as accepted and enhances it, so the card says accepted or, before that, "not sure")', !/A moderator will take a look/.test(own) && /(no moderator will look at it|Your photo was accepted)/i.test(own), own.replace(/^.*What the pipeline concluded/, '').slice(0, 160))
await check('ONB-08', 'and it is enhanced like any other (the before/after is shown)', /ENHANCEMENT/.test(own) && /ORIGINAL ENHANCED|WHAT WAS DONE/.test(own), own.slice(own.indexOf('ENHANCEMENT'), own.indexOf('ENHANCEMENT') + 120))

// 3. a team owner invites the person
const owner = (await apiLogin('owner@qa.test')).token
const org = (await api('/api/organizations/', owner)).json; const team = (Array.isArray(org) ? org : org.results).find(o => o.name === 'QA Team')
await api(`/api/organizations/${team.id}/invitations/`, owner, { method: 'POST', body: JSON.stringify({ email, role: 'member' }) })
const invite = await linkIn("You've been invited", /https?:\/\/[^\s"<]*\/invitations\/[^\s"<]+/)
await t.go(invite, 4000); await check('ONB-09', 'the invitation page names the team and the role', /Join QA Team/.test(await main()) && /as a member/.test(await main()), (await main()).slice(0, 120))
await t.click('Join QA Team'); await sleep(3500); await check('ONB-10', 'accepting says "You joined QA Team"', /You joined QA Team/.test(await main()), (await main()).slice(0, 100))
await t.go('/dashboard/upload/single', 2500); await t.setFile('input[type=file]', [hero]); await sleep(1800)
const options = await t.ev(`[...document.querySelectorAll('#submit-to option')].map(o=>o.textContent.trim())`)
await check('ONB-11', 'now "Submit to" offers the personal workspace and the team', options.some(o => /My workspace/.test(o)) && options.some(o => /QA Team/.test(o)), JSON.stringify(options))
const val = await t.ev(`(()=>{const o=[...document.querySelectorAll('#submit-to option')].find(o=>/QA Team/.test(o.textContent));return o?o.value:null})()`)
await t.type('#submit-to', val); await t.click('Confirm'); await sleep(14000)
await check('ONB-12', 'a photo sent to the team waits for the team\'s moderator', /A moderator will take a look/.test(await main()), (await main()).replace(/^.*What the pipeline concluded/, '').slice(0, 100))

// 4. a brand-new address is invited: the person has no account yet
const mod = (await apiLogin('mod@qa.test')).token; const fresh = `fresh${run}@qa.test`
await api(`/api/organizations/${team.id}/invitations/`, mod, { method: 'POST', body: JSON.stringify({ email: fresh, role: 'member' }) })
await t.wipe(); const link2 = await linkIn("You've been invited", /https?:\/\/[^\s"<]*\/invitations\/[^\s"<]+/)
await t.go(link2, 4000); await check('ONB-13', 'signed out, the invitation offers both signing in and creating an account', /Sign in/i.test(await main()) && /Create/i.test(await main()), (await main()).slice(0, 200))
await t.click('Create', 'a,button'); await sleep(2500)
const readOnly = await t.ev(`!!document.querySelector('#register-email-address')?.readOnly`)
await check('ONB-14', 'the invitation sign-up has the invited address filled in and locked', readOnly && (await t.ev(`document.querySelector('#register-email-address')?.value`)) === fresh, await t.path())
await t.type('#register-full-name', 'Fresh Person'); await t.type('#register-password', PASSWORD); await t.type('#register-confirm-password', PASSWORD)
await t.ev(`document.querySelector('form button[type=submit]').click()`); await sleep(6000)
await check('ONB-15', 'creating the account from an invitation signs the person in, one step, no email to confirm', (await t.path()).startsWith('/dashboard'), await t.path())
await t.go('/dashboard/upload/single', 2500); await t.setFile('input[type=file]', [hero]); await sleep(1800)
await check('ONB-16', 'and the new person is already in the team ("Submit to" shows it)', (await t.ev(`[...document.querySelectorAll('#submit-to option')].map(o=>o.textContent).join('|')`)).includes('QA Team'))

// 5. what the administrator sees: reviews nobody can decide must not pile up
const admin = (await apiLogin('admin@qa.test')).token
const ov = (await api('/api/system/moderation/', admin)).json
const orphaned = (ov.organizations_needing_attention || []).filter(o => /workspace/i.test(o.organization_name))
await check('ONB-17', 'the administrator\'s "needs attention" list holds no personal workspace (nobody there can decide a review)', orphaned.length === 0, orphaned.map(o => `${o.organization_name}: ${o.pending}`).join(', ') + ' (BE-006)')
summary(); process.exit(0)
