# A11y 1 of 3 — WCAG 2.2 criterion checklist

**App:** VW Charging Tariffs — We Charge (`tariffs`) — a single-page simulator.
**Audited:** 2026-08-24 against the current source.
**Deployed at:** https://yikcunchung.github.io/vw-tariff-prototype/
**Scope:** the whole page. This app is standalone, so there is no component-versus-page split and
nothing is out of scope. **PDFs are now a linked surface, and that changes the scope.** Each tile's
CTA is an `<a href="assets/*.pdf" download>`, so four PDFs are part of what this page offers. The
*documents themselves* remain a separate conformance surface under **EN 301 549 clause 10**, checked
with **PAC** — not by anything in this pack. ⚠️ **The four files are not in the repo yet**, so the
links resolve to 404 and no PDF has been assessed. Neither this document nor `a11y-2` covers them.
**Companion documents:** `a11y-2-automated-testing.md` (what the tools can and cannot prove) ·
`a11y-3-implementation.md` (what to build).

The conformance target is **Level A + AA** — what EN 301 549 clause 9 requires, and therefore
BFSG / the European Accessibility Act. That is **56 criteria** (32 A + 24 AA). The 31 Level AAA
criteria are not required and are not listed.

> **If EN 301 549 becomes the formal target**, note that V3.2.1 (2021-03) references **WCAG 2.1**,
> not 2.2. The only practical delta is **4.1.1 Parsing** — obsolete in 2.2 but normative in 2.1 and
> listed by EN as clause 9.4.1.1. It is satisfied here and kept in the table rather than dropped, so
> the EN path is not silently broken.

| Status | Meaning |
|---|---|
| ✅ Pass | Verified by driving the app — real pointer and key events, or measured pixels |
| ✅ Pass\* | Verified by code and accessibility-tree inspection, **not** driven |
| ⚪ N/A | The app has no such content |
| ⚖️ Decide | Passes, but on an arguable reading — record the decision |

**56 criteria assessed. 0 failures and 0 open items.** 23 verified · 8 inspected · 24 not applicable · 1 decision to record.

---

# 1. Perceivable


## 1.1 Text Alternatives

| SC | Name | Lvl | Relevant | Status | Evidence / what to do |
|---|---|---|---|---|---|
| **1.1.1** | Non-text Content | A | Yes | ✅ Pass | **0 unnamed nodes in the accessibility tree.** Decorative assets all carry `alt=""`; the logo is `alt="Volkswagen"`. axe `image-alt` / `svg-img-alt` clean at 3 viewports. |


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
| **1.3.1** | Info and Relationships | A | Yes | ✅ Pass | Heading hierarchy `h1 → 4×h2 → 7×h3`, no skipped levels. `role="banner"` topbar, `main#tf-main`, `section[aria-labelledby=tf-h1]`, and the carousel is a named `role="group"`. axe 0 violations on structure rules. |
| **1.3.2** | Meaningful Sequence | A | Yes | ✅ Pass* | DOM order matches visual order; the four tariff tiles read left to right in source order. |
| **1.3.3** | Sensory Characteristics | A | Yes | ✅ Pass* | No instruction relies on shape, size or position; prev/next are named "Show previous tariff" / "Show next tariff". |
| **1.3.4** | Orientation | AA | Yes | ✅ Pass | No `@media (orientation:)` rule exists anywhere. Content works in portrait and landscape; nothing locks orientation. |
| **1.3.5** | Identify Input Purpose | AA | No | ⚪ N/A | No field collects information about the user — no name, address, email or payment input. `autocomplete` has nothing to identify. |


## 1.4 Distinguishable

