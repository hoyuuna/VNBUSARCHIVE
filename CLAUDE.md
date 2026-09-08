# ?? CRITICAL INITIALIZATION PROTOCOL: AGENT READ THIS BEFORE PROCEEDING ??
**MANDATORY FIRST STEP:** Before responding to the user, answering any questions, or writing any code, you MUST read ALL markdown documents located in the .agents/ directory (e.g., security.md, js_map.md). 
**Rule:** Use your list_dir tool to view .agents/ and view_file on EVERY .md file inside it immediately upon starting a new conversation. Failure to do so will result in severe system architectural violations.
## UI and Color Palette Rules
- Use only black, white, and gray for standard UI components. Red, yellow, and blue are reserved strictly for notification modals.
- Always reuse existing designs (popups, modals) unless explicitly asked to create a new design.
- **Button Border Radius & Consistency:** All general action buttons must use square-rounded corners (`rounded-md` or `rounded-lg`) rather than pill-shaped (`rounded-full`) to maintain visual consistency across the HoyuUI interface, unless explicitly instructed otherwise for circular icon buttons or avatars.
- **Deep-linking in Modals/Settings:** When UI elements or buttons trigger multi-tab modals (such as Settings or Admin panels), always navigate directly to the target tab and submenu (e.g., `app.settings.open('profile', 'account')`) rather than opening the default or blank landing screen.
- **No Component Separator Lines (`border-t`, `<hr>`):** NEVER use horizontal separator or divider lines (`border-t`, `border-top`, `<hr>`) to divide sections, card bodies, modal content, or action footers/buttons. All components and buttons inside cards or modals must flow cleanly using margin/spacing (`mt-3`, `mt-4`, `mb-4`, etc.) without visual dividing lines.
- **CRITICAL INVARIANT - DARK/LIGHT MODE SYNCHRONIZATION:** You are STRICTLY FORBIDDEN from making one-sided UI updates. ANY new feature, bug fix, or modification that involves the UI (HTML layout, CSS, Tailwind classes, or JS DOM manipulation) **MUST** be implemented and styled for BOTH Light Mode (Tailwind in `_core.html`/js) AND Dark Mode (`public/css/dark.css`). 
  * If you add a hover state, active state, or selected state in Light Mode, YOU MUST explicitly define its counterpart in `dark.css`. 
  * If you change border colors, background colors, or text colors, YOU MUST verify and update how it looks in `dark.css`.
  * Failure to synchronize both themes is considered a severe violation of the system architecture. Always ask yourself: "How does this look in Dark Mode? Did I add the CSS for it?"

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
- **Rule:** Ensure all temporary or junk files are deleted before pushing. If they must be kept, they MUST be placed in the `/temp` directory.

## Frontend Build & Payload Invariant
- **Rule:** All core frontend logic resides in `src/js/` (`1_init.js` through `5_admin.js`) and `_core.html`. Whenever any file inside `src/js/` or `_core.html` is modified, you **MUST run `node build-core.js`** immediately to bundle and Base64-encode the payload into `functions/api/_core.js`. Never edit `functions/api/_core.js` directly or inject static script logic into `public/index.html`.

## Photo Approval Guardrails (Sandbox retired)
- **No Client-Side Approval Bypasses:** All actions that approve or re-approve photos (e.g., `reapproveBtn` in `3_views.js` or `approvePhoto` in `5_admin.js`) **MUST call the backend API `/api/admin/action`** (`action: 'approve'`). Never directly update `photos.status = 'approved'` from the frontend via `window.sb.from('photos').update(...)`, as this bypasses validation.
- **Sandbox retired:** The old `image_sandbox` / `sandbox:` / `data:` base64 system has been removed. All photos now reside on the real CDN as https URLs stored directly in `photos.url`. Approval (`action: 'approve'`) uses `photo.url` directly; if it is not a valid https URL (e.g. legacy `sandbox:`/`data:`/`SANDBOX_DELETED`), the backend returns a `400` error. Denial (`action: 'deny'`) only flips `status` to `denied` and keeps the CDN image.
- **Legacy data handling:** Remaining legacy `sandbox:`/`data:` URLs are treated as missing/invalid (`_isSandboxMissing`) and render as placeholders; they are never approved.

## Admin Dashboard & Vehicle Status Filtering (`XE MỚI` Badge Invariant)
- **Approved Photo Filtering:** When fetching vehicle data (`vehicles` table) to build reference sets in Admin/Manager views (`approvedPlateSet`, `approvedOpSet`, `approvedRouteSet`, `approvedModelSet` in `5_admin.js`), you **MUST strictly filter by `photos!inner(status) = 'approved'`**. 
- **Why:** Because `upload.js` inserts new vehicle records with `pending` status upon initial photo upload. If queries do not filter by approved photo status, `pending` or `denied` license plates will prematurely exist in `approvedPlateSet`, causing the `XE MỚI` (New Car) badge logic (`!approvedPlateSet.has(plateKey)`) to fail.
  
