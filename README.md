# FaceCloud — AI Facial Image Enhancement & Identity Organization Platform

FaceCloud is an AI-powered web application for enhancing, validating, organizing, and monitoring facial images. It allows users to upload images, process them through an AI pipeline, group detected faces into person folders, and download enhanced results. It also includes admin monitoring and moderator review workflows.

Powered by **DATAMART / DTM.IO**.

---

## 1. Project Overview

FaceCloud is designed to handle high-throughput and low-light facial photography, providing tools for both regular users, moderators, and system administrators. The key features of the platform include:
* **AI Facial Image Enhancement**: Automatically enhances exposure, contrast, and facial details on uploaded portraits.
* **Zero-DCE (Zero-Reference Deep Curve Estimation)**: Conceptually used for low-light enhancement without reference images, restoring details in dark zones.
* **Face Detection & Landmarks**: Uses on-device machine learning to locate faces and identify landmark coordinates.
* **Quality Validation**: Automatically checks images for quality criteria including brightness, blur, and face size ratio.
* **Person Folder Grouping (Identity Groups)**: Clusters detected face embeddings, mapping identical faces to unique person folders automatically.
* **Secure Downloads**: Generates time-limited download links for single images or complete batch reports.
* **Processing Jobs**: Monitored queues that track multi-stage backend operations in real-time.
* **Admin Monitoring**: Dashboards tracking user directory, security incidents, API endpoint test runners, and statistics.
* **Moderator Review**: A manual human-in-the-loop review queue for borderline or rejected images.
* **Mock Architecture**: The frontend is fully functional and uses LocalStorage/mock presets to simulate API responses.

---

## 2. Current Frontend Status

