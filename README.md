# Craig OS Widget Kit

Secure, independently deployable widgets for Craig OS Notion surfaces.

Version: `0.2.0`

## BU-15 Wave 1

| Code | Widget | Route | Data |
| --- | --- | --- | --- |
| CW-01 | Live Clock | `/widgets/clock` | Local Central time |
| CW-02 | Focus Timer | `/widgets/focus` | Ephemeral local state |
| CW-04 | Session Controller | `/widgets/session` | Ephemeral local state |
| CW-07 | Operating Mode Selector | `/widgets/mode` | Approved Notion deep links |
| CW-08 | Media Controller | `/widgets/media` | Local UI; no account access |
| CW-10 | Quick Capture Dock | `/widgets/quick-capture` | Canonical database deep links |
| CW-11 | Executive Pulse | `/widgets/executive-pulse` | Read-only B03/B05/B07/B08/B09/B10 |
| CW-14 | Worktelli State | `/widgets/worktelli-state` | Read-only B10/B11/B07/B05/B09 |
| CW-17 | Exception Alert | `/widgets/exception` | Read-only B07 |
| CW-20 | Ambient Header | `/widgets/header` | Local Central time and approved copy |

The three data-backed widgets query only their named canonical sources on the server. Every query applies `Archive = false`; raw Notion responses and credentials never reach the browser. No route has Notion write capability.

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

`NOTION_TOKEN` is required only for the three read-only Business widgets. It must remain server-only. Without it, those widgets render an explicit disabled state and never invent live values. Personal OS data access is not implemented.

## Security boundary

Browser → widget → server route → exact canonical Notion data source. The CSP permits framing by Notion origins, blocks objects and unneeded browser capabilities, and allows network connections only to this deployment from the browser. Optional URL parameters are sanitized and contain no credentials.

No persistence, authentication platform, AI, automations, media-account integration, Notion writes, synthetic history, or additional Wave widgets are included.

## Known limitations

- Notion controls the final embed height and surrounding chrome.
- Media controls remain provider-launch UI until approved URLs are supplied; autoplay and simulated playback are intentionally absent.
- Live Business widgets require a read-only Notion integration shared only with B03, B05, B07, B08, B09, B10, and B11.
