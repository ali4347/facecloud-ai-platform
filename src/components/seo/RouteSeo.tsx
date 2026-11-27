import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { NOINDEX_PREFIXES, canonicalUrl, findPageSeo, normalizePath } from '../../lib/seoPages'
import { PAGE_JSONLD_ID, pageStructuredData } from '../../lib/structuredData'

/** Finds `<meta {attr}="{key}">` in the head, creating it when missing. */
function metaTag(attr: 'name' | 'property', key: string): HTMLMetaElement {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  return el
}

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  metaTag(attr, key).setAttribute('content', content)
}

function setCanonical(href: string | null) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (href === null) {
    el?.remove()
    return
  }
  if (!el) {
    el = document.createElement('link')
    el.rel = 'canonical'
    document.head.appendChild(el)
  }
  el.href = href
}

/** Swaps the page's structured data (the one script with PAGE_JSONLD_ID, which the pre-built HTML also carries). */
function setPageJsonLd(data: object | null) {
  document.getElementById(PAGE_JSONLD_ID)?.remove()
  if (!data) return
  const script = document.createElement('script')
  script.type = 'application/ld+json'
  script.id = PAGE_JSONLD_ID
  script.textContent = JSON.stringify(data)
  document.head.appendChild(script)
}

function isNoindex(path: string): boolean {
  return NOINDEX_PREFIXES.some(prefix => path === prefix || path.startsWith(`${prefix}/`))
}

/**
 * Keeps the head in step with the route: title, description, canonical, Open
 * Graph and Twitter tags and structured data for the public pages (from
 * `seoPages.ts` and `structuredData.ts`), and
 * `noindex` for the portals, e-mail-link pages and unknown paths.
 *
 * Placed before <Routes>, so its effect runs before the page's own: a private
 * page that names its tab with `useDocumentTitle` still wins the title.
 */
export function RouteSeo() {
  const { pathname } = useLocation()

  useEffect(() => {
    const path = normalizePath(pathname)
    const page = findPageSeo(path)

    if (page) {
      const url = canonicalUrl(page.path)
      document.title = page.title
      setMeta('name', 'description', page.description)
      setMeta('name', 'robots', 'index, follow')
      setCanonical(url)
      setMeta('property', 'og:title', page.title)
      setMeta('property', 'og:description', page.description)
      setMeta('property', 'og:url', url)
      setMeta('name', 'twitter:title', page.title)
      setMeta('name', 'twitter:description', page.description)
      setPageJsonLd(pageStructuredData(page))
      return
    }

    // Not a public page: keep it out of the index and do not claim a canonical.
    setMeta('name', 'robots', isNoindex(path) ? 'noindex, nofollow' : 'noindex, follow')
    setCanonical(null)
    setPageJsonLd(null)
  }, [pathname])

  return null
}
