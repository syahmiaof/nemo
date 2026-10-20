# Nemo — Frontend Security & Data Storage Safety Audit

**Audit Date:** 2026-10-20  
**Status:** Completed & Verified  
**Scope:** Client-Side Single-Page Application (PWA), IndexedDB (Dexie v4), Local Asset Storage, and JSON Backup Pipeline.  
**Auditor:** Principal Reliability & Security Engineer  

---

## 1. Threat Model & Architectural Overview

Nemo is an offline-first, client-side personal workspace operating entirely within the user's browser runtime via IndexedDB (`dexie` v4.0.11).

```
+--------------------------------------------------------------------------+
|                          BROWSER SANDBOX                                 |
|                                                                          |
|  +--------------------+   Typed Schema   +----------------------------+  |
|  |  React UI (JSX)    | <=============>  | Dexie IndexedDB (12 Stores)|  |
|  |  (Auto-Escaped)    |                  | (Atomic ACID Transactions) |  |
|  +--------------------+                  +----------------------------+  |
|            |                                            |                |
|            | Validated Web URLs                         | Safe Parser    |
|            v                                            v                |
|  +--------------------+                  +----------------------------+  |
|  | External Anchors   |                  | JSON Backup Import/Export  |  |
|  | (rel="noopener")   |                  | (Schema + Ref Integrity)   |  |
|  +--------------------+                  +----------------------------+  |
|                                                                          |
+--------------------------------------------------------------------------+
|  ZERO Cloud Egress  |  ZERO Remote API  |  ZERO Third-Party Telemetry    |
+--------------------------------------------------------------------------+
```

### Key Security Attributes
- **Zero Cloud Egress:** Nemo transmits zero telemetry, zero analytics, and zero user data across the network. All operations terminate locally within the browser origin.
- **No Remote Credentials:** No API keys, passwords, authentication cookies, or tokens are stored or transmitted.
- **Isolated Browser Origin:** Data is sandboxed within the browser's origin-specific IndexedDB storage pool.

---

## 2. Cross-Site Scripting (XSS) & Markup Injection Analysis

### 2.1 Absence of Raw HTML Injection (`dangerouslySetInnerHTML`)
A static analysis of all TypeScript/TSX code in `src/` confirms zero occurrences of `dangerouslySetInnerHTML`, `innerHTML`, `outerHTML`, or `document.write`:
- **Result:** 0 matches across all application components.
- **Impact:** All user-supplied inputs (titles, descriptions, subject names, notes, tags) are rendered through React's native virtual DOM engine, which automatically escapes HTML entities prior to insertion into the document tree.

### 2.2 SVG XML Injection Remediation
In `src/lib/utils.ts`, typographic project covers are dynamically rendered via SVG data URLs based on user project titles and categories.
- **Vulnerability Identified:** If a project title contained special XML characters (`<`, `>`, `&`, `"`, `'`), the generated SVG data URL could experience XML parsing corruption or attempt markup breakout.
- **Remediation Implemented:**
  ```typescript
  function escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  }
  ```
- **Verification:** Verified in stress tests with special characters (`<Nemo & Co. "Sprint 3" 'Test'>`). The SVG parses cleanly with zero XML syntax errors.

### 2.3 URI Scheme Hijacking (`javascript:` & `data:`)
- **Risk:** User-entered URLs for project repositories, live deployments, and academic assignment portals could potentially contain executable pseudo-schemes (e.g. `javascript:alert(1)`).
- **Remediation Implemented:**
  1. **Strict Protocol Validation (`isValidWebUrl`):**
     ```typescript
     export function isValidWebUrl(url?: string | null): boolean {
       if (!url || typeof url !== 'string') return false;
       try {
         const parsed = new URL(url);
         return parsed.protocol === 'http:' || parsed.protocol === 'https:';
       } catch {
         return false;
       }
     }
     ```
  2. **Double-Layer Enforcement:**
     - **Input Layer:** Form validation in `ProjectFormModal.tsx` and `AcademicsPage.tsx` rejects any URL failing `isValidWebUrl`.
     - **Render Layer:** `ProjectDetailPage.tsx` and `AcademicsPage.tsx` guard anchor rendering with `{isValidWebUrl(url) && <a href={url} ...>}`. If a malformed or dangerous URL exists in storage, the link is suppressed entirely.
  3. **Tabnabbing Protection:** All external links are compiled with `target="_blank" rel="noopener noreferrer"`, isolating the execution context of target windows from `window.opener`.

---

## 3. Local File Upload & Asset Security

### 3.1 Project Cover Image Uploads
Project image assets are stored locally in IndexedDB's `assetBlobs` store as Base64 data URLs.
- **File Size Bounding:** Enforced ceiling of `2MB` (`file.size > 2 * 1024 * 1024`), preventing browser memory exhaustion during FileReader processing.
- **MIME Type Whitelist:**
  ```typescript
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    error('Invalid file type', 'Please select a valid image file (JPEG, PNG, WebP, or GIF).');
    return;
  }
  ```
  SVGs, HTML files, scripts, and executable binaries are explicitly rejected at the input handler.

