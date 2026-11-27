// npm run test:build-safety  (node --test scripts/build-safety.test.mjs; Node 22 needs the file named)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { PRODUCTION_API_URL, checkBundleCode, checkProductionEnv, isProductionBuild } from './build-safety.mjs'

test('only real production builds are checked; dev and demo stay free', () => {
  assert.equal(isProductionBuild('build', 'production'), true)
  assert.equal(isProductionBuild('build', 'staging'), true)
  assert.equal(isProductionBuild('build', 'demo'), false)
  assert.equal(isProductionBuild('build', 'development'), false)
  assert.equal(isProductionBuild('serve', 'production'), false)
})

test('the production settings pass', () => {
  assert.deepEqual(checkProductionEnv({ VITE_USE_API: 'true', VITE_API_URL: PRODUCTION_API_URL }), [])
  assert.deepEqual(checkProductionEnv({ VITE_USE_API: 'TRUE', VITE_API_URL: `${PRODUCTION_API_URL}/` }), [])
})

test('missing or demo settings fail', () => {
  assert.equal(checkProductionEnv({}).length, 2)
  assert.match(checkProductionEnv({ VITE_USE_API: 'false', VITE_API_URL: PRODUCTION_API_URL })[0], /VITE_USE_API is "false"/)
  assert.match(checkProductionEnv({ VITE_USE_API: 'true', VITE_API_URL: '  ' })[0], /VITE_API_URL is empty/)
})

test('any other API address fails, including a local one', () => {
  assert.match(checkProductionEnv({ VITE_USE_API: 'true', VITE_API_URL: 'http://127.0.0.1:8000' })[0], /must use https:\/\/api\.facecloudai\.com/)
  assert.match(checkProductionEnv({ VITE_USE_API: 'true', VITE_API_URL: 'http://api.facecloudai.com' })[0], /must use/)
  assert.match(checkProductionEnv({ VITE_USE_API: 'true', VITE_API_URL: 'https://api.facecloudai.pro' })[0], /must use/)
})

test('the bundle must name the live API and no local one', () => {
  assert.deepEqual(checkBundleCode(`const a="${PRODUCTION_API_URL}";`), [])
  assert.match(checkBundleCode('const a="";')[0], /demo mode/)
  const local = checkBundleCode(`const a="${PRODUCTION_API_URL}";const b="http://localhost:5173/x";const c="http://127.0.0.1:8000"`)
  assert.equal(local.length, 1)
  assert.match(local[0], /localhost:5173.*127\.0\.0\.1:8000/)
})

test('a library\'s placeholder "http://localhost" (no port) is not an API address', () => {
  assert.deepEqual(checkBundleCode(`const a="${PRODUCTION_API_URL}";var u=new URL("http://localhost");`), [])
  assert.equal(checkBundleCode(`const a="${PRODUCTION_API_URL}";const b="http://127.0.0.1"`).length, 1)
})
