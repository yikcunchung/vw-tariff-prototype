# A11y 3 of 3 — What to build

**App:** VW Charging Tariffs — We Charge (`tariffs`). **Target:** production vw.com — AEM + React SPA Editor +
styled-components.
**Companions:** `a11y-1-criteria.md` (every criterion, pass/fail) ·
`a11y-2-automated-testing.md` (what the tools can and cannot prove).

**How to read this:** sections 1–7 are **prescriptive** — the contract the port must meet,
not a description of the current build. Sections 8–9 are **descriptive**: what is still open, and
what the reference measurably does today.

**BLUF:** Build the tariff carousel so keyboard, screen-reader and pointer users can operate it safely.
Treat the vanilla reference as a behavioural spec — a meaningful share of the required behaviour lives
in JavaScript, and the one defect that shipped here lived entirely in it.

**Scope:** `#tf-main`. Topbar and linked PDFs are out of scope.

---

## Start here — the defect that shipped, and that no tool caught

**Read `README.md` first** for the six key rules. Return here for detail on any invariant.

The live-region defect is the only finding no scanner can catch. `#tf-live` derived its index from
`scrollLeft` — the **leftmost visible** tile — which equals the focused tile only when a single tile fits.
At 1440 px, focus sat on Pro while the region said *"We Charge Go, tariff 2 of 4"*; at widths where
nothing scrolled, it said nothing at all. axe at 107 rules, WAVE, Nu, and a clean accessibility tree
all passed — the region was never empty, never unlabelled, faithfully announcing a *real* tile index.
One person pressed an arrow key, listened, and heard the wrong tile.

This app shipped **0 unnamed graphics**; siblings did not — range-simulator exposed **16**,
cost-simulator **9**, charging-time **7** — axe, WAVE and Nu clean on every one.

> **Announcing the wrong thing is worse than announcing nothing.**

---
# 1. Semantics and naming

### SC 1.1.1 — Every inline `<svg>` is either named or hidden

**Level A**

Chrome maps a bare `<svg>` to `role=image`, `name=""`, `ignored=false` — not decorative by default.
No scanner catches this. Assert `0` unnamed `role=image` nodes; put the fix in the icon component:

```jsx
// ✗ exposed, unnamed — this is the defect that shipped
<svg width="24" height="24" viewBox="0 0 24 24"><path d="…"/></svg>

// ✓ decorative: remove it from the tree
<svg aria-hidden="true" focusable="false" width="24" height="24">…</svg>

// ✓ meaningful: give it a role AND a name
<svg role="img" aria-label="Volkswagen" width="32" height="32">…</svg>
```

```jsx
export const Icon = ({ label, ...p }) =>
  label ? <svg role="img" aria-label={label} {...p}/> 
        : <svg aria-hidden="true" focusable="false" {...p}/>;
```

---

### SC 4.1.2, 2.4.4 — An icon-only control needs a real name, not a hidden one

**Level A**

`aria-label` on the focusable control; the icon inside it is `aria-hidden`.

---

### SC 1.3.1, 4.1.2 — A `<select>` is named by its visible label

**Level A**

Use `aria-labelledby` pointing at the visible label, not a retyped `aria-label` (see SC 2.5.3). `<option>` text is not the label.

---

### SC 2.5.3 — The visible label sits inside the accessible name

**Level A**

The accessible name must **contain the visible text, contiguously**. No tool checks this; verify by hand.

```jsx
// ✗ visible "PDF Download", name "Download the PDF"                — reworded, not appended
// ✗ visible "PDF Download", name "PDF Download We Charge Pro tier" — a word spliced inside, not after
// ✓ append, never splice:  visible "PDF Download", name "PDF Download — We Charge Pro"
```

---

### SC 1.3.1, 2.4.1, 2.4.6 — One `h1`, no skipped levels, real landmarks

**Level A / AA**

One `h1`; levels descend without gaps; `role="banner"` on the topbar, a `<main>`, and a skip link as the **first** tab stop.

---

### SC 3.1.1, 3.1.2 — `lang` on the document, and on any passage that differs

**Level A / AA**

`<html lang="en">`. Components rendering CMS text in another language must emit `lang` alongside it.

---

### SC 1.3.1, 4.1.2 — A disclosure hides its panel from the accessibility tree, not just from view

**Level A**

```html
<h3>
  <button type="button" aria-expanded="false" aria-controls="t2-ionity">Ionity …</button>
</h3>
<div class="tf-acc-panel" id="t2-ionity" hidden>…</div>
```

Use the **`hidden` attribute** — not `display:none` in a stylesheet, not `aria-hidden` alone. Swap it for a CSS class and the text stays in the tree while the panel visually collapses. Toggle leaves focus on the header; expand does not fire a live region.

---
# 2. Keyboard and focus

### SC 2.1.1 — Everything the mouse can do, the keyboard can do

**Level A**

Every custom control needs an explicit key handler. Assert the **state change**, not just that the
handler fired.

---

### SC 4.1.2 — A custom widget exposes role, name **and** value, on every path