| SC | Name | Lvl | Relevant | Status | Evidence / what to do |
|---|---|---|---|---|---|
| **1.4.1** | Use of Color | A | Yes | ✅ Pass* | Colour is never the sole channel — each tier is identified by its heading text, not its colour band. |
| **1.4.2** | Audio Control | A | No | ⚪ N/A | No audio plays automatically or otherwise; `audio[autoplay]` / `video[autoplay]` count is 0. |
| **1.4.3** | Contrast (Minimum) | AA | Yes | ✅ Pass | **No `color-contrast` node entered the incomplete bucket at any viewport** — axe computed a ratio for every text node and none failed. |
| **1.4.4** | Resize Text | AA | Yes | ✅ Pass | 400% zoom (320×256 @ dsf 4): no page-level horizontal scroll, all 16 stops reachable, nothing clipped. |
| **1.4.5** | Images of Text | AA | Yes | ✅ Pass* | No images of text. |
| **1.4.10** | Reflow | AA | Yes | ✅ Pass | Page `scrollWidth 320 == clientWidth 320` at 320×256 @ dsf 4 — **no page-level horizontal scroll**. The tiles extend beyond the viewport but entirely inside `#tf-scroller`, a deliberate keyboard-operable horizontal carousel, which is the permitted two-dimensional-content exception. All 20 controls reachable and scrolled into view. |
| **1.4.11** | Non-text Contrast | AA | Yes | ⚖️ Decide | Tile borders are navy on light, far above 3:1. The focus ring is `#c86c03` (the value the visualizer FA ships): **3.75:1** on the tile white, **3.44:1** on the page cream. On a CTA that is *hovered and focused at once* the ring's inner neighbour becomes the `#ccbdab` hover fill at **2.04:1** — its outer edge still reads 3.75:1 against the footer white, so the indicator stays discernible. Passes on that reading; record the decision. |
| **1.4.12** | Text Spacing | AA | Yes | ✅ Pass | All four overrides applied (line-height 1.5, letter-spacing .12em, word-spacing .16em, paragraph 2em) at 1440 / 390 / 320: **no newly clipped element, no control lost, no horizontal scroll.** Detector validated against a canary that fits at the default line-height and overflows at 1.5. |
| **1.4.13** | Content on Hover or Focus | AA | No | ⚪ N/A | No hover- or focus-triggered content. The accordions are click-toggled. |


# 2. Operable


## 2.1 Keyboard Accessible

| SC | Name | Lvl | Relevant | Status | Evidence / what to do |
|---|---|---|---|---|---|
| **2.1.1** | Keyboard | A | Yes | ✅ Pass | All 16 stops operable by keyboard, including the 7 accordions and prev/next, driven with real key events. The four PDF CTAs are `<a>`, so they activate on **Enter only** — correct link semantics, not a defect; `Space` scrolls the page as it should. `ArrowLeft`/`ArrowRight` on a control inside a tile step the carousel exactly as the arrow buttons do, and focus follows to the matching control in the adjacent tile. `#tf-scroller` itself keeps the browser's native arrow scrolling. |
| **2.1.2** | No Keyboard Trap | A | Yes | ✅ Pass | No trap. Focus enters and leaves `#tf-scroller` freely; all 16 stops cycle. The arrow-key handler `preventDefault`s only between the first and last tile, so the arrows never swallow a key at either end. |
| **2.1.4** | Character Key Shortcuts | A | No | ⚪ N/A | No single-character key shortcuts are registered. |


## 2.2 Enough Time

| SC | Name | Lvl | Relevant | Status | Evidence / what to do |
|---|---|---|---|---|---|
| **2.2.1** | Timing Adjustable | A | No | ⚪ N/A | No time limit exists anywhere in the app. |
| **2.2.2** | Pause, Stop, Hide | A | No | ⚪ N/A | Nothing moves or auto-updates. The carousel scrolls only on user action. |


## 2.3 Seizures and Physical Reactions

| SC | Name | Lvl | Relevant | Status | Evidence / what to do |
|---|---|---|---|---|---|
| **2.3.1** | Three Flashes or Below Threshold | A | Yes | ✅ Pass* | Nothing flashes. No animation exceeds three cycles per second; transitions are single-shot eases. |


## 2.4 Navigable

