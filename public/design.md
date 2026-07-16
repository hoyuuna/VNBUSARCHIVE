---
version: 1.1.0
name: HoyuUI
description: VNBUSARCHIVE's HoyuUI design system. A glassmorphism-centric, high-contrast interface designed for database management.
colors:
  primary: "#09090b"
  secondary: "#18181b"
  tertiary: "#52525b"
  neutral: "#71717a"
  background-100: "#ffffff"
  background-200: "#fafafa"
  gray-100: "#f4f4f5"
  gray-200: "#e4e4e7"
  gray-300: "#d4d4d8"
  gray-400: "#a1a1aa"
  gray-500: "#71717a"
  gray-600: "#52525b"
  gray-700: "#3f3f46"
  gray-800: "#27272a"
  gray-900: "#18181b"
  gray-1000: "#09090b"
  gray-alpha-100: "rgba(0, 0, 0, 0.04)"
  gray-alpha-200: "rgba(0, 0, 0, 0.05)"
  gray-alpha-300: "rgba(0, 0, 0, 0.1)"
  gray-alpha-400: "rgba(0, 0, 0, 0.15)"
  gray-alpha-500: "rgba(0, 0, 0, 0.3)"
  glass-surface-100: "rgba(255, 255, 255, 0.7)"
  glass-border-100: "rgba(255, 255, 255, 0.6)"
  glass-surface-overlay: "rgba(0, 0, 0, 0)"
  glass-overlay-blur: "blur(8px)"
  glass-surface-blur: "blur(20px)"
  blue-50: "#eff6ff"
  blue-100: "#dbeafe"
  blue-500: "#3b82f6"
  blue-600: "#2563eb"
  red-50: "#fef2f2"
  red-500: "#ef4444"
  red-600: "#dc2626"
  amber-100: "#fef3c7"
  amber-200: "#fde68a"
  amber-400: "#fbbf24"
  amber-500: "#f59e0b"
  amber-600: "#d97706"
  amber-700: "#b45309"
  amber-800: "#92400e"
  amber-900: "#78350f"
  purple-500: "#a855f7"
  purple-600: "#9333ea"
  indigo-500: "#6366f1"
  indigo-600: "#4f46e5"
typography:
  heading-24:
    fontFamily: Be Vietnam Pro
    fontSize: 24px
    fontWeight: 800
    lineHeight: 32px
  heading-20:
    fontFamily: Be Vietnam Pro
    fontSize: 20px
    fontWeight: 700
    lineHeight: 28px
  heading-18:
    fontFamily: Be Vietnam Pro
    fontSize: 17.6px
    fontWeight: 600
    lineHeight: 24px
  stat-24:
    fontFamily: Be Vietnam Pro
    fontSize: 24px
    fontWeight: 700
    letterSpacing: -0.02em
  label-16:
    fontFamily: Be Vietnam Pro
    fontSize: 16px
    fontWeight: 600
    lineHeight: 24px
  label-14:
    fontFamily: Be Vietnam Pro
    fontSize: 14px
    fontWeight: 500
    lineHeight: 20px
  label-12:
    fontFamily: Be Vietnam Pro
    fontSize: 12.8px
    fontWeight: 600
    lineHeight: 18px
  label-11:
    fontFamily: Be Vietnam Pro
    fontSize: 11.2px
    fontWeight: 600
    lineHeight: 16px
    letterSpacing: 0.05em
    textTransform: uppercase
  copy-14:
    fontFamily: Be Vietnam Pro
    fontSize: 14px
    fontWeight: 400
    lineHeight: 22.4px
  badge-9:
    fontFamily: Be Vietnam Pro
    fontSize: 8.8px
    fontWeight: 700
    letterSpacing: 0.03em
    textTransform: uppercase
  watermark-40:
    fontFamily: Montserrat
    fontSize: clamp(10px, 4.5vw, 40px)
    fontWeight: 700
  brand-40:
    fontFamily: Montserrat
    fontSize: 40px
    fontWeight: 800
    fontStyle: italic
    letterSpacing: 2px
spacing:
  1: 4px
  2: 8px
  3: 12px
  4: 16px
  5: 20px
  6: 24px
  8: 32px
  base: 4px
rounded:
  sm: 4px
  md: 6px
  lg: 8px
  xl: 10px
  full: 9999px
components:
  modal-content:
    backgroundColor: "{colors.glass-surface-100}"
    backdropFilter: "{colors.glass-surface-blur}"
    border: "1px solid {colors.glass-border-100}"
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)"
    rounded: "{rounded.lg}"
  modal-overlay:
    backgroundColor: "{colors.glass-surface-overlay}"
    backdropFilter: "{colors.glass-overlay-blur}"
  dropdown-menu:
    backgroundColor: "{colors.glass-surface-100}"
    backdropFilter: "{colors.glass-surface-blur}"
    border: "1px solid {colors.glass-border-100}"
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)"
    rounded: "{rounded.lg}"
  input:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    typography: "{typography.label-14}"
    border: "none"
    padding: "8px 12px"
  input-active:
    backgroundColor: "{colors.background-100}"
    boxShadow: "inset 0 0 0 2px {colors.secondary}"
  table-header:
    backgroundColor: "{colors.gray-100}"
    textColor: "{colors.neutral}"
    typography: "{typography.label-11}"
    padding: "10px"
    borderBottom: "1px solid {colors.gray-200}"
  badge-shiny:
    typography: "{typography.badge-9}"
    rounded: "0.2rem"
    padding: "0.1rem 0.3rem"
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)"
---

