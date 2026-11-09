// /dashboard/duplicates: deciding on the pairs of photos the duplicate check found.
//   source $TMPDIR/facecloud-qa/env.sh && node qa/scripts/19-duplicates.mjs
// Six versions of one portrait are uploaded (one of them a byte-for-byte copy), so the check finds suspected near matches and
// one exact match. The user plain@qa.test is used because it has no uploads of its own. Run once per stack: it trashes a photo.
import fs from 'node:fs/promises'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { API, OUT, api, apiLogin, check, openTab, sleep, summary } from '../lib.mjs'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const PY = path.join(process.env.QA_BACKEND || path.join(process.env.HOME, 'Projects', 'FaceCloud_backend'), '.venv', 'bin', 'python')
const dir = path.join(OUT, 'fixtures-duplicates'); await fs.rm(dir, { recursive: true, force: true }); await fs.mkdir(dir, { recursive: true })

// The repository's portrait lifted to a normal exposure (as scripts/09 does), then five slight variations of it and an exact copy.
execFileSync(PY, ['-c', `
import cv2, numpy as np, shutil, sys
src = cv2.imread(sys.argv[1]); base = np.clip((src.astype(np.float32)/255) ** 0.55 * 255, 0, 255).astype(np.uint8); out = sys.argv[2]
cv2.imwrite(out + '/dup-base.png', base)
shutil.copyfile(out + '/dup-base.png', out + '/dup-copy.png')
cv2.imwrite(out + '/dup-darker.jpg', np.clip(base.astype(np.float32) * 0.94, 0, 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 80])
cv2.imwrite(out + '/dup-lighter.png', np.clip(base.astype(np.float32) * 1.04, 0, 255).astype(np.uint8))
cv2.imwrite(out + '/dup-grain.png', np.clip(base.astype(np.float32) + np.random.default_rng(3).normal(0, 4, base.shape), 0, 255).astype(np.uint8))
cv2.imwrite(out + '/dup-soft.jpg', cv2.GaussianBlur(base, (3, 3), 0), [cv2.IMWRITE_JPEG_QUALITY, 60])
`, path.join(root, 'public', 'hero-portrait.png'), dir], { encoding: 'utf8' })

const session = await apiLogin('plain@qa.test')
const token = session.token
const mine = (p, opts) => api(p, token, opts)
const uploaded = {}
for (const name of ['dup-base.png', 'dup-darker.jpg', 'dup-copy.png', 'dup-lighter.png', 'dup-grain.png', 'dup-soft.jpg']) {
  const fd = new FormData(); fd.append('file', new Blob([await fs.readFile(path.join(dir, name))], { type: name.endsWith('.jpg') ? 'image/jpeg' : 'image/png' }), name); fd.append('auto_enhance', 'false')
  const up = await (await fetch(API + '/api/images/upload/single/', { method: 'POST', headers: { authorization: 'Bearer ' + token }, body: fd })).json()
  await sleep(3500)
  const progress = (await mine(`/api/images/batches/${up.id}/progress/`)).json
  uploaded[name] = progress.images?.[0]
}
await check('DUP-00', 'six photos were accepted by the upload checks', Object.values(uploaded).every(image => image && image.status === 'accepted'), JSON.stringify(Object.entries(uploaded).map(([n, i]) => `${n}:${i?.status}`)))
for (let i = 0; i < 30; i++) {
  const results = (await mine('/api/duplicates/results/?page=1&page_size=100')).json?.results ?? []
  if (results.length >= 6 && results.every(r => r.status === 'completed')) break
  await sleep(1000)
}
const results = (await mine('/api/duplicates/results/?page=1&page_size=100&decision=needs_review')).json
await check('DUP-01', 'the duplicate check found suspected pairs on its own (decision needs_review)', (results?.count ?? 0) >= 2, `count ${results?.count}`)
const ids = Object.fromEntries(Object.entries(uploaded).map(([n, i]) => [n, i.image_id]))
const matchesOf = async image => (await mine(`/api/duplicates/images/${image}/matches/`)).json
const baseMatches = await matchesOf(ids['dup-base.png'])
const exact = baseMatches.find(m => m.match_type === 'exact')
await check('DUP-02', 'the byte-for-byte copy is an exact match and the server made it confirmed already', exact?.review_status === 'confirmed', JSON.stringify(exact && { type: exact.match_type, status: exact.review_status, score: exact.similarity_score }))
const dismissExact = await mine(`/api/duplicates/matches/${exact.id}/review/`, { method: 'PATCH', body: JSON.stringify({ review_status: 'not_duplicate' }) })
await check('DUP-03', 'the server refuses to dismiss an exact match, in these words', dismissExact.status === 400 && /cannot be dismissed/i.test(dismissExact.text), `${dismissExact.status} ${dismissExact.text.slice(0, 120)}`)
const types = new Set(baseMatches.map(m => m.match_type)); console.log('INFO  match types seen for the base photo:', [...types].join(', '))

