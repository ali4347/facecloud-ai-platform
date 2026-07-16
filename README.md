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

The frontend is built as a production-style UI prototype. Authentication, uploads, AI processing, notifications, admin data, and moderator actions are currently simulated with mock data and `localStorage` persistence until the backend is connected.

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
* **Background**: Clean dark palette (`#050816` primary background).
* **Glassmorphism**: Backdrop blur panels (`backdrop-filter: blur(24px)`) styled with subtle border stroke overlays (`rgba(96, 177, 255, 0.12)`).
* **Color Accents**: Indigo/violet + cyan accent gradients (Blue `#0084FF`, Cyan `#60B1FF`, Mint/Green `#4FFFB0`, Violet `#A78BFA`, and Pink `#FF518D`).
* **Visual Effects**: Micro-animations on buttons and cards using Framer Motion, dynamic hover transitions, and pulse glows on status badges.
* **Landing Page**: Implements a fullscreen video hero streaming an HLS background video using `hls.js` with fallback support for native Safari HLS. Features a "live systems" data-ops aesthetic with status badges, terminal-style logs, live pipeline cards, and animated percentage indicators.
* **Responsive Layouts**: Multi-device sidebars that automatically collapse on mobile screens with responsive top header bars.

### Landing Page Sections (in order)
1. **Fullscreen Video Hero** — HLS background video, staggered headline animation, inline email waitlist capture, pill badge pop-in.
2. **Trusted Logos Marquee** — Infinite horizontal scroll of partner logos.
3. **Stats / Metrics Bar** — 4 animated CountUp counters (detection accuracy, processing time, images processed, RBAC roles).
4. **Dataset Challenge (Problem Cards)** — 5 problem cards with staggered scroll reveal and icon pop animations.
5. **Use Cases / Who It's For** — 4 cards: Identity Verification, Event Photography, HR & Onboarding, Enterprise Photo Archives.
6. **AI Infrastructure** — Live-looping pipeline panel cycling PENDING → ACTIVE → SUCCESS status badges.
7. **Ingestion Suite** — 12-card feature grid with staggered reveal and hover glow.
8. **Methodology** — The Methodology section uses a responsive three-column FreedomSection layout with an HLS-hosted processing visual, operational pain points, and FaceCloud workflow benefits. The HLS source is loaded through hls.js, while Safari uses native HLS support. Other compatible browsers use hls.js. The video is decorative and muted.
9. **Interactive Demo** — Before/after slider with auto-demo scroll trigger (0→50%).
10. **Processing Options** — Single, Multiple, ZIP upload cards.
11. **Pricing** — Monthly/Yearly toggle, 3 tier cards (Free/Basic/Pro) with highlighted Pro tier.
12. **User Interface** — 3 dashboard preview mockup cards.
13. **Administrative Control** — Admin Console and Moderator Review cards with accent-colored hover glows.
14. **Enterprise Security** — Security points grid + animated terminal log feed with typewriter effect.
15. **FAQ** — Accordion with Framer Motion layout height animation.
16. **API / Integrations Teaser** — Terminal-style code block showing example REST request.
17. **Final CTA** — Call to action with gradient orb background.
18. **Footer** — Logo, Product links (Features, Methodology, Pricing, Security, FAQ), Portals, Compliance.

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
* `/login` (User Login)
* `/register` (User Registration)
* `/signup` (Redirects to `/register`)
* `/verify-email` (Mock Email Verification screen)
* `/admin/login` (Admin Console Login)
* `/moderator/login` (Moderator Panel Login)
* `/unauthorized` (Access Denied page)
* `*` (Not Found / 404 page)

