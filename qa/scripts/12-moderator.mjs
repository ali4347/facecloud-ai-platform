// The moderator's working day: the queue and its filters, claiming, a clash with another moderator, rejecting with a message,
// escalating, keeping in review, a bulk decision, the decision log, and what the member is told. Then deactivating a member.
import fs from 'node:fs/promises'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { API, OUT, PASSWORD, api, apiLogin, check, openTab, sleep, summary } from '../lib.mjs'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const PY = path.join(process.env.QA_BACKEND || path.join(process.env.HOME, 'Projects', 'FaceCloud_backend'), '.venv', 'bin', 'python')
const QA = process.env.QA_DIR || `${process.env.TMPDIR || '/tmp'}/facecloud-qa`
const dir = path.join(OUT, 'moderator'); await fs.rm(dir, { recursive: true, force: true }); await fs.mkdir(dir, { recursive: true })
execFileSync(PY, ['-c', `import cv2,numpy as np,sys\nsrc=cv2.imread(sys.argv[1]);out=sys.argv[2]\nfor i,(g,dx) in enumerate([(0.55,0),(0.6,6),(0.5,12),(0.58,18),(0.52,24),(0.62,30),(0.56,36)]):\n    b=np.clip((src.astype(np.float32)/255)**g*255,0,255).astype(np.uint8)\n    cv2.imwrite('%s/v%d.jpg'%(out,i+1),b[:, dx:] if dx else b,[cv2.IMWRITE_JPEG_QUALITY,92])`, path.join(root, 'public', 'hero-portrait.png'), dir])
const admin = (await apiLogin('admin@qa.test')).token, member = (await apiLogin('member@qa.test')).token, mod = (await apiLogin('mod@qa.test')).token
const run = Date.now().toString(36)
const org = (await api('/api/organizations/admin/', admin)).json.find(o => o.name === 'QA Team'); const O = org.id
// a second moderator for the same team
const second = await api('/api/user/admin/users/', admin, { method: 'POST', body: JSON.stringify({ username: `modb${run}`, email: `modb${run}@qa.test`, password: PASSWORD, role: 'moderator', organization_id: O }) })
await check('MOD-00', 'test data: a second moderator exists for the team', second.status === 201, `${second.status} ${JSON.stringify(second.json).slice(0, 100)}`)
const modB = (await apiLogin(`modb${run}@qa.test`)).token
// seven photos from the member, to the team
for (let i = 1; i <= 7; i++) { const fd = new FormData(); fd.append('organization_id', String(O)); fd.append('file', new Blob([await fs.readFile(path.join(dir, `v${i}.jpg`))], { type: 'image/jpeg' }), `v${i}-${run}.jpg`); await fetch(API + '/api/images/upload/single/', { method: 'POST', headers: { authorization: 'Bearer ' + member }, body: fd }); await sleep(1500) }
await sleep(3000)
const listReviews = async () => { const r = (await api(`/api/organizations/${O}/moderator/reviews/`, mod)).json; return Array.isArray(r) ? r : r.results }
let reviews = (await listReviews()).filter(r => r.image_name?.includes(run) && /^v\d-/.test(r.image_name)); reviews.sort((a, b) => a.id - b.id)
// find each review by the photo's name (the first photo is accepted outright and has no review, so counting by position would be wrong)
const byName = n => reviews.find(r => r.image_name.startsWith(`v${n}-`))?.id
const [R2, R3, R4, R5, R6, R7] = [2, 3, 4, 5, 6, 7].map(byName)
await check('MOD-01', 'the photos sent to the team that the checks were unsure about are waiting for a moderator (6 of the 7)', [R2, R3, R4, R5, R6, R7].every(Boolean) && reviews.every(r => r.status === 'pending'), `${reviews.length} reviews: ${[R2, R3, R4, R5, R6, R7]}`)

const t = await openTab(); await t.wipe(); await t.login('moderator', 'mod@qa.test')
const main = () => t.ev(`(document.querySelector('main')||document.body).innerText.replace(/\\s+/g,' ')`)
const rows = () => t.ev(`document.querySelectorAll('table tbody tr').length`)
await t.go('/moderator/queue', 4500)
await check('MOD-02', 'the queue lists the waiting reviews', (await rows()) >= 6, `${await rows()} rows`)
await t.type('select[aria-label="Filter by status"]', 'approved'); await sleep(3000)
const approvedRows = await rows(); await check('MOD-03', 'filtering by "Approved" shows none yet (and says so)', approvedRows === 0 || /no reviews|nothing/i.test(await main()), `${approvedRows} rows; ${(await main()).slice(0, 80)}`)
await t.type('select[aria-label="Filter by status"]', ''); await sleep(2500)

