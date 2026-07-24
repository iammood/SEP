# SEP Website

SEP, is a three-day skills-and-business training event in Lagos (Oct 8–10) run by OneChurch International's Kingdom Impact Team. Free to attend; 975 people came in 2025.

**Live:** seedempowermentprogram.com
---
<img width="1384" height="822" alt="Screenshot 2026-07-24 at 23 26 18" src="https://github.com/user-attachments/assets/bba6947c-410a-4825-b96c-f1c9ed280f07" />


## What it does

A multi-page marketing site built to drive event registrations. It covers the event across six pages — landing, speakers, events, hub, donate, and blog — with:

- A registration flow wired to a live endpoint (submissions land in a spreadsheet)
- The ten SEP 2026 skill tracks and the main-stage session lineup
- A 12-item photo carousel and lazy-loaded video highlights from SEP 2025
- Monthly webinar listings with links to past recordings
- Sponsor tiers and a donation path
- The SEP Hub Directory (in progress) — a year-round resource connecting attendees to opportunity beyond the event

---

## Built deliberately dependency-free

The whole site is hand-built HTML, CSS, and JavaScript — no framework, no bundler, no npm. That's a choice, not a shortcut, driven by who has to use it and who has to maintain it:

- Non-developers on the SEP team maintain it. Simple, commented markup means they can update content without a build pipeline or a developer in the loop.
- It has to stay fast on cheap Android phones on mobile data. All images are lazy-loaded, YouTube embeds load only on click (a "lite-YouTube" pattern), and there are no heavy libraries to download.
- It deploys by drag-and-drop. No build step means anyone can ship it.

Design is driven by CSS custom properties defined once at the top — brand greens, accent lime, warm amber, paper backgrounds — so a colour change propagates everywhere. Full light and dark mode support.

### Stack
- Hand-written HTML / CSS / JavaScript, multi-page
- CSS custom properties for theming; system fonts for speed
- Registration wired to a Google Apps Script endpoint
- Hosted on Netlify (with a 301 redirect from the Netlify subdomain to the canonical domain)

### Previewing locally

No build step and no server needed — open index.html in a browser.

### Status

Live and actively maintained. Designed and built by Mo for OneChurch International's Kingdom Impact Team.
