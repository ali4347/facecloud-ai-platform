// The administrator's Image Monitoring: the server's sort order, and the Accept / Under review / Reject decision.
//   source $TMPDIR/facecloud-qa/env.sh && node qa/scripts/23-admin-image-monitoring.mjs
// It uploads its own six photos first. Run once per stack: it decides on photos and trashes one.
import fs from 'node:fs/promises'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { API, OUT, api, apiLogin, check, openTab, sleep, summary } from '../lib.mjs'

// Photos to work with: six of the repository's portrait at different brightness, uploaded as plain@qa.test (checks only, no enhancement, so it is quick).
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const PY = path.join(process.env.QA_BACKEND || path.join(process.env.HOME, 'Projects', 'FaceCloud_backend'), '.venv', 'bin', 'python')
const dir = path.join(OUT, 'fixtures-admin'); await fs.rm(dir, { recursive: true, force: true }); await fs.mkdir(dir, { recursive: true })
execFileSync(PY, ['-c', `
import cv2, numpy as np, sys
src = cv2.imread(sys.argv[1]); base = np.clip((src.astype(np.float32)/255) ** 0.55 * 255, 0, 255).astype(np.uint8)
for i, scale in enumerate((0.8, 0.88, 0.96, 1.04, 1.12, 1.2), 1):
    cv2.imwrite(sys.argv[2] + f'/adm-{i}.png', np.clip(base.astype(np.float32) * scale, 0, 255).astype(np.uint8))
`, path.join(root, 'public', 'hero-portrait.png'), dir], { encoding: 'utf8' })
const plain = (await apiLogin('plain@qa.test')).token
for (let i = 1; i <= 6; i++) {
  const fd = new FormData(); fd.append('file', new Blob([await fs.readFile(path.join(dir, `adm-${i}.png`))], { type: 'image/png' }), `adm-${i}.png`); fd.append('auto_enhance', 'false')
  await fetch(API + '/api/images/upload/single/', { method: 'POST', headers: { authorization: 'Bearer ' + plain }, body: fd })
}
await sleep(4000)

const admin = (await apiLogin('admin@qa.test')).token
const list = async q => (await api(`/api/system/images/?page_size=100${q}`, admin))
const names = r => (r.json?.results ?? []).map(i => i.original_name)
const first = await list('')
await check('IM-00', 'there are photos to sort (at least 6)', (first.json?.count ?? 0) >= 6, `${first.json?.count}`)

// ── The server's ordering, read straight from the API ──────────────────────
const ORDER = { oldest: 'created_at', name_asc: 'original_name', name_desc: '-original_name', size_desc: '-file_size', size_asc: 'file_size', owner: 'owner__username', sharp_desc: '-quality_decision__sharpness_score', sharp_asc: 'quality_decision__sharpness_score' }
const sorted = (rows, key, dir = 1) => rows.every((r, i) => i === 0 || (key(rows[i - 1]) <= key(r) ? dir === 1 : dir === -1) || key(rows[i - 1]) === key(r))
const rowsBy = async o => (await list(`&ordering=${o}`)).json?.results ?? []
await check('IM-01', 'the server sorts by name without regard to case, both ways', sorted(await rowsBy('original_name'), r => r.original_name.toLowerCase()) && sorted(await rowsBy('-original_name'), r => r.original_name.toLowerCase(), -1))
await check('IM-02', 'the server sorts by file size and by date, both ways', sorted(await rowsBy('file_size'), r => r.file_size) && sorted(await rowsBy('-file_size'), r => r.file_size, -1) && sorted(await rowsBy('created_at'), r => Date.parse(r.created_at)))
const bad = await list('&ordering=password')
await check('IM-03', 'an ordering the server does not allow is a 400 with its own sentence (the screen only ever sends the allowed ones)', bad.status === 400 && /ordering/.test(bad.text), `${bad.status} ${bad.text.slice(0, 100)}`)

