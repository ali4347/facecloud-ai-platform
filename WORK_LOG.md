# FaceCloud — Work Log & Project Documentation

> **Purpose:** this is the single running record of *everything that has been done* on the FaceCloud FYP project.
> Detailed feature/route docs live in [README.md](./README.md); the backend blueprint lives in
> [README_BACKEND_ROADMAP.md](./README_BACKEND_ROADMAP.md). This file records **what was done, when, and what state things are in.**
>
> **Update rule:** every task that changes code, config, assets, database schema or docs must add a dated entry to
> **Section 2 (Change Log)** and refresh any affected status section, in the same sitting as the work.
> (Enforced for Claude Code by `CLAUDE.md` and the Stop hook in `.claude/hooks/check-work-log.sh`.)

**Last updated:** 2026-10-01
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
| Branding + design system | ✅ Done | Orange `#F97316` is the brand accent everywhere, in both appearances. The whole site — marketing pages, auth screens and the three dashboards — switches between dark (default) and light from one setting on `<html data-theme>`. Public pages keep the monospace display face and glass panels; the dashboards use a flatter card layout (`.fc-app`, Inter headings) |
| SEO + analytics | ✅ Done | Meta/OG/Twitter tags, JSON-LD (Organization, FAQPage), robots.txt, sitemap.xml, Vercel Analytics |
| Deployment | ✅ Hostinger | `facecloudai.com` is served from Hostinger (Apache/LiteSpeed), by manual upload of `dist/`. SPA routing comes from `public/.htaccess`, which ships inside every build. `vercel.json` is kept for Vercel but has no effect on the live host |
| Backend database (PostgreSQL 16 + Prisma 5.22) | ✅ Schema + migration + seed | 15 models, 8 enums, migration `20260714_init`, 3 seeded accounts |
| Backend API server (NestJS/Express) | ❌ Not started | Planned in README_BACKEND_ROADMAP.md §3 |
| Queue (Redis + BullMQ) / AI workers (Python) | ❌ Not started | Redis container exists in `docker-compose.yml`, nothing consumes it |
| Tests (unit / e2e) | ❌ None | Listed as future work |
| Build health | ✅ `npm run build` passes (checked 2026-09-18) | JS bundle 2.31 MB minified / 625 kB gzip, CSS 94.8 kB; chunk-size warning, no code splitting. Lint reports warnings only |

**Tooling:** `npm run dev` (Vite, port 5173) · `npm run build` (`tsc -b && vite build`) · `npm run lint` (oxlint) ·
backend: `cd backend && npm run seed` / `npx prisma studio` · infra: `docker compose up -d`.

**Mock logins (frontend and seeded DB, password `password`):** `user@facecloud.ai` · `admin@dtm.io` · `moderator@facecloud.ai`.

---

## 2. Change Log (newest first — add new entries at the top of this list)

Format: `### YYYY-MM-DD — short title` · status (`committed <hash>` / `uncommitted`) · what changed · files.

### 2026-10-01 — Topbar icons wired up, and avatars you can actually change
*Status: committed (this commit)*
- The topbar's **activity history** icon did nothing. It is now a link to the trail that belongs to the signed-in
  role: `/dashboard/activity`, `/admin/audit-logs` or `/moderator/audit`.
- Removed the topbar's **settings** icon. It was decorative chrome copied from the reference, and Settings is
  already reachable from the sidebar and the user menu.
- **"Change avatar" works.** Opening it offers nine colour presets or an upload of your own photo, and the choice
  shows up immediately in the topbar, the sidebar account card and Settings.
  - New `src/lib/avatar.ts` holds the presets, the per-account storage and a `useAvatar` hook that keeps every
    surface in step, the same pattern the appearance toggle uses.
  - New `src/components/ui/Avatar.tsx` is the single rendering, so the three places that drew an avatar by hand no
    longer each have their own copy.
  - An uploaded photo is centre-cropped square, downscaled to 256px and encoded as JPEG **before** it is stored. A
    phone photo would otherwise fill the ~5 MB localStorage quota on its own; a 99 KB test image came out at 12 KB.
  - Rejects non-images and anything over 8 MB with a message rather than failing silently, and "Reset" returns the
    account to its role colour.
  - Avatars are keyed by email, so signing in as someone else does not inherit the previous person's picture.
- Verified in the running app: the history link target, the settings icon being gone, picking a preset, and
  uploading a real photo end to end.

### 2026-10-01 — Moderator gate: login redirect, backdoor removed, follows the appearance
*Status: committed (this commit)*
- With the `.htaccess` fix deployed, `/moderator` reached the app and showed **Access Denied with only a "Back to
  Home Page" button** — a moderator typing the URL had no way in short of guessing `/moderator/login`. The gate now
  splits three ways:
  - no session → redirect to `/moderator/login`, the way `/admin` already behaved
  - signed in as another role → Access Denied, plus a "Sign in as moderator" action so switching is deliberate
  - suspended moderator → Access Denied with the deactivation message and no login action, since it would not help
