# A11y 1 of 3 — WCAG 2.2 criterion checklist

**App:** VW Charging Tariffs — We Charge (`tariffs`) — a single-page simulator.
**Audited:** 2026-08-24 against the live deployment.
**Deployed at:** https://yikcunchung.github.io/vw-tariff-prototype/
**Scope:** `#tf-main`. **Out of scope:** the topbar, and the four linked PDFs (EN 301 549 clause 10, PAC).
**Companion documents:** `a11y-2-automated-testing.md` · `a11y-3-implementation.md`.

The conformance target is **Level A + AA** — EN 301 549 clause 9 / BFSG / European Accessibility Act — **56 criteria** (32 A + 24 AA). AAA not listed.

> **EN 301 549:** V3.2.1 (2021-03) references **WCAG 2.1**. **4.1.1 Parsing** is obsolete in WCAG 2.2
> but normative in EN clause 9.4.1.1; satisfied and kept.

| Status | Meaning |
|---|---|
| ✅ Pass | Driven — real pointer/key events or measured pixels |
| ✅ Pass\* | Code/AX-tree inspection, **not** driven |
| ⚪ N/A | No such content in app |

**All 56 A/AA criteria are in scope for `#tf-main`, and all 56 are closed — 0 failures, 0 open
items.** 23 verified · 9 inspected · 24 not applicable. One discretionary decision is recorded at the
end of this document.

> **Scope:** only `#tf-main`. Topbar: inert `<div>` chrome, no handler, `tabindex`, `role`, or
> `cursor: pointer`. Not findings (`a11y-2` §9.3) — **not implemented**.

> **PDFs:** four placeholders, untagged and unassessed (`a11y-2` §9.5). Clause 10 / PAC applies
> when real documents replace them.

---

# 1. Perceivable


## 1.1 Text Alternatives

| SC | Name | Lvl | Relevant | Status | Evidence / what to do |
|---|---|---|---|---|---|
| **1.1.1** | Non-text Content | A | Yes | ✅ Pass | **0 unnamed nodes.** Decorative assets `alt=""`; logo `alt="Volkswagen"`. axe `image-alt`/`svg-img-alt` clean at 3 viewports. |


## 1.2 Time-based Media

| SC | Name | Lvl | Relevant | Status | Evidence / what to do |
|---|---|---|---|---|---|
| **1.2.1** | Audio-only and Video-only (Prerecorded) | A | No | ⚪ N/A | No audio-only or video-only content. |
| **1.2.2** | Captions (Prerecorded) | A | No | ⚪ N/A | No prerecorded video with audio. |
| **1.2.3** | Audio Description or Media Alternative (Prerecorded) | A | No | ⚪ N/A | No prerecorded video. |
| **1.2.4** | Captions (Live) | AA | No | ⚪ N/A | No live media. |
| **1.2.5** | Audio Description (Prerecorded) | AA | No | ⚪ N/A | No prerecorded video. |


## 1.3 Adaptable

| SC | Name | Lvl | Relevant | Status | Evidence / what to do |
|---|---|---|---|---|---|
| **1.3.1** | Info and Relationships | A | Yes | ✅ Pass | `h1 → 4×h2 → 7×h3`; `role="banner"` topbar, `main#tf-main`, `section[aria-labelledby=tf-h1]`, carousel `role="group"`. axe 0 structure violations. |
| **1.3.2** | Meaningful Sequence | A | Yes | ✅ Pass* | DOM order matches visual order; tiles left to right in source. |
| **1.3.3** | Sensory Characteristics | A | Yes | ✅ Pass* | No instruction relies on shape, size, or position. Prev/next: "Show previous tariff" / "Show next tariff". |
| **1.3.4** | Orientation | AA | Yes | ✅ Pass | No `@media (orientation:)` rule; nothing locks orientation. |
| **1.3.5** | Identify Input Purpose | AA | No | ⚪ N/A | No personal-data fields; `autocomplete` has nothing to identify. |


## 1.4 Distinguishable