### User Portal Routes (under `/dashboard`)
* `/dashboard` (User Dashboard Overview)
* `/dashboard/upload` (Upload Center Gateway)
* `/dashboard/upload/single` (Single Image Upload and AI comparison)
* `/dashboard/upload/multiple` (Multiple Batch Upload queue)
* `/dashboard/upload/zip` (ZIP Archive processing and metrics)
* `/dashboard/processing/:id` (Real-time single job processing tracker)
* `/dashboard/images` (My Images gallery browser)
* `/dashboard/images/:id` (Image Detail, EXIF data, and enhancement controls)
* `/dashboard/groups` (Person Folders / Identity Groups collection)
* `/dashboard/groups/:id` (Group Detail view showing all images matching that cluster)
* `/dashboard/downloads` (Secured downloads and PDF reports generation list)
* `/dashboard/notifications` (System alert logs and settings notifications)
* `/dashboard/activity` (Personal user auditing event stream)
* `/dashboard/settings` (Profile controls and simulated email options)
* `/dashboard/live-enhancement` (Webcam real-time face landmark viewer and enhancement controls)
* `/dashboard/jobs` (Batch job history directory)

### Admin Console Routes (under `/admin`)
* `/admin` (Admin Overview metrics and telemetry)
* `/admin/users` (User directories, state controls, suspension logs)
* `/admin/audit-logs` (System activity logs and administrative audit traces)
* `/admin/security` (Risk alerts, failed logins monitor, IP blocking logs)
* `/admin/api-docs` (Swagger-like interactive API documentation explorer)
* `/admin/api-test` (Sandbox playground to test REST requests using mock answers)
* `/admin/system` (Server instances CPU/RAM levels, service uptime statuses)
* `/admin/upload-statistics` (Upload volume charts and file sizes charts)
* `/admin/rejection-summary` (Quality-based rejection charts and metrics)
* `/admin/images` (Image surveillance stream and content logs)
* `/admin/logs` (Redirects to `/admin/audit-logs`)

### Moderator Routes (under `/moderator`)
* `/moderator` (Moderation Metrics dashboard)
* `/moderator/queue` (Rejected or borderline images awaiting decision)
* `/moderator/images/:id` (Human-in-the-loop audit detail view)
* `/moderator/audit` (Historical review log matching decisions to actors)
* `/moderator/settings` (Moderator interface threshold settings)

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

* **System Telemetry**: Displays RAM, CPU, database load, and active job queues across servers.
* **User Accounts Controls**: System operators can search users, inspect account upload quotas, and trigger status updates (e.g., active, suspended).
* **Live Audit Traces**: Shows audit logs detailing actors, roles, actions, resource targets, and source IP addresses.
* **Security Monitoring**: Displays risk status graphs, failed logins, and suspicious API rate-limit alerts.
* **Interactive API Playground**: Includes Swagger-styled REST details for `/api/auth/login`, `/api/user/images`, and others. Operators can hit "Send Request" to trigger simulation triggers and verify responses.
* **Upload and Quality Statistics**: Incorporates Recharts charts demonstrating upload volumes, resolution distributions, and quality rejection categories.

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
* **Deployment**: Frontend hosted on Vercel; Backend services deployed on Railway, Render, or AWS ECS via Docker.

> [!NOTE]
> **Supabase MCP is NOT required.** Local development uses Docker PostgreSQL (`docker-compose.yml`). Prisma handles all schema migrations and database access.

### Production AI Models
* **Zero-DCE**: Real-time low-light restoration.
* **GFPGAN / CodeFormer**: Blind face restoration and detail recovery.
* **Real-ESRGAN**: High-resolution image upscaling.
* **InsightFace**: Facial recognition and 128-D vector embeddings mapping.
* **MediaPipe**: Fast CPU-based face detection and landmarks mapping.

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

## 15. Backend Database Setup (PostgreSQL + Prisma)

> [!IMPORTANT]
> **Database: PostgreSQL** ✅ — Running locally, schema applied, seed data loaded.
> **Supabase MCP is NOT required** and should NOT be used.
> **Prisma ORM** manages all schema definitions, migrations, and queries.