- **Removed the `?dev_login=moderator` backdoor.** Opening `/moderator?dev_login=moderator` minted a full moderator
  session for anyone, with no password — which defeated the role separation added earlier the same day. The URL now
  simply lands on the moderator login.
- The gate was pinned to the dark palette while the rest of the site follows the appearance; it now uses the tokens.
- Fixed the moderator sign-in button, which had a mint-to-orange gradient left over from the palette work. It now
  matches the admin and user buttons.
- Verified all three gate outcomes plus the old backdoor URL against the running app.

### 2026-10-01 — Fixed deep links 404ing on the live site
*Status: committed (this commit)*
- Every URL except `/` returned the host's own 404 page on `facecloudai.com` — `/admin`, `/dashboard`, `/login`, all
  of them. Clicking through the app worked, because React Router handles those moves in the browser; only a typed
  URL or a refresh reached the server.
- **Cause: the live site is not on Vercel.** The response headers say `platform: hostinger` / `server: hcdn`, so
  `vercel.json` was never being read. Nothing on the server rewrote unknown paths to `index.html`.
- Added `public/.htaccess` for Apache/LiteSpeed. Vite copies `public/` into `dist/`, so it ships with every build.
  It serves real files untouched, hands every other path the app shell, and deliberately lets a request that looks
  like a static file 404 on its own — a missing bundle should report as missing rather than come back as HTML, which
  the browser then reports as a confusing MIME type error. It also stops `index.html` being cached, since it names
  the hashed bundles.
- Verified by serving the real `dist/` through a local Apache with the file in place: `/admin`, `/dashboard`,
  `/moderator`, `/admin/login` and a nested route all return the app shell with 200; real assets keep their MIME
  types; a missing asset returns 404; `robots.txt` still serves as text.
- Corrected README §16 and the status table above, which both claimed Vercel.

### 2026-10-01 — Staff portals are link-only; the dashboard shows the real signed-in user
*Status: committed (this commit)*
- **Removed every way to switch role from the interface.** The user menu carried a "Switch Role (Demo)" block with
  User / Admin / Moderator buttons, so anyone signed in as a user could walk into the other portals. It is gone; the
  menu is now the profile, Settings and Logout.
- The user login page advertised "Admin Portal" and "Moderator Portal" beneath the form. Both links removed, leaving
  only Home. The two staff login pages also cross-linked each other; those are gone too.
- The portals are still reachable **by direct link** — `/admin` and `/moderator` — which is how staff get in:
  - no session → the matching staff login (`/admin/login`, `/moderator/login`)
  - signed in with a different role → Access Denied, which is what stops a user from crossing over
- **Fixed a real bug the screenshots exposed:** the dashboard greeted "Welcome back, Ali Hassan" while the signed-in
  person was someone else, and the Settings profile showed the same baked-in name, email and initials. Both now read
  the session.
- Added `src/lib/session.ts` as the single source of truth for the signed-in identity, with a per-role fallback, and
  pointed the topbar, sidebar, dashboard greeting and Settings at it. The topbar and sidebar had each carried their
  own copy of the parsing logic.
- Verified against the running app: the user menu, the login page, `/admin` with no session, and `/admin` while
  signed in as a user.

### 2026-09-18 — Light-appearance contrast fixes on the marketing pages
*Status: committed (this commit)*
- A full-page capture of the light home page showed sections that were still dark or unreadable. Fixed:
  - **Blocks that should stay dark** now say so. New `.on-dark` class re-declares the dark token values locally, so
    everything inside it resolves the way it does in the dark appearance without a second rule set. Applied to the
    live security log, the API request sample, the methodology band (it wraps dark footage, like the hero) and the
    hero chrome. Before this, those blocks kept a dark background while their text turned dark — invisible.
  - **Body copy moved off translucent ink.** `text-ink/40` reads fine as white on black but washes out as black on
    white, so the marketing pages now use the tuned neutral ramp (`text-ink-soft` / `-mute` / `-faint`) that the
    dashboards already use. Better in both appearances.
  - **Two invisible controls.** The Free and Basic pricing buttons and the Contact form inputs kept `text-white` on
    a near-white surface; they now use the ink token.
  - Cleaned up fourteen malformed double-opacity classes (`bg-ink/[0.04]/50`) left by the earlier colour pass, which
    Tailwind silently dropped, leaving those panels with no background at all.
- Verified by driving the running app through the DevTools protocol: scrolled the whole page so every reveal
  animation had fired, then captured the methodology, security, features, pricing and contact sections in both
  appearances.