| SC | Name | Lvl | Relevant | Status | Evidence / what to do |
|---|---|---|---|---|---|
| **1.4.1** | Use of Color | A | Yes | ✅ Pass* | Colour never the sole channel — tiers identified by heading text, not colour band. |
| **1.4.2** | Audio Control | A | No | ⚪ N/A | No audio; `audio[autoplay]`/`video[autoplay]` = 0. |
| **1.4.3** | Contrast (Minimum) | AA | Yes | ✅ Pass | **No `color-contrast` node in the incomplete bucket** at any viewport; ratio computed for every text node, none failed. |
| **1.4.4** | Resize Text | AA | Yes | ✅ Pass | 400% zoom (320×256 @ dsf 4): no horizontal scroll, all 16 stops reachable, nothing clipped. |
| **1.4.5** | Images of Text | AA | Yes | ✅ Pass* | No images of text. |
| **1.4.10** | Reflow | AA | Yes | ✅ Pass | `scrollWidth 320 == clientWidth 320` at 320×256 @ dsf 4 — **no page-level horizontal scroll**. Tiles inside `#tf-scroller` — the permitted two-dimensional-content exception. All 20 controls reachable. |
| **1.4.11** | Non-text Contrast | AA | Yes | ✅ Pass\* | Focus ring `#c86c03` — **3.75:1** on tile white, **3.44:1** on page cream. On a CTA hovered and focused at once: inner edge **2.04:1** against `#ccbdab`; outer edge **3.75:1** against the footer. Outer-edge passes; decision at end. |
| **1.4.12** | Text Spacing | AA | Yes | ✅ Pass | Line-height 1.5, letter-spacing .12em, word-spacing .16em, paragraph 2em at 1440/390/320: **no clipped element, no lost control, no horizontal scroll.** Canary validated. |
| **1.4.13** | Content on Hover or Focus | AA | No | ⚪ N/A | No hover- or focus-triggered content; accordions click-toggled. |


# 2. Operable


## 2.1 Keyboard Accessible

| SC | Name | Lvl | Relevant | Status | Evidence / what to do |
|---|---|---|---|---|---|
| **2.1.1** | Keyboard | A | Yes | ✅ Pass | 16 stops: 7 accordions, prev/next, 4 PDF CTAs, Imprint. PDF CTAs `<a>`: Enter activates, Space scrolls (correct). `ArrowLeft`/`ArrowRight` steps carousel; focus follows to matching control. `#tf-scroller` retains native arrow scrolling. |
| **2.1.2** | No Keyboard Trap | A | Yes | ✅ Pass | No trap; 16 stops cycle. `preventDefault` only between first and last tile. |
| **2.1.4** | Character Key Shortcuts | A | No | ⚪ N/A | No single-character shortcuts registered. |


## 2.2 Enough Time

| SC | Name | Lvl | Relevant | Status | Evidence / what to do |
|---|---|---|---|---|---|
| **2.2.1** | Timing Adjustable | A | No | ⚪ N/A | No time limit. |
| **2.2.2** | Pause, Stop, Hide | A | No | ⚪ N/A | Nothing moves or auto-updates; carousel scrolls only on user action. |


## 2.3 Seizures and Physical Reactions

| SC | Name | Lvl | Relevant | Status | Evidence / what to do |
|---|---|---|---|---|---|
| **2.3.1** | Three Flashes or Below Threshold | A | Yes | ✅ Pass* | Nothing flashes; no animation exceeds three cycles per second. |


## 2.4 Navigable