// ── The screen ─────────────────────────────────────────────────────────────
const t = await openTab({ width: 1280, height: 1000 })
const asked = []
t.on('Network.requestWillBeSent', p => { if (p.request.method === 'GET' && p.request.url.includes('/api/system/images/?')) asked.push(new URL(p.request.url).searchParams.get('ordering')) })
await t.wipe(); await t.login('admin', 'admin@qa.test'); await t.go('/admin/images', 4000)
const main = () => t.ev(`document.querySelector('main, #root')?.innerText.replace(/\\s+/g,' ') ?? ''`)
const shownNames = () => t.ev(`[...document.querySelectorAll('table tbody tr td:first-child p.font-bold')].map(p => p.textContent.trim())`)
const sortBy = label => t.ev(`(()=>{const s=[...document.querySelectorAll('select')].find(s=>[...s.options].some(o=>o.textContent.includes('Newest')));if(!s)return false;const o=[...s.options].find(o=>o.textContent.trim()===${JSON.stringify(label)});if(!o)return false;Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(s,o.value);s.dispatchEvent(new Event('change',{bubbles:true}));return true})()`)
let text = await main()
await check('IM-04', 'the sort menu is there and the old "200 newest only" wording is gone', /Sort by/.test(text) && !/newest 200|within the newest/.test(text), text.slice(0, 160))
for (const [label, key] of [['Name A to Z', 'name_asc'], ['Name Z to A', 'name_desc'], ['Largest file first', 'size_desc'], ['Smallest file first', 'size_asc'], ['Oldest first', 'oldest'], ['Owner A to Z', 'owner'], ['Sharpest first', 'sharp_desc'], ['Blurriest first', 'sharp_asc']]) {
  asked.length = 0
  await sortBy(label); await sleep(2500)
  const serverRows = names(await list(`&ordering=${ORDER[key]}`)).slice(0, 20)
  await check(`IM-05-${key}`, `"${label}" asks the server for ordering=${ORDER[key]} and shows exactly the server's first page`, asked.includes(ORDER[key]) && JSON.stringify(await shownNames()) === JSON.stringify(serverRows), `asked ${JSON.stringify(asked)}; ${(await shownNames()).slice(0, 3).join(', ')}`)
}
asked.length = 0
await sortBy('Newest first'); await sleep(2000)
await check('IM-06', '"Newest first" sends no ordering (the server\'s own default)', asked.every(o => o === null), JSON.stringify(asked))
asked.length = 0
await sortBy('Needs review first (this page)'); await sleep(2000)
await check('IM-07', '"Needs review first" says it is for this page only and asks the server for nothing special', asked.every(o => o === null) && /Needs review first \(this page\)/.test(await t.ev(`document.querySelector('select').selectedOptions[0].textContent`)))
await sortBy('Newest first'); await sleep(1500)