### 2026-09-18 — Appearance switch extended to the whole site
*Status: committed (this commit)*
- The light/dark switch now covers the marketing pages, the auth screens and the error pages, not just the
  dashboards. One setting drives everything: `<html data-theme>`, stored under `facecloud_theme`, dark by default.
- The appearance tokens moved from the app shell to `:root`, so every page resolves the same `ink` / `line` /
  `surface` / `accent` names. `html[data-theme='light']` redefines them and `html[data-theme='light'] .fc-app`
  carries the few shell-specific differences.
- Added a second set of variables (`--s-*`) for the marketing surfaces, which keep their glass treatment: panel,
  border, pill, blur, glow and shadow each have a dark and a light value. The base component classes
  (`.fc-panel`, `.fc-input`, `.fc-btn-*`, `.badge-muted`, `.fc-table`, `.glass-pill`, `.liquid-glass`, `.fc-app-bg`)
  now read those instead of hardcoded translucent white, so they follow the switch without a second rule set.
- Converted the colour literals in twelve marketing and auth files. The useful trick: `ink` is white in dark and
  near-black in light, so `*-white/N` became `*-ink/N` and kept its exact current look in dark while inverting
  correctly in light.
- New `.glass-media` class for chrome that floats on the hero video — the navbar pill, the "Get Started" button and
  the hero's feature pills. That footage is dark in both appearances, so those surfaces stay dark on purpose. The
  navbar tracks this with an `onMedia` flag: white text at the top of the home page, token colours once it docks or
  on any other page.
- The auth screens painted their own black ground; that now resolves from the same token, and their logos use the
  token tone so the wordmark does not disappear on white.
- A toggle sits in the public navbar as well as the dashboard topbar; `useAppearance()` in `src/lib/theme.ts` keeps
  them in step, and `main.tsx` paints the stored choice before React mounts so there is no flash.
- Verified by rendering the home page, About, Contact, the login screen and the user dashboard in both appearances.

### 2026-09-18 — Dashboard appearance switch (dark and light both work)
*Status: committed (this commit)*
- The topbar's appearance button is now a real toggle. It switches the shell between the dark and the light
  appearance, remembers the choice per browser in `localStorage` under `facecloud_theme`, and shows a sun in dark
  and a moon in light. **Dark stays the default**, matching the marketing site.
- Both appearances share one set of token names, so no component has two sets of rules. The tokens moved from fixed
  hex values to CSS variables holding channel triples — `rgb(var(--a-ink) / <alpha-value>)` — which keeps Tailwind's
  opacity modifiers (`bg-accent/20`, `text-ink-mute/60`) working. `.fc-app` defines the dark values and
  `.fc-app[data-theme='light']` redefines the same names.
- Orange is the accent in **both** appearances; it is the brand colour, not a dark-mode affordance. On white it is
  deepened to `#EA580C` so it does not read as thin. Only the neutrals and shadows differ between appearances.
- Converted the neutral colour literals still baked into 26 dashboard files (`#0E0F12`, `rgba(255,255,255,…)` and the
  black shadow rgba values) to the same variables, so those surfaces follow the switch too. Scrims over photos were
  left dark on purpose.
- Status colours get a light-appearance override block: the 12% tints that work on a dark card need the dark end of
  each ramp on white.
- The logo's app tone now uses brand orange for the mark instead of the indigo left over from the earlier light
  palette, and the tone is named `app` rather than `light` since it serves both appearances.
- New file `src/lib/theme.ts` holds the stored-appearance helpers.
- Verified by running the app and rendering the user dashboard in both appearances, plus the admin overview in light.

### 2026-09-18 — Dashboard switched to the site's black and orange palette
*Status: committed (this commit)*
- The owner asked for the dashboards to be dark and to use the website's orange with white, so the light palette
  introduced earlier today was replaced. **The layout from that restyle is unchanged** — stacked sidebar cards, the
  ⌘K search, round topbar buttons, flat cards, segmented controls and Inter headings all stay.
- Only the values behind the tokens changed, so no dashboard page needed restyling a second time:
  `ink` is now white at four opacities, `line` white hairlines, `surface` `#0E0F12` cards on a `#000000` page, and
  `accent` the brand orange `#F97316` / `#FB923C` / `#EA580C`. Shadows became dark drops instead of soft grey ones.
- `src/index.css`: the scoped block was rewritten and renamed `.fc-light` → `.fc-app`, since the scope is the app
  shell rather than a light theme. Primary buttons are the orange gradient with white text, inputs and table headers
  sit on `#16181C`, badges are 12% colour tints, and the active sidebar row is a lifted panel with an orange marker.
- Converted the colour literals that the light pass had baked into 54 dashboard files back to the dark palette, and
  lifted status text to the light end of each ramp (emerald/red/violet/amber 400s) so it stays legible on black.
