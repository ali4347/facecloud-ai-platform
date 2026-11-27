import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { PUBLIC_PAGES, canonicalUrl, type PageSeo } from './src/lib/seoPages.ts'
import { PAGE_JSONLD_ID, pageStructuredData } from './src/lib/structuredData.ts'
import { checkBundleCode, checkProductionEnv, describeProblems, isProductionBuild } from './scripts/build-safety.mjs'

const escapeAttr = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Replaces exactly one match, so a renamed tag in index.html fails the build instead of shipping stale SEO. */
function replaceOnce(html: string, pattern: RegExp, replacement: string, what: string): string {
  const matches = html.match(new RegExp(pattern.source, 'g'))
  if (!matches || matches.length !== 1) {
    throw new Error(`[seo-pages] expected exactly one ${what} in index.html, found ${matches?.length ?? 0}`)
  }
  return html.replace(pattern, () => replacement)
}

function pageHtml(shell: string, page: PageSeo): string {
  const title = escapeAttr(page.title)
  const description = escapeAttr(page.description)
  const url = canonicalUrl(page.path)
  let html = shell
  html = replaceOnce(html, /<title>[^<]*<\/title>/, `<title>${title}</title>`, '<title>')
  html = replaceOnce(html, /<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${description}" />`, 'meta description')
  html = replaceOnce(html, /<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${url}" />`, 'canonical link')
  html = replaceOnce(html, /<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${title}" />`, 'og:title')
  html = replaceOnce(html, /<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${description}" />`, 'og:description')
  html = replaceOnce(html, /<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${url}" />`, 'og:url')
  html = replaceOnce(html, /<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${title}" />`, 'twitter:title')
  html = replaceOnce(html, /<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${description}" />`, 'twitter:description')

  // The page's own structured data (breadcrumb, page type, FAQ, people...); "<" is escaped so no text can close the script tag.
  const jsonLd = JSON.stringify(pageStructuredData(page)).replace(/</g, '\\u003c')
  html = replaceOnce(html, /<\/head>/, `  <script type="application/ld+json" id="${PAGE_JSONLD_ID}">${jsonLd}</script>\n  </head>`, '</head>')
  return html
}

/**
 * After the build, writes one HTML file per public page (see src/lib/seoPages.ts):
 * the home page into dist/index.html, every other page into dist/_seo/<path>.html.
 * public/.htaccess serves those files for their routes, so the first response
 * already carries the page's own title, description, canonical, social tags and structured data.
 * The app inside is the same bundle; RouteSeo keeps the tags right while browsing.
 */
function seoPages(): Plugin {
  let outDir = 'dist'
  return {
    name: 'facecloud-seo-pages',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      const shellPath = path.join(outDir, 'index.html')
      // No page was written when the build stopped with an error; let that error be the one that is reported.
      if (!fs.existsSync(shellPath)) return
      const shell = fs.readFileSync(shellPath, 'utf8')
      for (const page of PUBLIC_PAGES) {
        const file = page.path === '/' ? shellPath : path.join(outDir, '_seo', `${page.path.slice(1)}.html`)
        fs.mkdirSync(path.dirname(file), { recursive: true })
        fs.writeFileSync(file, pageHtml(shell, page))
      }
    },
  }
}

/**
 * A production build must talk to the live API. Without VITE_USE_API=true and VITE_API_URL the app silently runs on its demo
 * data (src/lib/api/config.ts), and such a bundle was once deployed. So `vite build` in production mode (the default mode of
 * `npm run build`) stops before building when the settings are not the live ones, and stops before writing when the bundle
 * it produced does not contain the live API address or contains a local one. Rules: scripts/build-safety.mjs.
 * `npm run dev`, `npm run build:demo` (mode "demo") and `npm run build:local` (mode "development") are not checked.
 */
function productionSafety(): Plugin {
  let checking = false
  return {
    name: 'facecloud-production-safety',
    apply: 'build',
    config(config, { command, mode }) {
      if (!isProductionBuild(command, mode)) return
      checking = true
      // loadEnv gives variables already set in the environment priority over the .env files, exactly as the build will.
      const env = loadEnv(mode, config.envDir || config.root || process.cwd(), 'VITE_')
      const problems = checkProductionEnv(env)
      if (problems.length) throw new Error(describeProblems(`Refusing to build for production (mode "${mode}"):`, problems))
    },
    generateBundle(_options, bundle) {
      if (!checking) return
      const code = Object.values(bundle).map(file => (file.type === 'chunk' ? file.code : '')).join('\n')
      const problems = checkBundleCode(code)
      if (problems.length) this.error(describeProblems('The production bundle is not safe to deploy:', problems))
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [productionSafety(), react(), seoPages()],
})
