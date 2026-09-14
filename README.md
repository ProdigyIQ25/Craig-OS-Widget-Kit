# Craig OS Widget Kit

Secure, independently deployable foundation for future Craig OS widgets embedded in Notion.

Version: `0.1.0`

## BU-14 boundary

This repository contains a generic `FOUNDATION DEMO`, shared design tokens, state patterns, themes, a typed API response contract, and an embed-safe server boundary. It contains no production widgets, persistence, authentication platform, Notion writes, Personal OS access, or operational Business data access.

## Stack

- Next.js App Router
- React and TypeScript in strict mode
- Server-side route handlers
- CSS custom properties and typed theme identifiers
- Vercel hosting

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Platform landing and status page |
| `/widgets/demo` | Generic interactive foundation proof using clearly marked demo data |
| `/api/health` | Uncached server health response using the shared typed envelope |

Reserved future pattern: `/widgets/<widget-name>`. No production widget routes are implemented in BU-14.

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

No environment variable is required for the foundation demo or health endpoint. Leave `NOTION_TOKEN` and `NOTION_WORKSPACE_ID` unset until a separately authorized read-only integration requires them.

## Validation

```bash
npm run lint
npm run build
npm run start
```

Then inspect `/widgets/demo` at 320, 390, 768, and 1024 pixels and verify `/api/health` returns HTTP 200.

## Deployment

1. Authenticate the Vercel CLI without placing a token in this repository.
2. Link this directory to the standalone `craig-os-widget-kit` Vercel project.
3. Deploy a preview and validate it.
4. Promote the validated artifact or run `vercel --prod`.
5. Embed the production HTTPS `/widgets/demo` URL only in an approved Notion admin/test page.

## Architecture and security

Future Notion access follows: Browser → Craig OS Widget → server route → Notion API. `lib/server/notion-boundary.ts` is server-only and exposes credential-presence booleans, never credential values. API consumers receive structured success/failure envelopes from `lib/api-contract.ts`; raw upstream responses do not go directly to widgets.

The app sends a Content Security Policy that permits framing only by Notion origins. It sends no `X-Frame-Options` denial, uses no URL credentials, and disables browser capabilities that are unnecessary for widgets.

The demo has no Notion API dependency. If a future read-only Notion call fails, the shared explicit error/not-configured states must be rendered; live values must never be fabricated.

## Design foundation

Tokens cover typography, spacing, radius, border, panel, card, text, muted text, accent, healthy, attention, high risk, critical, and inactive states. Themes are `business`, `personal`, and `compact`. Interactive targets are at least approximately 44px, focus is visible, motion is minimal, and reduced-motion preferences are honored.

## Known limitations

- Notion controls final embed height and surrounding chrome.
- No Notion connectivity check is included because BU-14 does not require production data access and no credential is needed for platform proof.
- Theme and demo-state selection are intentionally ephemeral; no persistence layer is authorized.
