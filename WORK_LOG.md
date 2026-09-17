# FaceCloud — Work Log & Project Documentation

> **Purpose:** this is the single running record of *everything that has been done* on the FaceCloud FYP project.
> Detailed feature/route docs live in [README.md](./README.md); the backend blueprint lives in
> [README_BACKEND_ROADMAP.md](./README_BACKEND_ROADMAP.md). This file records **what was done, when, and what state things are in.**
>
> **Update rule:** every task that changes code, config, assets, database schema or docs must add a dated entry to
> **Section 2 (Change Log)** and refresh any affected status section, in the same sitting as the work.
> (Enforced for Claude Code by `CLAUDE.md` and the Stop hook in `.claude/hooks/check-work-log.sh`.)

**Last updated:** 2026-09-17
**Repository:** `git@github.com:ali4347/facecloud-ai-platform.git` (branch `main`)
**Live site:** https://www.facecloudai.pro (Vercel)

---

## 1. Project Snapshot (current state)

FaceCloud is an AI facial-image platform: low-light enhancement (Zero-DCE), face detection and quality validation,
identity grouping into "person folders", secure downloads, plus admin and moderator consoles. Powered by DATAMART / DTM.IO.

| Area | Status | Notes |
|:-----|:-------|:------|
| Frontend SPA (React 19 + Vite 8 + TypeScript + Tailwind 3 + Framer Motion) | ✅ Complete prototype | All portals work on mock data + `localStorage`; no real API calls |
| Public marketing site (Landing, About, Contact) | ✅ Live | Landing v2 design (2026-08-05 state); a v3 redesign attempt was discarded on 2026-09-17 |
| User portal (16 routes under `/dashboard`) | ✅ Complete (mock) | Uploads, processing, images, groups, downloads, live webcam enhancement |
| Admin console (11 routes under `/admin`) | ✅ Complete (mock) | Users, audit, security, API docs/test, system, stats, image monitoring |
| Moderator panel (9 routes under `/moderator`) | ✅ Complete (mock) | Queue, image review, members, batches, notifications, reports, audit, settings |
| Branding + design system | ✅ Done | Official logo set, black / orange `#F97316` / monospace (Space Mono, JetBrains Mono, Silkscreen) |
| SEO + analytics | ✅ Done | Meta/OG/Twitter tags, JSON-LD (Organization, FAQPage), robots.txt, sitemap.xml, Vercel Analytics |
| Deployment | ✅ Vercel | `vercel.json` SPA rewrite that skips files with extensions (so `/videos/*.mp4` serve) |
| Backend database (PostgreSQL 16 + Prisma 5.22) | ✅ Schema + migration + seed | 15 models, 8 enums, migration `20260714_init`, 3 seeded accounts |
| Backend API server (NestJS/Express) | ❌ Not started | Planned in README_BACKEND_ROADMAP.md §3 |
| Queue (Redis + BullMQ) / AI workers (Python) | ❌ Not started | Redis container exists in `docker-compose.yml`, nothing consumes it |
| Tests (unit / e2e) | ❌ None | Listed as future work |
| Build health | ✅ `npm run build` passes (checked 2026-09-17) | JS bundle 2.28 MB minified, chunk-size warning, no code splitting |

**Tooling:** `npm run dev` (Vite, port 5173) · `npm run build` (`tsc -b && vite build`) · `npm run lint` (oxlint) ·
backend: `cd backend && npm run seed` / `npx prisma studio` · infra: `docker compose up -d`.

**Mock logins (frontend and seeded DB, password `password`):** `user@facecloud.ai` · `admin@dtm.io` · `moderator@facecloud.ai`.

---

## 2. Change Log (newest first — add new entries at the top of this list)

Format: `### YYYY-MM-DD — short title` · status (`committed <hash>` / `uncommitted`) · what changed · files.

