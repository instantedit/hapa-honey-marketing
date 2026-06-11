# Hapa Honey Marketing

Marketing site for Hapa Honey Marketing — a Hawaiʻi-born studio building brands for
female visionaries and Hawaiʻi's local businesses.

A single-page, Awwwards-style experience: WebGL honey-gradient hero (Three.js),
GSAP + Lenis scroll choreography, custom cursor, film grain, and a warm
cocoa/cream/honey palette. Fully static — no build step.

## Structure

- `index.html` — the site (one page)
- `site.css` — experiential layer: layout, motion, cursor, grain
- `styles.css` — design-system entry point (`@import`s everything in `tokens/`)
- `tokens/` — design tokens: colors, typography, spacing, fonts, base styles
- `hero.js` — Three.js fragment-shader hero background (fbm domain warp)
- `main.js` — Lenis smooth scroll, GSAP scenes, loader, nav, reveals
- `assets/` — logo and photography
- `fonts/` — self-hosted Manrope woff2
- `hapa-honey-marketing-design-system/` — the original Claude Design handoff
  bundle (design system, prototypes, reference screenshots); kept for reference

## Running locally

Any static server works:

```sh
npx serve .
```

## Notes

- **Display font substitution:** the brand's premium display font "Beach Lombok"
  was not included in the design handoff; headings use **DM Serif Display**
  (Google Fonts) as the closest free match. To restore exact logo parity, add
  the real Beach Lombok woff2 to `fonts/` and update `tokens/fonts.css`.
- Manrope 700 was also missing from the export; the 800 face covers the
  700–800 weight range.
- Three.js, GSAP, ScrollTrigger, Lenis, and Phosphor icons load from CDNs.
- Respects `prefers-reduced-motion`: the loader is skipped, reveals show
  immediately, and the shader renders a single static frame.
