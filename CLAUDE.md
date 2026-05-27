# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Static PWA — a hub of 12 browser games optimized for mobile/phone use and accessibility (large text, high-contrast dark theme, big touch targets). No build step, no backend. Deployed to `https://acosonic.github.io/toiletgames/` via GitHub Pages.

All paths are relative (`./`, `games/...`). Do not use absolute paths — they break GitHub Pages subdirectory hosting.

UI is Serbian Cyrillic (`lang="sr"`). Comments and this file are English.

## Structure

- `index.html` + `style.css` + `app.js` — the game-picker hub
- `service-worker.js` — caches the hub shell + all 12 game files
- `manifest.json` — PWA manifest; theme `#e94560`
- `icon-source.svg` / `favicon.svg` — master icon (same file); run `scripts/regen-icons.sh` after editing
- `games/` — one self-contained HTML file per game (inline CSS + JS, no shared deps)

## Game files

Each `games/*.html` is fully self-contained. All 12 share the same conventions:
- Dark theme CSS variables: `--bg #0f0f1a`, `--surface #1a1a2e`, `--accent #e94560`
- Topbar with `← Назад` link back to `../` and an `Аа` font-size toggle
- Font toggle reads/writes `localStorage.tg-xl`; adds class `xl` to `<html>`
- Scores/best stored in `localStorage` with key prefix `tg-<gamename>-*`

## Adding a new game

1. Create `games/newgame.html` following the existing file structure (topbar, xl toggle, dark theme vars)
2. Add a card to `index.html`'s `.games-grid`
3. Add `SCOPE + 'games/newgame.html'` to the `SHELL` array in `service-worker.js`
4. Bump `CACHE_VERSION` in `service-worker.js`

## Deployment

```bash
git add -A && git commit -m "message"
gh repo create toiletgames --public --source=. --remote=origin --push --description="12 мобилних игрица"
gh api -X POST repos/acosonic/toiletgames/pages -f 'source[branch]=main' -f 'source[path]=/'
```

## Icon regeneration

Edit `icon-source.svg`, then:
```bash
/home/acop/.claude/skills/pwa-static-mobile/scripts/regen-icons.sh
```

## Key rules

- **Bump `CACHE_VERSION`** in `service-worker.js` after every shell change (HTML/JS/CSS/icons/manifest). Forgetting this leaves users on stale files.
- No CDN scripts — vendor anything needed into `vendor_js/` (currently no external deps).
- Each game must work fully offline (all logic inline).
