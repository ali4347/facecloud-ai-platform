import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Ban, BarChart3, Bell, Check, Clock, Eye, FileText, GitMerge, Hand, Hourglass,
  Layers, ListChecks, Lock, ScrollText, ShieldCheck, UserCog, X,
} from 'lucide-react'
import { PublicNavbar } from '../components/public/PublicNavbar'
import { PublicFooter } from '../components/public/PublicFooter'
import { RevealOnScroll } from '../components/animation/RevealOnScroll'
import { HeadingText } from '../components/animation/HeadingText'

/*
 * The moderator role, written from what the platform actually enforces.
 *
 * Every claim here was checked against the backend's rules rather than its
 * design notes, because the two disagree in places: the notes say a moderator
 * cannot remove an owner, while the code also stops a moderator managing
 * *another moderator*. Where something is built but its screen is still being
 * connected, or is planned and not built, the build-status section says so
 * instead of presenting it as available.
 *
 * The numbers quoted (24-hour deadline, 15-minute claim, 50 per bulk decision,
 * 72-hour invitation) are the defaults; an organization's deployment can
 * change them, so the page says "by default" wherever one appears.
 */

type Who = 'moderator' | 'owner' | 'member'

const SECTIONS = [
  { id: 'does', label: 'What they do' },
  { id: 'review', label: 'How a review works' },
  { id: 'roles', label: 'Compared with other roles' },
  { id: 'limits', label: 'Boundaries' },
  { id: 'access', label: 'Getting access' },
  { id: 'status', label: 'Roadmap' },
]

const HIGHLIGHTS = [
  { value: '3', label: 'kinds of uncertain result reach a moderator' },
  { value: '24h', label: 'default deadline on each new review' },
  { value: 'Audited', label: 'every decision, escalation, claim and member change' },
]

const CAPABILITIES = [
  {
    icon: ListChecks,
    title: 'Work the review queue',
    body: 'Decide the results the automatic checks were not sure about: approve, reject, correct or keep in review, each with a recorded reason.',
    how: 'Three sources feed the queue — photo quality, suspected duplicates and ambiguous identity matches.',
  },
  {
    icon: Eye,
    title: 'See the photo being judged',
    body: 'Every review shows a thumbnail of the photo alongside what the system concluded and how confident it was.',
    how: 'Thumbnails only. The original file is never served through a review.',
  },
  {
    icon: Hand,
    title: 'Claim a review',
    body: 'Take a review so nobody else spends time on the same photo and records a contradicting decision.',
    how: 'The hold lasts 15 minutes by default and expires by itself, so work is never stranded.',
  },
  {
    icon: ArrowRight,
    title: 'Escalate to an owner',
    body: 'When a call is not yours to make, pass it up. Every active owner of the organization is notified.',
    how: 'Escalated reviews stay visible as escalated, even while an owner works them.',
  },
  {
    icon: Layers,
    title: 'Decide in bulk',
    body: 'Approve, reject or escalate a whole selection at once when a batch is clear-cut.',
    how: 'Up to 50 at a time by default. Each row stands alone, so one stale row never costs the rest.',
  },
  {
    icon: Clock,
    title: 'Keep to the deadline',
    body: 'Reviews carry a deadline from the moment they are created. The dashboard shows what is overdue, what is due soon and what nobody has picked up.',
    how: 'One alert per late review, to its assignee — or to every owner and moderator if it is unassigned.',
  },
  {
    icon: GitMerge,
    title: 'Fix person folders',
    body: 'Merge two person folders that are really the same person, or settle an uncertain identity match from the review queue.',
    how: 'Only two folders of the same member can be merged, and nothing is deleted. Your decision is recorded as yours.',
  },
  {
    icon: UserCog,
    title: 'Look after members',
    body: 'Invite normal members, resend or cancel invitations, deactivate or reactivate access, and remove people from the organization. An organization’s plan limits how many people it can have.',
    how: 'Removing someone ends their membership; it does not delete their FaceCloud account.',
  },
  {
    icon: Eye,
    title: 'Go through rejected photos',
    body: 'Open any rejected or uncertain photo from your organization at a larger size, with the reasons the checks gave, and open its review if one was raised.',
    how: 'You see photos your members chose to submit to the team, never their private workspace.',
  },
  {
    icon: Layers,
    title: 'Retry, cancel or reprocess batches',
    body: 'When an upload fails, retry the images that failed. When one should not continue, cancel it. When the result was poor, run enhancement again.',
    how: 'Reprocessing makes a new version of each photo and keeps the original and earlier results. A fully failed batch alerts every owner and moderator except the uploader.',
  },
  {
    icon: FileText,
    title: 'Produce reports',
    body: 'Generate organization reports on reviews, moderator activity, rejection reasons, quality scores, batches and duplicate decisions.',
    how: 'JSON, CSV or PDF. Reports contain counts and decisions — never facial data.',
  },
  {
    icon: BarChart3,
    title: 'Track team performance',
    body: 'See each moderator’s decisions by outcome, how often they met the deadline, and how long decisions take.',
    how: 'Timed from when the review arrived, since that is how long the uploader actually waited.',
  },
  {
    icon: ScrollText,
    title: 'Read the audit trail',
    body: 'Browse the organization’s history of membership changes and moderation actions.',
    how: 'Entries cannot be edited or deleted by anyone in the organization.',
  },
]

