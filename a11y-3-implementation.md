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

| Rule | Requirement | SC |
|---|---|---|
| **A1** | Every inline `<svg>` is named or `aria-hidden` | 1.1.1 |
| **A2** | An icon-only control has a real accessible name | 4.1.2 |
| **A3** | A `<select>` is named by its visible label | 1.3.1, 4.1.2 |
| **A4** | The visible label sits inside the accessible name, verbatim and first | 2.5.3 |
| **A5** | One `h1`, no skipped levels, real landmarks | 1.3.1, 2.4.6 |
| **A7** | `lang` on the document, and on any passage that differs | 3.1.1, 3.1.2 |
| **A8** | A disclosure hides its panel from the accessibility tree, not just from view | 1.3.1, 4.1.2 |

---

### A1 — Every inline `<svg>` is either named or hidden

`SC 1.1.1` · **Level A**

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

### A2 — An icon-only control needs a real name, not a hidden one

`SC 4.1.2, 2.4.4` · **Level A**

`aria-label` on the focusable control; the icon inside it is `aria-hidden`.

---

### A3 — A `<select>` is named by its visible label

`SC 1.3.1, 4.1.2` · **Level A**

Use `aria-labelledby` pointing at the visible label — not a retyped `aria-label` (how visible text and
accessible name drift apart; see A4). A `<select>`'s `<option>` text is not its label.

---

### A4 — The visible label sits inside the accessible name

`SC 2.5.3` · **Level A**

The accessible name must **contain the visible text, contiguously**. No tool checks this; verify by
hand against the accessibility tree.

```jsx
// ✗ visible "Motor / Battery Capacity", name "Motor and battery capacity"
//   one character — "/" written as the word "and" — is a Level A failure
// ✗ visible "in … weather", name "in which weather"  (a word spliced between)
// ✓ append, never splice:  visible "of my ID.7", name "of my ID.7 variant"
```

---

### A5 — One `h1`, no skipped levels, real landmarks

`SC 1.3.1, 2.4.1, 2.4.6` · **Level A / AA**

One `h1`; levels descend without gaps; `role="banner"` on the topbar and a `<main>`; skip link as the
**first** tab stop pointing at an id that exists.

---

### A7 — `lang` on the document, and on any passage that differs

`SC 3.1.1, 3.1.2` · **Level A / AA**

`<html lang="en">`. Components rendering CMS text in another language must emit `lang` alongside it.

---

### A8 — A disclosure hides its panel from the accessibility tree, not just from view

`SC 1.3.1, 4.1.2` · **Level A**

```html
<h3>
  <button type="button" aria-expanded="false" aria-controls="t2-ionity">Ionity …</button>
</h3>
<div class="tf-acc-panel" id="t2-ionity" hidden>…</div>
```

Use the **`hidden` attribute** — not `display:none` in a stylesheet, not `aria-hidden` alone. Swap it
for a CSS class and the panel keeps *looking* right while its text remains in the accessibility tree.
Toggling must leave focus on the header; expanding must not fire a live region.

---
# 2. Keyboard and focus

| Rule | Requirement | SC |
|---|---|---|
| **B1** | Everything the mouse can do, the keyboard can do | 2.1.1 |
| **B2** | A custom widget exposes role, name **and** value, on every path | 4.1.2 |
| **B3** | Focus order matches visual order; hidden controls leave the tab order | 2.4.3 |
| **B4** | One visible focus indicator on every control, styled consistently | 2.4.7, 1.4.11 |
| **B5** | A focused control is never left under sticky chrome | 2.4.11 |
| **B6** | No keyboard trap | 2.1.2 |
| **B7** | A scrollable region is keyboard reachable | 2.1.1 |

---

### B1 — Everything the mouse can do, the keyboard can do

`SC 2.1.1` · **Level A**

Every custom control needs an explicit key handler. Assert the **state change**, not just that the
handler fired.

---

### B2 — A custom widget exposes role, name **and** value, on every path

`SC 4.1.2` · **Level A**

**Derive the ARIA from state, never set it imperatively in one branch only.** Write the value from
every path — keyboard, drag, click-on-track. In React: `aria-valuenow={value}`.

```html
<div role="slider" tabindex="0"
     aria-label="Current charge level"
     aria-valuemin="0" aria-valuemax="100"
     aria-valuenow="20" aria-valuetext="20 percent">
```

> `Accessibility.getPartialAXTree` reports `valuetext: ""` for every ARIA widget even when
> `aria-valuetext` is set — not a defect; verify with a real screen reader.

---

### B3 — Focus order matches visual order

`SC 2.4.3` · **Level A**

