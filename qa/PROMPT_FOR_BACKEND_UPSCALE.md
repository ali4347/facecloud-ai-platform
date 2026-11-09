# Prompt for the backend developer (Ijaz): an "enlarge" slider in the editor (Real-ESRGAN x2) and a "make HD" choice

Gap BG-14 in `qa/BACKEND_GAPS.md`. Copy everything inside the block into the backend session. The frontend cannot do this alone: the editor draws the
sliders the server lists (`GET /api/enhancements/editor/configuration/`) and today none of them changes the size of the photograph. The frontend is NOT
built yet for this; it will be built against the contract below once the server answers it (a new "Size" group with the slider and a "Make HD" button, and
a close-up of the enlarged face, because a small preview cannot show the difference). Until then nothing in the screens changes.

```
Task: let the person enlarge a photograph from the editor, see how strongly, and reach "HD" in one step. One pull request, additive, tests for every rule. Do not
change what the automatic pipeline does (it still enlarges only a small photograph on its own, see "Context"), do not weaken any safety gate, and do not
change an existing control, key or default.

Context (read-only at origin/main 4af25fc; check it, I may have missed a caller):
  - The editor contract (enhancement/controls.py, served at GET /api/enhancements/editor/configuration/) has tone controls (brightness, contrast, shadows,
    highlights, saturation, warmth, sharpness, intensity) and model-backed controls (lowlight, denoise, deblur, face_restore; model_controls.py). Model
    controls run first in that order, then the tone controls. There is no control that changes the size.
  - Real-ESRGAN x2 runs only inside the adaptive engine, for a photograph whose short edge is under 480 px, output at most ADAPTIVE_MAX_OUTPUT_EDGE (4096)
    (docs/enhancement/adaptive-engine.md). POST /api/enhancements/images/{id}/ takes {level, style} only; there is no size field.
  - The backend's own model sheet rates Real-ESRGAN 1 to 3 dB BELOW bicubic on pixel metrics ("a visual-quality option, not a measured gain"). Say so in the
    docs and never describe an enlargement as a restoration or as more real detail.
  - Previews are bounded images (PreviewSourceSerializer already reports full_width / full_height of "the full-resolution image a save renders"), so the
    effect of an enlargement cannot be judged in a preview of that size.
  - The owner's machine has a limited GPU: keep memory and time bounded (item 2).

Owner decisions needed BEFORE you build (ask in the PR if unanswered, then use the recommended answer):
  a. What "HD" means. Recommended: the SHORT edge reaches 1080 px (1080 x 1440 for a 3:4 portrait). "Full HD" 1920 x 1080 is a landscape frame and does not fit a
     portrait photograph, so do not crop or pad to it.
  b. Whether x4 is wanted. Recommended: no, x2 only (that is the checkpoint the server has).

1. A control "upscale" in the editor configuration
   - model_backed true, engine "realesrgan", variant "x2", `available` false when the checkpoint is not enabled or not installed (same fields as the other model
     controls), range 0 to 100, neutral 0.
   - Meaning: 0 keeps the size. Any value above 0 makes the photograph twice as wide and twice as tall; the VALUE is the share of the Real-ESRGAN result blended over a
     plain bicubic x2 enlargement of the same photograph (so the strength can be seen and 100 is the model's raw result). Put it after face_restore and before the
     tone controls, so sharpness and contrast act on the final pixels.
   - Same caching as the other model controls (the candidate is cached under its input's hash; moving the slider again is a blend, not a second model run).
   - When the model is off or fails: do not enlarge silently with something else. Report it as not applied, with a plain sentence, in the render block the way the
     other model controls do.
2. Limits that protect a small machine
   - Refuse with a field error that names the limit when the output would pass ADAPTIVE_MAX_OUTPUT_EDGE (4096 on the long side), and add a setting for the
     largest INPUT in megapixels (default chosen from your measurement, item 6). Tile and retry on out-of-memory as runtime.py already does; never a hang.
   - A save of an enlarged photograph must not block a web request for the model's time: run it as a background job with a status and progress like an
     enhancement (the response says so), and keep the preview endpoint bounded.
3. Seeing it: the preview
   - The preview response gets `final_size: [width, height]` (what a save will produce) and, when upscale is above 0, `detail_crop`: a PNG or JPEG crop of the ENLARGED
     image at its real scale, about 512 x 512 px, centred on the main face (centre of the photograph when there is no face), plus the same crop of the plain bicubic
     enlargement for comparison. The frontend shows them side by side.
4. "Make HD"
   - The editor request (preview and save) accepts `make_hd: true` (not a control). The server picks the scale for the person: if the short edge is already 1080
     or more, nothing is enlarged and the answer says so; otherwise x2 and then a high-quality downscale to the exact size when x2 would overshoot 1080 on the
     short edge; a photograph that x2 cannot bring to 1080 (short edge under 540) is enlarged x2 and the answer says `hd_reached: false` with the reason in
     words. Never crop, never pad, never change the aspect ratio.
   - The result of a save carries `output_width`, `output_height`, `hd_reached`, and the stage in `applied_stages` ({stage: "upscale", engine: "realesrgan",
     variant: "x2", scale, input_size, output_size}), the same shape the automatic pipeline already uses.
5. Faces and honesty
   - Real-ESRGAN does not restore faces. Where the photograph has a face and the person has the face-processing consent, check the enlarged face against the
     original with the same identity gate the automatic pipeline uses; when it fails, return the bicubic enlargement for that photograph and say why. Without
     consent, run no biometric check and say that too (the sentence already used elsewhere).
   - Say in `docs/FRONTEND_API_GUIDE.md` and docs/enhancement/dashboard-sliders.md that an enlargement adds pixels, not information, and what was measured (item 6).
6. Measure before you ship, put the numbers in the PR
   - Seconds and peak memory of one x2 on mps and on cpu for inputs of about 480, 1000 and 2000 px on the long side, and the largest input that finishes on the
     owner's Mac. Choose the megapixel setting from that, not from a guess.
   - On at least 10 real portraits (FACECLOUD_SAMPLE_PHOTOS, never committed) a table of upscale 0 / 50 / 100: seconds, output size, identity similarity to the original
     face (SFace; ArcFace when installed), and whether the gate fell back.

Tests: the control is listed with the right fields and `available` follows the model setting; 0 changes nothing (bytes of the output equal the input path); a value above
0 doubles both edges; 50 is between the bicubic and the model result; the cap refuses with a field error that names the limit; the cache makes the second move a blend;
a model failure is reported, not hidden; make_hd on a photograph of 1200 x 1600 does nothing and says so, on 600 x 800 gives 1080 x 1440 exactly, on 400 x 500 gives
x2 with hd_reached false; the identity fallback returns the bicubic result; no consent runs no face check; a save runs in the background and is cancellable; the schema
and the migrations check stay green and the new fields are described (no undescribed JSON answers).

How to see it work (put these in the PR description):
  TOKEN=...   # as in the other prompts
  curl -s localhost:8000/api/enhancements/editor/configuration/ -H "Authorization: Bearer $TOKEN" | python -m json.tool   # "upscale" with model_backed, engine, available
  curl -s -X POST localhost:8000/api/enhancements/results/<id>/previews/ -H "Authorization: Bearer $TOKEN" -H 'content-type: application/json' \
       -d '{"revision":1,"mode":"manual","adjustments":{"upscale":60}}'                          # final_size and detail_crop
  curl -s -X POST localhost:8000/api/enhancements/results/<id>/previews/ -H "Authorization: Bearer $TOKEN" -H 'content-type: application/json' \
       -d '{"revision":2,"mode":"manual","make_hd":true}'                                         # final_size 1080 on the short edge, hd_reached
```
