// The Processing page of a finished upload (/dashboard/processing/:id) opens on its photos: each one's picture and its "What was done" report.
//   source $TMPDIR/facecloud-qa/env.sh && node qa/scripts/24-batch-results.mjs
// Run once per stack. One photo opens on the enhanced picture; a batch of several opens on the originals and fetches an enhanced file only when asked
// (it is full resolution); a photo refused at upload says why; a photo that was not enhanced says so and shows no invented report.
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { API, api, apiLogin, check, openTab, sleep, summary } from '../lib.mjs'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const email = 'plain@qa.test'
const user = (await apiLogin(email)).token
const base = await fs.readFile(path.join(root, 'public', 'hero-portrait.png'))
const blob = (tag, type = 'image/jpeg') => new Blob([Buffer.concat([base, Buffer.from(tag)])], { type })
const post = async (path, fd) => (await (await fetch(API + path, { method: 'POST', headers: { authorization: 'Bearer ' + user }, body: fd })).json())

// 1. one photo, enhanced
let fd = new FormData(); fd.append('file', blob('one2'), 'solo.jpg'); const solo = await post('/api/images/upload/single/', fd)
// 2. three photos in a batch (one of them refused at upload: a wrong extension)
fd = new FormData(); for (const n of ['a', 'b']) fd.append('files', blob('m2' + n), `multi-${n}.jpg`); fd.append('files', blob('bad2'), 'wrong-extension.png'); const multi = await post('/api/images/upload/multiple/', fd)
// 3. one photo, automatic enhancement off for this upload
fd = new FormData(); fd.append('file', blob('off2'), 'not-enhanced.jpg'); fd.append('auto_enhance', 'false'); const off = await post('/api/images/upload/single/', fd)
console.log('batches', solo.id, multi.id, off.id)

const t = await openTab({ width: 1280, height: 1000 })
await t.wipe(); await t.login('user', email)
const cards = () => t.ev(`[...document.querySelectorAll('div.grid.rounded-2xl')].filter(d=>d.querySelector('a[href^="/dashboard/images/"]')).map(d=>({text:d.innerText.replace(/\\s+/g,' '),imgs:[...d.querySelectorAll('img')].map(i=>i.alt),buttons:[...d.querySelectorAll('button[aria-pressed]')].map(b=>b.textContent.trim()+':'+b.getAttribute('aria-pressed'))}))`)

await t.go(`/dashboard/processing/${solo.id}`, 6000)
let c = await cards(); console.log('solo', JSON.stringify(c).slice(0, 400))
await check('BR-01', 'one photo: the Results section shows the photo and its name', c.length === 1 && /solo\.jpg/.test(c[0].text) && c[0].imgs.length === 1)
await check('BR-02', 'one photo: it opens on the enhanced picture', c[0].imgs[0].includes('enhanced') && c[0].buttons.includes('Enhanced:true'), JSON.stringify(c[0].buttons) + c[0].imgs)
await check('BR-03', 'one photo: its report ("What was done") is there', /What was done/i.test(c[0].text), c[0].text.slice(0, 160))
await check('BR-04', 'one photo: a Completed badge and the link to open the photo', /Completed/.test(c[0].text) && /Open the photo/.test(c[0].text))
await t.click('Original', 'button'); await sleep(1500); c = await cards()
await check('BR-05', 'one photo: Original shows the original picture', c[0].imgs[0] === 'solo.jpg' && c[0].buttons.includes('Original:true'), c[0].imgs + JSON.stringify(c[0].buttons))
await t.shot('batch-results-1280')

await t.go(`/dashboard/processing/${multi.id}`, 7000)
c = await cards(); console.log('multi', JSON.stringify(c.map(x => [x.text.slice(0, 80), x.imgs, x.buttons])).slice(0, 600))
await check('BR-06', 'three photos: three cards', c.length === 3, String(c.length))
const a = c.find(x => /multi-a/.test(x.text)), bad = c.find(x => /wrong-extension/.test(x.text))
await check('BR-07', 'three photos: an enhanced photo opens on the ORIGINAL (the enhanced file is full size) and offers Enhanced', a && a.imgs[0] === 'multi-a.jpg' && a.buttons.includes('Original:true') && a.buttons.includes('Enhanced:false'), JSON.stringify(a))
await t.ev(`[...document.querySelectorAll('div.grid.rounded-2xl')].find(d=>d.innerText.includes('multi-a')).querySelectorAll('button[aria-pressed]')[1].click()`); await sleep(2500)
c = await cards(); const a2 = c.find(x => /multi-a/.test(x.text))
await check('BR-08', 'three photos: Enhanced fetches and shows the enhanced picture', a2.imgs[0].includes('enhanced') && a2.buttons.includes('Enhanced:true'), JSON.stringify(a2.imgs))
await check('BR-09', 'a photo refused at upload: its reason is said, no report, no toggle', bad && /Rejected/.test(bad.text) && !/What was done/i.test(bad.text) && bad.buttons.length === 0, bad && bad.text.slice(0, 220))
await check('BR-10', 'a photo that was enhanced has its report in the batch of three', a && /What was done/i.test(a.text))

await t.go(`/dashboard/processing/${off.id}`, 6000)
c = await cards(); console.log('off', JSON.stringify(c).slice(0, 300))
await check('BR-11', 'auto enhancement off: says it has not been enhanced, no invented report', c.length === 1 && /has not been enhanced/.test(c[0].text) && !/What was done/i.test(c[0].text), c[0] && c[0].text.slice(0, 200))

// phone width
await t.resize(390, 900); await t.go(`/dashboard/processing/${solo.id}`, 6000)
const over = await t.ev(`document.documentElement.scrollWidth - document.documentElement.clientWidth`)
await check('BR-12', '390px: no sideways scrolling', over <= 1, String(over))
await t.shot('batch-results-390')
await check('BR-13', 'no console errors or exceptions', t.issues.exceptions.length === 0 && t.issues.console.length === 0, JSON.stringify([...t.issues.exceptions, ...t.issues.console]).slice(0, 300))
const failed = summary(); process.exit(failed.length ? 1 : 0)
