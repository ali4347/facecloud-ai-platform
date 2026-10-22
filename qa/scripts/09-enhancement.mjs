// Does enhancement actually enhance? One clean portrait and four versions of it, run through the real upload, the real
// automatic enhancement and the real screens. Needs the backend's Python (QA_BACKEND, default ~/Projects/FaceCloud_backend)
// only to make the test photos and to measure them.
import fs from 'node:fs/promises'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { API, OUT, api, apiLogin, check, openTab, sleep, summary } from '../lib.mjs'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const PY = path.join(process.env.QA_BACKEND || path.join(process.env.HOME, 'Projects', 'FaceCloud_backend'), '.venv', 'bin', 'python')
const dir = path.join(OUT, 'enhancement'); await fs.rm(dir, { recursive: true, force: true }); await fs.mkdir(dir, { recursive: true })
const py = (code, ...args) => execFileSync(PY, ['-c', code, ...args], { encoding: 'utf8' })

// Test photos: the repository's portrait lifted to a normal exposure (brightness about 71), then
//   clean (as is) · dark40 (x0.40: dark but usable) · dark25 (x0.25: what scripts/seed_demo.py --dark makes) · noisy (+ grain)
py(`
import cv2, numpy as np, sys
src = cv2.imread(sys.argv[1]); base = np.clip((src.astype(np.float32)/255) ** 0.55 * 255, 0, 255).astype(np.uint8); out = sys.argv[2]
cv2.imwrite(out + '/clean.png', base)
cv2.imwrite(out + '/dark40.png', np.clip(base.astype(np.float32) * 0.40, 0, 255).astype(np.uint8))
cv2.imwrite(out + '/dark25.png', np.clip(base.astype(np.float32) * 0.25, 0, 255).astype(np.uint8))
cv2.imwrite(out + '/noisy.png', np.clip(base.astype(np.float32) + np.random.default_rng(1).normal(0, 18, base.shape), 0, 255).astype(np.uint8))
`, path.join(root, 'public', 'hero-portrait.png'), dir)
const metrics = (a, b) => JSON.parse(py(`
import cv2, numpy as np, json, sys
a = cv2.imread(sys.argv[1]); b = cv2.imdecode(np.fromfile(sys.argv[2], np.uint8), 1)
if a.shape != b.shape: b = cv2.resize(b, (a.shape[1], a.shape[0]))
lap = lambda x: cv2.Laplacian(cv2.cvtColor(x, cv2.COLOR_BGR2GRAY), cv2.CV_64F).var()
print(json.dumps({'change': float(np.abs(a.astype(float) - b.astype(float)).mean()), 'bright_before': float(a.mean()), 'bright_after': float(b.mean()), 'sharp_before': float(lap(a)), 'sharp_after': float(lap(b))}))
`, a, b))

const tok = (await apiLogin('member2@qa.test')).token
const run = async name => {
  const fd = new FormData(); fd.append('file', new Blob([await fs.readFile(path.join(dir, name + '.png'))], { type: 'image/png' }), `enh-${name}.png`)
  const up = await (await fetch(API + '/api/images/upload/single/', { method: 'POST', headers: { authorization: 'Bearer ' + tok }, body: fd })).json(); await sleep(4500)
  const img = (await api(`/api/images/batches/${up.id}/progress/`, tok)).json.images[0]
  const detail = (await api(`/api/images/${img.image_id}/`, tok)).json
  if (img.status === 'rejected') return { verdict: 'rejected', reasons: detail.quality_decision?.rejection_reasons ?? [] }
  let res = (await api(`/api/enhancements/images/${img.image_id}/`, tok, { method: 'POST', body: JSON.stringify({ level: 'auto', style: 'natural' }) })).json
  for (let i = 0; i < 90 && !['completed', 'failed'].includes(res.status); i++) { await sleep(2000); res = (await api(`/api/enhancements/results/${res.id}/`, tok)).json }
  const dl = await fetch(API + `/api/enhancements/results/${res.id}/download/`, { headers: { authorization: 'Bearer ' + tok } }); const file = path.join(dir, name + '.enhanced.bin'); await fs.writeFile(file, Buffer.from(await dl.arrayBuffer()))
  return { verdict: img.status, imageId: img.image_id, res, ...metrics(path.join(dir, name + '.png'), file) }
}

