# Bug log

Newest pass first. **IDs**: `BE-` backend (Ijaz's repository: a prompt is written for each), `FE-` frontend (this repository).
Status: **Open**, **Fixed** (commit named), **Decision** (needs the owner's call). Severity is defined in `TEST_PLAN.md`.
"Evidence" is the check id in `qa/scripts/` (re-run it to see the failure or the fix) and, where useful, a screenshot name in `qa/out/`.

## Summary of the 2026-10-22 pass (16 bugs: 8 major, 8 minor; 10 fixed, 6 open, all six backend)

| ID | Severity | Status | Title |
|---|---|---|---|
| BE-006 | Major | Open | Reviews are created in personal workspaces, where nobody can decide them, and pile up on the administrator's list |
| FE-010 | Major | Fixed | A person with no team was told "a moderator will take a look" (there is none) and the photo was not enhanced |
| BE-005 | Major | Open | The defence demo's dark photo (x0.25) is now refused as "severe underexposure", so low light cannot be shown |
| FE-009 | Major | Fixed | Enhancement looked as if it did nothing: no reason on screen when a photo needed no fixing |
| BE-004 | Major | Open | The administrator's organization list is limited to 30 reads an hour (it shares the invitation limit) |
| FE-008 | Major | Fixed | One page load sent the same request up to 8 times, using up the hourly allowance |
| FE-001 | Major | Fixed | Single upload: a refused file says "the reason is below" but shows no reason |
| FE-002 | Major | Fixed + Decision | Live Enhancement: dead model address, unpinned runtime, and it needs the internet |
| BE-001 | Minor | Open | Login accepts an identifier of any length; a 300 KB one gives HTTP 500 on SQLite |
| BE-002 | Minor | Open | An unknown API address answers an HTML "Not Found" page instead of JSON |
| BE-003 | Minor | Open | Health check takes 6 to 18 seconds when a service (Redis) is down |
| FE-003 | Minor | Fixed | Sign-in, register, forgot-password: fields not linked to their labels, no main heading |
| FE-004 | Minor | Fixed | Every page has the same browser-tab title |
| FE-005 | Minor | Fixed | Landing page: the early-access submit button has no name for screen readers |
| FE-006 | Minor | Fixed | Multiple upload: broken-image icon for files that are not pictures |
| FE-007 | Minor | Fixed | A 0-byte file shows its size as "--" |

---

### BE-006 Reviews are created where nobody can decide them — Major — Open (Ijaz)
- **Steps:** sign up a new person (no team) and upload a photo the quality check is unsure about (`public/hero-portrait.png` copied as `hero.jpg` does it). Then, as administrator, `GET /api/system/moderation/`.
- **Expected:** a personal workspace has no moderator, so nothing is queued for one.
- **Actual:** a `ModeratorReview` is created in the person's personal workspace and stays *pending* for ever. It appears under `organizations_needing_attention` (four personal workspaces after four such uploads in the test), it is counted in `totals.pending` and `unassigned`, and after a day it will count as `overdue` and `stale_open`. The administrator's picture of moderation fills with work nobody can do.
- **Fix (backend):** (a) do not create a review (quality, duplicate or identity) when the photo's organization is a personal workspace; the owner decides, and the photo stays usable (enhancement and grouping already allow an unsure photo there); (b) leave personal workspaces out of `/api/system/moderation/` and the moderator dashboard figures; (c) a management command `close_personal_reviews` (dry run by default) that closes the pending reviews that already exist, with the reason "No moderator in a personal workspace" and no deciding moderator; (d) tests: a personal upload makes no review row, a team upload does, the overview excludes personal workspaces, the command can be run twice safely.
- **Evidence:** `ONB-17`.

### FE-010 A person with no team was promised a moderator — Major — Fixed
- **Steps:** sign up, sign in, Single Upload of the same unsure photo.
- **Actual:** "**A moderator will take a look**" and "The batch finished partly", although a personal workspace has no moderator; the photo was not enhanced (only accepted photos were). The multiple and ZIP screens said "Sent to a moderator: N".
- **Fix:** for a photo in the person's own workspace the screen says "The checks were not sure about this photo. It is in your own workspace, so no moderator will look at it. You can still enhance and use it, or upload a clearer photo.", enhances it like any other, and shows the quality figures and download. For a team's photo the wording is unchanged. The multiple and ZIP screens say "Not sure about (kept, no moderator in your workspace)" for the person's own workspace (`UploadSingle.tsx`, `UploadMultipleLive.tsx`, `UploadZipLive.tsx`).
- **Evidence:** `ONB-07`, `ONB-08`, `ONB-12`.

### BE-005 The demo's dark photo is refused, so low-light enhancement cannot be shown — Major — Open (Ijaz)
- **Steps:** `python scripts/seed_demo.py --photo <any portrait> --dark` (this is what `scripts/defense_demo.sh` does), or upload any portrait darkened to a quarter (brightness about 18 to 25 of 255).
- **Expected:** the dark photo is accepted and brightened (the readiness report of 2026-10-15 shows "dark portrait: enhanced").
- **Actual:** the quality check refuses it: `rejected: severe_underexposure, contrast_too_low`. A refused photo is never enhanced, so the next call in the script (`POST /api/enhancements/images/{id}/`) answers 400 and the script stops with a KeyError. The flagship low-light feature cannot be shown with the demo's own photo.
- **Measured (clean portrait, brightness 71, lossless PNG, adaptive and default policies alike):** brightness x0.60 is left alone (nothing needed), **x0.50 -> brightened 35 to 67, x0.40 -> 28 to 56**, x0.35 and darker -> refused. So enhancement works; the refusal limit sits above the demo's x0.25.
- **Fix (backend):** (1) make `seed_demo.py` darken to x0.40, tell the person when a photo was refused instead of crashing, and update `docs/demo/defense-demo.md`; (2) the roadmap's "Phase 2: refuse only a completely dark photo" - a dark photo should get a warning and go to low-light enhancement; refuse only when there is no usable signal (for example brightness under about 6).
- **Evidence:** `ENH-05`, and the sweep in `QA_REPORT.md`.

### FE-009 Enhancement looked as if it did nothing — Major — Fixed
- **Report (Ali):** "after upload it does not seem to enhance, and when I click Auto enhance nothing happens".
- **Findings (the same settings as Ali's backend, real photos):** enhancement does run, and does its work when a photo needs it: a dark portrait goes from brightness 28 to 56, a noisy one loses about half its grain, a blurred one is partly deblurred. A clean, well-lit portrait is **deliberately left as it is** (changed by 1.6 of 255). The screens made that look like a fault: the upload screen labelled the clean photo "**Light correction**", the photo page said "strength applied Light", the report said "No restoration stage changed this photo", and in the editor **Auto** left every slider at 0 and the preview "No changes" with no word of explanation.
- **Fix:** when no stage ran the screens now say "**No correction needed**" and "Nothing needed fixing, so this photo was left as it is. Enhancement changes dark, noisy or blurry photos the most."; the editor's Auto (and "Auto + brighten") explains when it found nothing ("Auto found nothing to fix: this photo is already well exposed and sharp. Try "Auto + brighten" ..."). Files: `EnhancementReport.tsx`, `UploadSingle.tsx`, `EnhancedVersionCard.tsx`, `PhotoEditor.tsx`, `enhancements.ts` (`changedNothing`).
- **Evidence:** `ENH-02`, `ENH-06` to `ENH-09`.

### BE-004 The administrator's organization list is limited to 30 reads an hour — Major — Open (Ijaz)
- **Steps:** sign in as the administrator and open Organizations, Moderators, Invitations or the Users "add account" form, about 15 to 30 times in an hour (a few rehearsals).
- **Expected:** these screens keep opening.
- **Actual:** `GET /api/organizations/admin/` answers `429 "Request was throttled. Expected available in 3405 seconds."`; the four screens show "The organizations could not be loaded" for almost an hour. Measured: refused at read 15 after the earlier test runs had used the rest.
- **Why:** `AdminOrganizationListCreateView` sets `throttle_scope = "org_invite"` (30/hour) for **both** the list (GET) and the create (POST). The limit was meant for the create.
- **Fix (backend):** apply `org_invite` to POST only (for example a `throttle_scope` property like the logo view has), or give the list its own scope of at least 600/hour.
- **Workaround now, no code:** add `THROTTLE_RATE_ORG_INVITE=1000/hour` to the backend `.env` for the demo and restart the backend (restarting also clears the counters on a development server).
- **Frontend mitigation (done):** see FE-008 (fewer requests, the list kept for a minute) and the "Too many requests. You can try again in about N minutes." sentence.
- **Evidence:** `LIM-01`, and the three admin crawl failures when the allowance was used up.

### FE-008 The same request was sent several times per page — Major — Fixed
- **Measured (one full page load, request counts):** user pages 8 to 9; moderator pages **12** (`/api/organizations/` **8 times**); upload page 9 (`organizations/` 4 times); `notifications/unread-count` and `user/dashboard` twice on most pages; admin pages 7 to 10. The server allows 1000 requests per person per hour, and this made rehearsals reach the limit sooner.
- **Why:** the sidebar, the top bar and the screen each ask for the same list when they appear.
- **Fix:** `client.ts` lets identical reads that are in flight at the same moment share one request (a change made by the person ends the sharing, so nothing is served stale; a caller's own cancel still works). The administrator's organization list is also kept for a minute, and dropped as soon as anything is changed.
- **After:** user pages 5 to 7, moderator pages 5 to 6, admin pages 5 to 7.
- **Evidence:** the request counts above (re-measure with the script in `WORK_LOG.md`), `07-flows.mjs` and `01-crawl.mjs` still pass.

### FE-001 Single upload: refused file shows no reason — Major — Fixed
- **Steps:** user portal, Upload Center, Single Upload, choose a `.txt` file (or a text file renamed `.jpg`, or a PDF), Confirm & upload.
- **Expected:** a sentence that says why ("Unsupported file type. Allowed formats are ...").
- **Actual:** "Your photo was not accepted. *The reason is below — a clearer photo usually fixes it.*" and **nothing below**. The hint was also wrong for a non-picture, the preview was a broken-image icon, and a one-file upload said "The batch finished partly".
- **Why:** the multiple and ZIP screens list the reasons; the single screen never did.
- **Fix:** the single screen now shows the same reason list, a plain "The reason is below.", a file-name card instead of the broken icon, and no "batch" note for a refused single file (`UploadSingle.tsx`).
- **Evidence:** `UPUI-01` to `UPUI-04`, screenshot `upload-single-txt.png`. **Fixed in:** the commit that added `qa/`.

### FE-002 Live Enhancement: model address, version and internet — Major — Fixed + Decision
- **Steps:** user portal, Live Enhancement (any browser console).
- **Actual:** the page asks Google for `blaze_face_full_range_sparse/.../latest/...tflite`, which answers **404**, then falls back to the short-range model, also from Google. The runtime comes from `cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest` (an unpinned `latest`). The local fallback `/mediapipe/blaze_face_short_range.tflite` **does not exist** (`public/mediapipe/` holds only `.gitkeep`).
- **Risk:** with no internet at the defence the live face detector fails; a new `latest` release could break it without any change here.
- **Fixed now:** the runtime is pinned to `0.10.35` (the installed version) and the first model address is the existing `blaze_face_full_range` file. Checked: the page shows "Detector: READY • Model: Full Range", no 404.
- **Decision (open):** make it work **offline** by copying the runtime (`node_modules/@mediapipe/tasks-vision/wasm`, about 22 MB for the two files actually used) and the model (a few hundred KB) into `public/mediapipe/`. It makes the repository and the deployed folder about 22 MB larger. Recommended before the defence if the venue's internet is not certain.
- **Evidence:** `CRAWL-user/dashboard/live-enhancement`. **Files:** `LiveEnhancementPanel.tsx`.

### BE-001 Login identifier has no length limit — Minor — Open (Ijaz)
- **Steps:** `POST /api/auth/login/` with `{"identifier": "a" x 300000, "password": "x"}`.
- **Expected:** `400` ("too long").
- **Actual:** `500`. The server log says `sqlite3.OperationalError: LIKE or GLOB pattern too complex`. PostgreSQL (production) does not use `LIKE` for this, so it would not crash there, but nothing stops a very large string from being processed.
- **Fix idea:** cap `identifier` (and other free-text login fields) at 254 characters in the serializer, and `password` at a sensible maximum.
- **Evidence:** `SEC-11`.

### BE-002 Unknown API address answers HTML — Minor — Open (Ijaz)
- **Steps:** `GET /api/images/abc/` (a path that matches no route, because the route expects a number).
- **Expected:** `404` with JSON, like every other API error.
- **Actual:** `404` with an HTML page (Django's). Clients that always parse JSON break; the website now turns this into a sentence, but other clients will not.
- **Fix idea:** a JSON 404 (and 500) handler for paths that start with `/api/`.
- **Evidence:** `SEC-10 /api/images/abc/`.

### BE-003 Health check is slow when a service is down — Minor — Open (Ijaz)
- **Steps:** stop Redis, open Admin, System Monitoring.
- **Actual:** `GET /api/system/health/` takes 6 to 18 seconds before answering `503` (the checks wait for their timeouts one after another), so the page shows "Loading" that long, and the admin bell asks for the same endpoint.
- **Fix idea:** short timeouts (1 to 2 s) per check, run the checks in parallel, and cache the answer for a few seconds.
- **Evidence:** measured during the 503 work (`WORK_LOG.md`, 2026-10-22).

### FE-003 Sign-in and register pages: fields not linked to labels — Minor — Fixed
- Email and password inputs had visible labels that were not connected to them (no `for`/`id`), so a screen reader announced "edit text". The pages also had no `h1`.
- **Fix:** `htmlFor`/`id` (and `autoComplete`) on the three sign-in pages and Register; the page heading is now an `h1` (also Forgot password).
- **Evidence:** `A11Y-field /login`, `A11Y-field /register`, `A11Y-h1 ...` (now passing).

### FE-004 Same browser-tab title everywhere — Minor — Fixed
- All 21 pages checked had the title "FaceCloud — AI-Powered Facial Image Enhancement Platform"; browser tabs and history could not be told apart.
- **Fix:** `useDocumentTitle`; every page that has a `PageHeader` (the signed-in pages) and the public pages now set "Page name — FaceCloud".
- **Evidence:** `A11Y-title` (now passing).

### FE-005 Landing page: unnamed submit button — Minor — Fixed
- The round arrow button next to the early-access email box had no accessible name; the box itself had only a placeholder.
- **Fix:** `aria-label` on both (`HeroSection.tsx`). **Evidence:** `A11Y-btn /`.

### FE-006 Broken-image icon for non-picture files — Minor — Fixed
- Multiple upload: a refused `.txt` or fake `.jpg` showed the browser's broken-image icon in the list and in the "picked files" grid.
- **Fix:** a small `Thumb` that falls back to a file icon (`UploadMultipleLive.tsx`). **Evidence:** screenshot `upload-multiple-mixed.png` (before).

### FE-007 A 0-byte file shows "--" — Minor — Fixed
- `formatBytes(0)` returned "--", the text for "unknown". An empty file now reads "0 B", and so does a new account's "stored" figure in the sidebar; "--" stays for a size that is missing (`imageData.ts`).

---

## Notes (not bugs)

- **N-01 A weak first version of my own checks.** The first upload checks passed on the word "image" because the sidebar says "Image Tools". Caught by reading the screenshots, not the green lines. The checks now look for the exact sentences inside the main area. Rule: read the evidence, not only the PASS.
- **N-02 An older known gap is closed.** `WORK_LOG.md` listed "a moderator can promote a member to moderator". On current `origin/main` the API answers `403 "Moderators may only set the normal member role."` (checks `SEC-07`, `SEC-08`).
- **N-03 The repository's own demo photo is refused by the quality check** ("Face too small in the frame": under about 160 px and 6% of the photo). It is fine as a picture on the landing page but should **not** be used as the accepted photo in a live demo.
- **N-04 "kGpuService" console message** appears only in headless Chrome (no GPU); MediaPipe then uses the CPU. Not an app fault, ignored by the crawl.
- **N-07 What Ali's server does today, measured (copy of his settings).** `ENHANCEMENT_RENDER_POLICY` is not set, so it is `lightweight_v1`; the defence demo uses `adaptive_v1`. For brightening and denoising both give the same result; `adaptive_v1` also decides per photo (and answers "original preserved" for a clean one). Only the single-upload screen starts an enhancement by itself; the multiple and ZIP screens use the manual panel; a photo sent to review is enhanced only on request. Test with a dark, noisy or blurred photo; a clean one will (rightly) not change.
- **N-06 `public/hero-portrait.png` is a JPEG with a `.png` name.** The uploader refuses it ("The filename extension does not match the image content"), which is a strict but clear check. Copied as `hero.jpg` it is a handy demo photo: the quality check sends it to **needs review**, so it lands in a moderator's queue (used by `07-flows.mjs`).
- **N-05 Eager mode hides progress.** With `DJANGO_DEBUG=True` and no worker, uploads are processed inside the request, so no progress is shown. Use Redis plus a Celery worker for the demo (see `README.md`).