## Strict UI & Component Rules
- **Rule:** ONLY design a new component or custom style for the web WHEN EXPLICITLY REQUESTED by the user.
- **Rule:** If not explicitly requested, you MUST reuse the existing custom components already available in the web app. If a new component is truly necessary to function, you MUST ask the user for permission before creating it. 
- **Rule:** UNDER NO CIRCUMSTANCES are you allowed to design a custom style/component without notifying or asking the user first.
- **Rule:** NEVER use native browser modals like `alert()` or `confirm()`. ALWAYS use the custom UI modal `app.ui.showAlert(msg, okCallback, cancelCallback, options)` for showing alerts and confirmations.
## Flat UI & Border Rules (NEW INVARIANT)
- **100% Flat UI:** The system now strictly uses a Flat UI design. There should be NO transparent glassmorphism, NO gray borders (`border-gray-200/300`), NO soft backgrounds for modals, and NO shadow depth. Everything must use solid `1px solid #18181b` (black) borders and pure white (`#ffffff`) backgrounds for popup/modal bodies.
- **Double Border Prevention (Đè Nét):** When applying borders to components, BE EXTREMELY CAREFUL to avoid "double borders" (2px thick borders caused by two adjacent elements both having 1px borders, e.g., a header with `border-b` sitting on top of an image wrapper with `border-t`, or a wrapper with a border enclosing a child image that also has a border). You MUST carefully inspect the DOM structure and apply `border-top: none` or similar CSS overrides to eliminate overlapping borders (chống đè nét).

JS MAP:
# JS Map: Javascript Architecture Map

Currently, all Javascript code for the project has been modularized and restructured for easier maintenance. Below is a detailed map of the location and function of each file:

## 1. Directory `src/js/` (Core Frontend Source)
This directory stores the modular JS files of the Frontend. When running the Build command, these files will be bundled in the correct order.

*   **`00_core.js`**: Initializes the global `window.app` variable, contains utility functions, ui logic, database init, global variables, event listeners, etc.
*   **`01_router.js`**: Contains the router init logic (`app.init`).
*   **`02_settings.js`**: Settings, docs, notifications.
*   **`03_auth.js`**: Handles user authentication (`app.auth`), login, logout, profile fetching, and QR Login.
*   **`page_feed.js`**: Manages the UI display of the feed (`app.views`).
*   **`page_search.js`**: Handles the advanced search system (`app.search`).
*   **`page_leaderboard.js`**: Leaderboard and top uploaders.
*   **`page_help.js`**: Newsboard, help, contact, active announcements.
*   **`page_reference.js`**: Operator, model, route view components.
*   **`page_upload.js`**: The upload feature, cropping/compressing images, preference.
*   **`page_photo.js`**: Photo details, comments, and edit features.
*   **`page_vehicle.js`**: Vehicle details logic.
*   **`page_admin.js`**: Dashboard for Admins/Managers (`app.admin`) and achievements.
*   **`page_map.js`**: Contains logic for rendering and interacting with maps (`app.map`).

---

## 2. Directory `functions/api/` (Cloudflare Backend)
Contains APIs running on Cloudflare Pages' Serverless environment. Responsible for executing hidden logic and database security.

*   **`_core.js`**
    *   **Role:** Contains the Base64 encoded string of `_core.html` (which includes the 5 bundled JS files above).
    *   **Origin:** Automatically generated by `build-core.js`.

*   **`recommendations.js`**
    *   **Role:** API that returns a list of recommended photos on the homepage and related photos on the detail page. Handles scoring and prioritizing routes/operators/models based on user habits.

*   **`admin/action.js`**
    *   **Role:** Verifies JWT tokens, runs with Admin/Manager privileges to perform data insertions into `vehicles` and `vehicle_history` tables via `supabase-js`, successfully bypassing Row-Level Security (RLS).

---

## 3. Build files in the Root Directory
*   **`build-core.js`**: A NodeJS script. Run `node build-core.js` to read the files in `src/js/`, bundle them, and generate `public/app.js` and `public/index.html`.
*   **`_core.html`**: The original webpage template. Contains CSS and HTML structure. Does NOT contain JS logic (JS has been split out into `src/js/`).

# VNBUSARCHIVE - Security Guidelines

This document serves as the Security Rules and Guidelines for AI Agents participating in the `vietnam-bus-spotter-main` project. Whenever working on this project, Agents **MUST** strictly adhere to the following security standards to prevent breaking the established security architecture.

---

