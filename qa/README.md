# FaceCloud QA

Automated and written checks for the whole product. Everything here runs against a **throwaway copy** of the backend,
never against your own servers (5173 / 8000) or your own database. The only exception is `02-public-smoke.mjs`, which can
be pointed at a site that is already running; it never signs in and never creates anything.

| File | What it is |
|---|---|
| `TEST_PLAN.md` | What is tested, how, on which accounts, and what is **not** covered yet |
| `BUGS.md` | Every bug found: steps, expected, actual, severity, status, who fixes it |
| `PROMPT_FOR_BACKEND.md` | The complete prompt for the backend developer: the six backend bugs, with fixes, tests and how to see each one work |
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
| `08-limits.mjs` | Rate limits that real use could hit. **Run it last**: it uses up an hourly allowance on purpose |

A line starting `PASS` or `FAIL` is printed per check and appended to `out/results.jsonl`. A script exits with a non-zero code
when something fails, so it can be used in CI later.

## Test accounts (password `Qa-Pass-Phrase-2026!`, sign in with the email)

`admin@qa.test` (administrator) · `owner@qa.test`, `mod@qa.test`, `member@qa.test` (team "QA Team") ·
`owner2@qa.test`, `mod2@qa.test`, `member2@qa.test` (team "Other Team") · `plain@qa.test` (no team).

## Adding a check

Use `check(id, label, passed, detail)` from `lib.mjs`. Prefer asserting the **sentence the person sees**, scoped to the
page's main area, over a loose word match: a first version of the upload checks passed on the word "image" because the
sidebar says "Image Tools" (see `BUGS.md`, note N-01).
