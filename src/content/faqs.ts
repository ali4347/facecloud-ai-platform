/**
 * The questions and answers shown on the site. Each list is used twice: the
 * page renders it (FaqList), and src/lib/structuredData.ts turns it into
 * FAQPage structured data. Google only accepts FAQ data that matches the
 * visible text, so there is one copy, here.
 *
 * Plain data only: the Vite config imports this file in Node.
 */

export interface FaqItem {
  q: string
  a: string
}

/** Home page, section "Frequently asked questions". */
export const HOME_FAQ: FaqItem[] = [
  { q: 'What image formats are supported?', a: 'FaceCloud accepts JPEG, PNG, and WebP image formats. ZIP archives containing these formats are also supported for batch processing.' },
  { q: 'How is my data secured?', a: 'All uploads are encrypted at rest using AES-256 and in transit via TLS 1.3. JWT-based authentication enforces role-based access control across all API endpoints.' },
  { q: 'Can I delete my data?', a: 'Yes. Users can delete individual images or entire person folders from the dashboard at any time. Deleted data is permanently removed from all storage systems within 24 hours.' },
  { q: 'What happens to rejected images?', a: 'Images that fail quality checks (blur, exposure, or face detection) are flagged for moderator review. Moderators can override rejections or confirm the automated decision.' },
  { q: 'Is there an API for integrations?', a: 'API access for integrations is planned together with paid plans, in a later version. Interactive API documentation is generated from the backend.' },
  { q: 'What are the plan limits?', a: 'Plans, pricing and limits are coming in a later version, so the figures on the pricing cards are not final and are not enforced yet.' },
]

/**
 * Moderator page, section "Moderator FAQ". Every answer restates something the
 * page already says in its sections (defaults, limits, plans), so keep the two
 * in step when either changes.
 */
export const MODERATOR_FAQ: FaqItem[] = [
  {
    q: 'What does a FaceCloud moderator do?',
    a: 'A moderator decides the results the automatic checks were not sure about: photo quality, suspected duplicates and uncertain identity matches. Each one can be approved, rejected, corrected, kept in review or escalated to an owner, always with a recorded reason. Moderators also invite and look after the normal members of their organization.',
  },
  {
    q: 'Can a moderator see members’ original photos?',
    a: 'No. A review shows a thumbnail of the photo, never the original file, and a moderator only sees photos that members chose to submit to the team, never their private workspace.',
  },
  {
    q: 'How long does a moderator have to decide a review?',
    a: 'Each review gets a deadline when it is created, 24 hours by default. Claiming a review holds it for 15 minutes by default so nobody else decides it at the same time, and late reviews raise an alert.',
  },
  {
    q: 'How does someone become a moderator?',
    a: 'A FaceCloud administrator creates the moderator account for a specific organization, or the organization’s owner invites the person by email. An invitation link expires after 72 hours by default, and a new one can be sent.',
  },
  {
    q: 'What can a moderator not do?',
    a: 'A moderator cannot see another organization’s data, manage an owner or another moderator, grant the owner role, decide a review someone else holds, or edit or delete the audit trail.',
  },
  {
    q: 'How much does a team with moderators cost?',
    a: 'Team is $29 a month for 1 moderator, 10 members, 50 GB and 2,000 images a month. Business is $79 a month for 3 moderators, 50 members, 200 GB and 10,000 images a month. Enterprise has no limits and is priced on request. Billing is not built yet, so these plans are marked coming soon.',
  },
]