const STEPS = [
  { title: 'A result is flagged', body: 'The automatic checks reach a result they are not confident about. A review is created and stamped with a deadline.' },
  { title: 'It joins the shared queue', body: 'Anyone can assign it to a moderator, who is then notified. If it passes its deadline unclaimed, the owners and moderators are alerted.' },
  { title: 'You open the queue', body: 'Sort by deadline, or filter to overdue, unassigned or your own reviews.' },
  { title: 'You claim it', body: 'The review is held for you. Another moderator who tries to decide it is told who has it.' },
  { title: 'You look and judge', body: 'Compare the photo with what the system concluded, its confidence, and the reasons it gave.' },
  { title: 'You decide', body: 'Approve, reject, correct, keep in review or escalate — with a reason that is recorded.' },
  { title: 'It is written back', body: 'Your decision updates the underlying record, releases your hold, and is added to the audit trail.' },
]

const MATRIX: { ability: string; moderator: boolean; owner: boolean; member: boolean }[] = [
  { ability: 'Decide and escalate reviews', moderator: true, owner: true, member: false },
  { ability: 'Claim a review', moderator: true, owner: true, member: false },
  { ability: 'Release someone else’s claim', moderator: false, owner: true, member: false },
  { ability: 'Invite a normal member', moderator: true, owner: true, member: false },
  { ability: 'Invite someone as a moderator', moderator: false, owner: true, member: false },
  { ability: 'Deactivate or remove a normal member', moderator: true, owner: true, member: false },
  { ability: 'Manage an owner or another moderator', moderator: false, owner: true, member: false },
  { ability: 'Retry or cancel an organization batch', moderator: true, owner: true, member: false },
  { ability: 'Generate organization reports', moderator: true, owner: true, member: false },
  { ability: 'Read the audit history', moderator: true, owner: true, member: false },
]

const BOUNDARIES = [
  { icon: Ban, text: 'A moderator cannot see another organization’s data. Anything outside their organization looks like it does not exist.' },
  { icon: Ban, text: 'By default a moderator sees only the members they invited, plus members nobody invited, so no photo is left without a reviewer. They never see another moderator’s members. An organization’s owner can widen this to everyone, and always sees everyone.' },
  { icon: Ban, text: 'A moderator cannot manage an owner, or another moderator. Only an owner can.' },
  { icon: Ban, text: 'A moderator cannot grant the owner role, and the last owner of an organization can never be demoted, suspended or removed.' },
  { icon: Ban, text: 'A moderator cannot decide a review while someone else holds it — the attempt is refused and says who has it.' },
  { icon: Ban, text: 'A moderator cannot edit or delete the audit trail.' },
]

