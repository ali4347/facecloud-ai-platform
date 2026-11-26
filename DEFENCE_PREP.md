# FaceCloud — Frontend Defence Preparation (Roman Urdu + English)

> **Kis ke liye:** Ali Hassan, FYP defence (Wednesday 25 Nov 2026) ki tayyari. / For Ali's own revision before the defence.
> **Scope:** sirf **frontend** (`~/Downloads/FYP`). Backend Ijaz ka hai; jahan frontend backend par depend karta hai wahan clearly likha hai.
> **Sach ka usool:** har baat is repo ke code se li gayi hai (file ka naam saath hai). Jo cheez maine verify nahi ki, uske saamne **[check nahi kiya]** likha hai.
> **How to read:** har topic mein pehle Roman Urdu, phir English. File paths `src/...` repo ke andar hain.

---

## 0. 60-second pitch / 60 second ka introduction

**Roman Urdu:**
FaceCloud ek AI facial-image enhancement platform hai. User photo (ya ZIP) upload karta hai, system pehle quality aur face check karta hai, phir AI se photo enhance karta hai (noise, blur, low-light, face restoration, upscale). Ek hi insaan ki photos automatically "Person Folders" mein group ho jati hain. Teen portal hain: **User**, **Moderator** (team ki photos review karta hai) aur **Admin** (poora system dekhta hai). Frontend **React 19 + TypeScript + Vite + Tailwind** mein bana hai, ek **single-page application (SPA)** hai, aur backend se **REST API + JWT tokens** ke zariye baat karta hai.

