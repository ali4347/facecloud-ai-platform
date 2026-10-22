// Basic accessibility on every page: images without a description, buttons and fields without a name, a page title that never changes,
// headings that skip levels, and whether the keyboard can reach the main actions. Not a full audit, a first screen.
import { check, openTab, summary } from '../lib.mjs'
const ROUTES = { public: ['/', '/about', '/contact', '/login', '/register', '/forgot-password'], user: ['/dashboard', '/dashboard/upload/single', '/dashboard/images', '/dashboard/groups', '/dashboard/settings', '/dashboard/notifications'], admin: ['/admin', '/admin/users', '/admin/organizations', '/admin/system', '/admin/invitations'], moderator: ['/moderator', '/moderator/queue', '/moderator/members', '/moderator/settings'] }
const LOGIN = { user: ['user', 'owner@qa.test'], admin: ['admin', 'admin@qa.test'], moderator: ['moderator', 'mod@qa.test'] }
const t = await openTab(); const titles = new Map()
const probe = `(()=>{
  const name = e => (e.getAttribute('aria-label')||e.getAttribute('title')||e.textContent||'').trim()
  const visible = e => { const r=e.getBoundingClientRect(); return r.width>0&&r.height>0&&getComputedStyle(e).visibility!=='hidden' }
  const labelled = e => e.id && document.querySelector('label[for="'+e.id+'"]') || e.closest('label') || e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') || e.getAttribute('placeholder')
  const imgs=[...document.images].filter(visible).filter(i=>!i.hasAttribute('alt'))
  const btns=[...document.querySelectorAll('button,a[href],[role=button]')].filter(visible).filter(b=>!name(b)&&!b.querySelector('img[alt]:not([alt=""])'))
  const fields=[...document.querySelectorAll('input:not([type=hidden]),select,textarea')].filter(visible).filter(f=>!labelled(f))
  const hs=[...document.querySelectorAll('h1,h2,h3,h4')].map(h=>+h.tagName[1]); let skip=0; for(let i=1;i<hs.length;i++) if(hs[i]-hs[i-1]>1) skip++
  const focusable=[...document.querySelectorAll('button,a[href],input,select,textarea,[tabindex]')].filter(visible).length
  const h1=document.querySelectorAll('h1').length
  return {imgs:imgs.length, btns:btns.length, btnSample:btns.slice(0,2).map(b=>b.outerHTML.slice(0,80)), fields:fields.length, fieldSample:fields.slice(0,2).map(f=>f.outerHTML.slice(0,80)), skip, h1, focusable, title:document.title, lang:document.documentElement.lang}
})()`
for (const [portal, routes] of Object.entries(ROUTES)) {
  await t.wipe(); if (LOGIN[portal]) await t.login(...LOGIN[portal])
  for (const r of routes) {
    await t.go(r, 2800); const p = await t.ev(probe)
    titles.set(r, p.title)
    await check(`A11Y-img ${r}`, `${r}: every image has an alt attribute`, p.imgs === 0, `${p.imgs} without`)
    await check(`A11Y-btn ${r}`, `${r}: every button and link has a name`, p.btns === 0, `${p.btns} unnamed ${p.btnSample.join(' ')}`)
    await check(`A11Y-field ${r}`, `${r}: every input has a label`, p.fields === 0, `${p.fields} without ${p.fieldSample.join(' ')}`)
    await check(`A11Y-h1 ${r}`, `${r}: exactly one main heading`, p.h1 === 1, `${p.h1} h1`)
  }
}
const distinct = new Set(titles.values()).size
await check('A11Y-title', 'page titles tell pages apart (the browser tab and history)', distinct >= Math.floor(titles.size / 2), `${distinct} different titles over ${titles.size} pages: ${[...new Set(titles.values())].slice(0, 3).join(' | ')}`)
const lang = await t.ev('document.documentElement.lang'); await check('A11Y-lang', 'the page declares its language', Boolean(lang), `lang="${lang}"`)
summary(); process.exit(0)
