#!/usr/bin/env node
/**
 * Checks a finished build folder before it goes anywhere:
 *   node scripts/verify-bundle.mjs [dist]
 * Exits 1 (and says why) when the JavaScript does not talk to the live API or contains a local API address.
 * The production build already runs the same check; this is for CI and the deploy script, on the files themselves.
 */
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { PRODUCTION_API_URL, checkBundleCode, describeProblems } from './build-safety.mjs'

const dist = path.resolve(process.argv[2] ?? 'dist')
const assets = path.join(dist, 'assets')
let files
try {
  files = (await readdir(assets)).filter(name => name.endsWith('.js'))
} catch {
  console.error(`No ${assets} folder. Build first.`)
  process.exit(1)
}
if (files.length === 0) {
  console.error(`No JavaScript in ${assets}.`)
  process.exit(1)
}
const code = (await Promise.all(files.map(name => readFile(path.join(assets, name), 'utf8')))).join('\n')
const problems = checkBundleCode(code)
if (problems.length) {
  console.error(describeProblems(`This build in ${dist} must not be deployed:`, problems))
  process.exit(1)
}
console.log(`OK: ${files.length} JavaScript file(s) in ${path.relative(process.cwd(), assets) || assets} talk to ${PRODUCTION_API_URL} and contain no local API address.`)
