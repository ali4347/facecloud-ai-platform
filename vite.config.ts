import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { PUBLIC_PAGES, canonicalUrl, type PageSeo } from './src/lib/seoPages.ts'
import { PAGE_JSONLD_ID, pageStructuredData } from './src/lib/structuredData.ts'

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
      const shell = fs.readFileSync(shellPath, 'utf8')
      for (const page of PUBLIC_PAGES) {
        const file = page.path === '/' ? shellPath : path.join(outDir, '_seo', `${page.path.slice(1)}.html`)
        fs.mkdirSync(path.dirname(file), { recursive: true })
        fs.writeFileSync(file, pageHtml(shell, page))
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), seoPages()],
})
