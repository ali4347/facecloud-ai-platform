# FaceCloud — Work Log & Project Documentation

> **Purpose:** this is the single running record of *everything that has been done* on the FaceCloud FYP project.
> Detailed feature/route docs live in [README.md](./README.md); the backend blueprint lives in
> [README_BACKEND_ROADMAP.md](./README_BACKEND_ROADMAP.md). This file records **what was done, when, and what state things are in.**
>
> **Update rule:** every task that changes code, config, assets, database schema or docs must add a dated entry to
> **Section 2 (Change Log)** and refresh any affected status section, in the same sitting as the work.
> (Enforced for Claude Code by `CLAUDE.md` and the Stop hook in `.claude/hooks/check-work-log.sh`.)

**Last updated:** 2026-10-27
**Repository:** `git@github.com:ali4347/facecloud-ai-platform.git` (branch `main`)
**Live site:** https://facecloudai.com (Hostinger, manual upload of `dist/`)

---

## 1. Project Snapshot (current state)

FaceCloud is an AI facial-image platform: low-light enhancement (Zero-DCE), face detection and quality validation,
identity grouping into "person folders", secure downloads, plus admin and moderator consoles. Powered by DATAMART / DTM.IO.

| Area | Status | Notes |
|:-----|:-------|:------|
| Frontend SPA (React 19 + Vite 8 + TypeScript + Tailwind 3 + Framer Motion) | ✅ Complete prototype | All portals work on mock data + `localStorage`; no real API calls |
| Public marketing site (Landing, About, Contact) | ✅ Live | Landing v2 design (2026-08-05 state); a v3 redesign attempt was discarded on 2026-09-17 |
| User portal (16 routes under `/dashboard`) | ✅ Complete | Every screen runs on the live API (live webcam enhancement: a captured frame is stored and enhanced for real; the live preview itself is browser filters) when `VITE_USE_API=true`: upload (single, multiple, ZIP), processing, My Images, Person Folders, Downloads, Activity, Notifications (+ top-bar bell), top-bar search and Settings (name, password, sign-out-everywhere, notification switches). Profile extras, picture and a device list are built against backend PR #67 (fall back gracefully until it is merged) |
| Admin console (11 routes under `/admin`, 2 pages deliberately unrouted) | ✅ Connected to the live API (2026-10-18) | Overview, Users, Moderators, Audit Logs, Security (acknowledge), System Monitoring, Upload Statistics, Rejection Summary, Image Monitoring read the backend behind `VITE_USE_API`; demo data otherwise |
| Moderator panel (11 routes under `/moderator`) | ✅ Complete | Dashboard and review queue run on the live API (deadlines, claim lock, bulk decisions, team performance, and the photo under review as a thumbnail); image review, members, batches, notifications, reports, audit and settings are still on mock data |
| Branding + design system | ✅ Done | **2026-10-26: the app shell is the "Glassy Dashboard V2" look (room ground, frosted icon rail / top bar / scrolling bottom pill / stage / cards), approved by the owner.** Orange `#F97316` is the brand accent everywhere, in both appearances. The whole site — marketing pages, auth screens and the three dashboards — switches between dark (default) and light from one setting on `<html data-theme>`. Public pages keep the monospace display face and glass panels; the dashboards use a flatter card layout (`.fc-app`, Inter headings) |
| SEO + analytics | ✅ Done | Meta/OG/Twitter tags, JSON-LD (Organization, FAQPage), robots.txt, sitemap.xml |
| Deployment | ✅ Hostinger | `facecloudai.com` is served from Hostinger (Apache/LiteSpeed), by manual upload of `dist/`. SPA routing comes from `public/.htaccess`, which ships inside every build. Vercel was dropped entirely on 2026-10-08 |
| Backend | ✅ Separate Django project | [FaceCloud_backend](https://github.com/ijaz-student021/FaceCloud_backend) — Django 6 + DRF, 180 endpoints, 43 models, **1172 tests**, all merged to `main`, CI with pip-audit and bandit across every app. Moderator queue operations (deadlines, claim lock, bulk decisions, performance metrics, and org-scoped access to the photo under review) added 2026-10-02. This repo is the browser app only |
| Frontend ↔ backend integration | 🔄 In progress | Sign-in, the moderator dashboard and queue, and the user portal's upload → processing → images chain read the live API behind `VITE_USE_API`; the remaining screens still read `src/data/mock.ts` |
| Queue (Redis + BullMQ) / AI workers (Python) | ❌ Not started | Redis container exists in `docker-compose.yml`, nothing consumes it |
| Tests (unit / e2e) | ❌ None | Listed as future work |
| Build health | ✅ `npm run build` passes (checked 2026-09-18) | JS bundle 2.31 MB minified / 625 kB gzip, CSS 94.8 kB; chunk-size warning, no code splitting. Lint reports warnings only |

**Tooling:** `npm run dev` (Vite, port 5173) · `npm run build` (`tsc -b && vite build`) · `npm run lint` (oxlint) ·
backend: `cd backend && npm run seed` / `npx prisma studio` · infra: `docker compose up -d`.

**Mock logins (frontend and seeded DB, password `password`):** `user@facecloud.ai` · `admin@dtm.io` · `moderator@facecloud.ai`.

---

## 2. Change Log (newest first — add new entries at the top of this list)

Format: `### YYYY-MM-DD — short title` · status (`committed <hash>` / `uncommitted`) · what changed · files.

### 2026-10-27 — Liquid-glass chrome: the bars are thick glass and the current tab is a lens that springs and can be dragged
*Status: committed (this commit).*

- **Asked by the owner** with iOS 26 / WhatsApp "Liquid Glass" screenshots as the reference: the dashboard chrome should feel like that glass, with the selected tab a lens that slides.
- **Material** (`src/index.css`, `.fc-liquid`, and the same recipe on `.fc-glass-bar`, `.fc-rail`, `.fc-popover`): a strong blur with saturation and a touch of contrast, a sheen across the top where the light catches the glass, a bright rim on the lit edge and a shaded rim on the far one, a deeper drop shadow. New tokens `--l-*` per appearance. `prefers-reduced-transparency` makes it solid; `prefers-reduced-motion` removes the bounce and the press scale.
- **Lens** (`.fc-lens`): brighter glass with its own rim, a slight magnification/saturation of what is under it (`backdrop-filter` of 1 px blur, brightness 1.12) and a faint colour fringe on the edge (a 1 px conic gradient through a mask). In the bottom pill it is one element positioned by motion values (`FloatingNav.tsx`): on a route change it springs to the new section from wherever it is (interruptible: a second change mid-flight re-targets without a jump; `bounce 0.22`, `duration 0.5`); it can be **dragged** along the pill 1:1 (pointer capture, the grab offset respected, rubber-banding past the ends) and on release flies with the finger's momentum (UIKit's projection, deceleration 0.998) to the nearest section and opens it; the release velocity is handed to the spring so there is no seam. In the rail the lens is a shared-layout element (`layoutId`) that morphs between icons. Tabs scale to 0.95 on pointer-down (feedback on the press, not the release).
- **Owner's correction, same day:** the first version blurred the current tab's name (the lens sat over it with a 1 px blur) and in the light appearance bar, lens and ground were all near-white, so nothing read as glass. Now the lens sits under the name with no blur (the name stays crisp), the drag starts from the current name itself (6 px hysteresis, so a press that never moved stays a click, and the click that ends a drag is swallowed), and the light material has a smoky tint, a dark edge, a shaded lower rim and a real shadow under the lens.
- **Owner's second note (dark was right, light still was not glass):** a light-only block gives the material a more see-through fill (30 % white) with stronger backdrop saturation and contrast so the colours behind show through, a thicker lit upper edge and a darker far edge, an inner glow, a grey ring and deeper shadow on the lens, a brighter colour fringe, and ink-dark tab names. The dark appearance is untouched. **Third pass** (the owner still saw no glass on Admin Overview, where nothing colourful sits behind the pill): on a pale ground the light material now carries its own shape, independent of what is behind it — a reflection band across the top and a shade along the bottom (a convex slab, `::before`), a rim running from lit to shaded (`::after`, masked gradient border), and the lens a convex white blob with a shaded lower edge and a deeper shadow.
- **Nothing functional changed:** the links are the same `NavLink`s; a plain click navigates as before; the drag is additive. Cards and the stage keep the earlier frosted look.
- **Verified:** `npx tsc -b`, both builds; on the local server as admin: a click moves the lens to the new section (337 → 550 px, route changed); a drag of the lens followed the pointer (338 → 602 px) and a flick landed it on "Security" and opened `/admin/security`; a plain click on "Overview" still opens `/admin`; screenshots of the pill and the rail in both appearances; no console errors.

### 2026-10-26 — Account settings (name, password) for the administrator and the moderator
*Status: committed (this commit).*

- **Asked by the owner:** the admin and moderator dashboards had no profile settings; the administrator's account menu offered only Logout.
- **New shared component** `src/components/auth/AccountSettings.tsx`: a Profile card (full name, saved through `PATCH /api/user/profile/` and reflected in the session) and a Password card (current / new / confirm, through `POST /api/user/change-password/`; on success the portal signs out to its own sign-in page with a notice, as the backend ends every session). Same endpoints the user portal's Settings already uses; they serve any signed-in account. In the demo build the name is kept in the session and the password form says it cannot change there.
- **Administrator:** new page `src/pages/admin/AdminSettings.tsx` at `/admin/settings`, a "Settings" entry at the end of the admin navigation (rail, drawer and bottom pill), and the account menu's Settings row now exists for the admin too (`UserMenu.tsx`).
- **Moderator:** the two cards join the existing `/moderator/settings` page (live and demo), below the preferences and the device list.
- **Verified:** `npx tsc -b`, both builds; on the local server: the admin page renders; a name saved there comes back from `/api/user/profile/` and appears in the top bar at once; a wrong current password is refused in words on the page; the account menu offers Settings and Logout; the moderator page shows the two cards; no console errors.

### 2026-10-26 — The approved FaceCloud logo everywhere (assets cut from the approved files; nothing redrawn)
*Status: committed (this commit).*

- **Sources.** The owner supplied the approved main logo (transparent PNG, 1983 × 793, the stacked lockup) and the identity showcase (logo on white and on black, six app-icon tiles). Both were measured, not eyeballed: the main file has real transparency; the icon and the wordmark meet at row 534 (the top of the "d" of Cloud minus 4 px), and the "C" of Cloud touches the cloud there, so that is where the two halves were cut.
- **Assets, all in `public/branding/` with the old file names kept where `index.html` points at them** (every old file replaced by a cut or a scaling of the approved artwork; none deleted): stacked logo light/dark (`-full`, `-light`, `-dark`), icon light/dark, wordmark light/dark, horizontal lockup light/dark (icon beside wordmark, wordmark at the stacked logo's height ratio 0.41, gap 12 % of the icon's height; this lockup is a composition of the two approved halves, because no horizontal lockup was supplied and a 36 px bar cannot hold the stacked one), favicons 16/32/48/192/512 (transparent), apple-touch-icon 180 (on white), social preview 1200 × 630 (dark logo on black), and the delivered main file as `facecloud-logo-original.png`. The dark treatment comes from the showcase's black panel keyed to transparency from its own brightness (so the approved glow survives and the dark-grey "Face" reads on dark grounds). The showcase collage itself is not used as a logo.
- **Component.** `FaceCloudLogo.tsx` no longer draws an SVG and types the name: it renders the approved images (stacked / horizontal / icon / wordmark) with intrinsic sizes, scaled by height only (never stretched), both treatments in the page and the stylesheet showing the one that matches the appearance (`.fc-logo-on-light` / `.fc-logo-on-dark`, `src/index.css`); `tone="dark"` forces the dark treatment (the navbar over the hero footage). Props, call sites and routes unchanged; "AI Platform" and the role label stay as text under the stacked logo on the sign-in pages. The rail's icon is one size smaller because the mark is wider than it is tall; the public navigation's lockup is 36 px. After the owner's review (too big everywhere, wordmark sitting high): the stacked logo on the sign-in pages went from 112 to 84 px, and in the horizontal lockup the wordmark is now centred on the cloud's own middle (60 % of the box) instead of the box's middle, because the floating pixels raise the box above the cloud.
- **Pages reached** (all through the one component, no page edited): public navigation and its phone menu, footer, user / admin / moderator sign-in, sign-up, verify-email, invitation, password recovery (AuthShell), the dashboard rail and the phone drawer of all three portals; the browser tab (favicons), home-screen icon and link previews through `index.html`.
- **Verified:** `npx tsc -b`, `npm run build`, `VITE_USE_API=false VITE_API_URL= npm run build`; screenshots on the local server: public navigation over the hero (dark lockup, 36 px) and scrolled in light (light lockup), admin sign-in light (stacked light, 191 × 112 px), user sign-in dark (stacked dark), the rail (icon 35 × 20 px) in both appearances, the phone drawer (horizontal lockup); every image loaded at its intrinsic size and was scaled by height only; the favicon, apple-touch and social-preview files answer 200; no console errors or failed requests.

### 2026-10-26 — Demo sign-in pages no longer hand out their credentials
*Status: committed (this commit).*

- **Found by the owner on the demo build** (`VITE_USE_API=false`, which is what the live site runs): the three sign-in pages came **pre-filled** with the demo email *and* password, and a wrong attempt answered "Invalid credentials. Use admin@dtm.io / password" — so anyone who opened `/admin/login` was one click from the console.
- **Fix:** `Login.tsx`, `AdminLogin.tsx`, `ModeratorLogin.tsx` start empty in both modes and a wrong attempt says only "Invalid email or password." The demo accounts themselves are unchanged and still documented in `README.md` (§ demo accounts) for the owner.
- **Verified** on the demo build with `vite preview` and headless Chrome: all three pages open empty, a wrong attempt shows the new sentence and names no account, and the documented demo sign-in still reaches `/admin`, `/moderator` and `/dashboard`. `npx tsc -b`, both builds.
- **Still the owner's call:** demo mode holds no real data, but the demo password is the word "password" and sits in the README; if the repository is public, changing it (one line in each of the three files) is the only way to keep strangers out of the demo console.

### 2026-10-26 — "Glassy Dashboard V2" redesign of the app shell (visual only; running locally, not pushed)
*Status: committed (this commit), after the owner checked it on localhost:5173 and approved it.*