const SAFEGUARDS = [
  { icon: Lock, text: 'Reviews show thumbnails, not originals, so the role cannot be used to pull photos out of the system.' },
  { icon: ShieldCheck, text: 'Access is tied to the role: lose it, and the review view closes at the same moment.' },
  { icon: Bell, text: 'A moderator who loses the role has their open reviews and holds returned to the queue automatically.' },
  { icon: ScrollText, text: 'Every decision, escalation, assignment, claim and member change is written to an immutable audit history.' },
]

const ACCESS_STEPS = [
  { title: 'You are added to one organization', body: 'A FaceCloud administrator creates your moderator account for a specific organization, or the organization’s owner invites you by email. A moderator always belongs to an organization.' },
  { title: 'You get your sign-in details', body: 'An invitation link expires — after 72 hours by default — and a fresh one can be sent. An account made by an administrator comes with its sign-in details handed over directly.' },
  { title: 'You sign in to the Moderator Panel', body: 'Your administrator or owner shares the direct link to the panel. It is not listed on the public site. Without an organization the panel has nothing to show you.' },
]

const STATUS_COLUMNS = [
  {
    key: 'working',
    title: 'Built and connected',
    tone: 'text-[var(--s-ok)] border-[var(--s-ok)]/30 bg-[var(--s-ok)]/10',
    items: [
      'Dashboard — overdue and due-soon counts, unassigned work, team performance',
      'Review queue and the single-review page — filters, deadlines, claiming, bulk decisions, the photo, its measurements and history',
      'Telling the member what was decided, with a message of your own or a standard sentence',
      'Seeing only your own members, plus members nobody invited (an organization can widen this to everyone)',
      'Rejected photos, identity review, decision log, member management, batches, reports, audit history, notifications and settings',
      'Your organization’s name, logo and colour, set by its owner; an owner’s own page for people, roles, plan seats and data export',
    ],
  },
  {
    key: 'connecting',
    title: 'Next, being designed',
    tone: 'text-[#FB923C] border-[#F97316]/30 bg-[#F97316]/10',
    items: [
      'Removing a whole organization and its data in one safe step (the design is written, waiting for a decision)',
      'Billing for plans (the seat limits already work; the administrator sets the plan by hand)',
    ],
  },
  {
    key: 'planned',
    title: 'Planned, not built',
    tone: 'text-ink-mute border-ink/15 bg-ink/[0.04]',
    items: [
      'Choosing the enhancement level when reprocessing a batch',
      'Original-against-enhanced comparison inside a review',
      'Side-by-side comparison of suspected duplicates',
    ],
  },
]

function Mark({ allowed }: { allowed: boolean }) {
  return allowed ? (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[var(--s-ok)]/15 text-[var(--s-ok)]">
      <Check className="w-3.5 h-3.5" aria-hidden />
      <span className="sr-only">Yes</span>
    </span>
  ) : (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-ink/[0.05] text-ink-faint">
      <X className="w-3.5 h-3.5" aria-hidden />
      <span className="sr-only">No</span>
    </span>
  )
}

function Heading({ tag, title, subtitle }: { tag: string; title: string; subtitle?: string }) {
  return (
    <div className="max-w-2xl space-y-3 mb-10">
      <span className="text-[11px] font-bold text-[#FB923C] uppercase tracking-[0.2em]">{tag}</span>
      <h2 className="text-3xl sm:text-4xl font-medium text-ink tracking-tight leading-tight" style={{ fontFamily: "'Space Mono', serif" }}>
        <HeadingText text={title} />
      </h2>
      {subtitle && <p className="text-sm text-ink-mute leading-relaxed">{subtitle}</p>}
    </div>
  )
}

