# Prompt for the backend developer (Ijaz): the administrator's decision on a photo (and an optional sort order)

Copy everything inside the block into the backend session. The frontend (Admin console, Image Monitoring, the photo's details panel) is
already built against the first item and switches its buttons on by itself as soon as the call exists: it asks the server once with
`OPTIONS /api/system/images/{id}/decision/` and keeps Accept / Under review / Reject switched off while that answers 404.

```
Task: two small, additive changes under /api/system/images/ (operations/admin_images.py). One pull request. Every change needs a test, and the PR description must show how to see it work (the commands at the end). Do not change the owner-scoped image endpoints, and do not widen what a moderator or member can do.

1. (needed) POST /api/system/images/{id}/decision/ : an administrator accepts, rejects or puts a photo back under review.

Why: today the administrator can only LOOK at a photo (operations/admin_images.py is read-only). The moderator's decisions need an organization membership with the owner/moderator role (moderation/views.py ModeratorReviewDecisionView, organizations/permissions.py), and they act on a review id, not a photo id, so a platform administrator (who is in no organization) gets 404 on all of them. The administrator needs to settle a photo from the console: an escalated or stuck one, a wrong automatic verdict, a photo in a team nobody moderates.

Request (administrators only: permissions.IsAuthenticated + IsAdminRole, like the other views in the file):
  {"action": "approve" | "reject" | "keep_in_review", "reason": "<=500 characters"}
  - The same three action names the moderator's ModeratorDecisionSerializer already uses, so reuse that serializer or its choices.
  - "reason" is required for "reject" (400 with a sentence if it is empty) and optional otherwise.

Effect:
  - approve -> the photo's quality decision becomes accepted; reject -> rejected, with the reason; keep_in_review -> needs_review.
  - If the photo has an open ModeratorReview, close it as part of the same decision, recording the administrator as the one who decided (reuse decide_review where you can, so the moderator's queue, the decision log and the overview figures stay consistent).
  - After approve, do what the pipeline does after any accepted verdict (enhancement and person grouping). After reject, what it does after a rejection (no enhancement, not put in a person folder, and removed from a folder if it was in one).
  - Tell the owner on approve and reject, with the same in-app notification a moderator's decision sends (the reason is the message). Do not tell them on keep_in_review.
  - Deciding the same thing twice is a 200 with no second notification and no second audit row.
  - Audit: one activity event of type "admin" named "admin_image_decided", naming the image and its owner, the action, the previous decision and the reason, so it appears in /api/system/audit/ next to admin_image_viewed.

Response:
  - 200 with the SAME body as GET /api/system/images/{id}/ (AdminImageDetailSerializer), already showing the new decision in "quality.decision". The frontend replaces its copy of the photo with this body.
  - 400 for an unknown action or a reject without a reason; 404 for an unknown photo (JSON, not an HTML page);
  - 409 (or 400, your choice, with a sentence) for a photo that cannot be decided: one refused at upload (status "rejected", the file was never stored) or one whose quality check has not finished.
  - Do not override OPTIONS: DRF's default 200 for an administrator is how the frontend finds out the call exists.

Tests: an administrator accepts / rejects (with reason) / holds a photo and gets the new decision back; reject without a reason is 400; a member, a moderator and an anonymous caller get 403/401 and nothing changes; an open review is closed and the moderator queue no longer lists it; the owner gets exactly one notification on approve/reject and none on hold, and none on a repeat; an unknown id is a JSON 404; a refused-at-upload photo and an unchecked one are refused; the audit row exists once.

2. (optional) an "ordering" parameter on GET /api/system/images/.

Why: the list is fixed to "-created_at, -pk". The console's sort menu can only order the newest 200 photos itself (the page size limit), so with more photos "largest first" or "A to Z" is right only inside that window.
Add ordering=<field> with a short allowed list: created_at, original_name, file_size, owner__username, quality_decision__sharpness_score, each with an optional leading "-" for descending (and "-pk" always as the last tie-breaker). Any other value is a 400 with a sentence, never a 500. Nulls last for the score. Without the parameter nothing changes. Document it in the OpenAPI parameters next to FILTERS.
Test: each allowed value orders a handful of photos as expected; an unknown value is 400; the default order is unchanged.

How to see it work (put these in the PR description):
  TOKEN=$(curl -s -X POST localhost:8000/api/auth/login/ -H 'content-type: application/json' -d '{"identifier":"<admin email>","password":"<password>"}' | python -c 'import sys,json;print(json.load(sys.stdin)["access"])')
  curl -s -X OPTIONS localhost:8000/api/system/images/1/decision/ -H "Authorization: Bearer $TOKEN" -o /dev/null -w '%{http_code}\n'      # 200
  curl -s -X POST localhost:8000/api/system/images/1/decision/ -H "Authorization: Bearer $TOKEN" -H 'content-type: application/json' -d '{"action":"reject","reason":"Too blurry to use"}'
  curl -s "localhost:8000/api/system/images/?ordering=-file_size&page_size=5" -H "Authorization: Bearer $TOKEN"
Then open the console: Admin, Image Monitoring, Details on a photo: the three buttons are on, and a decision shows up in the row and in the audit log.
```