Drive real `Tab` and assert `document.activeElement` at each stop. A control repositioned with CSS
`order` must also move in the DOM.

---

### B4 — A visible focus indicator on every control, styled consistently

`SC 2.4.7` · **Level AA**

`:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 0; }` where `--focus-ring`
is `#c86c03`. One base rule covers **every** focusable thing including skip links. Pin
`outline-offset: 0` — Chrome's UA sheet puts `1px` on links. Style the ring on the surrogate when the
real control is a visually hidden `<input>`:

```css
.vw-switch input:focus-visible ~ .vw-switch-track { outline: 2px solid #c86c03; outline-offset: 0; }
```

`#c86c03` is 3.75:1 on tile white and 3.44:1 on page cream, but only 2.04:1 against the CTA's
`#ccbdab` hover fill. Never remove an outline without replacing it.

---

### B5 — A focused control is never left under sticky chrome

`SC 2.4.11` · **Level AA**

`scroll-padding-top` / `scroll-padding-bottom` equal to fixed-bar height, or a `focusin` handler.
Measure after the scroll settles — a synchronous read right after `.focus()` catches a smooth scroll
mid-flight.

---

### B6 — No keyboard trap

`SC 2.1.2` · **Level A**

Tab must cycle through every stop and out. Any panel must be escapable.

---

### B7 — A scrollable region is keyboard reachable

`SC 2.1.1` · **Level A** (ACT rule `0ssw9k`)

`tabindex="0"` plus `role="group"` and an accessible name. axe `focus-order-semantics` flags this as
`best-practice` + `experimental` with no `wcag2*` tag. **Keep the `tabindex`** — 2.1.1 wins.

---
# 3. Pointer and targets

| Rule | Requirement | SC |
|---|---|---|
| **C1** | Every target is at least 24×24 CSS px | 2.5.8 |
| **C2** | Activation happens on the up-event | 2.5.2 |
| **C3** | Dragging always has a non-drag alternative | 2.5.7 |

---

### C1 — Every target is at least 24×24 CSS px

`SC 2.5.8` · **Level AA**

`target-size` is `enabled: false` in axe-core 4.13.0 — enable explicitly:
`axe.run(el, { rules: { 'target-size': { enabled: true } } })`.

A transparent `::before` can enlarge the hit area without changing the visual:

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

### C2 — Activation happens on the up-event

`SC 2.5.2` · **Level A**

Native `<button>` gets this free. Custom controls fire on `pointerup`/`click`, never `pointerdown`.

---

### C3 — Dragging always has a non-drag alternative

`SC 2.5.7` · **Level AA**

Arrow keys alone satisfy this criterion for a draggable slider.

---
# 4. Visual

| Rule | Requirement | SC |
|---|---|---|
| **D1** | Text contrast ≥4.5:1, measured on composited pixels | 1.4.3 |
| **D2** | Non-text contrast ≥3:1 | 1.4.11 |
| **D3** | No content loss at 320×256 CSS px | 1.4.10, 1.4.4 |
| **D4** | The text-spacing overrides must not clip anything | 1.4.12 |
| **D5** | Never lock orientation | 1.3.4 |

---

### D1 — Text contrast ≥4.5:1, measured on composited pixels

`SC 1.4.3` · **Level AA**

Over a gradient or image, axe returns **`incomplete`** — resolve by hand on real pixels.
`Page.captureScreenshot` `clip` is document-absolute; crop with viewport-relative coordinates from
`getBoundingClientRect()`. Crop to the **glyph band** (`Range.getClientRects()` over text nodes) to
exclude the border. Take the **dominant** background, not the worst minority colour.

---

### D2 — Non-text contrast ≥3:1

`SC 1.4.11` · **Level AA**

Control boundaries, focus rings and selected-state indicators.

---

### D3 — No content loss at 320×256 CSS px

`SC 1.4.10, 1.4.4` · **Level AA**

**400% zoom is `setDeviceMetricsOverride{ width:320, height:256, deviceScaleFactor:4 }`** — `dsf:1`
is a different test. Content may scroll in **one** direction only; a keyboard-operable carousel is the
permitted two-dimensional exception.

---

### D4 — The text-spacing overrides must not clip anything

`SC 1.4.12` · **Level AA**

```css
* { line-height:1.5 !important; letter-spacing:.12em !important; word-spacing:.16em !important; }
p { margin-bottom:2em !important; }
```

> **Build target sizes from `padding`, not `line-height`.** This criterion invites overriding
> `line-height`, so a 24px target built on it collapses under the very override being tested.

---

### D5 — Never lock orientation

`SC 1.3.4` · **Level AA**

No `@media (orientation:)` rule that hides or restricts content.

---
# 5. Announcements

