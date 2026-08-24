// @ts-check
/*
 * ─── The init gate, and what it actually is in THIS app ──────────────────────
 *
 * The sibling Visualizer defers construction behind an IntersectionObserver
 * watching `.intro-vis`, which sits ABOVE the component — so one programmatic
 * jump to the component skips the gate and every test then passes against an
 * empty shell while reporting green.
 *
 * This app does not do that. Measured, not assumed:
 *   grep -c 'IntersectionObserver' index.html  ->  0
 *   no lazy init, no requestIdleCallback, no injected controls.
 * Every control ships in the markup (16 tab stops, 15 of them reachable before
 * anything scrolls) and the single inline IIFE at the end of <body> runs
 * synchronously at parse end.
 *
 * That is a DIFFERENT trap, not the absence of one. Because every control is
 * static, a script that throws on its first line leaves a page that is
 * indistinguishable from a working one to anything static: 4 tiles, 7 accordion
 * headers, 4 PDF links, role="group" + tabindex="0" + the accessible name all
 * present, and axe clean. Nothing would work and the suite would be green.
 *
 * And there is no passive marker to poll for either: sync() is idempotent with
 * the shipped markup at all four audited viewports. Measured before/after it
 * runs, at 1440 / 768 / 390 / 320@dsf4 — tabindex="0", #tf-prev hidden,
 * #tf-next visible, dot 1 active — identical in both cases.
 *
 * So settle() gates on three things instead:
 *   1. the expected control census (fails loudly rather than measuring nothing),
 *   2. fonts + every <img> resolved, before any contrast assertion,
 *   3. a REVERSIBLE functional probe that proves the listeners are attached.
 * Everything polls for a condition. Never a fixed sleep: two honest runs would
 * disagree, and #tf-scroller sets `scroll-behavior: smooth`.
 */

const { expect } = require('@playwright/test');

const TILES = 4;
const ACC_BTNS = 7;   // 1 in tile 1 ("Emission standard"), 2 in each of 2-4
const CTAS = 4;       // one <a href download> per tariff
const NAMED = ACC_BTNS + CTAS; // 11 controls, 11 unique accessible names

// Measured tab-stop census, walking with real Tab keys and letting the smooth
// scroll settle after each press: skip-link, Imprint, #tf-scroller, 7 accordion
// headers, 4 CTAs, #tf-prev, #tf-next. Identical at all four viewports.
//
// 15, not 16, if you do NOT settle: #tf-prev ships `hidden` at scrollLeft 0 and
// only joins the tab order once tabbing into a tile has scrolled the region.
// 16 is the figure a11y-3 §9 quotes.
const TAB_STOPS = 16;

const TARIFFS = ['We Charge Basic', 'We Charge Go', 'We Charge Plus', 'We Charge Pro'];

/**
 * Navigate, gate on the built state, and hand back the component root.
 *
 * @param {import('@playwright/test').Page} page
 * @param {{probe?: boolean}} opts  `probe:false` only for the "silent on load"
 *   live-region test — the probe moves focus, and a test about what happens
 *   with no interaction must not be handed a page that has been interacted
 *   with. Everything else in the gate still runs.
 */
async function settle(page, { probe = true } = {}) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/index.html', { waitUntil: 'load' });

  // Guard against auditing the wrong document entirely: 4173 is the
  // visualizer's port and 4174 is nala's, and `reuseExistingServer` would
  // happily serve a sibling app on a clashing one.
  await page.waitForFunction(
    () => !!document.getElementById('tf-main') && !!document.getElementById('tf-scroller'),
    null, { timeout: 15_000 },
  );

  // Built state, asserted as a census. If the markup is ever gutted or the
  // scoping selector rots, this fails instead of quietly measuring nothing.
  await page.waitForFunction(
    ({ t, a, c }) => document.querySelectorAll('#tf-scroller .tf-tile').length === t
      && document.querySelectorAll('#tf-main .tf-acc-btn').length === a
      && document.querySelectorAll('#tf-main .tf-cta').length === c,
    { t: TILES, a: ACC_BTNS, c: CTAS }, { timeout: 15_000 },
  );

  // Fonts and images must be resolved before any contrast assertion. Half-
  // painted text lets axe compute a background it otherwise cannot determine,
  // which flips colour-contrast findings from `incomplete` (needs review — the
  // honest answer) into hard `violations`. Conditions, not sleeps.
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => {
    const imgs = [...document.querySelectorAll('#content img, #topbar img')];
    return imgs.length > 0 && imgs.every((i) => i.complete);
  }, null, { timeout: 15_000 });

  if (probe) await proveWired(page);

  expect(errors, 'JS exceptions before the first assertion').toEqual([]);
  return page.locator('#tf-main');
}