const t = await openTab({ width: 1280, height: 1000 })
const onPage = []   // the duplicate requests the Duplicates page itself makes
t.on('Network.requestWillBeSent', p => { if (p.request.method === 'GET' && p.documentURL.includes('/dashboard/duplicates') && p.request.url.includes('/api/duplicates/')) onPage.push(p.request.url) })
await t.wipe()
await t.login('user', 'plain@qa.test')
const cards = () => t.ev(`[...document.querySelectorAll('article')].map(a => ({ id: Number(a.dataset.match), label: a.getAttribute('aria-label'), text: a.innerText.replace(/\\s+/g,' '), buttons: [...a.querySelectorAll('button')].map(b => ({ text: b.textContent.trim(), disabled: b.disabled })), thumbs: a.querySelectorAll('img[src^="blob:"]').length, links: [...a.querySelectorAll('a')].map(l => l.getAttribute('href')) }))`)
const press = (cardIndex, label) => t.ev(`(()=>{const a=[...document.querySelectorAll('article')][${cardIndex}];const b=[...a.querySelectorAll('button')].find(b=>b.textContent.trim().includes(${JSON.stringify(label)})&&!b.disabled);if(b){b.click();return true}return false})()`)
// Each filter is its own request to the server now, so wait for the list to arrive after choosing one.
const filter = async label => { const found = await t.ev(`(()=>{const b=[...document.querySelectorAll('[role=group] button')].find(b=>b.textContent.trim().startsWith(${JSON.stringify(label)}));if(b){b.click();return true}return false})()`); await sleep(2200); return found }
const filterLabels = () => t.ev(`[...document.querySelectorAll('[role=group][aria-label=Show] button')].map(b=>b.textContent.trim())`)
const open = async (wait = 6000) => { await t.go('/dashboard/duplicates', wait) }
const hasSideScroll = () => t.ev('document.documentElement.scrollWidth > window.innerWidth + 1')

// ── The page, its tab and its first view ──────────────────────────────────
await t.go('/dashboard/images', 3000)
await check('DUP-04', 'the library tabs have a Duplicates tab that leads to /dashboard/duplicates', await t.ev(`!!document.querySelector('nav[aria-label="Photo library"] a[href="/dashboard/duplicates"]')`))
await t.clickSel('nav[aria-label="Photo library"] a[href="/dashboard/duplicates"]'); await sleep(6000)
await check('DUP-05', 'the Duplicates tab is the current one on its own page', await t.ev(`document.querySelector('nav[aria-label="Photo library"] a[href="/dashboard/duplicates"]')?.getAttribute('aria-current')`) === 'page' && (await t.path()) === '/dashboard/duplicates')
let list = await cards()
const page1 = list.length
await check('DUP-06', 'To review lists suspected pairs, newest first, at most 10 to a page', page1 >= 2 && page1 <= 10 && list.every(c => /To review/.test(c.text)), `${page1} cards`)
const first = list[0]
await check('DUP-07', 'each card has two photos, both shown (through the token) and both linking to their photo page', first.thumbs === 2 && first.links.length === 2 && first.links.every(l => /^\/dashboard\/images\/\d+$/.test(l)), JSON.stringify({ thumbs: first.thumbs, links: first.links }))
await check('DUP-08', 'each card says what kind of match it is, in words, and how alike (a percentage)', list.every(c => /(Almost the same photo|The same face)/.test(c.text) && /\d+% alike/.test(c.text)), first.text.slice(0, 160))
await check('DUP-09', 'the cards have both buttons, "Same photo" and "Not a duplicate"', list.every(c => c.buttons.some(b => b.text === 'Same photo') && c.buttons.some(b => b.text === 'Not a duplicate')))
const body = await t.text()
await check('DUP-10', 'no raw server words ("perceptual", "face_region", "suspected") on the page', !/perceptual|face_region|suspected|not_duplicate/i.test(body))
const labels = await filterLabels()
await check('DUP-11', 'the three filters are there with counts', labels.length === 3 && /^To review \(\d+\)$/.test(labels[0]) && /^Confirmed \(\d+\)$/.test(labels[1]) && /^Not duplicates \(\d+\)$/.test(labels[2]), labels.join(' | '))
await t.shot('duplicates-review-dark')
await t.ev(`document.documentElement.dataset.theme='light'`); await sleep(300); await t.shot('duplicates-review-light'); await t.ev(`document.documentElement.dataset.theme='dark'`)
await check('DUP-12', 'the page does not scroll sideways at desktop width', !(await hasSideScroll()))
const reviewTotal = Number(labels[0].match(/\((\d+)\)/)[1])
let paged = 'one page only'
if (reviewTotal > 10) {
  const onFirst = (await cards()).length; await t.click('Next'); await sleep(400)
  const onSecond = (await cards()).length; await t.click('Previous'); await sleep(400)
  paged = `${onFirst} then ${onSecond} of ${reviewTotal}`
  await check('DUP-12b', 'with more than 10 pairs To review pages: 10 on the first, the rest on the second, and Previous returns', onFirst === 10 && onSecond === Math.min(10, reviewTotal - 10) && (await cards()).length === 10, paged)
} else console.log(`INFO  only ${reviewTotal} pairs to review, so paging is not exercised in this run`)

