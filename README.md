# Tree of Life Dispensary — homepage redesign (2026 refresh)

Static handoff bundle. Self-contained: open it on any static host, no build step.

## Run it locally

```bash
node serve.mjs 8080      # then open http://127.0.0.1:8080
```

A server is required (not `file://`) — the hero video needs HTTP Range requests and the page's
JS uses `fetch`. `serve.mjs` handles both and has no dependencies.

## What's in here

| Path | What it is |
|---|---|
| `index.html` | The page |
| `chrome.css` | Original theme stylesheet (unmodified) |
| `assets/tol-2026.css` | **All refresh styling** — every visual change lives here |
| `assets/tol-2026.js` | **All refresh behaviour** — nav fade, carousels, dot pagination |
| `assets/in-pages/tol-logo-vertical-white.png` | Vertical logo lockup (footer) |
| `assets/in-pages/tol-tree-white.png` | Tree mark used for the footer + reviews watermarks |
| `assets/`, `sites/`, `_xorigin/` | Theme assets, uploads, vendored fonts/CDN files |
| `CLONE-NOTES.md` | Full change log, decisions, and known trade-offs |

The refresh is **additive**: `chrome.css` was never edited, so the bundle can still be diffed
against the original. Reverting means removing the two `tol-2026.*` includes from `index.html`.

## Brand palette

From `TOL_Brand Guide_2026_R1.pdf` (p.8):

| Token | Hex |
|---|---|
| Primary | `#26A94B` |
| Secondary | `#1E3032` |
| Tertiary | `#98D3D9` |
| Sand (background) | `#FFFBF2` |
| Nav green | `#184C3D` |

## Verification

234 automated checks pass across 390 / 600 / 640 / 700 / 768 / 900 / 992 / 1024 / 1200 / 1440 px,
covering colour, geometry, card clipping, carousel behaviour, contrast, overflow and broken images.

## Known outstanding

- **Rewards section** still shows the existing phone mockup. It is due to be rebuilt with real app
  screenshots once the app ships.
- The cart drawer POSTs to the staging API and fails CORS. Unchanged from source; no visual effect.

See `CLONE-NOTES.md` for the complete list of changes and the trade-offs behind them.
