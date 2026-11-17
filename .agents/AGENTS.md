# AGENTS — VNBUSARCHIVE Project Rules

**MANDATORY FIRST STEP:** Before responding to the user, answering any questions, or writing any code, read ALL markdown documents located in the `.agents/` directory (`AGENTS.md`, `js_map.md`, `security.md`).

## UI and Color Palette Rules (Material 3 Expressive - Ocean Blue)
- Design Language: **Material 3 Expressive** with an Ocean Blue tonal palette.
- Color Tokens:
  * Light Mode: Primary `#006399`, Primary Container `#cde5ff`, On-Primary Container `#001d32`, Secondary `#51606f`, Secondary Container `#d4e4f6`, Surface `#f8f9ff`, Surface Containers `#eceef5` / `#e6e8ef` / `#e0e2e9`, Outline Variant `#c2c7cf`.
  * Dark Mode: Primary `#94ccff`, Primary Container `#004b74`, On-Primary Container `#cde5ff`, Secondary `#b8c8da`, Secondary Container `#394957`, Surface `#101418`, Surface Containers `#1d2024` / `#272b2f` / `#32353a`, Outline Variant `#42474e`.
- **Button & Component Shapes:**
  * Action buttons, search bars, chips, and badges must use Expressive pill shapes (`rounded-full` / `border-radius: 9999px`).
  * Cards use expressive rounded corners (`rounded-2xl` or `rounded-3xl` / 20px–24px).
  * Modals, sheets, and dialogs use extra-large expressive corners (`rounded-3xl` / 28px).
- **Elevation & Surfaces:**
  * Elevation is achieved through M3 tonal surface containers combined with soft ambient drop shadows (`--md-elevation-1` to `--md-elevation-3`), NOT harsh 1px black borders or notebook grid backgrounds.
  * Card and modal outlines use subtle outline-variant borders (`#c2c7cf` in light mode, `#42474e` in dark mode).
- **Deep-linking in Modals/Settings:** When UI elements or buttons trigger multi-tab modals (such as Settings or Admin panels), always navigate directly to the target tab and submenu (e.g., `app.settings.open('profile', 'account')`) rather than opening the default or blank landing screen.
- **No Component Separator Lines (`border-t`, `<hr>`):** Avoid hard horizontal separator lines (`border-t`, `<hr>`) to divide sections, card bodies, or action buttons. Components flow smoothly with spacing and tonal container separation.
- **CRITICAL INVARIANT - DARK/LIGHT MODE SYNCHRONIZATION:** You are STRICTLY FORBIDDEN from making one-sided UI updates. ANY new feature, bug fix, or modification that involves the UI (HTML layout, CSS, Tailwind classes, or JS DOM manipulation) **MUST** be implemented and styled for BOTH Light Mode (Tailwind classes in `_core.html` / `src/js/`, or `public/css/light.css`) AND Dark Mode (`public/css/dark.css`).
  * If you add a hover state, active state, or selected state in Light Mode, YOU MUST explicitly define its counterpart in `dark.css`.
  * If you change border colors, background colors, or text colors, YOU MUST verify and update how it looks in `dark.css`.
  * Failure to synchronize both themes is considered a severe violation of the system architecture. Always ask yourself: "How does this look in Dark Mode? Did I add the CSS for it?"

## Project Stack & Deployment
- **Hosting/Platform:** Cloudflare Pages (Framework preset: `None`).
- **Frontend:** Pure vanilla HTML, CSS, and JavaScript (no frontend framework).
- **Backend/API:** Cloudflare Pages Functions (`functions/` and `functions/api/`, serverless architecture).
- **Database/Auth:** Supabase (client SDK loaded from CDN).
- **Rule:** All web assets must be standard web-compliant, and any backend logic must leverage Cloudflare's serverless environment.

## Design System & UI Reference
- The design system is **Material 3 Expressive (Ocean Blue)**. Reuse its existing components and tokens; do not invent conflicting component styles.
- **Rule:** BEFORE creating any new UI component, REUSE an existing one. If a new component is genuinely necessary, ask the user for permission first.

## Git Workflow
- **Rule:** Always automatically commit and push git changes (`git add -A; git commit -m "..."; git push`) after successfully completing user requests or modifying code. **All git commit messages MUST always be written in English.**
- **Rule - Link Commits to Issues:** Whenever resolving or fixing an open GitHub issue, you **MUST link the commit to that issue** by referencing the issue number in the commit message (e.g., `fixes #<issue_number>` or `(fixes #<issue_number>)`).
- **Rule:** Ensure all temporary or junk files are deleted before pushing. If they must be kept, they MUST be placed in the `/temp` directory.

## Frontend Build & Payload Invariant
- All core frontend logic resides in `src/js/` (14 files, `00_core.js` through `page_map.js`) and the HTML template `_core.html` at the project root.
- Whenever ANY file inside `src/js/` or `_core.html` is modified, you **MUST run `node build-core.js`** immediately.
- `node build-core.js` performs the following (see `build-core.js`):
  * Concatenates `src/js/*.js` in the fixed order defined in the script into `public/app.js` (plain text, not Base64).
  * Writes the rendered page to `public/index.html`, injecting `<script src="/app.js?v=<cacheBuster>">` before `</body>` and replacing the `BUILD_VERSION_PLACEHOLDER` token in theme CSS links.
  * Deletes any stale `functions/api/_core.js` if present (the old Base64 payload mechanism is retired).
  * Generates `public/_headers` from `csp.json` (CSP + `Cache-Control: no-store` for `app.js`, `tailwind.css`, `light.css`, `dark.css`, `index.html`).
  * Compiles Tailwind via `tailwind.exe` (falls back to `npx tailwindcss`) from `src/input.css` into `public/tailwind.css`.