- **What changed, in one sentence:** every signed-in screen (user, admin, moderator) now sits on a warm "room" ground (beige-to-brown wash, blurred wood pillars, shelf and floor, three slow light blobs) with frosted-glass chrome, as in the reference: a floating **icon rail** on the stage's left edge (each icon names itself on hover; the account avatar at its foot opens the menu to the right), a floating top bar with a plain "Welcome, <name>" greeting (and the team's name for a moderator), a floating bottom pill with **every** section by name (it scrolls sideways inside the same-sized pill, no scrollbar, and brings the current section into view) and a white "+" (Upload) for a member, one large glass "stage" sheet holding the page, and glass cards inside it — orange accent and logo unchanged, in both appearances. The owner's second review asked for this: the first version had a full labelled sidebar *and* the pill, which duplicated the navigation.
- **How it reaches every page without touching them:** a skin layer in `src/index.css` scoped to `.fc-app`: new glass tokens (`--g-*`) beside the appearance tokens (now warm neutrals), and the shared classes the pages already use re-coloured (`.fc-card`, `.fc-input`, `.fc-btn-*`, `.fc-table`, badges, and the `bg-surface*` utilities with their hover variants). Pages keep their markup and logic; no route, API call, form or handler changed.
- **Blur is spent where it matters:** only the chrome that content scrolls under (sidebar, top bar, bottom pill, popovers, dialogs) uses `backdrop-filter`. The stage and the cards are translucent without blur, because a `backdrop-filter` would make each card the containing block of any `position: fixed` dialog rendered inside it (the bug of 2026-10-22 again) and the ground behind them is already soft.
- **Shell files:** `AppShell.tsx` (room ground, stage sheet, `pb-28` for the pill, `FloatingNav`), `Sidebar.tsx` (desk: icon rail with tooltips, held between the top bar and the bottom pill so it can never slide under the bar; it never scrolls, the icons shrink on a short screen instead; phone: the labelled drawer as before; `navByRole` exported), new `FloatingNav.tsx` (every section by name, scrolling sideways; icons only on a phone; plus Upload for a member), `UserMenu.tsx` (`compact` form for the rail), `Topbar.tsx` (floating pill, plain greeting, moderator's team chip, search centred), `GlobalSearch.tsx`/`AdminSearch.tsx` (pill field, glass results), `NotificationDropdown.tsx` (glass popover), `GradientButton.tsx` (pill radii), `PageHeader.tsx` (24–26 px title). Three class-only edits so bottom action bars sit above the pill: `MyImages.tsx` (`sticky bottom-24`), `GroupDetailLive.tsx` and `GroupDetailDemo.tsx` (`fixed bottom-24`).
- **One old defect fixed on the way:** `.fc-icon-btn` set `display` at class specificity, so the top bar's `hidden sm:inline-flex` never hid the theme and history buttons on a phone; the display now comes from `:where(.fc-icon-btn)`.
- **Not changed:** the default appearance (dark), the public and sign-in pages, any text, any data shown. No new mock data. The user portal's storage figure left the desk rail (it has no room for it) but is still in the page header ("N photos · X stored") and in the phone drawer.
- **Test accounts for the owner's local database** (created on request with a one-off script kept outside the repo, nothing existing touched): `test-admin`, `test-owner`, `test-mod`, `test-member` (team "Test Team"), `test-user` (no team), all `@facecloud.test`, one shared test password told to the owner in chat.
- **Verified:** `npx tsc -b`; `npm run build`; `VITE_USE_API=false VITE_API_URL= npm run build`; on the QA stack: screenshots of user, admin and moderator pages in both appearances at 1440 px and 390 px (no page wider than the screen, no page errors); `05-accessibility.mjs` 86/86; `01-crawl.mjs` (39 pages × 2 widths) **103/103**, run again after the rail version: **103/103**; the owner's third review (rail slid under the top bar on a short screen; the pill cut sections off) was checked at 1366×768 as admin: top bar ends at 68 px, rail 103–662 px, pill from 703 px, all 13 sections reachable by scrolling. A first crawl run showed 9 user pages "sent to /login": my screenshot script was clearing the shared test browser's storage at the same moment (a test collision, not the app); run alone, the crawl is clean.

### 2026-10-24 — QA of the backend "polish" change (branch feat/adaptive-polish, commit 8845a4a); labels for it in the report
*Status: committed (this commit).*

- **What was checked.** The backend session built a gentle "polish" operation for photos with nothing to fix (`ADAPTIVE_POLISH_ENABLED`, default False; branch `feat/adaptive-polish` in `/Users/Ali/FaceCloud_backend_polish`, not merged). It was tested from a throwaway clone of the commit on the QA stack, never in the owner's folders or server. New script `qa/scripts/16-polish.mjs` (record on the unchanged backend, on the new code with the flag off, and with it on; `compare before off on`): 9 photos x 4 level/style combinations = 36 runs.
- **Result: 6 of 6 checks pass.** Flag off: all 36 outputs identical to the unchanged backend (same decoded pixels, outcome and stages). Flag on: dark (Zero-DCE) and noisy (denoise) photos unchanged by a pixel; the only photo polished was one real portrait (4 runs): same size, colour change at most 1.4, picture shifted 0.003 px, sharpness 84 to 118-129, no new clipped highlights, the result says "Polished: balanced the contrast and sharpened lightly." The backend's own 28 new tests pass (28/28).
- **Honest limit.** Only 1 of 7 ordinary photos was polished: two were "dark scene" (left as photographed, by design), two had both polish variants refused by the validator ("already balanced and sharp"). The change on the polished one is small. Making the effect larger means loosening gates, which raises risk: a decision for the owner and the backend developer.
- **My QA mistake, corrected.** The first "face moved" measure used the detector's box, which jitters when a photo is sharpened; it now uses a whole-picture shift (phase correlation) and landmarks, with the landmark tolerance set after seeing the numbers (3 percent), said so in the report.
- **Front end.** `src/components/features/EnhancementReport.tsx`: stage name "Polish" with the sentence "Balanced the contrast and sharpened lightly", and engine names "OpenCV polish" and "OpenCV noise filter" (the denoise engine `opencv_nlm` had shown its raw id). Nothing else changes; a backend without the flag never sends a polish stage.
- **QA docs.** `qa/README.md` and `qa/TEST_PLAN.md` list script 16. The backend's whole enhancement suite (807 tests with the polish commit, 779 without) was run in the owner's environment (`adaptive_v1`, models on): **91 fail in both runs and the two lists are identical**, none is a polish test; they are old tests that assume default settings, and five of those modules (157 tests including the 28 polish ones) pass 157/157 with default settings. So the polish commit adds no failure.
- **Screen check.** With the flag on, the real upload screen shows "Polished: balanced the contrast and sharpened lightly. Polish · Balanced the contrast and sharpened lightly · OpenCV polish (blend 1.0)" for the polished photo; no page errors.
- **Clean-up.** Test copies of the owner's stored photos, their outputs, the throwaway clones and test logs were deleted; the owner's folders, database and servers were only read.
- **Verified:** `npx tsc -b`, `npm run build`, `VITE_USE_API=false VITE_API_URL= npm run build`; script 16 (6/6); backend polish tests 28/28.

### 2026-10-24 — "Enhancement does nothing" on the owner's server: cause found, fix checked on a copy
*Status: committed b2e5c73.*

- **Cause (verified, not guessed).** The owner's `.env` had no `ENHANCEMENT_RENDER_POLICY`, so `lightweight_v1` ran (it skips Zero-DCE even when its flag is on); and `~/Projects/FaceCloud_backend/.runtime/models/zero_dce_epoch99.onnx` was an older export (sha `b7f7d34a…`) while the code pins `e5cb6f92…`, so it failed its integrity check. The correct file exists in `/Users/Ali/FaceCloud_backend/.runtime/models/`. All four stored photos of the owner's account are well exposed, so the engine rightly left them as they were.
- **Done by the owner's backend session (not by me):** the correct model copied in (old one kept as `.runtime/zero_dce_old_b7f7d34a.onnx`) and `ENHANCEMENT_RENDER_POLICY=adaptive_v1` added to `.env`. No code changed.
- **Checked on the QA stack with the owner's real `.env`** (adaptive_v1, all five models on): script 09 passes 8 of 9: a dark portrait goes from brightness 28 to 76 through the real upload (stage `low_light`, engine `zero_dce`, blend 0.65), a noisy one is smoothed (`opencv_nlm`), a clean one is `original_preserved`; the only failure is BE-005 (x0.25 refused). The owner's own server was **not yet restarted** when checked (started 22 Oct 15:38, `.env` changed 24 Oct 12:51), so it still ran the old settings.
- **Still advised to the owner:** switch GFPGAN, CodeFormer, HD restoration and NAFNet-deblur off to match `scripts/defense_demo.sh` (they are non-commercial or unmeasured and did not change these results), then restart and upload a darkened photo (x0.40 of photo 54 or 44).
- **QA tooling.** `qa/start-test-stack.sh` accepts `QA_EXTRA_ENV` (extra backend settings); `qa/README.md` documents it and `QA_ORG_INVITE_RATE`.

### 2026-10-24 — QA pass 3: settings, administrator actions, resilience; three fixes (FE-013, FE-014, FE-015)
*Status: committed 60f9e4f.*

- **New QA scripts, all passing.** `13-settings.mjs` (22 checks: every wrong password, the right one, name, devices, sign out everywhere, notification switches, delete account), `14-admin-actions.mjs` (36: add user/moderator, suspend/activate, teams, invitations, failed-work and moderation pages, audit trail), `15-resilience.mjs` (17: server unreachable, error page, 429, slow, session ended elsewhere, double click, unknown address, wrong portal, Escape). `qa/lib.mjs` gained `tab.on(event, fn)`; `qa/start-test-stack.sh` accepts `QA_ORG_INVITE_RATE` (script 14 reads the organization list more than BE-004's 30 an hour).
- **FE-013 (fixed).** With the server unreachable, pages showed the browser's raw "Failed to fetch". A network failure now reads "FaceCloud could not reach the server. Check your internet connection and try again." everywhere, including the three sign-in forms. File: `src/lib/api/client.ts`.
- **FE-014 (fixed).** Three quick clicks on "Send invitation" sent three requests. The same change asked for twice while the first is on its way is now sent once and both callers get its answer (uploads with files excluded). File: `src/lib/api/client.ts` (`sharedChanges`).
- **FE-015 (fixed).** Suspending a user used the browser's `window.confirm`; it now uses the console's own dialog, which says what happens and shows a server refusal inside it. File: `src/pages/admin/Users.tsx`.
- **No bug in settings.** The five first-run failures of script 13 were test mistakes (the refresh address is `/api/auth/refresh/`; a wrong password answers 400 not 401). Noted N-08: a revoked refresh token answers 400 while a garbage one answers 401; the app treats both as "sign in again".
- **Docs.** `qa/README.md`, `TEST_PLAN.md`, `BUGS.md` (22 bugs, 15 fixed, 7 open, all seven backend; BE-007 is optional and is added to `qa/PROMPT_FOR_BACKEND.md`), `QA_REPORT.md` (498 checks, 493 passed, the 5 failures are still BE-001, BE-002, BE-004, BE-005, BE-006), `README.md` Testing bullet.
- **Verified:** scripts 13, 14, 15 pass; after the client change scripts 06 (9/9), 07 (19/19), 10 (16/17, the one failure is BE-006), 11 (18/18), 12 (23/23), 13 (22/22) and 14 (36/36) were re-run; `npx tsc -b`, both builds.

### 2026-10-23 — QA pass 2: editor and moderator scripts, two small fixes (FE-011, FE-012)
*Status: committed dae6f77.*

- **New QA scripts.** `qa/scripts/11-editor.mjs` (18 checks): sliders and preview, reset, hold-to-compare, save time (2 s on a 1024 px photo), the saved version is full size and brighter, versions list and "Use this", delete asks first and the original/enhanced photo stay, another person gets 404, signed out gets 401. `qa/scripts/12-moderator.mjs` (23 checks): queue and filter, claim, a clash with a second moderator (409, shown in words on the dialog), reject with a message the member receives, a closed review, deciding twice (409), escalate (shows on the administrator's overview), keep in review, bulk approve, decision log against the dashboard, audit search, deactivating and reactivating a member. Both pass on a fresh stack: **18/18** and **23/23**.
- **FE-011 (fixed).** The editor let you press "Save as new version" with every slider untouched, which made a copy of the enhanced photo and made it the current version. Save is now off until a slider differs from its starting position, with the reason beside it. File: `src/pages/user/PhotoEditor.tsx` (`untouched`).
- **FE-012 (fixed).** A review held by another moderator showed "Release", which the server refuses with 409. The queue and the review page now show a disabled "Held by <name>". Files: `src/lib/moderationData.ts` (`heldByAnother`), `src/pages/moderator/ReviewQueue.tsx`, `src/pages/moderator/ModeratorImageReviewLive.tsx`.
- **Test-side notes (not app bugs).** Re-running script 12 on the same database failed 2 checks (approved reviews already existed; the member had already joined), so the checks need a fresh stack; both passed on a fresh `start-test-stack.sh`. Writing the script I once clicked "Reject" and hit the sidebar link "Rejected Images" (fixed by scoping to `main button`).
- **Docs.** `qa/README.md`, `qa/TEST_PLAN.md`, `qa/BUGS.md` (FE-011, FE-012; 18 bugs, 12 fixed, 6 open, all six backend), `qa/QA_REPORT.md` (423 checks, 418 passed, the 5 failures are still BE-001, BE-002, BE-004, BE-005, BE-006), `README.md` Testing bullet.
- **Verified:** `npx tsc -b`, `npm run build`, `VITE_USE_API=false VITE_API_URL= npm run build`; scripts 11 and 12 on a fresh stack.

### 2026-10-22 — One complete backend prompt for the six QA bugs
*Status: committed (this commit).*

- `qa/PROMPT_FOR_BACKEND.md` holds the single prompt for Ijaz: BE-004 (admin organization list throttled at 30 an hour), BE-005 (the demo's dark photo is refused), BE-006 (reviews created in personal workspaces), BE-001 (login identifier length), BE-002 (JSON 404 under `/api/`), BE-003 (slow health check), each with the fix, the test and the command that shows it working. Same ids as `qa/BUGS.md`; `qa/README.md` lists the file. Documentation only.

### 2026-10-22 — Onboarding pipeline QA: a person with no team was promised a moderator
*Status: committed (this commit).*

- **Question (Ali):** what happens to a person who signs up alone, and how does a customer's team get set up; "if there is an issue, fix the pipeline".
- **Tested end to end in a real browser** (`qa/scripts/10-onboarding.mjs`, 17 checks, 16 pass): sign-up, verification email link, sign-in, no team (no "Submit to", My Organization says the person owns none), an owner's invitation, joining, "Submit to" then offering the personal workspace and the team, an invitation to a brand-new address (sign in or create an account, address filled in and locked, one step, signed in, already in the team).
- **Issue found (FE-010, fixed):** an unsure photo from a person with no team was told "A moderator will take a look" and was not enhanced, although a personal workspace has no moderator. Now it says no moderator will look at it, is enhanced, and shows the quality figures and download; the multiple and ZIP screens say "Not sure about (kept, no moderator in your workspace)". Files: `UploadSingle.tsx`, `UploadMultipleLive.tsx`, `UploadZipLive.tsx`.
- **Issue found (BE-006, backend, open):** the backend still creates a review in the personal workspace; it stays pending for ever and fills the administrator's "organizations needing attention" list and moderation totals (four personal workspaces after four uploads in the test). Prompt text is in `qa/QA_REPORT.md`.
- **Also:** the development email's links point at `localhost:5173`, so on the QA stack the script replaces the host; nothing to fix for Ali, whose frontend is on 5173.
- **QA:** `qa/BUGS.md` is 16 bugs (10 fixed, 6 open, all backend); 382 checks on the QA stack, 377 pass.
- **Verified:** `npx tsc -b`, `npm run build`, demo-safe build.

### 2026-10-22 — "Enhancement does nothing": what really happens, clearer screens, an enhancement QA script
*Status: committed (this commit).*

- **Report (Ali):** after an upload the photo does not seem to be enhanced, and "Auto enhance" does nothing.
- **Investigation** (a throwaway copy with the same settings as Ali's backend, real photos, real screens, `qa/scripts/09-enhancement.mjs`): enhancement runs after a single upload and does its work when a photo needs it. A dark portrait (brightness 28) is brightened to 56; a noisy one loses about half its grain; a blurred one is partly deblurred. A **clean, well-lit portrait is deliberately left as it is** (changed by 1.6 of 255). The screens made that look broken: "Light correction" shown on a photo that no stage changed, "strength applied Light", "No restoration stage changed this photo", and in the editor **Auto** leaving every slider at 0 with "No changes" and no explanation. Ali's server does not set `ENHANCEMENT_RENDER_POLICY` (so `lightweight_v1`); the defence demo uses `adaptive_v1`; for brightening and denoising both gave the same result.
- **Frontend fix (FE-009):** "No correction needed" / "Nothing needed fixing, so this photo was left as it is. Enhancement changes dark, noisy or blurry photos the most."; the editor's Auto and "Auto + brighten" explain when they found nothing to change. Files: `src/components/features/EnhancementReport.tsx`, `EnhancedVersionCard.tsx`, `src/pages/user/UploadSingle.tsx`, `PhotoEditor.tsx`, `src/lib/api/enhancements.ts` (`changedNothing`).
- **Backend finding (BE-005, for Ijaz):** the demo script `seed_demo.py --dark` darkens to x0.25, which the quality check now refuses (`severe_underexposure`), so low light cannot be shown with the demo's own photo and the script then crashes. Measured on a clean portrait: x0.60 needs nothing, x0.50 and x0.40 are brightened about twofold, x0.35 and darker are refused. Prompt text is in `qa/QA_REPORT.md`.
- **QA:** new `qa/scripts/09-enhancement.mjs` (9 checks: 8 pass, 1 fails on BE-005); `qa/BUGS.md` is now 14 bugs (9 fixed, 5 open, all backend); test plan and README updated.
- **Verified:** the new wording and the editor note on the real screens (upload, photo page, editor); `npx tsc -b`, `npm run build`, demo-safe build.

### 2026-10-22 — FE-007: a 0-byte size reads "0 B"; backend prompt written for the four open bugs
*Status: committed (this commit).*

- `formatBytes(0)` returned "--" (the text for an unknown size); an empty file, or a new account's stored figure, now reads "0 B". "--" stays for a missing value. File: `src/lib/imageData.ts`.
- `qa/BUGS.md` and `qa/QA_REPORT.md` updated: 12 bugs, **8 fixed, 4 open, all four backend** (BE-001 login identifier length, BE-002 JSON 404 under `/api/`, BE-003 slow health check, BE-004 admin organization list throttled at 30 an hour). The prompt for Ijaz was given to Ali; after it is merged the QA scripts are re-run (`qa/README.md`).
- **Verified:** `npx tsc -b`, `npm run build`, demo-safe build.

### 2026-10-22 — QA pass: the `qa/` folder, 12 bugs found, 7 fixed
*Status: committed (this commit).*

- **What was added:** `qa/` with `README.md`, `TEST_PLAN.md`, `BUGS.md`, `QA_REPORT.md`, `start-test-stack.sh` / `stop-test-stack.sh` (a throwaway backend copy from `origin/main`, test accounts, website and headless Chrome on their own ports), `seed.py`, `lib.mjs` and eight scripts (`01-crawl` … `08-limits`). Run output goes to `qa/out/` (ignored by git). The user's own servers (5173 / 8000) and database are never touched; `02-public-smoke.mjs` can be pointed at a running site and only does safe, signed-out checks.
- **Result:** 356 checks on the QA stack, 353 passed; the 3 failures are backend items (BE-001 login identifier length, BE-002 HTML 404 under `/api/`, BE-004 the admin organization list limited to 30 reads an hour). On Ali's running 5173 / 8000: 20 of 20 safe checks passed and the backend is on the new code (242 operations).
- **Frontend fixes in this pass:** FE-001 single upload shows the reason a file was refused (and a file card instead of a broken icon); FE-002 Live Enhancement uses an existing model address and a pinned runtime (offline use is still a decision, see `qa/BUGS.md`); FE-003 sign-in and register fields linked to their labels and an `h1` on those pages; FE-004 a tab title per page (`src/lib/useDocumentTitle.ts`, `PageHeader`); FE-005 the early-access button has a name; FE-006 file icon instead of a broken-image icon in the multiple-upload lists; **FE-008** one page load sent the same request up to 8 times (moderator pages 12 calls, now 5 to 6): identical reads in flight now share one request (`src/lib/api/client.ts`), the admin organization list is kept for a minute and dropped on any change (`adminOrganizations.ts`), and "Request was throttled…" becomes "Too many requests. You can try again in about N minutes."
- **Open (see `qa/BUGS.md`):** BE-001, BE-002, BE-003 (health check slow when Redis is down), BE-004, FE-007. A prompt for Ijaz is in `qa/QA_REPORT.md`. Until BE-004 is fixed: `THROTTLE_RATE_ORG_INVITE=1000/hour` in the backend `.env`.
- **Not automated yet (listed in `qa/TEST_PLAN.md`):** enhancement quality, the editor, person folders, moderator reject/assign/bulk, settings and password change, the Celery path, other browsers.
- **Files:** `qa/**`, `.gitignore`, `README.md`, `src/lib/api/client.ts`, `src/lib/api/adminOrganizations.ts`, `src/lib/useDocumentTitle.ts`, `src/components/layout/PageHeader.tsx`, `src/components/features/LiveEnhancementPanel.tsx`, `src/components/public/HeroSection.tsx`, `src/pages/user/UploadSingle.tsx`, `src/pages/user/UploadMultipleLive.tsx`, the sign-in / register / forgot-password / about / contact / not-found pages (labels, `h1`, titles).
- **Verified:** all eight scripts on a fresh stack (above); `npx tsc -b`, `npm run build` and the demo-safe build pass.

### 2026-10-22 — Dialogs cut off at the top and not scrollable (the `page-enter` animation)
*Status: committed (this commit).*

- **Report (Ali, screenshot):** the Organizations "Edit" dialog showed only its lower half (the Name field was hidden) and could not be scrolled.
- **Cause (measured in headless Chrome, window 520 px high):** `.page-enter` used `animation: … both`, so after the fade-in the page container kept `transform: matrix(1,0,0,1,0,0)`. A transformed ancestor becomes the reference box of every `position: fixed` element inside it: the dialog's overlay was 507 px high and 759 px wide, starting 96 px down (under the top bar), instead of covering the window.
- **Fix:** `src/index.css` `.page-enter` now uses `backwards` (no transform once the animation is over). The overlay then covers the whole window (0 px, 520 px high, 1095 px wide, no transformed ancestor). The dialogs also scroll when they are taller than the window: `ConfirmDialog`, the Organizations edit dialog and the moderator's invite dialog use `overflow-y-auto` on the overlay and `m-auto` on the dialog (it stays centred when there is room and starts at the top when there is not).
- **Verified** in headless Chrome (demo build, 520 px window): the Name field is 111 px from the top and, after scrolling down, the Save button ends at 479 px of 520; the fade-in still plays. `npx tsc -b` and both builds pass. Other full-window overlays (photo viewer, lightbox) were not re-tested; they gain from the same fix.
- **Files:** `src/index.css`, `src/components/ui/ConfirmDialog.tsx`, `src/pages/admin/Organizations.tsx`, `src/pages/moderator/MemberManagementLive.tsx`.

### 2026-10-22 — System Monitoring shows the services when one is down (HTTP 503)
*Status: committed (this commit).*

- **Report (Ali, screenshot):** System Monitoring showed one word, "unavailable", where the services should be, while Failed uploads and Failed jobs loaded fine.
- **Cause (reproduced on a throwaway copy of `origin/main` with the broker address pointing at nothing):** when a required service is down (here Redis) `GET /api/system/health/` answers **503 with the full list of checks** (`redis: down, connection_failed`, `celery: degraded`). The frontend treated every non-2xx as an error and showed the first word of the body. Aside: with Redis down the health call takes 6 to 18 seconds (several checks time out), so the page shows "Loading" that long first.
- **Fix:** `getHealth` now uses the body of a 503 that carries the checks; the page lists every service with its colour and a sentence for the usual codes (`connection_failed` → "It did not answer. Check that it is running (on a Mac: brew services start redis)", and others). `unavailable` is treated as `down` for the older response shape.
- **Files:** `src/lib/api/adminSystem.ts`, `src/lib/adminHealth.ts`.
- **Verified** in headless Chrome against the throwaway copy: Redis row "down" with the hint, Background workers "degraded", the other services operational, no page errors. `npx tsc -b` and both builds pass.
- **Ali's actual cause:** Redis was not running (see the earlier worker error); `brew services start redis` fixes it.

### 2026-10-22 — Collages dropped from the plan; auto-enhancement becomes the top priority
*Status: committed (this commit).*

- **Decision (Ali):** collages are removed from the project. The frontend never had a collage screen, so the only trace was one label in the admin job names (`src/lib/adminHealth.ts`), now removed; an unknown job kind falls back to its backend name. The backend's `collages` app is Ijaz's to remove (prompt given to Ali).
- **Decision (Ali):** *automatic enhancement of accepted photos* is the core of the proposal (it was the examiners' question at the proposal defence), so it moves from "pending" to the first job before the defence on 2026-11-10. Backend prompt for Ijaz given to Ali; the frontend side (upload screens, batch panel, Image Detail) follows once the backend exists.
- **Files:** `src/lib/adminHealth.ts`, `WORK_LOG.md`. `npx tsc -b` and both builds pass.

### 2026-10-19 — Plain messages when the server answers with a page; honest "organizations could not be loaded"
*Status: committed (this commit).*

- **Report (Ali, two screenshots):** Admin → Organizations showed `Unexpected token '<', "<!DOCTYPE "... is not valid JSON`, and on Moderators the "Create account" button stayed off with "There is no organization yet".
- **Cause (reproduced on a throwaway copy of `origin/main`):** new backend code on a database that has not been migrated. `GET /api/organizations/admin/` answers **500 with Django's HTML error page** (200 and JSON once migrated), and even sign-in fails in that state. The frontend tried to read the page as JSON, and the moderator form read the failed list as "no organizations", which was untrue and left the button off. Ali's local backend had just been updated (`git pull`) but `python manage.py migrate` had not been run.
- **Frontend:** `src/lib/api/client.ts` turns a reply that is not JSON into a sentence (500: "internal error… run migrate and restart"; 404: older backend or wrong `VITE_API_URL`; 200 with a page: `VITE_API_URL` points at the wrong server) instead of the browser's parse error. The account form (Users, Moderators) and the Invitations form now say "The organizations could not be loaded: …" with Try again, keep the button off, and never claim there is no organization when the list simply failed.
- **Verified** in headless Chrome against the throwaway copy: signed in, rolled the organizations migrations back to 0009, the Organizations page and the moderator form show the new sentences; after `migrate`, owner search found the account, typing without choosing was refused, the organization was created, the moderator form offered it, Create account enabled and the moderator was created (confirmed on the server). `npx tsc -b`, `npm run build`, demo-safe build pass.
- **Files:** `src/lib/api/client.ts`, `src/components/admin/NewAccountForm.tsx`, `src/pages/admin/Moderators.tsx`, `src/pages/admin/Users.tsx`, `src/pages/admin/Invitations.tsx`.

### 2026-10-19 — Failed work uses backend PR #107's richer fields
*Status: committed (this commit).*

- **Backend result (Ijaz, PR #107 `fix/console-gaps`, not merged yet):** the failed-batch list now carries `organization_*`, `failure_stage(_label)`, `failure_reason` (always a sentence), `failed_images`, `failed_at`, `can_retry`, `retry_blocked_reason`, `max_retries`, `retries_left`; failed jobs carry `kind_label`, organization, stage, reason, `failed_at`; the moderator preference `moderator_review_updates` is exposed; a new password equal to the current one is refused. The "correct" decision already notified the member on `main`.
- **Frontend:** the Failed uploads table shows the Organization, the stage in words, the real reason, "retries x of max" and the time it failed; **Retry is switched off, with the reason underneath, when `can_retry` is false** (no failed photos, or the retry limit reached); the failed-jobs list shows the kind's name, organization and stage. Every new field is optional, so the screen still works against a backend without #107.
- **Not needed:** the live review page never offers "correct" (only the demo page does), so the backend's caveat that "correct" changes nothing on quality and duplicate reviews does not affect it.
- **Files:** `src/lib/api/adminOperations.ts`, `src/components/admin/FailedWork.tsx`.
- **Verified** on a throwaway copy of the PR branch with three failed batches (retryable, none failed, at the limit) in headless Chrome: organization, stage wording, reason sentences, "3 of 3" / "0 of 3", Retry off for the two that cannot be retried with the backend's sentence shown, on for the other; no page errors. `npx tsc -b` and both builds pass. The older-backend path (fields missing) was passed on the previous commit's test and not re-run.

### 2026-10-19 — Admin: failed work with Retry, Moderation Overview, Invitations
*Status: committed (this commit).*

- **Failed work** (on System Monitoring, live only): a table of failed upload batches (name, owner, photos, where it stopped, the error, retries, when) with **Retry** for any user's batch (`POST /api/system/batches/{id}/retry/`), paged ten at a time; below it the latest failed job of each kind with its owner and reason.
- **Moderation Overview** (`/admin/moderation`, sidebar "Moderation"): tiles for waiting, escalated, overdue, stale, nobody assigned and decided today; organizations needing attention; moderator workload. The administrator chooses when an open review counts as stale (1, 2, 3 or 7 days, sent as `stale_hours`). The demo build shows a labelled sample.
- **Invitations** (`/admin/invitations`, sidebar "Invitations"): invite a user or a moderator by email (a moderator needs an organization; full ones are disabled), list with status filter, **Resend** (waiting or expired) and **Cancel** (waiting, asks first). The backend's refusals (address already invited, and so on) are shown as sent. Not offered: inviting an administrator (only a superuser may).
- **A backend bug found while testing:** the batch-retry refusal arrives as the text of a Python object (`"[ErrorDetail(string='This batch has no failed images to retry.', code='invalid')]"`). `src/lib/api/client.ts` now extracts the sentence, which also fixes the owner and moderator retry messages. The backend should send a plain sentence (listed in the backend prompt).
- **Files:** `src/lib/api/adminOperations.ts` (new), `src/components/admin/FailedWork.tsx` (new), `src/pages/admin/ModerationOverview.tsx` (new), `src/pages/admin/Invitations.tsx` (new), `src/pages/admin/SystemMonitoring.tsx`, `src/App.tsx`, `src/components/layout/Sidebar.tsx`, `src/lib/api/client.ts`, `README.md`.
- **Verified** on a throwaway copy of `origin/main` (admin, an organization with an owner, a moderator and a member, two failed batches, reviews that are overdue/escalated/stale) in headless Chrome: both failed batches listed with owner and error; Retry on a batch with nothing to retry shows the server's sentence, Retry on a real failed batch started it (retry count 1, batch left the list); Moderation tile numbers, the organization row and the "1 day" choice match the API; invitations: user invite listed as Waiting, a repeat is refused with the server's sentence, a moderator invite is blocked by the form until an organization is chosen and then sent tied to it, Resend, Cancel (asks first, cancelled on the server), status filter. No page errors. `npx tsc -b`, `npm run build`, demo-safe build pass. Several first-run failures were test mistakes (CSS upper-cased labels; the browser's own `required` check stops the moderator form before the page's own message).
- **Not tested:** failed jobs of kinds other than upload batches (none seeded), a batch retried that then fails again, the demo build in a browser.

### 2026-10-19 — Moderator: live bell, assign a review, merge the folders behind a duplicate
*Status: committed (this commit).*

- **Bell:** the moderator's top-bar bell now reads the real notifications (unread number, latest items, mark read, "View all" opens `/moderator/notifications`), like the user's. Opening an item goes to the queue (assignment, deadline, escalation) or Batch Management (failed batch), the same destinations the notification page uses. With the API off it keeps the demo feed.
- **Assign:** an open review has **Assign to…** which lists the organization's active moderators and owner (not plain members) and sends `POST …/reviews/{id}/assign/`; the assignee is notified by the backend.
- **Merge folders:** a review raised by a duplicate match has **Merge their folders** (`…/merge-identity-groups/`, optional reason). If a side has several folders the server says so and the dialog shows it; Identity Review is the place to pick folders then.
- **Files:** `src/lib/useLiveBell.ts`, `src/components/ui/NotificationDropdown.tsx`, `src/lib/api/moderation.ts`, `src/pages/moderator/ModeratorImageReviewLive.tsx`, `README.md`.
- **Verified** on a throwaway copy of `origin/main` (organization with an owner, two moderators and a member) in headless Chrome: assign dialog lists the right people, Assign is off until one is chosen, the server then shows the new assignee; the assignee's bell shows 1 and the real notification text, opening it goes to the queue and the count clears; no page errors. The merge dialog and the server's refusal message are shown correctly, **but a real merge of two folders was not tested** (the seeded duplicate review had no match behind it). `npx tsc -b`, `npm run build`, demo-safe build pass.
- **Not done:** organization accent colour as a theme (only the sidebar edge uses it).

### 2026-10-19 — Backend PR #106 (person-folder grouping): frontend reads `suggested_count`
*Status: committed (this commit).*

- **Backend result (Ijaz, PR #106, not merged yet):** SFace gets its own thresholds (new folder below 0.30, automatic match from 0.45, merge suggestion 0.40, measured on public LFW photos, not on Ali's), rejected photos stay out of folders, small or unsure face detections no longer open a folder, `regroup_identities` and `cleanup_rejected_folder_members` commands (dry-run by default), folder `confirmed_count` and `suggested_count`, migration `identities/0008`.
- **Tested here against a throwaway copy of the PR branch:** after granting the face-grouping consent (without it the server never analyses faces), four photos of one face went into **one** folder (`member_count` 4, `confirmed_count` 4, `suggested_count` 0). Not tested: many different people, review cases, the commands.
- **Frontend:** the Person Folder page uses the folder's own `suggested_count` for "N more suggested, not confirmed yet" and falls back to counting the tiles on a backend without it. Folder cards unchanged.
- **Files:** `src/lib/api/identities.ts`, `src/lib/personFolders.ts`, `src/pages/user/GroupDetailLive.tsx`.
- **Verified:** `npx tsc -b`, `npm run build`, demo-safe build.
- **Waiting on Ali:** merge #106, run `migrate`, then `regroup_identities --owner <id>` (dry-run, then `--apply`). Check the thresholds on his own labelled photos before production.

### 2026-10-19 — Person folders: say how many photos are only suggested (grouping investigation)
*Status: committed (this commit).*

- **Report (Ali, 7 screenshots):** one person spread over many folders (Person 005/006/007/014/015/016, 011/012, "ijaz"/010/013); a different person shown inside a folder; a folder (ID 3) holding a food photo with no face; "2 images in this folder" above five tiles.
- **Read from the backend (`identities/services.py`, `providers.py`, `config/settings.py`; Ali's `.env` uses `IDENTITY_PROVIDER=sface_2021dec_v1`, no threshold overrides):** SFace has no thresholds of its own, so it uses the generic ones — new folder below cosine 0.68, automatic match only at 0.82 or more, 0.68–0.82 goes to review. SFace scores for the same person across different poses and lighting are usually well below that (OpenCV's own same-person cosine cutoff is 0.363), so most photos start a new folder, and the ones that do land in the middle show as "70% match, In review". That fits the screenshots; it has not been measured on Ali's photos.
- **The folder photo list** includes photos whose match is only a suggestion (`needs_review`), but "N images in this folder" counts confirmed ones only: hence 2 above five tiles. **Fixed here:** the header now reads "2 images in this folder · 3 more suggested, not confirmed yet".
- **Folder 3 (food photo, badge "Rejected"):** it is not accepted; it is rejected yet still filed. The folder list only hides rejected/removed *memberships*, not rejected *photos*, and a photo with a (false) face detection can start a folder before its quality verdict. Backend fix (prompt given to Ali for Ijaz).
- **Not explained:** two tiles with the same file name, size and dimensions but different pictures (one with "100% match"). Needs the two image ids.
- **Files:** `src/pages/user/GroupDetailLive.tsx`, `src/lib/api/identities.ts`.
- **Verified:** `npx tsc -b`, `npm run build`, demo-safe build. Not run in a browser.

### 2026-10-19 — Why ZIP / multiple uploads show no processing (investigation + README note)
*Status: committed (this commit).*

- **Report (Ali):** after uploading a ZIP or several photos no processing is shown.
- **Cause (reproduced on a throwaway backend copy, own Redis on port 6390, nothing of Ali's touched):** Ali's local backend has `DJANGO_DEBUG=True` and no `CELERY_TASK_ALWAYS_EAGER` setting, and no Celery worker is running. The backend's default is then eager mode (`CELERY_TASK_ALWAYS_EAGER = DEBUG`), so all processing runs *inside the upload request*: a 6-photo ZIP returned `processing_status: completed` in the upload response itself, and a large archive would hold the screen on "Uploading…" for the whole time. With eager mode off and a worker running, the same ZIP returned in 0.5 s as `queued` and progress moved through its stages (17 % → 52 % → 92 % → 100 %, finished after about 2.7 s) — exactly what the screens already poll and draw.
- **Fix:** environment, not frontend code. In the backend `.env` set `CELERY_TASK_ALWAYS_EAGER=False`, keep Redis running, start `celery -A config worker -l info --pool=solo`. Not changed by me (Ali's backend folder is off limits). README now says so.
- **Files:** `README.md`, `WORK_LOG.md`. No source change.
- **Also seen:** a very small test photo (216 px wide) is rejected as too small, which is correct and unrelated.

### 2026-10-19 — Editor: say plainly where a saved edit goes
*Status: committed (this commit).*

- **Question (Ali):** when a user edits a photo and saves the full-size version, does the enhanced photo get replaced? **No.** Read from the backend (`enhancement/models.py::ImageEditVersion`, `views.py` activate/delete, `services.py::process_image_edit`): a save makes a separate file (`edited_file`) rendered from the enhanced image; the enhanced file and the original are never touched. The newest save is marked `is_current`, and that is what the photo page shows and downloads (`EnhancedVersionCard` already did this). Deleting the current version falls back to the newest remaining edit, else the enhanced photo. There is no endpoint to un-mark a current edit.
- **Frontend:** the success message now says the original and enhanced photo are unchanged and that this version is what the photo shows and downloads, with a "View the photo" link; the Versions card states whether the photo currently uses a saved edit or the enhanced photo; the delete dialog explains the fall-back. Logic unchanged.
- **Files:** `src/pages/user/PhotoEditor.tsx`.
- **Verified:** `npx tsc -b`, `npm run build`, demo-safe build. Not run in a browser (wording-only change).
- **Also (no code):** the slow "Saving full-size version" is backend time (models re-run at full size, up to 10 guard attempts, shared queue); backend prompt given to Ali for Ijaz.

### 2026-10-19 — Batch report: no download button for an upload whose photos were deleted
*Status: committed (this commit).*

- **Problem (Ali's screenshot of `upload-38-report.pdf`):** Total Images 0, Accepted Uploads 1, empty Status Counts, raw byte count, a table with only a header. Reproduced against a scratch backend: the batch report is built from the photos that still exist, so once an upload's photos are deleted the counts disagree and the table is empty. The PDF itself (ISO timestamp with microseconds, raw sizes and codes, truncated filenames) is drawn by the backend's `reports/renderers.py`, so its wording is a backend fix (prompt for Ijaz).
- **Frontend:** the Processing page shows the batch "Processing report" button only while the upload still has photos; otherwise it says the photos were deleted so there is nothing left to report. Image reports are unchanged.
- **Files:** `src/pages/user/ProcessingPage.tsx`.
- **Verified:** scratch backend with one emptied batch and one batch with two photos: emptied batch shows the sentence and no button, the other shows the format picker; `npx tsc -b`, `npm run build` and the demo-safe build pass (existing lint warnings only).

### 2026-10-19 — Frontend for backend PRs #95–#103: plans and suspension, own-members scope, member messages, branding, sign-up from an invitation
*Status: committed (this commit).*

- **Tested against:** a scratch copy of the backend built from the top of the stacked branches (`docs/organization-offboarding`, which contains #96–#102; #95 was already on main). Nothing here needs those PRs merged to compile; the screens that use the new fields degrade quietly against an older backend.
- **Sign-in refusals (#95, #98):** a moderator with no organization, or whose only organization is suspended, is refused at sign-in with a sentence (`no_organization`, `organization_suspended`); the moderator login already showed the backend's message, now verified for both.
- **A moderator sees their own members (#96):** the frontend only shows less. Member Management says "Everyone I can see" and explains the scope when the organization uses `own_members`; the moderator's data screens already follow the server.
- **Tell the member (#97):** the review dialog now separates the **internal note** (never shown to the member) from an optional **message to the member**, and the review page shows what the member received. A bulk approve or reject on the queue asks for one optional message for all. The member's notifications gain the Moderator kind/icon for "Your photo was approved / not accepted", and the Settings text now says these follow the "Photo accepted" and "Photo rejected" switches.
- **Admin organizations (#98, #100):** the table shows owner, people, moderator seats ("2 of 5", "full"), plan and status; **Edit** (name, plan, what moderators see, reason) and **Suspend / Reactivate** (with a reason) call `PATCH /api/organizations/admin/{id}/`. The moderator-creation form disables an organization whose moderator seats are full.
- **Owner console (#99, #100, #102):** the people and invitation tools now see plan seats (moderators and members "x of y"), disable an invitation or "Make moderator" when no seat is free and say why, show a plain banner (and ask the server for nothing) while the organization is suspended, and gained two cards: **Organization settings** (name; what a moderator sees) and **Branding** (brand name, accent colour, logo upload and removal; a bad colour shows the backend's sentence). The logo is fetched with the token.
- **Branding shown (#102):** members see the brand name in "Submit to"; a moderator's sidebar shows the team's logo, brand name and a thin accent bar. (The accent is not otherwise applied to the theme.)
- **Sign up from an invitation (#101):** the invitation page's "Create account" opens `/register?invitation=<token>`; the register page shows who invited the person, locks the invited email, and one submit creates the verified account, joins the organization and signs in (a moderator invitation lands in the Moderator Panel, stored under that portal's own session). An address that already has an account is told to sign in and open the link again; a bad link shows the single sentence.
- **Files:** `src/lib/api/{organizations,adminOrganizations,auth,moderation}.ts`, `src/lib/{moderationData,useAdminOrganizations,useOwnedOrganizations,notificationKinds}.ts`, `src/pages/{Register,InvitationAccept,ModeratorRole}.tsx`, `src/pages/admin/Organizations.tsx`, `src/pages/user/{MyOrganization,Settings}.tsx`, `src/pages/moderator/{ReviewQueue,ModeratorImageReviewLive,MemberManagementLive}.tsx`, `src/components/admin/NewAccountForm.tsx`, `src/components/features/SubmitToSelect.tsx`, `src/components/layout/Sidebar.tsx`.
- **Verified:** headless Chrome, all passing: the two sign-in sentences; scope (sm1 and the uninvited sm2 visible, sm3 hidden; members screen wording); reject with an internal note plus a member message, saved and shown back; a bulk approve with a message; the member's notification page showing the message under the Moderator label; owner seats "2 of 5"; rename and scope change saved; brand name and accent saved in lower-case; logo uploaded and shown from a blob; a bad colour refused with the backend's sentence; the moderator's sidebar brand and logo; the free-plan owner seeing "1 of 1" with the moderator option disabled; admin seats and the disabled full organization in the moderator form; suspend with a reason (owner banner, moderator refused at sign-in), reactivate, plan edit lifting the limit; sign-up from an invitation as a member and as a moderator, the used link, an existing address, and a bad token. The demo build: Organizations with seats and a local suspend, the unchanged register page. `tsc` and both builds pass; the two new lint warnings were fixed. In one early run the suspend and edit steps seemed to fail; they passed on rerun and in isolation, and no cause was found beyond test timing, so treat that as unexplained rather than fixed.
- **Not done:** the offboarding purge (the owner must answer section 11 of the design first); applying the accent colour to the theme; a message to the member on single "correct" decisions (the dialog offers it for approve and reject only); the owner export remains owner-only on `own_members` and is hidden from moderators.

### 2026-10-19 — User notifications completed: accurate settings, unread filter, day groups, live badge
*Status: committed (this commit).*

- **What was wrong:** the Settings → Notifications text described something the backend does not do. It said rejection emails are on by default (email is **off** by default) and called the in-app switches "Email ...". In the backend each switch decides whether that kind of notification is **created at all** (the bell and the Notifications page); several kinds share one switch (`photo_rejected` also covers "needs review" and "processing failed"; `batch_upload_finished` also covers ZIP downloads and reports); "upload received" and "processing started" are always shown; `live_session_alerts` is in-app only; and the separate `email_notifications` switch sends a copy of the emailable ones, only to a verified address.
- **Changed:** Settings → Notifications now says exactly that: five in-app switches named for what they cover, an explanation box, and a separate "Also email me" switch. The Notifications page gained an **All / Unread only** filter (server `?unread=true`), groups by day ("Today", "Yesterday", dates), a kind label and icon per event (Photo, Upload, Download, Report, Person folder, Live camera), an unread total across all pages, a "Mark read" on every unread item, a clearer empty state, and refreshes itself every minute and when the tab is shown again. The bell now shows the **unread number** (9+ when more) instead of a dot, and asks again as soon as the window regains focus. New `src/lib/notificationKinds.ts`; `listNotifications` takes `unreadOnly`.
- **Verified:** headless Chrome against a scratch copy of backend origin/main with real notifications from uploads: badge equals the API's unread count, day heading and kind labels present, header unread total correct, "Unread only" lists exactly the unread ones, marking read lowers the count and removes the row, "Mark all read" clears every page and the badge, a notification created from outside appears in the badge on window focus and on the open page on tab-visible without a reload, Settings shows the real values, saving stores them, and with the "rejected" switch off a rejected photo created no rejected notification (only the always-on upload ones), "Also email me" saved. `tsc` and both builds pass; no new lint finding.
- **Found and not changed (backend):** `moderator_review_updates` exists on the model and drives moderator notifications but is not in the preferences serializer, so it cannot be read or saved through the API (the moderator Settings screen says "this backend does not have this switch yet"). **Frontend gap left:** the moderator's top-bar bell is still the demo feed (the moderator's Notification Center page is live).

### 2026-10-19 — Moderation Logs made real (Decision Log)
*Status: committed (this commit).*

- **Why:** `ModerationLogs.tsx` was an orphan page on demo data that duplicated Audit Entries, so it was neither routed nor wired. It now has its own job: the log of **decisions about photos**, while Audit Entries stays the full trail of everything else.
- **Added:** route `/moderator/logs` and a sidebar item "Decision Log". Live, it lists the latest decisions (approve, reject, correct, escalate) by everyone in the organization with the sentence, who, when, the reason and "Open the review"; filter chips by outcome; and today's counts (approved, rejected, escalated, total) taken from the audit trail. The demo build keeps the sample page. `listOrgAuditPage` gained a page size and `date_from`/`date_to`.
- **A detail worth knowing:** a bulk decision writes one event per review **and** one summary event ("Decided several reviews at once."). Counting the summary as well double-counted those photos (approved showed 5 instead of 3 in the test), so the summary is left out; each review shows in its own row.
- **Verified:** headless Chrome against a scratch copy of backend origin/main with one approve, one reject, one escalation and one bulk approve of two reviews by a second moderator: all rows and sentences present, counts 3 / 1 / 1 / 5, the chips filter, "Open the review" opens the right review. `tsc` and both builds pass, no new lint finding.
- **Left (frontend):** everything else waits on the backend prompt already given to the owner.

### 2026-10-19 — Owner console, moderator team switcher, live camera sessions; caches no longer outlive a sign-out
*Status: committed (this commit).*

- **Owner console ("My Organization", `/dashboard/organization`)**: an organization's owner now has a screen of their own, shown in the user dashboard's sidebar only to someone who owns a shared organization (found from `GET /api/organizations/`, whose rows carry the caller's role). It shows the people, moderators, pending invitations and plan; invites someone as a member or a moderator (only an owner may); makes a member a moderator and back; deactivates, reactivates and removes people (asks first; the owner and other owners are locked); resends or cancels pending invitations; lists recent activity (load older); switches between several owned organizations; and exports the organization's data (request, wait, download). A person who does not own an organization sees a plain explanation. Files: `src/pages/user/MyOrganization.tsx`, `src/lib/useOwnedOrganizations.ts`, additions to `src/lib/api/organizations.ts`, `Sidebar.tsx`, `App.tsx`.
- **Moderator team switcher**: a moderator of several organizations used to get only the first one. The panel now shows "Working in <team>" when there is more than one; the choice is kept per person in this browser and every moderator screen asks again for the chosen team. (`moderationData.ts`, `NoOrganizationGuard.tsx`, `listModeratorTeams`.)
- **Live camera sessions**: the Live Enhancement panel records a camera session (`POST /api/camera/sessions/`: a label and a plain setting, no video) when the camera goes on and ends it when it goes off, when the person leaves the page through the app, and when the page is closed or reloaded (a `keepalive` request on `pagehide`). A captured snapshot is saved through the session (`.../snapshots/`), so the session counts it. This is what the administrator's Live Sessions card and chart count. Failing to record a session never blocks the camera. A real bug was found and fixed while testing: the backend refuses a device name over 80 characters (`camera.CameraSession.device_label`), which silently stopped sessions for cameras with long names; the label is now cut to 80.
- **Caches no longer outlive a sign-out**: the owner list, the upload team list and the moderator's team list were module-level variables, so another person signing in later in the same tab would have inherited them. They now belong to the signed-in person (`src/lib/personCache.ts`).
- **Verified:** headless Chrome against a scratch copy of backend origin/main (an owner of two organizations, a moderator of two, members; a fake camera showing a real face for the snapshot test): owner menu present for the owner and absent for a member, the member's page explains, all owner actions saved in the backend (invite as moderator, cancel, role both ways, deactivate and reactivate, locked rows, removal asks first, activity, switching organization, export downloaded); the moderator switcher showed both teams, showed only the chosen team's data and remembered the choice; camera sessions: started, counted by the administrator's analytics and Overview card, ended on stop, on in-app navigation and on reload, and a captured snapshot raised the session's `snapshot_count`. `tsc` and both builds pass; no new lint finding. Three early failures were test mistakes (toast read after it faded, upper-case labels, a wrong button), and one real bug (the label length) was fixed.
- **Still waiting on the backend (prompt given to the owner):** a moderator always in an organization, a moderator seeing only their own members, telling a member what was decided, admin edit/suspend, plan limits, signing up from an invitation, branding, offboarding.

### 2026-10-19 — Moderator role guide brought up to date; customer onboarding written down
*Status: committed (this commit).*

- **Changed:** the public Moderator role guide (`/roles/moderator`, `src/pages/ModeratorRole.tsx`) said member management, batches, reports, audit and identity review were "still being connected"; they are connected. It now lists what is built, what is next (telling a member the decision, a moderator seeing only their own members, an owner console) and what is planned; it describes rejected photos, reprocessing, folder merging as they really work, and says a moderator is always added to one organization (by an administrator or an owner's invitation).
- **Added:** README section 13b "Giving FaceCloud to an organization": the four roles, the six setup steps using the admin console, the hosted and dedicated delivery options, the consent and privacy points, and an honest list of what is not built (owner console, billing and plan limits, quotas and branding, SSO, one-step organization deletion, member notification of decisions, moderators seeing only their own members). Checked against the backend: the plan is only a label (nothing enforces it), organization export exists, deleting an organization does not.
- **Verified:** `tsc` and both builds pass; text-only changes.

### 2026-10-19 — Rejected photos can be opened and viewed; dialogs no longer lose the cursor after one character
*Status: committed (this commit).*

- **Reported:** (1) on Rejected Images, clicking a photo did nothing, so there was no way to look at it; (2) typing in the Reprocess dialog's reason box moved focus to Cancel after one character.
- **Cause of (2):** `ConfirmDialog` ran its "focus Cancel" effect again on every render, because callers pass `onCancel` as an inline function (new each render) and each keystroke re-renders the caller. It now focuses Cancel once, when it opens, and keeps the latest `onCancel`/`busy` in a ref for the Escape key. This fixes every dialog that has a field (reprocess reason, merge reason, review note, delete-account password, etc.).
- **Changed:** Rejected Images: clicking a photo or its name opens a viewer with the 1024-pixel preview, size, dimensions, quality score, the reasons in plain words, the uploader, and "Open the review" when one exists; a file refused at upload opens with its details and no broken picture. Escape or a click outside closes it. Batch Management: clicking a photo in a batch opens the same kind of large view (new `PhotoLightbox`). `getPreview` takes an optional size (256 or 1024, the only sizes the backend serves).
- **Verified:** headless Chrome against a scratch copy of backend origin/main with real key events: the viewer opens with a real picture, shows the reason, closes with Escape and with an outside click; the batch lightbox opens; a 20-character sentence typed into the reprocess reason box stayed in the field (value and focus both correct). `tsc` and both builds pass, no new lint finding.

### 2026-10-19 — A moderator belongs to an organization: Organizations screen, organization choice for moderators, no-organization message
*Status: committed (this commit).*

- **Reported:** a moderator should work for an organization (a project) and not see everyone like an administrator; moderators added with no organization seemed to see data; a moderator should only see the people they add.
- **What was checked first (scratch copy of backend origin/main, two organizations Acme and Beta, a moderator with no organization, members invited by different people):** the backend already isolates organizations. A moderator with no organization gets **404 on every organization endpoint and 403 on every admin endpoint**; the Acme moderator got 200 on Acme and **404 on Beta**, and cannot open another person's photo directly (404). So no data from another organization leaks. What is true: (1) any moderator of an organization sees **all** of that organization's members' photos, including members invited by the administrator or by another moderator, (2) a moderator account can be made **without an organization** (administrator invitation, role change or Django admin) and the backend still lets it into the moderator portal (`dashboard_for_user` returns "moderator" for `User.role == "moderator"`), and (3) the administrator had **no screen to create an organization** and the moderator form had **no organization choice** (with two or more organizations the backend answers "send organization_id"). (1) and (2) are backend work and are in the prompt given to the owner.
- **Added (frontend):**
  - **Admin → Organizations** (`/admin/organizations`, sidebar and search): list the teams (personal workspaces hidden by default), create one with a name, an owner chosen by searching accounts, and a plan (`GET/POST /api/organizations/admin/`).
  - **Create moderator / Add User with role Moderator** now requires choosing the organization (`organization_id`); if none exists it links to Organizations; with one it is preselected.
  - **Moderator panel:** `resolveModeratorOrganization` no longer falls back to the person's personal workspace (it showed their own uploads as a queue); and a moderator who is in no team now gets "You are not part of an organization yet" on every screen (Settings still opens) instead of empty screens.
- **Files:** new `src/pages/admin/Organizations.tsx`, `src/lib/api/adminOrganizations.ts`, `src/lib/useAdminOrganizations.ts`, `src/components/moderator/NoOrganizationGuard.tsx`; edited `NewAccountForm.tsx`, `Users.tsx`, `Moderators.tsx` (admin), `adminUsers.ts`, `organizations.ts`, `AppShell.tsx`, `Sidebar.tsx`, `AdminSearch.tsx`, `App.tsx`, `ModeratorGate.tsx`.
- **Verified:** headless Chrome against the scratch backend: Organizations lists Acme and Beta and hides personal workspaces; creating "Gamma Studio" with owner `loner` saved it in the backend; the moderator form shows the organization choice and the moderator `modg` ended up in Gamma Studio only; a moderator with no organization saw the message on all nine moderator screens and Settings still opened; the Acme moderator listed Acme members only and no Beta uploads. Demo build: Organizations with sample teams and the demo notice, creation kept for the session, the moderator form offering the sample teams. `tsc` and both builds pass, no new lint finding. (The browser's own "select an item" check blocks a submit with no organization chosen, so the form's text message is only a fallback.)
- **Open (backend, in the owner's prompt):** make an organization **required** for every moderator account in every path; scope what a moderator sees to the members they invited plus members nobody invited, with the organization owner seeing all.

### 2026-10-19 — Moderator console connected to the live API (backend PRs #89–#93), invitation page, "Submit to", admin audit search
*Status: committed (this commit).*

- **Tested against:** a scratch copy of the backend with PRs #90, #91, #89, #92 and #93 merged in the owner's stated order (only #90 was on origin/main when this was done; the five merge cleanly). Seeded with a team organization, a moderator, two members, an outsider, 15 uploads (accepted, small, tiny, no face, duplicates), 3 person folders, reviews, a report and notifications.
- **Moderator screens now live** (each keeps its demo version for `VITE_USE_API=false`; the live part is in a `*Live.tsx` file next to it):
  - **Batch Management**: name, progress, per-outcome counts, per-photo size, outcome and thumbnail (fetched with the token); Retry failed / Cancel / Reprocess (reprocess asks first and says how many photos started). "Download Results" was removed: no endpoint exists for a moderator.
  - **Image Review** (`/moderator/images/:id`, id = review id; the queue's file names now link to it): the photo, measurements from the new `image` object, the review's state and deadline, Take/Release, Approve, Reject (reason required), Keep in review, Escalate, and its history from the audit endpoint.
  - **Identity Review** (new route `/moderator/identity`, sidebar item): the organization's person folders with covers and suggested merges; Merge asks first; "Dismiss" is browser-only as the backend documents. "Move Image" was removed (no free-form move for a moderator).
  - **Rejected Images** (new route `/moderator/rejected`, sidebar item): rejected and needs-review photos with worded reasons, a clear "Refused at upload" tile where there is no preview, search, and "Open review".
  - **Audit Entries**: the organization's trail with the new sentence, target name and status change, server search, a moderator filter, kind chips, "Load older". The "User notified" column is gone (not a backend concept).
  - **Notification Center**: real notifications grouped as Assignment / Deadline / Failure / Escalation, mark read, mark all, load older.
  - **Reports & Exports**: the seven real report types, day range, csv/pdf/json, history with who made it, and a download that sends the token.
  - **Settings**: real notification switches (`moderator_review_updates`, `email_notifications`), the queue auto-refresh as a browser choice (the queue now polls every 30 s when on), and the real list of signed-in devices. The fake "certificate registry" is gone.
- **Added elsewhere:**
  - **Upload "Submit to"** (single, multiple, ZIP): someone who belongs to a team can send the photos to it (`organization_id`); the default is their own workspace, and choosing the team says its moderators will see the photos. Without it a team member's uploads never reached the moderator (the backend finding in PR #89).
  - **Invitation page** `/invitations/:token`: previews the organization, email and role with no sign-in, shows the single invalid sentence for a bad link, and lets the signed-in invited person join (a moderator invitee is pointed to the moderator sign-in).
  - **Admin Audit Logs**: the box now searches the whole trail on the server (`?q=`); against a backend older than PR #90 it narrows the page on screen as before.
- **Mismatches found (to report to the backend):** (1) the review image endpoint accepts only `size` 256 or 1024 (my first draft asked for 800, fixed here); (2) the guide says the audit `?q=` matches "the action's name or sentence", but in practice it matches the actor, reason and action name only: `q=decided` finds 2 events, `q=Approved` finds none even though the sentence is "Approved face.jpg."; (3) a batch detail returns its fields under `batch` while the list is flat (documented, handled); (4) moderators only see a member's uploads when the member chose the team (by design, now offered in the UI).
- **Not done / for the owner:** **Moderation Logs** (`ModerationLogs.tsx`) is still demo data and has no route: it duplicates Audit Entries, so it was not wired or routed; say if it should be removed from the plan or routed. The Identity Review "dismiss" cannot persist (no backend field). Moving a single photo between folders outside a review item is not offered.
- **Verified:** headless Chrome against the scratch backend, all passing after two real fixes found on the way (review photo size; my own test selectors): Batches (list, expand with token thumbnails, disabled retry/cancel on a finished batch, reprocess dialog and start), Image Review (measurements, photo, take, approve with note, history), Identity (folders, suggestions, covers, dismiss, merge removes a folder in the backend), Rejected Images (all 3 rejected photos, refused tile, worded reasons, needs-review tab, open review), Notifications (assignment shown, mark-all saved), Reports (made, listed with author, download offered), Settings (email switch saved, sessions listed), Audit (counts, server search, batch chip), admin audit server search (11 of 11 matching events), upload "Submit to" (hidden for a person in no team, default personal, team choice put one more batch in the moderator's list), invitation page (preview without sign-in, wrong link sentence, other-email message, join makes an active member, link cannot be reused, moderator then lists the member). The demo build opened all 11 moderator routes with no `NaN`/error and no uncaught exception. `tsc` and both builds pass; the only lint warnings in touched files were already there.

### 2026-10-19 — User, admin and moderator can be signed in at the same time (session clash fixed)
*Status: committed (this commit).*

- **Reported:** signing in as an administrator while a user was signed in (and the other way round, and with the moderator) sent the other portal to "Access Denied" or asked it to sign in again.
- **Cause:** the three portals shared two storage keys, `facecloud_session` and `facecloud_refresh`, and localStorage is shared by every tab of the site. The second sign-in overwrote the first one's session, so the first tab's next page change failed the role check (`/unauthorized`); and because the refresh token also rotates in that single slot, a tab that refreshed its token could take the other portal's token or invalidate it. Signing out in one portal also cleared them all. Reproduced first in headless Chrome with three tabs (user tab ended on `/unauthorized`).
- **Changed:** each portal now has its own keys: `facecloud_session:<portal>`, `facecloud_refresh:<portal>`, `fc_was_logged_in:<portal>`, and its own in-memory access token. The portal is read from the page's path (`/admin…`, `/moderator…`, everything else is the user portal). New `src/lib/portal.ts`; `tokens.ts`, `session.ts` (`readSessionRaw`, `saveSession`, `clearSession`), `auth.ts`, `ProtectedRoute.tsx`, `AppShell.tsx`, `UserMenu.tsx`, `Settings.tsx`, the three login pages, `VerifyEmail.tsx` and five moderator pages use them. Anyone already signed in under the old single key is carried over once (their session and refresh token move to their portal's keys and the shared keys are removed), so nobody is signed out by this release.
- **Behaviour now:** the three portals can be open and signed in together in one browser; signing out of one leaves the others signed in; a refresh in one portal never touches another's token.
- **Verified:** headless Chrome, three tabs (user, admin, moderator) against a throwaway backend (origin/main): all three signed in, moving around and reloading each stayed in its own portal and showed its own account (`puser`, `padm`, `pmod`), signing the admin out left the user and moderator signed in, and the storage held separate keys per portal. A carried-over one-key admin session still worked and the shared keys were removed. Demo build: the same three-tab check passed. `tsc` and both builds pass, no new lint finding.
- **Note:** a public page such as the landing page reads the user portal's session only, so someone signed in only as an administrator is not shown as signed in there.

### 2026-10-19 — Admin console finished: real top-bar search and bell
*Status: committed (this commit).*

- **Added:** the admin top bar no longer has a dead search box and a demo bell.
  - **Search** (`src/components/layout/AdminSearch.tsx`): type a screen name to jump to it (works in the demo build too), and, against the live API, find an account by username, email or name (`GET /api/user/admin/users/?q=`, 5 results). Choosing an account opens Manage Users already filtered to it (`/admin/users?q=`; `Users.tsx` now reads `?q=`). Arrow keys, Enter and Escape work.
  - **Bell** (`src/lib/useAdminBell.ts`, `NotificationDropdown.tsx`): shows what needs an administrator now: open security alerts and services that are not operational, refreshed every 2 minutes and when the panel opens. Clicking an alert opens Security, a service opens System Monitoring. There is nothing to "mark read" (an alert stays until acknowledged), so the Mark-all button is replaced by a count and an "Open Security" link. The demo build keeps the demo feed; the moderator bell is unchanged.
  - Overview "Storage Used" shows `0 B` instead of `--` on an empty system.
- **Verified:** throwaway copy of backend origin/main with 12 failed sign-ins (2 alerts) and the usual degraded worker service; headless Chrome: red dot and panel list exactly the 2 alerts and 1 service from the API with a matching count of 3, no demo text, alert → Security, service → System Monitoring; search finds Statistics screens, finds one account on the server and not the others, opens Manage Users filtered to that account (1 row), says "Nothing matches" otherwise, Enter opens the first result; demo build: demo bell feed and screen search still work. No uncaught exception. `tsc` and both builds pass, no lint finding in touched files.
- **Admin status:** every admin screen, the top bar and the sidebar are on the live API. What remains for the admin side is outside the frontend admin code: backend `?q=` for the audit log (backend prompt item 5), the user portal's Live Enhancement posting camera sessions (so the Live Sessions card moves), and the optional screens for the backend's failed-batch and failed-job endpoints.

### 2026-10-19 — Admin: Statistics page added to the sidebar; Last sign-in column back
*Status: committed (this commit).*

- **Added:** `/admin/statistics` (route in `src/App.tsx`, sidebar item "Statistics" with a line-chart icon directly before "Upload Statistics"). It reads the live analytics (uploads trend, weekly enhancement success, live sessions, storage growth, 7 / 30 / 90-day chips) and keeps the demo data and the "Showing demo data" notice when `VITE_USE_API=false`.
- **Not routed on purpose:** `src/pages/admin/SystemHealth.tsx` (System Monitoring at `/admin/system` already shows the same services and health) and `src/pages/admin/Rejections.tsx` (it duplicates Rejection Summary). Both files are kept, nothing was deleted.
- **Changed:** Users and Moderators show the **Last sign-in** column again, always (the backend now stamps `last_login` on every successful sign-in; null still reads "Never"). The sidebar's home link no longer reports `aria-current="page"` on every page below it (`end` on `/admin`, `/dashboard`, `/moderator`); the visual highlight was already right.
- **Verified:** throwaway copy of backend origin/main (`f26b3d9`, the same commit as the owner's `main`, which is not behind), seeded with 3 accounts, 7 uploads (2 rejected) and 4 enhancements; headless Chrome: Statistics loads real data (weekly bar `2026-W42` 4 completed / 0 failed, matching the API; storage 824 KB; live sessions empty message), the sidebar lists Statistics before Upload Statistics and highlights only it, System Monitoring is unchanged (services, workers, queue table), `/admin/health`, `/admin/rejections` and `/admin/system-health` are 404, Users shows a date for accounts that signed in and "Never" for one that did not, Moderators shows the column, and the demo build shows `/admin/statistics` with the notice. No uncaught exception. `tsc` and both builds pass, no lint finding in touched files.
- **Note:** the brief asked for `git pull --ff-only` first; the owner's backend folder was already level with origin/main, and the throwaway copy was taken from origin/main with `git archive`, so that folder was not touched.

### 2026-10-19 — Member Management opens on "Invited by me"
*Status: committed (this commit).*

- The owner chose the narrower default: the screen now opens on **Invited by me**; **Whole organization** is one click away and still limited to the moderator's own organization. Files: `src/pages/moderator/MemberManagementLive.tsx`. Verified with `tsc` and both builds; the earlier 12 headless checks used the same code paths.

### 2026-10-19 — Moderator Member Management connected to the backend (organization-scoped)
*Status: committed (this commit).*

- **Reported:** the moderator's Member Management showed demo people (including ones from outside the moderator's organization). A moderator must only see their own organization's members.
- **Changed:** with `VITE_USE_API=true` the screen (`src/pages/moderator/MemberManagementLive.tsx`) reads `GET /api/organizations/{id}/members/` and `/invitations/` for the moderator's organization, so nobody from another organization (or the platform administrator) can appear. Rows show role, status and who invited them; "Invited by me" narrows to the moderator's own invitees. Actions are real: Invite (member role only; the backend's duplicate/permission messages are shown), Resend and Cancel for pending invitations, Deactivate / Reactivate, and Remove (confirmation; removes organization access, not the account). Owners and other moderators show "Locked" because the backend refuses a moderator touching them. The organization audit is written by the backend, so the demo's local audit push is not used live. The demo build keeps the sample screen unchanged. New API functions in `src/lib/api/organizations.ts`.
- **Also confirmed on the backend:** an administrator-created moderator is placed in the organization at once, so the other moderators' Members list shows them (invited by the administrator).
- **Also:** `ErrorBoundary` now resets by `key` (lint warning fixed); the 2026-10-19 push that failed with a network error was retried and went through.
- **Verified:** throwaway backend (origin/main) with an organization, two moderators, a member, and a user outside it; headless Chrome as the moderator: 12 checks passed (outsider and administrator not listed, other moderator Locked, invited-by shown, "Invited by me", invite, duplicate refused with the backend message, resend, cancel, deactivate, reactivate, remove); `tsc` and both builds pass, no lint finding in touched files.
- **Left:** "Only users I created" means invitees here (`invited_by`); the default was changed to "Invited by me" in the entry above. An invited person accepting through `/invitations/{token}` still has no route in the frontend.

### 2026-10-19 — Admin pages no longer blank on an older backend; Moderators list shows only moderators
*Status: committed (this commit).*

- **Reported:** on the owner's machine `/admin/system` and `/admin/audit-logs` were blank, Upload Statistics and Rejection Summary said the backend reports nothing, and the Moderators list showed every account (including the admin).
- **Cause:** the owner's local backend is `main` at PR #72; origin/main already has PR #86 merged. The older backend answers in another shape: audit rows without `message`/`status`/`actor_name`, health as a `checks` object instead of `services`, analytics without `overview`, and it ignores `?role=`. The audit and health screens crashed on the missing fields (with no error boundary, so the whole panel went blank), and the Moderators list lost the client-side role filter in the 2026-10-18 rewrite (my regression).
- **Changed:** `getAudit` and `getHealth` (`src/lib/api/adminSystem.ts`) accept the older shape (events worded from category and event; services read from `checks`; uptime shown as "—") and mark it `legacy`; the screens show an amber "backend is older than PR #86 — `git pull origin main` and restart" notice (`src/components/admin/OldBackendNotice.tsx`) instead of crashing or a bare message. The user list narrows by role on the client too and its count follows. New `src/components/ui/ErrorBoundary.tsx` wraps the page outlet in `AppShell`, so a crash in one screen keeps the sidebar and says so.
- **Verified:** throwaway copies of both backends (PR #72 and origin/main) with an admin, a moderator and a user; headless Chrome opened the 9 admin pages against each: none blank, no uncaught exception; on the old backend Moderators lists only the moderator and each affected page shows the notice; on the new backend the full figures show. `tsc`, both builds pass, no lint finding in touched files.
- **Not done:** the moderator **Member Management** screen is still demo data (`mockOrgMembers`), so it cannot yet show only the moderator's own organization. The backend already scopes `/api/organizations/{id}/members/` and invitations by organization, and an admin-created moderator is placed in the organization. Wiring that screen is pending the owner's go-ahead (§6).

### 2026-10-18 — Admin console connected to the live API (backend PR #86)
*Status: committed (this commit).*

- **Added / changed:** the admin screens now read the real backend when `VITE_USE_API=true` and keep the demo data when it is false (every screen shows a "Showing demo data" notice in that case).
  - **Overview, Upload Statistics, Rejection Summary** ← `GET /api/system/analytics/?date_from=&date_to=` with 7 / 30 / 90-day chips. Percent changes that are `null` show "—", never 0%. The storage gauge only appears when `capacity_bytes` is a number (it is `null` on S3). Rejection reasons are worded through `src/lib/reasons.ts`.
  - **Audit Logs** ← `GET /api/system/audit/` (25 per page, Newer / Older). Shows actor, role, status, message, resource and the address (sign-ins only). The search box narrows the page on screen only, because the API has no search.
  - **Security** ← `GET /api/system/security/alerts/` and `/rules/`. "Dismiss Event" became **Acknowledge** (a note is required; `POST …/{id}/acknowledge/`), with open / acknowledged status. The invented "Threat Index" and firewall text were replaced by the backend's real rules.
  - **System Monitoring** ← `GET /api/system/health/` and `/queue/`: real services, background workers, process uptime and a per-job queue table. CPU, memory and uptime-% columns removed (the API has none); `queue_size: null` shows "unknown".
  - **Image Monitoring** ← `GET /api/system/images/`, `/{id}/`, `/{id}/preview/` (previews are fetched as blobs with the token). A details panel replaces the "Audit Details" link, which pointed at a user-only route.
  - **Users / Moderators** ← `GET /api/user/admin/users/?q=&role=&page=&page_size=` with server search, paging, the real `uploads_count`, and Last sign-in only when the backend has recorded one.
  - **Statistics, Rejections, System Health** (pages that are not in any route today) were rewritten the same way and checked through temporary routes that were then removed.
- **Files:** new `src/lib/api/adminSystem.ts`, `src/lib/adminAnalytics.ts`, `src/lib/adminHealth.ts`, `src/lib/useAdminUserList.ts`, `src/components/admin/AsyncGate.tsx`, `src/components/admin/RangeChips.tsx`; rewritten `src/pages/admin/{AdminOverview,Statistics,UploadStatistics,Rejections,RejectionSummary,AuditLogs,Security,SystemHealth,SystemMonitoring,ImageMonitoring}.tsx`, `src/components/features/{RejectionReasonChart,SystemHealthCard}.tsx`; edited `src/pages/admin/{Users,Moderators}.tsx`, `src/components/ui/StatCard.tsx` (null change = neutral dash), `src/lib/api/adminUsers.ts`. No file deleted.
- **Mismatches found between the screens and the real JSON (reported, none faked):**
  1. Overview "Upload Trend — last 8 weeks" was per-day data for a window; now labelled "last N days".
  2. "Total uploads" is windowed (default 30 days), not all-time.
  3. `totals.images.rejected` is 0 while 4 photos were quality-rejected; `totals.images.accepted` means "not refused at upload". Rejected uses `overview.rejections.total`.
  4. `success_rate_percent` is the quality pass rate, not enhancement success (relabelled "Quality pass rate"); the weekly chart uses `enhancement_success_per_week`.
  5. Rejection reasons are mentions (a photo can carry several; review-level codes such as `face_validation_required` appear), so percentages are shares of reasons, not of photos.
  6. Storage: the original / enhanced split exists only in the top-level `storage_bytes`; camera snapshots are already inside it; capacity is `null` on S3.
  7. Live sessions stay 0 until the frontend Live Enhancement posts `/api/camera/sessions` (it does not).
  8. Decorative "+12%" and "Optimized via S3 buckets" claims, the "64×64 pixels" note and the fixed "40" bar scale were invented and are gone.
  9. Security: only `medium` and `high` risk exist (no `critical`, `low`, `suspicious`); the type is `failed_login`, `authorization_failure` or `rate_limit`.
  10. Health: the status word is `down`, not `outage`; there is no uptime %, CPU or memory.
  11. Image rows: `status` is "uploaded" for every file; the verdict is `quality.decision`, whose values are `accepted` / `rejected` / `needs_review` (the first draft guessed `accept` / `reject`, caught by the headless run). `duplicate_matches` is a **count**, not a list.
  12. Audit: `ip_address` only on sign-ins; `actor_role` can be null for a failed sign-in by an unknown name.
  13. **Backend: `last_login` is always `null`** — nothing stamps it on sign-in (the `adm` account had signed in many times). The Last sign-in column is therefore hidden until a value exists, instead of saying "Never" for everyone.
  14. `Statistics`, `Rejections` and `System Health` pages exist but have no route in `App.tsx` (the sidebar has no link either); they work but cannot be opened. Needs the owner's decision.
- **Verified:** `npx tsc` clean; `npm run build` and `VITE_USE_API=false VITE_API_URL= npm run build` pass; oxlint shows no finding in the new or edited files (existing warnings elsewhere unchanged). Headless Chrome against a throwaway copy of backend PR #86 (seeded with 10 photos, 6 enhancements, 4 rejections and 12 failed sign-ins → 2 alerts): 38 live checks passed, comparing each screen with the API JSON (counts, labels, per-type totals, first audit row and address, alerts, the acknowledge round trip with its note, every health service, queue table, image previews as blobs, upload counts, server search and role filter); the demo build opened all 12 admin pages with the demo notice, no `NaN` and no uncaught exception. In the dev server, 6 of 10 image previews were reset by Django's runserver when the dev build opened ~20 connections at once; the production bundle loaded 10 of 10, so that is a dev-server artifact.

### 2026-10-18 — User dashboard completed and checked end to end; review queue, secure-link list, delete account, reports, duplicates, contact form
*Status: committed (this commit).*

- **Added:** (1) **Review matches** (`/dashboard/groups/review`) with a banner on Person Folders: confirm, a different person (existing or new folder), or leave the face out (`PATCH /api/identities/assignments/{id}/review/`).
  (2) **Your secure links** on Downloads: every link, its target, opens and state, and **Stop this link** (`GET /api/shares/`, `POST …/revoke/`). (3) **Delete my account** in Settings → Security (password and a typed word; `DELETE /api/user/delete-account/`).
  (4) **Download report** for a photo and for an upload, as PDF, CSV or JSON (`/api/reports/images|batches/{id}/`, polled, then downloaded). (5) A notice on the photo page when it looks like another photo (`/api/duplicates/images/{id}/matches/`).
  (6) **Delete empty folder** on a Person Folder page. (7) The processing page now also explains why photos were not accepted. (8) The **Contact form** now posts to `POST /api/contact/` and shows the backend's own errors (503 when no recipient is set up, 429 when throttled); the demo build keeps its simulation.
  The Person Folders text no longer says uncertain photos go to a moderator (they wait for the person's own decision).
- **Corrected earlier claim:** the privacy audit trail (`/api/privacy/audit/`) is administrator-only, not a user feature.
- **Fixed on the way:** the "N accepted photos enhanced" panel ignored a photo that was still being enhanced, so it could say "All 1 accepted photo is enhanced" while another was in progress; photos being enhanced now count.
- **Files:** new `src/pages/user/PersonReview.tsx`, `src/components/features/{ShareLinksPanel,ReportButton,DuplicateNotice}.tsx`, `src/lib/api/{identityReview,shares,reports,duplicates}.ts`; edited `src/App.tsx`, `src/pages/Contact.tsx`,
  `src/pages/user/{DownloadsLive,GroupDetailLive,IdentityGroups,ImageDetail,ProcessingPage,Settings}.tsx`, `src/components/features/BatchEnhancementPanel.tsx`, `src/components/ui/ConfirmDialog.tsx`, `README.md`.
- **Verified (headless Chrome, throwaway copy of backend `origin/main` including PR #85):** sign-in errors and success, reload keeps the session, sign out, register with the emailed link, verify, sign in, forgot and reset password, old password refused;
  dashboard home; single, multiple and ZIP upload (blurred face accepted, tiny and no-face photos refused with plain reasons, counts equal the backend); processing list and detail; a real PDF report; My Images filters, search, delete, group by person;
  photo page enhance again, editor save, edited download; Person Folders list, banner, review queue confirm, rename, merge, delete empty folder, Download All ZIP, secure link opens without signing in, Stop this link makes it 410; Downloads history;
  notifications and bell, activity chips, global search; Settings profile, picture, notification switches, device list, privacy turn off, delete account, password change; Live Enhancement with a fake camera; contact form reaches the backend.
  The demo build (no backend) renders all 21 user and public routes without errors. `npm run build` and `npx oxlint src` clean (warnings only).
- **Findings for the owner and the backend:** the login rate limit is **20 per hour per address**, which can lock out a classroom or demo network (the test itself hit it); enhancement on a CPU with HD restoration on can take minutes and a backend restart leaves a result stuck at "processing"
  (the batch then stays "processing" and its report button is hidden); Person Folder photo rows carry no `membership_id`, so **move / remove a photo and set a cover photo cannot be built yet**.
- **Not built (needs the backend or is out of the user portal):** move / remove photo and cover photo (needs `membership_id`), "find this person" by uploading a face, folder change history, events, collages, camera sessions, the enhancement advisor and model comparison; the admin and moderator screens listed in section 6.

### 2026-10-18 — Each login page accepts only its own portal (the root `.env` was removed by mistake and recreated)
*Status: committed (this commit).*

- **Why admin could sign in on the user page:** the user login page called the sign-in with the portal `'any'` and then routed by the account's role, on purpose, so an admin or moderator who typed their credentials there was simply sent to their own console.
- **Change (the owner's preference: separate pages):** the user page now passes `'user'`. A staff account on `/login` is signed straight back out (its tokens revoked, nothing kept in the browser) and sees "This account does not have user access." The admin and moderator pages already refused other roles and still do.
  The staff pages are still reached by direct link only (the user page does not name them). `Portal` is now `'user' | 'admin' | 'moderator'`.
- **Root `.env`: removed by mistake, then recreated.** The owner asked for the useless keys to be deleted; the whole file was deleted instead of only the keys. It is git-ignored and was never committed, so it could not be restored: no git history,
  no editor history, nothing in the Trash. It was recreated at the owner's request with the same variable names (`NODE_ENV`, `PORT`, `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, their lifetimes, `FRONTEND_URL`, `STORAGE_PROVIDER`)
  and the same non-secret values as recorded in the audit. **The two JWT secrets are new random values** (the originals were never read and are lost) and the `?schema=public` part of `DATABASE_URL` is the usual default. Nothing in the current frontend reads this file.
  **Standing rule from the owner: no frontend file is deleted without being asked explicitly.**
- **Found and restored:** `WORK_LOG.md` was missing from the working tree in the middle of this session (not deleted by any command of mine); it was restored from the last commit with `git checkout`, so nothing was lost.
- **Files:** `src/lib/api/auth.ts`, `src/pages/Login.tsx`, `README.md`, `WORK_LOG.md`.
- **Verified:** `npm run build` clean. Headless Chrome vs. a throwaway backend (current `origin/main`) with one user and one admin account: admin account on `/login` refused with no session or refresh token left; user account on `/login` reached `/dashboard`; admin account on `/admin/login` reached `/admin`; user account on `/admin/login` refused with no session left.

### 2026-10-18 — Project audit; lint error fixed in the photo editor
*Status: committed (this commit).*

- **Audit (frontend, backend, keys):** written into §6 above. Highlights: no API key, token or secret exists in the frontend source, `public/` or `index.html`; the only frontend settings are `VITE_API_URL` and `VITE_USE_API` (public values).
  The root `.env` is a leftover of the old Node design (a database URL with a development password, Redis URL, two JWT secrets); it is git-ignored and has never been committed, and nothing in the app reads it.
  Third-party assets loaded at run time: Google Fonts; the Live Enhancement face detector (MediaPipe wasm from jsdelivr at `@latest`, model from storage.googleapis.com); the landing page's "Freedom" section hotlinks a Mux video and two Webflow CDN SVGs that belong to another site.
- **Fix:** `oxlint` reported an error in `src/pages/user/PhotoEditor.tsx` ("React Hook useVersion cannot be called inside a callback"): the "Use this" handler was named like a hook. Renamed to `switchToVersion`. No behaviour change.
- **Files:** `src/pages/user/PhotoEditor.tsx`, `WORK_LOG.md`.
- **Verified:** `npm run build` clean; `npx oxlint src` now shows warnings only.

### 2026-10-17 — "What was done" panel for an enhancement (stages that ran, stages that could not, HD availability)
*Status: committed (this commit). Built against backend PR #85 (open, not merged); every field is optional so it also works before that PR.*

- **New panel `EnhancementReport`:** on the photo page (Enhanced version card), on the Live Enhancement result and on the single-upload result. It shows the backend's one-sentence summary (or builds one from the stages),
  each stage that really changed the photo (low light, noise, blur, face, HD) with the model and, for HD, the scale and size, and an honest amber notice **"HD restoration is not available on this server"** when restoration was needed
  but could not run, instead of implying the photo was improved. "Show details" lists the stages that were needed but not run with a short reason, the technical reason, and (when the backend sends them) what the analyzer
  measured (`diagnosis`) and planned (`plan`), rendered generically so those shapes can grow. With no stage data (older backend) the panel is simply not shown.
- **Also fixed:** the photo page said "A moderator is taking a look at this one" for a photo whose status is "completed" (enhanced); it now says it passed every check and was enhanced.
- **Files:** new `src/components/features/EnhancementReport.tsx`; edited `src/lib/api/enhancements.ts` (types `AppliedStage`, `SkippedStage`, optional result fields), `EnhancedVersionCard.tsx`, `LiveEnhancementPanel.tsx`,
  `src/pages/user/UploadSingle.tsx`, `src/pages/user/ImageDetail.tsx`.
- **Verified:** `npm run build` clean (and the demo build). Headless Chrome against a throwaway copy of PR #85's branch: a photo whose result had stage records showed "Removed blur, Enlarged ×2 to 1280 × 720, Restored the face" with the
  models listed and no warning (the stage records were written into the throwaway database to see this view, because the models are not installed on this machine); a blurred photo whose restoration could not run showed the honest
  notice, and its details named the stages that were needed but not run and the technical reason.

### 2026-10-17 — ZIP and multiple upload: processing steps, why photos were rejected, and enhancement made visible
*Status: committed (this commit).*

- **Problems found by the owner:** (1) after a ZIP upload some face photos were rejected and nothing said why; (2) the ZIP page showed no processing steps and never said whether the photos were being enhanced.
  The page also claimed "Each photo is enhanced and validated", which was not true: checking a photo does not enhance it, and the backend does not enhance accepted photos by itself yet.
- **Processing steps:** while a batch runs the page lists the backend's real stages (received, preparing, face check, quality check, grouping, enhancing, finishing) with the current one marked and how many photos are on it.
  Nothing is timed or simulated. The copy now says what really happens (photos are checked; accepted ones can then be enhanced).
- **Why photos were not accepted:** a "Why some photos were not accepted" card groups the reasons in plain words with the numbers and the photo names (for example "Face too small in the frame · 1 photo", with what it means and what to do).
  For a rejected photo only the rejecting reasons are shown, not the milder ones that would only have meant review. The photo page's "Why" uses the same explanations (`src/lib/reasons.ts`), and the processing page's Problem column too.
- **Enhancement section:** says "N of M accepted photos enhanced" and offers **Enhance accepted photos** with a progress bar; it only counts and only enhances accepted photos. It enhances them one request per photo, three at a time,
  because the backend's whole-batch call (`POST /api/enhancements/batches/{id}/`) also enhances the photos that were rejected (found in testing: all 3 rejected photos of a ZIP got enhanced copies). "Download Accepted" now uses the same
  per-photo approach when it has to enhance first.
- **Files:** new `src/lib/reasons.ts`, `src/lib/batchEnhance.ts`, `src/components/features/{BatchStageList,BatchEnhancementPanel,RejectionBreakdown}.tsx`; edited `src/lib/uploadBatch.ts`, `src/lib/api/images.ts`, `src/lib/api/downloads.ts`,
  `src/pages/user/{UploadZipLive,UploadMultipleLive,ImageDetail,ProcessingPage}.tsx`, `README.md`.
- **Verified:** `npm run build` clean (and the demo build). Headless Chrome vs. a throwaway backend (all PRs merged) with a ZIP of 5 photos (2 good, 1 face too small, 1 tiny, 1 with no face): counts 2 accepted / 3 rejected,
  each reason explained with its photo, no milder reasons on rejected photos, "0 of 2 accepted photos enhanced" then after the button "All 2 accepted photos are enhanced", and the backend shows the 3 rejected photos were not enhanced.
  A bug found on the way (a React dev double-mount left the panel blank) was fixed.
- **Backend follow-ups:** batch enhancement must skip photos that were not accepted; accepted photos should be enhanced automatically (WP2); the small-face rule (WP1) is what rejects photos like the "face too small" one.

### 2026-10-17 — Activity Logs: the type chips and search now work across your activity
*Status: committed (this commit).*

- **Problem found by the owner:** clicking upload, group, reject, login or email did nothing. The chips only filtered the 20 events on the page in view, so a type with no events there showed an empty list or looked broken.
- **Fix:** picking a chip (or typing in the search) loads the newest events in one go (up to the backend's 500-event window, 100 per request) and filters them on screen. Each chip shows its count; a type with none says
  "No group activity in your latest N events." instead of looking inert; the subtitle says how many matched and that older events are not searched. Without a filter it browses page by page as before.
  The backend's own `?category=` filter was not used because its storage categories (processing, moderation, auth ...) do not match the types on the chips (enhance, reject, login, email ...).
- **Files:** `src/lib/api/activity.ts` (`listActivity` page size, `listActivityWindow`), `src/pages/user/ActivityLogsLive.tsx`, `README.md`.
- **Verified:** `npm run build` clean (and the demo build). Headless Chrome vs. a throwaway backend with real events: upload chip showed exactly the 2 uploads, reject the rejected photo, login the sign-ins, group and email said none,
  All restored the full list, and search found an event beyond the first page.
- **Backend suggestion (optional):** a `?type=` filter using the same mapping as `activity/presentation.py` would make this exact beyond 500 events.

### 2026-10-17 — Photo editor: "Hold to compare" now shows the original upload
*Status: committed (this commit).*

- **Problem found by the owner:** holding the compare button in the editor showed the enhanced photo without edits (the first preview), which looks the same as the edit, so nothing seemed to happen.
- **Fix:** while the button is held (mouse, touch, or Space/Enter) the editor shows the photo exactly as it was uploaded, labelled "Original"; releasing brings the edit back. The button now reads "Hold to see the original".
- **Files:** `src/pages/user/PhotoEditor.tsx`.
- **Verified:** `npm run build` clean (and the demo build). Headless Chrome vs. a throwaway backend: held, the picture is byte-identical to the backend's original thumbnail; released, the edited preview returns (a different picture).

### 2026-10-17 — Photo editor (sliders), Enhance again, and Delete for photos
*Status: committed (this commit).*

- **Delete:** `Delete this photo` on the photo page, and **Delete** for the photos ticked on My Images (rejected photos can now be ticked too; Group by person only uses the accepted ones) and on a Person Folder page.
  A confirmation names what goes ("permanently deleted … cannot be undone"); a failure on one photo is reported and does not stop the others. Uses `DELETE /api/images/{id}/` one photo at a time.
  The backend still needs to be checked for what else a delete should clean up (folder counts, share links, ZIPs): see the backend prompt, WP5.
- **Enhanced version card (photo page):** shows the enhanced photo against the original (before/after slider), the plain-sentence summary and style/strength actually applied, **Enhance this photo** for an accepted photo
  that was never enhanced, **Enhance again** with a chosen style (Natural, Dynamic, AI Enhance) and strength, **Download** (the current edit if there is one, otherwise the enhanced photo), and **Edit photo**.
- **Photo editor (`/dashboard/images/:id/edit`):** the sliders come from the backend (`GET /api/enhancements/editor/configuration/`): brightness, contrast, shadows, highlights, saturation, warmth, sharpness, the AI tools
  (low light, noise, deblur, face restoration; disabled with a note when the server has no model for them) and blend. Moving a slider renders a server preview (`POST …/results/{id}/previews/`, 600 ms after the last move, newest
  revision wins); **Auto / Auto + brighten / Auto, keep tones** let the server choose and move the sliders to what it applied; **Reset**; **Hold to compare**; **Save as new version** renders the full-size edit
  (`POST …/previews/{id}/save/`, polled until done) and it becomes the current version. Versions list with **Use this**, **Download** and **Delete** (with confirmation). Enhanced photo and original are never changed.
- **Files:** new `src/lib/api/editor.ts`, `src/components/ui/ConfirmDialog.tsx`, `src/components/features/EnhancedVersionCard.tsx`, `src/pages/user/PhotoEditor.tsx`; edited `src/App.tsx` (route), `src/pages/user/ImageDetail.tsx`,
  `src/pages/user/MyImages.tsx`, `src/pages/user/GroupDetailLive.tsx`, `src/lib/api/images.ts` (`deleteImage`), `src/lib/api/enhancements.ts` (summary fields), `README.md`.
- **Verified:** `npm run build` clean (and the demo build). Headless Chrome against a throwaway copy of backend `main` (#67, #71, #72 merged): enhanced a photo from its page; opened the editor (12 sliders from the contract, first preview);
  moving Brightness to 40 produced a server preview with that value and changed the picture; Auto + brighten set the sliders to what the server applied (brightness 6, shadows 18); Reset restored every slider; Save created one
  completed, current version with the chosen values; the photo page then offered "Download edited"; deleting the version removed it on the backend; deleting a photo from its page and two rejected photos from My Images
  removed them on the backend.
- **Not done yet:** Person Folder review queue and move/remove, share-link list and revoke, Delete account, processing report button, duplicate result, backend WP1 to WP7.

### 2026-10-17 — A lost session now signs you out instead of showing "Authentication credentials were not provided"
*Status: committed (this commit).*

- **What the owner saw:** My Images, Person Folders and Downloads all showed "Authentication credentials were not provided" while the app still looked signed in, and the backend admin showed
  `no such column: accounts_user.display_name`. Cause: the development database had not been migrated after backend PR #67 (profile columns), so restoring the session after a reload failed on the server;
  the app then discarded the refresh token but kept its signed-in screen.
- **Fix:** (1) a server error (5xx) or a network failure while restoring the session no longer throws the refresh token away; the call fails with "FaceCloud could not reach the server to restore your session"
  and a retry works once the server is back. (2) If the API still answers 401 after every recovery (token revoked, expired, or no longer known), the app clears the session and goes to the sign-in page with the
  "session expired" notice, for all three portals.
- **Files:** `src/lib/api/client.ts` (refresh outcome ok / invalid / unavailable, `SESSION_LOST_EVENT`), `src/components/layout/AppShell.tsx` (signs out on that event).
- **Verified:** `npm run build` clean (and the demo build). Headless Chrome against a stub API: refresh answered 500, stayed signed in with the "could not reach the server" message and the refresh token kept; refresh
  answered 401, sent to `/login` with the banner and the local session cleared; stale session with no tokens, sent to `/login`.
- **Database fix (backend side, not code):** the development database must be backed up and migrated per `docs/deployment/merge-and-migration-plan.md` in the backend repo.

### 2026-10-17 — Live Enhancement: captured frames now use the real pipeline; "Save to My Images" works
*Status: committed (this commit).*

- **Problem found by the owner:** the snapshot result was only a browser brightness/contrast filter dressed up as "AI face restoration" with random "confidence / brightness / detail" numbers, and
  **Save to My Images** only showed a toast (nothing was saved). Both were fake.
- **Fix (API mode):** Enhance now stores the captured frame as a real photo (JPEG, full capture size), waits for the pipeline's verdict, then calls the real enhancement with a chosen **Style**
  (Natural / Dynamic / AI Enhance, default AI Enhance) and **Strength** (Automatic / Light / Moderate / Strong), and shows the real before/after. A frame that is not accepted (or goes to review) says why and is
  not "enhanced". **Enhance again** re-enhances the same stored photo with new settings instead of uploading it twice. The old random metrics are replaced by real facts only (style, strength applied,
  face check, output size, processing time). **Save to My Images** became **View in My Images** (the frame is already stored when enhanced). The demo-only disclaimer and mock are kept for the demo build.
  Page wording no longer claims the live preview is Zero-DCE (it uses simple browser filters).
- **Files:** new `src/lib/liveSnapshot.ts`; edited `src/components/features/LiveEnhancementPanel.tsx`, `src/pages/user/LiveEnhancement.tsx`, `README.md`.
- **Verified:** `npm run build` clean (and the demo build). Headless Chrome with a fake camera against a throwaway copy of backend `main`: captured a frame, enhanced it, got the real before/after and
  real "what was done" values, and the frame appears in My Images (backend `display_status` completed, enhancement completed, style ai_max).
- **Known limit (backend):** output size equals the capture size (1280 × 720 here). Real "HD" (2x upscaling, face restoration) needs the backend's `HD_RESTORATION_ENABLED` (default off) and its model
  checkpoints; a prompt for that went to the backend owner.

### 2026-10-17 — Settings profile details, picture and devices; Merge folder; download follow-up
*Status: committed (this commit). Profile details, picture and devices were built against backend PR #67 (open, not yet merged); the old-backend fallback was tested too.*

- **Profile details on the account:** organization, job title, phone and country are loaded from and saved to `PATCH /api/user/profile/`; the backend's reasons are shown (e.g. an invalid phone number).
  If the backend has no such fields (before PR #67), they stay on the device and the "kept on this device only" note shows, exactly as before.
- **Picture on the account:** the avatar photo is saved with `PUT /api/user/avatar/` (and removed with `DELETE` when a colour is picked or Reset is used), and every device brings it back
  (`src/lib/useServerAvatar.ts`, run from the top bar). Without backend support the picture stays in the browser as before.
- **Devices:** the Security tab lists the signed-in devices (`GET /api/user/sessions/`: device, IP, last active, "This device") with Revoke per other device
  (`POST …/revoke/`), above "Sign out of all devices". Without backend support the list is hidden (never invented).
- **Merge folder (Person Folders):** a "Merge folder" button on a folder opens a panel to pick another of your folders; its photos move into this one and the other folder is retired
  (`POST /api/identities/groups/{id}/merge/`). It warns that this cannot be undone here. Added after the same person ended up in two folders.
- **Downloads:** the "no enhanced images yet" 409 is now recognised by the backend's `code` (`enhancement_required`, backend PR #79) as well as by its wording, so it works before and after that PR.
- **Files:** new `src/lib/api/account.ts`, `src/lib/useServerAvatar.ts`, `src/components/features/MergeFolderPanel.tsx`; edited `src/pages/user/Settings.tsx`,
  `src/pages/user/GroupDetailLive.tsx`, `src/components/layout/Topbar.tsx`, `src/lib/api/identities.ts`, `src/lib/api/downloads.ts`, `README.md`.
- **Verified:** `npm run build` clean (and the demo build). Headless Chrome against a throwaway copy of backend PR #67's branch: all five profile fields saved and reloaded from the account
  (also with the local copy wiped), invalid phone refused with the reason, picture stored as a PNG and restored on a browser with nothing stored, choosing a colour cleared it, the device list
  showed this device and Revoke removed exactly one session on the backend, merging folders left the backend with one folder fewer. Against a throwaway copy of backend `main` (no #67): sign-in,
  name save, local extras and picture, no device list, sign-out-everywhere and notification switches all behaved as before.

### 2026-10-17 — Settings connected to the backend: name, password, sign out everywhere, notification switches
*Status: committed (this commit).*

- **Profile:** Save Changes now sends the Full Name to `PATCH /api/user/profile/` and shows the name the backend stored (top bar updates). Organization, job title,
  phone, country and the picture are not stored by the backend yet, so they stay on this device; a one-line note on the page says so (API mode only).
- **Security:** Update Password calls `POST /api/user/change-password/` (current password, new password, confirm checked on screen, the backend's reasons shown, e.g.
  "Current password is incorrect", "This password is too common"). The backend ends every session on success, so the app clears the local session and goes to
  `/login` with a green "Your password was changed" notice. The invented "Active Sessions" list (fake Chrome/Firefox rows) is replaced in API mode by
  **Sign out of all devices** (`POST /api/user/logout-all/`); a real device list needs backend PR #68. The demo build keeps its old list.
- **Notifications tab:** the six switches load from and save to `GET/PATCH /api/notifications/preferences/` (Save Preferences, "Preferences saved"). Demo build unchanged.
- **Files:** `src/pages/user/Settings.tsx`, `src/lib/api/auth.ts` (`updateProfileName`, `changePassword`), `src/pages/Login.tsx` (notice banner), `README.md`.
- **Verified:** `npm run build` clean; headless Chrome against a throwaway backend copy: name persisted in the backend, switches flipped and persisted across reload,
  mismatch / wrong-current / weak-password errors shown, successful change lands on `/login` with the notice and clears the session, the old password is refused (400)
  and the new one signs in, Sign out of all devices ends the session and the dashboard redirects to `/login`. Demo build (`VITE_USE_API=false`) re-checked for every
  user screen changed today: Multiple, ZIP, Downloads, Notifications, Activity, Settings, bell and search all render and behave as before.

### 2026-10-17 — Activity, Notifications, top-bar bell and global search on the real backend
*Status: committed (this commit).*

- **Activity (`/dashboard/activity`):** your real history from `GET /api/user/activity/`, paged by `has_next`; type chips (upload, enhance, validate, download, group,
  reject, login, email) and the search box narrow the loaded page (the subtitle says so).
- **Notifications (`/dashboard/notifications`):** real list with count and per-page unread, Mark all read, Open (marks read then goes to the page), dismiss (delete), paging,
  link to Settings → Notifications. "Clear alerts" removed. The backend's `/dashboard/uploads` links are mapped to `/dashboard/jobs`.
- **Bell:** unread count polled every 60 s and after any change on the Notifications page; the panel shows the latest six, click marks read and opens, "Mark all as read", "View all".
  Admin and moderator keep their demo bell.
- **Search:** the top-bar field (⌘K) searches photos (with protected thumbnails), Person Folders and uploads via `GET /api/search/` from 2 characters, debounced, keyboard
  navigable. Admin and moderator keep the plain field.
- **Files:** new `src/lib/api/{notifications,activity,search}.ts`, `src/lib/useLiveBell.ts`, `src/components/layout/GlobalSearch.tsx`,
  `src/pages/user/{ActivityLogs,Notifications}{Live,Demo}.tsx` (the old pages kept as `*Demo`, `ActivityLogs.tsx`/`Notifications.tsx` are switches);
  edited `Topbar.tsx`, `NotificationDropdown.tsx`.
- **Verified:** headless Chrome vs. throwaway backend: bell dot and counts equal the backend (39 → 38 → 0 on read / mark all), page count equals backend, dismiss deletes,
  Open navigates, real activity entries and chip filter, search finds photos (real thumbnails), a Person Folder, and a ZIP upload by its name.

### 2026-10-17 — Multiple upload, ZIP upload and Downloads on the real backend
*Status: committed (this commit).*

- **Multiple upload:** choose up to 150 photos, previews, add/remove, one batch upload, live progress, a verdict per photo (accepted / sent to moderator / rejected / failed)
  from the batch progress rows, summary counts, **Download Accepted (N)** as a ZIP (enhances the batch first if needed), link to each photo and to processing details.
- **ZIP upload:** a `.zip` up to 2 GB, "Found N photos", progress, final counts, **Download Accepted Photos (ZIP)**, links to My Images / Person Folders / processing details.
  The fake "Copy Secure Download Link" button was removed.
- **Downloads:** the real download history (paged). Each row's Download adds a new history line; the secure-link button appears only for enhanced photos and Person Folder
  ZIPs (link shown once, with Copy and expiry); an expired batch ZIP says so and can be prepared again. The fake "Download All (ZIP)" was removed.
- **Files:** new `src/lib/api/downloads.ts`, `src/lib/saveBlob.ts`, `src/lib/uploadBatch.ts`, `src/pages/user/{UploadMultiple,UploadZip,Downloads}{Live,Demo}.tsx` (old pages kept as `*Demo`,
  the original names are switches); extended `src/lib/api/enhancements.ts` (`enhanceBatch`).
- **Verified:** headless Chrome vs. throwaway backend with real face photos: on-screen counts equal the backend's verdicts; the ZIPs contain enhanced images + manifest + CSV report;
  the downloads count equals the backend; a secure link opens without signing in.

### 2026-10-16 — Person Folders connected to the backend: list, folder page, rename, ZIP downloads and secure link
*Status: committed (this commit). Built against backend PRs #76 and #77 (merged).*

- **List (`/dashboard/groups`):** real folders from `GET /api/identities/groups/` with a mosaic of up to four of their photos (protected thumbnails fetched
  with the token), the photo count and the update date; loading, error-with-retry and empty states; the consent banner stays. The "FaceNet/ArcFace" wording
  on this page was replaced by neutral text. With the API off it shows the demo folders as before.
- **Folder page (`/dashboard/groups/:id`):** the real name, photo count, **average confidence** (the backend's percentage; "—" when it has none, never
  invented), dates, a cover photo, and the folder's photos (name, size, real dimensions, per-photo match %, status badge) with paging (24 per page) and
  selection that survives paging. **Rename** saves through `PATCH …/rename/`. **Download All / Download Selected** ask for a ZIP
  (`POST …/exports/`, with `image_ids` for a selection), wait for the background job (`queued → generating → ready`), then download it with the token;
  the ZIP holds the originals plus a manifest and report. **Secure Link** prepares the whole-folder ZIP and calls `POST …/exports/{id}/share/`; the link is
  shown on screen with its expiry and a "shown only now" warning (the server keeps only a hash, so it is gone on leaving the page), with a Copy button as a
  convenience. A folder that is not yours or does not exist shows "This folder could not be found." (not the raw 404 text) and a way back.
  The original mock page is kept as `GroupDetailDemo` and is what the demo build renders.
- **Files:** new `src/lib/personFolders.ts`, `src/pages/user/GroupDetailLive.tsx`, `src/pages/user/GroupDetailDemo.tsx` (the old page, renamed);
  rewritten `src/pages/user/GroupDetail.tsx` (a switch), `src/pages/user/IdentityGroups.tsx`, `src/components/features/IdentityGroupCard.tsx`;
  extended `src/lib/api/identities.ts`; `README.md` (routes, and a warning about building the hosting copy).
- **Verified:** `npm run build` clean. Headless Chrome against a throwaway copy of backend `main` (#76/#77 included), real photo files in storage, two users:
  the list shows only your folders with real thumbnails; the folder page shows 5 photos with the real 93.4% average; rename persists across a reload;
  Download Selected produced a ZIP with exactly the 2 chosen photos (+ manifest + report), Download All one with all 5; the Secure Link opened with no
  sign-in and served the whole-folder ZIP; another person's folder id and an unknown id both say "could not be found" and show none of the other
  person's data; an empty folder says so and its download buttons are disabled; a 26-photo folder pages 24 + 2, keeps the selection across pages, and
  "select this page" adds only that page; the demo build still renders the demo list and the original demo folder page.
  Two things the test caught and were fixed: per-photo match % was shown ×100 ("9000%", the backend already sends a percentage), and the raw backend 404 text
  was showing for a missing folder.
- **Not verified:** real faces (the test folders were seeded, so how well real photos group is the backend's business); the owner's own server and data; the
  folder's `merged`/`archived` states (the list only returns active folders); merge, move and delete of folders (the backend has them, no screen does).
- **Heads-up:** the link's address comes from the backend setting `PUBLIC_BACKEND_URL` (default `http://127.0.0.1:8000`), so on a server where that is not set it
  points at the wrong host. It must be the real public address in production.
- **Live site checked the same day:** `facecloudai.com` serves a demo build whose bundle names (`index-CVO94ZWl.js`, `index-DzX0cciM.css`) are identical to a
  clean build of the then-latest pushed commit (`0e2fcc7`), with the API off and no localhost address in it. The `dist/` folder left on the owner's machine by
  `npm run build` is *not* safe to upload (it carries `.env.local`'s API address); see the README warning.

### 2026-10-16 — Admin "Add User" and "Create moderator" now create real accounts
*Status: committed (this commit). Built against backend PR #75, which is merged.*

Backend PR #75 (merged) added `POST /api/user/admin/users/`, so the two forms that were switched off against the live API are on.

- **`src/lib/api/adminUsers.ts`:** `createAdminUser({username, email, password, role})`.
- **`NewAccountForm`:** the "backend cannot create accounts yet" note and the disabled button are gone. The form now awaits the parent's
  create call, shows "Creating…", and on a refusal shows the backend's own message (duplicate email, weak password, "Create an organization
  first, then try again", more than one organization…) while keeping what was typed. It no longer knows about `VITE_USE_API`.
- **Users and Moderators pages:** with the API on, create → the list is read again and the new account appears; in the demo build it is kept for the
  session as before.
- **The "account created" card** shows the **email** to sign in with and the password, once. The sign-in screens take an email address (their field is
  `type="email"`), so showing only the username would have sent the new person to a login they could not complete. The label of the card says
  "(demo — nothing is saved)" only in the demo build.
- **Files:** `src/lib/api/adminUsers.ts`, `src/components/admin/NewAccountForm.tsx`, `src/pages/admin/Users.tsx`, `src/pages/admin/Moderators.tsx`.
- **Verified:** `npm run build` clean. Headless Chrome against a throwaway copy of backend `main` (PR #75 included) on its own ports with an empty database,
  one organization and an admin: admin signs in; a moderator is created (card, list updates; database: role moderator, verified, moderator membership in the
  organization); a duplicate email and a weak password show the backend's message with the typed values kept; Cancel closes the form; Add User creates a
  user and, with role Moderator, a moderator; the new moderator then signs in to `/moderator`; the card shows the email; the demo build still works.
  **Not verified:** against the owner's own server and database (not touched); the case of more than one organization (the form has no organization
  field, so the admin would see the backend's "send organization_id" message and could not proceed from this screen).
- **Known limits:** sign-in forms accept an email only, although the backend also accepts a username (so an admin whose username is not an email address
  must sign in with the email); the first organization has to be created through the API (`POST /api/organizations/admin/` with `owner_id`) because no screen does it.

### 2026-10-16 — Face-grouping consent: a card on My Images when photos are selected, plus a Settings card (for the owner's review)
*Status: committed (this commit); the owner reviewed it and approved.*

The backend refuses to analyse faces (and so to build Person Folders) for anyone who has not said yes
(`BIOMETRIC_CONSENT_REQUIRED=True`, and production refuses to start without it), but the frontend had no way to ask. This adds that,
**frontend only** — the backend's existing `GET/POST /api/privacy/consents/`, `GET /api/privacy/export/` and
`POST /api/identities/images/{id}/` are used as they are. First version was a pop-up on every sign-in; the owner asked for the
question to appear only where it matters, so it was reworked:

- **My Images now lets photos be selected** (a checkbox on each card whose upload was accepted; rejected or still-processing photos
  cannot be ticked, because the backend answers 404 for them). A bar at the bottom shows "N selected", Clear, "Select all on this
  page" and **Group by person**.
- **The consent card appears only when something is selected** and the person has not agreed (or agreed to an older policy).
  Nothing is shown at sign-in, on the dashboard or on the Person Folders page. "Not now" hides it while the selection stays;
  pressing "Group by person" brings it back; "Allow face grouping" saves the yes and, if they had pressed Group by person, carries on.
  Once they have agreed, selecting never shows the card again. The card is a card, not a pop-up.
- **Group by person** asks the backend to analyse each selected photo (`POST /api/identities/images/{id}/`, queued), then says how many
  started and shows the backend's own message for any that could not be (for example "Identity inference is unavailable until an
  approved provider is configured" on a server without the face models). It is disabled in the demo build.
- **Settings → Camera & Privacy:** a "Face grouping" card — status badge (On / Off / Needs confirming) and **two separate buttons**:
  **Turn off face grouping** (withdraws consent only) and **Delete my face data** (red). Delete is its own action and is offered whether
  grouping is on or off, because stored data can outlive a "no". It first asks the backend what is stored (`GET /api/privacy/facial-data/`),
  says "There is no face data stored for you" when there is nothing, and otherwise shows how many detected faces and Person Folders will
  go, that edit history and exports go too, that the photos themselves stay, that grouping stays on if it was on, and "This cannot be
  undone" — then "Yes, delete my face data" (`DELETE /api/privacy/facial-data/` with `confirm: true`) or Cancel. The old single checkbox
  "Also delete my face data" was removed. Also "Download my data" (the backend's JSON export; face templates are counted, never
  included). Demo build: the card says nothing is saved.
- **Person Folders page:** a banner says why there may be none ("Face grouping is off, so no new Person Folders are being created", or
  "…paused until you confirm again"). "Turn on face grouping" opens the **full consent card**; a yes is never saved by one click, and the
  database was checked to hold nothing until "Allow" is pressed. After a yes the banner becomes a note: photos uploaded from now on are
  grouped, and older ones are grouped by selecting them in My Images and pressing Group by person (with a link). A second note says the
  folders on this page are examples, because the list is still demo data (a new real user used to see "Person 1/2/3" with no hint they
  were not theirs). The banner exists only on this page, and not in the demo build.
- **Why here:** the owner asked that the question not appear at sign-in or on the dashboard; someone who opens Person Folders is looking
  for their folders, so it is the natural place to explain that they are off. Other places considered and not built: a checkbox on the
  upload screens (the best moment, since new uploads are analysed automatically once consent exists), a sidebar badge, a dashboard line,
  and a sign-up checkbox (needs a small backend change).
- **Files:** new `src/lib/api/privacy.ts` (consent, export, facial-data counts and erase), `src/lib/api/identities.ts`, `src/lib/consent.ts` (one shared store so every place agrees),
  `src/components/features/ConsentPrompt.tsx` (`ConsentCard`, `ConsentBanner`); edited `src/pages/user/MyImages.tsx`, `src/components/features/ImageCard.tsx`,
  `src/pages/user/Settings.tsx`, `src/pages/user/IdentityGroups.tsx`.
- **Verified:** `npm run build` clean. Headless Chrome against backend PR #73's code on its own port and an empty database, consent required,
  face models available: no card or pop-up at sign-in, on the dashboard or on Person Folders; My Images shows checkboxes and no bar until
  something is picked; selecting shows the card naming the selection; Not now hides it and keeps the selection; Group by person brings it
  back; Allow carries on and reports "Grouping started for 1 photo"; afterwards selecting shows no card; Select all and Clear work. On a
  server without the face models the failure message was shown and the selection kept. Settings flows (Allow, Turn off, erase with confirmation,
  Download my data, re-confirm after a policy-version change), light mode and the demo build (selection works, no card, Group by person disabled)
  were also checked. **Not verified:** the owner's own server and account (their data was not touched); that grouping actually produces folders
  from real faces (the test photos had none); the wording from a legal point of view — it describes only what the backend does and nobody qualified has reviewed it.
- **Consequence to know:** a person who never opens My Images or Person Folders is never asked, so Person Folders stay off for them.
  Uploads made before they agree are not analysed automatically; "Group by person" on My Images is how they get grouped afterwards.
- **Still open:** the Person Folders list itself is demo data (its text still names "FaceNet/ArcFace"); a signup-time checkbox would need a small backend change.

### 2026-10-16 — Two-factor sign-in removed from the frontend
*Status: committed (this commit)*

The frontend never had a two-factor screen; the three sign-in pages only showed "that screen is not built yet". That dead branch is
gone: `TwoFactorRequired`, `verifyTwoFactor()` and the `'two-factor'` result are removed from `src/lib/api/auth.ts`, and the user, admin
and moderator login pages no longer test for it. One guard stays on purpose: if the backend ever answers a sign-in **without tokens**
(which is what an account with two-factor on gets while the backend still supports it), `login()` now refuses with a plain message
instead of storing a session that has no credentials. The backend's own two-factor code (6 endpoints, a model, ~7 files) is a separate
change: Ijaz's draft PR #72 already deletes it (migration `0010_remove_two_factor`). The dev database has 0 two-factor credentials.

- **Files:** `src/lib/api/auth.ts`, `src/pages/Login.tsx`, `src/pages/admin/AdminLogin.tsx`, `src/pages/moderator/ModeratorLogin.tsx`.
- **Verified:** `npm run build` clean; headless Chrome against the sign-up branch (own ports): user door → `/dashboard`, a user refused
  at the admin and moderator doors, admin → `/admin`, membership moderator → `/moderator`.

### 2026-10-16 — Authentication wired to the real backend: sign-up, email link, user / admin / moderator sign-in, sign-out
*Status: committed (this commit). Built against backend PR #73 (`feat/signup-link-verification`), which is open, not merged.*

Scope agreed with the owner: **authentication only**, UI unchanged, backend adapted to the frontend (see the backend
review below). Everything is behind `VITE_USE_API`; with it off every screen behaves exactly as before (demo build).

- **Sign-up (`/register`)** sends `full_name`, email, password and confirmation to `POST /api/auth/register/` (no username field —
  the backend derives one). Backend wording is shown for errors (duplicate email, weak password, rate limits). The password is
  no longer written to `localStorage`: the old demo kept `{name, email, password}` there as `fc_draft_user`; that is gone.
  Only the registration id and the masked address are kept, in `sessionStorage`, for the resend button.
- **Email verification (`/verify-email`)** reads `registration_id` and `token` from the emailed link, removes them from the address
  bar, and `POST`s them to `/api/auth/verify-email/`; success goes to `/login`. Opening a link that was already used also reads as
  success (the backend answers 200 without saying whose account). Without a link the button is disabled and the text says to open
  the email. "Resend Verification Link" calls the resend endpoint; a resend inside the cooldown shows the backend's wait message.
- **Sign-in:** `/login`, `/admin/login` and `/moderator/login` share `signInToPortal()` in `src/lib/api/auth.ts`. All three use
  `POST /api/auth/login/` (email or username). The admin and moderator doors check the backend's `dashboard`: any other account is
  refused with "does not have administrator / moderator access" **and its tokens are revoked** (nothing is left in the browser).
  The user door routes by `dashboard`. The displayed name is the backend's `full_name`. In API mode the three forms start empty
  (the demo credentials are pre-filled only in demo mode). Two-factor still shows the existing "not built" message.
- **Sign-out** (`UserMenu`) now also revokes the refresh token on the backend.
- **Removed:** `src/pages/Signup.tsx` — an orphan (`/signup` already redirected to `/register`) that also stored the password.
- **429 wording:** the generic "wait a few minutes" text was dropped on sign-up, verify, forgot and reset; the backend's own message
  says how long to wait.
- **Files:** `src/lib/api/auth.ts`, `src/pages/{Login,Register,VerifyEmail}.tsx`, `src/pages/admin/AdminLogin.tsx`,
  `src/pages/moderator/ModeratorLogin.tsx`, `src/pages/{ForgotPassword,ResetPassword}.tsx`, `src/components/ui/UserMenu.tsx`,
  `README.md`; deleted `src/pages/Signup.tsx`.
- **Backend side (reported, not done by me):** the owner ran the login/sign-up prompt in the backend repo → PR #73. I reviewed it and
  ran it from a throwaway copy of the branch on its own port with an empty database (the owner's server and database were not
  touched). It matched the prompt: optional username + required `full_name`; link verification (single use, resend retires the old
  link, replay = 200 without `user`); `full_name` on user objects; a membership moderator gets `role` and `dashboard` "moderator" while
  an organization owner stays "user"; production guard refuses a localhost `FRONTEND_URL`. Open items on the backend: its migration
  `accounts/0007` clashes with Ijaz's PR #68 (merge order); the audit event is still named `verification_code_sent`; register still
  answers "A user with this email already exists" for a taken address (existing behaviour, a deliberate enumeration trade-off).
  The first admin (`FaceCloud`) was created by hand with `createsuperuser` and then marked verified, because a superuser is otherwise
  stuck on "Email verification is required" — a backend follow-up (`create_superuser` should set it) is still to be run.
- **Verified:** `npm run build` clean. Headless Chrome against the PR branch (own port, empty database, console email backend):
  sign-up form has no username field; sign-up → "check your email" with the masked address and a disabled verify button; the emailed
  link opens with the token stripped from the URL; verify → success → `/login`; login starts empty; user lands on `/dashboard` with
  the right name; sign-out clears session and refresh token; a normal user is refused at the admin and moderator doors with nothing
  left behind; the membership moderator reaches `/moderator`; the admin reaches `/admin`; wrong password shows the backend message;
  replaying a used link reads as success; a wrong token shows an error; resend inside the cooldown shows the wait message and after
  it the new link works and the old one stops; duplicate email and a weak password are refused with the backend text. Demo mode
  (`VITE_USE_API=false`) re-checked: the three logins, sign-up and verify behave as before. **Not verified:** the HTML email in a
  real inbox; PostgreSQL; the flow against the owner's own server on :8000 (which runs the same branch); two-factor.

### 2026-10-16 — Admin Users: "Add User" now works (demo), Suspend/Activate wired to the backend
*Status: committed (this commit); creating an account against the live API still needs a backend endpoint — reported, not built (backend frozen)*

The **Add User** button on `/admin/users` did nothing — and neither did View / Suspend / Activate; the whole screen was static mock data.

- **Add User** opens a form (username, email, password + confirmation, "Generate" for a readable random password, Role =
  User or Moderator) and, after creating, shows the sign-in details once. Extracted into a shared component,
  `src/components/admin/NewAccountForm.tsx`, which the Moderators page now uses too (it offers only the Moderator role).
  Against the live API the form's button is disabled with the reason on screen: the backend cannot create an account for
  someone else (same gap as the Moderators page entry above — it needs `role`, an organization membership for moderators,
  email verification, a forced password change and an audit event). In demo mode the account exists for the session only.
- **Users list is live.** `GET /api/user/admin/users/` through `src/lib/api/adminUsers.ts`, with loading, error-and-retry
  and empty states; search works on both. The Uploads column appears in demo mode only — the accounts API reports no
  upload count and none is invented. Names show the account's username (the API has no full-name field).
- **Suspend / Activate** call the backend's existing `PATCH /api/user/admin/users/<id>/` (`is_suspended`), then reload;
  suspending asks for confirmation; a backend refusal (for example suspending your own account) is shown as an error
  banner. In demo mode it toggles locally.
- **Removed** the "View" link: it had no destination and no page behind it.
- **Files:** new `src/components/admin/NewAccountForm.tsx`; rewritten `src/pages/admin/Users.tsx`; edited
  `src/pages/admin/Moderators.tsx`, `src/lib/api/adminUsers.ts`.
- **Verified:** `npm run build` clean; headless Chrome in demo mode as admin — 5 rows at start; Add User opens the form with a
  role select; creating a Moderator gives 6 rows with the Moderator badge and the one-time sign-in card; Suspend flips a row
  to Suspended / Activate; a 3-character password is refused with a message. **Not verified:** Suspend/Activate and the
  live list against a signed-in admin on the running backend.

### 2026-10-16 — Admin: API pages removed, new Moderators page (list + create form)
*Status: committed (this commit); the create action needs a backend endpoint that does not exist — reported, not built (backend frozen)*

- **Removed** "API Documentation" and "Test API Endpoints" from the admin sidebar, deleted `src/pages/admin/ApiDocs.tsx` and
  `ApiTest.tsx`, and made `/admin/api-docs` and `/admin/api-test` redirect to `/admin` so old bookmarks do not 404.
- **Added** "Moderators" to the admin sidebar → **`/admin/moderators`** (`src/pages/admin/Moderators.tsx`):
  a searchable list of moderator accounts (username, email, active/suspended, created date) and a **Create moderator** form
  (username, email, password + confirmation, a "Generate" button that makes a readable random password, and a one-time
  "share these sign-in details" card). The list is live: `src/lib/api/adminUsers.ts` calls the backend's existing
  `GET /api/user/admin/users/` and keeps accounts whose role is `moderator`; loading, error-with-retry and empty states match
  the other migrated screens. In demo mode it shows the one moderator already in the demo data, and a created account only
  exists for the session, with a banner saying nothing is saved.
- **Backend gap (not fixed — frozen):** the backend can only *list* accounts and *patch* their role/suspension
  (`accounts/user_urls.py`: `admin/users/` and `admin/users/<id>/`). There is no endpoint that creates an account for
  someone else, so with `VITE_USE_API=true` the form's submit button is disabled and says so, rather than calling an
  endpoint that is not there. What that endpoint needs, for whoever builds it: create the user with `role="moderator"`,
  **and** an `OrganizationMembership` (role moderator) in a chosen organization — moderation is organization-scoped, so
  an account with only `User.role` would reach the panel and find nothing; mark the email verified or send a verification;
  prefer a forced password change on first sign-in over a password the admin keeps knowing; write an audit event.
  This is the same account-role-vs-organization-role split already recorded in the earlier backend findings.
- **Files:** new `src/pages/admin/Moderators.tsx`, `src/lib/api/adminUsers.ts`; edited `src/components/layout/Sidebar.tsx`,
  `src/App.tsx`, `README.md`; deleted `src/pages/admin/ApiDocs.tsx`, `src/pages/admin/ApiTest.tsx`.
- **Verified:** `npm run build` clean; driven in headless Chrome as an admin session — sidebar no longer has the two API items
  and has Moderators; in demo mode the list shows 1 row, creating one gives 2 rows plus the credentials card; `/admin/api-docs`
  lands on `/admin`; with the API on and no real sign-in the page shows the backend's "Administrator access is required"
  error with a retry link and the form's button disabled. **Not verified:** the live list against a signed-in admin on the
  running backend (no admin session was available in the test browser).

### 2026-10-16 — About, Contact and Moderator headings get the landing page's heading animation
*Status: committed (this commit)*

The landing page's headings scramble into place when they scroll into view and put one key phrase on an orange block.
The About, Contact and Moderator role-guide pages used plain headings. A new shared component,
`src/components/animation/HeadingText.tsx`, applies the same treatment: it reuses `ScrambleText`, takes a string where
`[square brackets]` mark the highlighted phrase and `\n` starts a new line. The scrambling letters are `aria-hidden`
and a screen-reader-only copy carries the plain sentence, so assistive technology never reads the random characters.

- **Applied to:** About (page title, "Solving the Dataset Challenge", "How We Operate", "Meet the Team", closing
  call-to-action), Contact (page title), Moderator guide (page title, every section heading through its shared
  `Heading`, "Questions about the role?"). Fonts and sizes are unchanged. Highlights are kept to one short word
  because the orange block does not wrap and a long one would overflow a phone screen.
- **Not changed:** the Landing page's own headings (they keep their local `parseTitle`), the "Submission Received"
  heading on Contact, and the Contact FAQ/cards.
- **Files:** new `src/components/animation/HeadingText.tsx`; edited `src/pages/About.tsx`, `src/pages/Contact.tsx`,
  `src/pages/ModeratorRole.tsx`.
- **Verified:** `npm run build` clean; headless-Chrome screenshots of all three pages show the orange block on the
  highlighted word; the rendered DOM carries the plain-sentence copy for each heading. The scramble motion itself is
  not visible in a still, so it was not seen playing. On the Moderator page the title now wraps to three lines at
  desktop width because the highlighted block takes its own line. Phone width was not checked reliably (the headless
  window will not go narrower than its minimum), only reasoned from the longest unbreakable word.

### 2026-10-16 — Navbar: "User Login" replaced by "Moderator" (role guide)
*Status: committed (this commit)*

"User Login" and "Get Started" both went to `/login`, so the navbar had two buttons doing the same thing. "User Login"
is removed from the public navbar (desktop bar and mobile menu); in its place is **Moderator**, linking to the public
role guide `/roles/moderator` (highlighted when that page is open). It links to the information page, not to the
moderator login, so the staff portal is still reachable by direct link only. "Get Started" still goes to `/login`, and
the footer's "User Login" link is unchanged.

- **Files:** `src/components/public/PublicNavbar.tsx`, `README.md`.
- **Verified:** `npm run build` clean; rendered header DOM has no "User Login", has Moderator → `/roles/moderator` and
  Get Started → `/login`; headless-Chrome screenshot of the bar on `/about` (desktop). The mobile menu uses the same
  link but was not screenshotted.

### 2026-10-16 — Forgot-password on every login page, and "Coming soon" on the pricing cards
*Status: committed (this commit)*

Two owner requests. Frontend only; the backend was not touched (frozen).

- **Forgot password.** All three sign-in pages (`/login`, `/admin/login`, `/moderator/login`) now carry a
  "Forgot password?" link under the password field. It goes to a new **`/forgot-password`** page (email → "check your
  email"), and the link the backend emails (`FRONTEND_URL/reset-password/{uid}/{token}`) now lands on a new
  **`/reset-password/:uid/:token`** page (new password + confirmation → back to sign-in). Both use the API wrappers that
  already existed in `src/lib/api/auth.ts` (`requestPasswordReset`, `confirmPasswordReset`) against the backend's
  existing `/api/auth/password-reset/` endpoints. The forgot page never reveals whether an address has an account (the
  backend answers identically); 429 shows a "wait and try again" message; backend validation errors on the new password
  are shown as sent, with a "Request a new link" link for expired tokens. In demo mode (`VITE_USE_API` off) there is no
  server to send mail, so the screen says "no email is sent" instead of pretending. The staff login pages link to the
  same generic page; no staff-portal link was added anywhere public.
- **Pricing.** Each of the three cards now shows a "Coming soon" badge and a disabled "Coming soon" button in place of
  Get Started / Upgrade / Go Pro; the "Most Popular" ribbon is gone; a line under the cards says plans and pricing arrive
  in a later version. Two FAQ answers and one API-teaser line that stated plan limits and "Pro API access" as live fact
  were reworded to say these are planned, not final or enforced. The card data (prices, storage) is kept in
  `PRICING_PLANS` for when the plans are built.
- **Files:** new `src/components/auth/AuthShell.tsx`, `src/pages/ForgotPassword.tsx`, `src/pages/ResetPassword.tsx`;
  edited `src/App.tsx`, `src/pages/Login.tsx`, `src/pages/admin/AdminLogin.tsx`,
  `src/pages/moderator/ModeratorLogin.tsx`, `src/pages/Landing.tsx`, `README.md`.
- **Verified:** `npm run build` clean; headless-Chrome screenshots of the user, admin and forgot-password screens (link
  placement, layout); rendered DOM of the landing page shows exactly three "Coming soon" badges and three disabled
  buttons and no "Most Popular". **Not verified:** a real reset email end to end (needs the backend running with SMTP and
  `FRONTEND_URL` pointing at this app) and the moderator login / reset screens visually (same markup as the checked ones).

### 2026-10-15 — A Moderator role guide page, and a backend permission gap found while writing it
*Status: committed (this commit); the backend finding is reported, not fixed — the backend is frozen*

Owner asked for the moderator role to be studied and a proper separate page built around it: what a moderator can
do, how, and its plans. New public page at **`/roles/moderator`** (`src/pages/ModeratorRole.tsx`).

**Studied before writing**, from the backend's rules rather than only its design notes — they disagree in places.
Sources: the feature doc, the `FEATURES.md` Done/Partial/Open list, `organizations/services.py` for who may do
what, and the moderation views. Each claim on the page is something the code enforces; where something is built
but its panel screen is still mock data, or is not built, the page's roadmap section says so.

**Page contents:** a hero with the role in plain terms; twelve capability cards, each with the concrete detail
(claim lasts 15 minutes by default, bulk is 50 at a time, and so on — all marked as defaults); the seven-step life
of a review; a role comparison table (moderator / owner / member, ten abilities) with screen-reader text for every
tick and cross; a "cannot / safeguards" pair; how someone becomes a moderator; and a three-column roadmap.

**"Plans" was ambiguous and the answer is deliberately unglamorous.** There is no moderator pricing anywhere to
show. The backend does give an organization a plan label (Free / Team / Enterprise) but **nothing in the code
changes behaviour by plan**, and the public Pricing section uses different names again (Free / Basic / Pro,
priced per individual user, also unenforced). So the page does not invent seat prices or tiers. It reads
"plans" as the roadmap — what is built, what is being connected, what is planned — and states plainly that seat
limits and pricing for moderators have not been decided.

**Corrections made to the draft before it shipped:** "100% of moderator actions are audited" was an over-claim
(viewing the queue and thumbnails is deliberately not audited) and became "every decision, escalation, claim and
member change"; step 2 of the workflow said the right people are notified when a review is created, but nothing
notifies at creation — only assignment, escalation and a missed deadline do; and "Working now" became "Built and
connected", since the live site is still in demo mode.

**Where the code is stricter than the docs.** The design doc says a moderator cannot remove an owner. The code
also stops a moderator managing **another moderator**, and the page says so.

**Reachability.** Linked from one place only: a "How the moderator role works →" line on the existing Moderator
Review card in the landing page's Administrative Control section. It is not in the navbar or footer, and it
contains **no link to the moderator or admin login** — staff portals stay reachable by direct link only, as asked.
The route is `/roles/moderator`, not under `/moderator`, which is the protected portal. `sitemap.xml` was not
touched.

**Verified:** typecheck, lint and build clean. Both themes at desktop width, with all 12 capability cards, 7
steps, 10 table rows and every section revealing after a real scroll-through; at 390px there is no horizontal
overflow in either theme and the role table scrolls inside its own box; every in-page anchor resolves; the
Landing link lands on the page. A first screenshot showed two sections blank — that was the screenshot taking the
page before smooth-scroll had revealed them, confirmed by measuring that no panel stays hidden after a proper
scroll, not a page defect.

**Found while verifying one claim — a real backend permission gap (reported, not fixed).** To decide whether the
page could say a moderator cannot create moderators, the member-update path was exercised inside a transaction
that was rolled back (the probe user was confirmed gone afterwards; nothing persisted). Result: **a moderator can
promote a normal member to moderator** through `PATCH /api/organizations/{id}/members/{id}/`. The invitation path
correctly refuses ("Moderators may only invite normal members"), and promotion to *owner* is refused, but
`update_member()` has no equivalent guard for the *moderator* role, and the serializer accepts any role. The
page therefore makes no claim that a moderator cannot appoint moderators; its table row is the narrower, true
"Invite someone as a moderator". Recorded in §7 below. The backend is frozen, so no change or PR was made.

**Files:** `src/pages/ModeratorRole.tsx` (new), `src/App.tsx`, `src/pages/Landing.tsx`, `README.md`.


### 2026-10-15 — Light mode: hover no longer overpowering; contact email moved to .com
*Status: committed (this commit)*

Two requests: hover effects were too strong in light mode across the site, and the contact email should end in
`.com`, not `.pro`.

**Contact email.** `ali@facecloudai.pro` → `ali@facecloudai.com`, both occurrences in `src/pages/Contact.tsx`
(General Support and Enterprise & Partnerships). They are plain text, not `mailto:` links. No other contact
address existed; the remaining `@facecloud.ai` / `@dtm.io` strings are demo-login credentials and were left alone.

**Hover.** Root cause: `.fc-panel:hover`, `.fc-card:hover` and `.fc-glass-hover:hover` hardcoded the dark theme's
hover shadow — `0 30px 110px rgba(0,0,0,0.40)` plus an orange glow — and had no light-mode override. On a black
page that shadow disappears; on a white one it renders as a heavy grey smudge. The light theme already defined a
soft *resting* shadow; only the hover step was missing.

Fix: a new `--s-shadow-hover` token, defined for dark (the exact old values) and for light (`0 1px 2px
rgba(15,23,42,0.05), 0 16px 40px rgba(15,23,42,0.10)` — one step up from the resting shadow, not a different kind
of shadow). The three hover rules now read the token. The glass-hover lift (`translateY(-2px) scale(1.01)`) is also
reduced to `translateY(-1px)` in light only, matching what the dashboard already does.

The Contact "Looking for quick answers?" card had a second, separate problem: a hardcoded `bg-black/30` fill, which
is a subtle inset on a dark page but a grey slab on a light one, and left its subtitle nearly unreadable. In light
it now uses the same panel surface as the cards above it; in dark the fill is unchanged. The other `bg-black`
fills in the app were checked and left: they are the `on-dark` terminal panels, which are meant to stay dark, and
the mobile menu scrim.

**Verified by measurement, not by eye.**
- Computed hover shadow on the Contact form card — dark: `rgba(0,0,0,0.4) 30px 110px` + orange glow, identical to
  the pre-change value read from `git show HEAD`; light: `rgba(15,23,42,0.10) 16px 40px`.
- Hovered all **58** marketing panels across Landing, About and Contact in both themes. Dark: strongest blur
  110px, alpha 0.40 (unchanged). Light: strongest blur 40px; the one reading of 0.15 is the Admin Console card's
  deliberate faint orange glow, set inline by framer-motion, left as is.
- Dashboard hover is untouched and was already soft in light (`0.07` at 12px/32px); it has its own `.fc-app` rule.
- FAQ card: dark background still `rgba(0,0,0,0.3)`; light `rgb(255,255,255)`.

**A mistake caught by that measurement.** The first version of the token landed in the `.on-dark {}` block, not
`:root`, because a text search for the neighbouring `--s-shadow:` line matched the first occurrence. With no token
in `:root` the dark hover shadow resolved to `none` — a silent dark-mode regression that a light-mode-only check
would never have shown. Added to `:root` as well; the dark readout above is the proof it matches the original.

**Not changed, flagged for the owner.** `index.html` (canonical, `og:url`, JSON-LD), `public/robots.txt` and
`public/sitemap.xml` still point at `https://www.facecloudai.pro/`. That is the website address, not the email, so
it was out of scope — but the site is being served from `.com`, and a canonical pointing at a different domain
tells search engines the other domain is the real one. Worth deciding which domain is primary.

**Files:** `src/index.css`, `src/pages/Contact.tsx`.


### 2026-10-15 — Landing page: Admin Console and Moderator Review cards made the same size
*Status: committed (this commit)*

Owner reported that in the "Control, review, and monitor every workflow" section one card was larger than the
other. Two causes, both in `src/pages/Landing.tsx`:

- The cards had **different minimum heights** — `min-h-[340px]` on Admin Console against `min-h-[300px]` on
  Moderator Review — so they could never match.
- Each card sits inside a `RevealOnScroll` wrapper, and the grid row stretched the *wrapper* but the card inside
  did not fill it, so even with equal minimums they would not have lined up.

Fix: both cards now use the same `min-h-[320px]`, both are `h-full`, and both wrappers take `className="h-full"`
(`RevealOnScroll` already accepts one). Whichever card has more content now drives the height of both.

**Measured rather than eyeballed**, in headless Chrome by exact card title:

| Viewport | Admin Console | Moderator Review |
|---|---|---|
| 1440px | 600×320 | 600×320 |
| 1100px | 508×320 | 508×320 |
| 800px | 358×320 | 358×320 |
| 390px (stacked) | 342×320 | 342×320 |

A first measurement reported "different" at every width — that was the test, not the page: a loose text filter
also picked up an unrelated "Moderator Review **Queue**" card from another section. Re-measured with exact title
matching, which is what the table shows.

**Not changed, and worth knowing:** both cards have a band of empty space below their last row of tick items.
That comes from the minimum height, was there before, and was not part of the request — it can be tightened by
lowering `min-h` if wanted.

**Files:** `src/pages/Landing.tsx`.


### 2026-10-15 — Landing page: the stock photo under "AI Infrastructure" removed
*Status: committed (this commit)*

Owner asked for the image at the bottom-left of the "FaceCloud turns raw uploads into organized AI-ready folders"
section to be removed.

It was a stock photograph hot-linked from Unsplash, dimmed and tinted orange, with a fake scanner overlay drawn
on top: `SCAN_RESOLUTION: 512px`, `CONFIDENCE: 99.8%` and a pulsing `[MODEL_SCAN: IN_PROGRESS]`. None of that
described anything the product did — it was decoration styled to read as a live readout, the same habit that
produced the invented scores and the random "Identity match" name on the upload screen. Removing it also drops an
external image request from the home page.

The checklist (Zero-DCE enhancement, Face validation, Quality scoring, Identity grouping) and the right-hand
"Active AI Restructuring" panel are untouched. The left column now ends at the checklist.

**Checked in headless Chrome at 1440px:** no `unsplash` image in the DOM, none of the scan overlay text anywhere
on the page, the four checklist items and the pipeline panel both still present, and the section reading
cleanly down into "Ingestion Suite". `tsc` clean, `npm run build` passes.

**Files:** `src/pages/Landing.tsx`.


### 2026-10-08 — Vercel removed from the repository
*Status: committed (this commit)*

Owner deleted the Vercel project but GitHub kept showing failed Production deployments. Two separate things:

- **The 60 old records are history and do not disappear.** Deleting a Vercel project does not clear GitHub's own
  deployment log; those entries stay and are harmless.
- **New ones were still being created.** The most recent was dated the day before, on commit `95b00b3`, and the
  creator was `vercel[bot]` — so the **Vercel GitHub App is still installed on the repository** and still
  attempts a deploy on every push. That part cannot be fixed from here: `gh api user/installations` returns 403
  because the CLI token is not authorised for App installation management. The owner has to remove it at
  **GitHub → Settings → Integrations → Applications → Vercel → Configure**.

**What was fixed here.** Checking the repo turned up more than the config file:

- **`@vercel/analytics` was still shipping** — imported in `App.tsx`, mounted on every page, loading a
  third-party script and reporting to a Vercel project that no longer exists. Removed from the app and from
  `package.json`; the built bundle now contains no reference to Vercel at all.
- `vercel.json` deleted. It was the SPA rewrite rule for Vercel; `public/.htaccess` does that job on Hostinger.
- `.claude/hooks/check-work-log.sh` was watching `vercel.json`, `backend/` and `docker-compose.yml`, none of
  which exist in this repo any more. Trimmed; the hook still runs clean.
- Documentation corrected: the log header said the live site was `facecloudai.pro (Vercel)`, and README §16 said
  the frontend was hosted on Vercel. Both now say Hostinger, and the README no longer claims the backend is
  deployed — it is not.

`README_BACKEND_ROADMAP.md` still shows Vercel in its architecture diagram. Left alone: that file is a
pre-existing plan document describing an intended design, not a statement about what is running.

**Files:** `src/App.tsx`, `package.json`, `package-lock.json`, `vercel.json` (deleted), `README.md`,
`.claude/hooks/check-work-log.sh`.


### 2026-10-08 — Upload actions shown without a server, and the invented scores removed again
*Status: committed (this commit)*

Owner reported the download buttons still missing on the live site. They were gated on the API being connected,
and the live site runs in demo mode, so they never appeared there.

**Two things, one reported and one not.**

The buttons are now always shown once a photo is accepted, and each does what it honestly can without a server:
- **Download** saves the browser-made preview — a real image file, named `…-preview.jpg` and labelled "Download
  preview" rather than "Download enhanced", so it is not mistaken for the backend's own result. With the API it
  is unchanged: the real enhanced file.
- **Copy secure link** cannot work without a server — a share link is a record the backend issues, and a link
  that leads nowhere is worse than no link. It explains that on click instead of failing.

**The unreported one: the score cards were inventing numbers again.** The screenshot showed
`SHARPNESS 88% · BRIGHTNESS 78% · OVERALL 88%` — the demo sample's figures, not measurements of that photo. This
is the same complaint raised on 2026-10-03 ("har image par 88% aa rha ha"), reintroduced when the cards were
restored on 2026-10-07 by gating them on `accepted` without also gating on `USE_API`. Without a server they now
read as dashes, with one line saying the checks run there.

**Checked both ways in headless Chrome.** Demo: `Download preview | Copy secure link | Upload another`, download
enabled, cards showing dashes, share click explaining itself. Live: `Download enhanced | Copy secure link`,
cards showing **97% / 95% / 83%**, person row **Person 001**.

**A note on the test harness, not the app.** A run showed the preview broken and "This photo could not be
previewed" — that was a missing test file, cleared when the session restarted, so the file input received an
empty File. The app was right to say so and right to disable the download. Worth remembering before treating a
failure in a driven browser as an application bug.

**Files:** `src/pages/user/UploadSingle.tsx`.


### 2026-10-07 — The old upload result restored, with every figure real this time
*Status: committed (this commit)*

Owner asked for the earlier design back — the score cards, the identity row and the download button. Restored,
but filled from the API rather than from the invented values the original had:

| Old screen | Now |
|---|---|
| Blur / Brightness / Face size, all `82%` from one fake seed | **Sharpness 97%, Brightness 95%, Overall 83%** — the real quality sub-scores |
| `IDENTITY MATCH: Zainab Bibi` — a random pick from five hardcoded names | **Person folder: Person 001** — the group the pipeline actually filed it under, linking to it |
| `Download Enhanced` → a `sec-mock` URL | **Download enhanced** → the real enhanced file from the enhancement result |
| `Copy Secure Link` → a fabricated link | **Copy secure link** → a real share link from `POST /api/shares/` |

The share link is genuinely public: fetched with **no Authorization header** it returns `200 image/jpeg`, a
1251×1349 watermarked JPEG, expiring in 24 hours.

**A real bug found while testing it.** The share token comes back from the backend **once and never again**. The
first implementation copied it to the clipboard inside the same `try`, so when the clipboard write failed — no
permission, no focus, an insecure context — the whole thing reported "the link could not be created" while the
link *had* been created and was sitting on the server. The token was then lost for good, and clicking again
would only orphan another link. Confirmed in the database: two links existed after one "failure".

Now the link is put on screen the instant it arrives, in a selectable field, and the clipboard is treated as a
convenience on top. A blocked clipboard says so and points at the field instead of claiming failure. Verified
with the clipboard unavailable: no failure reported, the note explains, and the link is readable on screen.

**Files:** `src/pages/user/UploadSingle.tsx`, `src/lib/api/enhancements.ts`, `src/lib/api/images.ts`,
`src/lib/imageData.ts`.


### 2026-10-03 — Five real photographs, and the two bugs they found
*Status: backend PR #62, merged*

Owner supplied five real portraits of one person — the first real faces this pipeline has seen. Identity
grouping works, and the photos found two genuine defects that synthetic test images never could.

**Bug 1 — face size judged as a share of the frame penalises a better camera (PR #62, merged).**

| Photo | Frame | Face | Area | Score | Old verdict |
|---|---|---|---|---|---|
| A | 1251×1349 | 288×386 | 6.59% | 0.933 | accepted |
| D | 1448×1086 | **258×342** | 5.61% | **0.945** | ❌ "too small" |
| E | 2386×3124 | **495×590** | 3.92% | 0.743 | ❌ "too small" |

Photo E's face is **the largest in the set at 495×590 pixels** and was refused for being too small; the higher
the camera resolution, the smaller a face looks as a fraction. A face is now refused only when it fails **both**
measures — small share of frame *and* too few pixels — with a new `FACE_MIN_EDGE_PIXELS` setting (default 160 on
the shorter edge). D is now accepted and E is processed. 9 new tests; suite **1197 passing**.

**Bug 2 — the detector's confidence threshold was slightly too high.** `YUNET_SCORE_THRESHOLD=0.75`, and photo
E's clearly visible face scored **0.743** — missed entirely, zero faces. 0.60 caught it with no false positives
on this sample. One sample is not enough to move a shipped default, so it is set in local `.env` only and flagged
in the PR for revisiting with a larger set.

**Identity grouping, on real faces, works and is appropriately cautious:**

```
Person 001  <- 25.jpg, 27.jpg   (confident)   + 28.jpg at 0.760, flagged for review
Person 002  <- 26.jpg           (confident)   + 29.jpg at 0.710, flagged for review
```

All five are the same person, so the system made two groups where one was right. That is the strict
`IDENTITY_MATCH_THRESHOLD` of 0.82 doing its job: the two studio shots matched confidently, the outdoor shots in
different lighting and clothing did not, and rather than guess it **sent them to the moderator queue** — which is
what that queue, with its deadlines and claim lock, exists for. Loosening the threshold would merge these
correctly and would also start merging different people, which is the worse failure. Left as is, and reported
rather than quietly tuned.

**Files:** none in this repo. Backend: `validation/services.py`, `config/settings.py`,
`validation/test_face_size_rule.py` (new).


### 2026-10-03 — Identity grouping switched on; the licence it needed was open source all along
*Status: backend runtime only — no code changed*

**A correction to the previous entry.** It said the identity licence record was something only the owner held, on
the strength of the attestation's phrase *"license retained in owner records"*. That was an assumption, not a
check. Both licences are permissive open source and publicly available:

| Model | Licence |
|---|---|
| YuNet (ShiqiYu/libfacedetection) | **BSD 3-Clause** |
| SFace (OpenCV Zoo) | **Apache License 2.0** |

Neither needed a negotiated agreement. "Retained in owner records" means the owner keeps a copy — which is what
BSD-3-Clause requires of a redistribution anyway, and what the attestation means by "Production distribution must
preserve all required license and attribution files".

So the record was assembled from the **real upstream licence texts**, reproduced in full, with both artifacts'
SHA-256 matching the attestation exactly. Nothing was invented: the earlier refusal to fabricate an empty file
still stands, and this is the opposite — the actual documents.

**Identity grouping is now live.** `IDENTITY_PROVIDER=sface_2021dec_v1`, `IDENTITY_AUTO_ANALYZE=True`,
`IDENTITY_LICENSE_RECORD_PATH` pointing at the record. `manage.py check` reports **"no issues"** for the first
time — the standing `identities.W001` warning is gone. Suite: **1188 passing**.

**The consent gate behaves properly**, checked against the running server with two accounts:
- Consented account: upload accepted, `identity_analysis: {status: completed, provider: sface_2021dec_v1}`.
- Account with no consent: upload still succeeds (**201**), quality and validation still run, and identity
  analysis simply **does not run** — no error, no failed job. That is the right shape: consent gates the
  biometric step, not the product.

**Still unproven on a real face.** Every test photo here is a drawn oval, which YuNet correctly refuses, so face
count is 0 and no groups form. The wiring is confirmed end to end; the recognition itself needs a real
photograph.

**Nothing entered git** — the record lives under `.runtime/licenses/` and the settings in `.env`, both gitignored.

**Owner's own licence copy added the same day.** It is **MIT License, Copyright (c) 2020 Shiqi Yu** — the same
author as the upstream BSD 3-Clause text, but from an earlier point in the project's life. Both are now in the
record, with the distinction stated plainly: the artifact in use was taken from the current upstream tree, so
**BSD 3-Clause governs this file**; the owner's MIT copy is kept because it is the project's own record and
because an earlier distribution of the same model carried it. Both are permissive and both allow this use — the
difference only affects which attribution text must travel with a redistribution, so the stricter of the two is
reproduced first.

**Files:** none tracked. Runtime only: `.runtime/licenses/identity-models.md` and `.env`.


### 2026-10-03 — Biometric consent switched on, and the 24 tests it broke
*Status: backend PR #61, merged*

Owner asked for `BIOMETRIC_CONSENT_REQUIRED=True`. Setting it immediately **failed 24 tests** across
`identities`, `collages` and `moderation` — which turned out to be a real gap, not a side effect.

`config/production_guard.py` refuses to boot without that flag, so **production always runs with it on**, while
the suite only passed with it off. The suite was testing whatever the developer's `.env` happened to say rather
than what production does — the same shape as the SQLite portability fix in PR #56.

**Fixed in PR #61 (merged).** Tests that exercise facial processing grant consent in `setUp` through a new
`privacy/testing.py` helper, so they take production's path. Granting is harmless when the requirement is off, so
the suite now passes **either way** and no longer depends on the environment for this flag. The four tests that
deliberately check behaviour *without* consent were relying on nothing having granted it — which passes for the
wrong reason the moment a fixture changes — so they now withdraw consent explicitly.

Verified: **1188 passing with the flag True and 1188 with it False**, `check`/`makemigrations --check`/
`spectacular --validate` clean, bandit quiet. No application code changed.

**Worth recording:** two of the three bugs found in this repo so far have been the same bug — the test suite
agreeing with a local `.env` instead of with production. Worth a look at whether any other production-guard
setting is untested the same way.

**Files:** none in this repo. Backend: `privacy/testing.py` (new) plus seven test modules.


### 2026-10-03 — The AI models are installed and running; enhancement is no longer falling back
*Status: backend runtime only — no code changed in either repository*

Owner asked whether the enhancement pipeline was actually working or blocked. **It was working, but without any
of its models**, so every photo was getting the classical OpenCV path.

**Diagnosis, by test rather than reading.** A well-lit photo came back with
`zero_dce: {requested: false}` — correct, since Zero-DCE is a low-light model and the photo was not dark. A
deliberately under-exposed photo (mean luminance 24) came back with
`{requested: true, applied: false, fallback_reason: "The configured Zero-DCE ONNX model is unavailable."}`.
So the pipeline was choosing correctly and reporting honestly; the weights simply were not on the machine. Every
model path pointed at `.runtime/models/`, which did not exist. Worth recording that the fallback is deliberate
and tested (`test_zero_dce_failure_uses_auditable_opencv_fallback`) — it degrades and says so rather than
pretending.

**Installed, with the project's own licensing control respected.**
`docs/model-licenses/feature-18-yunet-sface-attestation.md` records approved artifacts by **SHA-256**, so the
checksum is the identity control:
- **SFace** `face_recognition_sface_2021dec.onnx` from the OpenCV Zoo — SHA-256 matches the attested value exactly.
- **YuNet** `yunet_s_dynamic.onnx` from libfacedetection (not the OpenCV Zoo build, whose checksums do not match)
  — SHA-256 matches the attested value exactly.
- **Zero-DCE** has no attestation entry because it is not downloaded: `scripts/export_zero_dce_onnx.py` converts
  the official Epoch99 checkpoint to ONNX. Done in a throwaway `.runtime/export-venv`, since torch is a
  conversion-only dependency and production inference uses OpenCV DNN.

**Result: the same dark photo now enhances for real.**
`zero_dce: {applied: true, provider: facecloud_private_curve_onnx_opencv_dnn, curve_iterations: 8,
chroma_protection: preserve_source_lab_chroma, mean_gain: 2.29}`, 982 ms on CPU. No GPU involved.

**Face detection upgraded** from the Haar cascade to YuNet (`FACE_DETECTOR_PROVIDER=yunet_v1`). **Not verified on
a real face** — the synthetic test images here are drawn ovals, which YuNet correctly refuses and the looser Haar
cascade accepted. Needs a real photograph to confirm, and reverts with one line in `.env`.

**Identity grouping deliberately left off.** `identities/checks.py` additionally requires
`IDENTITY_LICENSE_RECORD_PATH` to point at the owner's own licence record, which the attestation says is
intentionally kept out of the repository. Fabricating that file would defeat a control that exists on purpose,
so it stays for the owner to supply.

**Nothing entered git:** weights live under `.runtime/` and the settings in `.env`, both gitignored — confirmed
with `git check-ignore`. This also matches the attestation's rule that production workers never download weights
dynamically.

**Files:** none tracked. Runtime only: `~/Projects/FaceCloud_backend/.runtime/models/` and `.env`.


### 2026-10-02 — Upload result pared back to the two cards and a working slider
*Status: committed (this commit)*

Owner's request: drop the quality-checks and photo-details cards from the result, keep the rest, and make the
place that said "Before and after, side by side" an actual slider with an image in it.

- Both cards removed from the upload result. The six quality measurements are not lost from the product — the
  image detail screen still shows them, measured, which is where someone goes to ask why.
- The comparison is now a real slider in **both** modes. With the API it is the original against the server's
  enhanced file, as before.
- Without the API there is no server to produce an "after", so `src/lib/previewEnhance.ts` makes one in the
  browser: a canvas filter lifting brightness, contrast and saturation, capped at 1400px because filtering a
  phone photo at full resolution janks the page for no visible gain. The caption under the slider says plainly
  that it is made in the browser and that the server's own enhancement replaces it — it is a demonstration of
  the control, not a result, and it must not read as one.

**Checked both ways in headless Chrome.** Demo: slider renders with a visible difference between the two sides,
caption says "made in your browser", both cards gone. Live: slider with the real enhanced file, caption says
"the original is never overwritten", both cards gone.

**Files:** `src/lib/previewEnhance.ts` (new), `src/pages/user/UploadSingle.tsx`.


### 2026-10-02 — Upload result back to two cards: the photo left, the comparison right
*Status: committed (this commit)*

**Corrected twice, because the first reading of the request was wrong.** The ask was for the layout the screen
originally had — **two cards side by side, the uploaded photo in the left one and the before/after comparison
with its drag handle in the right one**. The first attempt put the comparison full width on top with the detail
cards underneath, which is not that.

- The picker card stays after a result instead of being hidden, retitled "Your photo / The original, as you
  uploaded it". It is the left-hand card.
- The result card keeps its half of the row, with the before/after slider as its own content, and the quality
  checks and photo facts stacked beneath it rather than side by side — the column is half the width now.
- Without the API the right card no longer repeats the same photo, since the left card is already showing it;
  it says what would be there instead.

**Checked both ways in headless Chrome:** two columns, left card titled "Your photo", the photo rendered once
rather than twice, and with the API the slider loaded with both images and "Light correction", the six real
measures and the photo's facts beneath it.

**Files:** `src/pages/user/UploadSingle.tsx`.

---

### 2026-10-02 — Upload result: the comparison on top, the details underneath (superseded the same day)
*Status: committed; replaced by the entry above*

Owner's layout request: the two result cards (quality checks, photo details) sat in a column beside the photo;
move them below and put the comparison where they were, the way the old screen read.

- The enhancement block — the before/after slider with the API connected, the photo itself without it — is now
  full width at the top of the result.
- The two detail cards sit side by side underneath it instead of stacked in a narrow column.
- The photo is capped at `max-w-3xl` and centred. Full width left a portrait photo stranded in empty space,
  which is the same complaint the earlier 4:3 box caused from the other direction.

**Checked both ways in headless Chrome.** With the API: slider at the top with both images loaded and "Light
correction", then the six real measures (overall 85%) beside the photo's facts (1 face, 800×1000 · 401 KB).
Without it: the person's own photo at the top, then what gets measured and the real filename and size — still no
invented numbers. `npm run build` passes.

**Files:** `src/pages/user/UploadSingle.tsx`.


### 2026-10-02 — The user dashboard runs on the backend's own summary endpoint
*Status: committed (this commit); no backend change was needed*

**Nearly added an endpoint that already existed.** The plan was a new
`/api/user/dashboard/` returning the dashboard's counts — written, routed, tested — and the tests failed with
queries nothing in the new code could have made. `accounts/user_urls.py` already routes `dashboard/` to
`accounts.views.UserDashboardView`, so Django matched the existing one first and the new view was never reached.
Reverted the lot. The existing endpoint is better than what was being built: it carries `summary` (totals,
average quality, most common rejection reason, storage bytes, identity-group figures and whether grouping is
even switched on), `uploads_last_7_days`, `recent_uploads` and `recent_activity` — four screens' worth in one
request. **Check the API before adding to it.**

**Dashboard rewired to it.** Stat cards, the seven-day accepted-against-rejected chart (which was a hardcoded
`WEEKLY_DATA` array), recent uploads and the activity feed are all real now. Two judgements worth recording:
- The fourth stat card shows person folders only when `identity_groups_available` says grouping is on, and falls
  back to "In review" when it is not — a folder count of zero because the feature is off reads as a failure.
- Average quality is only shown when the backend has one. No measurement, no number.

**The sidebar's "Free plan · 312 MB of 500 MB" was pure fiction** — there is no plan and no quota anywhere in the
backend, so the bar was drawn against a limit nothing enforces. It now reads "5.8 MB stored · 11 photos", which
is what the backend can actually answer, and the progress bar is gone with the quota it was measuring.

**Verified against the live API in headless Chrome:** subtitle "11 photos · 5.8 MB stored", four stat cards,
the chart rendering from real daily figures, five real recent uploads, a real activity feed ("Face validation for
ui-upload.jpg: Exactly one suitable frontal face was detected"), and the sidebar with no trace of the old
"Free plan" or "500 MB".

**Files:** `src/lib/api/dashboard.ts` (new), `src/lib/imageData.ts`, `src/pages/user/Dashboard.tsx`,
`src/components/layout/Sidebar.tsx`.


### 2026-10-02 — A real result on the upload screen: before/after, and the measurements behind the verdict
*Status: committed (this commit)*

Owner's report: after uploading, the screen was bare — just "Your photo was accepted" and a button — and the
design had lost everything the old one showed. Fair. The old screen's content was invented (identical 82% scores
from one fake seed, a random name from a hardcoded list of five, a `sec-mock` download link, and a notice naming
Zero-DCE/GFPGAN/CodeFormer), so removing it was right, but nothing real had replaced it yet. The backend does
record the real equivalents; they just were not being asked for.

**What the result panel now shows, all of it real:**
- **Before and after.** Enhancing is a separate step on the backend from uploading, so the screen now starts it
  for an accepted photo, polls until it settles, and loads both sides into the comparison slider. The applied
  level is shown ("Light correction") because the backend picks it from the photo — which is also why a good
  photo's two sides look alike.
- **The six measurements behind the verdict** — sharpness, brightness, contrast, exposure, noise, resolution —
  as bars against the 60% acceptance threshold, with the threshold marked on each bar. New shared component
  `QualityScores`, also used on the image detail screen. These are the real numbers the pipeline recorded, which
  is what the old fake trio was pretending to be.
- **Faces found**, from the face validation result, and the photo's real size.

**Layout.** Once there is a result the picker column is hidden and the result takes the full width, with the
comparison beside the measurements, instead of a long card next to an empty column. The preview is capped by
height rather than forced into a 4:3 box, which was letterboxing portrait photos.

**Demo mode had the same emptiness** and now shows a full representative result — the person's own photo, the
sample measurements, their real filename and file size — with one honest line saying enhancement needs the
server. Checked by running a second dev server with the API switched off, which is the state the owner was in.

**Verified in headless Chrome, both ways.** With the API: a real photo uploaded, accepted, enhanced at "Light
correction", comparison slider loaded with both images, overall 85% with all six measures. With the API off: a
full result card, six measures, real filename and 401 KB size, and no fake names or model names anywhere
(checked by probing the rendered text for each of them).

**Follow-up the same day:** in demo mode the measurement bars were sample figures, so every photo scored the same
88%. Labelling them "(sample)" was not enough — drawing bars at all is the same problem this change removed, just
quieter. Without a server nothing has been measured, so demo mode now names the six things that get measured and
says the real scores arrive with the API, instead of inventing any. "Faces found" went the same way: it is a
measurement too.

**Files:** `src/lib/api/enhancements.ts` and `src/components/features/QualityScores.tsx` (new),
`src/lib/api/images.ts`, `src/lib/imageData.ts`, `src/pages/user/UploadSingle.tsx`,
`src/pages/user/ImageDetail.tsx`.


### 2026-10-02 — The user portal's upload → processing → images chain runs on the API
*Status: committed (this commit); backend fixes are PRs #59 and #60 on FaceCloud_backend*

The whole path a person actually walks — pick a photo, watch it process, find it in the gallery, open it — now
talks to the Django backend, behind `VITE_USE_API`. With the API off every screen still falls back to the demo
data, so the prototype stays browsable without a server.

**Shared groundwork, so screens are written once:**
- `src/lib/useApiResource.ts` — the loader every migrated screen needs: fetch on mount, cancel if the screen goes
  away before the answer does, reload after an action, demo fallback. `moderationData.ts` was rewritten onto it,
  so there is one of these rather than two.
- `src/components/ui/AuthedImage.tsx` — any image behind the bearer token (a photo, a thumbnail, a review's
  preview), fetched and handed to the browser as an object URL, **revoked** on unmount or key change.
  `ReviewThumbnail` is now a thin wrapper over it instead of a second copy.
- `src/lib/api/images.ts` and `src/lib/imageData.ts` — uploads, batch progress, gallery, detail, thumbnails and
  downloads, plus the hooks and a demo adapter.

**Screens migrated:**
- **Upload a Photo** was a 528-line simulation with invented scores, invented person-folder matches and the model
  names in its step labels. It now uploads for real and follows the backend's own stages, worded for the person
  uploading rather than naming what runs underneath — which also removes the model names from this screen.
- **Processing** follows the real progress endpoint, polling while the batch moves and **stopping on a terminal
  status** rather than forever. Shows each photo's own row (a batch can finish `partial`), and offers cancel
  while running and retry once finished.
- **My Images** is the real gallery: server-side status filtering, paging, real thumbnails, real downloads.
- **Your uploads** (`/dashboard/jobs`) lists real batches and links into the processing view.
- **Image detail** shows the photo at 1024, the verdict, the quality score and the reasons behind a rejection.

**Two real backend bugs found and fixed while wiring this:**
1. **PR #59** — `GET /api/images/{id}/` answered with a thinner serializer than `GET /api/images/my/`, so a photo's
   own page was missing `display_status` and the quality decision. A photo's page is exactly where someone asks
   "was it accepted, and why not", and it was the one view that could not answer. Both views now share one
   queryset builder so they cannot drift apart again — and reading one photo is still 4 queries, with a test
   holding that.
2. **PR #60** — `ModeratorReview.ai_confidence` held two different units: a quality score and a duplicate
   similarity are 0-100, an identity similarity is 0-1. The obvious reading (a fraction, multiply by 100) turned
   an 85.44 quality score into 8544%. Identity values are now normalised to a percentage where the review is
   created, with a data migration for existing rows. The frontend rendering was corrected to match.

**Verified end to end, not just type-checked.** Drove a real photo through the real UI in headless Chrome:
the file input took it, the pipeline accepted it, the result card read "Your photo was accepted · 800×1000",
My Images showed 7 real photos with loaded `blob:` thumbnails, the detail page reported "Accepted · 85%" with the
photo at 700×900, and the uploads list showed 3 batches (`COMPLETED | COMPLETED | PARTLY DONE`) linking into a
processing view with its stages and per-photo rows. `npm run build` passes; lint reports no new warnings.

**Files:** `src/lib/useApiResource.ts`, `src/lib/api/images.ts`, `src/lib/imageData.ts`,
`src/components/ui/AuthedImage.tsx` (all new), `src/lib/api/client.ts`, `src/lib/api/moderation.ts`,
`src/lib/moderationData.ts`, `src/components/features/ImageCard.tsx`, `src/components/features/ReviewThumbnail.tsx`,
`src/components/ui/StatusBadge.tsx`, `src/pages/user/{UploadSingle,ProcessingPage,ProcessingJobs,MyImages,ImageDetail}.tsx`,
`src/pages/moderator/ReviewQueue.tsx`, `README.md`.

**Still on mock data:** Dashboard, Downloads, Activity Logs, Identity Groups, Group Detail, Notifications, and the
multiple/ZIP upload screens; the nine remaining moderator screens; the thirteen admin screens.


### 2026-10-02 — Merged the three backend PRs into FaceCloud_backend `main`
*Status: backend only — nothing changed in this repo except this log*

All the day's backend work is now on `main` in Ijaz's repository, merged in order so each built on the one
before: **#56** (test suite portable across database engines) → **#57** (review deadlines, claim lock, bulk
decisions, per-moderator metrics) → **#58** (the photo under review).

`main` is a protected branch, so each PR had to be up to date with it before it could merge. #57 needed a
branch update, which re-ran CI — green, then merged. #58 hit two snags worth recording:

- GitHub's own "update branch" button reported a conflict, but merging `origin/main` into the branch locally
  resolved cleanly with no conflict at all. GitHub was comparing against a stale mergeability cache, not a
  real conflict.
- `gh pr merge --delete-branch` **closed the pull request and deleted its branch even though the merge
  itself failed.** Nothing was lost — the commit was safe locally and the remote branch still had it — but the
  PR had to be reopened after pushing the merge. Worth knowing: do not pass `--delete-branch` on a merge that
  might be refused.

Verified on `main` after pulling: **1172 tests passing**, `makemigrations --check` reports no changes, and
`spectacular --validate --fail-on-warn` exits 0.

**Repository rule (restated by the owner):** backend work goes **only** to
[ijaz-student021/FaceCloud_backend](https://github.com/ijaz-student021/FaceCloud_backend); frontend work goes
**only** to [ali4347/facecloud-ai-platform](https://github.com/ali4347/facecloud-ai-platform). The two never
mix — the backend is Ijaz's half of the project, the frontend is Ali's. Checked and holding: this repo tracks
no Python, and the backend repo tracks no frontend files.


### 2026-10-02 — The moderator can now see the photo being judged
*Status: committed (this commit); backend change is PR #58 on FaceCloud_backend — **merged into `main` on 2026-10-02***

Closing the gap flagged in the entry below. Thumbnails were owner-only
(`thumbnails/views.py` filters on `owner=request.user`), so a moderator was being asked to decide on a photo they
could not see — which is not a decision anybody can make.

**Backend (PR #58).** New `GET .../moderator/reviews/{id}/image/?size=` serving the photo as a JPEG thumbnail. It is
deliberately the narrowest access that makes the decision possible, not general access to an organization's images:

- **Keyed by review, not by image.** A moderator can only see photos they have actually been asked to judge; an image
  with no review in this organization has no URL here at all.
- **Thumbnails only**, at the configured sizes (256 default, 1024 also allowed; a photo is never enlarged). Judging
  blur, lighting, framing and whether a face is even present does not need the original — and not serving the original
  means a moderation role cannot be used to pull people's photos out of the system.
- **The same gate as the review itself**, so losing the role closes it at the same moment. Tests cover both a demotion
  (403) and a suspension (404).
- **Views are not audited, on purpose.** A thumbnail is fetched every time the queue renders, so logging each one would
  bury the membership and decision history the audit log exists for; who worked a review is already recorded by its
  claim and its decision.

Each review also carries `image_name` now, so a queue row is recognisable before its thumbnail arrives, and the list
view fetches the image alongside the review instead of one query per row. 19 new tests; suite **1172 passing**.

**Frontend (this repo).** The API authenticates with a bearer header, which `<img src>` cannot send, so the bytes are
fetched and handed to the browser as an object URL:

- `apiFetch` split into a shared `request()` plus `apiFetch` (JSON) and a new `apiFetchBlob` (binary), so authentication
  and the token-refresh retry are not repeated for file responses.
- `src/components/features/ReviewThumbnail.tsx` loads the photo, **revokes the object URL** on unmount or when the
  review changes (otherwise the page holds every thumbnail it has ever shown), and falls back to a placeholder tinted
  from the review id when there is no preview — which covers both the demo data and a photo whose file is gone.
- The queue has a Photo column and shows the real filename as the row title.

**Verified end to end:** over HTTP the endpoint answers `200 image/jpeg` with `Cache-Control: private`, decodes as a
real 256×192 JPEG, refuses an unauthenticated request with 401 and another organization with 404. In headless Chrome
all six queue rows render a loaded `blob:` image at 256×192 with the correct filenames. `npm run build` passes.

**Files:** `src/lib/api/client.ts`, `src/lib/api/moderation.ts`, `src/lib/moderationData.ts`,
`src/components/features/ReviewThumbnail.tsx` (new), `src/pages/moderator/ReviewQueue.tsx`, `README.md`.


### 2026-10-02 — Moderator queue operations in the backend, and the moderator panel attached to it
*Status: committed (this commit); backend changes are PRs #56 and #57 on FaceCloud_backend — **both merged into `main` on 2026-10-02***

**Backend audit first.** Checked whether the Django project was actually built professionally before adding to it:
`pip-audit` reports no known vulnerabilities, `bandit` no medium/high findings, **zero** TODO/FIXME/HACK markers in
45,000 lines, no hardcoded secrets, 1,110 functions with only 9 over 120 lines, and 1,050 test functions with 2,766
assertions and behaviour-style names. It is professional work. The one real defect was that the suite only passed on
PostgreSQL — fixed in **PR #56**: SQLite reuses a primary key after a rolled-back transaction while PostgreSQL never
does, so several tests shared one DRF throttle bucket (throttles are keyed by `user.pk` and the cache is not rolled
back) and tripped the collage endpoint's 20/hour limit; the same reuse polluted the shared `MEDIA_ROOT` folder for a
thumbnail race test. Test runner now clears the cache per test and the thumbnail test compares the folder before and
after. 1054 passing on SQLite in 13s, no application code touched.

**New moderator features (PR #57, backend).** Four additions, each closing a way the queue could go wrong quietly:
- *Review deadlines (SLA).* Every review is stamped with a `due_at` at creation from `MODERATION_SLA_HOURS` (default
  24) and the deadline never moves afterwards, so a review is judged against the service level it was accepted under.
  Queue takes `?overdue=true`, `?assignment=mine|unassigned` and `?ordering=due_at`; the dashboard adds `overdue`,
  `due_soon`, `unassigned`, `claimed_now`, `oldest_open_age_hours` and `sla_hours`; a new `moderation.flag_sla_breaches`
  beat task sends one `moderator_review_overdue` notification per late review.
- *Claim soft lock.* `claim/` holds a review for `MODERATION_CLAIM_MINUTES` (default 15) so two moderators cannot work
  the same photo and race to contradictory decisions — another moderator's decision or escalation answers 409. It
  expires on its own so nothing is stranded, `release/` returns it early, an owner can release someone else's hold,
  and losing moderator rights drops the claim.
- *Bulk decisions.* `bulk-decision/` approves, rejects or escalates up to 50 reviews. Each row goes through the same
  `decide_review()` as the single endpoint and succeeds or fails on its own, so one stale row does not cost the other
  forty-nine. `correct` is excluded — the person-folder choice is per photo.
- *Per-moderator performance.* `metrics/?days=30` reports throughput by outcome, on-time/late against each review's own
  deadline, and average and slowest decision time measured from when the review arrived, not from when it was assigned.
  The platform-wide admin overview carries the same counts.

Also widened the backend CI static-analysis scan from a hand-kept list to **every** app — it had fallen behind and left
`moderation`, `organizations`, `collages`, `events` and `thumbnails` unscanned. 99 new tests; suite now **1153 passing**,
with `manage.py check`, `makemigrations --check` and `spectacular --validate --fail-on-warn` all clean, green on
PostgreSQL in CI.

**Frontend attached to it (this repo).** The moderator dashboard and review queue now read live data:
- `src/lib/api/moderation.ts` — typed client for the queue, dashboard, claim/release, bulk decisions and metrics.
- `src/lib/api/organizations.ts` — resolves which organization to scope moderator requests to, preferring a shared
  organization over the personal one every account gets (the personal one has nobody to moderate).
- `src/lib/moderationData.ts` — hooks serving either the real API or the built-in demo data, adapted into the same
  shape so each screen is written once. With `VITE_USE_API=false` the panel still shows a full demo queue.
- `ModeratorDashboard.tsx` rebuilt around the service level: overdue / due soon / unassigned / oldest waiting first,
  then the queue counts, then a team performance table over a 7/30/90-day window.
- `ReviewQueue.tsx` rebuilt on real reviews: status/source/assignment filters, an overdue-only toggle, deadline-first
  ordering, deadline chips (overdue, due soon, on track, met, missed), who is holding each review, per-row claim and
  release, and multi-select bulk approve/reject/escalate that reports per-row outcomes rather than one success or error.

**One real bug fixed on the way.** `apiFetch` could not recover after a page reload: the access token lives in memory
only, and the 401 for a *missing* credential carries no `token_not_valid` code, so the retry path never fired and a
valid refresh token sat unused while the person looked signed out. It now exchanges the refresh token before the first
request when there is no access token in memory. This affects every screen, not just the moderator ones.

**Verified end to end**, not just type-checked: signed in against the local Django server, seeded a demo organization,
and confirmed over HTTP that the dashboard reports `overdue: 2 / due_soon: 1 / oldest_open_age_hours: 6.0`, that a
second moderator's decision on a claimed review returns **409** naming the holder, that a bulk approve of four ids
returns **2 succeeded / 2 failed** with per-row reasons, and that metrics report `on_time_rate` 1.0 and 0.5 for the two
moderators. Then drove the real UI in headless Chrome: queue renders 6 rows with correct deadline chips
(`OVERDUE, MISSED, MET, MET, MET, ON TRACK`), the held-by column shows the live claim, and the bulk bar appears on
selection. `npm run build` passes; lint reports no new warnings.

**Files (this repo):** `src/lib/api/moderation.ts` (new), `src/lib/api/organizations.ts` (new),
`src/lib/moderationData.ts` (new), `src/lib/api/client.ts`, `src/pages/moderator/ModeratorDashboard.tsx`,
`src/pages/moderator/ReviewQueue.tsx`, `.env.local` (gitignored; the old `.env` is a leftover from the removed
Node/Prisma backend and has no effect on a Vite app).

**Known gap, needs a decision.** Image thumbnails are owner-only (`thumbnails/views.py` filters on
`owner=request.user`), so a moderator cannot see the photo they are being asked to judge. Giving moderators
organization-scoped access to review images is the obvious next step, but it widens who can see facial data, so it is
left for the owner to decide rather than done quietly.


### 2026-10-02 — Reviewed the Django backend, and started attaching it
*Status: committed (this commit)*

**Review of [FaceCloud_backend](https://github.com/ijaz-student021/FaceCloud_backend)** (read-only; cloned, installed
and run locally):
- Django 6.1 + DRF, 45,427 lines across 24 apps, 175 endpoints, 43 models, 1054 tests, 50 documented features.
- Verified here: dependencies install clean, `pip check` passes, Django system check raises one expected warning
  (identity model not configured), no missing migrations, and the OpenAPI schema validates with zero warnings and
  151 documented paths. 1048 of 1054 tests pass on sqlite; the 6 failures are the collage endpoint's own 20/hour
  throttle firing inside its test run, plus one thumbnail race test leaving a file. The project's own CI runs on
  PostgreSQL and is green.
- It is a careful piece of work: `DEBUG` fails closed, a production guard refuses to boot on unsafe configuration,
  CORS opens only in `DEBUG`, DRF defaults to `IsAuthenticated`, 14 throttle scopes, separate keys for two-factor,
  image encryption and identity embeddings, invitation tokens stored hashed, and an audit event on every
  organization change.
- **The frontend is the weaker half**, not the backend. The backend's own feature list marks the user and moderator
  dashboards as "Planned frontend integration".

**Started the integration:**
- Fixed all 6 npm advisories (5 high, including a React Router CSRF advisory). `npm audit` now reports none.
- **Removed `backend/` and `docker-compose.yml`.** That folder was a Prisma schema drafted before the Django backend
  existed: 15 models against the real 43, no API at all, and a documented setup that did not work (the Prisma CLI
  could not find `DATABASE_URL` from `backend/`, and compose created `facecloud_db` while `.env` pointed at
  `facecloud`). Keeping two contradictory backends in one repo would only mislead.
- `.env.example` rewritten for a browser app: `VITE_API_URL` and `VITE_USE_API` instead of database and SMTP secrets.
- New `src/lib/api/`: `config.ts`, `tokens.ts`, `client.ts`, `auth.ts`. The access token is kept in memory only and
  the rotating refresh token in storage; refreshes are single-flight, because several requests expiring together
  would otherwise each spend the rotating token and invalidate the session they were trying to save.
- The sign-in screen now calls the real API when `VITE_USE_API=true`, and falls back to the mock otherwise, so the
  demo keeps working while screens migrate.
- Added frontend CI (type-check, lint, build, `npm audit`) and Dependabot, matching the backend's standard.
- Verified end to end against the running backend: a wrong password returns the backend's own message, a correct one
  signs in, routes by the role the server returned, and stores the rotating refresh token.

### 2026-10-02 — Model names hidden, password reveal, working mark-as-read
*Status: committed (this commit)*
- **Sidebar no longer names the model.** The "Zero-DCE AI — Model active" card told users which model runs, which is
  an implementation detail. In its place the user portal shows the plan and storage used, with a bar — something a
  person actually acts on. Admin and moderator have no quota, so they show nothing there rather than filler.
- **Upload Center** no longer names the model either: the step reads "Enhance image", and the card is titled "What
  happens to your upload" instead of "Methodology Trace Steps".
- **Password fields have a reveal toggle.** New `src/components/ui/PasswordInput.tsx`, used on the three sign-in
  screens and the three fields in Settings → Security. The toggle is a real button with a label that says which way
  it goes, and it is out of the tab order so it does not sit between the field and the submit button.
- **"Mark all as read" works.** It had no handler at all. New `src/lib/notifications.ts` keeps read ids per account;
  the bell only carries a dot while something is unread, the header badge counts unread rather than total, read rows
  lose their dot and emphasis, and the button becomes a disabled "All caught up" when nothing is left.
- Verified in the running app: the model name is gone from both screens, three reveal buttons switch their field to
  text, and marking all as read clears the badge and the dot and survives in storage.

### 2026-10-01 — One account menu, in the sidebar
*Status: committed (this commit)*
- The signed-in person appeared twice in the shell: top right and bottom left, each with its own menu. Removed the
  topbar copy; the sidebar card is now the single account menu. The topbar keeps only search, appearance,
  notifications and history.
- The sidebar card opens upward with the full details — avatar, name, email, role badge — plus Settings and Logout.
- **Logout actually signs you out now.** The topbar menu's Logout was a plain link to `/login` that never cleared
  the session, so the route guard saw a valid session and let you straight back in. The merged menu clears the
  session first, then goes to the login page for that role.
- Settings only appears for roles that have a settings page: the admin console has none, and the old menu linked
  every role to `/dashboard/settings`, which a moderator or admin could not open.
- The menu reads the session itself through `useSessionUser`, so the sidebar no longer passes identity down.
- Verified in the running app: no profile remains in the topbar, the menu opens with the email shown, an outside
  click closes it, and Logout clears storage and lands on `/login`.

### 2026-10-01 — User menu now closes when you click away
*Status: committed (this commit)*
- The topbar's user card stayed open when you clicked elsewhere, and survived a route change — it was still hanging
  over the next page.
- **Cause:** it closed itself with a full-screen `fixed inset-0 z-30` backdrop rendered inside the topbar. The topbar
  is `sticky z-30`, which starts its own stacking context, so that backdrop could never rise above the sidebar at
  `z-50`. Clicks over the sidebar — including the nav links — went straight past it.
- Replaced the backdrop with the pattern the notification panel already used: a document-level `pointerdown`
  listener, an Escape handler that returns focus to the trigger, and a close on navigation. A document listener has
  no stacking blind spot.
- The two topbar popovers are now mutually exclusive: opening one closes the other, through a small shared
  announcement in `src/lib/popover.ts` rather than either knowing about the other.
- Verified all five paths in the running app: clicking page content, clicking the sidebar, Escape, opening
  notifications, and navigating from a sidebar link.

### 2026-10-01 — Profile form made general, and it now actually saves
*Status: committed (this commit)*
- The profile form asked for **University** and **Department**. FaceCloud is for anyone with photos to clean up, not
  for one university, so those are replaced with fields that suit any account: Organization, Job Title, Phone and
  Country — all optional. Full Name stays required; Email is read-only, because it identifies the account in the
  mock session and editing it would orphan the sign-in.
- **The form never saved anything.** Every field was an uncontrolled `defaultValue` and "Save Changes" had no
  handler, so edits vanished on navigation. It is a real form now: controlled inputs, a submit handler, a "Profile
  saved" confirmation, and an error line if storage refuses.
- Changing the name updates the session, and the topbar, sidebar and dashboard greeting follow immediately —
  `useSessionUser` subscribes to a session-change event instead of reading once per render. Initials are derived
  from the name rather than stored separately, so they cannot drift.
- New `src/lib/profile.ts` keeps the optional details per account, matching how avatars are stored.
- Verified in the running app: filled every field, saved, and confirmed what landed in storage and that the name and
  initials changed across the shell.

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
- Admin `/admin` (13): index, `users`, `moderators`, `moderation`, `invitations`, `audit-logs`, `security`, `system`, `upload-statistics`,
  `statistics`, `rejection-summary`, `images`, `api-docs` and `api-test` → `/admin`, `logs`→`audit-logs`. `Rejections` and `SystemHealth` pages exist without a route on purpose.
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

- **The backend is a separate repository** — `github.com/ijaz-student021/FaceCloud_backend` (Django 6.1 + DRF + SimpleJWT + Celery +
  Redis + PostgreSQL in production, SQLite in development), cloned at `~/Projects/FaceCloud_backend`. The Prisma / NestJS design this
  section used to describe was never built; `README_BACKEND_ROADMAP.md` is stale for the same reason.
- **Not deployed anywhere.** It runs only on the owner's machine (`manage.py runserver`, API docs at `/api/docs/`, Django admin at
  `/admin/`). The live site (facecloudai.com on Hostinger) is the demo build and does not call it.
- **Authentication is attached (2026-10-16):** sign-up with an emailed link, user / admin / moderator sign-in, sign-out, forgot and reset
  password — against backend PR #73, not yet merged. Other already-attached screens: user upload / processing / gallery / dashboard,
  moderator queue and dashboard, admin Users and Moderators lists. Everything else is still demo data.
- **Backend gaps:** none for authentication or for the admin Add User / Create moderator forms (PR #75 is merged). The user-dashboard work (search,
  Person Folder images, Downloads fields, Activity schema, profile and sessions) is the next backend piece.

---

## 6. Pending Work (audit of 2026-10-18)

**State:** the frontend is committed and pushed (see the 2026-10-18 entries). The live site (www.facecloudai.com) is still the demo build and is untouched.

**Frontend screens still on demo data (no backend call):**
- Admin: all connected (2026-10-18); Statistics is routed (2026-10-19). Moderation Overview, Invitations and the failed uploads / failed jobs cards on System Monitoring are connected (2026-10-19). Only the single security-alert detail endpoint is still unused. `Rejections.tsx` and `SystemHealth.tsx` are deliberately not routed (duplicates).
- Moderator Member Management is connected (2026-10-19). The invitation page `/invitations/:token` exists (2026-10-19).
- Moderator: every screen is connected, including the Decision Log (`/moderator/logs`). Identity Review, Rejected Images and the Decision Log were unrouted pages and now have routes.
  Backend endpoints exist under `/api/organizations/{id}/` (moderator batches, reports, members, invitations, audit, assign, merge-identity-groups, image preview).
- Public: the Contact form is connected (`POST /api/contact/`).
- User portal: every screen is connected. Not yet in the UI although the backend has them:
  move / remove a photo and cover photo (the backend must add `membership_id` to the folder's photo rows); "find this person"; folder history; camera sessions and snapshots for Live Enhancement; events and collages; the enhancement advisor and model comparison.
- Of 190 backend paths (230 operations) roughly 80 are called by the frontend today (the moderator queue builds its paths from a prefix, so a plain text search undercounts); the rest belong to the items above.

**Backend (separate repository) still to do, as asked of the backend owner:** Phase 1 (blur never rejects, restoration chain) is merged (#85). Not started: Phase 1B (auto = HD and situation-aware by default, defocus deblur, speed and GPU plan),
Phase 2 (small-face floor, ignored background faces, completely-dark-only rejection, warnings list), Phase 3 (accepted photos enhanced automatically, batch-enhance must skip rejected photos), Phase 4 (groups enhanced per person),
photo delete clean-up and bulk delete, `best_score` on new-group decisions, an activity `?type=` filter; open PR #84 (readable emailed links in development) and five dependency PRs. Deployment (VPS, HTTPS, Postgres, Redis, Celery, SMTP) is not started.

**Backend change waiting (2026-10-24):** the adaptive engine's "polish" (`feat/adaptive-polish`, commit 8845a4a, flag `ADAPTIVE_POLISH_ENABLED` off by default) passed QA script 16 (flag off identical to the unchanged backend; dark/noisy untouched; a polished photo is the same photo and sharper) but polishes few ordinary photos and only slightly. It needs the owner's decision on strength and the backend developer's merge; turn it on with that one `.env` line, off by removing it.

**Operations:** the development database must be migrated after every backend pull (`manage.py migrate`; the local backend clone is currently 7 commits behind `origin/main`).

---

## 7. Known Issues / Tech Debt

- **Owner's local backend is behind (2026-10-19).** `~/Projects/FaceCloud_backend` is on `main` at PR #72; PR #86 and later are on origin. The admin screens work but show an "older backend" notice until it is pulled and restarted.
- **Downloaded reports read badly and can contradict themselves (2026-10-19).** The PDF/JSON/CSV are produced by the backend (`reports/renderers.py`, `reports/services.py`): ISO timestamp, raw byte counts and codes, truncated filenames, and a batch report whose photos were deleted shows Total Images 0 next to Accepted Uploads N. The frontend now hides the batch report button for an emptied upload; the wording and counts are a backend fix (prompt given to Ali for Ijaz).
- **Two admin pages are not routed on purpose (2026-10-19).** `Rejections.tsx` duplicates Rejection Summary and `SystemHealth.tsx` duplicates System Monitoring; the files are kept.

- **(Closed, checked 2026-10-22) Backend permission gap — a moderator can promote a member to moderator.** On current `origin/main` the API answers 403 "Moderators may only set the normal member role." (`qa/scripts/04-api-security.mjs`, SEC-07). Original note: found 2026-10-15 by exercising
  `update_member()` in a rolled-back transaction. Invitations refuse it and the owner role is refused, but the
  moderator role is not guarded on the PATCH path. Not fixed: the backend is frozen at the owner's request. When
  it is unfrozen, the fix belongs next to the owner-role check in `organizations/services.py::update_member`, with a
  test, and the role guide's wording can then be strengthened.
- **Plans are shown as "Coming soon" (2026-10-16).** Pricing is deferred to V2, so the cards are disabled.
- **Two plan vocabularies, neither enforced.** The landing page prices Free / Basic / Pro per individual user
  (storage and image counts); the backend's `Organization.plan` is Free / Team / Enterprise. Nothing in the backend
  changes behaviour by plan, so none of the limits shown publicly are real. The role guide avoids the subject.

- `aigocy.zip` (10 MB), `reference-templates/aigocy/` (399 files) and `aigocy/` (182 files) are tracked in git; they
  bloat the repo and are not used by the app.
- JS bundle is 2.28 MB minified with no route-level code splitting (Vite warns on every build).
- `README.md` §6 lists only 5 moderator routes; the app has 9. README section numbering skips §19.
- `docker-compose.yml` defaults the database name to `facecloud_db` while README §15 uses `facecloud` in `DATABASE_URL`;
  confirm which one the local `.env` uses.
- No unit tests; end-to-end QA scripts exist in `qa/` (2026-10-22) and a basic accessibility pass was done. No real email/API integration (README §18). Open QA items: `qa/BUGS.md`.
- `npm run lint` scans `reference-templates/` and `aigocy/` as well, so its output is dominated by thousands of
  warnings from a vendored jQuery copy. Add an oxlint ignore for those directories, or delete them (see §6).
- Deployment is a manual upload, and `.htaccess` is a hidden file that most file managers do not show. If a deploy
  drops it, every deep link breaks again with the host's 404 page.
- The model names are still visible on other user screens — the notification and activity feeds, Processing, Single
  Upload, Person Folders and Live Enhancement — because only the two screens named were changed. Decide whether the
  rest should be scrubbed too, and whether the admin console (which legitimately lists services) is exempt.
- Profile details, avatars and notification read state live in this browser's `localStorage`, so they do not follow the account to another device and are lost
  if site data is cleared. They move to the server once the API exists.
- Role separation is still enforced in the browser only on every screen except sign-in. It moves to the server as
  each screen is migrated to the API.
- Model weights for the backend are licensed CC BY-NC-SA 4.0 for PureScale and PureVision — **non-commercial**. Fine
  for the project as it stands; a commercial release would need different models.
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
