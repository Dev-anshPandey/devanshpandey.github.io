# Devansh Pandey — AI & Application Engineer

A responsive, static portfolio built with semantic HTML, CSS, and a small amount of progressive-enhancement JavaScript. No build step or runtime dependencies.

## Local development

Serve this directory with any static web server. For example, run `python3 -m http.server 8000` and open `http://localhost:8000`.

## Design and interactions

- Ink, warm paper, and soft green form the visual system; Manrope and DM Sans use system-font fallbacks.
- The CSS 3D stack illustrates context, intelligence, and the application interface. Its buttons switch between exploded-system and assembled-application views. Pointer tilt runs only on fine-pointer devices, schedules at most one animation frame at a time, and does not run continuously.
- System reduced-motion preferences disable transitions and tilt. The motion control also provides an explicit pause. Essential content never depends on an entrance animation.
- Selected work includes native expandable case studies, optional JavaScript category filters, and clearly labelled original interface/workflow illustrations. These are not screenshots or user testimonials.
- Mobile navigation supports Escape and closes after choosing a section. Project details and resume request links remain usable without JavaScript.
- Email copying is offered only when the clipboard API is available in a secure context. The mailto link always works independently.

## Content

The attached AI and application-engineering resumes supply the experience, projects, qualifications, and technical skills. The original PDFs are not published. Visitors can request the relevant resume by email. Public project and profile destinations are retained from the original portfolio. Update the availability text when hiring status changes.

## Structure

- `index.html` — page content and metadata
- `style.css` — design system, illustrations, responsive and print layouts
- `script.js` — navigation, filtering, 3D controls, email copying
- `assets/` — favicon, social image, original illustration source

Google Fonts is the only remote page dependency; system fonts keep content readable if it is unavailable. There is no analytics, chatbot service, or API key requirement.

## References

The original design draws inspiration from the clear experience/project hierarchy of [Brittany Chiang](https://brittanychiang.com), the typographic emphasis of [Dennis Snellenberg](https://dennissnellenberg.com), and the portfolio-specific 3D interaction of [Bruno Simon](https://bruno-simon.com). No source code or visual assets from those portfolios were copied.

## Validation

- JavaScript syntax and Git whitespace checks.
- DOM interaction checks for desktop and mobile states, menu closing/focus behavior, project filters, both stack views, reduced-motion defaults, and clipboard success/failure.
- Unique IDs, internal anchor destinations, local assets, resume request destinations, and CSS parsing.

Browser rendering was not verified in the editing environment because browser QA tooling was unavailable. Review desktop, narrow mobile, Safari 3D rendering, and keyboard navigation in a browser before merging. Check the existing host configuration for a branch preview; pushing this branch does not itself publish a new live website.

## Branch

The redesign is isolated on `UI-transformation`; the existing `master` branch is not merged or changed by this work.