### 2026-09-17 — Project work log + auto-update rule set up; uncommitted landing v3 discarded
*Status: committed (this commit)*
- Created this file (`WORK_LOG.md`) documenting all work from the initial import to today.
- Added `CLAUDE.md` (project instructions for Claude Code) with the mandatory "update WORK_LOG.md after every task" rule.
- Added a Stop hook (`.claude/settings.json` → `.claude/hooks/check-work-log.sh`) that blocks Claude from finishing a turn
  while any source/config/asset file is newer than `WORK_LOG.md`.
- Pointed the existing workflow rules at this file: `.agents/AGENTS.md` step 4 and `README.md` §22.
- Verified the working tree builds (`npm run build` → exit 0).
- On the owner's instruction, the uncommitted landing v3 redesign (see next entry) and the unstaged local deletion of
  `aigocy/` were discarded; the working tree was restored to the committed state before this commit.

### 2026-09-16 — Landing page v3: monochrome redesign (discarded, never committed)
*Status: discarded on 2026-09-17 by owner decision. It existed only as uncommitted local changes (10 modified files,
3 new files) and built clean. Recorded here for history; none of it is in the repository.*
- **New components** in `src/components/landing/`:
  - `BootSequence.tsx` — full-screen 0→100 "Initialising pipeline" counter overlay shown once per browser session
    (`sessionStorage` flag `fc-boot-shown`), skipped for `prefers-reduced-motion`, locks scroll on `<html>` while visible.
  - `StepCarousel.tsx` — 4-step "how it works" walkthrough built on the WAI tab pattern (tablist/tabpanel, arrow-key
    navigation, prev/next buttons, spring-animated marker).
  - `CapabilityAccordion.tsx` — accessible disclosure rows (button-in-heading, `aria-expanded`/`aria-controls`)
    replacing the previous 12-card feature grid.
- `src/pages/Landing.tsx` rewritten (1214 → 765 lines). Section order is now: Hero → How it works (`#how`) →
  methodology/comparison → capabilities (`#features`) → security with simulated processing log (`#security`) →
  early-access feedback → pricing (`#pricing`) → interactive demo → FAQ (`#faq`) → final CTA (`#contact`) → footer.
  `StaggerChildren` and `ScrambleText` are no longer used on the landing page.
- `HeroSection.tsx` — eyebrow line + display headline where hierarchy comes from text opacity, not colour; four
  proof points set as one quiet line; decorative swirl SVG removed.
- `FreedomSection.tsx` — problems and solutions stored as pairs (`COMPARISON`) and rendered on the same grid row;
  external Webflow CDN icons removed; video marked `aria-hidden`.
- `BackgroundVideo.tsx` — stronger vertical scrim, left-side copy scrim with masked backdrop blur, film-grain overlay.
- `BeforeAfterSlider.tsx` — before/after labels hoisted outside the clipped panels so the "after" label is always visible.
- `PublicNavbar.tsx` / `PublicFooter.tsx` — text-role tokens (`text-fg-*`), `lp-focus` focus rings, logo subtitle hidden,
  desktop nav breakpoint moved from `md` to `lg`, footer headings changed from `h4` to `h3`.
- `FaceCloudLogo.tsx` — focus ring radius `rounded-xl` → `rounded-2xl`.
- `src/index.css` — four text-role CSS variables (`--fc-text-primary/secondary/muted/faint`), the `.lp-*` landing
  system (`.lp-section`, `.lp-shell`, `.lp-eyebrow`, `.lp-display`, `.lp-dim`, `.lp-focus`, `.lp-caret`),
  `.fc-btn-tier-secondary` button, glass panel radius 28px → 24px.
- `tailwind.config.ts` — `fg` colour roles, `display-sm / display / display-lg / display-xl` font sizes, `rounded-sm` = 8px.
- Design intent (from code comments): orange is reserved for the primary button, focus ring and boot progress bar;
  everything else is monochrome with hierarchy from size and opacity.

### 2026-08-05 — SEO & performance pass
*Status: committed `79d3b53`*
- Compressed hero videos (`facecloud-hero-reverse.mp4` 438 KB → 143 KB; new `facecloud-hero-forward.mp4` 149 KB) and
  added `facecloud-hero-poster.jpg`.
