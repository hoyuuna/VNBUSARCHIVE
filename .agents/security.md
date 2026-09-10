# VNBUSARCHIVE - Security Guidelines

This document serves as the Security Rules and Guidelines for AI Agents participating in the `vietnam-bus-spotter-main` project. Whenever working on this project, Agents **MUST** strictly adhere to the following security standards to prevent breaking the established security architecture.

---

## 1. Frontend Payload & Build Architecture
All User Interface (UI) logic resides in `src/js/` and the HTML template `_core.html` at the project root. These sources are bundled by `build-core.js`; they are NOT edited in place in `public/`.
- **Build Process:** Run `node build-core.js` to bundle `src/js/*.js` into `public/app.js` (plain text) and to render `public/index.html` from `_core.html`.
- **Load Process:** When the browser loads `public/index.html`, it executes the CDN library `<script>` tags and then loads `/app.js` via a generated `<script src="/app.js?v=<cacheBuster>">` tag; the app boots through `window.app.init()`.
- **Historical note:** The old Base64 anti-tamper mechanism (`functions/api/_core.js` served via `/api/_core` and injected with `document.write()`) has been RETIRED. `build-core.js` now deletes any stale `functions/api/_core.js`, and `public/index.html` no longer calls `/api/_core`. Do NOT reintroduce that mechanism.
- **Rule:** Do NOT edit `public/app.js` or `public/index.html` directly. All logic must be inside `src/js/` and `_core.html` and rebuilt with `node build-core.js`. Do not inject static `<script src="...">` logic tags manually into `_core.html`.

## 2. Content-Security-Policy (CSP)
The CSP is defined in the root `csp.json` and emitted by `build-core.js` into `public/_headers` (the file served by Cloudflare Pages). It is no longer a `<meta>` tag in `public/index.html`.
- **Purpose:** Prevents XSS (Cross-Site Scripting) attacks, malicious code injection, and data exfiltration to unknown domains.
- **Rule - Adding New Packages/CDNs/APIs:**
  If you add a new API, CDN library (CSS/JS), or external image source (Cloud Storage, WSRV, Giphy, etc.), you **MUST ADD** that domain to the corresponding directive in `csp.json`, then rerun `node build-core.js` to regenerate `public/_headers`.
  *Examples:*
  - If you use `import()`, `fetch()`, or `WebSocket` to `https://new-api.example.com`, add `https://new-api.example.com` to `connect-src` (and potentially `script-src` for imports).
  - If you load images from `https://images.example.com`, add it to `img-src`.
  - If you add a script from `https://cdn.example.com`, add it to `script-src`.
- **Rule - Restrictions:**
  - Absolutely **DO NOT** remove the CSP or use the wildcard `*` for critical directives (except for already whitelisted services like `https://*.supabase.co`).
  - Never add `'unsafe-inline'` unless strictly necessary. Note it is currently present in `csp.json` because the app relies on inline scripts in `index.html` and dynamic style/script handling.

## 3. Preventing SSRF & Origin / Referer Bypass
- **Rule (Cloudflare Functions):** Every file in the `functions/` directory (e.g., `functions/api/discord.js`, `functions/api/manager.js`, `functions/api/notify.js`) **MUST** verify the `Origin` or `Referer` headers.
- If a request originates from a non-whitelisted source (e.g., outside of `vnbusarchive.io.vn`), the system must return a `403 Forbidden` status. This prevents hackers from forging API calls externally or via Postman/cURL without a valid token.
- When triggering webhooks (e.g., Discord), any URL parameters provided by the user must be strictly validated to prevent Server-Side Request Forgery (SSRF).

## 4. IP Ban & Request Rate Limiting
- The system includes mechanisms for IP banning and user identification.
- **Rule:** Any backend function must read the `CF-Connecting-IP` (or `X-Real-IP`) header to accurately determine the true IP of the user behind the Cloudflare proxy. Never fully trust IP data sent by the user in the request body.

## 5. Authentication & Tokens
- **Rule:** Absolutely do not send Secret Keys (Supabase Service Role Key, Discord Webhook, Firebase Admin Key) to the client. All this information must be stored in **Cloudflare Environment Variables** and only accessed/retrieved from `functions/`.
- When the client needs to send a Supabase Token (Access Token) to the Backend for authentication (e.g., `functions/api/manager.js`), it **MUST** use the HTTP Header `Authorization: Bearer <token>` instead of passing it in the JSON Body. This adheres to RESTful standards and prevents tokens from being logged in HTTP bodies.

## 6. File Upload Security (Preventing RCE & XSS via Files)
- **File Extension & MIME Type Validation:** The Backend must independently validate the file type using binary content (or strict extension whitelisting). DO NOT trust the `Content-Type` sent by the browser.
- **Allowed Formats:** `image/jpeg, image/png, image/webp, image/heic, image/heif`, and select RAW files from digital cameras.
- Potentially dangerous files like `.svg`, `.html`, `.php`, `.js` are strictly blocked to prevent malicious code storage and execution on the server.
- File Size Limit: Maximum 20MB per image (enforced on both Client and Backend — see `functions/api/upload.js`).

## 7. Preventing DOM-based XSS (DOMPurify & EscapeHTML)
- **Rule:** Any text string received from an API or input by a user **MUST** be escaped (escaping special characters like `< > " '` into HTML entities) before being rendered to the screen via `.innerHTML` or Template Literals.
- Use the `app.utils.escapeHtml()` function or `DOMPurify` to sanitize the data. Never use `.innerHTML` with dirty data.

## 8. Safe Error Handling
- **Rule:** When the Backend system (`functions/`) catches an exception, it must absolutely not return `error.stack` or `error.message` containing directory structures, code snippets, or SQL details (Information Disclosure).
- Only return generic messages (Generic Errors) such as `"Internal server error, please try again later"`.

---

_This document defines the security guidelines for the VNBUSARCHIVE project. Strictly adhere to these guidelines to ensure the survival and integrity of the project._