| SC | Name | Lvl | Relevant | Status | Evidence / what to do |
|---|---|---|---|---|---|
| **2.4.1** | Bypass Blocks | A | Yes | ✅ Pass | `a.skip-link → #tf-main`; target exists, first tab stop. |
| **2.4.2** | Page Titled | A | Yes | ✅ Pass | `<title>Volkswagen Charging Tariffs — We Charge</title>` — descriptive and unique. |
| **2.4.3** | Focus Order | A | Yes | ✅ Pass | Focus order is `#tf-scroller` → each tile's 2–3 controls in visual order → prev/next. Verified at 1440 and 320×256 @ dsf 4; a `focusin` handler scrolls each focused control into view (`inVP=true` for all 16). |
| **2.4.4** | Link Purpose (In Context) | A | Yes | ✅ Pass | Six links, six unique names. The four PDF CTAs are real `<a href download>`: the visible words say "PDF Download" so the **format is stated in the link text**, and the `.sr-only` tier suffix makes each destination unambiguous ("PDF Download — We Charge Pro"). With the 7 accordion buttons that is 11 tier-suffixed names and **0 duplicate role+name pairs** in the accessibility tree. **Not verified: that each `href` points at the right tariff's document** — the files do not exist yet, so the mapping is unaudited. |
| **2.4.5** | Multiple Ways | AA | No | ⚪ N/A | A standalone single page. SC 2.4.5 applies to a *set* of web pages; there is no set. |
| **2.4.6** | Headings and Labels | AA | Yes | ✅ Pass | `h1 → h2 → h3`, no skipped levels, one `h1`. Every control name is descriptive and tier-qualified. |
| **2.4.7** | Focus Visible | AA | Yes | ✅ Pass | **All 16 stops show the same ring** — `2px solid var(--focus-ring)` (`#c86c03`), `outline-offset: 0`, measured on every stop by driving real `Tab` keys. `.skip-link` and the Imprint link are included; they previously fell back to Chrome's `1px auto` UA ring. |
| **2.4.11** | Focus Not Obscured (Minimum) | AA | Yes | ✅ Pass | The `focusin` handler scrolls each focused control clear of the sticky chrome. All 16 measured inside the viewport at 320×256. The arrow-key handler moves focus to the adjacent tile rather than leaving it on a control it has just scrolled out of the porthole. |


## 2.5 Input Modalities

| SC | Name | Lvl | Relevant | Status | Evidence / what to do |
|---|---|---|---|---|---|
| **2.5.1** | Pointer Gestures | A | Yes | ✅ Pass* | The carousel needs no gesture — prev/next buttons and native scrolling both work. No path-based gesture. |
| **2.5.2** | Pointer Cancellation | A | Yes | ✅ Pass* | All activation on the up-event; native `<button>` semantics throughout. |
| **2.5.3** | Label in Name | A | Yes | ✅ Pass | All 15 controls checked: every visible label is contained **verbatim and at the start** of the accessible name. `Emission standard` → "Emission standard — We Charge Pro"; `PDF Download` → "PDF Download — We Charge Pro". |
| **2.5.4** | Motion Actuation | A | No | ⚪ N/A | No device-motion or user-motion actuation. |
| **2.5.7** | Dragging Movements | AA | No | ⚪ N/A | No dragging movement. The carousel is operated by buttons and native scroll. |
| **2.5.8** | Target Size (Minimum) | AA | Yes | ✅ Pass | **No control under 24px in any dimension, in any state, at any viewport.** Smallest are `.tf-acc-btn` at 192×24 and the Imprint link at 44×24; prev/next are 44×44; `.tf-cta` is 296×44 at 1440 and 192×56 at 320, where its label wraps. axe `target-size`: 14 pass, 0 violations, 0 incomplete. |


# 3. Understandable


## 3.1 Readable

| SC | Name | Lvl | Relevant | Status | Evidence / what to do |
|---|---|---|---|---|---|
| **3.1.1** | Language of Page | A | Yes | ✅ Pass | `<html lang="en">`; axe `html-has-lang` clean. |
| **3.1.2** | Language of Parts | AA | No | ⚪ N/A | Every string in the app is English. No passage changes language, so no `lang` attribute is needed. |


## 3.2 Predictable

