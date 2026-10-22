// Rate limits that ordinary use, or a rehearsal, could run into. Run it LAST: it uses up an hourly allowance on purpose.
import { api, apiLogin, check, summary } from '../lib.mjs'
const admin = (await apiLogin('admin@qa.test')).token

// The administrator's organization list is read every time Organizations, Moderators, Invitations or the Users form opens.
let first429 = 0
for (let i = 1; i <= 45; i++) { const r = await api('/api/organizations/admin/', admin); if (r.status === 429) { first429 = i; break } }
await check('LIM-01', 'the administrator can open the organization list 45 times in an hour (rehearsal)', first429 === 0, first429 ? `refused with 429 at read number ${first429}` : 'no refusal')

// A different admin endpoint, for comparison: the general allowance is far larger
let other = 0
for (let i = 1; i <= 45; i++) { const r = await api('/api/system/queue/', admin); if (r.status === 429) { other = i; break } }
await check('LIM-02', 'an ordinary admin read (queue status) is not limited at 45 an hour', other === 0, other ? `429 at ${other}` : 'no refusal')

// The 429 answer itself must be readable by the person
const limited = await api('/api/organizations/admin/', admin)
if (limited.status === 429) await check('LIM-03', 'a refused request says when to try again, in a sentence', /(throttled|too many|try again|available in)/i.test(JSON.stringify(limited.json)), JSON.stringify(limited.json).slice(0, 120))
summary(); process.exit(0)