| SC | Name | Lvl | Relevant | Status | Evidence / what to do |
|---|---|---|---|---|---|
| **2.4.1** | Bypass Blocks | A | Yes | ✅ Pass | `a.skip-link → #tf-main`; first tab stop. |
| **2.4.2** | Page Titled | A | Yes | ✅ Pass | `<title>Volkswagen Charging Tariffs — We Charge</title>` — descriptive and unique. |
| **2.4.3** | Focus Order | A | Yes | ✅ Pass | `#tf-scroller` → tile controls in visual order → prev/next; `focusin` scrolls into view (`inVP=true` all 16). **Defect found and fixed 2026-08-24**: `sync()` set `hidden` on the focused scroll arrow at its end — `document.activeElement` collapsed to `<body>`, one press of next at 1440, three at narrower widths; `#tf-prev` mirrored at `scrollLeft 0`. `sync()` now rehomes focus before hiding. Regression test at all four viewports. |
| **2.4.4** | Link Purpose (In Context) | A | Yes | ✅ Pass | 6 links, 6 unique names. PDF CTAs: "PDF Download" + `.sr-only` tier suffix → "PDF Download — We Charge Pro". 11 tier-suffixed names, **0 duplicate role+name pairs**. `href` targets are placeholders (not verified). |
| **2.4.5** | Multiple Ways | AA | No | ⚪ N/A | Single page; criterion applies to a set of pages. |
| **2.4.6** | Headings and Labels | AA | Yes | ✅ Pass | `h1 → h2 → h3`, one `h1`, 12 unique names, all controls tier-qualified. axe DevTools Structure: all 12 describe following content. |
| **2.4.7** | Focus Visible | AA | Yes | ✅ Pass | All 16 stops: `2px solid var(--focus-ring)` (`#c86c03`), `outline-offset: 0`. `.skip-link` and Imprint included; both previously used Chrome's UA ring. |
| **2.4.11** | Focus Not Obscured (Minimum) | AA | Yes | ✅ Pass | `focusin` scrolls each control clear of sticky chrome; all 16 inside viewport at 320×256. Arrow handler moves focus to the adjacent tile. |


## 2.5 Input Modalities

| SC | Name | Lvl | Relevant | Status | Evidence / what to do |
|---|---|---|---|---|---|
| **2.5.1** | Pointer Gestures | A | Yes | ✅ Pass* | No path-based gesture; prev/next buttons and native scroll. |
| **2.5.2** | Pointer Cancellation | A | Yes | ✅ Pass* | Activation on the up-event; native `<button>` semantics throughout. |
| **2.5.3** | Label in Name | A | Yes | ✅ Pass | All 15 controls: visible label verbatim and at the start of the accessible name. `Emission standard` → "Emission standard — We Charge Pro"; `PDF Download` → "PDF Download — We Charge Pro". |
| **2.5.4** | Motion Actuation | A | No | ⚪ N/A | No device-motion actuation. |
| **2.5.7** | Dragging Movements | AA | No | ⚪ N/A | No dragging; buttons and native scroll. |
| **2.5.8** | Target Size (Minimum) | AA | Yes | ✅ Pass | **No control under 24px at any viewport.** `.tf-acc-btn` 192×24; Imprint 44×24; prev/next 44×44; `.tf-cta` 296×44 at 1440, 192×56 at 320. axe `target-size`: **14 pass, 0 violations, 0 incomplete**. |


# 3. Understandable


## 3.1 Readable

| SC | Name | Lvl | Relevant | Status | Evidence / what to do |
|---|---|---|---|---|---|
| **3.1.1** | Language of Page | A | Yes | ✅ Pass | `<html lang="en">`; axe `html-has-lang` clean. |
| **3.1.2** | Language of Parts | AA | No | ⚪ N/A | All strings English; no passage changes language. |


## 3.2 Predictable

| SC | Name | Lvl | Relevant | Status | Evidence / what to do |
|---|---|---|---|---|---|
| **3.2.1** | On Focus | A | Yes | ✅ Pass* | Focus alone: no context change (scrolling a control into view is not one). |
| **3.2.2** | On Input | A | Yes | ✅ Pass | Toggling an accordion updates only that accordion (`aria-expanded` in sync). No context change. |
| **3.2.3** | Consistent Navigation | AA | No | ⚪ N/A | Standalone page; applies across a set of pages. |
| **3.2.4** | Consistent Identification | AA | No | ⚪ N/A | Standalone page; applies across a set of pages. |
| **3.2.6** | Consistent Help | A | No | ⚪ N/A | No help mechanism; applies across a set of pages. |


## 3.3 Input Assistance