/**
 * Prove the inline IIFE ran and bound its listeners — the built-state check
 * that the static census cannot make.
 *
 * Reversible by construction: Enter on the first accordion header flips
 * aria-expanded and the panel's `hidden` attribute, and a second Enter puts
 * both back exactly. Measured at 1440 and 320@dsf4: toggling an accordion
 * writes NOTHING to #tf-live (a11y-3 A8 forbids announcing revealed content),
 * so the probe cannot contaminate the live-region tests.
 *
 * Real keys, not element.click(): the point is to exercise the listener that
 * click() would let us skip.
 */
async function proveWired(page) {
  const btn = page.locator('#tf-main .tf-acc-btn').first();
  const panel = /** @type {string} */ (await btn.getAttribute('aria-controls'));
  const was = await btn.getAttribute('aria-expanded'); // ships "true"

  const state = ([id, want]) => {
    const b = document.querySelector('#tf-main .tf-acc-btn');
    const p = document.getElementById(id);
    return b.getAttribute('aria-expanded') === want && p.hasAttribute('hidden') === (want === 'false');
  };

  await btn.focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(state, [panel, was === 'true' ? 'false' : 'true'], { timeout: 5_000 });
  await page.keyboard.press('Enter');
  await page.waitForFunction(state, [panel, was], { timeout: 5_000 });
}

/**
 * Wait until an element's box stops changing, then return it.
 *
 * Two reasons this cannot be a sleep. #tf-scroller sets
 * `scroll-behavior: smooth`, so a synchronous getBoundingClientRect() straight
 * after .focus() catches the scroll mid-animation and reports a control as
 * off-viewport that is not. And the fades transition opacity over .2s while
 * controls report interim geometry — the sibling Visualizer measured 13x13 on
 * a 44x44 button that way and called it an SC 2.5.8 failure.
 *
 * Polls for two identical consecutive samples rather than asserting a size, so
 * it cannot mask a genuine failure.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} selector  ':focus' is valid and is what the 2.4.11 test uses.
 */
async function stableRect(page, selector, tries = 60) {
  let last = null;
  let same = 0;
  for (let i = 0; i < tries; i++) {
    const r = await page.evaluate((s) => {
      const el = document.querySelector(s);
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return {
        id: el.id || el.className || el.tagName,
        left: Math.round(b.left), right: Math.round(b.right),
        top: Math.round(b.top), bottom: Math.round(b.bottom),
        w: Math.round(b.width), h: Math.round(b.height),
        vw: document.documentElement.clientWidth,
        vh: document.documentElement.clientHeight,
      };
    }, selector);
    if (r && last && r.left === last.left && r.top === last.top
        && r.w === last.w && r.h === last.h) {
      // THREE identical samples, not two. Two is not enough: a smooth scroll
      // has a start-up frame, so the first two samples can both read the
      // PRE-scroll position and this would return the off-viewport rect as if
      // it had settled. That is a false SC 2.4.11 failure, and it was flaky
      // rather than reproducible, which is worse.
      if (++same >= 2) return r;
    } else {
      same = 0;
    }
    last = r;
    await page.waitForTimeout(60);
  }
  return last;
}

/**
 * Wait until #tf-scroller.scrollLeft stops changing.
 *
 * Three identical consecutive samples for the same reason as stableRect: a
 * `scroll-behavior: smooth` scroll does not move on the frame it is requested,
 * so two samples can both catch the starting value and declare it settled.
 */
async function stableScroll(page, tries = 60) {
  let last = null;
  let same = 0;
  for (let i = 0; i < tries; i++) {
    const x = await page.evaluate(() =>
      Math.round(document.getElementById('tf-scroller').scrollLeft));
    if (last !== null && x === last) {
      if (++same >= 2) return x;
    } else {
      same = 0;
    }
    last = x;
    await page.waitForTimeout(60);
  }
  return last;
}