const clean = await run('clean')
await check('ENH-01', 'a clean, well-lit portrait is accepted and enhancement finishes', clean.verdict === 'accepted' && clean.res?.status === 'completed', `${clean.verdict} ${clean.res?.status}`)
await check('ENH-02', 'a clean portrait is left as it is (changed by less than 4 of 255)', clean.change < 4, `mean change ${clean.change?.toFixed(2)}`)
const dark = await run('dark40')
await check('ENH-03', 'a dark portrait (brightness about 28) is brightened to at least 1.5 times', dark.verdict !== 'rejected' && dark.bright_after >= dark.bright_before * 1.5, dark.verdict === 'rejected' ? `rejected ${dark.reasons}` : `brightness ${dark.bright_before?.toFixed(0)} -> ${dark.bright_after?.toFixed(0)}, ${dark.res?.enhancement_outcome}`)
const noisy = await run('noisy')
await check('ENH-04', 'a noisy portrait is smoothed (the grain measure falls by at least 25 percent)', noisy.verdict !== 'rejected' && noisy.sharp_after <= noisy.sharp_before * 0.75, `grain/sharpness ${noisy.sharp_before?.toFixed(0)} -> ${noisy.sharp_after?.toFixed(0)}`)
const dark25 = await run('dark25')
await check('ENH-05', 'the photo that scripts/seed_demo.py --dark makes (x0.25) is accepted and brightened, so the defence demo can show low light', dark25.verdict !== 'rejected' && dark25.bright_after > dark25.bright_before * 1.5, dark25.verdict === 'rejected' ? `rejected: ${dark25.reasons} (BE-005)` : `brightness ${dark25.bright_before?.toFixed(0)} -> ${dark25.bright_after?.toFixed(0)}`)

// the screens say what happened
const t = await openTab(); await t.wipe(); await t.login('user', 'member2@qa.test')
const main = () => t.ev(`(document.querySelector('main')||document.body).innerText.replace(/\\s+/g,' ')`)
await t.go('/dashboard/upload/single', 2500); await t.setFile('input[type=file]', [path.join(dir, 'clean.png')]); await sleep(1500); await t.click('Confirm'); await sleep(26000)
const upload = await main()
await check('ENH-06', 'upload screen, clean photo: says nothing needed fixing (not "Light correction")', /No correction needed/.test(upload) && /Nothing needed fixing/.test(upload) && !/Light correction/.test(upload), upload.slice(upload.indexOf('ENHANCEMENT'), upload.indexOf('ENHANCEMENT') + 200))
await t.go(`/dashboard/images/${clean.imageId}`, 4500); const detailText = await main()
await check('ENH-07', 'photo page, clean photo: says nothing needed fixing', /Nothing needed fixing/.test(detailText) && !/strength applied/.test(detailText), detailText.slice(0, 160))
await t.go(`/dashboard/images/${clean.imageId}/edit`, 5000)
await t.ev(`[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Auto').click()`); await sleep(7000)
const note = await t.ev(`document.querySelector('[role=status]')?.innerText || ''`)
await check('ENH-08', 'editor, Auto on a clean photo: explains that it found nothing to fix', /Auto found nothing to fix/.test(note), note)
await t.ev(`[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Auto + brighten').click()`); await sleep(7000)
const sliders = await t.ev(`[...document.querySelectorAll('input[type=range]')].slice(0,3).map(r=>r.value).join(',')`)
await check('ENH-09', 'editor, Auto + brighten changes the sliders (brightness / shadows move)', sliders !== '0,0,0', sliders)
summary(); process.exit(0)