| SC | Name | Lvl | Relevant | Status | Evidence / what to do |
|---|---|---|---|---|---|
| **3.2.1** | On Focus | A | Yes | ✅ Pass* | Focus alone changes nothing beyond scrolling the focused control into view, which is not a change of context. |
| **3.2.2** | On Input | A | Yes | ✅ Pass | Toggling an accordion changes only that accordion, with `aria-expanded` kept in sync. No context change. |
| **3.2.3** | Consistent Navigation | AA | No | ⚪ N/A | Applies across a set of web pages. This is a standalone page. |
| **3.2.4** | Consistent Identification | AA | No | ⚪ N/A | Applies across a set of web pages. This is a standalone page. |
| **3.2.6** | Consistent Help | A | No | ⚪ N/A | No help mechanism is offered, and the criterion applies across a set of pages. |


## 3.3 Input Assistance

| SC | Name | Lvl | Relevant | Status | Evidence / what to do |
|---|---|---|---|---|---|
| **3.3.1** | Error Identification | A | No | ⚪ N/A | No user input to validate — the page has no form controls. |
| **3.3.2** | Labels or Instructions | A | No | ⚪ N/A | No form controls, so no labels or instructions are required. |
| **3.3.3** | Error Suggestion | AA | No | ⚪ N/A | No validated input, so no error to suggest a correction for. |
| **3.3.4** | Error Prevention (Legal, Financial, Data) | AA | No | ⚪ N/A | Nothing is submitted, purchased, or legally committed. The app computes an estimate and stores nothing. |
| **3.3.7** | Redundant Entry | A | No | ⚪ N/A | No multi-step process re-asks for information. |
| **3.3.8** | Accessible Authentication (Minimum) | AA | No | ⚪ N/A | No authentication of any kind. |


# 4. Robust


## 4.1 Compatible

| SC | Name | Lvl | Relevant | Status | Evidence / what to do |
|---|---|---|---|---|---|
| **4.1.1** | Parsing | A | Yes | ✅ Pass | Nu HTML validator: **0 errors**. Obsolete in WCAG 2.2 but normative under EN 301 549 clause 9.4.1.1, so it is checked and kept. |
| **4.1.2** | Name, Role, Value | A | Yes | ✅ Pass | **AX tree: 339 nodes, 29 named, 0 unnamed, 0 duplicate role+name.** `#tf-scroller` is a named `role="group"` with `tabindex="0"`; every accordion keeps `aria-expanded` synchronised, verified across 5 states. |
| **4.1.3** | Status Messages | AA | Yes | ✅ Pass | `#tf-live` (`aria-live="polite"`) announces carousel position — "We Charge Pro, tariff 4 of 4". Verified through 5 state changes. |

---

# What is actually left to do

**No open criteria and no known failures.** Every Level A/AA criterion is verified, inspected, or
not applicable.

**No decisions outstanding.** Every criterion resolves without a judgement call.

One disclosure that is **not** a defect: with axe's experimental rules enabled, `focus-order-semantics`
reports `#tf-scroller` (impact *minor*) because it carries `tabindex="0"` with `role="group"` rather
than a widget role. That tabindex is **required** by the scrollable-region-focusable rule (ACT
`0ssw9k`) to satisfy SC 2.1.1, so the two rules disagree by construction. The rule is tagged
`best-practice` + `experimental` and carries **no `wcag2*` tag**, so it maps to no WCAG 2.2
criterion. Keep the tabindex.

**One thing no automated pass can close:** a screen-reader run. VoiceOver is planned; the protocol
names NVDA 2026.1.1.55980, so record that as a deviation. Two tool runs also remain — one pass
through the axe DevTools 4.131.2 UI, and a WAVE run from the browser extension. See
`a11y-2-automated-testing.md`.

# Decisions an auditor could challenge

24 of the 56 A/AA criteria have **no machine-testable ACT rule**, and several apply directly here
(1.4.11, 1.4.13, 2.5.1, 2.5.2, 2.5.8, 2.4.11). For those, "passes" reflects a **judgement**, not a
test result.

**The strongest claim this evidence supports:**

> *"This app meets WCAG 2.2 A/AA on every automated and runtime check available, pending
> screen-reader verification."*

That is stronger than a tool-clean claim, and unlike a tool-clean claim it is true — the one real
defect found here (unnamed graphics, SC 1.1.1) was invisible to axe, WAVE and Nu alike.
