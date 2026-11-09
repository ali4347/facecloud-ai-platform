# Prompt for the backend developer (Ijaz): enhance a photo BEFORE it is grouped into person folders

> **Closed 2026-11-04.** Done by the backend (PR #120, `feat/enhance-before-grouping`): the batch progress carries `stage_order` with enhancement before the person folders, and the frontend follows it. Kept for the record; do not send it.

Copy everything inside the block into the backend session. The frontend is already ready for this: it shows the stages in the order the server
sends in a new `stage_order` field of the batch progress (and falls back to its own order, the current one, while the field is absent), so the two
can be deployed in either order. Nothing in the frontend changes when this lands.

```
Task: change the order of two stages of the per-photo pipeline. One pull request. Every change needs a test, and the PR description must show how to see it work (the commands at the end). Do not change what any stage does, only when it starts. Do not change the stage KEY names, the `display_status` values, or the API of any other endpoint.

Today:   uploaded -> queued -> preprocessing -> face_validation -> quality_analysis -> identity_grouping (person folders) -> enhancement -> finalizing -> completed
Wanted:  uploaded -> queued -> preprocessing -> face_validation -> quality_analysis -> enhancement -> identity_grouping (person folders) -> finalizing -> completed

What the code does now (read at e2cd7f5; check it, I may have missed a caller):
  - quality_control/services.py, process_quality_decision(): after the verdict is saved it calls identities.verdict.group_after_verdict(...) and THEN enhancement.auto.enhance_after_verdict(...), in the same transaction. So grouping is queued first (confirm what that means with CELERY_TASK_ALWAYS_EAGER on, probably it runs first; with a worker the two run side by side).
  - moderation/services.py, decide_review(), action "approve": the same two calls in the same order (an approved team photo is grouped and enhanced then).
  - uploads/services.py, preprocess_image() (a retry or re-analysis of an already decided photo): calls enhance_after_verdict only.
  - uploads/progress.py: STAGE_PROGRESS has identity_grouping 75 and enhancement 95, and _state_for_image() looks at the identity analysis before the enhancement. uploads/models.py STAGE_CHOICES already lists enhancement before identity_grouping, so only the progress numbers and the precedence say otherwise.
  - identities embed preprocessing.processed_file (the standardised ORIGINAL), never the enhanced file.

What to build:
1. Order. After a quality verdict that allows it (accepted; needs_review in a personal workspace; a moderator's approval), start the AUTOMATIC enhancement first. Queue the identity analysis when that photo's automatic enhancement reaches an end state: completed (any outcome, including original_preserved), failed, cancelled, or skipped (capacity, the person or the operator switched it off, rejected). If no automatic enhancement will happen for the photo (UploadBatch.auto_enhance false, AUTO_ENHANCEMENT_ENABLED off, verdict rejected), grouping starts at once, as today. Grouping keeps its own eligibility rules untouched (consent, face check, IDENTITY_AUTO_ANALYZE, the verdict table in identities/verdict.py).
2. Where. Give the identity side one entry point (reuse group_after_verdict, or add group_when_enhancement_ends(image)) and call it from every place an automatic enhancement ends: enhancement/tasks.py (_publish_outcome, _fail_if_unfinished and the cancel paths), enhancement/auto.py (_skip, _record_failure_to_start, and the capacity-wait path). The call must be idempotent and must never raise into the enhancement code. A person's OWN enhancement request (POST /api/enhancements/images/{id}/) must neither delay nor trigger grouping; only the AutoEnhancement record gates it.
3. The grouping input does not change: it still reads the standardised original, never the enhanced file, so an enhancement can never change who a face is grouped with. Say so in a code comment and test it (an enhanced result that is a different picture must not change the embedding that is stored).
4. Never ungrouped forever. If an enhancement task is lost (worker died), the existing stuck-job reaper must release the grouping too, and a maximum wait (a setting, default = the enhancement time limit plus a margin) queues the grouping anyway.
5. No gap. The identity analysis row must be created (queued) in the SAME transaction in which the enhancement reaches its end state, so the progress never shows a finished photo between the two stages.
6. Progress (uploads/progress.py): STAGE_PROGRESS enhancement 75 and identity_grouping 95 (still increasing); _state_for_image() looks at the enhancement first and reports identity_grouping only after it; grouping_status() gets waiting_for "enhancement" while the photo waits. Add "stage_order": the list of the nine stage keys, in the new order, to the batch progress payload and to the OpenAPI schema (the frontend uses it when it names all nine stages). Photos that are already in flight when this is deployed (an identity analysis that exists before any enhancement result) must still show a sensible stage: derive from the data, no migration, no schema change expected.
7. Batch level: the batch's stage, progress_percentage, final status and the "N photos enhanced" notification (enhancement.auto.notify_batch_if_finished) must wait until grouping has also ended, otherwise a batch is reported finished while folders are still being made.
8. Team photos: both stages still wait for the moderator; after "approve" it is enhancement first, then grouping. A rejected photo gets neither (unchanged), and a moderator's rejection still removes it from folders.
9. Docs: docs/FRONTEND_API_GUIDE.md (stage list, stage_order, the new percentages), docs/enhancement/*, docs/FEATURES.md and the README wherever the order is written.

Tests: grouping starts only after an automatic enhancement completes / fails / is cancelled / is skipped for capacity; it starts at once when auto-enhance is off for the batch, for the account, or by AUTO_ENHANCEMENT_ENABLED=False; a rejected photo is neither enhanced nor grouped; a personal-workspace needs_review photo goes enhancement then grouping; a team photo waits for the moderator and then goes enhancement then grouping; a person's own enhancement request does not delay or trigger grouping; the identity analysis exists in the same transaction as the end of the enhancement (no instant at which neither is pending); a lost enhancement is released by the reaper and by the maximum wait; calling the hook twice changes nothing; the stored embedding is the same whether or not the photo was enhanced; progress percentages never go down across the whole life of a photo; stage_order is in the schema and has all nine keys; consent missing -> enhancement runs and grouping reports "consent required" as today.

How to see it work (put these in the PR description):
  TOKEN=$(curl -s -X POST localhost:8000/api/auth/login/ -H 'content-type: application/json' -d '{"identifier":"<email>","password":"<password>"}' | python -c 'import sys,json;print(json.load(sys.stdin)["access"])')
  # start a worker so the stages are visible: CELERY_TASK_ALWAYS_EAGER=False, then upload one photo and poll
  curl -s -F file=@photo.jpg localhost:8000/api/images/upload/single/ -H "Authorization: Bearer $TOKEN"        # note the batch id
  curl -s localhost:8000/api/images/batches/<id>/progress/ -H "Authorization: Bearer $TOKEN" | python -m json.tool   # "stage_order", then stage: enhancement (75) before identity_grouping (95)
Then open the upload screen and the Processing page in the frontend: the stages light up in the new order.
```