// ── Deciding ───────────────────────────────────────────────────────────────
// Photos share names (many are called base.png), so a row is found by its place on the first page, which is the server's own newest-first order.
const firstPage = (await list('')).json.results.slice(0, 20)
const openRow = async id => { const at = firstPage.findIndex(i => i.id === id); await t.ev(`document.querySelectorAll('table tbody tr')[${at}]?.querySelector('button')?.click()`); await sleep(2500) }
const rowOf = async id => t.ev(`(document.querySelectorAll('table tbody tr')[${firstPage.findIndex(i => i.id === id)}]?.innerText ?? '').replace(/\\s+/g,' ')`)
const candidates = firstPage.filter(i => i.quality?.decision === 'accepted' && !i.rejection_reason)
const target = candidates[0]
await check('IM-08', 'there is an accepted photo to decide on', Boolean(target), `${target?.id} ${target?.original_name}`)
await openRow(target.id)
const buttons = () => t.ev(`[...document.querySelectorAll('[aria-label="Decide on this photo"] button')].map(b=>({t:b.textContent.trim(),off:b.disabled,pressed:b.getAttribute('aria-pressed')}))`)
let b = await buttons()
await check('IM-09', 'the three decision buttons are on by themselves (the server answers the probe), with the current verdict pressed', b.length === 3 && b.find(x => x.t === 'Accept')?.pressed === 'true' && b.find(x => x.t === 'Under review')?.off === false && b.find(x => x.t === 'Reject')?.off === false, JSON.stringify(b))
await check('IM-10', 'and no "cannot record yet" apology is shown', !/cannot record an administrator's decision yet/.test(await main()))
const listCalls = () => asked.length
asked.length = 0
await t.click('Under review', '[aria-label="Decide on this photo"] button'); await sleep(700)
await t.click('Put under review', '[role=alertdialog] button'); await sleep(2500)
b = await buttons()
const row = await rowOf(target.id)
await check('IM-11', 'Under review: the panel says so, the row in the list changes from the server\'s answer, and the list was not reloaded', /Marked as under review\./.test(await main()) && /Needs review/.test(row) && listCalls() === 0 && b.find(x => x.t === 'Under review')?.pressed === 'true', `${row.slice(0, 120)} | list requests ${listCalls()}`)
const afterServer = (await api(`/api/system/images/${target.id}/`, admin)).json
await check('IM-12', 'the server agrees (quality decision needs_review)', afterServer.quality?.decision === 'needs_review', afterServer.quality?.decision)

await t.click('Reject', '[aria-label="Decide on this photo"] button'); await sleep(700)
const confirmOff = await t.ev(`[...document.querySelectorAll('[role=alertdialog] button')].find(b=>/^Reject$/.test(b.textContent.trim()))?.disabled`)
await check('IM-13', 'Reject needs a reason: the confirm button stays off until one is typed', confirmOff === true)
// The server's own 400 for a reject without a reason, straight from the API.
const noReason = await api(`/api/system/images/${target.id}/decision/`, admin, { method: 'POST', body: JSON.stringify({ action: 'reject' }) })
await check('IM-14', 'the server answers a reject without a reason with 400 and its own sentence', noReason.status === 400 && noReason.text.length > 10, `${noReason.status} ${noReason.text.slice(0, 100)}`)
await t.type('[role=alertdialog] textarea', 'Face is too small to use'); await sleep(300)
await t.click('Reject', '[role=alertdialog] button'); await sleep(2500)
const rejectedRow = await rowOf(target.id)
await check('IM-15', 'Reject with a reason: "Marked as rejected." and the row says Rejected', /Marked as rejected\./.test(await main()) && /Rejected/.test(rejectedRow), rejectedRow.slice(0, 100))

// A photo that cannot be decided: trash it as its owner while the panel is open, then press Accept (409 with the server's sentence).
const owner = target.owner.email
const ownerToken = (await apiLogin(owner)).token
const other = candidates.find(i => i.id !== target.id && i.owner.email === owner)
if (other) {
  await t.click('Close', 'button[aria-label="Close"]'); await sleep(500)
  await openRow(other.id)
  await api('/api/images/trash/', ownerToken, { method: 'POST', body: JSON.stringify({ image_ids: [other.id] }) })
  await t.click('Under review', '[aria-label="Decide on this photo"] button'); await sleep(700)
  await t.click('Put under review', '[role=alertdialog] button'); await sleep(2500)
  const dlg = await t.ev(`document.querySelector('[role=alertdialog] [role=alert]')?.innerText ?? ''`)
  const direct = await api(`/api/system/images/${other.id}/decision/`, admin, { method: 'POST', body: JSON.stringify({ action: 'keep_in_review' }) })
  await check('IM-16', 'a photo that can no longer be decided (it went to the trash): the dialog shows the server\'s own sentence, in the dialog, nothing invented', dlg.length > 10 && direct.text.includes(dlg.replace(/\.$/, '')) || (dlg.length > 10 && [404, 409].includes(direct.status)), `dialog: ${dlg} | server ${direct.status} ${direct.text.slice(0, 120)}`)
  await t.click('Cancel', '[role=alertdialog] button'); await sleep(300)
} else console.log('INFO  no second accepted photo of the same owner, so the 409 case was not exercised')

// ── The audit page names the new event in words ────────────────────────────
await t.go('/admin/audit-logs', 4000)
text = await main()
const mine = (await api('/api/system/audit/?page_size=50&q=admin_image_decided', admin)).json?.results?.[0]
await check('IM-17', 'the audit page says what was decided in words ("Rejected a photo (it was under review). Reason: ..."), not the raw event name or the server\'s bare "Admin image decided."', Boolean(mine) && !/admin_image_decided|admin image decided/i.test(text) && /Rejected a photo \(it was under review\)\. Reason: “Face is too small to use”\./.test(text) && /Put a photo under review/.test(text), `server message: ${mine?.message}`)
await check('IM-18', 'no uncaught exceptions on the screens during the whole run', t.issues.exceptions.length === 0, t.issues.exceptions.join(' | '))

const f = summary(); process.exit(f.length ? 1 : 0)
