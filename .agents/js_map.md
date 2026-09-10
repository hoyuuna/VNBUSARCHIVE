# JS Map: Javascript Architecture Map

All Javascript for the project is modularized and bundled by concatenation for easier maintenance. Below is a map of the location and function of each file.

## 1. Directory `src/js/` (Core Frontend Source)
This directory stores the modular JS files of the frontend. When `node build-core.js` runs, these files are concatenated **in the fixed order listed in `build-core.js`** into `public/app.js`. They must NOT use ES `import`/`export`; each module attaches to the global `window.app` object.

Order of bundling (as defined in `build-core.js`):
`00_core.js`, `01_router.js`, `02_settings.js`, `03_auth.js`, `page_feed.js`, `page_search.js`, `page_leaderboard.js`, `page_help.js`, `page_reference.js`, `page_upload.js`, `page_photo.js`, `page_vehicle.js`, `page_admin.js`, `page_map.js`.

*   **`00_core.js`**: Initializes the global `window.app` variable, contains utility functions, UI logic, database init, global variables, and global event listeners.
*   **`01_router.js`**: Router init logic (`app.init`), SPA click interception, session bootstrap, Supabase auth-state handling, realtime channel setup.
*   **`02_settings.js`**: Settings, docs, notifications.
*   **`03_auth.js`**: User authentication (`app.auth`), login, logout, profile fetching, and QR Login.
*   **`page_feed.js`**: UI display of the feed (`app.views`), including the `reapproveBtn` handler in the photo detail flow.
*   **`page_search.js`**: The advanced search system (`app.search`).
*   **`page_leaderboard.js`**: Leaderboard and top uploaders.
*   **`page_help.js`**: Newsboard, help, contact, active announcements.
*   **`page_reference.js`**: Operator, model, and route view components.
*   **`page_upload.js`**: The upload feature, cropping/compressing images, preference.
*   **`page_photo.js`**: Photo details, comments, and edit features.
*   **`page_vehicle.js`**: Vehicle details logic.
*   **`page_admin.js`**: Dashboard for Admins/Managers (`app.admin`), achievements, `approvePhoto`, and the `approvedPlateSet` / `approvedOpSet` / `approvedRouteSet` / `approvedModelSet` reference sets.
*   **`page_map.js`**: Logic for rendering and interacting with maps (`app.map`).

---

## 2. Directory `functions/` (Cloudflare Backend)
Cloudflare Pages Functions running on the serverless environment. Responsible for executing hidden logic and database security. Route files (`functions/*.js`, `functions/**/[id].js`, `functions/route/[[path]].js`) map to URL paths; shared APIs live under `functions/api/`.

*   **`functions/api/` (API endpoints)**
    *   **`admin/action.js`**: Verifies JWT tokens, runs with Admin/Manager privileges to perform data insertions into `vehicles` and `vehicle_history` tables via `supabase-js`, bypassing Row-Level Security (RLS). Also handles photo approval (`action: 'approve'`) and denial (`action: 'deny'`).
    *   **`admin/replace-image.js`**: Replaces the CDN image for an existing photo.
    *   **`upload.js`**: Handles photo upload to the CDN, validates file type and size (max 20MB), and inserts pending `vehicles` records.
    *   **`photo.js`**: Photo-related backend operations.
    *   **`delete-image.js`**: Deletes a photo image from the CDN.
    *   **`manager.js`**: Manager-privileged operations (expects `Authorization: Bearer <token>`).
    *   **`discord.js`**, **`notify.js`**, **`unlink.js`**, **`github.js`**, **`embed.js`**, **`system.js`**, **`sitemap.js`**: Integrations and system utilities.
*   **`functions/*.js` and nested routes** (`auth.js`, `contact.js`, `help.js`, `leaderboard.js`, `map.js`, `model.js`, `operator.js`, `route.js`, `search.js`, `settings.js`, `upload.js`, `index.js`, and the `[id]`/`[[path]]` route handlers): per-page server functions.
*   **Note:** `functions/api/_core.js` no longer exists. The old Base64 payload endpoint has been retired; the frontend now loads `public/app.js` directly.

---

## 3. Build files in the Root Directory
*   **`build-core.js`**: A NodeJS script. Run `node build-core.js` to read the files in `src/js/`, bundle them into `public/app.js`, render `public/index.html` from `_core.html`, generate `public/_headers` from `csp.json`, and compile Tailwind CSS.
*   **`_core.html`**: The webpage template. Contains the CSS and HTML structure. Does NOT contain JS logic (JS has been split out into `src/js/`).