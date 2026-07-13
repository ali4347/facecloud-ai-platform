# FaceCloud — AI Facial Image Enhancement & Identity Organization Platform

FaceCloud is an AI-powered web application for facial image enhancement, validation, organization, and monitoring.

* **Users** can upload images, enhance them, validate quality, group faces into person folders, download results, and track activity.
* **Admins** monitor users, logs, system health, upload statistics, and rejection analytics.
* **Moderators** review borderline/rejected images.

---

## Tech Stack

The application is built using the following stack:
* **Framework / Build Tools**: React, Vite, TypeScript
* **Styling**: Tailwind CSS
* **Animation & Icons**: Framer Motion, Lucide React
* **Data Visualization**: Recharts
* **Streaming & Vision**: hls.js, MediaPipe tasks-vision
* **Authentication**: LocalStorage-backed Mock authentication
* **Deployment**: Vercel

---

## Completed Features So Far

### Public Website
* Cinematic dark liquid-glass landing page
* Fullscreen HLS video hero integration
* Floating glassmorphism navbar
* Lead capture / Email CTA input
* FaceCloud & DATAMART / DTM.IO branding

### Authentication
* User login & registration
* Localized mock email verification redirect flow
* Role-based protected routing (User, Admin, Moderator)
* Unauthorized route layout protection

### User Portal
* User dashboard overview
* Upload Center (Hub for single, multiple, and ZIP files)
* Single image upload (Restoration pipeline simulation with actual comparison slider)
* Multiple image upload (Batch queue processing)
* ZIP batch upload with extraction metrics
* Live Camera Enhancement panel
* Activity Logs & Settings
* Person Folders (Identity classification directories)
* My Images grid & downloads center

### Live Enhancement
* Browser webcam feed ingest
* Original Feed vs. AI Enhanced Output side-by-side tabs
* MediaPipe real face detection integration (supports multi-face tracking via `blaze_face_full_range_sparse` model at `0.25` confidence threshold)
* Live keypoint landmarks and green bounding boxes on the Original Feed
* Visual sliders for Brightness, Contrast, Saturation, Detail recovery, and Noise reduction
* Clean layout for AI Enhanced Output panel without bounding boxes or lines
* Camera resolution selector supporting full `1920×1080` frame parsing
* Remini-style Snapshot Enhancement tab (captures frame and runs 7-step simulated AI pipeline)
* **Revert Note**: *Age and gender estimation was tested but reverted from the live webcam view because the model was not reliable yet.*

### Single Upload Pipeline
* Removed manual pipeline outcome buttons (Success, Blur Rejection, etc.)
* Automatic AI decision pipeline analyzing blur, brightness, and face size deterministically
* Multiple faces are supported (not rejected); the enhanced file is saved to all matched person folder directories
* Interactive comparative before/after slider with canvas filtered preview

### Admin Console
* Admin dashboard overview metrics
* User account controls
* Live audit logs and system telemetry monitoring
* Interactive API document explorer & Sandbox Testing panel
* System configuration, statistics, and rejection analytics summaries
* Admin-only navigation sidebar

### Moderator Panel
* Moderator dashboard statistics
* Rejected/borderline review queue
* Detail panel for approving/rejecting images
* Moderator audit trace log & configurations

---

## Current Known Limitations

* **Backend Connectivity**: Core REST APIs and server connections are not hooked up yet.
* **Simulated AI Enhancement**: Visual corrections on image files are currently simulated using client-side canvas filters.
* **Model Disablement**: Age/gender demographic estimations are disabled until browser model performance is stable.
* **Mock Data**: Identity matching, API tests, and server health cards run on local mock presets.

---

## Mock Credentials

You can sign in to the application using the following mock accounts:

| Role | Username | Password |
|---|---|---|
| **User** | `user@facecloud.ai` | `password` |
| **Admin** | `admin@dtm.io` | `password` |
| **Moderator** | `moderator@facecloud.ai` | |

---

## Important Routes

```txt
/
├── /login
├── /register
├── /verify-email
├── /dashboard
│   ├── /dashboard/live-enhancement
│   ├── /dashboard/jobs
│   ├── /dashboard/upload/single
│   ├── /dashboard/upload/multiple
│   ├── /dashboard/upload/zip
│   ├── /dashboard/images
│   ├── /dashboard/person-folders
│   ├── /dashboard/downloads
│   ├── /dashboard/notifications
│   ├── /dashboard/activity
│   └── /dashboard/settings
├── /admin/login
├── /admin
│   ├── /admin/users
│   ├── /admin/audit-logs
│   ├── /admin/security
│   ├── /admin/api-docs
│   ├── /admin/api-test
│   ├── /admin/system
│   ├── /admin/upload-statistics
│   └── /admin/rejection-summary
├── /moderator/login
├── /moderator
│   ├── /moderator/queue
│   ├── /moderator/audit
│   └── /moderator/settings
└── /unauthorized
```

---

## Development Commands

Run these scripts from the repository root:

* Install dependencies:
  ```bash
  npm install
  ```
* Start development server:
  ```bash
  npm run dev
  ```
* Compile and build bundle:
  ```bash
  npm run build
  ```

---

## Git & Development Workflow Rule

> [!IMPORTANT]
> **Development Rule:**
> After every major feature, bug fix, UI change, or route update:
> 1. Run `npm run build`
> 2. Fix all build errors
> 3. Update `README.md` with what changed
> 4. Commit changes with a clear message
> 5. Push to `origin main`

---

## Future Work

* Wire up authentication and file storage endpoints with real cloud APIs.
* Connect actual Zero-DCE, GFPGAN, CodeFormer, and Real-ESRGAN backend models.
* Add automated integration and end-to-end browser tests.
* Improve browser MediaPipe performance.
* Re-integrate demographic estimations if a reliable model is resolved.
