# Tree of Life homepage redesign — local clone

Source: https://carlcelinodspnza.github.io/tol-homepage-redesign/
(repo `carlcelinodspnza/tol-homepage-redesign`, commit `7e122ff`)
Cloned: 2026-09-16

## Run it

```bash
node serve.mjs 8080      # then open http://127.0.0.1:8080
```

A server is required (not `file://`) — the hero video needs HTTP Range requests,
and the page's JS uses fetch. `serve.mjs` handles both.

## How this was cloned

The deployed files were mirrored **byte-for-byte** from the source repo tarball rather
than reconstructed from the rendered DOM, so markup, CSS and assets are the originals.
`index.html`, `chrome.css`, `assets/`, `sites/`, `_xorigin/` and `dispenza/` were verified
byte-identical to source after copying.

Not copied (repo scaffolding, not part of the rendered site):
`_baseline/` (previous-version snapshot), `_shots/` (QA screenshots), `_tooling/` (build scripts),
`README.md`, `RESULTS.md`.

## Fidelity — verified, not assumed

Measured against the live source at 6 breakpoints (1440, 1280, 1024, 768, 430, 375):

| Breakpoint | Full-page size (live = local) | Pixel match |
|---|---|---|
| 1440x900  | 1440x6983 | 99.969% |
| 1280x800  | 1292x7149 | 99.974% |
| 1024x768  | 1036x7122 | 99.974% |
| 768x1024  | 780x7598  | 99.972% |
| 430x932   | 442x8998  | 99.983% |
| 375x812   | 387x9249  | 99.982% |

A geometry/computed-style fingerprint was also diffed element-by-element (534–568 elements
per breakpoint x 30 CSS properties: x, y, width, height, padding x4, margin x4, font-size,
font-weight, line-height, color, background-color, display, position, text-align,
justify-content, align-items, flex-direction, border-radius, opacity, z-index, max-width, gap).

**Result: zero differences in any layout or style property at any breakpoint.** The only
fingerprint deltas were Swiper.js's randomly-generated `swiper-wrapper-<hash>` element IDs,
which are regenerated per page load and are not a fidelity difference.

Residual pixel delta (~0.03%) is font antialiasing and those same random carousel IDs.

## Changes made to the source (3, all deliberate)

1. **Hero video MIME type** — `assets/front/js/plugins.min.js`
   `SGPlugins.videoBackground` built the `<source>` element with a hardcoded
   `type="video/mp4"` even for a `.webm` file. Chromium tolerates the mismatch and plays it
   anyway, but stricter engines (Firefox, Safari) can reject a source whose declared type
   doesn't match. Now the MIME type is derived from the file extension
   (`.webm` → `video/webm`, `.ogg`/`.ogv` → `video/ogg`, else `video/mp4`).

   Verified in-browser under Chrome's **default** autoplay policy: video present, `paused:false`,
   `currentTime` advancing, `readyState:4` (HAVE_ENOUGH_DATA), `muted/loop/playsinline` set,
   no media error, at 1440x702 (desktop) and 375x601 (mobile).

2. **Vendored 3 external stylesheets** — `ecommerce.css`, `sgen-accessibility.min.css`,
   `swiper-bundle.min.css` were loaded from `lasvegastreeoflifenv.staging.sgen.com`.
   They are now local under `assets/front/`. They contain zero `url()` references, so nothing
   cascades remotely. `index.html` link tags were repointed (6 refs).

