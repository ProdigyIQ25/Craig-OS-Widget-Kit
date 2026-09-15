# Craig OS Widget Kit

Secure, independently deployable widgets for Craig OS Notion surfaces.

Version: `0.8.0`

## XP-04 Governed Action Layer

The Personal and Business command surfaces expose exactly 11 action-specific captures. Each route validates a fixed input contract, applies only its approved defaults, writes to one hard-coded canonical destination, rejects extra fields and invalid vocabularies, requires a same-origin signed CSRF session, rate-limits requests, and reuses successful idempotency results. The browser receives only minimal success metadata and refreshes the affected read model after a confirmed write.

Writes use `NOTION_ACTION_TOKEN`, a separate server-only connection shared only with P03, P07, P08, P09, P10, B03, B05, B06, B07, B08, and B10. The existing `NOTION_TOKEN` remains read-only. P05, P06, P12, relations, destructive operations, generic database selection, and arbitrary properties are not exposed.

## XP-03 Craig Media Theater

`/os/media?mode=focus` is the expanded, reusable P11-backed media experience. The same component is embedded in Personal `FOCUS`, `SPIRITUAL`, `GROWTH`, and `BRAND` modes with mode-specific context, queue, presentation, and certified deep-link capture actions. It supports allowlisted YouTube, Vimeo, Loom, and Spotify embeds; direct audio/video; public podcast audio; and an external-only fallback for unsupported HTTPS providers. Autoplay is off, only one player is mounted, mode/selection changes retire the prior player, and no Notion write path or new database access is present.

## XP-02 Operating Mode Engine

The existing Personal and Business command routes now host one shared, URL-addressable operating-mode engine. Personal modes are `COMMAND`, `FOCUS`, `SPIRITUAL`, `BRAND`, `GROWTH`, and `RESET`; Business modes are `EXECUTIVE`, `REVENUE`, `WORKTELLI`, `ENGINEERING`, `CLIENTS`, and `WORKFORCE`. Mode changes alter the shell hierarchy, actions, module order, navigation, media context, tone, and empty state while preserving the canonical read-only data boundary. Existing command URLs remain stable and select modes with a `?mode=` query parameter.

## BU-15 Wave 1

| Code | Widget | Route | Data |
| --- | --- | --- | --- |
| CW-01 | Live Clock | `/widgets/clock` | Local Central time |
| CW-02 | Focus Timer | `/widgets/focus` | Ephemeral local state |
| CW-04 | Session Controller | `/widgets/session` | Ephemeral local state |
| CW-07 | Operating Mode Selector | `/widgets/mode` | Approved Notion deep links |
| CW-08 | Media Controller | `/widgets/media` | Read-only P11 public media URLs |
| CW-10 | Quick Capture Dock | `/widgets/quick-capture` | Canonical database deep links |
| CW-11 | Executive Pulse | `/widgets/executive-pulse` | Read-only B03/B05/B07/B08/B09/B10 |
| CW-14 | Worktelli State | `/widgets/worktelli-state` | Read-only B10/B11/B07/B05/B09 |
| CW-17 | Exception Alert | `/widgets/exception` | Read-only B07 |
| CW-20 | Ambient Header | `/widgets/header` | Local Central time and approved copy |

The data-backed widgets query only their named canonical sources on the server. Every query applies `Archive = false`; raw Notion responses and credentials never reach the browser. No route has Notion write capability.

## BU-16 Wave 2 + 3

| Code | Widget | Route | Data |
| --- | --- | --- | --- |
| CW-03 | Countdown | `/widgets/countdown` | Local/query only |
| CW-05 | Alignment Gauge | `/widgets/alignment` | Clearly labeled fixture |
| CW-06 | Progress Ring | `/widgets/progress` | Local/query only |
| CW-09 | Attention Allocation | `/widgets/attention` | Clearly labeled fixture |
| CW-12 | Health Matrix | `/widgets/health-matrix` | Read-only B09/B10/B08 |
| CW-13 | Digital Workforce Status | `/widgets/workforce-status` | Read-only B08 |
| CW-15 | Opportunity Radar | `/widgets/opportunity-radar` | Read-only B03 |
| CW-16 | Decision Queue | `/widgets/decision-queue` | Read-only B05 |
| CW-18 | Daily Brief | `/widgets/daily-brief` | Executive B03/B05/B07/B08/B10; Personal fixture shell |
| CW-19 | Weekly Review Pulse | `/widgets/weekly-review` | Clearly labeled fixture |

All data-backed routes server-filter `Archive = false`. P11 is the only Personal canonical read, and every Notion write remains absent. Opportunity Radar exposes only relation presence because B01 was not added to the existing connection.

## BU-17 Media System

CW-08 now reads only active records from P11 Media Library. It supports public YouTube, Spotify, Vimeo, and Loom embeds; direct public audio; public SoundCloud/provider links; and a safe generic HTTPS fallback. URL parameters accept only the locked mode, media-type, and favorite filters. One record is active at a time, autoplay is absent, and only directly controllable audio reports READY, PLAYING, and PAUSED states. Embedded and linked services remain explicitly labeled `EXTERNAL PROVIDER`.

## Local setup and validation

```bash
npm install
cp .env.example .env.local
npm run test
npm run lint
npm run build
npm run start
npx playwright test
```

`NOTION_TOKEN` is required only for the read-only Business widgets and P11 Media Library. It must remain server-only. Without it, those widgets render an explicit disabled state and never invent live values. No other Personal OS data source is read.

## Security boundary

Browser → widget → server route → exact canonical Notion data source. The CSP permits framing by Notion origins, blocks objects and unneeded browser capabilities, and allows network connections only to this deployment from the browser. Optional URL parameters are sanitized and contain no credentials.

No local persistence, authentication platform, AI, automations, media-account integration, synthetic history, or additional widget families are included. Notion insertion is limited to the XP-04 action registry and its dedicated connection.

## Known limitations

- Notion controls the final embed height and surrounding chrome.
- Empty P11 filters render a context-specific empty state until approved public URLs are supplied; autoplay and simulated playback are intentionally absent.
- Live data widgets require the read-only Notion integration shared only with B03, B05, B07, B08, B09, B10, B11, and P11.
- Idempotency uses an in-process pending lock plus Vercel Runtime Cache. The cache is bounded and regional, so a durable multi-region ledger would require a separately authorized persistence service.
