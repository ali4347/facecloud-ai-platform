// The photo editor: sliders and preview, reset, saving a full-size version, the list of versions, switching, downloading,
// deleting, and who may touch them. Uses a clean portrait that the checks accept.
import fs from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { API, OUT, api, apiLogin, check, openTab, sleep, summary } from '../lib.mjs'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const PY = path.join(process.env.QA_BACKEND || path.join(process.env.HOME, 'Projects', 'FaceCloud_backend'), '.venv', 'bin', 'python')
const dir = path.join(OUT, 'editor'); await fs.rm(dir, { recursive: true, force: true }); await fs.mkdir(dir, { recursive: true })
execFileSync(PY, ['-c', `import cv2,numpy as np,sys\nsrc=cv2.imread(sys.argv[1]);cv2.imwrite(sys.argv[2],np.clip((src.astype(np.float32)/255)**0.55*255,0,255).astype(np.uint8))`, path.join(root, 'public', 'hero-portrait.png'), path.join(dir, 'clean.png')])
const meanBrightness = file => Number(execFileSync(PY, ['-c', `import cv2,numpy as np,sys\nprint(cv2.imdecode(np.fromfile(sys.argv[1],np.uint8),1).mean())`, file], { encoding: 'utf8' }))

const tok = (await apiLogin('member2@qa.test')).token, other = (await apiLogin('member@qa.test')).token
const t = await openTab(); await t.wipe(); await t.login('user', 'member2@qa.test')
const main = () => t.ev(`(document.querySelector('main')||document.body).innerText.replace(/\\s+/g,' ')`)
const sliders = () => t.ev(`Object.fromEntries([...document.querySelectorAll('input[type=range]')].map(r=>[r.id.replace('ctl-',''),Number(r.value)]))`)
const previewSrc = () => t.ev(`[...document.querySelectorAll('img')].filter(i=>i.src.startsWith('blob:')).map(i=>i.src).pop()||''`)

// a photo that is accepted and enhanced
const fd = new FormData(); fd.append('file', new Blob([await fs.readFile(path.join(dir, 'clean.png'))], { type: 'image/png' }), 'editor-clean.png')
const up = await (await fetch(API + '/api/images/upload/single/', { method: 'POST', headers: { authorization: 'Bearer ' + tok }, body: fd })).json(); await sleep(4500)
const image = (await api(`/api/images/batches/${up.id}/progress/`, tok)).json.images[0]; const imageId = image.image_id
let enh = (await api(`/api/enhancements/images/${imageId}/`, tok, { method: 'POST', body: JSON.stringify({ level: 'auto', style: 'natural' }) })).json
for (let i = 0; i < 60 && !['completed', 'failed'].includes(enh.status); i++) { await sleep(2000); enh = (await api(`/api/enhancements/results/${enh.id}/`, tok)).json }
const info = (await api(`/api/images/${imageId}/`, tok)).json
await check('EDIT-00', 'test photo: accepted and enhanced', ['accepted', 'completed'].includes(image.status) && enh.status === 'completed', `${image.status} ${enh.status}`)

await t.go(`/dashboard/images/${imageId}/edit`, 6000)
const start = await sliders()
await check('EDIT-01', 'the editor opens with 12 sliders at neutral and a picture', Object.keys(start).length >= 12 && start.brightness === 0 && start.contrast === 0 && Boolean(await previewSrc()), JSON.stringify(start).slice(0, 120))
const before = await previewSrc()
await t.type('#ctl-brightness', '25'); await sleep(4500)
await check('EDIT-02', 'moving Brightness redraws the preview and labels the change', (await previewSrc()) !== before && /Brightness \+25/.test(await main()), (await main()).match(/Preview .{0,40}/)?.[0])
await t.ev(`document.getElementById('ctl-brightness').dispatchEvent(new MouseEvent('dblclick',{bubbles:true}))`); await sleep(1500)
await check('EDIT-03', 'double-clicking a slider puts it back to zero', (await sliders()).brightness === 0, JSON.stringify((await sliders()).brightness))
await t.type('#ctl-contrast', '15'); await t.type('#ctl-saturation', '-20'); await sleep(1500)
await t.click('Reset'); await sleep(4500)
const afterReset = await sliders()
await check('EDIT-04', 'Reset returns every slider to neutral and the preview to "No changes"', Object.entries(afterReset).every(([k, v]) => v === (k === 'intensity' ? 100 : 0)) && /No changes/.test(await main()), JSON.stringify(afterReset).slice(0, 140))
await check('EDIT-05', 'there is a "hold to see the original" control', /Hold to see the original/.test(await main()))