3. **Dead background images in `chrome.css`** — 6 images referenced
   `lasvegas.treeoflife.seogstage.com`, a domain with a TLS certificate mismatch that returns
   **HTTP 500 / 0 bytes**. These do not render on the live site either.
   - `Frame_11.webp` had a real local copy → repointed to `assets/in-pages/Frame_11.webp`
   - The other 5 (`banner_bg`, `Mask_group1`, `Group_47`, `Group_1000001852`, `Group_1000001854`)
     were replaced with a transparent 1x1 pixel. Renders identically to a failed load
     (the element's `background-color` shows through either way) but makes no failing network call.

Net effect: the live page makes 5–7 failing requests per load; this clone makes 1.

## 2026 refresh (part 1) — colours + layout

All refresh work is additive and lives in two new files plus four small `index.html` edits.
Nothing in `chrome.css` was touched, so the clone can still be diffed against source.

- `assets/tol-2026.css` — every styling change
- `assets/tol-2026.js` — scroll-linked nav fade, carousel re-fit, mobile dot pagination
- `assets/in-pages/tol-logo-vertical-white.png` — vertical lockup (from brand guide p.3)
- `assets/in-pages/tol-tree-white.png` — same mark with the wordmark cropped, used for the watermark

`index.html` edits: the two `<link>`/`<script>` includes, the footer logo `<img>`, the deals
heading copy, and the app heading copy.

### Brand palette (TOL_Brand Guide_2026_R1.pdf, p.8)

| Token | Hex | Use |
|---|---|---|
| Primary | `#26A94B` | age gate, phone CTA text, dot indicators |
| Secondary | `#1E3032` | footer plate, "Yes" button |
| Tertiary | `#98D3D9` | nav link hover |
| Sand (requested) | `#FFFBF2` | every former white surface |
| Nav green (requested) | `#184C3D` | the nav plate |

### Gotcha worth knowing

The theme already ships a `<style id="tol-polish">` block defining `--tol-green`, `--tol-ink`,
`--tol-lime` and `--tol-inset`. Our variables are namespaced `--tol26-*` to avoid colliding with it.
That block is an inline `<style>` in the body, so it wins over an external sheet at equal
specificity — a few overrides here are deliberately weighted higher for that reason.

### Nav behaviour

The theme swapped `position: absolute -> fixed` and black -> transparent at a scroll threshold,
which is why it popped in. The bar is now always `fixed` with a `::before` green plate whose
opacity is driven from scroll progress (smoothstepped between 45% and 92% of hero height), so it
fades in and out continuously. Nav CTAs were recoloured for contrast on both the video and the
green plate: the outline button is white, and the solid button is sand with dark-green text.

### Independent conformance review (11 defects found and fixed)

A multi-agent review of the implementation against the original request list found 11 real defects
(18 claimed, 7 refuted by adversarial verification). All 11 are fixed. Two had been wrongly reported
as done, both because of a **verification blind spot**:

1. **Pseudo-element paint is invisible to a `backgroundColor` sweep.** The app band was painted pure
   `#FFFFFF` by `#tol-app::after`, a gradient declared in the inline `tol-polish` block. The element's
   own `background-color` is transparent, so a DOM colour scan correctly found "0 white blocks" while
   a 1440x506 white band sat on the page. Any future colour sweep must read `::before`/`::after` too.
2. **An inline `<script>` injects a stylesheet into `<head>` at runtime**, i.e. *after* this file.
   `.site-body a.btn-primary` (0,2,1) tied `header.sticky-header .btn-primary` (0,2,1), so source
   order won and ORDER NOW rendered `#1E3032` on the `#184C3D` plate — 1.40:1. Fixed by prefixing
   `body.site-body` to reach (0,3,1).

The other nine: FAQ accordion faces stayed white; the watermark asset still contained the wordmark;
the brands rail kept the theme's loop clones (5 slides for 3 brands); `[class*="-next"]` matched
Swiper's own `swiper-slide-next` class so the arrows were bound to a *card*; a fractional
`slidesPerView: 1.6` re-sliced cards between 576-767px; the newsletter `nowrap` overran and was
clipped between 768-1199px; the app heading was the smallest on the page at mobile widths; the hand
image was scaled twice (1.39x, off-centre); and the app store badges stayed left-aligned on mobile.

**Verification now covers 1440 / 1024 / 900 / 768 / 600 / 390** — the original pass only measured
1440 and 390, which is why the mid-range breakpoint defects survived it.

### Second audit (15 more defects) — and a biased first verification

A second fan-out audited the 11 fixes above and re-examined the 7 claims the first pass had
"refuted". **The first pass was biased**: its verifiers were told to "default to real=false unless
you can show the defect stands". Re-judged neutrally, most of those refutations were wrong. 15
findings stood; all are fixed. The ones that mattered:

- **Item 21 (age gate) was NOT actually done.** Swapping the colour token had no visible effect
  because the `::before` also carries `opacity:.5` over the gate's own `rgba(0,0,0,.9)` — so it
  still composited dark, exactly as originally reported. Fixed with `opacity: 1`, which puts the
  real `#26A94B` on screen (white 70px heading = 3.06:1, passes AA for large text).
- **Item 18 (mobile padding) was dead code.** The gutter rule was a bare-ID selector (1,0,0) losing
  to a `tol-polish` rule at (1,1,0), leaving the reviews rail 10px inboard of the other two. Fixed
  with a two-ID selector; all three rails now share a 20px gutter.
- **The sand sweep missed the cart drawer** (`.sg-drawer`, still pure white) — now sanded.
- **The sand fix created a new defect**: the FAQ chevron is painted white for all rows and only
  darkened on `.collapsed`, so on the new sand face the OPEN row's chevron was white-on-sand
  (~1.03:1) and invisible. Fixed.
- **The nav contrast fix removed the keyboard focus ring.** chrome.css suppresses the native ring,
  and nothing replaced it — WCAG 2.4.7. (Pre-existing and imperceptible before; the fix made it
  absolute.) An explicit `:focus-visible` ring is now declared for both header CTAs.
- A **second copy of the nav CTAs** lives in the mobile drawer, outside `header.sticky-header`, so
  it kept the theme colours. Inverted to the nav green there (#fff on #184C3D = 9.81:1).
- **Item 16** now also covers the CALL NOW block, which was a 148px CTA beside two 230px ones.
- Brands rail goes **1-up from 576-767** — 2-up squeezed the copy column to ~170px and a 13-line
  blurb. Forcing the card to stack fights chrome.css's own widths, so the rail width changed instead.

**Deliberate deviation — the watermark.** The old mark was a 2.90-aspect band, so it could fill the
width *and* show its whole composition. The new vertical logo is portrait (1100x1217), which makes
those two goals geometrically incompatible in a 1440x541 footer: `cover` showed only a ~34% slab of
canopy, and the crop axis flipped at 768px (left/right below, top/bottom above), so a single pixel
of width swung the composition. It now uses `contain` — the whole logo, stable at every width. This
does not match "same cropping as the old one"; it was chosen because the literal ask is unsatisfiable
with a portrait mark. **Worth a look — easy to change back if you prefer the cropped slab.**

**Verification now runs 170 checks** across 1440 / 1024 / 900 / 768 / 700 / 640 / 600 / 390.

### Not done — blocked

**Item 6, "Rewards section: redo it with screenshots from their app"** is not started. The app
isn't finished (expected the week of 2026-09-22), so there are no screenshots to use. The section
is untouched and still shows the existing phone mockup.

## Known remaining external dependency

`index.html` sets `window.DPZ_AJAX_URL` to the staging domain, so the cart drawer POSTs to
`lasvegastreeoflifenv.staging.sgen.com/dispenza/ajax/cart_html` and fails CORS.
**This is unchanged from source and fails identically on the live site.** It has no visual
effect on the page. A local fixture exists at `dispenza/ajax/cart_html.json` if you ever want
to wire it up locally.

Google Fonts (Montserrat) still loads from the Google CDN, matching source. Font files are
additionally vendored under `_xorigin/fonts.gstatic.com/`.
