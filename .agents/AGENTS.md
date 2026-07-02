## UI and Color Palette Rules
- Use only black, white, and gray for standard UI components. Red, yellow, and blue are reserved strictly for notification modals.
- Always reuse existing designs (popups, modals) unless explicitly asked to create a new design.

## Project Stack & Deployment
- **Hosting/Platform:** Cloudflare Pages (Framework preset: `None`).
- **Frontend:** Pure vanilla HTML, CSS, and JavaScript.
- **Backend/API:** Cloudflare Pages Functions (Serverless architecture).
- **Rule:** All web assets must be standard web-compliant, and any backend logic must leverage Cloudflare's serverless environment.

## Design System & UI Reference
- The design system, HoyuUI, is fully documented at `/public/design.md`. 
- **Rule:** Before creating new UI components or layouts, ALWAYS read `/public/design.md` and use the exact design tokens, CSS values, and HTML structures specified there.

## Git Workflow
- **Rule:** Always automatically commit and push git changes (`git add -A; git commit -m "..."; git push`) after successfully completing user requests or modifying code.