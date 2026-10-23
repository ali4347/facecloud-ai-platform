# QA report: 2026-10-22

**Build tested:** frontend `main` at the commit that adds this folder; backend `origin/main` (PRs up to #107) in a throwaway copy
(SQLite, no Celery worker, real AI models). **Also checked read-only:** the running site at `http://localhost:5173` with the
backend at `http://127.0.0.1:8000` (no sign-in, nothing created).

## Result in one table

| Script | Checks | Passed | Failed | Notes |
|---|---|---|---|---|
| 01 crawl (39 pages x desktop + phone) | 103 | 103 | 0 | passes with the hourly allowance available; it failed 3 admin pages when the allowance was used up (BE-004) |
| 02 public smoke, QA site | 20 | 20 | 0 | |
| 02 public smoke, **your running 5173 / 8000** | 20 | 20 | 0 | read-only; your backend is on the new code (242 operations, PR #106/#107 fields present) |
| 03 sign-in and sessions | 17 | 17 | 0 | |
| 04 API security and hostile input | 99 | 97 | 2 | BE-001, BE-002 |
| 05 accessibility | 86 | 86 | 0 | first run: 7 failures, fixed |
| 06 upload screens | 9 | 9 | 0 | first run exposed FE-001 |
| 07 business flows (19 steps) | 19 | 19 | 0 | team, moderator, review with a message, the owner told, invitation |
| 08 rate limits | 3 | 2 | 1 | BE-004 |
| 09 enhancement (real photos, real screens) | 9 | 8 | 1 | BE-005 |
| 10 onboarding (sign-up, invitation, team) | 17 | 16 | 1 | BE-006 |
| 11 photo editor | 18 | 18 | 0 | pass 2 (2026-10-23); led to FE-011 |
| 12 moderator actions | 23 | 23 | 0 | pass 2; led to FE-012 |
| 13 settings and password | 22 | 22 | 0 | pass 3 (2026-10-24); no bug (test mistakes only: wrong refresh address, 400 vs 401) |
| 14 administrator actions | 36 | 36 | 0 | pass 3; led to FE-015 |
| 15 resilience | 17 | 17 | 0 | first run 15/17: FE-013, FE-014 found and fixed |
| **Total (QA stack)** | **498** | **493** | **5** | all five failures are backend: BE-001, BE-002, BE-004, BE-005, BE-006 |

## What was found

**22 bugs** (full detail in `BUGS.md`): 9 major, 13 minor; **15 fixed, 7 open** (all seven are backend; BE-007 is optional). Pass 2 (2026-10-23) added the editor and moderator scripts and two small frontend fixes: **FE-011** (the editor could save a copy without any change) and **FE-012** ("Release" was offered on a review another moderator holds). Pass 3 (2026-10-24) added settings, administrator actions and resilience, and found **FE-013** ("Failed to fetch" shown when the server is unreachable), **FE-014** (a double click sent the request twice) and **FE-015** (suspend used the browser's pop-up).

Fixed here (frontend): **FE-001** a refused file on the single upload screen showed no reason, **FE-002** Live Enhancement used a dead
model address and an unpinned runtime, **FE-003** sign-in/register fields not linked to labels, **FE-004** the same tab title on every
page, **FE-005** an unnamed button, **FE-006** broken-image icons, **FE-008** the same request sent up to 8 times per page (12
calls per moderator page, now 5 to 6).

Also fixed: **FE-007** (a 0-byte file showed "--"). Fixed after Ali's report that enhancement "does nothing": **FE-009** (the screens now say when a photo needed no fixing). Fixed after Ali's question about new users: **FE-010** (a person with no team was promised a moderator who does not exist). Open (all backend): **BE-004**, **BE-005** and **BE-006** (major), **BE-001**, **BE-002**, **BE-003**.

**Confirmed good by tests:**
- The three portals are separate sessions; signing out of one does not sign out another.
- A wrong password and an unknown account give the same sentence; forgot-password gives the same answer for both.
- Every administrator endpoint refuses members, owners, moderators and ordinary users (`403`); another team's data answers `404`; a moderator cannot promote a member or invite a moderator.
- Hostile uploads are refused or cleaned: text renamed `.jpg`, empty file, SVG, `.exe`, a cut-off JPEG, a fake ZIP, a ZIP with a `../../` entry, a ZIP bomb. Odd file names (a path, 300 characters, a right-to-left override, control characters) are stored clean.
- A tampered or truncated token gets `401` JSON; a spoiled refresh token sends the person to sign-in, never a blank page.
- No page crashed, showed demo data while connected, or scrolled sideways on a 390 px phone.
- The whole flow works: the administrator makes a team and a moderator, the owner sends a photo that needs review, the moderator approves with a message, the owner's bell shows it.

## Risks for the defence (10 November), in order

0. **BE-005: the defence demo's own dark photo is refused** (brightness under about 25), so low-light enhancement cannot be shown with `seed_demo.py --dark` / `defense_demo.sh`. Use a photo darkened to about x0.40 of a normal exposure, or a real dim photo (brightness 28 to 45); it is brightened about twofold. Enhancement itself works.
1. **BE-004: the admin screens stop opening after about 15 to 30 uses in an hour** (Organizations, Moderators, Invitations, the add-account form). Until the backend is fixed, add `THROTTLE_RATE_ORG_INVITE=1000/hour` to the backend `.env` and restart it. This is the most likely thing to go wrong during rehearsals.
2. **Live Enhancement needs the internet** (FE-002, decision open). Fix: copy the runtime and model into `public/mediapipe/` (about 22 MB), if the venue's connection is uncertain.
3. **Do not use the repository's demo photo as the "accepted" photo** (face too small). For a photo that goes to a moderator use `public/hero-portrait.png` copied as `hero.jpg`; for an accepted photo use one with a large face.
4. **Start Redis and the Celery worker before the demo**, or uploads show no progress; the system page takes 6 to 18 s when Redis is down (BE-003).
5. **Not automated yet:** enhancement quality, the editor, person folders, moderator reject/assign/bulk/escalate, settings and password change, the Celery path. Re-run them by hand once (checklist below).
6. **SQLite versus PostgreSQL** (BE-001 shows only on SQLite) and **Chrome only** (no Safari, Firefox, real phones).

## Hand-over

**To Ijaz (backend), one small PR:**

```
Task: six fixes found by QA. One PR, additive, with a test each.
BE-004 (major): AdminOrganizationListCreateView sets throttle_scope = "org_invite" (30/hour) for both GET (list) and POST (create). The administrator's Organizations, Moderators, Invitations and Users screens read this list each time they open, so after about 15 to 30 uses an hour they get 429 for almost an hour. Apply org_invite to POST only (a throttle_scope property, like OrganizationLogoView has) and leave GET on the normal user rate. Test: 60 GETs by an administrator never answer 429; the 31st POST in an hour does.
BE-001: POST /api/auth/login/ accepts an identifier of any length; 300,000 characters gives HTTP 500 on SQLite ("LIKE or GLOB pattern too complex"). Cap identifier at 254 characters and password at a sensible maximum in the serializer: answer 400. Test with a 300 KB identifier.
BE-002: an unknown address under /api/ (for example GET /api/images/abc/) answers an HTML 404 page. Add a JSON handler404 and handler500 for paths starting with /api/ ({"detail": "Not found."}). Test: content type is JSON.
BE-005: scripts/seed_demo.py --dark (used by scripts/defense_demo.sh) darkens a photo to x0.25; the quality check now refuses that ("severe_underexposure", brightness about 18), a refused photo is never enhanced, and the script then stops at queued.json()['id'] (the enhancement call answers 400). Measured on a clean portrait of brightness 71: x0.60 needs nothing, x0.50 is brightened 35 to 67, x0.40 is brightened 28 to 56, x0.35 and darker is refused. Fix: (1) seed_demo.py darkens to x0.40, prints the verdict of a refused photo instead of crashing, and docs/demo/defense-demo.md says x0.40; (2) the roadmap item "refuse only a completely dark photo": a dark photo should get a warning and go to low-light enhancement; refuse only when there is no usable signal (for example mean brightness under about 6). Test: the demo's dark photo is accepted and its brightness at least doubles.
BE-006: when a person with no team uploads a photo the quality check is unsure about, a ModeratorReview is created in their personal workspace (is_personal), which has no moderator. It stays pending for ever: it is listed under organizations_needing_attention in GET /api/system/moderation/, counted in totals.pending and unassigned, later in overdue and stale_open, and the person was told a moderator would look at it. Fix: (a) do not create a review (quality, duplicate or identity) when the photo's organization is a personal workspace; the owner decides, and the photo stays usable (enhancement and grouping already allow an unsure photo there); (b) leave personal workspaces out of /api/system/moderation/ and the moderator dashboard figures; (c) a management command close_personal_reviews (dry run by default) that closes the pending reviews that already exist, with the reason "No moderator in a personal workspace" and no deciding moderator; (d) tests: a personal upload makes no review row, a team upload does, the overview excludes personal workspaces, the command is safe to run twice.
BE-003: GET /api/system/health/ takes 6 to 18 seconds when a service (Redis) is down because the checks wait for their timeouts one after another. Use 1 to 2 second timeouts per check, run the checks in parallel, and cache the answer for a few seconds. Test: with Redis unreachable the answer comes in under 4 seconds.
```

**To Ali:** the offline decision in FE-002; add the `.env` line from risk 1 now; re-run `bash qa/start-test-stack.sh` and the scripts before any release; keep `BUGS.md` current.

## Manual checklist for the day before the defence (10 minutes)

1. Redis running (`redis-cli ping` gives `PONG`), backend migrated and restarted, worker running, and `THROTTLE_RATE_ORG_INVITE=1000/hour` set until BE-004 is fixed.
2. Sign in to all three portals in one browser; Admin, System Monitoring: all services green.
3. Upload a photo with a large face (single): accepted, enhanced, before/after shown.
4. Upload `hero-portrait.png` copied as `hero.jpg` to a team: it goes to the moderator.
5. Moderator: open the review, approve with a message; the owner's bell shows the message.
6. Live Enhancement: the camera starts and "Detector: READY".
7. Person Folders: the same person is in one folder.