// ── An exact match: already confirmed, and no way to dismiss it ───────────
await filter('Confirmed'); await sleep(500)
list = await cards()
const exactCard = list.find(c => /The same file/.test(c.text))
await check('DUP-13', 'the exact match is under Confirmed, marked "Same photo", 100% alike', Boolean(exactCard) && /Same photo/.test(exactCard.text) && /100% alike/.test(exactCard.text), exactCard?.text.slice(0, 160))
await check('DUP-14', 'an exact match offers no "Not a duplicate" button, and says why', Boolean(exactCard) && !exactCard.buttons.some(b => b.text === 'Not a duplicate') && /identical files/i.test(exactCard.text), JSON.stringify(exactCard?.buttons))
await check('DUP-15', 'the exact match is not under To review', !(await (async () => { await filter('To review'); await sleep(300); return (await cards()).some(c => /The same file/.test(c.text)) })()))

// ── Dismiss a suspected pair; confirm another; both survive a reload ───────
await open()
list = await cards()
const dismissId = list[0].id, confirmId = list[1].id
await press(0, 'Not a duplicate'); await sleep(1500)
list = await cards()
const dismissed = list.find(c => c.id === dismissId)
await check('DUP-16', 'after "Not a duplicate" the card stays where it is, now marked "Not a duplicate", and says what happened', Boolean(dismissed) && /Not a duplicate/.test(dismissed.text) && /Marked as not a duplicate\. Nothing was changed/.test(dismissed.text), dismissed?.text.slice(0, 220))
await check('DUP-17', 'the dismissed card shows that choice as pressed and offers no trash step', Boolean(dismissed) && dismissed.buttons.find(b => b.text === 'Not a duplicate')?.disabled === true && !/Move one copy/.test(dismissed.text))
await press(1, 'Same photo'); await sleep(1500)
list = await cards()
const confirmed = list.find(c => c.id === confirmId)
await check('DUP-18', 'after "Same photo" the card is marked "Same photo", says nothing was deleted, and offers the trash step', Boolean(confirmed) && /Marked as the same photo\. Nothing was deleted or moved/.test(confirmed.text) && /Move one copy to trash/.test(confirmed.text), confirmed?.text.slice(0, 240))
await t.shot('duplicates-decided-cards')
const stillThere = (await mine('/api/images/?page=1&page_size=50')).json
await check('DUP-19', 'deciding deleted and trashed nothing: all six photos are still in My Images', (stillThere?.count ?? stillThere?.results?.length ?? 0) === 6, `count ${stillThere?.count}`)
await open()
list = await cards()
await check('DUP-20', 'after a reload both decisions are gone from To review (they were saved by the server)', !list.some(c => c.id === dismissId || c.id === confirmId), `${list.length} cards`)
await filter('Confirmed'); await sleep(500)
await check('DUP-21', 'after a reload the confirmed pair is under Confirmed', (await cards()).some(c => c.id === confirmId && /Same photo/.test(c.text)))
await filter('Not duplicates'); await sleep(2500)
list = await cards()
await check('DUP-22', 'after a reload the dismissed pair is under Not duplicates, straight from the server\'s list (no wider search)', list.some(c => c.id === dismissId && /Not a duplicate/.test(c.text)), `${list.length} cards`)
await check('DUP-23', 'the page reads the server\'s list of matches (filtered by decision), never one request per photo and never the duplicate checks', onPage.some(u => u.includes('review_status=not_duplicate')) && !onPage.some(u => /duplicates\/(images|results)\//.test(u)), onPage.length + ' requests: ' + [...new Set(onPage.map(u => u.replace(/^.*duplicates\//, '').replace(/page=\d+&/, '')))].join(' | '))
await press(list.findIndex(c => c.id === dismissId), 'Same photo'); await sleep(1500)
const confirmedNearPairs = (await Promise.all(Object.values(ids).map(matchesOf))).flat().filter(m => m.review_status === 'confirmed' && m.match_type !== 'exact')
await check('DUP-24', 'a person can change their mind: the pair that was dismissed can be marked "Same photo", and the server has both near pairs confirmed', confirmedNearPairs.length >= 2 && /Same photo/.test(((await cards()).find(c => c.id === dismissId)?.text) ?? ''), `${new Set(confirmedNearPairs.map(m => m.id)).size} confirmed near pairs`)

// ── The photo page's notice ───────────────────────────────────────────────
await t.go(`/dashboard/images/${ids['dup-base.png']}`, 4500)
const noticeText = await t.ev(`[...document.querySelectorAll('div')].filter(d => /looks like another one|look-alikes/i.test(d.innerText) && d.className.includes('rounded-3xl')).map(d => d.innerText.replace(/\\s+/g,' ')).pop() ?? ''`)
await check('DUP-25', 'the photo page notice shows each match with its decision and the words fixed', /Same photo|To review|Not a duplicate/.test(noticeText) && /(Almost the same photo|The same face|The same file)/.test(noticeText) && !/perceptual|face_region/i.test(noticeText), noticeText.slice(0, 220))
await check('DUP-26', 'the notice links to the Duplicates page', await t.ev(`!!document.querySelector('a[href="/dashboard/duplicates"]')`))
await t.go(`/dashboard/images/${ids['dup-copy.png']}`, 4500)
const ownName = 'dup-copy.png'
const noticeLinks = await t.ev(`[...document.querySelectorAll('a[href^="/dashboard/images/"]')].map(a => ({ href: a.getAttribute('href'), text: a.textContent.trim() }))`)
await check('DUP-27', "on the other photo of a pair the notice names the OTHER photo (it used to name the photo itself)", noticeLinks.every(l => l.text !== ownName || l.href !== `/dashboard/images/${ids[ownName]}`) && noticeLinks.some(l => l.text === 'dup-base.png' && l.href === `/dashboard/images/${ids['dup-base.png']}`), JSON.stringify(noticeLinks.slice(0, 5)))

// ── "Look for duplicates again" keeps the decisions ────────────────────────
const keep = confirmedNearPairs[0]
const decidedOn = async image => (await matchesOf(image)).filter(m => m.review_status !== 'suspected').map(m => `${m.id}:${m.review_status}`).sort().join(',')
const beforeAgain = await decidedOn(keep.source_image)
await t.go(`/dashboard/images/${keep.source_image}`, 4500)
await check('DUP-27b', 'the button says it keeps the decisions (its tooltip)', /keep your decision/.test(await t.ev(`[...document.querySelectorAll('button')].find(b=>/Look for duplicates again/.test(b.textContent))?.title ?? ''`)))
await t.click('Look for duplicates again'); await sleep(9000)
const afterAgain = await decidedOn(keep.source_image)
await check('DUP-27c', 'after it ran again every confirmed / dismissed decision on that photo is still there, with the same ids', beforeAgain.length > 0 && beforeAgain === afterAgain && /keep your decision/.test(await t.text()), `${beforeAgain} -> ${afterAgain}`)

// ── The optional second step: move one copy to the trash ──────────────────
await open(); await filter('Confirmed'); await sleep(500)
list = await cards()
const trashIndex = list.findIndex(c => /The same file/.test(c.text))
const exactId = list[trashIndex].id
await press(trashIndex, 'Move one copy to trash'); await sleep(700)
const dialog = await t.ev(`(()=>{const d=document.querySelector('[role=alertdialog]');return d?{text:d.innerText.replace(/\\s+/g,' '),radios:d.querySelectorAll('input[type=radio]').length,confirmDisabled:[...d.querySelectorAll('button')].find(b=>/Move to trash/.test(b.textContent))?.disabled}:null})()`)
await check('DUP-28', 'the trash step asks which copy, with nothing chosen and the confirm button off', Boolean(dialog) && dialog.radios === 2 && dialog.confirmDisabled === true && /put the copy back from the Trash/.test(dialog.text), JSON.stringify(dialog)?.slice(0, 220))
await t.click('Cancel'); await sleep(500)
const trashBefore = (await mine('/api/images/trash/?page=1')).json
await check('DUP-29', 'cancelling moved nothing to the trash', (trashBefore?.count ?? trashBefore?.results?.length ?? 0) === 0, `trash ${trashBefore?.count}`)
await press(trashIndex, 'Move one copy to trash'); await sleep(500)
await t.ev(`document.querySelectorAll('[role=alertdialog] input[type=radio]')[0].click()`); await sleep(300)
await t.ev(`[...document.querySelectorAll('[role=alertdialog] button')].find(b=>/Move to trash/.test(b.textContent)).click()`); await sleep(1500)
const notice = await t.ev(`document.querySelector('[role=status]')?.innerText ?? ''`)
await sleep(5500)
const trashAfter = (await mine('/api/images/trash/?page=1')).json
await check('DUP-30', 'confirming moved exactly the chosen copy to the trash', (trashAfter?.count ?? trashAfter?.results?.length ?? 0) === 1, `trash ${trashAfter?.count}`)
list = await cards()
await check('DUP-31', 'the page said what happened, and the pair is gone from the list (the server leaves out pairs with a trashed photo)', /in the trash/.test(notice) && !list.some(c => c.id === exactId), `${notice} | ${list.length} cards`)

// ── Error, partial-failure and phone states ───────────────────────────────
// A failed request: the whole list, then one photo's matches. One listener decides for every paused request.
let failing = null
t.on('Fetch.requestPaused', async p => { if (failing?.(p.request.url)) await t.rpc('Fetch.failRequest', { requestId: p.requestId, errorReason: 'Failed' }); else await t.rpc('Fetch.continueRequest', { requestId: p.requestId }) })
await t.rpc('Fetch.enable', { patterns: [{ urlPattern: '*duplicates/*', requestStage: 'Request' }] })
failing = url => url.includes('duplicates/matches')
await open(3500)
const errorText = await t.text()
await check('DUP-32', 'when the server cannot be reached the page says so and offers Try again', /could not reach the server/i.test(errorText) && /Try again/.test(errorText), errorText.slice(0, 160))
failing = null
await t.click('Try again'); await sleep(6000)
await check('DUP-33', 'Try again brings the list back', (await cards()).length > 0)
failing = url => /duplicates\/matches\/\?page=1&page_size=1&/.test(url)
await open(7000)
const chips = await filterLabels()
await check('DUP-34', 'when only the counts cannot be read the list is still shown, and the page shows no zeros in their place', (await cards()).length > 0 && chips.every(label => !/\(\d+\)/.test(label)) && !/0 to review/.test(await t.text()), chips.join(' | '))
failing = null
await t.rpc('Fetch.disable')

await t.resize(390, 900)
await open(7000)
await check('DUP-35', '390 px: the cards and filters do not scroll sideways, and the current library tab is scrolled into view', !(await hasSideScroll()) && await t.ev(`(()=>{const n=document.querySelector('nav[aria-label="Photo library"]');const c=n.querySelector('[aria-current=page]').getBoundingClientRect();const b=n.getBoundingClientRect();return c.left>=b.left-1&&c.right<=b.right+1})()`))
await t.shot('duplicates-review-390')
await t.ev(`document.documentElement.dataset.theme='light'`); await sleep(300); await t.shot('duplicates-review-390-light')
await t.ev(`document.documentElement.dataset.theme='dark'`)
await filter('Confirmed'); await sleep(400)
await press(0, 'Move one copy to trash'); await sleep(500)
await check('DUP-36', '390 px: the trash dialog fits', !(await hasSideScroll()))
await t.shot('duplicates-trash-dialog-390')
await t.click('Cancel'); await sleep(300)

// A person with no matches. Same tab: the browser keeps one stored session per portal, so a second tab would swap it.
await t.wipe(); await t.login('user', 'member@qa.test'); await t.go('/dashboard/duplicates', 5000)
await check('DUP-37', 'a person with no matches sees "Nothing to review"', /Nothing to review/.test(await t.text()))
await filter('Confirmed'); await sleep(300)
await check('DUP-38', 'and "No pairs confirmed yet" under Confirmed', /No pairs confirmed yet/.test(await t.text()))
await filter('Not duplicates'); await sleep(2500)
await check('DUP-39', 'and "No dismissed pairs" under Not duplicates', /No dismissed pairs/.test(await t.text()))
await t.shot('duplicates-empty-390')
await check('DUP-40', 'no uncaught exceptions on the page during the whole run', t.issues.exceptions.length === 0, t.issues.exceptions.join(' | '))

const f = summary(); process.exit(f.length ? 1 : 0)
