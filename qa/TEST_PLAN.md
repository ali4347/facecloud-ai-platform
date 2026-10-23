# Test plan

Scope: the FaceCloud web app (React) against the Django API, as the three portals (user, moderator, administrator) and the
public pages. Environment: a copy of `origin/main` with SQLite, eager background jobs (no Celery worker), real AI models,
Google Chrome (headless) at 1440 px and 390 px. Production uses PostgreSQL and Celery; differences are noted in the bugs.

## Risk ranking (what the defence depends on)
1. Sign-in and the three portals stay separate.
2. Upload (single, multiple, ZIP) and what the person is told.
3. Enhancement, the editor, and the person folders.
4. Moderator review and the organization flow.
5. Admin console.
6. Failure states: services down, expired session, bad files.

## Coverage

| Area | Check | Script | Status |
|---|---|---|---|
| Public pages | open, no errors, 404 page, guards | 01, 02 | covered |
| Sign-in | wrong password, enumeration, wrong portal, sessions, sign-out, spoiled token | 03 | covered |
| Roles and permissions | 8 accounts x admin endpoints, other team's data, escalation | 04 | covered |
| Odd input and hostile files | paging limits, injection strings, oversize body, SVG/exe/fake image, path and RTL names, ZIP bomb, zip-slip, fake ZIP | 04 | covered |
| Upload screens | refused files, mixed batch, ZIP | 06 | covered |
| Every page loads | 39 pages x 2 widths | 01 | covered |
| Accessibility basics | alt, names, labels, h1, titles, language | 05 | covered (first screen, not a full audit) |
| Enhancement result quality | clean left alone, dark brightened, noisy smoothed, very dark refused; what the screens say | 09 | covered (blur and face restoration only checked by hand) |
| Editor (sliders, save, versions) | sliders, reset, compare, Save off until changed, save time, full-size version, use/delete, other person 404 | 11 | covered |
| Person folders and grouping | thresholds, merge, rename | backend PR #106 tests + manual | **not automated** |
| Moderator review | approve with a message to the member, the owner is told | 07 | covered |
| Moderator actions | queue filter, claim, clash with a second moderator, reject with message, escalate, keep in review, bulk, decision log, audit, member deactivate/reactivate | 12 | covered (assign and merge folders: manual) |
| Organization flow | create team, owner, moderator seats, owner's sidebar and page, another team cannot see it | 07 | covered |
| Sign-up, verification, invitation to a team, invited sign-up, personal workspace | self sign-up, email link, no-team limits, join, "Submit to", one-step account from an invitation | 10 | covered |
| Invitations, branding, plan limits | send/cancel covered; accept, branding, seats full | 07 (send, cancel) | partly |
| Admin actions | add user/moderator, suspend and activate, team create/rename/suspend/reactivate, invitations, failed work and moderation pages, audit trail | 07, 14 | covered (failed-work Retry needs a failed upload: manual) |
| Notifications and bell | the decision and the moderator's message reach the owner | 07 | partly |
| Rate limits | the admin lists, an ordinary admin read, the wording of a refusal | 08 | covered |
| Settings and password change | every wrong password, the right one, name, devices, sign out everywhere, notification switches, delete account | 13 | covered |
| Resilience | server unreachable, error page, 429, slow, session ended elsewhere, double click, unknown address, wrong portal, Escape | 15 | covered |
| Background worker path | upload with Celery and Redis (progress stages) | manual | **not automated** |
| Other browsers and phones | Safari, Firefox, real devices | | **not covered** |
| Load and speed | many users, large ZIP | | **not covered** |
| Email delivery | real inbox | | **not covered** (development prints emails) |

"Earlier manual runs" means checks done in headless Chrome during development, recorded in `WORK_LOG.md`, but not kept as
scripts. Turning them into scripts is the next QA step.

## Severity
- **Blocker**: the defence demo cannot be shown.
- **Major**: a main flow gives a wrong result or a crash, or data is exposed.
- **Minor**: wrong wording, layout, small accessibility gap.
- **Note**: not a bug, but worth knowing.
