# Prompt for the backend developer (Ijaz): the six backend bugs found by QA

Copy everything inside the block into the backend session. The ids (BE-001 to BE-006) match `BUGS.md`.
After the pull request is merged, run `bash qa/start-test-stack.sh` and the scripts again (`QA_REPORT.md`).

```
Task: six fixes found by QA. One pull request, small and additive. Every fix needs a test, and the PR description must show how to see it work (the commands at the end). Do not change any other endpoint, field name or status value. Report the full test suite result.

Order: BE-004 and BE-005 first (the defence rehearsals hit them first), then BE-006, then the rest.

BE-004 (major) - the administrator's organization list is limited to 30 reads an hour.
File: organizations/views.py, class AdminOrganizationListCreateView. It sets throttle_scope = "org_invite" (30/hour) for BOTH the list (GET) and the create (POST). The administrator's Organizations, Moderators and Invitations screens and the "add account" form on the Users screen all read this list each time they open, so after 15 to 30 uses in an hour the administrator is refused with
  429 {"detail": "Request was throttled. Expected available in 3405 seconds."}
for almost an hour, and four screens stop working. The limit was meant for creating, not reading.
Fix: apply org_invite to POST only (a throttle_scope property that returns "org_invite" for POST and None for GET, the way OrganizationLogoView does it). GET stays under the normal per-user allowance.
Test: an administrator calls GET /api/organizations/admin/ 60 times in a row and never gets 429; the 31st POST (create) in an hour does get 429.

BE-005 (major) - the defence demo's dark photo is refused, so low-light enhancement cannot be shown.
scripts/seed_demo.py --dark (used by scripts/defense_demo.sh) darkens a photo to x0.25 (brightness about 18 to 25). The quality check now refuses that ("severe_underexposure", "contrast_too_low"), a refused photo is never enhanced, and the script then stops at queued.json()['id'] because POST /api/enhancements/images/{id}/ answers 400.
Measured on a clean portrait of brightness 71 (lossless PNG, the same with the adaptive_v1 and the default policy): x0.60 needs nothing (original kept), x0.50 is brightened 35 to 67, x0.40 is brightened 28 to 56, x0.35 and darker is refused.
Fix:
 (a) seed_demo.py darkens to x0.40, prints the verdict and the reasons of a refused photo and carries on instead of crashing; docs/demo/defense-demo.md and docs/DEFENSE_DATA_AND_LOGS_GUIDE.md say x0.40.
 (b) The roadmap item "refuse only a completely dark photo": a dark photo should get a warning and go to low-light enhancement; refuse only when there is no usable signal (for example mean brightness under about 6 or almost no contrast). Keep the other rejection reasons as they are. Update the quality docs and the reason wording.
Test: the demo's dark photo is accepted and its mean brightness at least doubles after automatic enhancement; a fully black image is still refused; a clean photo is still left alone.

BE-006 (major) - reviews are created in personal workspaces, where nobody can decide them.
When a person with no team uploads a photo the quality check is unsure about, a ModeratorReview is created in their personal workspace (is_personal), which has no moderator. It stays pending for ever: it is listed under organizations_needing_attention in GET /api/system/moderation/ (four personal workspaces after four such uploads in QA), counted in totals.pending and totals.unassigned, and later in overdue and stale_open. The person was also told a moderator would look at it.
Fix:
 (a) do not create a review (quality, duplicate or identity) when the photo's organization is a personal workspace; the owner decides, and the photo stays usable (enhancement and grouping already allow an unsure photo there);
 (b) leave personal workspaces out of /api/system/moderation/ and out of the moderator dashboard figures;
 (c) a management command close_personal_reviews (dry run by default, --apply to change) that closes the pending reviews that already exist, with the reason "No moderator in a personal workspace" and no deciding moderator (decided_by stays null).
Test: a personal upload makes no review row; a team upload does; the overview excludes personal workspaces; the command is safe to run twice.

BE-001 (minor) - the login identifier has no length limit.
POST /api/auth/login/ with {"identifier": "a" * 300000, "password": "x"} answers HTTP 500 on SQLite (server log: sqlite3.OperationalError: LIKE or GLOB pattern too complex). PostgreSQL does not crash, but nothing stops a huge string from being processed.
Fix: in the login serializer (and the other public auth serializers that take an identifier or an email: password reset, registration, invitation) cap identifier/email at 254 characters and password at a sensible maximum (for example 1024). Answer 400 with a plain sentence.
Test: a 300,000-character identifier answers 400, not 500; a normal login still works.

BE-002 (minor) - an unknown address under /api/ answers an HTML page.
GET /api/images/abc/ (a path that matches no route because the route expects a number) answers 404 with Django's HTML page. Every other API error is JSON.
Fix: handler404 and handler500 in config/urls.py that answer JSON ({"detail": "Not found."} and {"detail": "Server error."}) when the path starts with /api/, and keep the normal HTML for every other path (the Django admin, static files).
Test: GET /api/images/abc/ answers 404 with content type application/json; GET /no-such-page/ is unchanged; a view that raises still answers JSON 500 for an /api/ path (DEBUG off in the test).

BE-003 (minor) - the health check is slow when a service is down.
GET /api/system/health/ takes 6 to 18 seconds when Redis is down, because the checks wait for their timeouts one after another (the Celery inspection alone waits about 6 seconds). The administrator's System Monitoring page and the admin bell both call it, so the page shows "Loading" that long.
Fix: give each check a short timeout (1 to 2 seconds), run the checks in parallel (a thread pool is enough), and cache the whole answer for 5 seconds. Keep the answer's shape and the 503-with-the-full-list behaviour exactly as they are.
Test: with the Redis connection pointed at a closed port the endpoint answers 503 with all seven services listed in under 4 seconds; with everything up it answers 200.

How to see each fix (put these in the PR description; $ADMIN is an administrator's access token):
  BE-004: for i in $(seq 1 60); do curl -s -o /dev/null -w "%{http_code} " -H "Authorization: Bearer $ADMIN" http://127.0.0.1:8000/api/organizations/admin/; done        # all 200
  BE-005: python scripts/seed_demo.py --photo <a portrait> --dark                                                                                                    # accepted, brightened, no crash
  BE-006: sign up a person with no team, upload a photo the checks are unsure about, then GET /api/system/moderation/                                                  # no personal workspace in organizations_needing_attention
  BE-001: curl -s -o /dev/null -w "%{http_code}\n" -X POST -H "Content-Type: application/json" -d "{\"identifier\":\"$(head -c 300000 /dev/zero | tr '\0' a)\",\"password\":\"x\"}" http://127.0.0.1:8000/api/auth/login/      # 400
  BE-002: curl -si http://127.0.0.1:8000/api/images/abc/ | head -5                                                                                                   # 404, application/json
  BE-003: time curl -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer $ADMIN" http://127.0.0.1:8000/api/system/health/                                    # with Redis stopped: 503 in under 4 s
```