// save a full-size version
await t.type('#ctl-brightness', '30'); await t.type('#ctl-contrast', '10'); await sleep(4500)
const t0 = Date.now(); await t.click('Save as new version')
await sleep(700); const savingText = await main()
let done = false; for (let i = 0; i < 90 && !done; i++) { await sleep(1000); done = /Saved as a new version/.test(await main()) }
const saveSeconds = Math.round((Date.now() - t0) / 1000)
await check('EDIT-06', 'saving finishes with "Saved as a new version" and the version is listed as Current (and shows a busy state if it takes more than a moment)', (/Saving full-size version/.test(savingText) || saveSeconds < 6) && done && /Current/.test(await main()), `${saveSeconds}s; ${(await main()).match(/Saved as a new version.{0,100}/)?.[0] ?? 'no message'}`)
await check('EDIT-06b', 'saving takes under 60 seconds on a 1024 px photo', saveSeconds < 60, `${saveSeconds}s`)
let edits = (await api(`/api/enhancements/results/${enh.id}/edits/`, tok)).json; edits = Array.isArray(edits) ? edits : edits.results
const first = edits[0]
await check('EDIT-07', 'the saved version is full size and differs from the enhanced photo', first && first.status === 'completed' && first.output_width === info.width && first.output_height === info.height && first.is_current, JSON.stringify([first?.output_width, first?.output_height, info.width, info.height]))
const dl = async (p, token = tok) => { const r = await fetch(API + p, { headers: { authorization: 'Bearer ' + token } }); return { status: r.status, bytes: Buffer.from(await r.arrayBuffer()) } }
const enhFile = await dl(`/api/enhancements/results/${enh.id}/download/`), editFile = await dl(`/api/enhancements/edits/${first.id}/download/`)
await fs.writeFile(path.join(dir, 'enh.bin'), enhFile.bytes); await fs.writeFile(path.join(dir, 'edit.bin'), editFile.bytes)
await check('EDIT-08', 'the edit downloads as a picture and is brighter than the enhanced photo', editFile.status === 200 && createHash('sha1').update(editFile.bytes).digest('hex') !== createHash('sha1').update(enhFile.bytes).digest('hex') && meanBrightness(path.join(dir, 'edit.bin')) > meanBrightness(path.join(dir, 'enh.bin')) + 2, `brightness ${meanBrightness(path.join(dir, 'enh.bin')).toFixed(1)} -> ${meanBrightness(path.join(dir, 'edit.bin')).toFixed(1)}`)
// a second version, then switch
await t.type('#ctl-brightness', '-20'); await sleep(4500); await t.click('Save as new version')
for (let i = 0; i < 90; i++) { await sleep(1000); edits = (await api(`/api/enhancements/results/${enh.id}/edits/`, tok)).json; edits = Array.isArray(edits) ? edits : edits.results; if (edits.length >= 2 && edits.every(e => e.status === 'completed')) break }
await check('EDIT-09', 'a second save makes a second version and it becomes Current', edits.length === 2 && edits[0].is_current && !edits[1].is_current, JSON.stringify(edits.map(e => [e.id, e.is_current])))
await sleep(1500); await t.click('Use this'); await sleep(3000)
edits = (await api(`/api/enhancements/results/${enh.id}/edits/`, tok)).json; edits = Array.isArray(edits) ? edits : edits.results
await check('EDIT-10', '"Use this" makes the older version Current', edits.filter(e => e.is_current).length === 1 && edits.find(e => e.is_current).id === first.id, JSON.stringify(edits.map(e => [e.id, e.is_current])))
await t.go(`/dashboard/images/${imageId}`, 5000)
await check('EDIT-11', 'the photo page shows the Current version (labelled "Edited")', /edited/i.test(await main()), (await main()).slice(0, 140))
// who else can reach it
const stranger = await api(`/api/enhancements/edits/${first.id}/`, other); const strangerDl = await dl(`/api/enhancements/edits/${first.id}/download/`, other.token ?? other)
await check('EDIT-12', 'another person cannot read or download this edit (404)', stranger.status === 404 && strangerDl.status === 404, `${stranger.status} ${strangerDl.status}`)
const anon = await api(`/api/enhancements/edits/${first.id}/`); await check('EDIT-13', 'signed out, the edit answers 401', anon.status === 401, anon.status)
// delete the current version
await t.go(`/dashboard/images/${imageId}/edit`, 6000); await t.ev(`[...document.querySelectorAll('li')].find(li=>/Current/.test(li.textContent)).querySelector('button[aria-label="Delete this version"]').click()`); await sleep(800)
await check('EDIT-14', 'deleting a version asks first', await t.exists('[role=alertdialog]'))
await t.ev(`[...document.querySelectorAll('[role=alertdialog] button')].find(b=>/Delete version/.test(b.textContent)).click()`); await sleep(3000)
edits = (await api(`/api/enhancements/results/${enh.id}/edits/`, tok)).json; edits = Array.isArray(edits) ? edits : edits.results
await check('EDIT-15', 'after deleting the current version the other one becomes Current, and the original and enhanced photo are untouched', edits.length === 1 && edits[0].is_current && (await dl(`/api/enhancements/results/${enh.id}/download/`)).status === 200, JSON.stringify(edits.map(e => [e.id, e.is_current])))
// saving with nothing changed: the button stays off (it would only copy the enhanced photo)
await t.click('Reset'); await sleep(4500)
const disabled = await t.ev(`[...document.querySelectorAll('button')].find(b=>/Save as new version/.test(b.textContent))?.disabled`)
const hint = (await main()).includes('saving without a change')
edits = (await api(`/api/enhancements/results/${enh.id}/edits/`, tok)).json; edits = Array.isArray(edits) ? edits : edits.results
await check('EDIT-16', 'with every slider at neutral, Save is off and says why (no copy of the enhanced photo is made)', disabled === true && hint && edits.length === 1, `disabled=${disabled} hint=${hint} versions=${edits.length}`)
console.log('page errors:', JSON.stringify(t.issues.exceptions))
summary(); process.exit(0)
