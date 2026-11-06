// Auto / Standard / Pro and the lighting, chosen on the Upload screens and sent WITH the upload.
//   source $TMPDIR/facecloud-qa/env.sh && node qa/scripts/22-upload-presets.mjs
// What is sent is read off the wire (the multipart fields of the upload request) and from the server's own echo (`auto_enhance_options` in the answer);
// what is shown is read off the screen. Real enhancement runs inside the upload request on this stack (no worker), so the slow checks use few photos.
// Run once per stack: the account's own "automatic enhancement" switch is turned off for the last part.
import fs from 'node:fs/promises'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { OUT, api, apiLogin, check, openTab, sleep, summary } from '../lib.mjs'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const PY = path.join(process.env.QA_BACKEND || path.join(process.env.HOME, 'Projects', 'FaceCloud_backend'), '.venv', 'bin', 'python')
const dir = path.join(OUT, 'fixtures-presets'); await fs.rm(dir, { recursive: true, force: true }); await fs.mkdir(dir, { recursive: true })

// The repository's portrait lifted to a normal exposure, and the awkward cases the server must refuse to "brighten": a tiny photograph, a heavily
// compressed one, and a back-lit one (the face dark against a bright background).
execFileSync(PY, ['-c', `
import cv2, numpy as np, zipfile, sys
src = cv2.imread(sys.argv[1]); base = np.clip((src.astype(np.float32)/255) ** 0.55 * 255, 0, 255).astype(np.uint8); out = sys.argv[2]
cv2.imwrite(out + '/base.png', base)
cv2.imwrite(out + '/tiny.jpg', cv2.resize(base, (260, 194)), [cv2.IMWRITE_JPEG_QUALITY, 90])
cv2.imwrite(out + '/compressed.jpg', cv2.resize(base, (480, 320)), [cv2.IMWRITE_JPEG_QUALITY, 5])
h, w = base.shape[:2]; yy, xx = np.mgrid[0:h, 0:w]; face = np.exp(-(((xx - w / 2) / (w * 0.22)) ** 2 + ((yy - h * 0.42) / (h * 0.26)) ** 2))
backlit = base.astype(np.float32) * (1 - 0.82 * face[..., None]) + 35 * (1 - face[..., None]); cv2.imwrite(out + '/backlit.jpg', np.clip(backlit, 0, 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 92])
for i, scale in enumerate((0.9, 1.0)):
    cv2.imwrite(out + f'/small{i}.jpg', cv2.resize(np.clip(base.astype(np.float32) * scale, 0, 255).astype(np.uint8), (260, 194)), [cv2.IMWRITE_JPEG_QUALITY, 90])
with zipfile.ZipFile(out + '/three.zip', 'w') as z:
    for i in range(3): z.write(out + '/tiny.jpg', f'tiny{i}.jpg')
`, path.join(root, 'public', 'hero-portrait.png'), dir], { encoding: 'utf8' })

// REAL_ONLY=auto,light (any of auto, dark, compressed, light, pro) re-runs only those slow cases and skips what is sent on the wire and the batch parts.
const REAL_ONLY = process.env.REAL_ONLY ? process.env.REAL_ONLY.split(',') : null
const want = name => !REAL_ONLY || REAL_ONLY.includes(name)
const t = await openTab({ width: 1280, height: 1000 })
await t.rpc('Network.enable', { maxPostDataSize: 20_000_000 })
await t.wipe(); await t.login('user', 'plain@qa.test')
// Part 4 turns the account's automatic enhancement off, so a re-run starts by turning it back on.
await api('/api/notifications/preferences/', (await apiLogin('plain@qa.test')).token, { method: 'PATCH', body: JSON.stringify({ auto_enhance: true }) })

