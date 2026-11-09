# Prompt for the backend developer (Ijaz): a decision a person made on a photo (reject, or put under review) must reach its owner's screen

Gap BG-16 in `qa/BACKEND_GAPS.md` (the file name says only "reject"; part 2 is the same cause). Copy everything inside the block into the backend session. Found on 2026-11-09 on the owner's own server: the administrator
rejected a photo from the Image Monitoring page, and for its owner it still showed "Completed" and was listed under Accepted (and also under Rejected). The same day the administrator
put a photo under review ("Put under review") and the owner's In review tab stayed empty: the photo is still listed under Accepted (part 2).
The frontend now shows such a photo as rejected itself (`photoStatus` in `src/lib/api/images.ts`, one function, plus a line in `src/pages/user/MyImages.tsx` that leaves it out of the
Accepted tab); both go away when the server says it. Nothing else in the screens changes.

```
Task: one pull request, a small fix with tests. A decision that a PERSON made (a rejection, or putting a photograph under review) must not be softened by rules meant for automatic verdicts. Do not change any existing response key.

What is seen (the owner's local database, photograph 280, owner username "usernew", organization 8 which is a personal workspace, QUALITY_CHECKS_REJECT not set in .env = False)
   - POST /api/system/images/280/decision/ {"action": "reject", "reason": "..."} -> 200, quality decision becomes "rejected" (operations/image_decision.py).
   - GET /api/images/my/ then says display_status "completed" (the latest enhancement's status), quality_decision.decision "rejected",
     quality_decision.effective_decision "accepted".
   - GET /api/images/my/?status=accepted lists it; GET /api/images/my/?status=rejected lists it too. One photograph, in both lists.

Why (read in the code)
   - uploads/display_status.py: `if quality.decision == "rejected" and settings.QUALITY_CHECKS_REJECT: return "rejected"`. With the setting off (the default: a quality CHECK never
     refuses a photograph) a stored "rejected" is skipped, and the word comes from the latest enhancement result.
   - quality_control/effective.py `effective_decision` / `review_required`: with the setting off a stored "rejected" is turned into "needs_review", and in a personal workspace that is "accepted".
     The docstring says "rejected is never softened here", the code does soften it. The same rule is written as a database condition in `effective_q`, which the `accepted` and `needs_review`
     filters use, while the `rejected` filter in uploads/views.py (`Q(status="rejected") | Q(quality_decision__decision="rejected")`) does not use it.
   - The softening exists for rows from before quality checks stopped refusing photographs (the comment says so). It cannot tell those from a rejection that an administrator
     (operations/image_decision.py, `apply_quality_verdict`) or a moderator (moderation/services.py `decide_review`) made on purpose, so a human decision is discarded too. In a team, by the code (not probed), the same
     happens to a moderator's rejection: the stored decision is "rejected" and `moderator_can_decide` makes the word "needs_review", so the owner sees "In review".

Change
   1. Remember who decided. Either a field on ImageQualityDecision (for example `decided_by_person`, default False, set True by `apply_quality_verdict` and by `decide_review` when the
      action is a rejection or an approval) or, if a migration is unwelcome, derive it from a decided ModeratorReview / the admin_image_decided event. A migration with a default is fine.
   2. `effective_decision`, `review_required`, `image_display_status` and `effective_q` treat a rejected decision with `decided_by_person` as "rejected" whatever QUALITY_CHECKS_REJECT says.
      An automatic "rejected" row from before the setting existed keeps being softened, as today.
   3. `image_display_status` returns "rejected" for it, before it falls through to the latest enhancement result.
   4. `status=accepted` and `status=needs_review` must not list it; `status=rejected` must (it already does). Dashboard counts and the progress / batch status use the same helpers, so
      they follow.
   5. Tests: admin rejects a photograph that was accepted and enhanced, QUALITY_CHECKS_REJECT False, personal workspace -> display_status "rejected", listed under rejected only, not under accepted;
      the same for a moderator's rejection in a team (today "needs_review"); an approval afterwards puts it back to accepted/completed; an automatic stored "rejected" with the setting off is still softened.

Part 2: "Put under review" on a photograph in a personal workspace (same cause, same marker)
   What is seen (owner's local database, photograph 271 of the same owner; probed again on a throwaway copy of origin/main):
   - POST /api/system/images/271/decision/ {"action": "keep_in_review"} -> 200, event admin_image_decided {"previous_decision": "accepted", "decision": "needs_review", "review_id": null}.
   - The owner's GET /api/images/my/ then gives display_status "completed", quality_decision.decision "needs_review", effective_decision "accepted";
     ?status=needs_review does not list it, ?status=accepted does. The In review tab of the app is empty, and nothing tells the owner the photograph is held.
   Why: quality_control/effective.py makes a stored needs_review "accepted" wherever `moderator_can_decide` is false (a personal workspace), because "nobody can ever decide it". That was true
   when only moderators could decide; an administrator now can (operations/image_decision.py, which handles exactly this case: no review, personal workspace). The same photographs are the 26 or so
   that the AUTOMATIC checks flagged (needs_review, "a little dark") in other personal workspaces; those must keep reading as accepted with tips, so the rule has to know who decided.
   Change: with the marker from part 1 (decided_by_person, set by `keep_in_review` too), a needs_review decision made by a person in a personal workspace is effective "needs_review" (it waits for an
   administrator), the status word is "needs_review" (before the latest enhancement result is consulted), `?status=needs_review` lists it and `?status=accepted` does not. Automatic needs_review in a personal
   workspace stays "accepted". Tests: admin keep_in_review on a personal photograph -> needs_review in the word, in the needs_review list, not in accepted; admin approve afterwards -> accepted again;
   an automatically flagged personal photograph is unchanged. If the answer is "no: a personal workspace is never held", say so, and the console should not offer "Put under review" for a personal photograph
   (the frontend can hide the button once the admin photo call says whether the workspace is personal: it carries `organization_id` today, not that; an additive `organization_is_personal` would do).
   Frontend afterwards: nothing to change for the list or the badge (they follow `display_status` and `?status=`); `photoStatus` and the Accepted-tab line in `MyImages.tsx` go as in part 1.

Do not change: the audit event, the 409 rules of the decision call, the owner's notification, what the enhancement pipeline does after an approval.
```