### Database Status
| Component | Status | Details |
|:----------|:-------|:--------|
| PostgreSQL | ✅ Running | `localhost:5432` / database `facecloud` |
| Schema | ✅ Applied | 15 tables created via `prisma db push` |
| Migration | ✅ Tracked | `20260714_init` marked as applied |
| Seed Data | ✅ Loaded | user / admin / moderator accounts created |

### Seeded Accounts (default password: `password`)
| Role          | Email                    |
|:--------------|:-------------------------|
| **User**      | `user@facecloud.ai`      |
| **Admin**     | `admin@dtm.io`           |
| **Moderator** | `moderator@facecloud.ai` |

### Prerequisites
* **PostgreSQL** installed and running locally (or via Docker)
* **Node.js** v18.x or higher

### Setup Steps

#### 1. Configure Environment Variables
```bash
cp .env.example .env
# Edit .env and set your DATABASE_URL:
DATABASE_URL="postgresql://facecloud:facecloud123@localhost:5432/facecloud?schema=public"
REDIS_URL="redis://localhost:6379"
```

#### 2. Install Backend Dependencies
```bash
cd backend
npm install
```

#### 3. Apply the Database Schema
```bash
# If user has CREATE DATABASE privilege (shadow DB required):
npx prisma migrate dev --name init

# Alternative — if user lacks CREATE DATABASE (use db push):
DATABASE_URL="postgresql://..." npx prisma db push
```

#### 4. Seed the Database
```bash
npm run seed
```

#### 5. Inspect with Prisma Studio (Optional)
```bash
npx prisma studio
# Opens at http://localhost:5555
```

### Database Tables Created (15 models)
```
users                  — User accounts (roles: USER, ADMIN, MODERATOR)
sessions               — JWT refresh token sessions
uploads                — Raw file upload records
images                 — Processed image records
detected_faces         — Per-image face bounding boxes
image_quality_checks   — Sharpness / brightness / face-size scores
face_embeddings        — 128-D InsightFace/ArcFace vectors
person_folders         — Identity group / face cluster folders
person_folder_images   — Image ↔ Person Folder junction table
processing_jobs        — Async pipeline job records
processing_steps       — Individual pipeline stage steps
notifications          — User notification messages
activity_logs          — Per-user action event stream
admin_audit_logs       — Immutable admin-level audit trail
moderator_reviews      — Human-in-the-loop review queue
```

### Backend File Structure
```
backend/
├── package.json              # Prisma, bcryptjs, ts-node
├── tsconfig.json             # TypeScript config for scripts
└── prisma/
    ├── schema.prisma         # Full Prisma schema (15 models)
    ├── seed.ts               # Seed: user / admin / moderator
    └── migrations/
        ├── migration_lock.toml
        └── 20260714_init/
            └── migration.sql # Full initial schema SQL

docker-compose.yml            # Optional: PostgreSQL 16 + Redis 7
.env.example                  # Environment variable template
.env                          # Local secrets (gitignored)
```

---

## 16. Deployment

* **Hosting Platforms**: The application is configured for deployment on static hosting providers like Vercel, Netlify, or AWS Amplify.
* **SPA Routing Configuration**: For React Router's client-side routing to function correctly on page reloads, a rewrite rule is required. The Vercel configuration file is located at `vercel.json` and directs all requests to `index.html`.

---

## 17. Known Limitations

* **No Server Persistence**: Data created during a browser session (uploaded photos, logs, changes) is stored in local memory or `localStorage`. Refreshing or clearing storage resets the mock data.
* **Client-Side Simulation**: Image filter outputs use browser canvas contexts (`ctx.filter`) rather than deep-learning GPU model logic.
* **Webcam Performance**: The real-time face tracker depends on client CPU capabilities. Frame rates may degrade on older hardware with multiple background tasks.
* **No Real Emails**: Email notification events are logged to the dashboard database but do not send actual SMTP emails.

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
> 3. Update the `README.md` file to document new features or modifications.
> 4. Commit changes with a descriptive, concise message.
> 5. Push to the `origin main` branch.
> 
> **Do not leave the README outdated. It must always reflect the current status of the codebase.**