/* ── What went over the wire ───────────────────────────────────────────── */
const uploads = []          // {url, fields, echo}
const enhancements = []     // POST /api/enhancements/images/{id}/ bodies
const pending = new Map()
const fieldsOf = body => Object.fromEntries([...String(body ?? '').matchAll(/name="(\w+)"\r\n\r\n([^\r]*)\r\n/g)].map(m => [m[1], m[2]]))
t.on('Network.requestWillBeSent', async p => {
  const { url, method } = p.request
  if (method !== 'POST') return
  // Text fields come as bytes entries even when a file is in the same form; a JSON body comes as postData.
  let body = p.request.postData ?? p.request.postDataEntries?.map(e => (e.bytes ? Buffer.from(e.bytes, 'base64').toString('latin1') : '')).join('')
  if (!body && p.request.hasPostData) { try { body = (await t.rpc('Network.getRequestPostData', { requestId: p.requestId }))?.postData } catch { body = '' } }
  if (/\/api\/images\/upload\/(single|multiple|zip)\//.test(url)) { const row = { url: url.replace(/^.*\/upload\//, ''), fields: fieldsOf(body), echo: undefined }; uploads.push(row); pending.set(p.requestId, row) }
  if (/\/api\/enhancements\/images\/\d+\/$/.test(url)) { try { enhancements.push(JSON.parse(body)) } catch { enhancements.push({ unreadable: body }) } }
})
t.on('Network.loadingFinished', async p => {
  const row = pending.get(p.requestId); if (!row) return
  pending.delete(p.requestId)
  const raw = await t.rpc('Network.getResponseBody', { requestId: p.requestId })
  try { row.echo = JSON.parse(raw.base64Encoded ? Buffer.from(raw.body, 'base64').toString() : raw.body).auto_enhance_options } catch { row.echo = 'unreadable' }
})
const DONE = /Your photo was accepted|Your photo was not accepted|That did not go through|A moderator will take a look|The checks were not sure|Your photo was received/
/** The newest upload, once the server's answer has been read off the wire (that read finishes a moment after the page has the answer). */
const lastUpload = async (seconds = 10) => { for (let i = 0; i < seconds * 4 && (uploads.length === 0 || uploads[uploads.length - 1].echo === undefined); i++) await sleep(250); return uploads[uploads.length - 1] }
const sent = row => ['level', 'style', 'lighting', 'auto_enhance'].filter(k => k in row.fields).map(k => `${k}=${row.fields[k]}`).join(',') || '(none)'

/* ── Driving a screen ──────────────────────────────────────────────────── */
const radio = label => t.ev(`(()=>{const b=[...document.querySelectorAll('[role=radio]')].find(b=>b.textContent.trim().startsWith(${JSON.stringify(label)}));if(b){b.click();return true}return false})()`)
const main = () => t.ev(`document.querySelector('main, #root')?.innerText.replace(/\\s+/g,' ') ?? ''`)
const waitFor = async (re, seconds = 240) => { for (let i = 0; i < seconds / 2; i++) { const text = await main(); if (re.test(text)) return text; await sleep(2000) } return main() }
/** The result card loads a moment after the verdict does: wait for the verdict, then for what the enhancement did. */
const waitResult = async seconds => { await waitFor(DONE, seconds); return waitFor(/What was done|The enhancement did not finish|Could not enhance|Not enhanced yet/i, 90) }
const choose = async (file, { preset, lighting, input = 'input[type=file]' } = {}) => {
  await t.setFile(input, Array.isArray(file) ? file.map(f => path.join(dir, f)) : [path.join(dir, file)]); await sleep(1500)
  if (preset) await radio(preset)
  if (lighting) await radio(lighting)
}
const confirm = () => t.click('Confirm')
const single = async (file, choice) => { await t.go('/dashboard/upload/single', 2500); await choose(file, choice); await confirm() }

let row
if (!REAL_ONLY) {
/* ── 1. What is sent: single, cheap photographs ────────────────────────── */
await single('tiny.jpg'); await waitFor(DONE, 120)
row = await lastUpload()
await check('PR-01', 'Auto with Auto lighting sends none of level / style / lighting (nor auto_enhance), and the server echoes {}', sent(row) === '(none)' && JSON.stringify(row.echo) === '{}', `${sent(row)} echo ${JSON.stringify(row.echo)}`)
await single('tiny.jpg', { preset: 'Standard' }); await waitFor(DONE, 120); row = await lastUpload()
await check('PR-02', 'Standard sends level=high only (its style is the server default)', sent(row) === 'level=high' && row.echo?.level === 'high', `${sent(row)} echo ${JSON.stringify(row.echo)}`)
await single('tiny.jpg', { preset: 'Pro' }); await waitFor(DONE, 120); row = await lastUpload()
await check('PR-03', 'Pro sends level=high and style=ai_max, and the server echoes them', sent(row) === 'level=high,style=ai_max' && row.echo?.level === 'high' && row.echo?.style === 'ai_max', `${sent(row)} echo ${JSON.stringify(row.echo)}`)
await single('tiny.jpg', { lighting: 'Dark photo' }); await waitFor(DONE, 120); row = await lastUpload()
await check('PR-04', 'Dark photo alone sends lighting=dark only', sent(row) === 'lighting=dark' && row.echo?.lighting === 'dark', `${sent(row)} echo ${JSON.stringify(row.echo)}`)
await single('tiny.jpg', { preset: 'Pro', lighting: 'Light photo' }); await waitFor(DONE, 120); row = await lastUpload()
await check('PR-05', 'Pro with Light photo sends all three, and never auto_enhance=false', sent(row) === 'level=high,style=ai_max,lighting=light' && !('auto_enhance' in row.fields), sent(row))

// The "+" popup: the same screen, embedded.
await t.go('/dashboard', 2500)
await t.clickSel('button[aria-label="Upload photos"]'); await sleep(800)
await t.click('Upload a photo', '[role=dialog] button'); await sleep(1200)
await check('PR-06', 'the "+" button opens the upload popup and its Single screen', await t.ev(`!!document.querySelector('[role=dialog]')`) && /Upload a photo|Choose/i.test(await t.ev(`document.querySelector('[role=dialog]')?.innerText ?? ''`)))
await choose('tiny.jpg', { preset: 'Pro', input: '[role=dialog] input[type=file]' })
const popup = await t.ev(`(()=>{const d=document.querySelector('[role=dialog]');const g=[...d.querySelectorAll('[role=radiogroup]')];const box=d.getBoundingClientRect();return {groups:g.length,labels:g.map(x=>x.getAttribute('aria-labelledby')),fits:g.every(x=>x.getBoundingClientRect().right<=box.right+1&&x.getBoundingClientRect().left>=box.left-1)}})()`)
await check('PR-07', 'in the popup both pickers are there and fit its width', popup.groups === 2 && popup.fits, JSON.stringify(popup))
await t.shot('presets-popup')
await t.click('Confirm', '[role=dialog] button'); await sleep(2000); row = await lastUpload(180)
await check('PR-08', 'the popup sends the choice the same way (Pro: level=high, style=ai_max)', sent(row) === 'level=high,style=ai_max', sent(row))

// The picker on the page itself: where it sits and its semantics.
await t.go('/dashboard/upload/single', 2500); await choose('tiny.jpg')
const layout = await t.ev(`(()=>{const g=[...document.querySelectorAll('[role=radiogroup]')];const names=g.map(x=>document.getElementById(x.getAttribute('aria-labelledby'))?.textContent);const pro=[...g[0].querySelectorAll('[role=radio]')].map(b=>({t:b.textContent.trim(),c:b.getAttribute('aria-checked')}));return {names,pro}})()`)
await check('PR-09', 'the Enhancement picker comes before the Lighting picker, is a radio group, and starts on Auto', layout.names[0] === 'Enhancement' && layout.names[1] === 'Lighting' && layout.pro.find(b => b.c === 'true')?.t.startsWith('Auto'), JSON.stringify(layout))
await radio('Pro')
await check('PR-10', 'choosing Pro shows the note that Pro can take a minute or two', /one photo can take a minute or two/.test(await main()))
await t.shot('presets-single-pro')
await t.resize(390, 900); await sleep(300)
await check('PR-11', '390 px: the picker does not scroll sideways', !(await t.ev('document.documentElement.scrollWidth > window.innerWidth + 1')))
await t.shot('presets-single-390'); await t.resize(1280, 1000)

}

/* ── 2. What is shown: real enhancement runs ───────────────────────────── */
let text = ''
if (want('auto')) {
await single('base.png'); text = await waitResult(300)
await t.shot('presets-result-auto')
await check('PR-12', 'Auto: the photo is enhanced by the upload itself (the page started no enhancement request) and the result says "Auto preset"', enhancements.length === 0 && /Auto preset/.test(text) && /Processing summary/i.test(text), `${enhancements.length} request(s); ${text.slice(text.toLowerCase().indexOf('what was done'), text.toLowerCase().indexOf('what was done') + 160)}`)
await check('PR-13', 'the processing summary (engines, AI or classical) is on the upload result', await t.ev(`!!document.querySelector('section[aria-label="Processing summary"]')`))
await check('PR-14', 'nothing is said about an ignored choice when the server used it', !/but the server used|did not report using it/.test(text))

}
if (want('dark')) {
await single('backlit.jpg', { lighting: 'Dark photo' }); text = await waitResult(300)
await t.shot('presets-result-dark-backlit')
const brightened = /As you asked, the dark-photo method brightened the photograph\./.test(text)
const refused = /(Brightening was not safe to apply, so the dark-photo method changed nothing\.|The brightening model was not available, so the dark-photo method changed nothing\.|The dark-photo method could not brighten this photograph, so it changed nothing\.)/.test(text)
const pills = await t.ev(`[...document.querySelectorAll('span')].filter(s=>/Dark-photo method/.test(s.textContent)&&s.children.length<=1&&s.className.includes('rounded-full')).map(s=>({t:s.textContent.trim(),amber:s.className.includes('F59E0B')}))`)
await check('PR-15', 'Dark photo on a back-lit portrait: the server\'s one sentence is shown, and the badge agrees with it (a refusal never wears the success badge)', (brightened || refused) && pills.length >= 1 && (brightened ? pills.every(p => !p.amber && p.t === 'Dark-photo method') : pills.every(p => p.amber && /changed nothing/.test(p.t))), `${brightened ? 'brightened' : refused ? 'refused' : 'no sentence'} ${JSON.stringify(pills)}`)
await check('PR-16', 'and it says the method was chosen by the person', /chosen by you/.test(text))
}

if (want('compressed')) {
await single('compressed.jpg', { lighting: 'Dark photo' }); text = await waitResult(300)
await t.shot('presets-result-dark-compressed')
const accepted = /Your photo was accepted|not sure/i.test(text)
if (accepted) {
  const sentence = /(changed nothing|brightened the photograph)/.exec(text)?.[1]
  const pills2 = await t.ev(`[...document.querySelectorAll('span')].filter(s=>/Dark-photo method/.test(s.textContent)&&s.className.includes('rounded-full')).map(s=>({t:s.textContent.trim(),amber:s.className.includes('F59E0B')}))`)
  await check('PR-17', 'Dark photo on a heavily compressed photograph (480 x 320, 5% JPEG quality): whatever the server did, the screen says exactly that and no success badge is drawn for a refusal', Boolean(sentence) && (sentence === 'changed nothing' ? pills2.every(p => p.amber) : pills2.every(p => !p.amber)), `${sentence} ${JSON.stringify(pills2)}`)
} else console.log('INFO  the heavily compressed photograph was not accepted by the checks, so no enhancement ran:', text.slice(0, 120))
}

if (want('light')) {
await single('base.png', { lighting: 'Light photo' }); text = await waitResult(300)
await check('PR-18', 'Light photo: "As you asked, the light-photo method was used: the brightness was kept." and the Light-photo badge, chosen by you', /As you asked, the light-photo method was used: the brightness was kept\./.test(text) && /Light-photo method/.test(text) && /chosen by you/.test(text), text.slice(text.toLowerCase().indexOf('what was done'), text.toLowerCase().indexOf('what was done') + 200))
}

if (want('pro')) {
await single('base.png', { preset: 'Pro' }); text = await waitResult(480)
await t.shot('presets-result-pro')
await check('PR-19', 'Pro on a real photo: the result says "Pro preset" and no choice is reported as ignored', /Pro preset/.test(text) && !/but the server used/.test(text), text.slice(text.toLowerCase().indexOf('what was done'), text.toLowerCase().indexOf('what was done') + 160))
}

if (!REAL_ONLY) {
/* ── 3. Several photos and a ZIP carry the same fields; nothing auto-starts ── */
enhancements.length = 0
await t.go('/dashboard/upload/multiple', 2500); await choose(['small0.jpg', 'small1.jpg'], { preset: 'Pro', lighting: 'Dark photo' }); await confirm()
text = await waitFor(/Upload complete/, 300); await sleep(3000); text = await main(); row = await lastUpload()
await check('PR-20', 'Multiple sends the same fields (level=high, style=ai_max, lighting=dark) and the server echoes them', row.url === 'multiple/' && sent(row) === 'level=high,style=ai_max,lighting=dark' && row.echo?.style === 'ai_max' && row.echo?.lighting === 'dark', `${row.url} ${sent(row)} ${JSON.stringify(row.echo)}`)
await check('PR-21', 'the batch panel started nothing: no enhancement request from the page', enhancements.length === 0, `${enhancements.length}`)
await check('PR-22', 'the batch panel names the choice and (when the photos passed) reports the pipeline\'s enhancement without a button press', /Chosen: Pro · Dark photo/.test(text) && !/sentence that/.test(text) && !/It is used only if the server can choose/.test(text), text.slice(text.indexOf('Enhancement'), text.indexOf('Enhancement') + 200))
await t.go('/dashboard/upload/zip', 2500); await choose('three.zip', { preset: 'Standard', lighting: 'Light photo' }); await confirm(); await waitFor(/Upload complete|Photos found in ZIP/, 300); row = await lastUpload()
await check('PR-23', 'ZIP sends the same fields (level=high, lighting=light)', row.url === 'zip/' && sent(row) === 'level=high,lighting=light' && row.echo?.lighting === 'light', `${row.url} ${sent(row)} ${JSON.stringify(row.echo)}`)

/* ── 4. The second path: photos the pipeline did not enhance get the SAME choice ── */
await api('/api/notifications/preferences/', (await apiLogin('plain@qa.test')).token, { method: 'PATCH', body: JSON.stringify({ auto_enhance: false }) })
enhancements.length = 0
await t.go('/dashboard/upload/multiple', 2500); await choose(['small0.jpg', 'small1.jpg'], { preset: 'Standard', lighting: 'Light photo' }); await confirm()
await waitFor(/Upload complete/, 300); await sleep(2500); text = await main()
await check('PR-24', 'with the account\'s automatic enhancement off nothing starts by itself, and the manual button is there', enhancements.length === 0 && /Enhance accepted photos/.test(text), `${enhancements.length} request(s)`)
await t.click('Enhance accepted photos'); await sleep(15000)
await check('PR-25', 'the manual button sends the SAME choice for each photo (level=high, style=natural, lighting=light)', enhancements.length >= 1 && enhancements.every(body => body.level === 'high' && body.style === 'natural' && body.lighting === 'light'), JSON.stringify(enhancements.slice(0, 2)))
enhancements.length = 0
await single('base.png', { preset: 'Standard', lighting: 'Light photo' }); text = await waitResult(300)
await check('PR-26', 'on the Single screen a photo the pipeline did not enhance is enhanced with the same choice', enhancements.length === 1 && enhancements[0].level === 'high' && enhancements[0].style === 'natural' && enhancements[0].lighting === 'light', JSON.stringify(enhancements))

}

/* ── 5. The retired page ───────────────────────────────────────────────── */
await t.go('/dashboard/enhance', 2500)
await check('PR-27', '/dashboard/enhance is not a page any more: it redirects to the Upload Center', (await t.path()) === '/dashboard/upload', await t.path())
await check('PR-28', 'no uncaught exceptions on the screens during the whole run', t.issues.exceptions.length === 0, t.issues.exceptions.join(' | '))

const f = summary(); process.exit(f.length ? 1 : 0)