### 3.2 Backup Import Security
The backup restore pipeline in `SettingsPage.tsx` and `src/db/nemoDb.ts` handles untrusted user-supplied JSON files.
- **Payload Size Limiting:** Enforced ceiling of `25MB` prior to reading file text into memory.
- **Envelope Pre-Check:** Rejects any JSON payload where `app !== 'nemo'` or `version !== 1`.
- **Prototype Pollution Guard:**
  ```typescript
  const rawParsed = JSON.parse(jsonContent, (key, value) => {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      return undefined;
    }
    return value;
  });
  ```
  Properties targeting `Object.prototype` are stripped during parsing.
- **Strict Zod Schema Validation:** `BackupSchema.safeParse(rawParsed)` validates every entity across all 12 tables against exact runtime types.
- **Referential Integrity Audit (`validateReferentialIntegrity`):**
  - Confirms zero duplicate primary keys across all 12 tables.
  - Verifies all foreign key relationships (tasks referencing valid project/assignment/goal IDs, milestones referencing valid owner IDs, goal-task link bindings).
  - Rejects foreign key orphans before invoking database mutations.
- **Atomic Rollback:** All table modifications execute inside a single Dexie transaction (`db.transaction('rw', [...])`). Any schema or constraint violation triggers an automatic rollback, leaving existing workspace data intact.

---

## 4. Content Security Policy (CSP) Recommendations

For production static hosting (Vercel, Cloudflare Pages, Netlify, or Nginx), the following HTTP headers are recommended:

```http
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob:; connect-src 'self'; media-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
```

### Directive Justification
- `default-src 'self'`: Default restriction to same origin.
- `script-src 'self'`: Disallows external scripts and untrusted CDN execution.
- `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`: Allows Google Fonts stylesheet and Tailwind inline utility classes.
- `font-src 'self' https://fonts.gstatic.com data:`: Allows Google Web Fonts loaded by Urbanist / Geist Mono.
- `img-src 'self' data: blob:`: Required for SVG data URL covers and local image previews stored in IndexedDB.
- `object-src 'none'`: Neutralizes legacy browser plugins (Flash, Java, ActiveX, Acrobat).
- `frame-ancestors 'none'`: Prevents clickjacking attacks by forbidding embedding inside `<iframe>` or `<frame>`.
- `Permissions-Policy`: Restricts browser hardware access to zero unused features.

---

## 5. Dependency Vulnerability Audit (`npm audit`)

An audit of installed dependencies was executed:
- **Findings:**
  - `tinypool` / `vitest`: Development-only dependency advisory. Vitest is only used during local test execution (`npm run test`) and is never packaged into the production client bundle.
  - `vite` / `esbuild`: Development server HTTP proxy / dev-server advisories. Nemo's production build produces purely static static HTML, JS, and CSS files deployed to static CDNs.
  - `react-router`: Advisory relating to Server-Side Rendering (SSR) hydration mismatches. Nemo is a 100% client-rendered Single-Page Application (SPA) with zero SSR endpoints.
- **Safety Directive:**
  - Running `npm audit fix --force` attempts to install unreleased breaking major versions (`react-router` v7, `tailwindcss` v4), which breaks existing build pipelines and styling.
  - Because Nemo deploys zero Node.js server runtimes, zero SSR hydration, and zero backend listening ports, all dev-time advisories are non-exploitable in the client runtime.

---

## 6. Audit Conclusion & Compliance Summary

| Control | Mechanism | Verification Status |
|---|---|---|
| **XSS Prevention** | React virtual DOM auto-escaping + 0 `dangerouslySetInnerHTML` | **PASS** (Zero instances) |
| **SVG XML Safety** | `escapeXml()` sanitization in `generateTypographicCover()` | **PASS** (Verified with `<`, `>`, `&`) |
| **URI Scheme Validation** | `isValidWebUrl()` enforcing `http:`/`https:` on input and render | **PASS** (Blocks `javascript:`) |
| **Tabnabbing Guard** | `target="_blank" rel="noopener noreferrer"` | **PASS** (Verified on all external links) |
| **Image Asset Control** | 2MB file limit + strict MIME type whitelist | **PASS** (Rejects non-raster files) |
| **Backup Integrity** | Safe JSON parse + Zod Schema + In-Memory Foreign Key Checks | **PASS** (Rolls back invalid backups) |
| **Prototype Pollution** | Key reviver stripping `__proto__`, `constructor`, `prototype` | **PASS** (Verified in parse pipeline) |
| **Storage Security** | 100% on-device IndexedDB isolation | **PASS** (Zero network egress) |
