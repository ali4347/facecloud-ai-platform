// Small helpers for the QA scripts: a headless Chrome tab driven over the DevTools protocol (no extra packages).
// Addresses come from the environment (qa/start-test-stack.sh prints them); the defaults are the QA stack's ports.
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const WEB = process.env.QA_WEB || 'http://localhost:5240'
export const API = process.env.QA_API || 'http://127.0.0.1:8840'
export const CDP = process.env.QA_CDP || 'http://127.0.0.1:9410'
export const PASSWORD = 'Qa-Pass-Phrase-2026!'
export const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'out')
export const sleep = ms => new Promise(r => setTimeout(r, ms))
export const J = JSON.stringify

const results = []
/** One line per check. PASS/FAIL goes to the screen and to out/results.jsonl so the report can be built from it. */
export async function check(id, label, passed, detail = '') {
  const row = { id, label, passed: Boolean(passed), detail: String(detail).slice(0, 300) }
  results.push(row); console.log((row.passed ? 'PASS' : 'FAIL') + '  ' + id + '  ' + label + (detail ? '  — ' + row.detail : ''))
  await fs.mkdir(OUT, { recursive: true }); await fs.appendFile(path.join(OUT, 'results.jsonl'), J({ at: new Date().toISOString(), ...row }) + '\n')
}
export const summary = () => { const f = results.filter(r => !r.passed); console.log(`\n${results.length - f.length} passed, ${f.length} failed`); return f }

export async function openTab({ width = 1440, height = 900 } = {}) {
  const t = await (await fetch(`${CDP}/json/new?about:blank`, { method: 'PUT' })).json()
  const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise(r => (ws.onopen = r))
  let id = 1
  const issues = { console: [], exceptions: [], failed: [], http: [] }
  const waiting = new Map()
  const listeners = []
  ws.addEventListener('message', e => {
    const m = JSON.parse(e.data)
    if (m.id && waiting.has(m.id)) { waiting.get(m.id)(m.result); waiting.delete(m.id); return }
    for (const [name, fn] of listeners) if (name === m.method) fn(m.params)
    if (m.method === 'Runtime.exceptionThrown') issues.exceptions.push((m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text || '').slice(0, 200))
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') issues.console.push(m.params.args.map(a => a.value ?? a.description ?? '').join(' ').slice(0, 200))
    if (m.method === 'Network.responseReceived' && m.params.response.status >= 400) issues.http.push({ status: m.params.response.status, url: m.params.response.url.replace(/^https?:\/\/[^/]+/, '') })
    if (m.method === 'Network.loadingFailed' && !m.params.canceled) issues.failed.push({ error: m.params.errorText, id: m.params.requestId })
  })
  const rpc = (method, params = {}) => new Promise(res => { const my = id++; waiting.set(my, res); ws.send(J({ id: my, method, params })) })
  for (const d of ['Page', 'Runtime', 'DOM', 'Network']) await rpc(`${d}.enable`)
  await rpc('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 })
  const ev = async e => { const r = await rpc('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }); return r?.result?.value }
  const tab = {
    ev, rpc, issues,
    /** Listen to a DevTools event, e.g. `t.on('Fetch.requestPaused', params => …)`. */
    on: (name, fn) => { listeners.push([name, fn]) },
    resize: async (w, h) => rpc('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 600 }),
    clearIssues: () => { issues.console.length = issues.exceptions.length = issues.failed.length = issues.http.length = 0 },
    go: async (p, wait = 2500) => { await rpc('Page.navigate', { url: p.startsWith('http') ? p : WEB + p }); await sleep(wait) },
    path: () => ev('location.pathname'),
    text: () => ev(`document.body.innerText.replace(/\\s+/g,' ')`),
    type: (sel, v) => ev(`(()=>{const el=document.querySelector(${J(sel)});if(!el)return false;const proto=el.tagName==='TEXTAREA'?HTMLTextAreaElement:el.tagName==='SELECT'?HTMLSelectElement:HTMLInputElement;Object.getOwnPropertyDescriptor(proto.prototype,'value').set.call(el,${J(v)});el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}));return true})()`),
    click: (txt, scope = 'button,a') => ev(`(()=>{const e=[...document.querySelectorAll(${J(scope)})].find(b=>b.textContent.trim().includes(${J(txt)})&&!b.disabled&&b.getBoundingClientRect().width>0);if(e){e.click();return true}return false})()`),
    clickSel: s => ev(`(()=>{const e=document.querySelector(${J(s)});if(e&&!e.disabled){e.click();return true}return false})()`),
    exists: s => ev(`!!document.querySelector(${J(s)})`),
    setFile: async (selector, files) => { const doc = await rpc('DOM.getDocument'); const q = await rpc('DOM.querySelector', { nodeId: doc.root.nodeId, selector }); await rpc('DOM.setFileInputFiles', { files, nodeId: q.nodeId }) },
    shot: async name => { await fs.mkdir(OUT, { recursive: true }); const r = await rpc('Page.captureScreenshot', { format: 'png' }); await fs.writeFile(path.join(OUT, name + '.png'), Buffer.from(r.data, 'base64')) },
    /** Signs in through the real form. Returns the path the app ended on. */
    login: async (portal, email, pw = PASSWORD) => {
      const loginPath = { user: '/login', admin: '/admin/login', moderator: '/moderator/login' }[portal]
      await tab.go(loginPath, 1500); await tab.type('input[type=email]', email); await tab.type('input[type=password]', pw)
      await tab.ev(`document.querySelector('form button[type=submit]').click()`); await sleep(4500)
      return tab.path()
    },
    wipe: async () => { await tab.go('/login', 800); await tab.ev('localStorage.clear();sessionStorage.clear()') },
  }
  return tab
}

/** Direct API calls, for the checks that do not need a screen. */
export async function apiLogin(email, pw = PASSWORD) {
  const r = await fetch(API + '/api/auth/login/', { method: 'POST', headers: { 'content-type': 'application/json' }, body: J({ identifier: email, password: pw }) })
  const body = await r.json().catch(() => ({})); return { status: r.status, token: body.access, body }
}
export async function api(p, token, opts = {}) {
  const r = await fetch(API + p, { ...opts, headers: { ...(token ? { authorization: 'Bearer ' + token } : {}), 'content-type': 'application/json', ...(opts.headers || {}) } })
  const text = await r.text(); let json = null; try { json = JSON.parse(text) } catch { /* not JSON */ }
  return { status: r.status, json, text, type: r.headers.get('content-type') || '' }
}
