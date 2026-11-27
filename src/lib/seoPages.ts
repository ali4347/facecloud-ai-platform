/**
 * The one list of search-engine details for every public page.
 *
 * Read in two places, so the two can never disagree:
 *  - in the browser, by `RouteSeo`, which rewrites the head on every route change;
 *  - at build time, by the `seoPages` plugin in `vite.config.ts`, which writes a
 *    ready-made HTML file per page into `dist/_seo/` so crawlers and link
 *    previews that do not run JavaScript still see the right tags.
 *
 * Plain data only: this file is imported by the Vite config in Node.
 * Keep a title under ~60 characters and a description under ~160.
 * A page added here also belongs in `public/sitemap.xml`.
 */

export const SITE_URL = 'https://www.facecloudai.com'

export interface PageSeo {
  /** The route, exactly as in App.tsx. */
  path: string
  /** The whole <title>, brand included. */
  title: string
  description: string
  /** Short name for the breadcrumb trail and the explore links. */
  name: string
}

export const PUBLIC_PAGES: PageSeo[] = [
  {
    path: '/',
    name: 'Home',
    title: 'FaceCloud — AI Facial Image Enhancement & Identity Grouping',
    description:
      'Enhance low-light facial images with AI, check face quality automatically and group photos by identity, with secure role-based access for teams.',
  },
  {
    path: '/about',
    name: 'About',
    title: 'About FaceCloud — Our Mission, Owners and Team',
    description:
      'Meet the people behind FaceCloud, the AI platform by DATAMART Inc. that brings order to facial image data: our mission, how we work, our owners and team.',
  },
  {
    path: '/contact',
    name: 'Contact',
    title: 'Contact FaceCloud — Sales, Support and Partnerships',
    description:
      'Send the FaceCloud team a message about plans, team accounts, early access, partnerships or support, and we will get back to you by email.',
  },
  {
    path: '/roles/moderator',
    name: 'Moderator Role',
    title: 'Moderator Role and Team Plans — FaceCloud',
    description:
      'What a FaceCloud moderator does: reviews uncertain face-quality decisions and manages team access. Compare the Team, Business and Enterprise plans.',
  },
  {
    path: '/login',
    name: 'Login',
    title: 'Login to FaceCloud',
    description:
      'Sign in to FaceCloud to upload, enhance and organize your facial images, and to see your identity groups, albums and downloads.',
  },
  {
    path: '/register',
    name: 'Create Account',
    title: 'Create a Free FaceCloud Account',
    description:
      'Sign up to FaceCloud for free: upload up to 10 images, enhance low-light photos with AI and let FaceCloud group faces by identity for you.',
  },
]

/**
 * Routes that must never appear in search results: the signed-in portals and
 * the one-off pages reached from an e-mail link. Matched by prefix.
 */
export const NOINDEX_PREFIXES = [
  '/dashboard',
  '/admin',
  '/moderator',
  '/verify-email',
  '/verify-email-change',
  '/forgot-password',
  '/reset-password',
  '/unauthorized',
  '/invitations',
  '/accept-invitation',
]

/** Drops a trailing slash so "/about/" finds "/about". */
export function normalizePath(pathname: string): string {
  return pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
}

export function findPageSeo(pathname: string): PageSeo | undefined {
  const path = normalizePath(pathname)
  return PUBLIC_PAGES.find(page => page.path === path)
}

export function canonicalUrl(path: string): string {
  return path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`
}

/** schema.org BreadcrumbList node for a page: Home, then the page (none for Home itself). Used inside the page graph in structuredData.ts. */
export function breadcrumbJsonLd(page: PageSeo): Record<string, unknown> | null {
  if (page.path === '/') return null
  return {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: canonicalUrl('/') },
      { '@type': 'ListItem', position: 2, name: page.name, item: canonicalUrl(page.path) },
    ],
  }
}