- Added `public/robots.txt` (disallows `/dashboard`, `/admin`, `/moderator`) and `public/sitemap.xml` (5 public URLs).
- `index.html`: canonical URL, description/keywords, Open Graph + Twitter Card tags, JSON-LD `Organization` and
  `FAQPage` schemas, theme colour, font preconnects. Fixed duplicate `<h1>` on the landing page.
- Added `@vercel/analytics` and mounted `<Analytics />` in `App.tsx`.

### 2026-08-04 — Dashboard cleanups
*Status: committed `0fe0748`, `0402679`*
- Removed duplicate quick actions from the user dashboard (`Dashboard.tsx`).
- Fixed the notification panel auto-close behaviour (`NotificationDropdown.tsx`, `Topbar.tsx`, `AppShell.tsx`).

### 2026-08-03 — Navigation, hero video loop, Vercel static assets
*Status: committed `3cab163`, `8411c59`, `258569b`, `171a111`*
- Mobile navigation menu rebuilt: solid panel, body scroll lock, z-index layering.
- Smooth scroll-to-top on route change (`ScrollToTop.tsx`) and exact top alignment for About/Contact/section anchors.
- Seamless "ping-pong" hero video: forward MP4 followed by a locally generated reversed MP4 (`BackgroundVideo.tsx`).
- `vercel.json` rewrite changed to `/((?!.*\.).*)` so requests with file extensions bypass the SPA fallback.

### 2026-08-02 — Site-wide rebrand to black / orange / monospace
*Status: committed `ce9ac01`, `fa60333`, `b602a08`, `801eb2b`*
- Design system rebranded across 63 files: pure black background, orange `#F97316` accent, Space Mono display
  headings, Silkscreen section numbers, JetBrains Mono code. Added `ScrambleText` animation component and
  sequential section reveal animations.
- Dashboard helper components and moderation stats aligned with the new orange/dark tokens.
- Contact page: real email addresses instead of placeholders; FAQ helper turned into an anchor link back to `/#faq`.
- Hero background video replaced.

### 2026-07-17 — User dashboard, moderator panel, group detail, SPA routing
*Status: committed `30ab68c`, `a15d0d2`, `1fa19e8`, `ff61a35`*
- User dashboard redesigned to remove backend-ops jargon; `UploadMultiple`, `UploadZip`, `Downloads`, `Settings`,
  `Login`, `Sidebar`, `ProtectedRoute` simplified.
- Moderator panel expanded (+1,900 lines): new `ModeratorAccessGate`, new pages `MemberManagement`, `BatchManagement`,
  `NotificationCenter`, `ReportsExports`; `ModeratorImageReview`, `ReviewQueue`, `ModeratorAudit` rewritten; mock data extended.
- `vercel.json` added with SPA rewrite so deep links work on reload.
- `IdentityGroupCard` thumbnail and a full `GroupDetail` page (all images in a person folder).

### 2026-07-16 — About & Contact pages, sticky header
*Status: committed `16aa489`*
- New `/about` and `/contact` pages, `PublicFooter` component, sticky `PublicNavbar` with scroll transitions,
  `FaceCloudLogo` switched to a transparent SVG variant.

### 2026-07-15 — Landing page redesign (v2)
*Status: committed `f4cc24b`, `e007b79`, `068d7a6`, `b10bd03`, `c97a038`, `49b5f15`, `4521477`, `4178951`*
- Real demo photo for the enhancement demo (`public/demo/facecloud-enhancement-demo-original.jpg`).
- Landing rebuilt with scroll animations, live pipeline loop, pricing tiers, FAQ accordion, API teaser, stats bar,
  use-case cards. New animation utilities: `CountUp`, `RevealOnScroll`, `StaggerChildren`.
- Double scrolling partner-logo marquee with hover pause, beta testimonials, face-scanning visual card; public
  admin-console entry points removed.
