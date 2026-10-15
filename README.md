# Devansh Pandey — AI & Application Engineer

A responsive, animated static portfolio built with semantic HTML, CSS, and progressive-enhancement JavaScript. No build step or JavaScript dependencies.

## Local preview

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000`.

## Reference and visual system

The composition closely follows [OkayDev](https://okaydev.co/): a white pill navigation, heavy stacked hero typography, floating project imagery, a continuously scrolling type band, a staggered charcoal gallery, saturated purple storytelling, spacious black feature sections, yellow panels, and oversized footer lettering.

The principal colors match the reference's rendered palette: green `#14cd69`, purple `#6d42ed`, yellow `#eee642`, gallery charcoal `#222222`, and near-black `#0d0d0d`. DM Sans and Archivo Black use system fallbacks. The reference's proprietary font and branding are not redistributed.

All product illustrations are original HTML/CSS or local SVG artwork. They are labelled as concepts or illustrations. Portfolio facts, project links, employment dates, education, and résumé request links are retained from the previous portfolio.

## Animation

- Staggered hero entrance and a cycling black highlight across the three headline roles.
- Eight independently drifting project tiles, with desktop pointer parallax and scroll displacement.
- A seamless, duplicated horizontal typography band; the duplicate is hidden from assistive technology.
- Perspective gallery entrances, staggered columns, and hover lift.
- Scroll-driven layered cards and oversized background typography in the purple section.
- Three-dimensional rotating orbital rings and a floating particle around the AI illustration.
- Scroll-driven product layers and perspective on the production terminal.
- A global pause/play control. System reduced-motion preferences disable animations and smooth scrolling and reveal all content.

Scroll and pointer events share a single scheduled animation frame. Pointer interpolation stops when settled. Decorative motion does not control essential content or navigation. The page still works without JavaScript.

## Responsive behavior and accessibility

The gallery uses four columns on desktop, two on tablet, and one on mobile. Feature rows, experience cards, writing, and contact information stack on small screens. Hero imagery rearranges around the mobile headline.

Mobile navigation closes on link selection, Escape, and outside clicks. Filters expose their selected state and announce project counts. Native project details, email links, and résumé requests work without JavaScript. Keyboard focus is visible. Email copying is progressively enhanced in secure contexts.

## Files

- `index.html`: semantic content and metadata.
- `style.css`: layout, theme, responsive rules, motion, and print styles.
- `art.css`: original project interface and workflow illustrations.
- `script.js`: navigation, filters, motion controls, scroll choreography, email copying.
- `assets/cover-*.svg`: original local artwork used in the hero and feature sections.
- `assets/favicon.svg`, `assets/social-card.*`: site identity and sharing metadata.

Google Fonts is the only external page dependency. No analytics or API keys are required.

## Validation

Browser checks cover desktop, 390px and 320px mobile layout, horizontal overflow, loaded images, internal links and unique IDs, mobile navigation, project filters, native case studies, animation state changes, pause/play, and console errors. Source checks include Prettier formatting, JavaScript syntax, SVG XML parsing, and Git whitespace validation. Physical-device Safari has not been tested.

## Review branch

`codex/portfolio-color-redesign`. Production is unchanged until the review branch is merged and deployed.
