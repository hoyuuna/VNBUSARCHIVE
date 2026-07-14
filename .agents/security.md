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