**English:**
FaceCloud is an AI facial-image enhancement platform. A user uploads a photo (or a ZIP); the system first checks quality and faces, then enhances it with AI (denoise, deblur, low-light, face restoration, upscaling). Photos of the same person are grouped automatically into "Person Folders". There are three portals: **User**, **Moderator** (reviews a team's photos) and **Admin** (oversees the system). The frontend is a **React 19 + TypeScript + Vite + Tailwind** single-page application that talks to the backend over a **REST API with JWT tokens**.

**Numbers (is repo se, `find`/`grep` se gine):** `src/` mein ~37,700 lines TypeScript/TSX; 95 page files (demo + live versions alag files hain, is liye count zyada hai); 90 component files; 31 files `src/lib/api/` mein (har backend area ka apna module); 82 `<Route>` entries `src/App.tsx` mein; sirf 2 env variables (`VITE_API_URL`, `VITE_USE_API`).

---

## 1. Languages & formats / Zabanain aur formats

| Language / format | Roman Urdu: kahan aur kyun | English: where and why |
|---|---|---|
| **TypeScript** (`.ts`, `.tsx`) | Poora app (`src/`). JavaScript ka typed version: galti build ke waqt pakri jati hai, runtime par nahi. | Entire app. Typed JavaScript: mistakes are caught at build time. |
| **TSX** (JSX in TypeScript) | Component ke andar HTML jaisa syntax likhte hain; build ke baad normal JavaScript ban jata hai. | HTML-like syntax inside components; compiled to plain JS. |
| **CSS** (+ **Tailwind** utility classes, CSS variables) | `src/index.css`, `ProcessingSummaryBox.module.css`, `MacBookDemoFrame.css`; baqi styling class names se (`className="..."`). | Global CSS, one CSS Module, plus Tailwind classes everywhere else. |
| **HTML** | Sirf `index.html` (ek `<div id="root">`); React baqi page banata hai. | Only `index.html`; React renders the rest. |
| **JavaScript (ESM)** `.mjs` | QA test scripts `qa/scripts/*.mjs` (browser ko Chrome DevTools Protocol se chalate hain). | QA scripts under `qa/scripts` that drive a browser. |
| **Python** | Sirf `qa/seed.py` (test data). Frontend Python mein nahi hai. | Only the QA seeding script; the frontend is not Python. |
| **Bash** | `qa/start-test-stack.sh`, `stop-test-stack.sh` (test servers), `.claude/hooks/check-work-log.sh`. | Test-stack and hook scripts. |
| **YAML** | `.github/workflows/ci.yml` (GitHub Actions CI). | CI pipeline definition. |
| **Apache config** | `public/.htaccess` — SPA fallback + caching (Hostinger). | SPA fallback rewrite + cache headers. |
| **JSON** | `package.json`, `tsconfig*.json`; API ke jawab bhi JSON. | Package/TS config; API payloads. |
| **Markdown** | `README.md`, `WORK_LOG.md`, `README_BACKEND_ROADMAP.md`, `qa/*.md`. | Documentation. |

**Viva Q: "Frontend mein kaunsi programming language hai?"**
- **Roman:** TypeScript (React ke saath). Browser sirf JavaScript samajhta hai, is liye Vite build ke waqt TypeScript ko JavaScript mein badal deta hai.
- **English:** TypeScript with React. Browsers only run JavaScript, so Vite compiles TS to JS at build time.

**Viva Q: "TypeScript kyun, JavaScript kyun nahi?"**
- **Roman:** Itne bade project (37k lines, 31 API modules) mein backend ke jawab ki shape (`ImageListItem`, `EnhancementResult`...) type se likhi hai; agar backend field badle ya hum galat field padhen to `npm run build` mein hi error aa jata hai.
- **English:** With ~37k lines and 31 API modules, response shapes are typed (e.g. `ImageListItem`, `EnhancementResult` in `src/lib/api/`); a wrong field is caught by `tsc` during `npm run build`, not by a user.

---

## 2. Tech stack — har cheez kya hai, kahan use hui, kyun / Every technology

Versions `package.json` se hain.

| Technology (version) | Roman Urdu: ye kya hai + hum ne kahan use kiya | English: what it is + where used | Count/Where |
|---|---|---|---|
| **React 19.2** | UI library: screen ko chhote **components** mein todta hai; data badalta hai to sirf zaroori hissa dobara draw hota hai. Poora app. | UI library built on components and state; re-renders only what changed. | whole `src/` |
| **react-dom** + `createRoot` | React ko browser ke `<div id="root">` mein lagata hai. `src/main.tsx`. `StrictMode` mein wrap hai (development mein effects 2 baar chalte hain taake bugs pakre jayen). | Mounts React into the DOM; `StrictMode` double-runs effects in dev to expose bugs. | `src/main.tsx` |
| **TypeScript 6.0** | Type checking. `tsc -b` build ka pehla step hai. Strict flags: `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`. | Type checker; first step of the build. | `tsconfig.app.json` |
| **Vite 8** (+ `@vitejs/plugin-react`) | Build tool + dev server. Dev mein turant reload; `vite build` se `dist/` banta hai (minified JS/CSS). Config `vite.config.ts` bohat chhota hai (sirf React plugin). | Build tool/dev server; `vite build` produces `dist/`. | `vite.config.ts` |
| **react-router-dom 7.18** | Page badalne (routing) ka kaam bina page reload ke. `BrowserRouter` (clean URLs, `#` nahi), `<Routes>`, `<Route>`, nested routes + `<Outlet>`, `<Navigate>`, `useNavigate`, `useLocation`, `useSearchParams`. | Client-side routing. | `src/App.tsx` (82 routes), 11 se zyada pages |
| **Tailwind CSS 3.4** + PostCSS + Autoprefixer | Utility-first CSS: `className="p-4 rounded-2xl"` jaisi chhoti classes. Humne custom colours bana kar **CSS variables** se jodey (`ink`, `surface`, `accent`, `line`) taake ek hi class dark aur light dono mein chale. | Utility-first CSS; custom colour tokens bound to CSS variables so one class works in both themes. | `tailwind.config.ts`, `src/index.css` |
| **clsx + tailwind-merge** | Conditional class names jodna (`clsx`) aur Tailwind ki conflicting classes saaf karna (`twMerge`). Helper `cn()` — sirf 1 file mein. | Conditional class joining + conflict resolution. | `src/lib/utils.ts` |
| **framer-motion 12** | Animations: page/landing reveal, hero, sidebar, floating nav, counters, `AnimatePresence` (element ka exit animation). | Animation library. | 15 files (landing, nav, shell, `src/components/animation/*`) |
| **lucide-react** | Icon set (SVG icons as components). | Icon library. | 147 files |
| **recharts 3.9** | Charts (hamare code mein **PieChart** + `ResponsiveContainer`, `Tooltip`, `Legend`). Admin/User dashboards. | Chart library. | 4 files (e.g. `RejectionReasonChart.tsx`, `ChartCard.tsx`) |
| **@mediapipe/tasks-vision 0.10** | Google ka browser AI: **FaceDetector** (BlazeFace). Live Enhancement mein camera frame par chehra browser ke andar hi dhoondta hai, server ko bheje bina. Model `.tflite` aur WASM CDN se load hotay hain; fallback local `public/mediapipe/blaze_face_short_range.tflite`. | In-browser face detection for the live camera panel. | `LiveEnhancementPanel.tsx` (lines ~3, 154-202) |
| **hls.js 1.6** | HLS video streaming (`.m3u8`) chalane ke liye; sirf landing ke ek section ki video mein. | HLS video playback, landing "Freedom" section only. | `components/landing/FreedomSection.tsx` |
| **oxlint 1.71** | Fast linter (code ki aam galtiyan/warnings). `npm run lint`. CI mein `npx oxlint src`. | Fast linter. | CI + `package.json` |
| **@radix-ui/\*, class-variance-authority** | ⚠️ **Dependencies mein hain lekin `src/` mein kahin import nahi hui** (grep se 0 files). Pehle shadcn-style UI ke liye lagayi thi; ab hamare apne components hain (`Modal`, `ConfirmDialog`, ...). Agar examiner `package.json` dekh kar poochhe to sach bolna: "installed hain, use nahi hoti". | ⚠️ Installed but **not imported anywhere** in `src/` (0 files). Be honest if asked. | — |

**Jo hum ne khud likha (library nahi):** API client (`src/lib/api/client.ts`), modal/dialog (`Modal.tsx`), toast-style notice bar (`NoticeBar.tsx`), before/after slider (`BeforeAfterSlider.tsx`), ZIP reader (`zipContents.ts`), theme system (`theme.ts`), pagination (`Pager.tsx`), data hook (`useApiResource.ts`). Viva mein ye bata sakte ho: "ye hum ne khud banaya, library nahi lagayi."

---

## 3. Project structure / Folder ka naqsha

```
src/
  main.tsx            entry: theme apply + <App/> render
  App.tsx             saare routes (public, /dashboard, /admin, /moderator)
  pages/              ek screen = ek file (public, user/, admin/, moderator/)
  components/
    layout/           AppShell, Sidebar, Topbar, FloatingNav, ProtectedRoute, GlobalSearch
    ui/               chhote reusable: Modal, ConfirmDialog, AuthedImage, StatCard, DataTable, Pager, ErrorBoundary
    features/         bade feature widgets: ImageCard, EnhancementReport, LiveEnhancementPanel, BatchPhotoResults...
    public/ landing/  marketing site (Hero, BackgroundVideo, Navbar)
    admin/ moderator/ auth/ animation/ branding/
  lib/
    api/              31 files: client.ts (core), auth.ts, images.ts, enhancements.ts, ... (har backend area ka module)
    useApiResource.ts data fetching hook; imageData.ts polling hooks; theme.ts; session.ts; portal.ts
  data/mock.ts        demo data (jab backend nahi)
public/               static: videos, .htaccess, mediapipe model, logos
qa/                   test scripts + backend gap register + prompts for backend engineer
```

**Q: "Folder structure kyun aisa?" / Why this structure?**
- **Roman:** `pages` = URL se jude screens; `components` = dobara istemal hone wale tukde; `lib/api` = network ki saari baat ek jagah, taake screen ko `fetch` ka pata hi na ho. Isse backend badle to sirf `lib/api` badalna parta hai.
- **English:** `pages` map to URLs, `components` are reusable pieces, and all networking lives in `lib/api` so screens never call `fetch` directly; a backend change touches one layer.

---

## 4. Architecture — kaam kaise chalta hai / How the pieces work

### 4.1 SPA + Routing

- **Roman:** Browser sirf ek `index.html` leta hai. React Router URL dekh kar sahi page component dikhata hai, bina server se naya page maange. Is liye hosting par `public/.htaccess` hai: agar koi `/dashboard/images` seedha kholay ya refresh kare, server "file nahi mili" ke bajaye `index.html` de deta hai, phir React route sambhalta hai.
- **English:** The browser loads one `index.html`; React Router renders the right component for the URL. `public/.htaccess` rewrites unknown paths to `index.html`, otherwise refreshing a deep link would 404 on Hostinger.
- **Nested routes (`App.tsx`):** `/dashboard` ek layout route hai (`<AppShell role="user"/>`) jis ke andar child pages `<Outlet/>` mein aate hain, is liye sidebar/topbar har page par dobara nahi banta.
- **Redirects:** `<Navigate>` purane URLs ko naye par bhejta hai (jaise `/dashboard/places` → `/dashboard/images`, `/signup` → `/register`).
- **Weakness (sach):** koi `React.lazy`/code-splitting nahi (grep: 0). Isi liye build ek bara `index-*.js` (~3.2 MB, gzip ~810 kB) banata hai aur Vite size warning deta hai. / No code-splitting, so one ~3.2 MB bundle (Vite warns).

### 4.2 Teen portal aur role protection / Three portals and role protection

- **Roman:** `ProtectedRoute` (user/admin) aur `ModeratorAccessGate` check karte hain ke us portal ka session `localStorage` mein hai ya nahi; nahi ho to us portal ke login par bhejte hain (`/login`, `/admin/login`, `/moderator/login`); role ghalat ho to `/unauthorized`. **Har portal ki apni keys** hain (`facecloud_session:<portal>`, `facecloud_refresh:<portal>` — `src/lib/portal.ts`), taake admin ek tab mein login kare to dusre tab ka user session na tootay (ye ek asli bug tha jo fix hua).
- **English:** `ProtectedRoute` checks that the portal's own session exists, else redirects to that portal's login; wrong role → `/unauthorized`. Each portal stores its tokens under its own key so signing in as admin doesn't overwrite a user tab.
- **⚠️ Zaroori sawal / The key question: "Kya frontend ka check security hai?"**
  - **Roman:** Nahi. `ProtectedRoute` sirf **UX** hai (galat page na dikhe). Asli security **backend** hai: har API call par JWT check hota hai aur backend role/ownership check karta hai (doosre ka record maange to 404 deta hai — `client.ts` comment). Koi frontend check bypass kar bhi le to data nahi milega.
  - **English:** No. The guard is UX only. Real enforcement is the backend (JWT on every call, role/ownership checks; someone else's record returns 404).
  - Code se dikhne wali limit: `ProtectedRoute` sirf `localStorage` ka stored session dekhta hai (`readSessionRaw`), token verify nahi karta — verify backend karta hai.

### 4.3 Authentication / JWT flow (`src/lib/api/client.ts`, `tokens.ts`, `auth.ts`)

**Roman Urdu:**
1. Login par backend **access token** (chhota, ~15 min) aur **refresh token** deta hai.
2. **Access token sirf memory mein** (JS variable) rakha jata hai — `localStorage` mein nahi — taake XSS bug se seedha chori na ho.
3. **Refresh token `localStorage` mein** (reload ke baad login rakhne ke liye). Ye **rotate** hota hai: har refresh par naya milta hai aur purana mar jata hai, is liye naya hamesha save karna zaroori hai.
4. Page reload par access token gayab hota hai; pehli request se pehle client refresh token se naya access token le leta hai (`request()` ke shuru mein), 401 ka intezaar nahi karta.
5. Agar server `401` + `code: token_not_valid` de to **ek baar refresh** karke wohi request dobara bhejta hai.
6. Bohat si requests ek saath expire hon to **sirf ek refresh** chalta hai (`refreshInFlight` promise), baqi usi ka intezaar karti hain — warna rotation ki wajah se baaki refresh fail ho kar session maar dete.
7. Phir bhi 401 ho to tokens saaf + `facecloud:session-lost` event; `AppShell` sun kar user ko login par bhejta hai.

**English:** Short-lived access token kept **in memory only**; rotating refresh token in `localStorage` per portal. On reload the client exchanges the refresh token before the first request. On `401 token_not_valid` it refreshes once and retries. Concurrent refreshes are collapsed into one promise (`refreshInFlight`) because rotation would invalidate the extras. If recovery fails it fires `facecloud:session-lost` and the shell signs the person out.

- **Q: "localStorage mein token kyun? XSS?"** — **Roman:** Trade-off hai. Access token memory mein hai (chhota). Refresh token localStorage mein hai kyunki reload ke baad session chahiye; usay rotate karte hain aur backend usay revoke kar sakta hai ("logout everywhere" `auth.ts: logoutEverywhere`). HttpOnly cookie behtar hoti, lekin wo backend ka design hai [kya backend cookie support karta hai — check nahi kiya]. **English:** A documented trade-off: refresh token must survive reload; mitigated by rotation + server-side revoke. HttpOnly cookies would be stronger but need backend support.
- **Q: "Cookies/CORS?"** — `fetch` mein `credentials` nahi bheji jati; sirf `Authorization: Bearer` header. CORS backend ki settings par hai. / No cookies are sent; only a bearer header. CORS is configured on the backend.
- **Auth ke aur features (`auth.ts`):** register, email verify (`/verify-email?registration_id&token`), resend link, forgot/reset password (`/reset-password/:uid/:token`), account invitation (`/accept-invitation?token`), team invitation (`/invitations/:token`), change password, change email confirmation, logout / logout everywhere, `restoreSession`.

### 4.4 API client ki khaas baatein (kamal ki cheezein) / Notable client features

1. **Request de-duplication (reads):** ek page ke kai hisse (sidebar, topbar, screen) same GET maangte the → ek hi request jati hai (`sharedReads` map), jab tak jawab na aaye. Server ke hourly limit (1000 requests/user) ko bachane ke liye. Jawab aate hi cache khatam — stale data kabhi nahi.
2. **Double-click protection (writes):** wohi POST/PATCH/DELETE jab pehla chal raha ho dobara maange to wo pehle ka intezaar karti hai (`sharedChanges`).
3. **AbortController:** screen band ho jaye to request cancel (`signal`), taake purana jawab naye screen par state na likhe.
4. **Error ko insani zabaan mein:** DRF ke alag error shapes (`detail`, field errors, `ErrorDetail(...)`) se ek sentence nikalta hai (`messageFrom`, `plain`); 429 par "try again in X minutes" (`throttledSentence`); network down par saaf message; HTML error page milne par samjhata hai ke `VITE_API_URL` ghalat ho sakta hai (`pageInsteadOfJson`).
5. **`ApiError` class:** `status`, `body`, aur helpers (`isNotFound`, `isThrottled`...).
6. **Vendor-name scrub (naya, 2026-11-23):** har JSON jawab `scrubVendor()` (`src/lib/brandText.ts`) se guzarta hai taake Pro ki report mein kisi bahari AI service ka naam na aaye; "FaceCloud AI" dikhta hai.

**Q: "API calls kaise karte ho — axios?"** — **Roman:** Nahi, browser ka built-in **`fetch`**, apne wrapper (`apiFetch`, `apiFetchBlob`) ke saath. Axios ki zaroorat nahi parri kyunke token refresh/retry/dedup khud likha. **English:** Native `fetch` wrapped in our own client, no axios.

### 4.5 Demo mode vs Live mode (`VITE_USE_API`)

- **Roman:** Do env variables: `VITE_API_URL` (backend ka address) aur `VITE_USE_API`. `USE_API = VITE_USE_API==='true' && API_URL!==''` (`src/lib/api/config.ts`). Agar false ho to har screen `src/data/mock.ts` ka **demo data** dikhati hai (jaise `UploadMultiple.tsx`: `USE_API ? <Live/> : <Demo/>`). **Live site (facecloudai.com) 2026-11-25 ko live-mode build hai** (`VITE_USE_API=true`, `VITE_API_URL=https://api.facecloudai.com` bundle mein baked; commit `1c33f73` se bana, bundle hash match kiya). Demo build ab sirf `VITE_USE_API=false` se local banta hai.
- **English:** `VITE_USE_API=true` + a URL = live mode against the API; otherwise every screen shows built-in mock data. The public site (facecloudai.com) is currently a live-mode build pointing at https://api.facecloudai.com (checked 2026-11-25).
- **Important:** `VITE_*` variables **build ke waqt** bundle mein baked ho jate hain (runtime par nahi badal sakte) — API address badalna ho to dobara `npm run build` chahiye. / `VITE_*` values are baked in at build time.
- **Q: "Mock data kyun?"** — pehle UI banaya, backend baad mein jura; screens ek ek karke migrate hui. Demo build backend ke bina bhi dikhaya ja sakta hai.

### 4.6 Data fetching hook — `useApiResource` (`src/lib/useApiResource.ts`)

- **Roman:** Har screen ko 4 cheezein chahiye: mount par fetch, screen jane par cancel, action ke baad dobara load (`reload`), aur demo fallback. Ye sab ek hook mein hai: `useApiResource(load, demo, deps, {ready, skip})` → `{data, loading, error, isDemo, reload}`. `useEffect` ka **cleanup** `controller.abort()` karta hai (race condition se bachata hai). `loadRef` isliye ke `load` function har render naya banta hai warna request baar baar jati.
- **English:** One hook gives every screen fetch-on-mount, abort-on-unmount (effect cleanup), reload, and demo fallback; a ref holds the latest loader so re-renders don't refetch.
- Ye **custom hook** ka acha example hai (viva mein zaroor batao).

### 4.7 Polling (real-time jaisa dikhne wala) — `useBatchProgress` (`src/lib/imageData.ts`)

- **Roman:** Upload ke baad server background mein photos process karta hai. Frontend har **2.5 sec** (`intervalMs=2500`) progress poochta hai (`setTimeout` chain) jab tak batch finish na ho (`isBatchFinished`). Fail hone par (network blip) dobara koshish karta hai. WebSocket nahi — **polling**. Bell/notifications bhi poll hote hain (`useInboxUnread` har 60s, `useLiveBell` interval).
- **English:** Polling every 2.5 s until the batch is finished; no WebSockets. Notification counts also poll.
- **Q: "WebSocket kyun nahi?"** — Polling simple hai, har backend/hosting par chalta hai, aur 2.5 s FYP ke liye kafi hai; downside: extra requests. WebSocket/SSE future work.

### 4.8 Protected images — `AuthedImage` (`src/components/ui/AuthedImage.tsx`)

- **Roman:** Photos backend par bearer token ke peeche hain, aur `<img src>` token nahi bhej sakta. Is liye `fetch` se bytes (`Blob`) laate hain, `URL.createObjectURL` se browser URL banate hain, aur unmount/key change par **`URL.revokeObjectURL`** karte hain (warna memory leak). 404 par placeholder dikhata hai.
- **English:** `<img>` can't send an Authorization header, so bytes are fetched as a Blob and shown via an object URL that is revoked on cleanup. Missing file → placeholder.
- Thumbnails server se sirf 2 sizes mein: **256** ya **1024** (doosra size 400 deta hai). List mein enhanced picture dikhane ke liye `getPhotoPicture` (`images.ts`) `version=enhanced` maangta hai; photo ka original maangna ho (before/after slider) to default `getImageThumbnail`.

### 4.9 Upload flow (`UploadSingle.tsx`, `UploadMultipleLive.tsx`, `UploadZipLive.tsx`)

- **Roman:** 3 tarah: single, multiple (limit live mein 10), ZIP (andar max 20 photos, 2 GB tak). Phases (`type Phase`): `idle → uploading → processing → done/failed`. File `FormData` mein `multipart` upload hoti hai. **Preset** (Auto / Pro) aur lighting upload ke saath bhejte hain; backend apni pipeline chalata hai (checks → enhancement → person folders).
  - **Client-side validation:** ZIP kholne se pehle browser mein **ZIP ka "central directory" padh kar** gintay hain ke kitni photos hain (`src/lib/zipContents.ts` — `DataView`, `getUint32`, signature `0x06054b50`) taake bohat bara ZIP bheje bina hi mana kar dein.
  - **HEIC/HEIF** (iPhone) accept hai; server JPEG mein convert karta hai.
- **English:** Three upload modes; phases idle→uploading→processing→done/failed; `multipart/form-data`; preset sent with the upload; ZIP contents counted in the browser by parsing the ZIP's central directory before sending.
- **Q: "Chunked/resumable upload?"** — Nahi, ek hi `multipart` request. [Backend ki limit `UPLOAD_LIMITS` `uploadKinds.tsx`.]

### 4.10 Enhancement aur report — kaun si cheez kahan

- **Presets (`src/lib/enhancementPresets.ts`):** **Auto** = level `auto` + style `natural` ("Fast"); **Pro** = level `high` + style `ai_max` ("AI Max"). Frontend preset ka naam nahi balkay (level, style) ka jora bhejta hai taake purane backend par bhi chale. (Standard preset 2026-11-23 ko screens se hata diya; Lighting picker bhi hata, `lighting` hamesha `auto`.)
- **Report (`EnhancementReport.tsx`, `ProcessingSummaryBox.tsx`, `stageNames.ts`):** backend `applied_stages`, `skipped_stages`, `processing_summary` deta hai; frontend unhe insani lafzon mein dikhata hai (`STAGES`: low light, noise, deblur, face, detail, colour, HD upscale; `ENGINES`: NAFNet, Real-ESRGAN, CodeFormer, GFPGAN, Zero-DCE, DDColor...). "AI enhancement applied" vs "Classical fallback used" badge. Jo stage na chale uska sabab bhi.
- **Before/After slider (`BeforeAfterSlider.tsx`):** apna likha; **Pointer Events** + `setPointerCapture` se drag (mouse aur touch dono).
- **Demo fallback preview (`previewEnhance.ts`):** jab server nahi, **Canvas 2D** `context.filter = 'brightness(1.12) contrast(1.10) saturate(1.08)'` se halka preview banata hai; screen saaf likhti hai ke ye asli enhancement nahi.
- **English:** Preset→(level,style) pair; stage/engine names mapped to friendly text; the slider is hand-written with Pointer Events; a Canvas filter is only a labelled demo preview.
- **Q: "Enhancement ka AI frontend mein hota hai?"** — **Nahi.** Asli enhancement **backend** karta hai (models: NAFNet, Real-ESRGAN, CodeFormer...). Frontend sirf bhejta, poll karta, aur dikhata hai. Sirf **chehra pehchaan (MediaPipe)** browser mein chalti hai, wo bhi sirf live camera panel mein. / No — enhancement is server-side; only live-camera face detection runs in the browser.

### 4.11 Live camera (`LiveEnhancementPanel.tsx`, 1,581 lines)

- **Roman:** `navigator.mediaDevices.getUserMedia` se camera; **MediaPipe FaceDetector** (full-range pehle, short-range fallback) frame par chehra dhoondta hai; snapshot `<canvas>` se liya jata hai aur server ko enhance ke liye bheja jata hai (`liveSnapshot.ts`, `camera.ts` session API). Camera sirf **HTTPS ya localhost** par chalta hai (browser ki shart).
- **English:** getUserMedia + MediaPipe FaceDetector + canvas snapshot → server. Camera needs a secure context (HTTPS/localhost).
- **Honest note:** file bohat badi hai (1,581 lines) — refactor karna chahiye tha; viva mein "future work: split into smaller components" keh sakte ho.

### 4.12 Consent / Privacy (`src/lib/consent.ts`, `api/privacy.ts`)

- **Roman:** Backend bina user ki **biometric consent** ke chehre analyse nahi karta (jawab mein Person Folders khali). Frontend consent ka status aik **shared store** mein rakhta hai (`useSyncExternalStore` + listeners set) taake popup, Person Folders banner aur Settings card hamesha ek jaisa dikhayen. Privacy tools: apna data download, facial data count, **erase facial data** (`privacy.ts`). Admin ke liye `/admin/privacy` audit.
- **English:** Face grouping requires explicit consent; a tiny external store with `useSyncExternalStore` keeps three UI places in sync. Data export and erase facial data are supported.

### 4.13 Photo library features

- **Roman:** My Images (filters, favourites, select-many, move to trash), Albums, Trash, Duplicates, Moments (events/memories), Search (naam + AI + chehra se), Person Folders (merge/move/split/cover/history), Compare styles, Photo Editor, Share links, Downloads. Har feature ka apna `src/lib/api/*.ts` module (`library.ts`, `duplicates.ts`, `identities.ts`, `shares.ts`, `editor.ts`...). Places feature **2026-11-23 ko frontend se hata diya** (route ab My Images par redirect).
- **Status ka matlab (`photoStatus`, `images.ts`):** display status = accepted/completed/needs_review/rejected. Agar `quality_decision.decision === 'rejected'` ho to rejected maana jata hai (stopgap, kyunke backend kuch cases mein softened status deta tha — `BG-16`, `qa/BACKEND_GAPS.md`).
- **Photo title:** `photoTitle()` (`src/lib/photoTitle.ts`) — "Ali Hassan · Nov 21, 2026, 12:46 PM" (folder mein log + upload time); file name tooltip mein.

### 4.14 Moderator aur Admin portal

- **Moderator:** apni organization ke andar photos review (`ReviewQueue`, `ModeratorImageReviewLive`), identity review, batch management, members, logs, reports/exports, notifications. Agar organization na ho to `NoOrganizationGuard`.
- **Admin:** overview, statistics, users, moderators, organizations, invitations, audit logs, security, privacy audit, system health/monitoring, upload & rejection statistics, image monitoring (sirf file ki details aur automatic quality result; admin ko user ki tasveer nahi dikhti aur wo accept/reject nahi karta: privacy), contact inbox.
- Page file ke do version hain (`XxxLive.tsx` asli API, `Xxx.tsx` wrapper/demo) — wajah: demo/live ka switch.

### 4.15 Theme (dark/light) — `src/lib/theme.ts`

- **Roman:** Choice `<html data-theme="dark|light">` par rehti hai aur `localStorage` (`facecloud_theme`) mein save. Tailwind ke colours CSS variables hain (`--a-ink`, `--a-surface`, `--a-accent`...) jo `src/index.css` mein `.fc-app` aur `html[data-theme='light']` ke andar badalte hain. `main.tsx` React se **pehle** `applyAppearance` chalata hai taake flash na aaye. Custom event `facecloud:appearance` do alag toggles (navbar, topbar) ko sync rakhta hai. Ek purana bug: updater ke andar side-effect ki wajah se click do baar toggle hota tha — ab side-effects updater se bahar hain (comment `theme.ts`).
- **English:** `data-theme` on `<html>`, persisted in `localStorage`, colours via CSS variables bound into Tailwind tokens; applied before React mounts to avoid a flash; a custom event syncs toggles.

### 4.16 Dialogs aur stacking (kaafi poochha ja sakta hai)

- **Roman:** `Modal`/`ConfirmDialog` `createPortal` se `.fc-app` ke andar render hote hain (`src/lib/inShell.ts`) kyunke styles `.fc-app` tak scoped hain, aur z-index (`z-[70]`) bottom nav se upar. Pehle dialog nav ke peeche chhup jata tha (stacking context ka masla).
- **English:** Portals into `.fc-app` keep scoped styles and put dialogs above the floating nav.

### 4.17 Error handling

- **`ErrorBoundary`** (class component — hooks ke paas error boundary nahi): ek screen crash kare to sidebar baqi rehta hai; `key={location.pathname}` se route badalne par reset.
- API errors → `ApiError` → screen par saaf sentence. Network down / 429 / HTML page — sab ke alag message.

### 4.18 Hero video (landing)

- `BackgroundVideo.tsx`: ek seamless loop video (ffmpeg `xfade` se bana), `playbackRate = 0.7`, `prefers-reduced-motion` par sirf poster, tab hidden ho to pause (`visibilitychange`), light theme mein edges mask. `muted + playsInline + autoPlay` (browser autoplay policy ki shart).

---

## 5. React concepts — kahan dikhay / where we used them

| Concept | Roman Urdu | English | Example in our code |
|---|---|---|---|
| **Component / props** | Function jo UI wapas karta hai; props se data milta hai | Function returning UI | `ImageCard({image, selectable, ...})` |
| **useState** | Component ki yaad (state) | Local state | `UploadSingle`: `phase`, `file` |
| **useEffect + cleanup** | Side-effects (fetch, listeners); cleanup jab component hat jaye | Side effects + cleanup | `AuthedImage`, `useApiResource`, `BackgroundVideo` |
| **useRef** | Bina re-render ke value/DOM yaad rakhna | Mutable ref / DOM handle | `videoRef`, `loadRef`, `refreshInFlight` (module var) |
| **useCallback / useMemo** | Function/value ko memoize | Memoisation | `theme.ts toggle`, `LiveEnhancementPanel` |
| **Custom hooks** | Logic dobara istemal | Reusable logic | `useApiResource`, `useBatchProgress`, `useAppearance`, `useFinishedBatch` |
| **useSyncExternalStore** | React ke bahar ke store se judna | Subscribe to external store | `consent.ts` |
| **Context** | — | — | **Hamare code mein `createContext` nahi** (grep 0); shared state module-level store/events se |
| **Conditional rendering / lists + key** | `cond && <X/>`, `array.map` + `key` | | har page |
| **Error boundary** | Class component, `getDerivedStateFromError` | | `ErrorBoundary.tsx` |
| **Portal** | DOM ki dusri jagah render | | `inShell.ts` |
| **Controlled inputs** | Input ki value state se | | Login/Register forms |
| **StrictMode** | Dev mein double effect | | `main.tsx` |
| **Lazy/Suspense** | — | — | **Istemal nahi hua** (bundle ek hai) |

**Q: "State management — Redux?"** — **Roman:** Redux/Zustand nahi. Server data `useApiResource` se, UI state `useState` se, aur thora global state (consent, theme, session) chhote module-level stores + browser events se. **English:** No Redux; server state via a custom hook, local UI state via `useState`, tiny global stores for consent/theme/session.

**Q: "Virtual DOM kya hai?"** — React state badalne par naya UI description banata hai, purane se compare (diffing/reconciliation) karta hai, aur real DOM mein sirf farq lagata hai. / React diffs a new tree against the old and patches only the differences.

**Q: "key kyun?"** — list mein har item ki pehchaan taake React sahi item reuse kare (hum `key={image.id}` use karte hain, index nahi).

---

## 6. TypeScript Q&A (kahan kya)

- **interface vs type:** hum API ke shapes ke liye `interface` (`ImageListItem`), unions ke liye `type` (`type Phase = 'idle'|...`, `Portal`, `DisplayStatus`).
- **Generics:** `apiFetch<T>(path)` → `Promise<T>`; `useApiResource<T>`; `AsyncState<T>`.
- **Union / literal types:** `'original' | 'enhanced'` (`getImageThumbnail version`), `PresetKey = 'auto' | 'pro'`.
- **Optional fields (`?`):** `has_preview?`, `created_at?` — "newer backends only" comments: purane backend par field na ho to bhi crash nahi.
- **`unknown` vs `any`:** API body `unknown` rakha, phir check kar ke use (`messageFrom(body: unknown)`).
- **Type-only imports:** `import type {...}` (`verbatimModuleSyntax`).
- **`Record<K,V>`:** `STAGES`, `ENGINES`, `accessTokens: Record<Portal, string|null>`.
- **Non-null `!`:** `document.getElementById('root')!` (`main.tsx`).
- **Kya strict hai?** `tsconfig.app.json` mein `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`, `noFallthroughCasesInSwitch`. [`tsconfig*.json` mein `"strict"` likha hi nahi (grep se 0) — **check nahi kiya** ke TypeScript 6.0 ka default isay on rakhta hai ya nahi; viva mein "ye extra flags on hain" kaho, "full strict mode" tab tak mat kaho jab tak `npx tsc --showConfig` se confirm na kar lo.]

---

## 7. JavaScript/Browser APIs jo hum ne use kiye

| API | Kahan | Maqsad |
|---|---|---|
| `fetch`, `AbortController`, `Response.clone()` | `client.ts` | network, cancel, 401 body dobara parhna |
| `FormData` | upload | file upload |
| `Blob`, `URL.createObjectURL/revokeObjectURL` | `AuthedImage`, downloads (`saveBlob.ts`) | protected image/file |
| `localStorage` (try/catch ke saath) | tokens, theme, session | private mode mein bhi crash nahi |
| `Promise`, `async/await`, `Promise.reject(new DOMException('Aborted','AbortError'))` | har jagah | |
| `setTimeout/setInterval` | polling | |
| `CustomEvent`, `window.dispatchEvent` | theme, `facecloud:session-lost` | components ke beech message |
| `matchMedia('(prefers-reduced-motion)')` | hero | accessibility |
| `document.visibilitychange` | hero video, polling | tab chhupe to pause |
| `navigator.mediaDevices.getUserMedia` | live camera | camera |
| `Canvas 2D` (`drawImage`, `toDataURL`) | `previewEnhance`, snapshot | image process |
| `DataView`, `Blob.slice`, `TextDecoder` | `zipContents.ts` | ZIP header parse |
| `Pointer Events`, `setPointerCapture` | slider | drag |
| `URLSearchParams` | filters in My Images URL | filter ko URL mein rakhna |
| `IntersectionObserver` (framer `useInView`) | scroll reveal | |

---

## 8. Security — viva ke sawal

| Sawal | Roman Urdu jawab | English answer |
|---|---|---|
| XSS se kaise bachao? | React text ko automatically escape karta hai; `dangerouslySetInnerHTML` poore `src/` mein **0** jagah. Access token memory mein. | React escapes output; zero `dangerouslySetInnerHTML`; access token in memory. |
| CSRF? | Auth cookie par nahi, `Authorization` header par hai, is liye classic CSRF lagu nahi hota. | Bearer-header auth, no cookies. |
| Passwords? | Frontend sirf bhejta hai (HTTPS par hona chahiye); hash backend karta hai. Password field `PasswordInput.tsx` (show/hide). | Hashing is server-side. |
| Role bypass? | Frontend guard sirf UX; backend har call par enforce karta hai. | Server enforces. |
| Secrets? | Frontend mein koi secret/API key nahi; sirf 2 public `VITE_` variables. `.env` commit nahi hota. | No secrets in the bundle. |
| Brute force/rate limit? | Backend throttle deta hai (429); frontend ye sentence dikhata hai. | Backend throttles; UI shows the wait time. |
| HTTPS? | Live site HTTPS par hai; API ko bhi HTTPS par hona chahiye (mixed-content block warna). Local backend abhi HTTP. | Needed for camera and mixed content. |
| Privacy of faces? | Consent pehle; erase/export tools; photos ka direct public URL nahi (token ke peeche). | Consent-gated; erase/export. |
| Kya admin user ki tasveerain dekh sakta hai? | Nahi. Admin ke Image Monitoring page par sirf file ki details aati hain (naam, owner, size, automatic quality result, scores); tasveer ka request frontend bhejta hi nahi, aur accept/reject automatic quality check karta hai, admin nahi. Honest baat: server par bhi ye raasta band hona chahiye (backend ko prompt diya hua hai), warna sirf screen se chhupana kaafi nahi. | No. The admin console shows file facts and the automatic verdict only; it never requests the picture and the admin does not accept or reject. The server must refuse it too (data minimisation / least privilege). |

---

## 9. Performance — honest jawab

- **Roman:** Achhay hisse: request de-dup, abort on unmount, thumbnails (256/1024), object URL revoke, polling sirf jab batch chal raha ho, `preload="none"` jab reduced motion.
- **Kamzori:** koi code-splitting nahi → ek ~3.2 MB JS bundle (gzip ~810 kB); lists mein virtualisation nahi (pagination hai: `Pager.tsx`); `LiveEnhancementPanel` 1,581 lines. **Agla qadam:** `React.lazy` + `Suspense` se route-wise split, MediaPipe ko lazy load.
- **English:** Strengths: request dedup, abort, right-sized thumbnails, URL revocation, polling only while needed. Weaknesses: no code splitting (one ~3.2 MB bundle), no list virtualisation (pagination used). Next: `React.lazy` per route, lazy-load MediaPipe.

---

## 10. Testing, quality, CI

- **Roman:** Unit-test framework (Jest/Vitest) **nahi** hai [package.json mein nahi]. Testing **end-to-end QA scripts** se hoti hai: `qa/scripts/*.mjs` (24 scripts) browser ko Chrome DevTools Protocol se chalate hain, ek **throwaway backend stack** par (`qa/start-test-stack.sh`: ports 8840/5240/9410) — asli server/data ko touch nahi karte. `qa/README.md`, `qa/TEST_PLAN.md`, `qa/BUGS.md`, `qa/BACKEND_GAPS.md` (backend se jude gaps, jaise BG-16) aur `qa/PROMPT_FOR_BACKEND_*.md` (backend engineer ke liye prompts).
- **CI (`.github/workflows/ci.yml`):** har push/PR par aur har Monday: `npm ci` → `npx tsc -b --force` (type-check) → `npx oxlint src` → `npm run build`. Node 22.
- **English:** No unit-test framework; E2E scripts drive a real browser against a disposable backend stack. CI runs type-check, lint and build on every push and weekly.
- **Q: "Test coverage?"** — Honest: unit tests nahi; E2E scripts key flows cover karti hain (card click, dialogs, admin reject, batch results...). Coverage ka percentage **measure nahi kiya**.

---

## 11. Build, deploy, hosting

- **Commands (`package.json`):** `npm run dev` (Vite dev server), `npm run build` (`tsc -b && vite build` → `dist/`), `npm run lint` (`oxlint`), `npm run preview`.
- **Deploy:** abhi **manual** — `dist/` ko Hostinger par upload (live: facecloudai.com, `Last-Modified` 24 Nov 2026 15:58 GMT, API `https://api.facecloudai.com`). `public/.htaccess` (SPA fallback + 1 saal immutable cache static assets par) `dist/` mein copy hota hai. Dot-file hone ki wajah se upload mein chhoot sakti hai — warna deep links 404.
- **Live backend se jorna:** `.env.production` mein `VITE_USE_API=true` aur `VITE_API_URL=https://<backend>` rakh kar naya build, backend par CORS mein frontend ka domain, aur backend ka `FRONTEND_URL` email links ke liye.
- **Known loose ends:** canonical/og:url/sitemap `www.facecloudai.pro` par hain jab ke live site `facecloudai.com` hai (SEO mismatch).
- **English:** Manual upload of `dist/` to Hostinger; env vars are build-time; backend needs CORS + `FRONTEND_URL`.

---

## 12. Git / process

- Repo: `ali4347/facecloud-ai-platform` (branch `main`). Commits conventional style (`feat(...)`, `docs(...)`).
- **`WORK_LOG.md`:** har kaam ka dated record (kya badla, kaun si file, kaise verify kiya). Project instructions (`CLAUDE.md`) + ek Stop hook is ko zaroori banate hain.
- Do repos: frontend (Ali) aur backend (Ijaz); frontend backend ki gaps `qa/PROMPT_FOR_BACKEND_*.md` mein likhta hai.
- **Q: "AI tool use kiya?"** — Honest raho: development mein Claude Code assistant istemal hua; sab code review/test aur apni zimmedari. [Apni university ki policy ke hisaab se jawab tayyar rakho.]

---

## 13. Backend se kya jura hai (frontend ke nazariye se)

- Backend ke code ke asaar jo frontend mein nazar aate hain: errors **Django REST Framework** ke shape ke hain (`detail`, `ErrorDetail(...)`), tokens **JWT** (`token_not_valid`), message mein `python manage.py migrate`. Is liye backend = **Django + DRF + JWT**.
- ⚠️ `README_BACKEND_ROADMAP.md` mein purana plan **Node + Prisma + BullMQ + Redis + PostgreSQL** likha hai; asli backend (Ijaz ka) Django lagta hai. Viva mein "roadmap ek planning document hai; implementation Django mein hai" kehna — **lekin pakka confirm Ijaz se kar lo.**
- API docs `docs/api/openapi.yaml` backend repo mein hai (aakhri commit 5 Nov, kuch frontend paths us mein nahi — stale).
- **Endpoints ke examples:** `/api/auth/refresh/`, `/api/images/my/`, `/api/images/{id}/thumbnail/?size=256&version=enhanced`, `/api/enhancements/images/{id}/`, `/api/enhancements/results/{id}/`, `/api/privacy/consents/`, `/api/system/images/` (admin list: sirf details, tasveer nahi).

---

## 14. Frontend ki honest kamzoriyan (pehle se tayyar raho)

| Kamzori | Kya bolna hai |
|---|---|
| Code-splitting nahi (3.2 MB bundle) | "Known; agla step `React.lazy`." |
| Unit tests nahi | "E2E QA scripts + CI type-check/lint/build; unit tests future work." |
| Radix/CVA installed lekin unused | "Pehle plan tha, ab apne components; unused dependencies hatani chahiye." |
| `LiveEnhancementPanel.tsx` 1,581 lines | "Refactor future work." |
| Demo/Live ke do file versions | "Migration ke dauran; jab sab live ho jaye to demo versions hata sakte hain." |
| `ProtectedRoute` sirf stored session dekhta hai | "UX guard; asli security backend." |
| Live site par pichhla deploy kab ka hai | "Live site commit `1c33f73` ka live-mode build hai; naya commit aaye to dobara `dist/` upload karna parta hai (manual deploy)." |
| Polling, WebSocket nahi | "Simple aur reliable; future: SSE/WebSocket." |
| Refresh token `localStorage` mein | "Rotation + server revoke; HttpOnly cookie better (backend change chahiye)." |
| SEO domain mismatch (.pro vs .com) | "Config ki ghalti, deploy se pehle theek hogi." |
| Rejected photos ke picture nahi (server file nahi rakhta) | "Backend file store nahi karta jab file invalid ho; card par 'Rejected' + wajah dikhti hai." |

---

## 15. Rapid-fire Q&A (Roman + English)

1. **React kya hai?** — UI banane ki library, components + state. / A component-based UI library.
2. **SPA kya hai?** — Ek page load, baqi JS se badalta hai. / One page load, JS swaps views.
3. **Vite kyun, CRA/Webpack kyun nahi?** — Tez dev server aur build; CRA ab maintained nahi. / Faster; CRA is deprecated.
4. **Tailwind ke fayde?** — Alag CSS file nahi likhni, consistent spacing/colours, dark/light tokens. / Utility classes, consistency, theming.
5. **Props vs state?** — Props bahar se (read-only), state andar ki (badal sakti). / Props come in; state lives inside.
6. **useEffect ka dependency array?** — Jab list ki value badle tab effect chale; khali = sirf mount par. / Controls when the effect re-runs.
7. **Stale closure kya hai?** — Purani render ki value effect/callback mein reh jana; humne `loadRef` se hal kiya. / Fixed with a ref.
8. **Race condition kaise roka?** — `AbortController` + `if (!signal.aborted)` check. / Abort + guard.
9. **Controlled vs uncontrolled?** — Controlled mein value state se; hamare forms controlled. / Value driven by state.
10. **Memory leak kahan ho sakta tha?** — Object URLs; humne revoke kiye. / Revoked object URLs.
11. **JWT kya hai?** — Signed token jis mein user ki pehchaan hoti hai; server signature verify karta hai. / Signed token proving identity.
12. **Access vs refresh token?** — Access chhota, har request par; refresh lamba, sirf naya access lene ke liye. / Short vs long-lived.
13. **Token rotation?** — Har refresh par naya refresh token, purana invalid. / New refresh token each time.
14. **CORS kya hai?** — Browser ka rule: dusre domain se API tabhi jab server allow kare. / Browser cross-origin policy.
15. **REST kya hai?** — Resources par HTTP verbs (GET/POST/PATCH/DELETE) aur status codes. / Resource-oriented HTTP API.
16. **Status codes jo hum handle karte hain?** — 401 (login/expired), 403 (forbidden), 404 (nahi mila/dusre ka record), 429 (throttle), 5xx (server). / Handled in `client.ts`.
17. **Debounce?** — Top-bar search (`GlobalSearch.tsx`) 250 ms ruk kar request bhejta hai (`setTimeout`), cleanup mein `clearTimeout` + `abort()`; kam az kam `SEARCH_MIN_LENGTH` (2) characters chahiye. / 250 ms debounce with abort on change.
18. **Pagination?** — Server `Page<T>` deta hai; `Pager.tsx` UI. / Server pages + `Pager`.
19. **Accessibility?** — `aria-label`, `role="checkbox"`, `aria-checked`, `aria-pressed`, `role="alert"`, `prefers-reduced-motion`, keyboard focus rings. / ARIA + reduced motion. [Poora audit (screen reader test) **nahi kiya**.]
20. **Responsive?** — Tailwind breakpoints (`sm:`, `lg:`), phone par floating bottom nav. / Tailwind breakpoints.
21. **SEO?** — `index.html` mein meta/canonical/og tags, `robots.txt`, `sitemap.xml`; SPA hone ki wajah se crawl limited. / Basic meta only; SPA limits SEO.
22. **Environment variables?** — `import.meta.env.VITE_*`, build time par bundle mein. / Build-time constants.
23. **Dark mode kaise?** — `data-theme` + CSS variables. / See 4.15.
24. **Ek bug jo tum ne fix kiya?** — (a) Theme toggle double-fire, (b) admin login user tab ko logout kar deta (portal-wise keys), (c) dialogs bottom nav ke peeche, (d) rejected photo accepted dikhti. / Pick any.
25. **Agar backend down ho?** — `ApiError(0, ...)` "could not reach the server"; refresh fail par session foran nahi marta (`unavailable` vs `invalid` ka farq). / Distinguishes outage from invalid token.
26. **Naya feature kaise add karoge?** — `lib/api/x.ts` mein types+calls → `useApiResource` se screen → `App.tsx` mein route → sidebar link. / Add API module, screen, route.
27. **Scalability?** — Frontend static files hain (CDN par), lekin bundle split aur polling kam karna hoga. / Static hosting scales; split bundle and cut polling.
28. **Face detection browser mein kyun?** — Live camera mein foran feedback; frame server ko bheje bina. / Instant feedback, less data sent.
29. **Privacy: chehre ka data?** — Consent, erase, export; sirf user ko apni photos. / Consent-first.
30. **Is project mein sab se mushkil cheez?** — Token refresh ke race conditions aur async polling states (jo is document mein 4.3/4.7 mein hai). / Concurrency in auth and polling.

---

## 16. Defence se pehle checklist (Ali ke liye)

- [ ] Local backend + frontend (live mode) chala kar ek poora flow dekh lo: register/login → upload (single, ZIP) → processing → photo detail (before/after) → person folders → admin reject → notification.
- [ ] `npm run build` pass ho (aaj kal pass hai) — `.env` mein `VITE_USE_API=true`, `VITE_API_URL=http://localhost:8000` (apne backend ka address).
- [ ] Live camera ke liye HTTPS/localhost aur camera permission.
- [ ] Is file mein jahan **[check nahi kiya]** likha hai wahan khud code khol kar dekh lo ya Ijaz se pooch lo.
- [ ] 3 files ko dil se jaan lo: `src/lib/api/client.ts`, `src/lib/useApiResource.ts`, `src/App.tsx` — zyada tar sawal yahin se nikalte hain.
- [ ] Backend ke sawal (model kaun sa, DB, queue) Ijaz ko redirect karo ya unka jawab pehle se le lo.