## 1. Payload Architecture (Base64 Anti-Tamper)
All User Interface (UI) logic resides in `src/js/` and `src/html/`. However, this source code is not injected directly into `public/index.html` as plain text.
- **Build Process:** Run `node build-core.js` to bundle all JS/HTML files into `functions/api/_core.js` as a **Base64** string.
- **Load Process:** When the browser loads `index.html`, it calls the `/api/_core` API to fetch the Base64 string, decodes it, and uses `document.write()` to inject it directly into the DOM.
- **Purpose:** Prevents casual users (or simple bots) from inspecting the JS/HTML source code structure via F12 or `View-Source`, and adds a layer of obfuscation to protect the UI's intellectual property.
- **Rule:** Do NOT inject sensitive scripts or core processing logic as static `<script src="...">` tags in `index.html`. All logic must be inside `src/js/` and rebuilt using `node build-core.js`.

## 2. Content-Security-Policy (CSP)
The `public/index.html` file contains a highly strict Content-Security-Policy (CSP) meta tag.
- **Purpose:** Prevents XSS (Cross-Site Scripting) attacks, malicious code injection, and data exfiltration to unknown domains.
- **Rule - Adding New Packages/CDNs/APIs:**
  If you add a new API, a new CDN library (CSS/JS), or an external image source (Cloud Storage, WSRV, Giphy, etc.), you **MUST ADD** that domain to the corresponding directive in the `meta` CSP tag inside `public/index.html`.
  *Examples:*
  - If you use `import()`, `fetch()`, or `WebSocket` to `https://new-api.example.com`, you must add `https://new-api.example.com` to `connect-src` (and potentially `script-src` for imports).
  - If you load images from `https://images.example.com`, you must add it to `img-src`.
  - If you add a script from `https://cdn.example.com`, you must add it to `script-src`.
- **Rule - Restrictions:** 
  - Absolutely **DO NOT** remove the CSP tag or use the wildcard `*` for critical directives (except for already whitelisted services like `https://*.supabase.co`).
  - Never add `'unsafe-inline'` unless strictly necessary (currently required due to the Base64 injection design).

## 3. Preventing SSRF & Origin / Referer Bypass
- **Rule (Cloudflare Functions):** Every file in the `functions/api/` directory (e.g., `discord.js`, `manager.js`, `notify.js`) **MUST** verify the `Origin` or `Referer` headers.
- If a request originates from a non-whitelisted source (e.g., outside of `vnbusarchive.io.vn`), the system must return a `403 Forbidden` status. This prevents hackers from forging API calls externally or via Postman/cURL without a valid token.
- When triggering webhooks (e.g., Discord), any URL parameters provided by the user must be strictly validated to prevent Server-Side Request Forgery (SSRF).

## 4. IP Ban & Request Rate Limiting
- The system includes mechanisms for IP banning and user identification.
- **Rule:** Any backend function must read the `CF-Connecting-IP` (or `X-Real-IP`) header to accurately determine the true IP of the user behind the Cloudflare proxy. Never fully trust IP data sent by the user in the request body.

## 5. Authentication & Tokens
- **Rule:** Absolutely do not send Secret Keys (Supabase Service Role Key, Discord Webhook, Firebase Admin Key) to the client. All this information must be stored in **Cloudflare Environment Variables** and only accessed/retrieved from `functions/api/`.
- When the client needs to send a Supabase Token (Access Token) to the Backend for authentication (e.g., `api/manager.js`), it **MUST** use the HTTP Header `Authorization: Bearer <token>` instead of passing it in the JSON Body. This adheres to RESTful standards and prevents tokens from being logged in HTTP bodies.

## 6. File Upload Security (Preventing RCE & XSS via Files)
- **File Extension & MIME Type Validation:** The Backend must independently validate the file type using binary content (or strict extension whitelisting). DO NOT trust the `Content-Type` sent by the browser.
- **Allowed Formats:** `image/jpeg, image/png, image/webp, image/heic, image/heif`, and select RAW files from digital cameras.
- Potentially dangerous files like `.svg`, `.html`, `.php`, `.js` are strictly blocked to prevent malicious code storage and execution on the server.
- File Size Limit: Maximum 20MB per image (enforced on both Client and Backend).

## 7. Preventing DOM-based XSS (DOMPurify & EscapeHTML)
- **Rule:** Any text string received from an API or input by a user **MUST** be escaped (escaping special characters like `< > " '` into HTML entities) before being rendered to the screen via `.innerHTML` or Template Literals.
- Use the `app.utils.escapeHtml()` function or `DOMPurify` to sanitize the data. Never use `.innerHTML` with dirty data.

## 8. Safe Error Handling
- **Rule:** When the Backend system (`functions/api/`) catches an exception, it must absolutely not return `error.stack` or `error.message` containing directory structures, code snippets, or SQL details (Information Disclosure).
- Only return generic messages (Generic Errors) such as `"Internal server error, please try again later"`.

---

_This document is automatically generated by the AI Security Auditor. Strictly adhere to these guidelines to ensure the survival and integrity of the VNBUSARCHIVE project._
