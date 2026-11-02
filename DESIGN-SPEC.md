# Reference inspection — 31 October 2026

Reference: https://www.aaabadcode.com/ . Inspected live at 1440×900, 768×1024, and 390×844, including the landing page, Me navigation, chat loading state, and additional-question menu. No source code or CSS was copied. Measurements below are rendered computed styles and bounding rectangles, not source implementation.

| Area | Verified reference | Implementation decision |
| --- | --- | --- |
| Palette | Background #FFFFFF, primary #09090B, secondary #18181B, muted #6B7280, borders #E4E4E7, chat input #ECECF0, input text #404040, send #0171E3, user bubble #007AFF. OKLCH neutral values converted to 8-bit sRGB. | Same light tokens. White surfaces at 30% on landing and 80% in chat. |
| Type | UI/system sans-serif; heading weight 700, 72/72 desktop, 60/60 tablet, 36/40 mobile; greeting 600, 24/32 desktop and 20/28 mobile. Pills 500, 14/20; input and message 400, 16/24. Normal letter spacing. | Same system stack and scale. Longer personal role is split into a short heading and explanatory subtitle. |
| Desktop layout | Centered composition; 1440×900 greeting y≈139, heading y≈171; input 512×62 at y≈595; category row 672px at y≈673, gap 12px. | Centered composition with flexible vertical centering; own subtitle adds height. |
| Mobile/tablet | At 390px: heading 36px, input ~343×62; five stacked 66px categories and 12px gaps, 16px side padding. At 768px: heading 60px, 672px row, 512px input. | Same stacked landing categories below 640px and five columns above. Desktop heading at 1024px. Breakpoint boundaries are implementation choices; sampled widths are verified. |
| Components | Hero categories 16px radius, 1px border, little/no shadow. Chat categories 14px radius/46px tall. User bubble 24px radius. Circular send 40px. | Same shapes; accessible focus ring and explicit pressed scale added. |
| Motion | Fade entrance and cursor-following yellow glow observed. Computed control transitions 150–300ms with cubic-bezier(.4,0,.2,1). Three-dot loader. | 300ms entrance/exit, 200ms messages; 150ms controls and 1s typing cycle, reduced-motion support. Exact reference entrance and loader timings were not measurable from the inspected state. Original GPU fluid simulation added and tuned against the reference: translucent rainbow layers, curled ends, smooth folds and lingering dissipation. |
| Flow | Me navigates to /chat?query=…; displays preset question as blue bubble, loading dots, bottom input, wrapping quick questions, expandable question menu. | Single-page state transition with compact header; immediate local rich cards for presets, streamed model responses for free text, follow-ups and clear. |
| Unverified states | No completed AI answer appeared during inspection. No dark toggle or availability badge visible. Focus/pressed styles and rich answer structure not verified. | Requested dark theme, availability badge, rich answers, errors, rate limits and keyboard focus implemented independently. No claim of exact parity for these states. |

## Added dark palette

Background #09090B, surface #18181B, secondary surface #27272A, primary #FAFAFA, muted #A1A1AA, border #3F3F46, accent #4DA3FF. This is an original accessible counterpart, not a measured reference theme.

## Reference comparison (verification in progress)

- [x] Measured light palette, system type scale, category spacing, input width, radii, and circular blue send reproduced.
- [x] Desktop five-column categories; mobile stacked landing categories; compact wrapping chat categories.
- [x] Preset questions, chat loading dots, bottom conversation composer and user bubbles.
- [x] Original profile content and original replaceable avatar; no reference branding/assets.
- [x] Added dark mode, compact identity header, availability, rich cards, follow-ups, clear and errors.
- [ ] Pixel-identical layout: longer role subtitle and own avatar alter exact hero coordinates.
- [ ] Exact reference motion: timing beyond CSS transitions is approximated; fluid recreated with an original WebGL2 solver; no claim of frame-for-frame identity.
- [ ] Exact rich-answer parity: reference remained in loading state.
- [ ] Route parity: conversation stays at / rather than navigating to /chat.

See PORTFOLIO.md for current verification status and configuration requirements.
