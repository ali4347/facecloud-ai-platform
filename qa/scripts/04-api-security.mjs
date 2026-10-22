// Who may call what, other teams' data, odd input, and hostile uploads. Direct API calls against the QA stack (no screen).
import fs from 'node:fs/promises'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { API, OUT, api, apiLogin, check, summary } from '../lib.mjs'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const photo = await fs.readFile(path.join(root, 'public', 'demo', 'facecloud-enhancement-demo-original.jpg'))
const T = {}
for (const who of ['admin', 'owner', 'mod', 'member', 'owner2', 'mod2', 'member2', 'plain']) T[who] = (await apiLogin(`${who}@qa.test`)).token
const ids = {}
for (const org of (await api('/api/organizations/admin/', T.admin)).json) ids[org.name] = org.id
const A = ids['QA Team'], B = ids['Other Team']
await check('SEC-00', 'test data: both teams exist', Boolean(A && B), JSON.stringify(ids))
const isJson = r => /json/.test(r.type)
const clean = (r, label) => r.status < 500 && (r.status === 204 || isJson(r) || r.status === 301)

// 1. signed out
for (const p of ['/api/user/profile/', '/api/images/', '/api/notifications/', '/api/system/health/', '/api/organizations/admin/', `/api/organizations/${A}/members/`, '/api/reports/', '/api/identities/groups/']) {
  const r = await api(p); await check(`SEC-01 ${p}`, `signed out: ${p} answers 401 as JSON`, r.status === 401 && isJson(r), `${r.status} ${r.type}`)
}
// 2. an invalid or tampered token
for (const [label, token] of [['garbage', 'abc.def.ghi'], ['truncated', T.owner.slice(0, -6)], ['wrong signature', T.owner.split('.').slice(0, 2).join('.') + '.AAAAAAAAAAAAAAAAAAAA']]) {
  const r = await api('/api/user/profile/', token); await check(`SEC-02 ${label}`, `a ${label} token is refused with 401`, r.status === 401 && isJson(r), `${r.status} ${r.type}`)
}
// 3. role gates: administrator-only endpoints
for (const who of ['member', 'owner', 'mod', 'plain']) for (const p of ['/api/system/health/', '/api/system/analytics/', '/api/system/batches/failed/', '/api/system/moderation/', '/api/organizations/admin/', '/api/user/admin/users/', '/api/user/admin/invitations/']) {
  const r = await api(p, T[who]); await check(`SEC-03 ${who} ${p}`, `${who} cannot use the administrator endpoint ${p}`, r.status === 403 && isJson(r), `${r.status}`)
}
// 4. another team's data: 404, never the data and never a 500
const theirs = [`/api/organizations/${B}/members/`, `/api/organizations/${B}/audit/`, `/api/organizations/${B}/moderator/dashboard/`, `/api/organizations/${B}/moderator/reviews/`, `/api/organizations/${B}/moderator/batches/`, `/api/organizations/${B}/invitations/`]
for (const who of ['owner', 'mod', 'member']) for (const p of theirs) {
  const r = await api(p, T[who]); await check(`SEC-04 ${who} ${p.replace(/\d+/, 'B')}`, `${who} of one team gets 404 for the other team's ${p.split('/').slice(-2)[0]}`, r.status === 404 && isJson(r), `${r.status}`)
}
for (const [who, p, body] of [['owner', `/api/organizations/${B}/`, { name: 'Hijacked' }], ['owner2', `/api/organizations/${A}/`, { name: 'Hijacked' }], ['mod', `/api/organizations/${A}/`, { name: 'Hijacked' }], ['member', `/api/organizations/${A}/`, { name: 'Hijacked' }]]) {
  const r = await api(p, T[who], { method: 'PATCH', body: JSON.stringify(body) }); await check(`SEC-05 ${who}`, `${who} cannot rename ${p.includes(B) ? 'the other' : 'this'} team (${who === 'owner2' ? 'foreign' : who === 'owner' ? 'foreign' : 'not owner'})`, [403, 404].includes(r.status), `${r.status}`)
}
const after = await api(`/api/organizations/${A}/`, T.owner); await check('SEC-06', 'the team name is unchanged after those attempts', after.json?.name === 'QA Team', after.json?.name)
// 5. role escalation: a moderator promoting a member (a gap noted in the work log) and inviting a moderator
const members = (await api(`/api/organizations/${A}/members/`, T.mod)).json; const memberRow = (Array.isArray(members) ? members : members.results || []).find(m => m.user?.username === 'member')
if (memberRow) { const r = await api(`/api/organizations/${A}/members/${memberRow.id}/`, T.mod, { method: 'PATCH', body: JSON.stringify({ role: 'moderator' }) }); await check('SEC-07', 'a moderator cannot promote a member to moderator', [400, 403].includes(r.status), `${r.status} ${JSON.stringify(r.json).slice(0, 80)}`); if (r.status === 200) await api(`/api/organizations/${A}/members/${memberRow.id}/`, T.owner, { method: 'PATCH', body: JSON.stringify({ role: 'member' }) }) }
const inv = await api(`/api/organizations/${A}/invitations/`, T.mod, { method: 'POST', body: JSON.stringify({ email: 'x@qa.test', role: 'moderator' }) }); await check('SEC-08', 'a moderator cannot invite another moderator', [400, 403].includes(inv.status), `${inv.status}`)
const own = await api(`/api/organizations/${A}/members/`, T.member); await check('SEC-09', 'a plain member can list or is refused the team roster, never a 500', own.status < 500 && isJson(own), `${own.status}`)
// 6. odd input must never crash the server
const odd = [['/api/images/?page_size=100000', 'admin'], ['/api/images/?page=-1', 'owner'], ['/api/images/?page=abc', 'owner'], ['/api/images/?q=%27%20OR%201%3D1%20--', 'owner'], ['/api/images/99999999/', 'owner'], ['/api/images/abc/', 'owner'], ['/api/user/admin/users/?q=%25&page_size=1000', 'admin'], ['/api/system/audit/?page_size=99999&q=<script>alert(1)</script>', 'admin'], ['/api/system/moderation/?stale_hours=-5', 'admin'], ['/api/system/moderation/?stale_hours=abc', 'admin'], ['/api/system/analytics/?date_from=not-a-date', 'admin'], ['/api/identities/groups/0/', 'owner'], ['/api/notifications/?page=0', 'owner']]
for (const [p, who] of odd) { const r = await api(p, T[who]); await check(`SEC-10 ${p}`, `odd input ${p} does not crash (got ${r.status})`, clean(r), `${r.status} ${r.type}`) }
const big = await api('/api/auth/login/', null, { method: 'POST', body: JSON.stringify({ identifier: 'a'.repeat(300000), password: 'x' }) }); await check('SEC-11', 'a 300 KB login body is refused cleanly', big.status < 500 && isJson(big), `${big.status}`)
const bad = await api('/api/auth/login/', null, { method: 'POST', body: '{broken json' }); await check('SEC-12', 'broken JSON gets a 400', bad.status === 400 && isJson(bad), `${bad.status}`)
// 7. uploads
const upload = async (token, parts, fields = {}, endpoint = 'single') => { const f = new FormData(); for (const [k, v] of Object.entries(fields)) f.append(k, v); for (const [name, blob, filename] of parts) f.append(name, blob, filename); const r = await fetch(`${API}/api/images/upload/${endpoint}/`, { method: 'POST', headers: { authorization: 'Bearer ' + token }, body: f }); const text = await r.text(); let json = null; try { json = JSON.parse(text) } catch { /* html */ } return { status: r.status, json, type: r.headers.get('content-type') || '', text } }
const jpg = new Blob([photo], { type: 'image/jpeg' })
const good = await upload(T.owner, [['file', jpg, 'ok.jpg']]); await check('UP-01', 'a normal photo is accepted', good.status === 201 && good.json?.accepted_files === 1, `${good.status}`)
const cases = [
  ['text file named .jpg', [['file', new Blob(['this is not an image'], { type: 'image/jpeg' }), 'fake.jpg']]],
  ['empty file', [['file', new Blob([], { type: 'image/jpeg' }), 'empty.jpg']]],
  ['SVG', [['file', new Blob(['<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'], { type: 'image/svg+xml' }), 'x.svg']]],
  ['executable', [['file', new Blob(['MZ'], { type: 'application/octet-stream' }), 'run.exe']]],
  ['JPEG header, garbage body', [['file', new Blob([photo.subarray(0, 600)], { type: 'image/jpeg' }), 'cut.jpg']]],
]
for (const [label, parts] of cases) { const r = await upload(T.owner, parts); const rejected = r.status >= 400 || (r.json && (r.json.accepted_files === 0 || r.json.rejected_files >= 1)); await check(`UP-02 ${label}`, `upload: ${label} is rejected cleanly (got ${r.status})`, r.status < 500 && rejected && (isJson(r)), `${r.status} ${JSON.stringify(r.json?.rejected_files ?? r.json).slice(0, 80)}`) }
// a valid photo with a hostile file name is accepted, but the stored name must be clean
for (const [label, name, test] of [['a path in the name', '../../etc/passwd.jpg', n => !/[\\/]|\.\./.test(n)], ['a 300-character name', 'a'.repeat(300) + '.jpg', n => n.length <= 255], ['a right-to-left override character', 'photo‮gpj.jpg', n => !/[‪-‮⁦-⁩]/.test(n)], ['a control character', 'a\u0000b\u001f.jpg', n => !/[\u0000-\u001f]/.test(n)]]) {
  const r = await upload(T.owner, [['file', jpg, name]]); const id = r.json?.id
  const list = (await api('/api/images/?page_size=100', T.owner)).json; const rows = Array.isArray(list) ? list : list.results || []
  const stored = rows.filter(x => x.batch === id).map(x => x.original_name)[0] ?? ''
  await check(`UP-02 name: ${label}`, `${label}: the photo is accepted and the stored name is clean`, r.status === 201 && stored !== '' && test(stored), `${r.status} stored as ${JSON.stringify(stored).slice(0, 60)}`)
}
const noField = await upload(T.owner, []); await check('UP-03', 'upload with no file answers 400', noField.status === 400 && isJson(noField), `${noField.status}`)
const foreignTeam = await upload(T.plain, [['file', jpg, 'ok.jpg']], { organization_id: A }); await check('UP-04', 'a user who is not in a team cannot submit to it', foreignTeam.status >= 400 && foreignTeam.status < 500 && !(foreignTeam.json?.accepted_files > 0), `${foreignTeam.status}`)
const otherTeam = await upload(T.owner, [['file', jpg, 'ok.jpg']], { organization_id: B }); await check('UP-05', 'a team member cannot submit to another team', otherTeam.status >= 400 && otherTeam.status < 500 && !(otherTeam.json?.accepted_files > 0), `${otherTeam.status}`)
const badOrg = await upload(T.owner, [['file', jpg, 'ok.jpg']], { organization_id: 'abc' }); await check('UP-06', 'organization_id that is not a number gives a 400, not a 500', badOrg.status >= 400 && badOrg.status < 500, `${badOrg.status}`)
// ZIPs
await fs.mkdir(OUT, { recursive: true }); const tmp = path.join(OUT, 'zip-work'); await fs.rm(tmp, { recursive: true, force: true }); await fs.mkdir(tmp, { recursive: true })
await fs.writeFile(path.join(tmp, 'ok.jpg'), photo); await fs.writeFile(path.join(tmp, 'notes.txt'), 'hello')
const mk = (name, args) => { execFileSync('zip', ['-q', '-j', path.join(tmp, name), ...args]); return fs.readFile(path.join(tmp, name)) }
const zipOk = await mk('ok.zip', [path.join(tmp, 'ok.jpg'), path.join(tmp, 'notes.txt')])
const zr = await upload(T.owner, [['file', new Blob([zipOk], { type: 'application/zip' }), 'ok.zip']], {}, 'zip'); await check('ZIP-01', 'a ZIP with one photo and one text file: the photo is accepted and the text file rejected', zr.status === 201 && zr.json?.accepted_files === 1 && zr.json?.rejected_files === 1, `${zr.status} ${JSON.stringify([zr.json?.accepted_files, zr.json?.rejected_files])}`)
const notZip = await upload(T.owner, [['file', new Blob(['not a zip at all'], { type: 'application/zip' }), 'fake.zip']], {}, 'zip'); await check('ZIP-02', 'a file named .zip that is not a ZIP answers 400', notZip.status === 400 && isJson(notZip), `${notZip.status} ${JSON.stringify(notZip.json).slice(0, 90)}`)
// path traversal inside the archive: python builds an entry named ../../evil.jpg
const py = `import zipfile,sys\nz=zipfile.ZipFile(sys.argv[1],'w')\nz.writestr('../../evil.jpg',open(sys.argv[2],'rb').read())\nz.writestr('good.jpg',open(sys.argv[2],'rb').read())\nz.close()`
await fs.writeFile(path.join(tmp, 'mk.py'), py); execFileSync('python3', [path.join(tmp, 'mk.py'), path.join(tmp, 'trav.zip'), path.join(tmp, 'ok.jpg')])
const tz = await upload(T.owner, [['file', new Blob([await fs.readFile(path.join(tmp, 'trav.zip'))], { type: 'application/zip' }), 'trav.zip']], {}, 'zip'); await check('ZIP-03', 'a ZIP entry named ../../evil.jpg does not break out or crash', tz.status < 500 && isJson(tz), `${tz.status} ${JSON.stringify([tz.json?.accepted_files, tz.json?.rejected_files])}`)
const bomb = Buffer.alloc(60 * 1024 * 1024, 0); await fs.writeFile(path.join(tmp, 'zeros.jpg'), bomb); execFileSync('zip', ['-q', '-j', path.join(tmp, 'bomb.zip'), path.join(tmp, 'zeros.jpg')])
const bz = await upload(T.owner, [['file', new Blob([await fs.readFile(path.join(tmp, 'bomb.zip'))], { type: 'application/zip' }), 'bomb.zip']], {}, 'zip'); await check('ZIP-04', 'a highly compressed ZIP (60 MB of zeros in a few KB) is refused', bz.status === 400 || (bz.status === 201 && bz.json?.accepted_files === 0), `${bz.status} ${JSON.stringify(bz.json).slice(0, 100)}`)
await fs.rm(tmp, { recursive: true, force: true })
summary(); process.exit(0)