- **Rule:** Do NOT edit `public/app.js` or `public/index.html` directly — they are generated. Never inject static script logic into `public/index.html`. Edit `src/js/` and `_core.html`, then rebuild.
- **Rule:** The JS modules are bundled by concatenation, so they must not use ES `import`/`export`; they attach to the global `window.app` object.

## Photo Approval Guardrails (Sandbox retired)
- **No Client-Side Approval Bypasses:** All actions that approve or re-approve photos (e.g., `reapproveBtn` handler in `src/js/page_feed.js`, `approvePhoto` in `src/js/page_admin.js`) **MUST call the backend API `/api/admin/action`** (`action: 'approve'`). Never directly update `photos.status = 'approved'` from the frontend via `window.sb.from('photos').update(...)`, as this bypasses validation.
- **Sandbox retired:** The old `image_sandbox` / `sandbox:` / `data:` base64 system has been removed. All photos now reside on the real CDN as https URLs stored directly in `photos.url`. Approval (`action: 'approve'`) uses `photo.url` directly; if it is not a valid https URL (e.g. legacy `sandbox:`/`data:`/`SANDBOX_DELETED`), the backend returns a `400` error. Denial (`action: 'deny'`) only flips `status` to `denied` and keeps the CDN image.
- **Legacy data handling:** Remaining legacy `sandbox:`/`data:` URLs are treated as missing/invalid (`_isSandboxMissing`) and render as placeholders; they are never approved.

## Admin Dashboard & Vehicle Status Filtering (`XE MỚI` Badge Invariant)
- **Approved Photo Filtering:** When fetching vehicle data (`vehicles` table) to build reference sets in Admin/Manager views (`approvedPlateSet`, `approvedOpSet`, `approvedRouteSet`, `approvedModelSet` in `src/js/page_admin.js`), you **MUST strictly filter by `photos!inner(status) = 'approved'`**.
- **Why:** Because `functions/api/upload.js` inserts new vehicle records with `pending` status upon initial photo upload. If queries do not filter by approved photo status, `pending` or `denied` license plates will prematurely exist in `approvedPlateSet`, causing the `XE MỚI` (New Car) badge logic (`!approvedPlateSet.has(plateKey)`) to fail.

## Strict UI & Component Rules
- **Rule (Kiểm tra & Tái sử dụng Custom UI đã có):** Trước khi triển khai bất kỳ thành phần giao diện nào (dropdown, modal, picker, selector, button...), BẮT BUỘC phải rà soát và tìm kiếm trong codebase xem web đã có UI riêng / custom component cho mục đó chưa (ví dụ: custom dropdown chọn tỉnh thành `.filter-menu`, bộ chọn tuyến `route.openSelector`, popup thông báo HoyuUI...).
  * Nếu web **ĐÃ CÓ UI riêng**: BẮT BUỘC phải tái sử dụng lại đúng custom UI component đó để giữ sự đồng bộ 100% trên toàn hệ thống. Tuyệt đối KHÔNG được dùng mỗi chỗ một kiểu hoặc tùy tiện dùng thẻ mặc định của trình duyệt (như `<select>` thô sơ) khi web đã có custom component tương ứng.
  * Nếu web **CHƯA CÓ UI riêng**: BẮT BUỘC phải HỎI người dùng trước: muốn dùng thành phần mặc định của web (native HTML) hay thiết kế một UI custom mới. Tuyệt đối không tự ý quyết định.
- **Rule (Không tự ý chế thêm UI/tính năng):** Hệ thống không cấm chế thêm hoặc đề xuất cải tiến UI/tính năng mới, nhưng **TUYỆT ĐỐI KHÔNG ĐƯỢC TỰ Ý CHẾ THÊM KHI CHƯA HỎI**. Nếu muốn bổ sung bất kỳ thành phần, chi tiết hiển thị hay tính năng nào nằm ngoài yêu cầu trực tiếp của user thì **BẮT BUỘC PHẢI HỎI Ý KIẾN USER TRƯỚC**.
- **Rule:** ONLY design a new component or custom style for the web WHEN EXPLICITLY REQUESTED by the user.
- **Rule:** If not explicitly requested, you MUST reuse the existing custom components already available in the web app. If a new component is truly necessary to function, you MUST ask the user for permission before creating it.
- **Rule:** UNDER NO CIRCUMSTANCES are you allowed to design a custom style/component without notifying or asking the user first.
- **Rule:** NEVER use native browser modals like `alert()` or `confirm()`. ALWAYS use the custom UI modal `app.ui.showAlert(msg, okCallback, cancelCallback, options)` for showing alerts and confirmations.

## Material 3 Expressive UI & Elevation Rules (NEW INVARIANT)
- **Material 3 Expressive Language:** The system strictly uses Material 3 Expressive design with an Ocean Blue palette. Surfaces use M3 tonal elevation containers (Surface, Surface Container, Surface Container High), rounded pill buttons (`rounded-full`), and smooth ambient elevation shadows.
- **No Harsh Black Borders or Grid Patterns:** Eliminate harsh 1px black borders (`#18181b`) and notebook grid backgrounds. Use subtle M3 outline variants (`#c2c7cf` in light mode, `#42474e` in dark mode) and smooth rounded corners (`rounded-2xl` for cards, `rounded-3xl` / 28px for dialogs/modals).
- **Double Border Prevention (Đè Nét):** When applying borders to components, avoid redundant overlapping borders between parent and child elements. Maintain clean spacing and surface contrast.

## No More Supabase
- The project no longer uses Supabase. It uses a custom middleware in /temp/api-middleware which proxies to a self-hosted PostgREST and Postgres database.
- DO NOT ask the user to open the Supabase Dashboard.