| SC | Name | Lvl | Relevant | Status | Evidence / what to do |
|---|---|---|---|---|---|
| **3.3.1** | Error Identification | A | No | ⚪ N/A | No user input to validate. |
| **3.3.2** | Labels or Instructions | A | No | ⚪ N/A | No form controls. |
| **3.3.3** | Error Suggestion | AA | No | ⚪ N/A | No validated input. |
| **3.3.4** | Error Prevention (Legal, Financial, Data) | AA | No | ⚪ N/A | Nothing submitted, purchased, or stored. |
| **3.3.7** | Redundant Entry | A | No | ⚪ N/A | No multi-step process. |
| **3.3.8** | Accessible Authentication (Minimum) | AA | No | ⚪ N/A | No authentication. |


# 4. Robust


## 4.1 Compatible

| SC | Name | Lvl | Relevant | Status | Evidence / what to do |
|---|---|---|---|---|---|
| **4.1.1** | Parsing | A | Yes | ✅ Pass | Nu HTML: **0 errors**. Normative under EN 301 549 clause 9.4.1.1 (obsolete in WCAG 2.2). |
| **4.1.2** | Name, Role, Value | A | Yes | ✅ Pass | **AX tree: 339 nodes, 29 named, 0 unnamed, 0 duplicate role+name.** `#tf-scroller` named `role="group"` `tabindex="0"`; accordions `aria-expanded` synchronised across 5 states. |
| **4.1.3** | Status Messages | AA | Yes | ✅ Pass | `#tf-live` (`aria-live="polite"`) — "We Charge Pro, tariff 4 of 4". 5 state changes verified. |

---

# What is actually left to do

**No open criteria and no known failures.**

**NVDA 2026.1.1.55980 is owed** — needs Windows. VoiceOver on Safari is recorded in `a11y-2` §9.1 —
a **deviation, not a substitute**: a formal BITV / EN 301 549 audit naming NVDA will not accept
VoiceOver evidence for that line item.

All other checks done: WAVE 3.3.1.0 (hosted + extension, both states); axe DevTools UI at WCAG 2.2 AA;
axe-core CDP all rules force-enabled across five viewports and both states; Nu; 400% zoom. `a11y-2` §9.

Non-defect: `focus-order-semantics` (experimental, impact *minor*) flags `#tf-scroller` for
`tabindex="0"` on `role="group"`. Tabindex required by scrollable-region-focusable (ACT `0ssw9k`) for
SC 2.1.1; rules disagree by construction, no `wcag2*` tag. Keep it. axe DevTools UI 4.12.1 did not
flag it; axe-core CDP 4.13.0 did.

# Decisions an auditor could challenge

24 of the 56 A/AA criteria have no machine-testable ACT rule (1.4.11, 1.4.13, 2.5.1, 2.5.2, 2.5.8,
2.4.11 all apply). For those, "passes" is a judgement.

**SC 1.4.11.** `#c86c03` reads **2.04:1** against `#ccbdab` inner edge on a hovered-and-focused CTA;
outer edge **3.75:1** against the footer. Passes on outer-edge reading. A darker hover fill removes
the argument.

**Two judgements settled by listening** (`a11y-2` §9.1). SC 2.5.3: PDF links share "PDF Download"
text, told apart by a hidden tier suffix — VoiceOver speaks it verbatim and first. SC 1.3.1: the
criterion requires the **relationship**; the tree carries it.

**Strongest supportable claim:**

> *"This app meets WCAG 2.2 A/AA on every check the protocol names except NVDA — axe-core over CDP
> with every rule force-enabled across five viewports and both accordion states, the axe DevTools UI
> at WCAG 2.2 AA, WAVE hosted and by extension in both states, the accessibility tree, real key and
> pointer events, Nu, literal 400% zoom, and a VoiceOver pass on Safari — with one discretionary
> decision recorded, one defect found by the VoiceOver pass and fixed, and NVDA still outstanding."*

Proof: **live region announced the leftmost visible tile, not the focused one** — past axe at 107
rules, WAVE, and Nu. Found by ear.

# Source of truth

Every number from the live build at the URL above; `index.html` byte-identical to that deployment.
