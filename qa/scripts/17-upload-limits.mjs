// The photo limits (GPU) on the Upload Center cards, the Multiple page (10) and the ZIP page (20): what is shown, 12 photos cut to 10, a full batch,
// and a ZIP counted from its table of contents before anything is sent (22 refused, 20 and 12 taken, a text file not counted, a non-ZIP refused).
import fs from 'node:fs/promises'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { OUT, check, openTab, sleep, summary } from '../lib.mjs'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const fx = path.join(OUT, 'fixtures-limit10'); await fs.rm(fx, { recursive: true, force: true }); await fs.mkdir(fx, { recursive: true })
const photo = await fs.readFile(path.join(root, 'public', 'demo', 'facecloud-enhancement-demo-original.jpg'))
const names = n => Array.from({ length: n }, (_, i) => `p${String(i).padStart(2, '0')}.jpg`)
for (const n of names(22)) await fs.writeFile(path.join(fx, n), photo)
await fs.writeFile(path.join(fx, 'notes.txt'), 'hello'); await fs.writeFile(path.join(fx, 'fake.zip'), 'not a zip')
const zip = (out, list) => execFileSync('zip', ['-q', '-j', path.join(fx, out), ...list.map(n => path.join(fx, n))])
zip('twelve.zip', names(12)); zip('twenty.zip', names(20)); zip('twenty-two.zip', names(22)); zip('one-and-text.zip', ['p00.jpg', 'notes.txt'])
const f = n => path.join(fx, n)

const t = await openTab(); await t.wipe(); await t.login('user', 'plain@qa.test')
const main = () => t.ev(`(document.querySelector('main')||document.body).innerText.replace(/\\s+/g,' ')`)

// Upload Center
await t.go('/dashboard/upload', 2500); let txt = await main(); await t.shot('limit10-center')
await check('L10-01', 'Upload Center: the Multiple card says 10 photos and not 150', /Pick up to 10 photos/.test(txt) && !/150/.test(txt), txt.slice(0, 400))
await check('L10-02', 'Upload Center: the ZIP card says a ZIP of up to 20 photos (not only a size) while the Multiple card still says 10', /ZIP of up to 20 portraits/.test(txt) && /Up to 20 photos/.test(txt) && /Pick up to 10 photos/.test(txt), txt.slice(0, 700))
await check('L10-03', 'Upload Center: the guidelines name the ZIP photo limit too', /ZIP limit: 2 GB, at most 20 photos/.test(txt), txt.slice(-500))

// Multiple: 12 chosen, 10 kept
await t.go('/dashboard/upload/multiple', 2500); t.clearIssues()
await t.setFile('input[type=file]', names(12).map(f)); await sleep(1500); txt = await main(); await t.shot('limit10-multiple-12')
await check('L10-04', 'Multiple: 12 photos chosen -> 10 kept and a sentence says only the first 10 were added', /10 photos selected/.test(txt) && /only the first 10 were added/.test(txt), txt.slice(0, 300))
// add one more: full
await t.setFile('input[type=file]', [f('p11.jpg')]); await sleep(1000); txt = await main()
await check('L10-05', 'Multiple: adding to a full batch says it is full (not "only the first 0")', /this one is full/.test(txt) && !/first 0/.test(txt) && /10 photos selected/.test(txt), txt.slice(0, 300))
await check('L10-06', 'Multiple: no uncaught error', !t.issues.exceptions.length, t.issues.exceptions[0] || '')

// ZIP
const zipFlow = async file => { await t.go('/dashboard/upload/zip', 2500); t.clearIssues(); await t.setFile('input[type=file]', [f(file)]); await sleep(1500); return main() }
txt = await zipFlow('twenty-two.zip'); await t.shot('limit10-zip-22')
await check('L10-07', 'ZIP: an archive of 22 photos is refused before anything is sent, with the limit and the reason', /holds 22 photos/.test(txt) && /up to 20 photos/.test(txt) && /GPU/.test(txt) && !/Confirm & Upload/.test(txt), txt.slice(0, 400))
txt = await zipFlow('twenty.zip'); await t.shot('limit10-zip-20')
await check('L10-08', 'ZIP: an archive of exactly 20 photos is accepted and shows "20 photos inside" with the upload button', /20 photos inside/.test(txt) && /Confirm & Upload/.test(txt), txt.slice(0, 400))
txt = await zipFlow('twelve.zip')
await check('L10-08b', 'ZIP: 12 photos, over the batch limit of 10 but inside the ZIP limit of 20, is accepted', /12 photos inside/.test(txt) && /Confirm & Upload/.test(txt), txt.slice(0, 400))
txt = await zipFlow('one-and-text.zip')
await check('L10-09', 'ZIP: a photo plus a text file counts 1 photo (the text file is not counted)', /1 photo inside/.test(txt) && /Confirm & Upload/.test(txt), txt.slice(0, 400))
txt = await zipFlow('fake.zip')
await check('L10-10', 'ZIP: a file that is not a ZIP is refused with a sentence', /Could not read that file as a ZIP archive/.test(txt), txt.slice(0, 300))
await check('L10-11', 'ZIP: no uncaught error through all of it', !t.issues.exceptions.length, t.issues.exceptions[0] || '')
// the dropzone is usable again after a refusal
await check('L10-12', 'ZIP: after a refusal the drop area is still there to try again', /Click to browse or drop a ZIP file here/.test(txt), txt.slice(0, 300))
summary(); process.exit(0)
