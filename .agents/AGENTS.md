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
