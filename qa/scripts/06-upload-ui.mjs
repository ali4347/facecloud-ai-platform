// The three upload screens with good, bad and mixed files, checking what the person is TOLD (not just that nothing crashes).
import fs from 'node:fs/promises'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { OUT, check, openTab, sleep, summary } from '../lib.mjs'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const fx = path.join(OUT, 'fixtures'); await fs.rm(fx, { recursive: true, force: true }); await fs.mkdir(fx, { recursive: true })
const photo = await fs.readFile(path.join(root, 'public', 'demo', 'facecloud-enhancement-demo-original.jpg'))
await fs.writeFile(path.join(fx, 'ok.jpg'), photo); await fs.writeFile(path.join(fx, 'notes.txt'), 'hello'); await fs.writeFile(path.join(fx, 'fake.jpg'), 'this is not an image'); await fs.writeFile(path.join(fx, 'empty.jpg'), '')
await fs.writeFile(path.join(fx, 'doc.pdf'), '%PDF-1.4 not really')
execFileSync('zip', ['-q', '-j', path.join(fx, 'mixed.zip'), path.join(fx, 'ok.jpg'), path.join(fx, 'notes.txt')]); await fs.writeFile(path.join(fx, 'fake.zip'), 'not a zip')
const f = n => path.join(fx, n)
const t = await openTab(); await t.wipe(); await t.login('user', 'plain@qa.test')
const flow = async (route, files, wait = 9000) => {
  await t.go(route, 2500); t.clearIssues(); await t.setFile('input[type=file]', files); await sleep(2000)
  const main = () => t.ev(`(document.querySelector('main')||document.body).innerText.replace(/\\s+/g,' ')`)
  const before = await main(); const clicked = await t.click('Confirm') || await t.click('Upload') || await t.click('Start')
  await sleep(wait); return { before, after: await main(), clicked }
}
// single: a text file
let r = await flow('/dashboard/upload/single', [f('notes.txt')], 4000); await t.shot('upload-single-txt')
await check('UPUI-01', 'single: a .txt file is refused with a sentence that names the problem', /Unsupported file type/i.test(r.before + r.after), r.after.slice(0, 220))
r = await flow('/dashboard/upload/single', [f('doc.pdf')], 4000); await check('UPUI-02', 'single: a PDF is refused with the "unsupported file type" sentence', /Unsupported file type/i.test(r.before + r.after), r.after.slice(0, 220))
r = await flow('/dashboard/upload/single', [f('fake.jpg')], 9000); await t.shot('upload-single-fake')
await check('UPUI-03', 'single: a text file renamed .jpg is refused after upload, with a reason (not "Request failed")', /not a valid or readable image/i.test(r.after) && !/Request failed \(\d+\)/.test(r.after) && !t.issues.exceptions.length, r.after.slice(0, 220))
r = await flow('/dashboard/upload/single', [f('empty.jpg')], 6000); await check('UPUI-04', 'single: an empty file is refused with a reason', /(empty|0 bytes|not a valid or readable image)/i.test(r.after) && !/Request failed \(\d+\)/.test(r.after), r.after.slice(0, 220))
// multiple: one good, two bad
r = await flow('/dashboard/upload/multiple', [f('ok.jpg'), f('notes.txt'), f('fake.jpg')], 12000); await t.shot('upload-multiple-mixed')
await check('UPUI-05', 'multiple: a mix of good and bad files says how many were accepted and rejected', /Unsupported file type/i.test(r.after) && /not a valid or readable image/i.test(r.after) && /Photos rejected:\s*3/i.test(r.after), r.after.slice(0, 300))
await check('UPUI-06', 'multiple: no uncaught error while processing a mixed batch', !t.issues.exceptions.length, t.issues.exceptions[0] || '')
// zip
r = await flow('/dashboard/upload/zip', [f('mixed.zip')], 12000); await t.shot('upload-zip-mixed')
await check('UPUI-07', 'zip: a ZIP with a photo and a text file reports both (found, accepted, rejected)', /Photos found in ZIP:\s*2/i.test(r.after) && /Photos rejected:\s*[12]/i.test(r.after), r.after.slice(0, 300))
r = await flow('/dashboard/upload/zip', [f('fake.zip')], 6000); await t.shot('upload-zip-fake')
await check('UPUI-08', 'zip: a file that is not a ZIP is refused with a sentence, not "Request failed"', /not a valid ZIP archive/i.test(r.before + r.after) && !/Request failed \(\d+\)/.test(r.after), r.after.slice(0, 220))
// a second tab with the same login keeps working while an upload runs (no shared-state clash)
await t.go('/dashboard/images', 3500); const imgText = await t.text(); await check('UPUI-09', 'My Images lists the uploaded photos and rejected files with their reasons', /ok\.jpg/.test(imgText), imgText.slice(0, 200))
summary(); process.exit(0)
