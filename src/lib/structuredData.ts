/**
 * schema.org structured data (JSON-LD) for each public page.
 *
 * Site-wide blocks (Organization, WebSite) are written by hand in index.html.
 * Everything page-specific is built here and lands in ONE script tag with the
 * id PAGE_JSONLD_ID, written into the pre-built HTML by the build plugin
 * (vite.config.ts) and swapped by RouteSeo on every route change:
 *  - every page: WebPage (or AboutPage / ContactPage) and its BreadcrumbList;
 *  - home: the FaceCloud web application and the home FAQ;
 *  - about: the owners and team as Person entries;
 *  - contact: the contact e-mail as contact points;
 *  - moderator: the moderator FAQ.
 *
 * Plain data only: the Vite config imports this file in Node.
 */
import { SITE_URL, breadcrumbJsonLd, canonicalUrl, type PageSeo } from './seoPages.ts'
import { HOME_FAQ, MODERATOR_FAQ, type FaqItem } from '../content/faqs.ts'
import { OWNERS, TEAMS, type Person } from '../content/team.ts'

export const PAGE_JSONLD_ID = 'fc-page-jsonld'

/** Matches the @id of the Organization block in index.html. */
const ORG_ID = `${SITE_URL}/#organization`
const WEBSITE_ID = `${SITE_URL}/#website`

/** The address people write to, as shown on the Contact page. */
const CONTACT_EMAIL = 'ali@facecloudai.com'

type Json = Record<string, unknown>

function faqPage(page: PageSeo, items: FaqItem[]): Json {
  return {
    '@type': 'FAQPage',
    '@id': `${canonicalUrl(page.path)}#faq`,
    mainEntity: items.map(item => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }
}

function person(p: Person): Json {
  return {
    '@type': 'Person',
    name: p.name,
    jobTitle: p.role,
    ...(p.title ? { description: p.title } : {}),
    ...(p.photo ? { image: `${SITE_URL}${p.photo}` } : {}),
    homeLocation: { '@type': 'Place', name: p.place },
    sameAs: [p.linkedin],
    worksFor: { '@id': ORG_ID },
  }
}

function webPage(page: PageSeo, type: string): Json {
  const url = canonicalUrl(page.path)
  return {
    '@type': type,
    '@id': `${url}#webpage`,
    url,
    name: page.title,
    description: page.description,
    inLanguage: 'en',
    isPartOf: { '@id': WEBSITE_ID },
    about: { '@id': ORG_ID },
  }
}

/** The whole JSON-LD document for one public page. */
export function pageStructuredData(page: PageSeo): Json {
  const graph: Json[] = []
  const crumbs = breadcrumbJsonLd(page)
  if (crumbs) graph.push(crumbs)

  switch (page.path) {
    case '/':
      graph.push(webPage(page, 'WebPage'))
      graph.push({
        '@type': 'WebApplication',
        '@id': `${SITE_URL}/#app`,
        name: 'FaceCloud',
        url: canonicalUrl('/'),
        description: page.description,
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Any (runs in a web browser)',
        publisher: { '@id': ORG_ID },
        // Only the free account is offered today; the paid plans on the page are marked coming soon.
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', description: 'Free account' },
      })
      graph.push(faqPage(page, HOME_FAQ))
      break
    case '/about': {
      const about = webPage(page, 'AboutPage')
      graph.push(about)
      graph.push({
        '@type': 'Organization',
        '@id': ORG_ID,
        founder: OWNERS.filter(o => o.main).map(person),
        employee: [...OWNERS.filter(o => !o.main), ...TEAMS.flatMap(team => team.people)].map(person),
      })
      break
    }
    case '/contact':
      graph.push(webPage(page, 'ContactPage'))
      graph.push({
        '@type': 'Organization',
        '@id': ORG_ID,
        contactPoint: [
          { '@type': 'ContactPoint', contactType: 'customer support', email: CONTACT_EMAIL },
          { '@type': 'ContactPoint', contactType: 'sales', email: CONTACT_EMAIL },
        ],
      })
      break
    case '/roles/moderator':
      graph.push(webPage(page, 'WebPage'))
      graph.push(faqPage(page, MODERATOR_FAQ))
      break
    default:
      graph.push(webPage(page, 'WebPage'))
  }

  return { '@context': 'https://schema.org', '@graph': graph }
}
