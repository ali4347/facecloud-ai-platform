# Prompt for the backend developer (Ijaz): a list of duplicate matches, and decisions that survive a re-check

Gap BG-15 in `qa/BACKEND_GAPS.md`. Copy everything inside the block into the backend session. The frontend page `/dashboard/duplicates` is built and works
against today's API, but it has to rebuild the list of pairs from the per-photo calls, which is slow and cannot find a pair the person has dismissed. It will
switch to the new list when it exists (one function in `src/lib/api/duplicates.ts`, `loadMatchFeed`); nothing else in the screens changes.

```
Task: two small additive changes to the duplicates app. One pull request, tests for each rule. Do not change any existing response key.

1. GET /api/duplicates/matches/   (owner-scoped, same serializer as /api/duplicates/matches/{id}/)
   - Paged (page, page_size; max_page_size as the other lists), ordered newest first (-created_at, -id).
   - Filters: review_status (suspected | confirmed | not_duplicate; 400 with a plain sentence for anything else, like the analyses list does for `decision`),
     match_type (exact | perceptual | face_region), image (matches where that photo is either side).
   - Leave out matches whose source or matched photo is in the trash (the same rule as the detail and review calls).
   Why: there is no way today to list matches. The page reads GET /api/duplicates/results/?decision=needs_review and =duplicate, then asks
   GET /api/duplicates/images/{id}/matches/ for every photo they name (one request per photo, a pair is returned under both of its photos).
   A match the person dismissed drops out of `match_count` and `decision` (_refresh_analysis_summary excludes not_duplicate), so no filter of the analyses
   list leads to it any more; the page can only find dismissed pairs by also looking through the newest photos that have no matches (dozens of requests).

2. A person's decision must survive "find duplicates again"
   Probed on origin/main (c73d682): decide a pair (face_region match id 20: confirmed), then POST /api/duplicates/images/{id}/ {"force": true}. The matches
   involving that photo are deleted (process_duplicate_analysis: DuplicateMatch ... .delete()) and recreated as suspected with new ids (23 suspected, the
   confirmed one is gone). The app's "Find duplicates again" button on a photo sends force=true, so one click silently throws away every decision made on that photo.
   Fix: when a pair is found again with the same (source_image, matched_image, match_type), keep its review_status, reviewed_by and reviewed_at (and its id);
   delete only the pairs that are no longer found. A test: confirm one match and dismiss another, force a re-check, assert both decisions and ids are unchanged.

Do not change: the review rule for an exact match (it is created confirmed and cannot be dismissed), the analysis list, or the throttles.
```