- Methodology section extracted into `FreedomSection.tsx` and themed.
- Interactive demo wrapped in a MacBook Pro style frame (`MacBookDemoFrame.tsx` + CSS).
- README updated with the new landing sections; empty commit to trigger Vercel with a verified git author.

### 2026-07-14 — Backend database foundation, branding, workspace rules
*Status: committed `b0b64da`, `a4dc3b7`, `ecd964a`, `d21f80b`, `48b16f6`*
- `backend/` created: `package.json` (Prisma 5.22, bcryptjs, ts-node), `prisma/schema.prisma` (15 models, 8 enums),
  `prisma/seed.ts` (user / admin / moderator), `tsconfig.json`; `docker-compose.yml` (PostgreSQL 16 + Redis 7);
  `.env.example`.
- Migration `20260714_init` applied and marked; database seeded; README §15 documents the live DB status.
- `.agents/AGENTS.md` git workflow rules added; remote switched to SSH.
- Official FaceCloud branding: 14 PNG assets in `public/branding/` (logo variants, favicons 16–512, apple-touch,
  social preview), `FaceCloudLogo` component, favicons wired in `index.html`, old `favicon.svg` removed.

### 2026-07-13 — Documentation baseline
*Status: committed `7440cda`*
- README rewritten as a full project analysis; `README_BACKEND_ROADMAP.md` created (architecture, schema, REST API
  plan, pipeline flow, AI model stack, security).

### 2026-07-13 — Initial import
*Status: committed `291142e` ("Revert age gender estimates and update README", 680 files)*
- Entire React SPA imported into git: 46 page files (public/auth, user, admin, moderator), 27 components, mock data,
  MediaPipe-based live webcam enhancement (age/gender estimation tested then removed as unreliable).
- Also imported: `reference-templates/aigocy/` (399 files) and `aigocy/` (182 files) — the third-party HTML template used
  as design reference — plus `aigocy.zip` (10 MB). See §7 for the cleanup note.

---

## 3. Work Timeline by Phase

| Phase | Dates | Theme | Outcome |
|:------|:------|:------|:--------|
| 0 | before 2026-07-13 | Initial build (pre-git) | Full mock-driven SPA with three portals and live enhancement |
| 1 | 2026-07-13 → 07-14 | Documentation + backend DB | README/roadmap, Prisma schema, migration, seed, Docker infra, branding |
| 2 | 2026-07-15 → 07-16 | Marketing site v2 | Landing redesign, animation utilities, About/Contact, sticky header |
| 3 | 2026-07-17 | Portals | User dashboard simplification, moderator panel expansion, group detail, Vercel SPA fix |
| 4 | 2026-08-02 → 08-05 | Rebrand + polish + SEO | Black/orange/mono design system, hero video loop, nav fixes, SEO, analytics |
| 5 | 2026-09-16 → 09-17 | Landing v3 attempt (discarded) | Monochrome landing system prototype; discarded uncommitted on 2026-09-17 |
| 6 | 2026-09-17 | Documentation | WORK_LOG.md, CLAUDE.md, Stop hook for automatic log updates |

---

## 4. Feature Inventory (what exists in the codebase)

**Routes (from `src/App.tsx`):**
- Public/auth (11): `/`, `/about`, `/contact`, `/login`, `/register`, `/signup`→`/register`, `/verify-email`,
  `/unauthorized`, `/admin/login`, `/moderator/login`, `*` (404).
- User `/dashboard` (16): index, `upload`, `upload/single`, `upload/multiple`, `upload/zip`, `processing/:id`, `images`,
  `images/:id`, `groups`, `groups/:id`, `downloads`, `notifications`, `activity`, `settings`, `live-enhancement`, `jobs`.
- Admin `/admin` (11): index, `users`, `audit-logs`, `security`, `api-docs`, `api-test`, `system`, `upload-statistics`,
  `rejection-summary`, `images`, `logs`→`audit-logs`.
- Moderator `/moderator` (9): index, `members`, `queue`, `images/:id`, `batches`, `notifications`, `reports`, `audit`, `settings`.

