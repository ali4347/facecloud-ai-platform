# FaceCloud QA

Automated and written checks for the whole product. Everything here runs against a **throwaway copy** of the backend,
never against your own servers (5173 / 8000) or your own database. The only exception is `02-public-smoke.mjs`, which can
be pointed at a site that is already running; it never signs in and never creates anything.

| File | What it is |
|---|---|
| `TEST_PLAN.md` | What is tested, how, on which accounts, and what is **not** covered yet |
| `BUGS.md` | Every bug found: steps, expected, actual, severity, status, who fixes it |
| `BACKEND_GAPS.md` | **Start here for the backend:** the register of what is still missing (BG-01 to BG-14), how each was found, the six old backend bugs that are now closed, the decisions that belong to the owner, and the order to send the prompts in |
| `PROMPT_FOR_BACKEND.md` | Closed: the prompt for the six backend bugs of the first QA pass (BE-001 to BE-006), all fixed by the backend since |
| `PROMPT_FOR_BACKEND_ADMIN_IMAGES.md` | The prompt for the backend developer for the administrator's Accept / Under review / Reject on a photo (new call) and an optional `ordering` parameter on the photo list |
| `PROMPT_FOR_BACKEND_PIPELINE_ORDER.md` | Closed: enhancing a photo before it is grouped (the backend did it in PR #120; the frontend follows its `stage_order`) |
| `PROMPT_FOR_BACKEND_DEPLOYMENT.md` | Run the deployment on the real host and prove it: services, HTTPS and CORS, upload limits through nginx, preview endpoints, the operator switches that leave features dark, smoke tests, backup and restore, a small load check, a hand-over note |
| `PROMPT_FOR_BACKEND_LIGHTING.md` | Let the person choose the dark-photo or the light-photo method: the request and upload field, the behaviour, `used` / `forced` in the result |
| `PROMPT_FOR_BACKEND_UPSCALE.md` | An "enlarge" slider in the editor (Real-ESRGAN x2, 0 to 100 as the share of the model over a plain enlargement), a "make HD" choice (short edge 1080 px), limits for a small GPU, a close-up of the enlarged face in the preview, a background save, the face check, and measured numbers |
| `PROMPT_FOR_BACKEND_API_CONTRACT.md` | A contract the frontend can rely on: explicit verdict / enhancement / grouping fields beside `display_status`, a described shape for 44 undescribed answers, one table of error codes, an API change log |
| `PROMPT_FOR_BACKEND_RISKS.md` | The prompt for the backend developer for the pipeline's four risks: speed and a worker, the three switched-off models, identity drift, and an untested demonstration set |
| `QA_REPORT.md` | The summary of the latest pass: numbers, risks for the defence, recommendations |
| `start-test-stack.sh` / `stop-test-stack.sh` | One command up / down: backend copy from `origin/main`, test data, website, headless Chrome |
| `seed.py` | The test accounts (see below) |
| `lib.mjs` | Helpers: a headless Chrome tab over the DevTools protocol, API calls, PASS/FAIL logging |
| `scripts/` | The checks, one file per area |
| `out/` | Screenshots and `results.jsonl` from the last run (not committed) |

## Run it

```bash
bash qa/start-test-stack.sh                       # prints the addresses; takes about a minute
source "${TMPDIR:-/tmp}/facecloud-qa/env.sh"      # tells the scripts where the stack is
node qa/scripts/03-auth.mjs                       # any script on its own (08-limits.mjs last, it uses up an hourly allowance)
node qa/scripts/01-crawl.mjs user                 # the crawl takes an optional portal: public | user | admin | moderator
bash qa/stop-test-stack.sh                        # stops it and deletes the copy
```

Needs: Node 20+, Google Chrome, the backend folder with its `.venv` (default `~/Projects/FaceCloud_backend`, change with
`QA_BACKEND`), `zip` (the ZIP checks). Ports default to 8840 (API), 5240 (website), 9410 (Chrome); change them with
`QA_API_PORT`, `QA_WEB_PORT`, `QA_CDP_PORT`. `QA_REF` picks another backend branch (default `origin/main`). `QA_ORG_INVITE_RATE=1000/hour` raises the organization-list limit (BE-004); `QA_EXTRA_ENV="A=1 B=False"` sets extra backend settings, for trying a configuration (the stack already reads the backend's own `.env`).

## The scripts

| Script | Covers |
|---|---|
| `01-crawl.mjs` | Every page of every portal, signed in as the right person, at desktop and 390 px phone width: crashes, console errors, failed requests, blank pages, demo-data banners, pages wider than the screen |
| `02-public-smoke.mjs` | Public pages, sign-in guards, empty forms, API reachability. Safe on a running site: `QA_WEB=http://localhost:5173 QA_API=http://127.0.0.1:8000 node qa/scripts/02-public-smoke.mjs` |
| `03-auth.mjs` | Wrong password, account enumeration, wrong portal, session survival, separate portal sessions, sign-out, spoiled tokens, forgot-password wording |
| `04-api-security.mjs` | Signed-out access, tampered tokens, role gates, other teams' data (404), role escalation, odd input, hostile uploads and ZIPs |
| `05-accessibility.mjs` | Image alt text, unnamed buttons, unlabelled fields, headings, page titles, language |
| `06-upload-ui.mjs` | The three upload screens with good, bad and mixed files: what the person is told |
| `07-flows.mjs` | The main business flow through the real screens, 19 checks: team, moderator, owner uploads a photo that needs review, moderator approves with a message, the owner's bell, an invitation, failed work, moderation overview |
| `10-onboarding.mjs` | How a person arrives: signs up alone (verification email, personal workspace, no team), an unsure photo with no moderator, is invited into a team, signs up from an invitation, and what the administrator's list shows. Reads the development emails from the backend log |
| `09-enhancement.mjs` | Does enhancement enhance? A clean, a dark, a very dark and a noisy portrait through the real upload and automatic enhancement (brightness and grain are measured), then what the screens say, including the editor's Auto. Needs the backend's Python to make and measure the photos |
| `11-editor.mjs` | The photo editor: sliders and preview, reset and double-click reset, hold-to-compare, Save disabled until something changes, how long saving takes, the saved version is full size and brighter, versions list, "Use this", delete asks first and the original is untouched, another person gets 404, signed out gets 401 |
| `12-moderator.mjs` | A moderator's day: the queue and its filter, claim, a second moderator clashing (409, shown in words), reject with a message the member receives, a closed review, deciding twice, escalate (the administrator's overview counts it), keep in review, bulk approve, decision log against the dashboard, audit search, deactivating and reactivating a member |
| `13-settings.mjs` | Settings: password change every wrong way (empty, mismatch, wrong current, too common, same as current) then the right way (signed out, old password and old devices refused), name, device list and Revoke, sign out everywhere, notification switches saved by the server, deleting the account |
| `14-admin-actions.mjs` | The administrator's everyday actions: add a user (short/mismatched/common/taken), add a moderator to a team (full teams cannot be chosen), search, suspend with a confirmation and what the suspended person can still do, an administrator cannot lock themselves out, create/rename/suspend/reactivate a team, invitations (taken, duplicate, resend, cancel, filter), the failed-work and moderation pages, the audit trail. Start the stack with `QA_ORG_INVITE_RATE=1000/hour` (BE-004) |
| `15-resilience.mjs` | Things going wrong around the app, without touching the server: unreachable, an error page, "too many requests", slow, session ended elsewhere, double click (one request), unknown address, wrong portal, keyboard (Escape). Uses Chrome's request interception |
| `16-polish.mjs` | The enhancement engine's "polish" change, from the outside: nine photos (saaf, flat, dark, noisy, blurred and real ones from `QA_REAL_PHOTOS="name=/path,..."`) at four level/style combinations, recorded on the unchanged backend, on the new code with the flag off, and with it on, then `compare before off on`. Proves that with the flag off nothing differs by a pixel, that dark/noisy photos are untouched with it on, and that a polished photo is the same photo (same size, nothing shifted, colour within 3) and measurably sharper. Start each stack with `QA_BACKEND=<clone>` `QA_REF=HEAD` and `QA_EXTRA_ENV="ADAPTIVE_POLISH_ENABLED=True"` |
| `17-upload-limits.mjs` | The photo limits on the upload screens (10 in a batch, 20 inside a ZIP): the Upload Center cards and guidelines, 12 chosen photos cut to 10 with a sentence, a full batch says so, and a ZIP is counted from its table of contents before anything is sent (22 photos refused with the reason, exactly 20 taken and shown as "20 photos inside", 12 taken, a text file in the ZIP not counted, a non-ZIP refused) |
| `18-accept-invitation.mjs` | The page the administrator's emailed account invitation opens (`/accept-invitation`), 35 checks: no token and an invented one, a moderator invitation made on the real admin Invitations screen and read from the emailed link (the console prints it quoted-printable), the facts shown, the token removed from the address bar, differing passwords, a weak password and a taken username (the server's messages under the fields), success with no tokens stored, then the new moderator, user and administrator each signing in at their own portal, a used / expired / cancelled link, an address that got an account meanwhile (409), a failed check with Try again, the working state, 390 px. **Run once per stack**: the server allows 30 invitation requests an hour and this uses about 18 (restart the stack to run it again) |
| `19-duplicates.mjs` | The Duplicates page (`/dashboard/duplicates`), 42 checks: six versions of one portrait (one a byte-for-byte copy) uploaded as `plain@qa.test`, the pairs the check found, the exact match already confirmed and refused a dismissal by the server, the tab and the cards (two photos each, kind of match in words, percentage, buttons), "Not a duplicate" and "Same photo" in place and after a reload (the dismissed pair found under Not duplicates, straight from the server's list; "Look for duplicates again" keeps the decisions), changing one's mind, nothing deleted by deciding, the photo page's notice (decisions, links, the other photo named), the trash step (which copy, nothing chosen, cancel moves nothing, confirm moves exactly one), paging at 10, empty states, an unreachable server with Try again, one photo's matches failing, 390 px. **Run once per stack**: it trashes a photo |
| `20-privacy-audit.mjs` | The administrator's Privacy Audit (`/admin/privacy`), 40 checks: who may read `GET /api/privacy/audit/` (administrator 200; moderator, user and organization owner 403; nobody 401; the real answer holds no personal data), rows added to the throwaway database so the numbers are not zero (requests of several kinds, a failure 40 days old that must not count, unverified erasures, a purge with a key the app has never seen, consent given / withdrawn / on an older version), then the page: the four cards, the plain-words statements, bad news highlighted and listed under "Needs attention", tables with unknown keys, no raw true / false, no personal data on the page, Refresh; then answers rewritten in flight (good posture, no requests, a 403, an unknown outcome and request kind, a nested key), the moderator, the user and nobody signed in turned away, the entry missing from their navigation, 390 px. **Run once per stack**: it adds rows |
| `21-verify-email-change.mjs` | The page a changed email address's link opens (`/verify-email-change/:uid/:token`), 22 checks: two real email changes through the API (the account is then unverified and cannot sign in), the uid and token taken from the backend's mail (it still links to the backend; the owner is changing that) and opened on the frontend route: a garbage link and a real account with a wrong token ("no longer valid", the server's sentence, sign-in and Contact offered, no raw JSON), an unreachable server (not called invalid; Try again then confirms with the same link), a good link (confirmed, exactly one request, the account can sign in, the button leads to /login and the new address signs in), the same link again ("already confirmed"), the 429 after 10 tries (the server's wait, Try again), each state at 390 px in dark and light. **Run once per stack**: it uses the hour's 10 requests on purpose |
| `22-upload-presets.mjs` | Auto / Standard / Pro and the lighting, chosen on the Upload screens and sent WITH the upload, 28 checks: the multipart fields read off the wire and the server's own echo (`auto_enhance_options`) for Auto (nothing sent), Standard, Pro, Dark, Pro + Light, never `auto_enhance=false`; the same through the "+" popup (both pickers fit); the picker's place, radio semantics and Pro note; real enhancement runs: the Auto result ("Auto preset", processing summary, nothing started by the page), Dark photo on a back-lit portrait (the server's sentence and the badge), on a heavily compressed photograph ("changed nothing", an amber badge, never a success badge), Light photo, Pro; Multiple and ZIP carry the fields and the batch panel starts nothing; with the account's automatic enhancement off the manual path sends the same choice; `/dashboard/enhance` redirects. Slow: about 40 minutes on this stack (the enhancement runs inside the upload request). `REAL_ONLY=auto,light` (any of auto, dark, compressed, light, pro) re-runs only those slow cases. Run once per stack |
| `23-admin-image-monitoring.mjs` | The administrator's Image Monitoring, 26 checks: it uploads six photos of its own; the server's ordering read from the API (name in any case, size, date, a 400 for a field it does not allow); each sort on the screen asks for the right `ordering` and shows the server's first page; "Newest first" sends none; the decision buttons are on by themselves; Under review and Reject (reason required; the server's 400 sentence) update the row from the answer with no list request; a photo trashed while its panel is open answers 409 and the dialog shows the server's sentence; the audit page words the decision. **Run once per stack** |
| `08-limits.mjs` | Rate limits that real use could hit. **Run it last**: it uses up an hourly allowance on purpose |

A line starting `PASS` or `FAIL` is printed per check and appended to `out/results.jsonl`. A script exits with a non-zero code
when something fails, so it can be used in CI later.

## Test accounts (password `Qa-Pass-Phrase-2026!`, sign in with the email)

`admin@qa.test` (administrator) · `owner@qa.test`, `mod@qa.test`, `member@qa.test` (team "QA Team") ·
`owner2@qa.test`, `mod2@qa.test`, `member2@qa.test` (team "Other Team") · `plain@qa.test` (no team).

**One difference from a real account (found 2026-11-03):** `seed.py` creates the users directly, and only registration makes a *personal workspace*. So a team
member who uploads without choosing a place sends the photos to **their team** (a `needs_review` verdict then waits for that team's moderator, and the photo is
neither enhanced nor grouped until it decides), while `plain@qa.test` has no organization at all (nobody reviews). A real user with a team uploads into their
own workspace by default. When a check depends on that (a `needs_review` photo in "my own workspace"), use `plain@qa.test`.

## Adding a check

Use `check(id, label, passed, detail)` from `lib.mjs`. Prefer asserting the **sentence the person sees**, scoped to the
page's main area, over a loose word match: a first version of the upload checks passed on the word "image" because the
sidebar says "Image Tools" (see `BUGS.md`, note N-01).
