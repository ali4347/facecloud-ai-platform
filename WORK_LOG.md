# FaceCloud — Work Log & Project Documentation

> **Purpose:** this is the single running record of *everything that has been done* on the FaceCloud FYP project.
> Detailed feature/route docs live in [README.md](./README.md); the backend blueprint lives in
> [README_BACKEND_ROADMAP.md](./README_BACKEND_ROADMAP.md). This file records **what was done, when, and what state things are in.**
>
> **Update rule:** every task that changes code, config, assets, database schema or docs must add a dated entry to
> **Section 2 (Change Log)** and refresh any affected status section, in the same sitting as the work.
> (Enforced for Claude Code by `CLAUDE.md` and the Stop hook in `.claude/hooks/check-work-log.sh`.)

**Last updated:** 2026-10-16
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
| User portal (16 routes under `/dashboard`) | ✅ Complete | Single upload, processing, uploads list, My Images and image detail run on the live API; groups, downloads, activity, notifications, multiple/ZIP upload and live webcam enhancement are still on mock data |
| Admin console (11 routes under `/admin`) | ✅ Complete (mock) | Users, audit, security, API docs/test, system, stats, image monitoring |
| Moderator panel (9 routes under `/moderator`) | ✅ Complete | Dashboard and review queue run on the live API (deadlines, claim lock, bulk decisions, team performance, and the photo under review as a thumbnail); image review, members, batches, notifications, reports, audit and settings are still on mock data |
| Branding + design system | ✅ Done | Orange `#F97316` is the brand accent everywhere, in both appearances. The whole site — marketing pages, auth screens and the three dashboards — switches between dark (default) and light from one setting on `<html data-theme>`. Public pages keep the monospace display face and glass panels; the dashboards use a flatter card layout (`.fc-app`, Inter headings) |
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

- **Backend permission gap — a moderator can promote a member to moderator.** Found 2026-10-15 by exercising
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
- No automated tests, no accessibility audit, no real email/API integration (all listed as future work in README §18).
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
