# VW Charging Tariffs — accessibility reference build

A working, WCAG 2.2 AA reference build of the Charging Tariffs feature app. **It is a behavioural
specification, not source to copy.** The defect that shipped here was invisible to every automated
tool — it was found by pressing an arrow key and listening.

**Live:** https://yikcunchung.github.io/vw-tariff-prototype/

---

## If you are the developer porting this — read this section only

You need **six things**. Everything else in this repo is evidence for auditors.

### 1. The live region must announce the focused tile, not the leftmost visible one

```js
// ✗ wrong — scrollLeft is the leftmost VISIBLE tile, not the focused one
liveEl.textContent = tiles[Math.round(scroller.scrollLeft / tileW)].name;

// ✓ correct — announce what focus is on
function onFocusTile(tile) {
  liveEl.textContent = tile.name + ', tariff ' + (tileIndex + 1) + ' of ' + tiles.length;
}
```

This was the defect. The live region was never empty, never mis-wired — it announced a *real* tile
index, just the wrong one. axe at 107 rules, WAVE and Nu all scored it clean. One person pressed an
arrow key, listened, and heard the wrong tariff announced.

**Announcing the wrong thing is worse than announcing nothing.** One writer must own the live region
so two callers cannot contradict each other.

### 2. Arrow keys step the carousel and move focus

```js
tile.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight') { e.preventDefault(); focusTile(index + 1); }
  if (e.key === 'ArrowLeft')  { e.preventDefault(); focusTile(index - 1); }
});
```

Mouse users drag or click the arrows. Keyboard users must be able to do the same thing — the scrollbar
is suppressed, so without this a keyboard user cannot reach tariffs 2–4.

### 3. `aria-expanded` derives from state on every render path

```js
// ✗ wrong — only updated on click; first render is always false
btn.setAttribute('aria-expanded', 'false');
btn.onclick = () => btn.setAttribute('aria-expanded', panel.hidden ? 'false' : 'true');

// ✓ correct — set from state, every time
function renderAccordion(open) {
  panel.hidden = !open;
  btn.setAttribute('aria-expanded', String(open));
}
```

Four accordions ship open. A button that says `aria-expanded="false"` over an open panel is a
Level A failure, and the screen-reader run is what finds it — not axe.

### 4. The scroller needs `tabindex="0"` — the scrollbar is suppressed

```html
<div id="tf-scroller" role="group" aria-label="Charging tariffs, scrollable list of 4" tabindex="0">
```

Without `tabindex="0"` a keyboard user cannot scroll the tile row, because the native scrollbar is
hidden by CSS. This is the SC 2.1.1 requirement for any scrollable region with a suppressed
scrollbar.

### 5. The previous arrow hides when there is nothing to scroll back to

```js
function syncArrows() {
  prevBtn.hidden = scroller.scrollLeft <= 0;
  nextBtn.hidden = scroller.scrollLeft >= scroller.scrollWidth - scroller.clientWidth - 1;
}
```

A hidden control must leave the tab order. `hidden` attribute (not a CSS class) removes it from
the accessibility tree and focus order simultaneously. Using a class alone is a SC 1.3.1 failure.

### 6. Every icon is named or empty-alt'd — nothing ships as an unnamed graphic

```html
<img src="assets/chevron-down.svg" alt="">                             <!-- decorative -->
<img src="assets/logo-vw.svg" alt="Volkswagen" width="32" height="32">  <!-- meaningful -->
```

This app uses `<img>` for every icon, not inline `<svg>` — so `alt=""` is this app's version of
`aria-hidden`. If your stack renders icons as inline SVG instead (React commonly does), the same
rule applies as `aria-hidden="true"` / `role="img" aria-label="…"`. The three sibling simulators
shipped this exact defect as 16, 9 and 7 unnamed graphics — axe, WAVE and Nu all reported clean on
every one, because a bare `<svg>` maps to `role=image` with an empty name and none of those tools
flag an empty name as an error. A1 in `a11y-3-implementation.md` is the rule; the accessibility-tree
assertion in the Definition of Done is what proves it.

---

## How you know you are done

```bash
npm install
npm test
```

**140 tests over 4 viewports.** They encode all six rules above plus the scanner checks. Green means
you have it.

The tests are also the shortest readable spec — [`tests/`](tests/) has a comment above each block
explaining what broke and why.

> **These six exist because every one of them passed axe, WAVE and Nu while being wrong.** The
> defect that shipped was invisible to 107 rules of axe, WAVE on two engines, Nu, and a clean
> accessibility tree. A clean scanner run does not tell you this app works.

---

## Everything else in this repo

You do not need these to build. They exist so an auditor can verify the claim.

| File | Who it is for |
|---|---|
| [`a11y-3-implementation.md`](a11y-3-implementation.md) | The full version of the six rules, plus 17 more that are standard for any VW app. Read it if you want the reasoning. |
| [`a11y-2-automated-testing.md`](a11y-2-automated-testing.md) | What the tools prove and what they cannot, the manual test procedure, and the recorded results. |
| [`a11y-1-criteria.md`](a11y-1-criteria.md) | All 56 WCAG A/AA criteria, one row each, pass/fail. For the auditor. Look up a criterion; do not read it through. |
| [`a11y-voiceover-run1-worksheet.md`](a11y-voiceover-run1-worksheet.md) | The reusable worksheet for a VoiceOver pass — this copy is blank; the completed transcript from the run that found the live-region defect is in `a11y-2` §9.1. |

## Two things that are out of scope — do not fix them here

**The topbar** is non-functional chrome: `div`s wrapping decorative images, no handlers, no roles.
It generates real axe findings. When it is built, those findings need fixing — but not by you on
this ticket.

**The four PDF links** are placeholders. When real documents replace them, each needs to pass PAC
(EN 301 549 clause 10, PDF/UA). Not in scope here.

## One known failure, not yours to fix

The `<select>` border is `rgb(161,164,172)` — **2.29:1** against the page, where WCAG needs 3:1.
It comes from the core component library, so it is being raised upstream. Do not darken it locally.
(`#8b8e96` is the nearest passing shade if anyone asks.)
