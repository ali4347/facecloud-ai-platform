# FaceCloud QA

Automated and written checks for the whole product. Everything here runs against a **throwaway copy** of the backend,
never against your own servers (5173 / 8000) or your own database. The only exception is `02-public-smoke.mjs`, which can
be pointed at a site that is already running; it never signs in and never creates anything.

| File | What it is |
|---|---|
| `TEST_PLAN.md` | What is tested, how, on which accounts, and what is **not** covered yet |
| `BUGS.md` | Every bug found: steps, expected, actual, severity, status, who fixes it |
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
`QA_API_PORT`, `QA_WEB_PORT`, `QA_CDP_PORT`. `QA_REF` picks another backend branch (default `origin/main`).

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