// claiming, and a clash with the other moderator
await t.ev(`[...document.querySelectorAll('table tbody tr')].find(r=>r.textContent.includes('v2-${run}')).querySelector('button').click()`); await sleep(3000)
let r2 = (await api(`/api/organizations/${O}/moderator/reviews/${R2}/`, mod)).json
await check('MOD-04', 'Claim holds the review for this moderator', r2.is_claimed === true && r2.claimed_by?.username === 'mod', JSON.stringify(r2.claimed_by))
const clash = await api(`/api/organizations/${O}/moderator/reviews/${R2}/decision/`, modB, { method: 'POST', body: JSON.stringify({ action: 'approve' }) })
await check('MOD-05', 'the other moderator cannot decide a held review (409, with a sentence)', clash.status === 409 && /reviewing this right now|held|claim/i.test(JSON.stringify(clash.json)), `${clash.status} ${JSON.stringify(clash.json)}`)
// the clash seen from the screen: B holds R3, A tries to approve it
await api(`/api/organizations/${O}/moderator/reviews/${R3}/claim/`, modB, { method: 'POST' })
await t.go(`/moderator/images/${R3}`, 4000); await t.click('Approve', 'main button'); await sleep(800); await t.ev(`[...document.querySelectorAll('[role=alertdialog] button')].find(b=>/Approve/.test(b.textContent)).click()`); await sleep(3000)
const clashText = await t.ev(`document.querySelector('[role=alertdialog]')?.innerText.replace(/\\s+/g,' ') || ''`)
await check('MOD-06', 'on screen, the refusal is shown in the dialog in words, not as an error code', /reviewing this right now|held|claim/i.test(clashText) && !/409|Request failed/.test(clashText), clashText.slice(0, 160))
await t.ev(`[...document.querySelectorAll('[role=alertdialog] button')].find(b=>/Cancel/.test(b.textContent))?.click()`); await sleep(500)
// the hold button must not offer a Release the server would refuse
const heldBtn = await t.ev(`(()=>{const b=[...document.querySelectorAll('main button')].find(x=>/Held by|Release|Take it/.test(x.textContent)); return b ? b.textContent.trim()+'|'+b.disabled : ''})()`)
await check('MOD-06a', 'a review held by another moderator shows a disabled "Held by …" button, not Release', /^Held by .+\|true$/.test(heldBtn), heldBtn)
await api(`/api/organizations/${O}/moderator/reviews/${R3}/release/`, modB, { method: 'POST' })

// can one moderator let go of another's hold?
const steal = await api(`/api/organizations/${O}/moderator/reviews/${R3}/release/`, mod, { method: 'POST' })
await check('MOD-06b', 'a moderator cannot silently release another moderator\'s hold (or the screen says who holds it)', steal.status >= 400 || (await t.ev(`/reviewing this right now|held by/i.test(document.body.innerText)`)), `release by another moderator -> ${steal.status}`)

// reject with a reason and a message to the member
await t.go(`/moderator/images/${R3}`, 4000); await t.click('Reject', 'main button'); await sleep(800)
const MSG = `Please send a clearer photo ${run}`
await t.type('#review-note', 'Face too dark'); await t.type('#review-member-message', MSG); await t.ev(`[...document.querySelectorAll('[role=alertdialog] button')].find(b=>/Reject/.test(b.textContent)&&!/Cancel/.test(b.textContent)).click()`); await sleep(3500)
const r3 = (await api(`/api/organizations/${O}/moderator/reviews/${R3}/`, mod)).json
await check('MOD-07', 'rejecting with a reason and a message is saved and shown', r3.status === 'rejected' && r3.message_to_member === MSG && /Rejected\./.test(await main()), `${r3.status} "${r3.message_to_member}"`)
const notes = (await api('/api/notifications/?page_size=30', member)).json; const nlist = Array.isArray(notes) ? notes : notes.results
await check('MOD-08', 'the member is told, with the moderator\'s own words', nlist.some(n => JSON.stringify(n).includes(MSG)), nlist.slice(0, 3).map(n => n.title).join(' | '))
await t.go(`/moderator/images/${R3}`, 4000); await check('MOD-09', 'a decided review shows no action buttons ("This review is closed")', /This review is closed/.test(await main()))
const again = await api(`/api/organizations/${O}/moderator/reviews/${R3}/decision/`, mod, { method: 'POST', body: JSON.stringify({ action: 'approve' }) })
await check('MOD-10', 'deciding the same review twice is refused (409, "already decided")', again.status === 409 && /already/i.test(JSON.stringify(again.json)), `${again.status} ${JSON.stringify(again.json)}`)

// escalate, keep in review
await t.go(`/moderator/images/${R4}`, 4000); await t.click('Escalate', 'main button'); await sleep(800); await t.type('#review-note', 'Please look at the face'); await t.ev(`[...document.querySelectorAll('[role=alertdialog] button')].find(b=>/Escalate/.test(b.textContent)&&!/Cancel/.test(b.textContent)).click()`); await sleep(3500)
const r4 = (await api(`/api/organizations/${O}/moderator/reviews/${R4}/`, mod)).json
const ov = (await api('/api/system/moderation/', admin)).json
await check('MOD-11', 'escalating marks the review escalated and the administrator\'s overview counts it', r4.status === 'escalated' && ov.totals.escalated >= 1, `${r4.status}; overview escalated ${ov.totals.escalated}`)
await t.go(`/moderator/images/${R5}`, 4000); await t.click('Keep in review', 'main button'); await sleep(800); await t.type('#review-note', 'Waiting for a second opinion'); await t.ev(`[...document.querySelectorAll('[role=alertdialog] button')].find(b=>/Keep in review/.test(b.textContent)&&!/Cancel/.test(b.textContent)).click()`); await sleep(3500)
const r5 = (await api(`/api/organizations/${O}/moderator/reviews/${R5}/`, mod)).json
await check('MOD-12', '"Keep in review" leaves it open (in review) with the reason recorded', r5.status === 'in_review' && !r5.decided_at, `${r5.status}`)