**Level A**

**Derive ARIA from state on every path** — keyboard, drag, click-on-track. In React: `aria-valuenow={value}`.

```html
<div role="slider" tabindex="0"
     aria-label="Current charge level"
     aria-valuemin="0" aria-valuemax="100"
     aria-valuenow="20" aria-valuetext="20 percent">
```

> `Accessibility.getPartialAXTree` reports `valuetext: ""` for every ARIA widget — not a defect; verify with a real screen reader.

---

### SC 2.4.3 — Focus order matches visual order

**Level A**

Drive real `Tab` and assert `document.activeElement` at each stop; a control repositioned with CSS `order` must also move in the DOM.

---

### SC 2.4.7 — A visible focus indicator on every control, styled consistently

**Level AA**

`:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 0; }` where `--focus-ring` is `#c86c03`. One base rule covers **every** focusable thing; pin `outline-offset: 0` — Chrome's UA sheet puts `1px` on links. For a visually hidden `<input>` behind a styled surrogate:

```css
.vw-switch input:focus-visible ~ .vw-switch-track { outline: 2px solid #c86c03; outline-offset: 0; }
```

`#c86c03` is 3.75:1 on tile white and 3.44:1 on page cream, but only 2.04:1 against the CTA's
`#ccbdab` hover fill — check the ring against the hover fill, not just resting state.

---

### SC 2.4.11 — A focused control is never left under sticky chrome

**Level AA**

`scroll-padding` equal to fixed-bar height, or a `focusin` handler; measure after the scroll settles, not synchronously after `.focus()`.

---

### SC 2.1.2 — No keyboard trap

**Level A**

Tab must cycle through every stop and out. Any panel must be escapable.

---

### SC 2.1.1 — A scrollable region is keyboard reachable

**Level A** (ACT rule `0ssw9k`)

`tabindex="0"` plus `role="group"` and an accessible name. axe `focus-order-semantics` flags this as
`best-practice` + `experimental` with no `wcag2*` tag. **Keep the `tabindex`** — 2.1.1 wins.

---
# 3. Pointer and targets

### SC 2.5.8 — Every target is at least 24×24 CSS px

**Level AA**

`target-size` is `enabled: false` in axe-core 4.13.0 — enable explicitly:
`axe.run(el, { rules: { 'target-size': { enabled: true } } })`.

A transparent `::before` enlarges the hit area without changing the visual:

```css
.thumb { width: 18px; height: 18px; }
.thumb::before {                    /* the real 24x24 target */
  content: ""; position: absolute; inset: 50% auto auto 50%;
  width: 24px; height: 24px; transform: translate(-50%, -50%);
  pointer-events: auto;             /* and the parent must not clip it */
}
```

Spacing exception: against a **full-size** neighbour, **≥12px from centre to box edge**; against
**another undersized** target, **≥24px centre-to-centre**. Centre-to-centre against a full-size
neighbour is the wrong test.

---

### SC 2.5.2 — Activation happens on the up-event

**Level A**

Native `<button>` gets this free. Custom controls fire on `pointerup`/`click`, never `pointerdown`.

---

### SC 2.5.7 — Dragging always has a non-drag alternative

**Level AA**

Arrow keys alone satisfy this criterion for a draggable slider.

---
# 4. Visual

### SC 1.4.3 — Text contrast ≥4.5:1, measured on composited pixels

**Level AA**

Over a gradient or image, axe returns **`incomplete`** — resolve by hand. Use viewport-relative coordinates (`getBoundingClientRect()`), not document-absolute `clip`. Crop to the **glyph band** (`Range.getClientRects()` over text nodes) to exclude borders. Take the **dominant** background pixel, not the worst minority.

---

### SC 1.4.11 — Non-text contrast ≥3:1

**Level AA**

Control boundaries, focus rings and selected-state indicators.

---

### SC 1.4.10, 1.4.4 — No content loss at 320×256 CSS px

**Level AA**

**400% zoom is `setDeviceMetricsOverride{ width:320, height:256, deviceScaleFactor:4 }`** — `dsf:1`
is a different test. Content may scroll in **one** direction only. A keyboard-operable carousel that
scrolls horizontally while fitting inside 320 CSS px on an otherwise vertically-scrolling page meets
the base requirement directly (G225) — it is **not** an instance of the "requires two-dimensional
layout for meaning" exception, which is reserved for maps/data-tables/meaningful indentation. Don't
reach for that exception just because a component happens to scroll sideways.

---

### SC 1.4.12 — The text-spacing overrides must not clip anything

**Level AA**

```css
* { line-height:1.5 !important; letter-spacing:.12em !important; word-spacing:.16em !important; }
p { margin-bottom:2em !important; }
```

> **Build target sizes from `padding`, not `line-height`.** This criterion invites overriding
> `line-height`, so a 24px target built on it collapses under the very override being tested.

---

### SC 1.3.4 — Never lock orientation

**Level AA**

No `@media (orientation:)` rule that hides or restricts content.

---
# 5. Announcements

