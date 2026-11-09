# Prompt for the backend developer (Ijaz): the pipeline's four real risks (speed, models switched off, identity, untested new features)

Copy everything inside the block into the backend session. It is separate from `PROMPT_FOR_BACKEND_PIPELINE_ORDER.md` (the order of two stages); the two do
not depend on each other. These findings come from a read-only check of the owner's backend at `496240f` on 2026-11-03 (a throwaway copy with his model
files linked in; nothing in his folder was changed): his backend's own `check_restoration --verify`, its real-model tests (172 OK, 14 skipped), 26 real
portraits and 15 synthetic degraded copies through the real upload pipeline, and direct runs of Zero-DCE and GFPGAN.

```
Task: four items, each its own commit, one pull request (or four small ones, your choice). Measure before and after, and put the numbers in the PR description. Do not weaken a safety check to make a number better, and do not change a default that the owner did not ask you to change (item 2 says exactly which).

1. Speed. (the biggest risk for a live demonstration)
   Measured on the owner's Mac (Apple GPU, PyTorch "mps"), photos of about 1000 px on the long side. Each figure is the wall time of POST /api/images/upload/single/ (which runs the automatic enhancement) PLUS one more enhancement request on the same photo with style ai_max and level high, so it covers TWO runs of the engine; one run is roughly half (the split was not measured, item 1a must do it):
     deblur (NAFNet GoPro) + face restore (CodeFormer): 90 to 120 s      deblur alone: 59 s (one photo 102 s)      face restore alone: 76 s
     Real-ESRGAN x2 enlargement of a small photo: 9 s        OpenCV noise filter: 4 to 6 s
   Measured directly, one call each: Zero-DCE 0.6 to 1.1 s (CPU), GFPGAN v1.4 15.5 s.
   And uploads are processed INSIDE the request (CELERY_TASK_ALWAYS_EAGER is on: check W001), so the request blocks for that long and the screen shows no progress.
   a. Find where the time goes: record seconds per operation and per candidate in parameters["adaptive"] (it logs one total today) and print a table for the demo set of item 4. Compare mps and cpu. Report the share of model load, tiling, validator and encoding.
   b. Reduce it with measured before/after, each change keeping every validator gate: tile size and overlap in enhancement/runtime.py, half precision where the output stays inside VALID_OUTPUT_MARGIN, skipping an operation the validator would certainly refuse (for example NAFNet on a photo whose face is already sharp enough), analysing on a downscaled copy, warming the models when the worker starts, one model load per process.
   c. A one-command launch for development and for the demonstration: a script (scripts/dev_up.sh or a make target) that checks Redis, starts Django and a Celery worker (and beat) with CELERY_TASK_ALWAYS_EAGER=False, runs `manage.py check_restoration --require upscale` first, and prints the URLs. With it the upload returns at once and the progress endpoint moves through the real stages; show that in the PR with a captured poll of /api/images/batches/<id>/progress/.
   d. Target: the default path (automatic enhancement, level auto, style natural) finishes a 1000 px photo in 30 s or less on the owner's Mac. If a heavy operation cannot, make the adaptive engine decline it above a megapixel limit (a setting) and say so in skipped_stages with a sentence, never by silently doing less.

2. Three models are switched off in the owner's .env.
   NAFNET_DEBLUR_ENABLED=False, CODEFORMER_ENABLED=False, GFPGAN_ENABLED=False (checkpoints are present and their checksums are ok; with the flags on in a throwaway copy all three ran and produced valid output). So on his server blur removal and face restoration never run; upscale, Zero-DCE, the OpenCV noise filter, face detection and grouping do. Whether to switch them on is the OWNER's decision, so do not change a default in code. Make the decision easy and safe:
   a. .env.example gets one block with the three flags, the checkpoint paths, NONCOMMERCIAL_MODELS_ACKNOWLEDGED and a sentence on each licence (CodeFormer: S-Lab 1.0 non-commercial; GFPGAN: non-commercial; NAFNet: MIT).
   b. A "demonstration profile": .env.demo.example that turns them on with the limits from item 1, plus the README steps (including `check_restoration --require deblur face_restore upscale`).
   c. At startup (and in the System Health endpoint the admin console reads) list which stages are active and which are switched off and why, so nobody has to guess from the results.
   d. Face restoration and grouping need the person's consent (a user without it gets skipped_stages "Biometric processing is not permitted"). Make sure that sentence reaches the API result of an enhancement and the batch progress in plain words ("Face restoration needs the person's face-processing consent"), and that the consent state is readable from one endpoint the frontend already calls (/api/privacy/consents/).

3. Identity: the main safety risk, in your own words (docs/DEFENSE_READINESS_REPORT.md section 6).
   The identity gate can only compare a result with the degraded input; it cannot see drift from the true face (observed: 0.85 to 0.91 seen, 0.07 to 0.13 lost against the clean face); a face too dark to embed cannot be verified at all; two identity models can disagree about the same restoration; the 0.70 ArcFace threshold rests on five data points. In the owner's setup the identity provider is SFace (ArcFace and RetinaFace are not installed).
   a. Evidence first: scripts/evaluate_identity_drift.py that takes the clean photographs of the demo set (item 4), degrades them (blur, motion, dark, noise, small), runs each operation, and prints, per operation, the identity similarity to the CLEAN face for SFace (and ArcFace when installed). At least 20 photographs of at least 10 different people; commit the table, not the photographs (they are real people).
   b. From that table, set the gate by data: compare the result with the ORIGINAL face crop where the original face can be embedded, and with a second model when installed; refuse face_restore when identity cannot be verified or the similarity to the original drops by more than the measured limit; keep fidelity low (CodeFormer fidelity) when it can only be partly verified.
   c. Say it in the API: enhancement_summary / identity_notice must state verified, uncertain or not verifiable, in a sentence a person understands, for every result that touched a face.
   d. Tests for each rule, and a paragraph in the docs on what the guarantee is and what it is not.

4. A demonstration set, and the new features nobody has checked yet.
   a. scripts/demo_set.py: from clean photographs in a local folder (FACECLOUD_SAMPLE_PHOTOS, never committed) it makes the degraded copies the engine should handle, and a short README table of the expected outcome of each: blur (Gaussian sigma 4.5 at 1000 px), motion blur (a 21 px horizontal kernel), dark (gamma 2 and 0.6 of the level) that still passes the quality check, noise (sigma 22), small (0.32 of 1000 px). In the owner's check the dark copies were refused by the quality gate (needs_review) and never reached Zero-DCE; pick levels that pass.
   b. Run the new features of the last merges on that set with the real models and report them in the PR as a table: Style and Strength now changing what the engine does (natural / dynamic / ai_max x low / medium / high), colourising black-and-white photographs (DDColor, model file ddcolor/ddcolor_paper.bin), and the detail restoration (e2cd7f5): outcome, operations, seconds, identity state, and a before/after image pair for the owner (local only).
   c. A photo that goes through the whole pipeline and ends `original_preserved` is correct, but the owner must be able to show a visible improvement in a demonstration: list in the README which demo photographs do, with the command that reproduces each.

Tests: each item with its own; the existing suite stays green (ruff, schema, migrations check).
How to see it work: the commands in each item, plus `python manage.py check_restoration --require upscale deblur face_restore` and `scripts/dev_up.sh`.
```