// a bulk decision
await t.go('/moderator/queue', 4500)
await t.ev(`['${R6}','${R7}'].forEach(id=>{const c=document.querySelector('input[aria-label="Select review '+id+'"]'); if(c&&!c.checked) c.click()})`); await sleep(800)
const selectedText = await main(); await check('MOD-13', 'ticking two reviews shows "2 selected" and the bulk actions', /2 selected/.test(selectedText), selectedText.match(/\d+ selected/)?.[0] ?? 'no bar')
await t.click('Approve', 'button'); await sleep(800)
await t.type('#bulk-message, textarea', `Approved in bulk ${run}`); await t.ev(`[...document.querySelectorAll('[role=alertdialog] button')].find(b=>/Approve/.test(b.textContent)&&!/Cancel/.test(b.textContent))?.click()`); await sleep(4000)
const afterBulk = (await listReviews()).filter(r => [R6, R7].includes(r.id))
await check('MOD-14', 'a bulk approve decides both reviews', afterBulk.length === 2 && afterBulk.every(r => r.status === 'approved'), JSON.stringify(afterBulk.map(r => [r.id, r.status])))
// the decision log and the audit trail
const dash = (await api(`/api/organizations/${O}/moderator/dashboard/`, mod)).json
await t.go('/moderator/logs', 4500); const logText = await main()
await check('MOD-15', 'the Decision Log lists the decisions and today\'s total matches the server', new RegExp(`v3-${run}`).test(logText) && (logText.includes(String(dash.completed_today))), `completed_today=${dash.completed_today}; ${logText.slice(0, 160)}`)
const audit = (await api(`/api/organizations/${O}/audit/?q=reject`, mod)).json; const arows = Array.isArray(audit) ? audit : audit.results
await check('MOD-16', 'the audit trail can be searched ("reject" finds the rejection)', arows.length >= 1, `${arows.length} rows`)
await t.go('/moderator/audit', 4000); await check('MOD-17', 'the audit screen opens with entries', (await rows()) >= 3 || /rejected|approved|escalated/i.test(await main()), (await main()).slice(0, 100))

// members: deactivate and reactivate
const plain = (await apiLogin('plain@qa.test')).token
await api(`/api/organizations/${O}/invitations/`, (await apiLogin('owner@qa.test')).token, { method: 'POST', body: JSON.stringify({ email: 'plain@qa.test', role: 'member' }) })
const text = (await fs.readFile(QA + '/backend.log', 'utf8')).replace(/=\r?\n/g, '').replace(/=([0-9A-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
const token = text.slice(text.lastIndexOf("Subject: You've been invited")).match(/invitations\/([A-Za-z0-9_-]+)/)?.[1]
const joined = await api('/api/organizations/invitations/accept/', plain, { method: 'POST', body: JSON.stringify({ token }) })
await check('MOD-18', 'test data: the person joined the team from the emailed token', [200, 201].includes(joined.status), `${joined.status}`)
const submit = async tkn => { const fd = new FormData(); fd.append('organization_id', String(O)); fd.append('file', new Blob([await fs.readFile(path.join(dir, 'v1.jpg'))], { type: 'image/jpeg' }), `plain-${run}.jpg`); const r = await fetch(API + '/api/images/upload/single/', { method: 'POST', headers: { authorization: 'Bearer ' + tkn }, body: fd }); return r.status }
await t.go('/moderator/members', 4500); await t.ev(`(()=>{const s=document.querySelector('input[placeholder^="Search member"]'); if(s){Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(s,'plain'); s.dispatchEvent(new Event('input',{bubbles:true}))}})()`); await sleep(1200)
const scope = await t.ev(`[...document.querySelectorAll('button')].find(b=>/Whole organization|Everyone|Whole team/i.test(b.textContent))?.click()`); await sleep(1500)
await t.click('Deactivate'); await sleep(3000)
const afterOff = await submit(plain)
await check('MOD-19', 'a deactivated member can no longer submit to the team', afterOff >= 400 && afterOff < 500, `upload status ${afterOff}`)
await t.click('Reactivate'); await sleep(3000)
const afterOn = await submit(plain); await check('MOD-20', 'after reactivating, the member can submit again', afterOn === 201, `upload status ${afterOn}`)
console.log('page errors:', JSON.stringify(t.issues.exceptions))
summary(); process.exit(0)
