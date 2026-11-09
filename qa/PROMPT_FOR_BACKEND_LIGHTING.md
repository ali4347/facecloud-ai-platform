# Prompt for the backend developer (Ijaz): let the person choose the dark-photo or the light-photo method

Gap BG-03 in `qa/BACKEND_GAPS.md`. Copy everything inside the block into the backend session. The frontend is already built against this contract
(a three-way "Lighting: Auto / Dark photo / Light photo" control in the photo page, the live camera panel and the Single, Multiple and ZIP upload screens;
a badge on the result). It sends `lighting` only when the person chooses Dark or Light, and tells the person when the answer does not say it was used, so
nothing breaks while this is missing and it starts working by itself when the server honours the field.

```
Task: add an optional "lighting" choice to the enhancement request and to the upload, and report what was used. One pull request, additive, with tests.

Context (verified at origin/main d072027):
  - A result already carries "lighting": {detected: "dark"|"light", exposure, scene_median, brightened} (enhancement/outcome.py result_lighting, serializers.LightingSerializer). The engine decides on its own.
  - POST /api/enhancements/images/{id}/ takes {level, style} only (EnhancementRequest). Uploads take auto_enhance only. docs/FRONTEND_API_GUIDE.md says "there is no way to force a method yet".
  - Product need: the person knows better than the detector in some cases (a dark scene on purpose, a bright photo that is under-exposed on the face), and the owner wants a visible, honest control.

1. Request
   a. lighting: "auto" | "dark" | "light", optional, default "auto" (today's behaviour, byte-for-byte), on:
      - POST /api/enhancements/images/{image_id}/   (EnhancementRequest)
      - POST /api/enhancements/batches/{batch_id}/   (applies to every photo of the batch)
      - POST /api/enhancements/images/{image_id}/compare/ (optional; if you skip it say so in the PR)
      - the three upload calls (/api/images/upload/single|multiple|zip/) as a form field, stored on the UploadBatch next to auto_enhance and used by the AUTOMATIC enhancement of that batch (so the person does not have to enhance twice: today the frontend has to upload with auto_enhance=false and then call the enhance endpoint to apply a choice, which is the workaround this item removes).
   b. Any other value is a 400 with a sentence, never a 500. The OpenAPI schema lists the enum.

2. Behaviour (the engine, enhancement/adaptive/*, enhancement/services.py)
   - "dark": run the dark-photo method whatever the detector said: brighten the shadows first, then reduce noise. "light": the light-photo method: no brightening, only detail, blur, upscale and polish. "auto": exactly as now.
   - A forced method goes through every existing gate (identity guard, colour, halo, size, face geometry) and the time budget. If the forced method cannot be applied safely, the candidate is refused like any other, the photo is returned as it was or with whatever other operation passed, and the result says so in one plain sentence (for example "Brightening was not safe to apply, so the dark-photo method changed nothing"). It never claims a method ran that did not.
   - Forcing "dark" on a photo the detector calls light may brighten it more than the person expects: cap the lift with the same limits the automatic path uses (no new, looser limits).

3. Result
   - lighting gains two keys and keeps the four it has: {detected, exposure, scene_median, brightened, used: "dark"|"light", forced: boolean}. "used" is the method that ran; "forced" is true when the person chose Dark or Light (false for "auto"). Results made before this change keep their shape (the frontend treats missing used/forced as "not forced, used = detected").
   - enhancement_summary mentions the method when forced ("As you asked, the dark-photo method ...").

4. Caching and idempotency
   - Anything that returns an existing result for "the same request" (the identical-recommendation reuse in the advisor, a repeated enhancement request, the automatic-enhancement record) must include "lighting" in its key, so a "dark" request never returns a result made with "light".
   - A person's own request still does not delay or retrigger anything else (grouping, notifications), as before.

5. Docs: docs/FRONTEND_API_GUIDE.md (the request field, the two new keys, the upload field, "forced" semantics), docs/enhancement/adaptive-engine.md, the OpenAPI text.

Tests: default is unchanged (a request without the field produces the same stages and bytes as before); "dark" on a dark photo, "light" on a light photo (same as auto, forced true); "dark" on a light photo and "light" on a dark photo (the method really differs, and the validators still apply); a refused forced candidate says so and never lies; an unknown value is 400; the upload field is stored on the batch and used by the automatic enhancement; the batch endpoint applies it to every photo; two requests with different lighting never share a result; old results serialise without used/forced; the schema has the enum.

How to see it work (put in the PR description):
  curl -s -X POST localhost:8000/api/enhancements/images/<id>/ -H "Authorization: Bearer $TOKEN" -H 'content-type: application/json' -d '{"style":"natural","lighting":"dark"}'
  curl -s localhost:8000/api/enhancements/results/<result id>/ -H "Authorization: Bearer $TOKEN" | python -m json.tool     # "lighting": {... "used": "dark", "forced": true}
  curl -s -F file=@dark.jpg -F lighting=light localhost:8000/api/images/upload/single/ -H "Authorization: Bearer $TOKEN"   # the automatic enhancement uses it
Then in the frontend: Upload Center > choose "Dark photo" > the result shows "Dark-photo method · chosen by you" and no warning.
```