**Components (`src/components/`):** animation (4: CountUp, RevealOnScroll, ScrambleText, StaggerChildren) ·
branding (FaceCloudLogo) · features (9: ActivityTimeline, BeforeAfterSlider, EnhancementControls, IdentityGroupCard,
ImageCard, LiveEnhancementPanel, ProcessingTimeline, RejectionReasonChart, SystemHealthCard, UploadDropzone) ·
landing (FreedomSection, MacBookDemoFrame) ·
layout (7: AppShell, ModeratorAccessGate, PageHeader, ProtectedRoute, ScrollToTop, Sidebar, Topbar) ·
public (4: BackgroundVideo, HeroSection, PublicFooter, PublicNavbar) ·
ui (9: ChartCard, DataTable, EmptyState, GradientButton, NotificationDropdown, SearchInput, StatCard, StatusBadge, UserMenu).

**Auth model:** role-gated routes via `ProtectedRoute` / `ModeratorAccessGate`, session stored in `localStorage`
(`facecloud_session`). Mock data and types in `src/data/mock.ts`.

**Public assets:** `public/branding/` (14 files), `public/videos/` (forward/reverse hero MP4 + poster),
`public/demo/` (demo portrait), `public/hero-portrait.png`, `robots.txt`, `sitemap.xml`.

---

## 5. Backend Status

- **Stack:** PostgreSQL 16 (Docker) + Prisma ORM 5.22 + ts-node seed. Redis 7 container defined but unused.
- **Schema (`backend/prisma/schema.prisma`)** — 15 models: `User`, `Session`, `Upload`, `Image`, `DetectedFace`,
  `ImageQualityCheck`, `FaceEmbedding`, `PersonFolder`, `PersonFolderImage`, `ProcessingJob`, `ProcessingStep`,
  `Notification`, `ActivityLog`, `AdminAuditLog`, `ModeratorReview`. 8 enums: `Role`, `UserStatus`, `JobStatus`,
  `QualityStatus`, `ReviewStatus`, `RiskLevel`, `NotificationType`, `StepStatus`.
- **Migrations:** `20260714_init` (applied 2026-07-14).
- **Seed:** `npm run seed` in `backend/` creates the three role accounts (bcrypt-hashed password `password`).
- **Not built yet:** API gateway, JWT auth, upload presigning, S3/R2 storage, BullMQ queue, Python AI workers,
  email delivery, frontend API client. The frontend still talks to nothing.

---

## 6. Pending / Uncommitted Work (as of 2026-09-17)

- None. Working tree is clean after the 2026-09-17 documentation commit.
- Open product question carried over from the discarded v3 work: the fifth problem/solution pair in the methodology
  section does not match (problem: inconsistent approval decisions; solution: multi-folder assignment).

---

## 7. Known Issues / Tech Debt

- `aigocy.zip` (10 MB), `reference-templates/aigocy/` (399 files) and `aigocy/` (182 files) are tracked in git; they
  bloat the repo and are not used by the app.
- JS bundle is 2.28 MB minified with no route-level code splitting (Vite warns on every build).
- `README.md` §6 lists only 5 moderator routes; the app has 9. README section numbering skips §19.
- `docker-compose.yml` defaults the database name to `facecloud_db` while README §15 uses `facecloud` in `DATABASE_URL`;
  confirm which one the local `.env` uses.
- No automated tests, no accessibility audit, no real email/API integration (all listed as future work in README §18).
- Vite 8 / rolldown chunk warning: consider `build.chunkSizeWarningLimit` or dynamic imports for portals.

---

## 8. How to Add an Entry

Copy this block to the **top of Section 2**, then update §1 / §4 / §5 / §6 / §7 if the status changed, and bump
"Last updated" at the top of the file.

```markdown
### YYYY-MM-DD — Short title
*Status: uncommitted | committed <hash>*
- What changed and why (one bullet per logical change).
- Files touched: `path/one.tsx`, `path/two.ts`.
- Verification: `npm run build` result / manual check.
```