# HoyuUI

## Overview

HoyuUI is VNBUSARCHIVE's core design system, built to maintain a consistent, modern, and highly legible database interface. The aesthetic relies heavily on high contrast, strict monochrome palettes for core UI elements, and a prominent "Glassmorphism" effect for floating surfaces. Color is strictly reserved for intent: standard interfaces are Black, White, and Gray, while Red, Yellow, and Blue are utilized only for notifications, badges, and alerts.

## 1. Global Setup & Boilerplate

All pages must enforce font-smoothing and set the background to `#fafafa` with `#09090b` text.

```css
body {
    -webkit-font-smoothing: antialiased !important;
    -moz-osx-font-smoothing: grayscale !important;
    text-shadow: 0 0 0.5px rgba(0, 0, 0, 0.15); /* Anti-aliasing micro-shadow */
    background-color: #fafafa;
    color: #09090b;
}
```

## 2. Elevation & Glassmorphism (The Core Identity)

Rather than relying purely on solid drop shadows, HoyuUI establishes depth through **Glassmorphism** for all elevated components (Dropdowns, Menus, Modals, Popovers).

### 2.1. Modal implementation
The backdrop overlay must be completely transparent but apply a strong blur (`blur(8px)`). The modal content box itself applies the standard 20px blur glass surface. 

**HTML/CSS Example:**
```html
<!-- Modal Overlay -->
<div id="example-modal" class="hidden fixed inset-0 flex items-center justify-center p-4 z-50" 
     style="background-color: rgba(0, 0, 0, 0) !important; backdrop-filter: blur(8px) !important; -webkit-backdrop-filter: blur(8px) !important;">
    
    <!-- Modal Content -->
    <div class="rounded-2xl p-6 flex flex-col items-center max-w-sm w-full transform scale-95 transition-transform duration-300 opacity-0"
         style="background-color: rgba(255, 255, 255, 0.7) !important; backdrop-filter: blur(20px) !important; -webkit-backdrop-filter: blur(20px) !important; border: 1px solid rgba(255, 255, 255, 0.6) !important; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1) !important;">
        
        <!-- Inner elements MUST NOT have solid backgrounds (bg-white) that block the glass effect -->
        <h3 class="text-lg font-bold text-gray-900 mb-1">Glass Modal Title</h3>
        <p class="text-[12px] text-gray-500 mb-5 text-center px-2">Description text goes here.</p>
        
        <button class="w-full bg-black text-white py-2.5 rounded-lg font-bold text-sm hover:bg-gray-800 transition shadow-sm border border-black">
            Confirm
        </button>
    </div>
</div>
```

### 2.2. Floating Menus & Dropdowns
Dropdown menus share the same exact `20px` glassmorphism properties as Modal contents, but with slightly higher opacity shadow.

```css
.filter-menu, .notification-dropdown, #user-dropdown {
    background-color: rgba(255, 255, 255, 0.7) !important;
    backdrop-filter: blur(20px) !important;
    -webkit-backdrop-filter: blur(20px) !important;
    border: 1px solid rgba(255, 255, 255, 0.6) !important;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1) !important;
    border-radius: 0.5rem !important;
}
```

**Interaction Rules for Dropdown items:**
```css
/* Transparent items to not block the glass */
.filter-item {
    background-color: transparent !important;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05) !important;
    transition: background-color 0.2s ease;
}
.filter-item:hover {
    background-color: rgba(0, 0, 0, 0.04) !important;
}
```

## 3. Data Presentation Components

### 3.1. Standard Data Table
Used for raw listings (e.g. History logs, User logs).

**CSS:**
```css
.history-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
.history-table th { background-color: #f4f4f5; text-align: left; padding: 10px; border-bottom: 1px solid #e4e4e7; font-weight: 600; text-transform: uppercase; color: #71717a; font-size: 0.7rem; letter-spacing: 0.05em; }
.history-table td { padding: 10px; border-bottom: 1px solid #e4e4e7; background: white; color: #09090b; }
```

**HTML:**
```html
<div class="history-table-wrapper w-full overflow-x-auto">
    <table class="history-table min-w-[400px]">
        <thead>
            <tr>
                <th>Column 1</th>
                <th>Column 2</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Data</td>
                <td>Data</td>
            </tr>
        </tbody>
    </table>
</div>
```

### 3.2. Detailed Info Table
Used to display properties of a single entity (e.g., Bus Details, User Profile). Two-tone design.