### SC 4.1.3 — A visually hidden polite live region, updated on every path

**Level AA**

```html
<p id="tf-live" class="sr-only" aria-live="polite"></p>
```

The region must be in the DOM at load — injecting and writing in the same tick is not announced.

**One writer owns it.** Two callers writing directly will eventually disagree.

**Announce what focus is on, not what scroll position implies.** `scrollLeft` gives the leftmost
visible item — equal to the focused item only when one item is visible.

```js
// Bad: leftmost visible item. Correct only when one item fits.
var i = Math.round(sc.scrollLeft / step());

// Good: the item focus is actually in, falling back to scroll position
// when focus is outside the carousel — which is right for the arrow buttons.
var tile = document.activeElement.closest('.tf-tile');
announce(tile ? tiles.indexOf(tile) : i);
```

**Announce even when nothing scrolled** — call `announce()` from the key handler; no `scroll` event fires when focus moves without scrolling.

> **Announcing the wrong thing is worse than announcing nothing.** The region is present, wired and non-empty in both cases.

> **Keep the `.sr-only` clip.** `position:absolute; width:1px; height:1px; clip:rect(0,0,0,0);
> clip-path:inset(50%); white-space:nowrap`. Set an explicit `color` — a clipped region inheriting a
> matching colour reads as 1:1 contrast to WAVE.

---

# 6. React, styled-components and AEM — the ones that bite

1. **`styled-components` drops unknown props** — `aria-*` and `role` pass through on DOM elements but
   not through a custom component unless forwarded. Spread `{...rest}` onto the DOM node.
2. **AEM `EditableComponent` injects a wrapper `<div>`** — ARIA parent-child relationships break when
   each child is separately authorable. Keep a group as **one** component, or wire `aria-owns`.
3. **Conditional rendering destroys focus** — unmounting a panel drops focus to `<body>`; return it to
   the opener.
4. **`useId()` for every label association** — hand-written ids collide on duplicate placements;
   `duplicate-id-aria` is a real failure.
5. **Live regions must mount before they are written to** — render unconditionally; write on update.

---

# 7. Definition of Done

- [ ] **axe with `target-size` explicitly enabled** — off by default; SC 2.5.8 is untested without it
- [ ] **Accessibility tree asserted** — `0` unnamed `role=image` nodes, `0` unnamed interactive nodes
- [ ] **Keyboard run across all states** — Tab / Shift+Tab / Enter / Space / Arrows / Escape, asserting
      `document.activeElement` and resulting state; expand every disclosure, select every option, re-run after each
- [ ] **Reflow at 320×256 @ dsf 4** — nothing lost, no page-level horizontal scroll
- [ ] **SC 2.5.3 by hand** — no tool checks visible label contained in accessible name
- [ ] **Screen reader** — one pass with NVDA or VoiceOver; not optional
- [ ] **The suite fails when it should** — inject the defect and confirm the detector fires

---

# 8. What is still open

- **NVDA 2026.1.1.55980 has not been run.** VoiceOver found the live-region defect but a formal
  BITV / EN 301 549 audit will not accept VoiceOver evidence for that line item.
- **The per-node selectors for the three axe DevTools Pro findings have not been captured.** All three
  are attributed to the topbar; if any resolves inside `#tf-main`, `a11y-2` §9.3 changes.
- **The topbar is not implemented.** When built, SC 4.1.2, 2.4.4 (icon-only control naming), SC 2.1.1 ("Everything the mouse can do, the keyboard can do") and SC 2.5.8 (target size) apply; the three Pro findings become live.
- **The four linked PDFs are placeholders.** Real documents become a conformance surface under
  **EN 301 549 clause 10**; each needs a **PAC 26.1.0.0** pass.

---

# 9. Appendix — measured reference

`#tf-scroller` is a named `role="group"` with `tabindex="0"` — ACT rule `0ssw9k` under SC 2.1.1.
axe `focus-order-semantics` reports it (`best-practice` + `experimental`, no WCAG criterion); 2.1.1 wins.
Disclosed in `a11y-1-criteria.md`.

**Reflow (SC 1.4.10, 1.4.4) passes on the base requirement, not an exception.** `scrollWidth == clientWidth == 320`
at 320×256; tiles extend past the viewport inside `#tf-scroller` only, which itself fits within 320 CSS
px on a vertically-scrolling page (G225) — replace `#tf-scroller` with a plain overflowing row (no
internal scroll containment) and this becomes a failure. All 16 controls sit inside the viewport; the
`focusin` handler (not `scroll-padding`) keeps them clear of sticky chrome.

**Arrow keys step the carousel; focus must follow.** Stepping alone strands focus on a tile that has
scrolled out of the porthole. The handler moves focus to the matching control in the next tile,
returning before `preventDefault` at the ends so arrows fall through to native scrolling.

**Duplicate visible strings, unique names.** Eleven controls carry unique names suffixed with the tier
("PDF Download — We Charge Pro"); visible text is verbatim at the start — 2.5.3 holds.
**Suffix for uniqueness; never replace the visible text.**