| Rule | Requirement | SC |
|---|---|---|
| **A6** | One writer owns a visually hidden polite region; it announces what **focus** is on, and it speaks even when nothing scrolled | 4.1.3 |

---

### A6 — A visually hidden polite live region, updated on every path

`SC 4.1.3` · **Level AA**

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

**Announce even when nothing scrolled** — if a key action moves focus without moving the scroller,
no `scroll` event fires. Call `announce()` from the key handler too.

> **Announcing the wrong thing is worse than announcing nothing.** No scanner can tell the two apart:
> the region is present, wired and non-empty in both cases.

> **Keep the `.sr-only` clip.** `position:absolute; width:1px; height:1px; clip:rect(0,0,0,0);
> clip-path:inset(50%); white-space:nowrap`. Set an explicit `color` — a clipped region inheriting a
> matching colour reads as 1:1 contrast to WAVE.

---

# 6. React, styled-components and AEM — the ones that bite

1. **`styled-components` drops unknown props** — `aria-*` and `role` pass through on DOM elements but
   not through a custom component unless forwarded. Spread `{...rest}` onto the DOM node.
2. **AEM `EditableComponent` injects a wrapper `<div>`** — parent-child ARIA relationships break when
   each child becomes separately authorable. Keep a group as **one** component, or wire `aria-owns`.
3. **Conditional rendering destroys focus** — unmounting a panel drops focus to `<body>`. Return it to
   the opener.
4. **`useId()` for every label association** — hand-written ids collide when a component is placed
   twice; `duplicate-id-aria` is a real failure.
5. **A CSS-in-JS `:focus-visible` must survive minification** — verify the ring in the built bundle.
6. **Icons: name or hide at the component boundary** (A1) — a per-call-site decision will be missed.
7. **Live regions must mount before they are written to** — render unconditionally; write on update.

---

# 7. Definition of Done

- [ ] **axe with `target-size` explicitly enabled** — off by default; without it CI passes SC 2.5.8
      without testing it
- [ ] **Accessibility tree asserted** — `0` unnamed `role=image` nodes, `0` unnamed interactive nodes
- [ ] **Real keyboard run** — Tab / Shift+Tab / Enter / Space / Arrows / Escape, asserting
      `document.activeElement` and resulting state
- [ ] **All states, not just the default** — expand every disclosure, select every option, re-run after each
- [ ] **Reflow at 320×256 @ dsf 4** — nothing lost, no page-level horizontal scroll
- [ ] **SC 2.5.3 by hand** — visible label contained in the accessible name; no tool does this
- [ ] **Screen reader** — one pass with NVDA or VoiceOver; not optional
- [ ] **The suite fails when it should** — inject the defect and confirm the detector fires

---

# 8. What is still open

- **NVDA 2026.1.1.55980 has not been run.** VoiceOver found the live-region defect but a formal
  BITV / EN 301 549 audit will not accept VoiceOver evidence for that line item.
- **The per-node selectors for the three axe DevTools Pro findings have not been captured.** All three
  are attributed to the topbar; if any resolves inside `#tf-main`, `a11y-2` §9.3 changes.
- **The topbar is not implemented.** When built, A2, B1 and C1 apply; the three Pro findings become live.
- **The four linked PDFs are placeholders.** Real documents become a conformance surface under
  **EN 301 549 clause 10**; each needs a **PAC 26.1.0.0** pass.

---

# 9. Appendix — measured reference

`#tf-scroller` is a named `role="group"` with `tabindex="0"` — ACT rule `0ssw9k` under SC 2.1.1.
axe `focus-order-semantics` reports it; it maps to no WCAG criterion and 2.1.1 wins. Disclosed in
`a11y-1-criteria.md`.

**Reflow (D3) passes on the exception.** `scrollWidth == clientWidth == 320` at 320×256; tiles extend
past the viewport entirely inside `#tf-scroller`. Replace the carousel with a plain overflowing row
and this becomes a failure. All 16 controls measured inside the viewport — the `focusin` handler (not
CSS `scroll-padding`) is what keeps them clear of sticky chrome; re-verify any CSS-only port.

**Arrow keys inside a tile step the carousel; focus must follow.** Stepping alone strands focus on a
tile that has scrolled out of the porthole. Focus moves to the matching control in the adjacent tile
(index clamped; tile 1 has one accordion, the others two). The handler returns before `preventDefault`
at the first and last tile so arrows fall through to native scrolling.

**Duplicate visible strings, unique names.** Eleven controls carry unique names suffixed with the tier
("PDF Download — We Charge Pro"). Visible text appears verbatim at the start — 2.5.3 holds.
**Suffix for uniqueness; never replace the visible text.**