The frontend is being connected to the [Django backend](https://github.com/ijaz-student021/FaceCloud_backend) one screen at a time, controlled by `VITE_USE_API` in `.env.local`:

* **Live on the API:** sign-in; the moderator dashboard and review queue; and the user portal's single upload, processing view, uploads list, My Images gallery and image detail.
* **Still on browser filters only:** the live webcam preview (captured frames are enhanced by the real pipeline). Every other screen in the user portal, the admin console and the moderator panel reads the live API when `VITE_USE_API=true`, and keeps its demo data otherwise.

With `VITE_USE_API=false` (or no `VITE_API_URL`) every screen falls back to the built-in demo data, so the prototype stays fully browsable without a server running.

**Local backend and batch progress:** the Upload Multiple / ZIP screens show each stage (checking faces, quality, grouping, enhancing) only when the backend hands the work to a Celery worker. With `DJANGO_DEBUG=True` and no `CELERY_TASK_ALWAYS_EAGER=False`, the backend does all the processing *inside the upload request*: the screen then sits on "Uploading…" and jumps straight to the finished result. For the real behaviour run Redis, set `CELERY_TASK_ALWAYS_EAGER=False` in the backend `.env`, and start `celery -A config worker -l info --pool=solo` next to the API (`--pool=solo` is needed on macOS).

---

## 3. Tech Stack

The application relies on the following frontend dependencies (from [package.json](file:///Users/Ali/Downloads/FYP/package.json)):
* **Framework**: React (v19.2.7)
* **Build System & Dev Server**: Vite (v8.1.1)
* **Language**: TypeScript
* **Styling**: Tailwind CSS (v3.4.19)
* **Animation**: Framer Motion (v12.42.2)
* **Icons**: Lucide React
* **Data Visualization**: Recharts (v3.9.2)
* **Video Hero Stream**: hls.js (v1.6.16) for responsive video playback
* **On-Device Machine Learning**: `@mediapipe/tasks-vision` (v0.10.35) for browser webcam face detection
* **Routing**: React Router DOM (v7.18.1)
* **Mock State Management**: LocalStorage-backed mock session store

---

## 4. Design System / UI Theme

FaceCloud uses a **Cinematic Dark Liquid-Glass UI** aesthetic:
* **Background**: Pure dark palette (`#000000` primary background).
* **Glassmorphism**: Backdrop blur panels (`backdrop-filter: blur(24px)`) styled with subtle border stroke overlays (`rgba(249, 115, 22, 0.12)`).
* **Color Accents**: Premium orange brand accents (`#F97316` core accent, with `#EA580C` and `#FB923C` stops). Status colors (Emerald, Amber, Rose) are preserved for active success/warning/error states.
* **Typography**: Primary display headings (`h1`, `h2`, `h3`) utilize `Space Mono` (Google Fonts). Small numbered section indicators utilize `Silkscreen` (Google Fonts). Body copy continues using `Inter`.
* **Visual Effects**: Micro-animations on buttons and cards using Framer Motion, dynamic hover transitions, and pulse glows on status badges.
* **Landing Page**: The FaceCloud hero uses a seamless ping-pong playback sequence. The original CloudFront video plays forward, followed by a locally generated reversed MP4, avoiding the abrupt restart produced by native video looping. Features a "live systems" data-ops aesthetic with status badges, terminal-style logs, live pipeline cards, and animated percentage indicators.
* **Responsive Layouts**: a "glassy" shell — a floating icon rail on the left (each icon names itself on hover; a labelled drawer on phones), a floating top bar, a floating bottom navigation pill with every section by name (scrolling sideways), and one glass stage sheet that holds each page — on a warm, softly lit "room" ground, in both the dark and the light appearance.

### Landing Page Sections (in order)
1. **Fullscreen Video Hero** — CloudFront MP4 background video with seamless ping-pong forward/reverse loop and desktop mouse parallax, staggered headline animation with `<ScrambleText>` decodes and orange highlight blocks, inline email waitlist capture, pill badge pop-in.
2. **Trusted Logos Marquee** — Infinite horizontal scroll of partner logos.
3. **Stats / Metrics Bar** — 4 animated CountUp counters (detection accuracy, processing time, images processed, RBAC roles).
4. **01 / Early Access Feedback** — Testimonials block with orange hover border shadows.
5. **02 / Dataset Challenge (Problem Cards)** — 5 problem cards with staggered scroll reveal and icon pop animations.
6. **03 / Use Cases / Who It's For** — 4 cards: Identity Verification, Event Photography, HR & Onboarding, Enterprise Photo Archives.
7. **04 / AI Infrastructure** — Live-looping pipeline panel cycling PENDING → ACTIVE → SUCCESS status badges.
8. **05 / Ingestion Suite** — 12-card feature grid with staggered reveal and hover glow.
9. **06 / Methodology (Freedom Section)** — Responsive three-column layout with an HLS-hosted processing video, pain points list, and benefits list.
10. **07 / Interactive Demo** — Before/after slider with auto-demo scroll trigger (0→50%).
11. **08 / Processing Options** — Single, Multiple, ZIP upload cards.
12. **09 / Pricing** — Monthly/Yearly toggle, 3 tier cards (Free/Basic/Pro), each marked "Coming soon" with a disabled button — plans and pricing are deferred to V2.
13. **10 / User Interface** — 3 dashboard preview mockup cards.
14. **11 / Administrative Control** — Admin Console and Moderator Review cards with orange-colored hover glows.
15. **12 / Enterprise Security** — Security points grid + animated terminal log feed with typewriter effect.
16. **13 / FAQ** — Accordion with Framer Motion layout height animation.
17. **14 / API / Integrations Teaser** — Terminal-style code block showing example REST request.
18. **Final CTA** — Call to action with orange gradient orb background.
19. **Footer** — Logo, Product links (Features, Methodology, Pricing, Security, FAQ), Portals, Compliance.

### Public Marketing Pages
* **About Page (`/about`)**: Full-width marketing overview highlighting the product genesis and core mission:
  * **Hero Section**: Mission badge and first-person-plural story explaining *why* FaceCloud was built.
  * **Mission Statement**: Explains FaceCloud's approach to the Dataset Challenge.
  * **How We Work**: Three card-based value pillars (Automation with Control, Security, and Production-tested building in partnership with DataMart).
  * **The Team**: Styled profile card list displaying Ali Chaudhry, Maria F., and David S. with initials-based testimonials avatars.
* **Contact Page (`/contact`)**: Centered contact hub containing:
  - **Header**: Inline badge and workflow question subtext.
  - **Inquiry Form**: Interactive layout capturing Name, Email, optional Company, select inquiry Reason, and Message. Includes real-time validation, dynamic error labels, asynchronous submission status overlays (processing state, success state, retry error state), and console-logged JSON payload stub.
  - **Context Info Cards**: Displays general support email, enterprise partnerships channel, and quick FAQ anchor redirection back to the home page.

### Animation Utility Components
* [`RevealOnScroll`](file:///Users/Ali/Downloads/FYP/src/components/animation/RevealOnScroll.tsx) — `whileInView` scroll-triggered reveal with direction, delay, and `prefers-reduced-motion` support.
* [`StaggerChildren`](file:///Users/Ali/Downloads/FYP/src/components/animation/StaggerChildren.tsx) — Container + item wrapper for staggered child animations.
* [`CountUp`](file:///Users/Ali/Downloads/FYP/src/components/animation/CountUp.tsx) — Animated number counter with easeOutQuart easing, triggered on scroll.
* [`ScrambleText`](file:///Users/Ali/Downloads/FYP/src/components/animation/ScrambleText.tsx) — Animated scroll-to-view text scramble-and-decode component with custom frames duration and prefers-reduced-motion bypass support.

---

## 5. Authentication and Roles

The application protects routes based on user roles using a [ProtectedRoute](file:///Users/Ali/Downloads/FYP/src/components/layout/ProtectedRoute.tsx) guard checked against `localStorage`.

### Mock Credentials

| Role | Username | Password | Purpose |
| :--- | :--- | :--- | :--- |
| **User** | `user@facecloud.ai` | `password` | Uploading, managing images, viewing folders, and webcam live demo. |
| **Admin** | `admin@dtm.io` | `password` | Auditing logs, managing users, testing mock APIs, system health panels. |
| **Moderator** | `moderator@facecloud.ai` | `password` | Checking flagged images, reviewing rejection reasons, approving queues. |

### Auth System Architecture
* **User Login**: Simulates credentials verification and sets the `facecloud_session` JSON item in `localStorage`.
* **Verification Flow**: Localized mock verification redirects users to verify email screen before dashboard entry.
* **Route Protection**: If the session is missing, users are redirected back to the role-specific login. If roles mismatch, they are sent to `/unauthorized`.

---

## 6. Routes

The complete route configuration as specified in [App.tsx](file:///Users/Ali/Downloads/FYP/src/App.tsx):

### Public / Auth Routes
* `/` (Landing Page)
* `/about`, `/contact` (public pages)
* `/roles/moderator` (Moderator role guide — what the role can and cannot do, how a review works, build status; an information page, not the portal; linked from the navbar as "Moderator" and from the Moderator Review card on the landing page)
* `/login` (User Login: for user accounts only; an admin or moderator account is refused here and signs in on its own page)
* `/register?invitation=<token>` (the same page, opened from an organization invitation: the invited email is locked and one step creates the account and joins the organization)
* `/register` (User Registration — full name, email, password; creates a real pending account when `VITE_USE_API=true`)
* `/signup` (Redirects to `/register`)
* `/verify-email` (Email verification. With the API on it opens from the emailed link `/verify-email?registration_id=…&token=…`, confirms it with the backend, then sends the person to `/login`; the demo build keeps a mock button)
* `/forgot-password` (request a reset link by email; linked from all three sign-in pages)
* `/reset-password/:uid/:token` (the page the emailed reset link opens: choose a new password)
* `/admin/login` (Admin Console Login: admin accounts only; reached by direct link)
* `/moderator/login` (Moderator Panel Login: moderator accounts only; reached by direct link)
* `/invitations/:token` (the page an organization invitation email opens: shows who invited you, then you sign in with the invited email and join; needs the live backend)
* `/unauthorized` (Access Denied page)
* `*` (Not Found / 404 page)

### User Portal Routes (under `/dashboard`)
* `/dashboard` (User Dashboard Overview)
* `/dashboard/upload` (Upload Center Gateway)
* `/dashboard/upload/single` (Single Image Upload and AI comparison)
* `/dashboard/upload/multiple` (up to 150 photos in one batch, the steps it is going through, real per-photo verdicts, why the others were not accepted, an Enhancement section with "Enhance accepted photos", and Download Accepted as a ZIP)
* `/dashboard/upload/zip` (a ZIP up to 2 GB; the real processing steps while it runs; real counts; "Why some photos were not accepted" in plain words with the photos behind each reason; an Enhancement section that says how many accepted photos are enhanced and has "Enhance accepted photos"; Download Accepted Photos as a ZIP)
* `/dashboard/processing/:id` (Real-time single job processing tracker)
* `/dashboard/images` (My Images gallery; tick photos to group them by person or delete them)
* `/dashboard/images/:id` (Image Detail: the verdict and quality scores, an Enhanced version card with before/after, Enhance / Enhance again with a style and strength, Download, Edit photo, Download report, a notice when it looks like another photo, and Delete this photo)
* `/dashboard/images/:id/edit` (Photo editor on the live backend: server-rendered previews while the sliders move (brightness, contrast, shadows, highlights, saturation, warmth, sharpness, AI tools, blend), Auto fixes, Reset, Hold to compare, Save as a new full-size version, and the list of versions with Use / Download / Delete. Needs a finished enhancement; not part of the demo build)
* `/dashboard/groups` (Person Folders: with the API on, your real folders with a mosaic of their photos; the consent banner appears here when face grouping is off)
* `/dashboard/groups/review` (Review matches: the photos the face grouping was not sure about, each with the suggested folder and match percent; say yes, a different person (existing or new folder), or leave the face out)
* `/dashboard/groups/:id` (one Person Folder: its photos, rename, Delete selected photos, Delete empty folder, Merge folder (move another folder's photos into this one), Download All / Download Selected as a ZIP, and a time-limited Secure Link to the whole folder's ZIP)
* `/dashboard/downloads` (real download history; "Your secure links" lists every link made, how often it was opened, and lets you stop one; a new line is added each time a file is downloaded; time-limited secure links for enhanced photos and Person Folder ZIPs; expired batch ZIPs can be prepared again)
* `/dashboard/notifications` (real notifications: mark read / mark all read, open, dismiss, paging; the top-bar bell shows the same unread count)
* `/dashboard/activity` (your real activity history, paged; picking a type chip or searching looks through your newest 500 events (the backend's window) and shows how many of each type there are, or says there are none)
* `/dashboard/settings` (name, organization, job title, phone, country and the picture saved to the account; Delete my account (password and a typed word); password change; the list of signed-in devices with Revoke, and sign out of all devices; notification switches saved to the account. Against a backend that predates profile details/sessions (before backend PR #67) the extras and picture stay on this device and the device list is hidden)
* `/dashboard/live-enhancement` (webcam preview with face detection; a captured frame is stored in My Images and enhanced by the real pipeline with a chosen style and strength, real before/after and "what was done"; "Enhance again" re-enhances the same photo. The live preview itself uses simple browser filters. The demo build keeps the simulated version)
* `/dashboard/jobs` (Batch job history directory)

> **Sessions:** the user dashboard, the admin console and the moderator panel each keep their own session and tokens (`facecloud_session:<portal>`, `facecloud_refresh:<portal>`), so all three can be signed in side by side in one browser and each signs out on its own.

### Admin Console Routes (under `/admin`)
* `/admin` (Admin Overview: totals, uploads, enhanced, rejected, quality pass rate, storage, with 7 / 30 / 90-day chips)
* `/admin/users` (User directory with server search and paging, upload counts, suspend / activate, Add User)
* `/admin/audit-logs` (Paged audit trail: actor, role, status, message, resource, sign-in address)
* `/admin/security` (Alerts for repeated failed sign-ins, refused requests and rate limits, with an Acknowledge action that needs a note, and the rules behind them)
* `/admin/organizations` (Every organization: create one with an owner and a plan; a moderator is always created for one organization and only sees its members and photos)
* `/admin/moderators` (list of moderator accounts, and a form to create one — `/admin/api-docs` and `/admin/api-test` were removed and redirect to `/admin`)
* `/admin/system` (Service checks, background workers, process uptime and the per-job queue table; below it the failed upload batches with a Retry for any user's batch, and the latest failed job of each kind)
* `/admin/moderation` (Moderation Overview: reviews waiting, escalated, overdue and stale across every organization, the organizations that need attention and each moderator's workload; you choose how old counts as stale)
* `/admin/invitations` (Invite a user or a moderator by email, with the organization for a moderator; list, resend and cancel)
* `/admin/statistics` (Upload trend, weekly enhancement success, live sessions and storage growth over a 7 / 30 / 90-day window)
* `/admin/upload-statistics` (Photos received by route, daily intake, average file size)
* `/admin/rejection-summary` (Rejected photos, rejection rate, the reasons behind them, daily rejections)
* `/admin/images` (Every uploaded photo with its quality result, preview and a details panel)
* `/admin/logs` (Redirects to `/admin/audit-logs`)
* Top bar (admin): search jumps to a screen or finds an account (opens Manage Users filtered to it); the bell lists open security alerts and services that are not operational.

* `/dashboard/organization` (My Organization: for the owner of an organization only, listed in the sidebar when you own one. People and plan seats, roles, invitations, what moderators see, branding (name, colour, logo), recent activity, and an export of the organization's data)

### Moderator Routes (under `/moderator`)
* `/moderator` (Dashboard: overdue and due-soon counts against the review deadline, unassigned work, oldest waiting review, and per-moderator performance over a 7/30/90-day window)
* `/moderator/queue` (Review queue: the photo under review shown as a thumbnail, filters by status, source, assignment and overdue-only, deadline ordering, claim or release a review so two moderators cannot work the same photo, and bulk approve, reject or escalate)
* `/moderator/images/:id` (One review: the photo, its measurements, deadline, take or release, assign to another moderator, approve, reject, keep in review, escalate, merge the two person folders behind a flagged duplicate, and the review's history; reached from the queue)
* `/moderator/members` (Your organization's members and pending invitations: invite, resend, cancel, deactivate, reactivate, remove; opens on the people you invited)
* `/moderator/identity` (Person folders that hold photos submitted to your organization, with suggested merges of one member's folders)
* `/moderator/rejected` (Rejected and needs-review photos submitted to your organization, with the reasons)
* `/moderator/batches` (Uploads submitted to your organization: progress, outcome per photo, retry, cancel, reprocess)
* `/moderator/notifications` (Assignments, deadlines, escalations and failed batches; the same items feed the bell in the top bar)
* `/moderator/reports` (Make and download a report about your organization)
* `/moderator/logs` (Decision Log: the latest decisions about photos, with today's counts; the full trail is Audit)
* `/moderator/audit` (The organization's audit trail: who did what, searchable)
* `/moderator/settings` (Notification switches, queue auto-refresh, and where you are signed in)

All of these read the live API when `VITE_USE_API=true` and keep their demo data otherwise. A moderator only ever sees photos that a member **submitted to the team**: on the upload pages, a person who belongs to a team can choose "Submit to: My workspace / <team>" (the default is their own workspace).

---

## 7. User Portal Features

* **Dashboard Overview**: Displays summary cards (enhanced count, quality rate, groups matched, download limits) and recent jobs history with system statuses.
* **Upload Center**: Gateway to route single, batch, or zip archives to target upload streams.
* **Single Image Upload**: Allows drag-and-drop of an image, runs a 13-stage simulated AI pipeline, and loads an interactive comparative before/after slider utilizing HTML5 Canvas filters.
* **Multiple Image Upload**: Processes collections of images concurrently in a progress queue, simulating details verification and face clusters.
* **ZIP Archive Upload**: Handles bulk assets in standard ZIP archives, reporting extraction speeds, valid image counts, and extraction progress logs.
* **Processing Jobs**: Detailed visual tracker containing duration metrics, stage completion ticks, and failure reasons for active tasks.
* **My Images Grid**: Comprehensive gallery with search/filters based on face count, blur scores, or dates.
* **Person Folders (Identity Groups)**: Groups matched face embeddings into specific cards displaying matched confidence rates and historical counts.
* **Secure Downloads**: Allows packaging enhanced copies, raw copies, or PDF audit reports to local browser filesystem downloads.
* **Activity Logs**: Auditing stream representing user actions such as login, enhancement, and downloads.

---

## 8. Live Enhancement

Located at `/dashboard/live-enhancement`, this feature leverages browser capabilities to simulate high-performance camera restoration:
* **Webcam Ingestion**: Connects to the browser camera media API. Users can select active capture resolution (supporting up to `1920×1080`).
* **Original Feed vs. AI Output**: Split tabs displaying side-by-side or individual camera feeds.
* **MediaPipe Face Detection**: Integrates `@mediapipe/tasks-vision` (BlazeFace model) running in the browser. It parses coordinates to draw green bounding boxes and face landmarks in real-time on the Original Feed. The AI Enhanced Output feed remains clean, showing the enhanced picture without overlays.
* **Real-time Filters**: Sliders adjusting brightness, contrast, saturation, detail recovery, and noise reduction apply filters on canvas overlays to mimic real-time GPU restoration.
* **Snapshot Pipeline**: A Remini-style capture button snaps the camera frame and runs it through the full 13-stage FaceCloud quality evaluation pipeline.
* **Reversion Note**: *Age/gender estimation was tested but removed/reverted because the model was not reliable enough for the current demo.*

---

## 9. Upload Pipeline

When files are uploaded via the portal, they undergo an automatic multi-stage validation sequence:

```mermaid
graph TD
    A[File Uploaded] --> B[Saved to Storage S3/R2]
    B --> C[Zero-DCE Exposure Correction]
    C --> D[MediaPipe Face Detection]
    D --> E{Face Detected?}
    E -- No --> F[Reject: No Face Found]
    E -- Yes --> G[Quality Validation: Blur, Brightness, Size]
    G --> H{Quality Checked?}
    H -- Fail --> I[Flag for Moderator Review]
    H -- Pass --> J[Extract Face Embeddings 128-D]
    J --> K[Cluster & Person Folder Assignment]
    K --> L[Generate Secure Download URL]
    L --> M[Dispatch Email & Activity Log]
```

### Key Business Rule for Face Processing
> [!IMPORTANT]
> **Multi-Face Rule:**
> Multi-face images are **not** rejected by default. The intended backend behavior is to enhance the image and attach the resulting file link to **every** matched person folder.

---

## 10. Admin Console Features

* **System Health**: Shows the status of the API, database, cache, background workers, storage, email and AI models, the process uptime and the processing queues. There is no CPU or memory figure because the backend does not report one.
* **User Accounts Controls**: System operators can search users on the server, see each account's upload count, and suspend or reactivate accounts.
* **Live Audit Traces**: Shows audit logs detailing actors, roles, actions, resource targets, and source IP addresses.
* **Security Monitoring**: Lists the alerts the backend raises (medium or high risk) and lets an administrator acknowledge one with a note.
* **Interactive API Playground**: Includes Swagger-styled REST details for `/api/auth/login`, `/api/user/images`, and others. Operators can hit "Send Request" to trigger simulation triggers and verify responses.
* **Upload and Quality Statistics**: Recharts charts of uploads, enhancements, rejections and storage over a chosen 7 / 30 / 90-day window. A figure the backend does not report is hidden, never estimated. The same pages show demo data when `VITE_USE_API` is false.

---

## 11. Moderator Panel Features

* **Review Queue**: Lists borderline files flagged by the quality validation step (e.g., high blur, low brightness, poor face-size ratio).
* **Human-in-the-Loop Audit Card**: Allows moderators to view the raw image, quality scores, face boundaries, and choose to **Approve** (forces override index and maps to person folders) or **Reject** (logs reason and removes from active database indexes).
* **Moderation Audit Log**: Tracks decision archives linking moderator accounts to approved or rejected items.

---

## 12. Mock Data

The mock datasets and schema typescript interfaces are stored in:
* [mock.ts](file:///Users/Ali/Downloads/FYP/src/data/mock.ts) (contains types for `ImageRecord`, `PersonFolder`, `ProcessingJob`, `SystemService`, `ReviewItem`, and `ApiEndpoint` along with initial mock state data).

All dashboard actions interact with temporary mock databases or `localStorage` schemas. These mocks are built to match standard JSON REST replies, making it straightforward to connect to actual HTTP endpoints later.

---

## 13. Backend Roadmap Summary

To transition this project into a production-grade application, a microservices backend is required.

### Required Backend Modules
1. **Auth Module**: JWT token emission, bcrypt password hashing, 2FA, email confirmation queues.
2. **Upload & Media Storage**: S3/R2 cloud storage buckets with pre-signed upload URLs and CDN cache proxies.
3. **Queue Manager**: Redis-backed message broker (e.g., BullMQ) to distribute processing workloads.
4. **AI Processing Workers**: Independent GPU-accelerated python instances processing image files.
5. **Quality & Validation**: Image processing scripts evaluating sharpness, lighting levels, and face bounding coordinates.
6. **Face Biometrics API**: Embedding extractor calculating similarity distances for database clustering.

### Suggested Backend Stack
* **API Service**: Node.js + TypeScript + NestJS / Express
* **Database**: **PostgreSQL** (relational storage for users, jobs, logs) + **Prisma ORM** ✅ Selected
* **Work Queue**: Redis + BullMQ (asynchronous job tracking)
* **Storage**: AWS S3 / Cloudflare R2
* **AI Worker Service**: Python + FastAPI
* **Deployment**: Frontend is uploaded to Hostinger as a static build; SPA routing comes from `public/.htaccess`. The Django backend is not deployed yet and runs locally.

> [!NOTE]
> **Supabase MCP is NOT required.** Local development uses Docker PostgreSQL (`docker-compose.yml`). Prisma handles all schema migrations and database access.

### Production AI Models
* **Zero-DCE**: Real-time low-light restoration.
* **GFPGAN / CodeFormer**: Blind face restoration and detail recovery.
* **Real-ESRGAN**: High-resolution image upscaling.
* **InsightFace**: Facial recognition and 128-D vector embeddings mapping.
* **MediaPipe**: Fast CPU-based face detection and landmarks mapping.

---

## 13b. Giving FaceCloud to an organization (customer onboarding)

FaceCloud is **multi-tenant**: one deployment serves many organizations, and each organization is a separate project. A person only ever sees their own organization's data; the backend answers "not found" for anything outside it.

**Who does what**

| Role | Belongs to | What they can do |
|:-----|:-----------|:-----------------|
| Platform administrator (FaceCloud staff) | The platform | Creates organizations and accounts, sees platform-wide statistics, security alerts and system health. Never part of a customer's organization. |
| Organization owner | One organization | Invites moderators and members, changes roles, deactivates or removes people, chooses what moderators see, sets the organization's name, colour and logo, sees the whole organization's activity and exports its data, from the My Organization page. |
| Moderator | One organization | Reviews uncertain photos, fixes person folders, manages batches and members, makes reports. Sees that organization only. |
| Member | One or more organizations | Uploads photos, optionally "Submit to" the team so its moderators can review them. Always sees their own workspace. |

**Setting up a new customer (all of it can be done in the admin console)**
1. **Create the owner's account**: Admin → Manage Users → Add User (role User). Hand over the sign-in details shown once.
2. **Create the organization**: Admin → Organizations → New organization (name, owner, plan).
3. **Create the moderator(s)**: Admin → Moderators → Create moderator, choosing the organization. Hand over the sign-in details and the direct link `/moderator/login`.
4. **Members join**: the moderator invites them by email (Moderator → Member Management → Invite Member). Each opens the emailed `/invitations/<token>` link, signs in or registers with that email, and joins.
5. **Members upload** and, from the upload page, choose "Submit to: <team>" so the team's moderators can review the photos.
6. **Check it works**: the moderator sees the photos under Batches, Rejected Images and the Review Queue; the administrator sees activity in Overview, Statistics and Audit Logs.

**Two ways to deliver the product**
- **Hosted (recommended):** you run one deployment (for example `api.facecloudai.com` plus the web app) and add each customer as an organization. Cheapest to run and update; data is separated by organization in the database and by the access rules above.
- **Dedicated:** a customer who needs their data on their own infrastructure gets their own deployment, built from the backend's VPS runbook (`docs/deployment/VPS_RUNBOOK.md`), with one organization and their own database, storage, keys and domain. More work per customer; the strongest separation.

**Before a customer's real faces go in:** face grouping needs each member's recorded consent (the consent card in My Images); photos are stored encrypted; a signed agreement should state what is stored, for how long, who in the organization can see it, and how to export or delete it.

**Built since the first version**: plan seat limits (free 1 moderator and 10 members, team 5 and 100, enterprise unlimited; the administrator sets the plan by hand), suspending an organization, a moderator seeing only the members they invited (plus members nobody invited), telling a member what a moderator decided, organization name, colour and logo, and signing up straight from an invitation.

**Not built yet (say so to a customer)**: payment and invoicing (there is no billing); per-organization storage quotas; single sign-on; deleting an organization and all its data in one step (an export exists; the removal design is written and waits for a decision).

---

## 14. Installation and Local Development

### Frontend Setup

#### Prerequisites
* **Node.js** (v18.x or higher recommended)
* **npm** or **yarn**

#### Steps
1. **Clone the repository** and navigate to the project directory:
   ```bash
   cd fyp
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Start the development server**:
   ```bash
   npm run dev
   ```
   The local application will launch on:
   ```txt
   http://localhost:5173
   ```
4. **Compile and test the production build**:
   ```bash
   npm run build
   ```
5. **Preview the production bundle locally**:
   ```bash
   npm run preview
   ```

---

## 15. Backend

The backend is a separate Django project:
**https://github.com/ijaz-student021/FaceCloud_backend**

It is a REST API (Django 6 + DRF, PostgreSQL, Celery, Redis) with 175 endpoints,
JWT authentication with optional two-factor, organizations and moderation,
and an OpenAPI schema served at `/api/docs/`. Its own README covers setup.

This repository is the browser application only. It talks to that API over HTTP
and never touches a database, so there is no ORM, schema or migration here.

> [!NOTE]
> An earlier `backend/` folder in this repository held a parallel Prisma schema
> drafted before the Django backend existed. It was never an API — only a schema
> and a seed script — and its models disagreed with the ones actually in use. It
> was removed on 2026-10-02; see `WORK_LOG.md`.

### Pointing the frontend at it

```bash
cp .env.example .env
```

| Variable | Meaning |
|:---------|:--------|
| `VITE_API_URL` | Backend origin, no trailing slash. `http://127.0.0.1:8000` for a local backend |
| `VITE_USE_API` | `true` to call the API; anything else keeps the built-in mock data |

The flag exists so screens can be migrated one at a time: with `VITE_USE_API`
unset the demo dashboard stays populated, and each screen switches over as its
API calls are written. The sign-in screen is wired; the rest still read
`src/data/mock.ts`.

The backend only accepts browser requests from the origins listed in its
`CORS_ALLOWED_ORIGINS`, so add this app's origin there before testing against a
deployed backend.

## 16. Deployment

* **Live host**: `facecloudai.com` is served from **Hostinger** (Apache/LiteSpeed). Deployment is a manual upload of
  the `dist/` folder to the web root.
* **SPA Routing Configuration**: React Router owns every path, so the server must return `index.html` for any route
  that is not a real file. Two config files cover this, and both are built from `public/`:
  * `public/.htaccess` — the one that matters for the live site. It ships inside `dist/` on every build.

> [!WARNING]
> **Build the hosting copy as the demo, not with your local settings.** `.env.local` (which points at `http://127.0.0.1:8000` and turns the API on)
> is read by every `npm run build` on your own machine, so a build made there carries that address and every visitor's browser would try to
> reach *their* localhost. Build it with the settings overridden:
> `VITE_USE_API=false VITE_API_URL= npm run build`, and check that `grep -c "127.0.0.1:8000" dist/assets/index-*.js` prints `0`
> before uploading. (A build made from a clean checkout, which has no `.env.local`, is safe too.)

> [!IMPORTANT]
> **`.htaccess` is a hidden file.** Most file managers and FTP clients do not show names beginning with a dot, so it
> is easy to upload `dist/` without it. If it is missing from the web root, every deep link (`/admin`, `/dashboard`,
> `/login`) returns the host's own 404 page — the app only works from `/`. Turn on "show hidden files" before
> uploading, and check the web root afterwards.

---

## 17. Known Limitations

* **No Server Persistence**: Data created during a browser session (uploaded photos, logs, changes) is stored in local memory or `localStorage`. Refreshing or clearing storage resets the mock data.
* **Client-Side Simulation**: Image filter outputs use browser canvas contexts (`ctx.filter`) rather than deep-learning GPU model logic.
* **Webcam Performance**: The real-time face tracker depends on client CPU capabilities. Frame rates may degrade on older hardware with multiple background tasks.
* **No Real Emails**: Email notification events are logged to the dashboard database but do not send actual SMTP emails.
* **Testing**: the `qa/` folder holds the QA scripts, test plan, bug log and the latest report (`qa/README.md`). `bash qa/start-test-stack.sh` starts a throwaway copy of the backend with test accounts and runs nothing against your own servers. The scripts cover sign-in and roles, API security and hostile uploads, every page at desktop and phone width, accessibility basics, the upload screens, rate limits, the main business flow, enhancement quality, the photo editor, a moderator's actions, settings and password change, the administrator's actions and what happens when the server is unreachable, slow, throttled or a request is sent twice. A script (`qa/scripts/16-polish.mjs`) compares the enhancement engine before and after a change, pixel for pixel. Person folders and the background-worker path are still checked by hand.

---

## 18. Future Work

* **API Integration**: Swap local mock data services for Axios/Fetch clients communicating with the Node.js API Gateway.
* **Database Integration**: Connect the client to a PostgreSQL database via backend endpoints to persist uploaded files and jobs permanently.
* **Storage Service Link**: Bind the upload forms to upload direct binaries to storage buckets.
* **PyTorch AI workers**: Route jobs in the Redis queue to Python workers running GFPGAN/CodeFormer models.
* **Unit & E2E Testing**: Add Jest unit tests and Playwright integration pipelines.
* **Accessibility (a11y)**: Audit focus indicators, keyboard bindings, and ARIA labels.

---

## 20. Branding

FaceCloud utilizes a dark luxury, premium branding style built around the official FaceCloud logo:

* **Official FaceCloud Logo**: Represents the single source of truth for the platform's visual identity.
  * Location: [facecloud-logo-original.png](file:///Users/Ali/Downloads/FYP/public/branding/facecloud-logo-original.png)
* **Logo Variants**: Available under `public/branding/` for different UI surface areas:
  * `facecloud-logo-full.png`: Full version with electric blue cloud, metallic silver FC insignia, human face profile, neural-network nodes, wordmark, and subtitle. Used on login pages.
  * `facecloud-logo-horizontal.png`: Horizontal layout optimized for sidebars and top navigation bars.
  * `facecloud-logo-icon.png`: Icon-only variant for collapsed layouts and avatar elements.
  * `facecloud-wordmark.png`: Text-only wordmark.
  * `facecloud-logo-dark.png` / `facecloud-logo-light.png`: Dark/light background variants.
* **Favicon Assets**: Optimized icon-only favicons in multiple resolutions (`16x16`, `32x32`, `48x48`, `192x192`, `512x512`) and `facecloud-apple-touch-icon.png`.
* **Design Integration**: Rendered exclusively via the reusable `FaceCloudLogo` component (`src/components/branding/FaceCloudLogo.tsx`).
* **Brand Colors**:
  * Electric Blue: `#168BFF`
  * Bright Blue: `#42A5FF`
  * Deep Blue: `#0758D8`
  * Metallic Silver: `#C9D2E3`
  * Off-white: `#F5F8FF`
  * Deep Black/Navy: `#030712` / `#07101F`
* **DATAMART Relationship**: FaceCloud is powered by **DATAMART / DTM.IO**. Datamart is kept as secondary text to maintain FaceCloud as the primary user-facing brand.

> [!IMPORTANT]
> **Branding Rule:**
> The official FaceCloud logo must be used across all public, user, admin, and moderator interfaces. Do not use temporary icons, text-only placeholders, generic cloud marks, or alternative FaceCloud logos. All application layouts must use the reusable `FaceCloudLogo` component and assets from `public/branding/`.

---

## 21. Interactive Demo

The Interactive Demo uses a locally stored facial image with frontend visual filters to demonstrate the intended original-versus-enhanced experience until the production FaceCloud AI processing service is connected.

* **Demo Image Asset Path**: [facecloud-enhancement-demo-original.jpg](file:///Users/Ali/Downloads/FYP/public/demo/facecloud-enhancement-demo-original.jpg)
* **Visual Filters**:
  * Original (Before): `filter: brightness(0.72) contrast(0.88) saturate(0.84)`
  * AI Enhanced (After): `filter: brightness(1.08) contrast(1.08) saturate(1.03)`

---

## 22. Development Rule

> [!IMPORTANT]
> **Core Development Workflow:**
> After completing every major feature, bug fix, route change, or UI update:
> 1. Run `npm run build`
> 2. Resolve all compilation and linting errors.
> 3. Update the `README.md` file to document new features or modifications, and add a dated entry to `WORK_LOG.md` (the running work log, Section 2).
> 4. Commit changes with a descriptive, concise message.
> 5. Push to the `origin main` branch.
> 
> **Do not leave the README outdated. It must always reflect the current status of the codebase.**