export default function ModeratorRole() {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [])

  return (
    <div className="relative min-h-screen fc-app-bg overflow-x-hidden flex flex-col justify-between">
      <PublicNavbar />

      <main className="flex-grow pt-28 pb-16">
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="py-16 relative overflow-hidden">
          <div
            className="absolute top-[10%] right-[-10%] w-[50%] h-[40vh] rounded-full blur-[140px] pointer-events-none opacity-20"
            style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.18) 0%, transparent 70%)' }}
          />
          <div className="max-w-4xl mx-auto px-6 text-center space-y-6 relative z-10">
            <RevealOnScroll>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F97316]/10 border border-[#F97316]/20 text-[11px] font-bold text-[#FB923C] uppercase tracking-wider">
                Role guide · Moderator
              </span>
            </RevealOnScroll>
            <RevealOnScroll delay={0.05}>
              <h1 className="text-4xl sm:text-6xl font-medium text-ink tracking-tight leading-[1.15]" style={{ fontFamily: "'Space Mono', serif" }}>
                <HeadingText text={'The human check on\nevery uncertain [decision]'} />
              </h1>
            </RevealOnScroll>
            <RevealOnScroll delay={0.1}>
              <p className="text-base sm:text-lg text-ink-mute max-w-2xl mx-auto leading-relaxed">
                FaceCloud’s automatic checks decide most photos on their own. When one is not sure, it goes to a moderator:
                a trusted person inside your organization who looks at the photo and makes the call.
                A moderator works within one organization and is not a platform administrator.
              </p>
            </RevealOnScroll>

            <RevealOnScroll delay={0.15}>
              <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-left">
                {HIGHLIGHTS.map(item => (
                  <div key={item.label} className="fc-panel p-5 space-y-1">
                    <dt className="text-3xl font-medium text-ink" style={{ fontFamily: "'Space Mono', serif" }}>{item.value}</dt>
                    <dd className="text-xs text-ink-mute leading-relaxed">{item.label}</dd>
                  </div>
                ))}
              </dl>
            </RevealOnScroll>

            <RevealOnScroll delay={0.2}>
              <nav aria-label="On this page" className="flex flex-wrap justify-center gap-2 pt-2">
                {SECTIONS.map(section => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-ink-soft border border-ink/[0.10] hover:border-[#F97316]/40 hover:text-[#FB923C] transition-colors"
                  >
                    {section.label}
                  </a>
                ))}
              </nav>
            </RevealOnScroll>
          </div>
        </section>

        {/* ── What they do ─────────────────────────────────────── */}
        <section id="does" className="py-16 scroll-mt-28">
          <div className="max-w-6xl mx-auto px-6">
            <Heading
              tag="01 · Responsibilities"
              title="What a moderator can [do]"
              subtitle="Twelve things, from the daily queue to the organization’s housekeeping. Where a figure is given, it is the default and an organization can change it."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {CAPABILITIES.map((capability, index) => (
                <RevealOnScroll key={capability.title} delay={(index % 3) * 0.06} className="h-full">
                  <div className="fc-panel p-6 h-full flex flex-col gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#F97316]/12 border border-[#F97316]/25 flex items-center justify-center text-[#FB923C]">
                      <capability.icon className="w-4 h-4" aria-hidden />
                    </div>
                    <h3 className="text-base font-bold text-ink">{capability.title}</h3>
                    <p className="text-sm text-ink-mute leading-relaxed">{capability.body}</p>
                    <p className="text-xs text-ink-faint leading-relaxed mt-auto pt-3 border-t border-ink/[0.06]">
                      {capability.how}
                    </p>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* ── How a review works ───────────────────────────────── */}
        <section id="review" className="py-16 scroll-mt-28">
          <div className="max-w-4xl mx-auto px-6">
            <Heading
              tag="02 · Workflow"
              title="How a review works, start to [finish]"
              subtitle="The same path every time, whether the question is a blurry photo, a possible duplicate or a face that might belong to two people."
            />
            <ol className="relative space-y-4">
              {STEPS.map((step, index) => (
                <RevealOnScroll key={step.title} delay={0.03 * index}>
                  <li className="fc-panel p-5 flex gap-4 items-start">
                    <span
                      className="shrink-0 w-9 h-9 rounded-full bg-[#F97316]/12 border border-[#F97316]/30 text-[#FB923C] flex items-center justify-center text-sm font-bold"
                      style={{ fontFamily: "'Space Mono', serif" }}
                      aria-hidden
                    >
                      {index + 1}
                    </span>
                    <div className="space-y-1 min-w-0">
                      <h3 className="text-sm font-bold text-ink">
                        <span className="sr-only">Step {index + 1}: </span>{step.title}
                      </h3>
                      <p className="text-sm text-ink-mute leading-relaxed">{step.body}</p>
                    </div>
                  </li>
                </RevealOnScroll>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Compared with other roles ────────────────────────── */}
        <section id="roles" className="py-16 scroll-mt-28">
          <div className="max-w-4xl mx-auto px-6">
            <Heading
              tag="03 · Roles"
              title="How the role [compares]"
              subtitle="Inside an organization there are three roles. A moderator sits between an owner, who is accountable for the organization, and a member, who uploads and uses the product."
            />
            <RevealOnScroll>
              <div className="fc-panel overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm min-w-[520px]">
                    <thead>
                      <tr className="border-b border-ink/[0.08] text-[11px] uppercase tracking-wider text-ink-faint">
                        <th scope="col" className="px-5 py-4 font-bold">Ability</th>
                        {(['moderator', 'owner', 'member'] as Who[]).map(role => (
                          <th key={role} scope="col" className={`px-4 py-4 font-bold text-center capitalize ${role === 'moderator' ? 'text-[#FB923C]' : ''}`}>
                            {role}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {MATRIX.map(row => (
                        <tr key={row.ability} className="border-b border-ink/[0.05] last:border-0">
                          <th scope="row" className="px-5 py-3.5 font-medium text-ink-soft">{row.ability}</th>
                          <td className="px-4 py-3.5 text-center bg-[#F97316]/[0.04]"><Mark allowed={row.moderator} /></td>
                          <td className="px-4 py-3.5 text-center"><Mark allowed={row.owner} /></td>
                          <td className="px-4 py-3.5 text-center"><Mark allowed={row.member} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <p className="text-xs text-ink-faint leading-relaxed mt-4">
                FaceCloud administrators run the platform itself — users, security and system health. They are separate from
                an organization’s moderators and are not part of its review queue.
              </p>
            </RevealOnScroll>
          </div>
        </section>

        {/* ── Boundaries ───────────────────────────────────────── */}
        <section id="limits" className="py-16 scroll-mt-28">
          <div className="max-w-6xl mx-auto px-6">
            <Heading
              tag="04 · Guardrails"
              title="What a moderator cannot do, and what protects [everyone]"
              subtitle="The role is deliberately narrow. These limits are enforced by the platform, not left to good behaviour."
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RevealOnScroll direction="left" className="h-full">
                <div className="fc-panel p-6 h-full space-y-4">
                  <h3 className="text-sm font-bold text-ink uppercase tracking-wider">Cannot</h3>
                  <ul className="space-y-3.5">
                    {BOUNDARIES.map(item => (
                      <li key={item.text} className="flex gap-3 text-sm text-ink-mute leading-relaxed">
                        <item.icon className="w-4 h-4 mt-0.5 shrink-0 text-ink-faint" aria-hidden />
                        {item.text}
                      </li>
                    ))}
                  </ul>
                </div>
              </RevealOnScroll>
              <RevealOnScroll direction="right" className="h-full">
                <div className="fc-panel p-6 h-full space-y-4">
                  <h3 className="text-sm font-bold text-ink uppercase tracking-wider">Safeguards</h3>
                  <ul className="space-y-3.5">
                    {SAFEGUARDS.map(item => (
                      <li key={item.text} className="flex gap-3 text-sm text-ink-mute leading-relaxed">
                        <item.icon className="w-4 h-4 mt-0.5 shrink-0 text-[var(--s-ok)]" aria-hidden />
                        {item.text}
                      </li>
                    ))}
                  </ul>
                </div>
              </RevealOnScroll>
            </div>
          </div>
        </section>

        {/* ── Getting access ───────────────────────────────────── */}
        <section id="access" className="py-16 scroll-mt-28">
          <div className="max-w-5xl mx-auto px-6">
            <Heading
              tag="05 · Access"
              title="How someone becomes a [moderator]"
              subtitle="Moderator is a role inside an organization, not a separate account type. Owners grant it by invitation."
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {ACCESS_STEPS.map((step, index) => (
                <RevealOnScroll key={step.title} delay={0.06 * index} className="h-full">
                  <div className="fc-panel p-6 h-full space-y-2">
                    <span className="text-xs font-bold text-[#FB923C]" style={{ fontFamily: "'Space Mono', serif" }}>
                      STEP {index + 1}
                    </span>
                    <h3 className="text-base font-bold text-ink">{step.title}</h3>
                    <p className="text-sm text-ink-mute leading-relaxed">{step.body}</p>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
            <RevealOnScroll delay={0.1}>
              <div className="fc-panel p-5 mt-5 flex gap-3 items-start">
                <Hourglass className="w-4 h-4 mt-0.5 shrink-0 text-[#FB923C]" aria-hidden />
                <p className="text-sm text-ink-mute leading-relaxed">
                  <span className="font-bold text-ink">When access ends</span> — whether the role is removed, the person is
                  suspended or they leave — any reviews they were assigned or holding go back to the queue automatically,
                  so nothing is left waiting on someone who can no longer act.
                </p>
              </div>
            </RevealOnScroll>
          </div>
        </section>

        {/* ── Build status ─────────────────────────────────────── */}
        <section id="status" className="py-16 scroll-mt-28">
          <div className="max-w-6xl mx-auto px-6">
            <Heading
              tag="06 · Roadmap"
              title="What is built, and what comes [next]"
              subtitle="An honest account of where the moderator role stands today."
            />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {STATUS_COLUMNS.map((column, index) => (
                <RevealOnScroll key={column.key} delay={0.06 * index} className="h-full">
                  <div className="fc-panel p-6 h-full space-y-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wider ${column.tone}`}>
                      {column.title}
                    </span>
                    <ul className="space-y-3">
                      {column.items.map(item => (
                        <li key={item} className="text-sm text-ink-mute leading-relaxed pl-4 relative before:content-[''] before:absolute before:left-0 before:top-[9px] before:w-1.5 before:h-1.5 before:rounded-full before:bg-ink/25">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
            <RevealOnScroll delay={0.1}>
              <div className="fc-panel p-6 mt-5 space-y-2">
                <h3 className="text-sm font-bold text-ink">Pricing and plans</h3>
                <p className="text-sm text-ink-mute leading-relaxed">
                  Moderator access is a role within an organization, not a separately priced product, and today it is not
                  tied to a subscription tier. Seat limits and pricing for moderators have not been decided yet — they
                  are listed above as planned, not promised.
                </p>
              </div>
            </RevealOnScroll>
          </div>
        </section>

        {/* ── Closing ──────────────────────────────────────────── */}
        <section className="py-16">
          <div className="max-w-3xl mx-auto px-6 text-center space-y-5">
            <RevealOnScroll>
              <h2 className="text-2xl sm:text-3xl font-medium text-ink tracking-tight" style={{ fontFamily: "'Space Mono', serif" }}>
                <HeadingText text="Questions about the [role]?" />
              </h2>
              <p className="text-sm text-ink-mute leading-relaxed mt-3">
                If you are setting up an organization and want to talk through who should be a moderator, we are happy to help.
              </p>
              <div className="flex flex-wrap justify-center gap-3 mt-6">
                <Link to="/contact" className="fc-btn-primary px-6 py-3 text-xs font-bold inline-flex items-center gap-2">
                  Get in touch <ArrowRight className="w-3.5 h-3.5" aria-hidden />
                </Link>
                <Link
                  to="/"
                  className="px-6 py-3 rounded-xl text-xs font-bold border border-ink/[0.12] text-ink-soft hover:text-ink transition-colors"
                >
                  Back to home
                </Link>
              </div>
            </RevealOnScroll>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}
