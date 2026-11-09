# Prompt for the backend developer (Ijaz): run the deployment on the real host and prove it

Gaps BG-10, BG-11 and BG-12 in `qa/BACKEND_GAPS.md`. Copy everything inside the block into the backend session. The backend already has the paperwork
(`docs/deployment/VPS_RUNBOOK.md`, `hostinger-readiness-2026-10.md`, `vps.env.example`, `rate-limits.md`, the production guard). What does not exist is
the evidence: the readiness note says "not validated on Hostinger", "CUDA code paths have not been run", and that the measured CPU numbers do not
transfer. The frontend can only be shown live when the API answers from a real address, so this is the critical path to the defence on 2026-11-10.

```
Task: bring the API and an inference worker up on the target host, following docs/deployment/VPS_RUNBOOK.md, and return the evidence listed below. Where the runbook is wrong or missing something, fix the runbook in the same pull request. Do not change application behaviour except where an item says so.

0. Decide the host and say so first.
   Shared web hosting cannot run Python with PyTorch and model weights; a VPS can. State the machine (vCPU, RAM, disk, whether there is a GPU), the domain (api.facecloudai.com in the runbook) and the date it will be reachable. If it is CPU-only (assumed), apply the sizing conclusions of hostinger-readiness-2026-10.md: one inference process per worker (--concurrency=1), at least 8 GiB for it, HD_RESTORATION_ENABLED=False (Real-ESRGAN takes about 5 minutes for 0.3 MP on a CPU), ENHANCEMENT_MAX_INPUT_PIXELS about 2 to 4 MP, ADAPTIVE_TIME_BUDGET_SECONDS a few minutes, ENHANCEMENT_QUEUE_NAME=inference on both the API and the worker. Run scripts/measure_inference.py on THIS machine and put the table in the PR: the M1 numbers are not evidence for it.

1. The services (runbook sections 2 to 9)
   PostgreSQL, Redis, gunicorn, a default-queue Celery worker and the inference worker under systemd, nginx with HTTPS (certbot, auto-renew), DEBUG off, the production guard satisfied (it refuses CELERY_TASK_ALWAYS_EAGER and an unlicensed or unconfigured model). One database (docs/deployment/one-database.md), migrations applied, a superuser and an administrator account created, nothing seeded with a known password.
   Storage: single host means local disk is acceptable only if the API and the worker share it; otherwise STORAGE_BACKEND=s3 (docs/deployment/aws-s3-private-storage.md). Say which and why.

2. What the frontend needs (check each, paste the output)
   - CORS: CORS_ALLOWED_ORIGINS contains https://www.facecloudai.com (and the staging origin, if any). A preflight from that origin answers: curl -i -X OPTIONS https://<api>/api/auth/login/ -H "Origin: https://www.facecloudai.com" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: authorization,content-type".
   - FRONTEND_URL is the frontend's public address, because it is written into the emailed links (verify email, reset password, invitation). SMTP works end to end: a real sign-up on the deployed pair receives the email and the link opens the frontend.
   - PUBLIC_BACKEND_URL is the API's public https address: it is written into download and share links. A share link made for an enhanced photo opens in a private window with no sign-in (GET /api/shares/public/<token>/ answers the image, /info/ the metadata).
   - Upload limits survive nginx: a 400 MB image, a 150-photo batch and a 2 GB ZIP are accepted through https (client_max_body_size just above MAX_ZIP_UPLOAD_SIZE, proxy timeouts long enough for the slowest request, gunicorn timeout the same). Attach the three uploads' status codes. If a limit is lowered for this host, change the setting, the runbook and tell the frontend owner the numbers (they are shown in the Upload Center).
   - Mixed content: everything is served over https; the browser blocks an http API call from an https site and the webcam only works on https.

3. The preview endpoints (BG-12)
   POST /api/enhancements/results/{id}/previews/ renders inside the web process and, with the model sliders, loads PyTorch there. Pick one of the options the readiness note lists (give the API process the memory and accept the first-request load; run those API workers with the model flags off; or give previews their own single-worker upstream), implement it, and measure: first-request and warm latency of a preview, and the web process's resident memory before and after. Put the numbers in the PR. If the first request exceeds the nginx timeout, warm the model at start.

4. Switches that leave features dark (BG-11)
   Report each as "on" or "off, because ...", and run what the "on" ones need:
   - Capture dates and locations of photographs uploaded before those features: python manage.py backfill_taken_at; python manage.py backfill_location.
   - Place names: install and approve the GeoNames file as docs/FRONTEND_API_GUIDE.md section 5-places describes, so GET /api/places/ answers names_available: true; or leave it off and say so (the app then shows "place names are not set up").
   - Search by what is in a photograph: approve the model (docs/model-licenses/semantic-search-model.md) and python manage.py index_semantic_search; or leave it off.
   - Models: python manage.py check_restoration --verify --require upscale (add deblur and face_restore if the owner switches them on), python manage.py check --deploy, DDColor's licence record (docs/model-licenses), NONCOMMERCIAL_MODELS_ACKNOWLEDGED. Paste the outputs.
   - The advisor stays off unless the owner supplies a key; say so.

5. Smoke tests, backups, rollback
   Run runbook section 12 (smoke tests) and attach the output. Run the backup and a RESTORE into a scratch database once (section 10) and attach the row counts before and after. Rehearse section 14 (rollback) once.
   Then the whole product path against the deployed API, from the frontend built with VITE_USE_API=true VITE_API_URL=https://<api>: sign up, verify, sign in; upload one photo; watch the progress move through the real stages; the result and the enhanced download; a share link opened privately; a Person Folder appears after consent. Attach a short screen recording or screenshots.

6. A small load check
   With the loadtest tooling (loadtest/, requirements-loadtest.txt, seed_loadtest_users): 5 concurrent users each uploading 10 photographs. Report the upload-accepted latency (p50, p95), the time until the last photograph is enhanced, the queue depth over time, the worker's memory and any error. State the capacity this host really has (photographs per hour) and what the application does when it is exceeded (429 with the wait, the queue). Do not claim GPU or CUDA speed: those paths have not been run.

7. Hand-over note for the frontend owner (a short file in docs/deployment/)
   The API base URL; the commit deployed; the environment variables that were set (names and non-secret values only); the three seed accounts for the demonstration (an ordinary user, a moderator, an administrator) created through the application's own sign-up or admin tools; the output of GET /api/system/health/ (it must say which models and stages are on and off: that is item 2c of PROMPT_FOR_BACKEND_RISKS.md, do it first or together); what is off and why; and the date and time of the last smoke test.

Acceptance: every numbered item has its evidence in the PR description; the frontend, built for the deployed API, completes the product path in item 5 with no console error; /api/system/health/ answers in a couple of seconds and says the truth about what is on.

Out of scope: GPU and CUDA, autoscaling, multi-region, changes to the application's behaviour.
```