- `AppShell` no longer repaints `document.body` — the body is already black site-wide.
- Verified by running the app: user dashboard, single-upload page and moderator queue all render dark with orange
  accents, and the public landing page is byte-for-byte unaffected by the scope. `npm run build` passes.

### 2026-09-18 — Dashboard interface restyled to a light theme (superseded the same day)
*Status: committed (this commit)*
- Reskinned the three authenticated dashboards (user, admin, moderator) to the light interface style the owner
  supplied as a reference: white cards on a light grey page, hairline borders, close soft shadows, large corner radii,
  indigo `#4F46E5` reserved for action and active state, Inter instead of the monospace display face.
- **Styling only.** No route, nav item, feature, copy, mock data or behaviour was changed anywhere.
- **Scoped, not global.** The shell root carries a `.fc-light` class; `src/index.css` re-declares the shared component
  classes (`.fc-card`, `.fc-panel`, `.fc-input`, `.fc-btn-*`, `.fc-table`, `.badge-*`, `.sidebar-item*`,
  `.upload-dropzone`) inside that scope. Public marketing pages, the three login pages and the moderator
  access-denied screen are outside it and still render the black / orange theme.
- `tailwind.config.ts`: added light-theme tokens — `ink` / `ink-soft` / `ink-mute` / `ink-faint`, `line` (+ soft,
  strong), `surface` (+ soft, mute, sunk), `accent` (+ soft, deep, tint) — and `shadow-soft / soft-md / soft-lg / pill`.
- `src/index.css`: added the scoped light block plus three new building blocks used by the shell — `.fc-seg`
  (segmented control), `.fc-icon-btn` (round topbar button) and `.fc-kbd` (the ⌘K chip).
- Rewritten by hand: `AppShell` (light ground, repaints `document.body` while mounted so overscroll is not black),
  `Sidebar` (stacked white cards: brand, navigation with a raised white pill for the active row, model status,
  account card with logout), `Topbar` (⌘K-focusable search, round icon buttons), `PageHeader`, and the shared
  components `StatCard`, `ChartCard`, `DataTable`, `StatusBadge`, `SearchInput`, `EmptyState`, `GradientButton`,
  `UserMenu`, `NotificationDropdown`.
- `FaceCloudLogo`: added an optional `tone` prop (`dark` default, `light` for the shell) and gave each instance
  unique SVG gradient ids, so two logos of different tones on one page cannot share one `<defs>`.
- Converted 50 dashboard page and feature files by script: dark utilities to the new tokens, brand hex and `rgba()`
  values remapped, and a second pass for the Tailwind config aliases (`primary`, `mint`, `pink`, `sky`, `violet`,
  `orange`, `purple`) that the 2026-08 rebrand had pointed at orange. White text was kept wherever it sits on a
  coloured button or a scrim over a photo.
- The sidebar account card now reads the signed-in person from the session and uses the same per-role avatar colour
  as the topbar menu, instead of a hardcoded name and a fixed indigo dot.
- Verification: Node 26.8.2 was installed with Homebrew to restore the toolchain (it had gone missing from the
  machine). `npm run build` succeeds, `tsc -b` is clean, and `npm run lint` reports warnings only. The running dev
  server was driven with headless Chrome and the user dashboard, upload centre, admin overview, rejection summary,
  moderator dashboard and review queue were each rendered and checked against the reference.

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
| 7 | 2026-09-18 | Dashboard interface | New shell layout for the three portals, first in a light palette, then switched to the site's black and orange |

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

**Design scopes:** one palette site-wide — black, orange `#F97316`, white text. Public marketing pages use the
monospace display face and glass panels; everything inside the authenticated `AppShell` uses the flatter card layout
scoped under `.fc-app` (see the 2026-09-18 entries).

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
- `npm run lint` scans `reference-templates/` and `aigocy/` as well, so its output is dominated by thousands of
  warnings from a vendored jQuery copy. Add an oxlint ignore for those directories, or delete them (see §6).
- Deployment is a manual upload, and `.htaccess` is a hidden file that most file managers do not show. If a deploy
  drops it, every deep link breaks again with the host's 404 page.
- Avatars live in this browser's `localStorage`, so they do not follow the account to another device and are lost
  if site data is cleared. They move to the server with the rest of the profile once the API exists.
- Role separation is enforced in the browser only, against a `localStorage` session. That is appropriate for the
  current mock build, but once the API exists the checks have to move server-side — a determined visitor can still
  hand-write a session object today.
- The appearance choice is stored per browser and does not follow the operating system setting, so a visitor who
  prefers light has to click once. Wiring it to `prefers-color-scheme` on first visit would remove that step.
- The hero video is dark in both appearances, so the top of the home page stays dark even in the light appearance,
  as do the methodology band and the two terminal panels (all marked `.on-dark`). That is deliberate — they wrap
  dark footage or imitate a console — but it means the light home page opens on a dark screen before the rest
  lightens.
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