**CSS:**
```css
.info-table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 0.875rem; border: 1px solid #e4e4e7; border-radius: 6px; overflow: hidden; table-layout: fixed; }
.info-table td { padding: 8px 12px; border-bottom: 1px solid #e4e4e7; vertical-align: middle; word-wrap: break-word; overflow-wrap: break-word; }
.info-table .label { background-color: #f4f4f5; width: 30%; color: #09090b; font-weight: 600; border-right: 1px solid #e4e4e7; }
.info-table .value-cell { background-color: #fff; padding: 0; }
```

**HTML:**
```html
<table class="info-table">
    <tbody>
        <tr>
            <td class="label">Property Name</td>
            <td class="value-cell">
                <input type="text" class="info-input w-full border-none px-3 py-2 font-medium text-[#09090b] bg-transparent outline-none text-sm" value="Value here" readonly>
            </td>
        </tr>
    </tbody>
</table>
```
*Note*: `info-input` gains `box-shadow: inset 0 0 0 2px #18181b; background: #fff;` when not readonly.

## 4. Badges (Shiny & Roles)

Badges use strong gradients and infinite animations to denote importance. 

**Base CSS (`badge-shiny`):**
```css
.badge-shiny {
    position: relative; overflow: hidden; display: inline-flex; align-items: center;
    padding: 0.1rem 0.3rem; border-radius: 0.2rem; font-size: 0.55rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.03em; color: white;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1); margin-left: 4px; user-select: none; line-height: 1;
}
.badge-shiny::after {
    content: ''; position: absolute; top: 0; left: -100%; width: 40%; height: 100%;
    background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0) 100%);
    animation: shine 3s infinite; transform: skewX(-20deg);
}
@keyframes shine { 0% { left: -100%; } 15% { left: 200%; } 100% { left: 200%; } }
```

**Variants (Add class alongside `badge-shiny`):**
- `badge-admin`: `background: linear-gradient(135deg, #eab308, #ca8a04);`
- `badge-manager`: `background: linear-gradient(135deg, #4f46e5, #a855f7);`
- `badge-top1`: `background: linear-gradient(135deg, #fbbf24, #b45309);`
- `badge-beta`: (Special text color) `color: #92400e; background: linear-gradient(135deg, #fde68a, #f59e0b);`

**HTML:**
```html
<span>Username<span class="badge-shiny badge-admin">ADMIN</span></span>
```

## 5. Pagination

Square buttons, standardizing list navigation.

**HTML:**
```html
<div class="pagination-wrap flex items-center justify-center gap-1.5 flex-wrap mt-4">
    <button class="page-btn min-w-[34px] h-[34px] px-2 border border-[#e4e4e7] rounded-md bg-white text-[#09090b] text-sm font-semibold hover:bg-[#f4f4f5] hover:border-[#a1a1aa] transition-all">1</button>
    <button class="page-btn active min-w-[34px] h-[34px] px-2 border border-[#09090b] rounded-md bg-[#09090b] text-white text-sm font-semibold cursor-default">2</button>
    <span class="page-btn dots border-none bg-transparent cursor-default text-[#71717a] tracking-widest">...</span>
</div>
```

## 6. Animations (Motion)

Apply these exact class names for standardized enter/exit transitions. They rely on the custom cubic-bezier: `cubic-bezier(0.16, 1, 0.3, 1)`.

- `slide-in-right`: Slides 30px from right to left while fading in over 0.3s.
- `slide-in-left`: Slides 30px from left to right while fading in over 0.3s.
- `fade-zoom-in-page`: Zooms from 0.98 to 1 and fades in over 0.3s.
- `modal-content-enter`: Zooms from 0.95 and Y-translates 10px to 0 over 0.3s.
- `toast-enter`: Y-translates from -20px to 0 over 0.4s.

## 7. Do's and Don'ts

- **Do** strip out solid `bg-white` or `bg-gray-50` background classes from elements inside modals to ensure the glassmorphism blur effect penetrates the entire modal structure.
- **Do** use `Be Vietnam Pro` for all general text to prevent diacritic clipping in Vietnamese.
- **Do** maintain square-rounded button aesthetics (`rounded-md` or `rounded-lg`) for all general control buttons to preserve UI consistency. Avoid `rounded-full` unless designing pill tags or circular icon buttons.
- **Don't** use Red, Blue, or Yellow for structural borders or general backgrounds. They are only for intent (Errors, Information, Warnings/Badges).
- **Don't** nest backdrop filters without ensuring parent containers don't block the blur context. Use `::before` pseudo-elements if necessary to apply blur to headers without breaking z-index contexts for dropdowns.
- **Don't** add drop shadows directly to text unless it's a micro-shadow (`text-shadow: 0 0 0.5px rgba(0, 0, 0, 0.15)`) applied to the `body` to enforce anti-aliasing.
- **Don't** ever use horizontal separator or dividing lines (`border-t`, `border-top`, `<hr>`) inside cards, modals, tables, or above action buttons (`Cập nhật lịch sử`, `Cập nhật thông tin`, modal footers, etc.). Use clean margins and spacing (`mt-3`, `mt-4`) to separate UI elements seamlessly without visually jarring lines.
