# Prompt for the backend developer (Ijaz): a contract the frontend can rely on (state fields, response schemas, error codes, a change log)

Gaps BG-04, BG-05 and BG-13 in `qa/BACKEND_GAPS.md`. Copy everything inside the block into the backend session. Everything is additive: no field is removed
or renamed, so nothing in the running frontend breaks. The reason it matters is evidence, not taste: the frontend drifted from the backend three times in
two weeks for want of this (a `completed` status read as "not accepted", a `lighting` object whose shape differed from the agreed one, `applied_stages`
with `stage: null` that crashed the image screen).

```
Task: four small, additive changes to the API contract. One pull request, or four, your choice. Every change needs a test; the OpenAPI schema stays valid with zero warnings.

1. Separate the questions that display_status answers with one word.
   Today (uploads/display_status.py) display_status is the quality verdict until an enhancement exists, and then the enhancement's own status ("completed", "processing", "failed" ...). So a photo that passed and was enhanced reads "completed", a personal-workspace photo the checks were unsure about also reads "completed", and a screen that only knows "accepted" shows the wrong sentence.
   Add, next to display_status (which stays exactly as it is, for compatibility), on every row that carries it: the MyImage and ImageUpload serializers, the batch progress rows, the album, memory, event and search rows, the moderator and administrator image rows:
     - verdict: "accepted" | "needs_review" | "rejected" | "processing" | "failed". The person-facing quality verdict, with the personal-workspace rule already applied (quality_control/effective.py effective_decision: a doubted photo in a workspace with no moderator is "accepted"); "processing" while the checks have not finished.
     - enhancement_status: "none" | "pending" | "queued" | "processing" | "completed" | "partial" | "failed" | "cancelled" | "skipped" (skipped: switched off, capacity, refused).
     - grouping_status: the existing grouping_status() values ("not_applicable", "queued", "processing", "completed", "needs_review", "failed", "cancelled", "skipped") so a screen can say "not filed yet" without inferring it from an empty list.
   Document the precedence that builds display_status from them in docs/FRONTEND_API_GUIDE.md, and mark display_status "kept for compatibility".
   Tests: one parametrised test per state (accepted+enhanced, personal unsure, team unsure waiting for a moderator, rejected at upload, rejected by quality, enhancement failed, grouping waiting) asserting the three fields and that display_status is unchanged from today's value.

2. Describe every JSON answer in the OpenAPI schema.
   44 operations answer JSON with no schema (Appendix A, generated from the schema at ab89092). A client generator produces `unknown` for all of them. Give each an @extend_schema response (a serializer, or inline_serializer for small ones) that matches what the view really returns today; do not change the answers. Where an endpoint answers different shapes by case (the advisor's runs, the exports), describe each with OneOf or separate named schemas.
   Add a test that walks the schema and fails when a 2xx response that has a body has no described shape (an allow-list of exceptions, each with a reason, is acceptable and must start empty or short).
   Priority if time is short (they are the ones screens read): GET /api/privacy/consents/, GET /api/privacy/facial-data/, GET /api/system/health/, /queue/, /moderation/, /audit/, /jobs/failed/, GET /api/notifications/unread-count/, GET /api/memories/{id}/, GET /api/shares/public/{token}/info/, GET /api/enhancements/advisor/configuration/ and /consent/, POST /api/enhancements/advisor/runs/, POST .../recommendations/{id}/apply/, the registration, password and invitation calls.

3. One table of machine-readable error codes.
   Some refusals carry {"code": ...} (consent_required, advisor_consent_required, advisor_unavailable, semantic_search_unavailable, token_not_valid), others only a sentence. In docs/API_ERRORS.md list every code, its HTTP status, the endpoints that can answer it and what a screen should do; declare each in the OpenAPI responses of its endpoints (extend_schema). Where a refusal a screen must react to has no code (an upload refused for a reason, a photo "still processing" when moving it to the trash, a 429 with its wait), add one without changing the sentence or the status.

4. Optional: make the refresh answers uniform.
   A revoked refresh token answers 400 {"detail": ["This token has been revoked."]}, a garbage one 401. Answer 401 with code token_not_valid for both (the frontend treats both as "sign in again", so this is hygiene).

5. A change log the frontend can read.
   docs/API_CHANGELOG.md: one dated line per change that touches a field, an enum, a status code or a default (for example "2026-11-03 result.lighting: {detected, exposure, scene_median, brightened}"; "2026-11-0x stage_order added to the batch progress"). The pull-request template gets a checkbox "API change? changelog line added". This is what would have caught the three drifts above.

Acceptance: a developer can generate typed clients for the whole schema with no `unknown` for a body (check with openapi-typescript or equivalent and attach the command); display_status values are byte-identical to before for every existing test; the schema is valid with zero warnings; the new test that rejects an undescribed response passes.

Out of scope: any behaviour change.

How to see it work:
  curl -s localhost:8000/api/images/my/ -H "Authorization: Bearer $TOKEN" | python -m json.tool | head -60      # verdict, enhancement_status, grouping_status beside display_status
  python manage.py spectacular --validate --fail-on-warn --file /tmp/schema.yml && npx openapi-typescript /tmp/schema.yml -o /tmp/api.d.ts && grep -c "unknown" /tmp/api.d.ts
```

## Appendix A: operations whose JSON answer has no described shape (schema of 2026-11-04)

```
DELETE /api/privacy/facial-data/                       POST /api/auth/register/
GET    /api/auth/registrations/{registration_id}/status/   POST /api/auth/verify-email/
GET    /api/auth/verify-email/change/{uidb64}/{token}/ POST /api/auth/verify-email/resend/
GET    /api/enhancements/advisor/configuration/        POST /api/camera/sessions/{session_id}/snapshots/
GET    /api/enhancements/advisor/consent/              POST /api/downloads/batches/{batch_id}/packages/
GET    /api/memories/{memory_id}/                      POST /api/downloads/packages/{id}/regenerate/
GET    /api/notifications/unread-count/                POST /api/enhancements/advisor/consent/
GET    /api/privacy/audit/                             POST /api/enhancements/advisor/recommendations/{id}/apply/
GET    /api/privacy/consents/                          POST /api/enhancements/advisor/runs/
GET    /api/privacy/export/                            POST /api/identities/exports/{id}/regenerate/
GET    /api/privacy/facial-data/                       POST /api/identities/groups/{group_id}/exports/
GET    /api/shares/public/{token}/info/                POST /api/identities/groups/{id}/merge/
GET    /api/system/audit/                              POST /api/images/batches/{batch_id}/cancel/
GET    /api/system/health/                             POST /api/images/batches/{batch_id}/retry/
GET    /api/system/jobs/failed/                        POST /api/notifications/mark-all-read/
GET    /api/system/moderation/                         POST /api/organizations/{organization_id}/moderator/identity-groups/merge/
GET    /api/system/queue/                              POST /api/organizations/{organization_id}/moderator/reviews/{review_id}/merge-identity-groups/
POST   /api/auth/invitations/accept/                   POST /api/privacy/consents/
POST   /api/auth/password-reset/                       POST /api/reports/batches/{batch_id}/
POST   /api/auth/password-reset/confirm/               POST /api/reports/images/{image_id}/
POST   /api/user/change-password/                      POST /api/reports/{id}/regenerate/
POST   /api/user/logout-all/                           POST /api/system/batches/{batch_id}/retry/
```
