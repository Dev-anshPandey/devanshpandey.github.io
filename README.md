# Devansh Pandey — AI & Application Engineer

A responsive static portfolio built with semantic HTML, CSS, and progressive-enhancement JavaScript. No build step or runtime dependencies.

## Preview locally

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000`. This branch is for review; merge and deploy only after approval.

## Visual direction

Inspired by [OkayDev](https://okaydev.co/): a floating pill navigation, bold editorial typography, a gridded green introduction, original project illustrations, and distinct color sections with deliberate borders and spacing.

- Green: introduction and availability.
- Warm cream: selected projects and expandable build notes.
- Lavender: background and engineering capabilities.
- Dark ink: professional experience and education.
- Peach: engineering writing.
- Pale yellow: contact, social profiles, and résumé requests.

All illustration artwork is original HTML/CSS. Illustrative product interfaces are labelled and are not presented as actual screenshots. Portfolio facts and public destinations are retained from the previous site. No reference-site code, logos, or imagery is copied.

## Behavior and accessibility

- Projects filter between all work, AI, and applications, with an accessible status announcement.
- Native expandable project details work without JavaScript.
- Mobile navigation supports Escape, closes after selecting a section or clicking outside, and remains available without JavaScript.
- Email copying is progressively enhanced when the Clipboard API is available; mail and résumé request links work independently.
- Keyboard focus is visible. Reduced-motion preferences disable smooth scrolling and transitions.
- Mobile layouts stack projects, experience, and contact content. Decorative hero cards are removed on smaller screens.

Google Fonts supplies DM Sans and Space Grotesk with system fallbacks. The page has no analytics or API-key requirement.

## Files

- `index.html`: content and metadata.
- `style.css`: design system, original illustrations, responsive and print layouts.
- `script.js`: mobile navigation, project filtering, email copying, section navigation state.
- `assets/`: favicon and social sharing artwork.

## Validation

Verified in the Codex browser: desktop and mobile rendering, 320px horizontal overflow, mobile menu open/close, project category filtering, expandable project details, and internal anchor destinations. JavaScript syntax, source formatting, and Git whitespace checks also pass. Browser checks use the local static server; physical-device Safari and production hosting are outside this verification.

## Review branch

`codex/portfolio-color-redesign` starts from the existing `UI-transformation` checkout. Pushing it does not merge changes into the production branch.