/**
 * Drive REAL Tab keys from the top of the document and return one record per
 * stop, plus how the walk ended.
 *
 * `exit` is 'left-page' when activeElement falls back to <body> — Chromium
 * handing focus to its own UI, which is what "no keyboard trap" looks like —
 * 'cycled' if a signature repeats, or 'max' if it ran out of presses.
 *
 * The scroll is settled after every press, and that is load-bearing rather than
 * defensive. Tabbing into a tile fires the app's focusin -> scrollIntoView
 * handler; #tf-scroller scrolls SMOOTHLY, and sync() only unhides #tf-prev once
 * scrollLeft has actually left 0. Walking without settling races that and
 * returns 15 stops instead of 16 — measured both ways.
 */
async function tabStops(page, { shift = false, max = 40 } = {}) {
  const stops = [];
  let exit = 'max';
  for (let i = 0; i < max; i++) {
    await page.keyboard.press(shift ? 'Shift+Tab' : 'Tab');
    await stableScroll(page);
    const s = await page.evaluate(() => {
      const a = document.activeElement;
      if (!a || a === document.body || a === document.documentElement) return null;
      const cs = getComputedStyle(a);
      const name = (a.getAttribute('aria-label') || (a.textContent || '')).replace(/\s+/g, ' ').trim();
      return {
        id: a.id || null,
        cls: a.className || null,
        tag: a.tagName,
        sig: (a.id || a.className || a.tagName) + '|' + name.slice(0, 40),
        outlineColor: cs.outlineColor,
        outlineStyle: cs.outlineStyle,
        outlineWidth: parseFloat(cs.outlineWidth),
        outlineOffset: parseFloat(cs.outlineOffset),
        inScroller: !!document.getElementById('tf-scroller').contains(a),
      };
    });
    if (!s) { exit = 'left-page'; break; }
    if (stops.some((p) => p.sig === s.sig)) { exit = 'cycled'; break; }
    stops.push(s);
  }
  return { stops, exit };
}

/**
 * Put the sequential-focus starting point back at the top of the document.
 *
 * `blur()` is NOT enough and that is the whole reason this helper exists.
 * Blurring clears activeElement but leaves Chromium's sequential focus
 * navigation starting point where the blurred element was, so the next Tab
 * resumes MID-PAGE. Measured: after settle()'s probe, a blur-then-Tab walk
 * started at "PDF Download - We Charge Basic" and found 12 stops instead of 16 —
 * a tab-order suite that silently skips the first four stops.
 *
 * Focusing <body> behind a temporary tabindex resets the starting point
 * properly. The attribute is removed again, so the DOM ends up byte-identical.
 */
async function resetFocus(page) {
  await page.evaluate(() => {
    const b = document.body;
    const had = b.hasAttribute('tabindex');
    b.setAttribute('tabindex', '-1');
    b.focus();
    if (!had) b.removeAttribute('tabindex');
    window.scrollTo(0, 0);
    document.getElementById('tf-scroller').scrollLeft = 0;
  });
  await stableScroll(page);
  const stray = await page.evaluate(() => document.activeElement !== document.body);
  if (stray) throw new Error('resetFocus: focus is still inside the page');
}

/** Expand every collapsed disclosure with real keys. Returns how many moved. */
async function expandAll(page) {
  const ids = await page.evaluate(() =>
    [...document.querySelectorAll('#tf-main .tf-acc-btn')]
      .filter((b) => b.getAttribute('aria-expanded') === 'false')
      .map((b) => b.getAttribute('aria-controls')));
  for (const id of ids) {
    await page.locator(`#tf-main .tf-acc-btn[aria-controls="${id}"]`).focus();
    await page.keyboard.press('Enter');
    await page.waitForFunction(
      (i) => document.querySelector(`#tf-main .tf-acc-btn[aria-controls="${i}"]`)
        .getAttribute('aria-expanded') === 'true' && !document.getElementById(i).hasAttribute('hidden'),
      id, { timeout: 5_000 });
  }
  return ids.length;
}

module.exports = {
  settle, proveWired, stableRect, stableScroll, tabStops, resetFocus, expandAll,
  TILES, ACC_BTNS, CTAS, NAMED, TAB_STOPS, TARIFFS,
};
