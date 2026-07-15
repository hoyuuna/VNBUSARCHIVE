# ?? CRITICAL INITIALIZATION PROTOCOL: AGENT READ THIS BEFORE PROCEEDING ??
**MANDATORY FIRST STEP:** Before responding to the user, answering any questions, or writing any code, you MUST read ALL markdown documents located in the .agents/ directory (e.g., security.md, js_map.md). 
**Rule:** Use your list_dir tool to view .agents/ and iew_file on EVERY .md file inside it immediately upon starting a new conversation. Failure to do so will result in severe system architectural violations.
## UI and Color Palette Rules
- Use only black, white, and gray for standard UI components. Red, yellow, and blue are reserved strictly for notification modals.
- Always reuse existing designs (popups, modals) unless explicitly asked to create a new design.
- **Button Border Radius & Consistency:** All general action buttons must use square-rounded corners (`rounded-md` or `rounded-lg`) rather than pill-shaped (`rounded-full`) to maintain visual consistency across the HoyuUI interface, unless explicitly instructed otherwise for circular icon buttons or avatars.
- **Deep-linking in Modals/Settings:** When UI elements or buttons trigger multi-tab modals (such as Settings or Admin panels), always navigate directly to the target tab and submenu (e.g., `app.settings.open('profile', 'account')`) rather than opening the default or blank landing screen.

## Project Stack & Deployment
- **Hosting/Platform:** Cloudflare Pages (Framework preset: `None`).
- **Frontend:** Pure vanilla HTML, CSS, and JavaScript.
- **Backend/API:** Cloudflare Pages Functions (Serverless architecture).
- **Rule:** All web assets must be standard web-compliant, and any backend logic must leverage Cloudflare's serverless environment.

## Design System & UI Reference
- The design system, HoyuUI, is fully documented at `/public/design.md`. 
- **Rule:** Before creating new UI components or layouts, ALWAYS read `/public/design.md` and use the exact design tokens, CSS values, and HTML structures specified there.

## Git Workflow
- **Rule:** Always automatically commit and push git changes (`git add -A; git commit -m "..."; git push`) after successfully completing user requests or modifying code. **All git commit messages MUST always be written in English.**

## Frontend Build & Payload Invariant
- **Rule:** All core frontend logic resides in `src/js/` (`1_init.js` through `5_admin.js`) and `_core.html`. Whenever any file inside `src/js/` or `_core.html` is modified, you **MUST run `node build-core.js`** immediately to bundle and Base64-encode the payload into `functions/api/_core.js`. Never edit `functions/api/_core.js` directly or inject static script logic into `public/index.html`.

## Sandbox Image & CDN Approval Guardrails
- **No Client-Side Approval Bypasses:** All actions that approve or re-approve photos (e.g., `reapproveBtn` in `3_views.js` or `approvePhoto` in `5_admin.js`) **MUST call the backend API `/api/admin/action`** (`action: 'approve'`). Never directly update `photos.status = 'approved'` from the frontend via `window.sb.from('photos').update(...)`, as this bypasses CDN uploading and validation.
- **Missing Data Safety Block:** When handling `action: 'approve'` in `/api/admin/action.js`, the backend must verify that valid base64 image data exists in `image_sandbox` (or valid `data:image/...` string). If data is missing (e.g., deleted after 24h or expired), the system MUST return a `400 Bad Request` error and block approval to prevent broken `sandbox:` links from entering the main feed.
- **Storage Cleanup:** Upon successful CDN upload during photo approval, the backend **MUST BẮT BUỘC delete** the corresponding base64 rows from `image_sandbox` (`by id` and `by photo_id`) to prevent database storage bloat.

## Admin Dashboard & Vehicle Status Filtering (`XE MỚI` Badge Invariant)
- **Approved Photo Filtering:** When fetching vehicle data (`vehicles` table) to build reference sets in Admin/Manager views (`approvedPlateSet`, `approvedOpSet`, `approvedRouteSet`, `approvedModelSet` in `5_admin.js`), you **MUST strictly filter by `photos!inner(status) = 'approved'`**. 
- **Why:** Because `upload.js` inserts new vehicle records with `pending` status upon initial photo upload. If queries do not filter by approved photo status, `pending` or `denied` license plates will prematurely exist in `approvedPlateSet`, causing the `XE MỚI` (New Car) badge logic (`!approvedPlateSet.has(plateKey)`) to fail.
