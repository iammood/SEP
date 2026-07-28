# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Public landing page for the Seed Empowerment Program 2026 event (Oct 8–10, Lagos).
Goal: drive registrations. README.md covers deployment, gallery, videos, colors, and pre-launch testing.

## Previewing the site

Open `index.html` directly in a browser — no server needed. There is no build step, no package manager, no framework.

## Architecture

The site has six pages (`index.html`, `speakers.html`, `events.html`, `hub.html`, `donate.html`, `blog/index.html`) sharing `css/main.css` and `js/main.js`. `index.html` is structured in this order:

1. `<head>` — SEO meta, Open Graph, Twitter card, inline SVG favicon, structured data (JSON-LD), Google Fonts link, then all `<style>` CSS
2. `<body>` — sections in page order, each marked with a comment like `<!-- ============ NAV ============ -->`:
   - NAV → HERO → MARQUEE → GROWTH → ABOUT → SPEAKERS → SCHEDULE → TRACKS → GALLERY → HUB → REGISTER → FOOTER
3. `<script>` block at the end — nav toggle, gallery lightbox, lite-YouTube embed handler, form submission handler

**CSS variables** are defined in `:root` near the top of the `<style>` block:
```css
--forest / --forest-deep   /* brand greens */
--lime / --lime-glow        /* accent green */
--amber / --amber-deep      /* warm accent */
--paper / --paper-warm      /* backgrounds */
--font-display / --font-body / --font-mono
```
Changing a variable propagates everywhere — don't hardcode hex values.

**Favicon** is an inline SVG `data:` URI directly in the `<link rel="icon">` tag. Special characters are percent-encoded (`%23` = `#`). The SVG uses three ascending green squares plus a white S letterform drawn with cubic bezier curves.

**Gallery** uses two patterns side-by-side in the same grid:
- Photo tiles: `<div class="gallery-item" data-caption="...">` — clicking opens a lightbox driven by the JS at the bottom
- Video tiles: `<div class="lite-yt" data-video-id="...">` — shows a YouTube thumbnail, loads the iframe only on click

**Forms** (`#registration-form`, `#hub-form`) have a fake JS handler that shows a success message. Field `name` attributes are kept production-ready so wiring to a real endpoint is a drop-in change.

## Current stage

- Prototype, live for team review only. Visual and copy changes only — do not wire up forms, analytics, or real endpoints until Mo confirms the feedback round is done.
- Functionality (registration endpoint, analytics, real videos/photos) gets a written spec before work starts.

## Hard constraints

- No npm, no bundler, no external JS libraries. Must deploy by drag-and-drop (Netlify CLI `netlify deploy --dir=.`).
- Non-developers on the SEP team will maintain this — keep code simple and comment any section they might need to edit.
- Must stay fast on cheap Android phones on mobile data: keep the lite-YouTube pattern, lazy-load all images, no heavy assets.

## Content rules

- Audience is the Nigerian public — warm, encouraging, plain language. Copy must fit the existing voice ("Planting Purpose · Equipping Lives · Empowering Future"), not startup marketing speak.
- Placeholders follow the convention `YOUR-DOMAIN.com`, `VIDEO_ID_1` — ALL-CAPS, obviously fake, listed in the README's "Before going live" section. Add new placeholders to that list too.
- Forms are prototypes — never imply registrations are being collected while the fake handler is still in place.
