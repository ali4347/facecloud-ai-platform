// The "polish" change in the enhancement engine, checked from the outside, with the real upload and enhancement endpoints.
// A set of photos (clean, flat, dark, noisy, blurred) is enhanced at several levels and styles; for each one the output is
// recorded (outcome, stages, a hash of the decoded pixels, how far it moved, whether the face moved). Run it once on each
// backend you want to compare, then compare the files:
//
//   node qa/scripts/16-polish.mjs record before      # on the unchanged backend  -> qa/out/polish-before.json
//   node qa/scripts/16-polish.mjs record off         # on the new code, flag off -> qa/out/polish-off.json
//   node qa/scripts/16-polish.mjs record on          # on the new code, flag on  -> qa/out/polish-on.json
//   node qa/scripts/16-polish.mjs compare before off on
//
// "compare" is the proof the owner asked for: with the flag off nothing at all differs from "before"; with the flag on only
// photos that were left alone ("original_preserved") may differ, and then only slightly and with the face where it was.
import fs from 'node:fs/promises'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { API, OUT, api, apiLogin, check, sleep, summary } from '../lib.mjs'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const PY = path.join(process.env.HOME, 'Projects', 'FaceCloud_backend', '.venv', 'bin', 'python')
const MODELS = path.join(process.env.HOME, 'Projects', 'FaceCloud_backend', '.runtime', 'models')
const py = (code, ...args) => execFileSync(PY, ['-c', code, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
const [mode, ...labels] = process.argv.slice(2)
await fs.mkdir(OUT, { recursive: true })

const COMBOS = [['auto', 'natural'], ['auto', 'dynamic'], ['medium', 'natural'], ['high', 'dynamic']]
// Real photographs to try as well (the "nothing wrong" kind a person would upload): QA_REAL_PHOTOS="name=/path/a.jpg,name2=/path/b.jpg".
const EXTERNAL = Object.fromEntries((process.env.QA_REAL_PHOTOS || '').split(',').filter(Boolean).map(pair => pair.split('=')))
const ALL = ['clean', 'flat', 'dark40', 'noisy', 'blurred', ...Object.keys(EXTERNAL)]
const PHOTOS = process.env.ONLY ? process.env.ONLY.split(',') : ALL

const measure = (a, b) => JSON.parse(py(`
import cv2, numpy as np, json, sys, hashlib
a = cv2.imread(sys.argv[1]); b = cv2.imdecode(np.fromfile(sys.argv[2], np.uint8), 1)
same_shape = a.shape == b.shape
bb = b if same_shape else cv2.resize(b, (a.shape[1], a.shape[0]))
lab = lambda x: cv2.cvtColor(x.astype(np.float32) / 255.0, cv2.COLOR_BGR2LAB)
de = float(np.sqrt(((lab(a) - lab(bb)) ** 2).sum(axis=2)).mean())
lap = lambda x: float(cv2.Laplacian(cv2.cvtColor(x, cv2.COLOR_BGR2GRAY), cv2.CV_64F).var())
std = lambda x: float(cv2.cvtColor(x, cv2.COLOR_BGR2GRAY).std())
clipped = lambda x: float((cv2.cvtColor(x, cv2.COLOR_BGR2GRAY) >= 250).mean() * 100)
det = cv2.FaceDetectorYN.create(sys.argv[3] + '/yunet_s_dynamic.onnx', '', (a.shape[1], a.shape[0]), 0.6, 0.3, 5000)
def face(x):
    det.setInputSize((x.shape[1], x.shape[0])); _, f = det.detect(x)
    if f is None or len(f) == 0: return None
    r = f[np.argmax(f[:, -1])]; return [float(v) for v in r[:14]]
fa, fb = face(a), face(bb)
ga, gb = [np.float32(cv2.cvtColor(x, cv2.COLOR_BGR2GRAY)) for x in (a, bb)]
(sdx, sdy), _resp = cv2.phaseCorrelate(ga, gb)       # how far the whole picture moved, in pixels (0 = nothing moved)
drift = None; box = None
if fa and fb:
    w = fa[2]
    box = max(abs(fa[0]-fb[0]), abs(fa[1]-fb[1]), abs(fa[2]-fb[2]), abs(fa[3]-fb[3])) / w * 100
    drift = max(((fa[4+2*i]-fb[4+2*i])**2 + (fa[5+2*i]-fb[5+2*i])**2) ** 0.5 for i in range(5)) / w * 100
print(json.dumps({'sha': hashlib.sha256(b.tobytes()).hexdigest()[:16], 'same_size': bool(same_shape), 'delta_e': round(de, 3),
  'bright': [round(float(a.mean()), 1), round(float(bb.mean()), 1)], 'contrast': [round(std(a), 2), round(std(bb), 2)],
  'sharp': [round(lap(a), 1), round(lap(bb), 1)], 'clipped_pct': [round(clipped(a), 2), round(clipped(bb), 2)],
  'face_drift_pct': None if drift is None else round(drift, 2), 'box_drift_pct': None if box is None else round(box, 2), 'shift_px': round(float((sdx**2 + sdy**2) ** 0.5), 3)}))
`, a, b, MODELS))

if (mode === 'record') {
  const label = labels[0]; if (!label) throw new Error('give a label: record before|off|on')
  const dir = path.join(OUT, 'polish-' + label); if (!process.env.ONLY) await fs.rm(dir, { recursive: true, force: true }); await fs.mkdir(dir, { recursive: true })
  // The repository's portrait at a normal exposure, then the variants. The seed makes the photos identical on every run.
  py(`
import cv2, numpy as np, sys
src = cv2.imread(sys.argv[1]); out = sys.argv[2]
base = np.clip((src.astype(np.float32)/255) ** 0.55 * 255, 0, 255).astype(np.uint8)
cv2.imwrite(out + '/clean.png', base)
flat = np.clip((base.astype(np.float32) - 128) * 0.62 + 128, 0, 255).astype(np.uint8)      # low contrast, normal exposure
cv2.imwrite(out + '/flat.png', flat)
cv2.imwrite(out + '/dark40.png', np.clip(base.astype(np.float32) * 0.40, 0, 255).astype(np.uint8))
cv2.imwrite(out + '/noisy.png', np.clip(base.astype(np.float32) + np.random.default_rng(1).normal(0, 18, base.shape), 0, 255).astype(np.uint8))
cv2.imwrite(out + '/blurred.png', cv2.GaussianBlur(base, (0, 0), 3.0))
for pair in sys.argv[3:]:
    name, file = pair.split('=', 1); im = cv2.imread(file)
    if im is not None: cv2.imwrite(out + '/' + name + '.png', im)
`, path.join(root, 'public', 'hero-portrait.png'), dir, ...Object.entries(EXTERNAL).map(([n, f]) => `${n}=${f}`))


  const tok = (await apiLogin('member2@qa.test')).token
  const rows = process.env.ONLY ? JSON.parse(await fs.readFile(path.join(OUT, `polish-${label}.json`), 'utf8').catch(() => '{}')) : {}
  for (const name of PHOTOS) {
    const file = path.join(dir, name + '.png')
    const fd = new FormData(); fd.append('file', new Blob([await fs.readFile(file)], { type: 'image/png' }), `polish-${name}.png`)
    const up = await (await fetch(API + '/api/images/upload/single/', { method: 'POST', headers: { authorization: 'Bearer ' + tok }, body: fd })).json()
    let img
    for (let i = 0; i < 30; i++) { await sleep(2000); const prog = (await api(`/api/images/batches/${up.id}/progress/`, tok)).json; img = prog.images?.[0]; if (img && ['accepted', 'rejected', 'needs_review', 'failed'].includes(img.status)) break }
    if (!img || img.status === 'rejected' || img.status === 'failed') { rows[name] = { verdict: img?.status ?? 'unknown' }; console.log(`${name}: ${img?.status} (not enhanced)`); continue }
    for (const [level, style] of COMBOS) {
      let res = (await api(`/api/enhancements/images/${img.image_id}/`, tok, { method: 'POST', body: JSON.stringify({ level, style }) })).json
      for (let i = 0; i < 90 && !['completed', 'failed', 'cancelled'].includes(res.status); i++) { await sleep(1500); res = (await api(`/api/enhancements/results/${res.id}/`, tok)).json }
      const dl = await fetch(API + `/api/enhancements/results/${res.id}/download/`, { headers: { authorization: 'Bearer ' + tok } })
      const out = path.join(dir, `${name}.${level}.${style}.out`); await fs.writeFile(out, Buffer.from(await dl.arrayBuffer()))
      rows[`${name}|${level}|${style}`] = { verdict: img.status, status: res.status, outcome: res.enhancement_outcome, stages: (res.applied_stages || []).map(s => `${s.stage}:${s.engine}:${s.variant}`), skipped: (res.skipped_stages || []).map(s => s.stage), summary: res.enhancement_summary, ...measure(file, out) }
      const r = rows[`${name}|${level}|${style}`]
      console.log(`${name.padEnd(8)} ${level.padEnd(6)} ${style.padEnd(8)} ${String(r.outcome).padEnd(20)} ${r.stages.join(',') || '-'}  dE ${r.delta_e}  drift ${r.face_drift_pct}`)
    }
  }
  await fs.writeFile(path.join(OUT, `polish-${label}.json`), JSON.stringify(rows, null, 1))
  console.log('written', path.join(OUT, `polish-${label}.json`))
  process.exit(0)
}

if (mode === 'remeasure') {
  for (const label of labels) {
    const file = path.join(OUT, `polish-${label}.json`); const rows = JSON.parse(await fs.readFile(file, 'utf8')); const dir = path.join(OUT, 'polish-' + label)
    for (const key of Object.keys(rows)) {
      const [name, level, style] = key.split('|'); if (!level || rows[key].outcome === undefined) continue
      const input = path.join(dir, name + '.png'), out = path.join(dir, `${name}.${level}.${style}.out`)
      try { Object.assign(rows[key], measure(input, out)) } catch { /* the photo or output is not there */ }
    }
    await fs.writeFile(file, JSON.stringify(rows, null, 1)); console.log('remeasured', label)
  }
  process.exit(0)
}

if (mode === 'compare') {
  const [bLabel, oLabel, nLabel] = labels
  const load = async l => JSON.parse(await fs.readFile(path.join(OUT, `polish-${l}.json`), 'utf8'))
  const before = await load(bLabel), off = await load(oLabel), on = nLabel ? await load(nLabel) : null
  const keys = Object.keys(before).filter(k => off[k])
  const sameRow = (x, y) => x && y && x.sha === y.sha && x.outcome === y.outcome && JSON.stringify(x.stages) === JSON.stringify(y.stages)
  const offDiffs = keys.filter(k => !sameRow(before[k], off[k]))
  await check('POL-01', `flag OFF: every output equals the unchanged backend's (${keys.length} runs: same pixels, same outcome, same stages)`, offDiffs.length === 0, offDiffs.length ? `different: ${offDiffs.join('; ')}` : `${keys.length} identical`)
  if (on) {
    const touched = keys.filter(k => !sameRow(before[k], on[k]))
    const wrong = touched.filter(k => before[k].outcome !== 'original_preserved')
    await check('POL-02', 'flag ON: no photo that already got a real operation (low light, noise, blur...) changed by a single pixel', wrong.length === 0, wrong.length ? `changed: ${wrong.join('; ')}` : `${touched.length} changed, all were original_preserved before`)
    const polished = touched.filter(k => on[k].stages.some(s => s.startsWith('polish')))
    const strange = touched.filter(k => !on[k].stages.some(s => s.startsWith('polish')))
    await check('POL-03', 'flag ON: every changed photo says why (a "polish" stage is listed)', strange.length === 0, strange.length ? `no stage: ${strange.join('; ')}` : `${polished.length} polished`)
    const far = polished.filter(k => on[k].delta_e > 3 || on[k].shift_px > 0.5 || !on[k].same_size || (on[k].face_drift_pct ?? 0) > 3)
    await check('POL-04', 'flag ON: a polished photo stays the same photo (same size, mean colour change at most 3, nothing shifted by more than half a pixel, re-detected face landmarks within 3 percent of its width)', far.length === 0, far.length ? far.map(k => `${k} dE ${on[k].delta_e} shift ${on[k].shift_px}px landmarks ${on[k].face_drift_pct}%`).join('; ') : polished.map(k => `${k}: dE ${on[k].delta_e}, shift ${on[k].shift_px}px, landmarks ${on[k].face_drift_pct}%`).join(' | '))
    const worse = polished.filter(k => !(on[k].sharp[1] > on[k].sharp[0] * 1.05 || on[k].contrast[1] > on[k].contrast[0] * 1.05) || on[k].clipped_pct[1] > on[k].clipped_pct[0] + 0.5)
    await check('POL-05', 'flag ON: a polished photo is measurably sharper or higher in contrast (at least 5 percent) and has no new clipped highlights', worse.length === 0, worse.length ? worse.map(k => k).join('; ') : 'all improved')
    const anyPolish = polished.length > 0
    await check('POL-06', 'flag ON: at least one ordinary photo is polished (otherwise the feature does nothing)', anyPolish, `${polished.length} of ${keys.length}`)
    const cleanNatural = on['clean|auto|natural']
    console.log('\nclean photo, auto/natural, flag on:', JSON.stringify({ outcome: cleanNatural?.outcome, stages: cleanNatural?.stages, summary: cleanNatural?.summary, de: cleanNatural?.delta_e, contrast: cleanNatural?.contrast, sharp: cleanNatural?.sharp }))
    console.log('flat photo, auto/natural, flag on:', JSON.stringify({ outcome: on['flat|auto|natural']?.outcome, stages: on['flat|auto|natural']?.stages, de: on['flat|auto|natural']?.delta_e, contrast: on['flat|auto|natural']?.contrast, sharp: on['flat|auto|natural']?.sharp }))
  }
  summary(); process.exit(0)
}

console.log('usage: record <label> | remeasure <label>... | compare <before> <off> [on]'); process.exit(1)
