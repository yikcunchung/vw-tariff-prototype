// @ts-check
/*
 * The behavioural half — roughly half of this component's accessibility lives in
 * a 170-line inline IIFE that no scanner executes. Every assertion below
 * corresponds to something axe (98 rules), WAVE and Nu all report clean on, and
 * the live-region ones guard the defect that actually shipped: #tf-live derived
 * its index from `scrollLeft` (the LEFTMOST VISIBLE tile) and so announced
 * "We Charge Go" while focus sat on Pro. Present, wired, non-empty, and wrong.
 *
 * Keys and mouse go through page.keyboard / page.mouse so they are real events.
 * element.click() would bypass the exact code paths that break — and for SC
 * 2.5.2 (activation on the up-event) it would make the test meaningless, since
 * click() has no separable down and up.
 *
 * Invariant IDs refer to a11y-3-implementation.md.
 */

const { test, expect } = require('@playwright/test');
const {
  settle, stableRect, stableScroll, tabStops, resetFocus, expandAll,
  TILES, ACC_BTNS, TAB_STOPS, TARIFFS,
} = require('./settle');

const FOCUS_RING = 'rgb(200, 108, 3)'; // #c86c03 — Chrome normalises it, so a
// source-text check on the stylesheet would pass while the ring was broken.

/** What is focused, which tile it is in, and what the live region says. */
const snap = (page) => page.evaluate(() => {
  const a = document.activeElement;
  const tiles = [...document.querySelectorAll('#tf-scroller .tf-tile')];
  const tile = a && a.closest ? a.closest('.tf-tile') : null;
  return {
    active: a === document.body ? 'BODY' : (a.id || a.className || a.tagName),
    name: a === document.body ? '' : (a.getAttribute('aria-label') || (a.textContent || '')).replace(/\s+/g, ' ').trim(),
    inMain: !!(a && document.getElementById('tf-main').contains(a)),
    tileIdx: tile ? tiles.indexOf(tile) : -1,
    live: document.getElementById('tf-live').textContent,
    scrollLeft: Math.round(document.getElementById('tf-scroller').scrollLeft),
    prevHidden: document.getElementById('tf-prev').hidden,
    nextHidden: document.getElementById('tf-next').hidden,
  };
});

const clearLive = (page) =>
  page.evaluate(() => { document.getElementById('tf-live').textContent = ''; });

/* ═══ A8 · a disclosure hides its panel from the accessibility tree ═══════════ */

test.describe('A8 — disclosures', () => {
  test('Enter toggles all seven, and it is the `hidden` ATTRIBUTE that does it', async ({ page }) => {
    await settle(page);
    const ids = await page.evaluate(() =>
      [...document.querySelectorAll('#tf-main .tf-acc-btn')].map((b) => b.getAttribute('aria-controls')));
    expect(ids).toHaveLength(ACC_BTNS);

    for (const id of ids) {
      const btn = page.locator(`#tf-main .tf-acc-btn[aria-controls="${id}"]`);
      const was = await btn.getAttribute('aria-expanded');
      await btn.focus();
      await stableScroll(page);
      await page.keyboard.press('Enter');

      // The mechanism, not just the look. Swap `hidden` for a CSS class and the
      // panel keeps LOOKING right while its text stays in the accessibility
      // tree — a11y-3 A8 calls that out as the one that breaks silently in a
      // framework port. hasAttribute() is what makes this test notice.
      await page.waitForFunction(([i, want]) => {
        const b = document.querySelector(`#tf-main .tf-acc-btn[aria-controls="${i}"]`);
        const p = document.getElementById(i);
        return b.getAttribute('aria-expanded') === want
          && p.hasAttribute('hidden') === (want === 'false')
          && (getComputedStyle(p).display === 'none') === (want === 'false');
      }, [id, was === 'true' ? 'false' : 'true'], { timeout: 5_000 });

      // Toggling must leave focus on the header. Moving it is a separate defect.
      const s = await snap(page);
      expect(s.active, 'focus must stay on the disclosure header').toBe('tf-acc-btn');
      expect(s.inMain).toBe(true);

      await page.keyboard.press('Enter');
      await page.waitForFunction(([i, want]) => document
        .querySelector(`#tf-main .tf-acc-btn[aria-controls="${i}"]`)
        .getAttribute('aria-expanded') === want, [id, was], { timeout: 5_000 });
    }
  });

  test('Space activates a disclosure too', async ({ page }) => {
    await settle(page);
    const btn = page.locator('#tf-main .tf-acc-btn').first();
    const was = await btn.getAttribute('aria-expanded');
    await btn.focus();
    await stableScroll(page);
    await page.keyboard.press(' ');
    await expect(btn).toHaveAttribute('aria-expanded', was === 'true' ? 'false' : 'true');
    expect((await snap(page)).active).toBe('tf-acc-btn');
  });

  test('aria-expanded never contradicts the panel, in either state', async ({ page }) => {
    await settle(page);
    const mismatch = () => page.evaluate(() =>
      [...document.querySelectorAll('#tf-main .tf-acc-btn')]
        .map((b) => ({ id: b.getAttribute('aria-controls'),
          says: b.getAttribute('aria-expanded'),
          reallyHidden: document.getElementById(b.getAttribute('aria-controls')).hasAttribute('hidden') }))
        .filter((r) => (r.says === 'true') === r.reallyHidden));
    expect(await mismatch(), 'default state').toEqual([]);
    await expandAll(page);
    expect(await mismatch(), 'all expanded').toEqual([]);
  });

  test('expanding never announces the revealed content', async ({ page }) => {
    await settle(page);
    /*
     * a11y-3 A8: "Do not announce the revealed content." The reader says
     * "expanded" off aria-expanded and the user then browses in; auto-announcing
     * talks over their own navigation.
     *
     * Two things this test learned the hard way, both worth keeping:
     *
     * 1. The panel must not BE a live region, and must carry no role.
     * 2. Asserting a strictly EMPTY #tf-live after expanding is wrong, and it
     *    was flaky rather than red — the worst kind of wrong. Expanding a panel
     *    grows the tile, which grows #tf-scroller, which fires the app's
     *    ResizeObserver -> schedule() -> sync() -> announce(focused tile). So
     *    the region can legitimately (re)state the TARIFF NAME on expand. That
     *    is redundant, not a defect, and it is never the panel's text. So the
     *    invariant asserted here is the real one: whatever the region says, it
     *    is the announcement for the tile that has focus, and it never contains
     *    a word of the revealed panel.
     */
    const rows = await page.evaluate(() =>
      [...document.querySelectorAll('#tf-main .tf-acc-btn')].map((b) => {
        const id = b.getAttribute('aria-controls');
        const p = document.getElementById(id);
        return { id, text: (p.textContent || '').replace(/\s+/g, ' ').trim(),
          role: p.getAttribute('role'), live: p.getAttribute('aria-live') };
      }));

    for (const r of rows) {
      expect(r.live, `panel ${r.id} must not be a live region`).toBeNull();
      expect(r.role, `panel ${r.id} needs no role`).toBeNull();
    }

    for (const r of rows) {
      await page.locator(`#tf-main .tf-acc-btn[aria-controls="${r.id}"]`).focus();
      await stableScroll(page);
      await clearLive(page);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
      const s = await snap(page);
      // Not one word of the panel.
      for (const word of r.text.split(' ').filter((w) => w.length > 4)) {
        expect(s.live, `expanding ${r.id} leaked "${word}" into the live region`)
          .not.toContain(word);
      }
      // And if it spoke at all, it spoke about the tile focus is in.
      if (s.live !== '') {
        expect(s.live, `expanding ${r.id} announced the wrong tile`)
          .toBe(`${TARIFFS[s.tileIdx]}, tariff ${s.tileIdx + 1} of ${TILES}`);
      }
    }
  });

  test('a collapsed panel is really out of the accessibility tree', async ({ page }) => {
    await settle(page);
    // Read off the real AX tree over CDP, not off the DOM — that is the method
    // a11y-2 §8 prescribes and the only one that proves `hidden` reached the
    // tree rather than merely the paint.
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Accessibility.enable');
    const IONITY = 'IONITY prices vary depending on your tariff';
    const treeHas = async (needle) => {
      const { nodes } = await cdp.send('Accessibility.getFullAXTree');
      return nodes.some((n) => [n.name && n.name.value, n.value && n.value.value]
        .some((v) => typeof v === 'string' && v.includes(needle)));
    };
    expect(await treeHas(IONITY), 'collapsed panel text must be absent from the AX tree').toBe(false);
    await expandAll(page);
    expect(await treeHas(IONITY), 'expanded panel text must be present').toBe(true);
  });

  test('0 unnamed role=image nodes in the accessibility tree', async ({ page }) => {
    await settle(page);
    await expandAll(page);
    // a11y-2 §4 trap 10: axe is structurally blind to an unnamed graphic —
    // svg-img-alt and role-img-alt return `inapplicable` for an <svg> with no
    // role, and image-alt only inspects <img>. Three sibling apps shipped 16, 9
    // and 7 of them past a clean axe run. The AX tree is the only detector.
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Accessibility.enable');
    const { nodes } = await cdp.send('Accessibility.getFullAXTree');
    const unnamed = nodes
      .filter((n) => n.role && n.role.value === 'image' && !n.ignored)
      .filter((n) => !(n.name && typeof n.name.value === 'string' && n.name.value.trim()))
      .map((n) => n.nodeId);
    expect(unnamed).toEqual([]);
  });
});

/* ═══ B7 · a scrollable region is keyboard reachable ═════════════════════════ */

test.describe('B7 — the scroller', () => {
  test('#tf-scroller is a named role=group and a real Tab stop', async ({ page }) => {
    await settle(page);
    const sc = page.locator('#tf-scroller');
    await expect(sc).toHaveAttribute('role', 'group');
    await expect(sc).toHaveAttribute('tabindex', '0');
    expect((await sc.getAttribute('aria-label') || '').trim(), 'ACT 0ssw9k needs a name').not.toBe('');

    // Reached by driving Tab, not by asserting the attribute — sync() removes
    // the tabindex when the region is not actually scrollable, so the attribute
    // alone proves nothing about this viewport.
    await resetFocus(page);
    const { stops } = await tabStops(page);
    expect(stops.map((s) => s.id)).toContain('tf-scroller');
  });

  test('the scroller keeps native arrow scrolling — that is what earns it the tab stop', async ({ page }) => {
    await settle(page);
    await resetFocus(page);
    await page.locator('#tf-scroller').focus();
    // Confirm the key will land on the region before pressing it, and poll for
    // the RESULT rather than sampling for stability. Sampling read three
    // identical zeroes once under parallel load — the browser's own smooth
    // keyboard scroll had not started yet — and reported "ArrowRight does not
    // scroll" against a page where it does.
    await page.waitForFunction(() => document.activeElement.id === 'tf-scroller');
    expect(await stableScroll(page)).toBe(0);
    // Press until it moves, up to five times, polling for the result after each.
    // Chromium occasionally swallows the first arrow key on a freshly focused
    // scroll container under parallel load — observed roughly one run in ten,
    // and a single press plus a 10s wait then reported "arrow keys do not
    // scroll this region" against a page where they do. Repeating the key is
    // what a real user does anyway; a region that never scrolls still goes red.
    let moved = 0;
    for (let i = 0; i < 5 && moved === 0; i++) {
      await page.keyboard.press('ArrowRight');
      try {
        await page.waitForFunction(
          () => document.getElementById('tf-scroller').scrollLeft > 0,
          null, { timeout: 1500 },
        );
      } catch { /* try again */ }
      moved = await stableScroll(page);
    }
    expect(moved, 'ArrowRight on the region itself must scroll it').toBeGreaterThan(0);
    // And focus must stay on the region, not jump into a tile.
    expect((await snap(page)).active).toBe('tf-scroller');
  });
});

/* ═══ B3 / B6 · tab order and no trap ═══════════════════════════════════════ */

test.describe('B3, B6 — tab order', () => {
  test('Tab reaches all 16 stops and then leaves the page', async ({ page }) => {
    await settle(page);
    await resetFocus(page);
    const { stops, exit } = await tabStops(page);
    expect(stops.map((s) => s.sig).join('\n')).not.toBe('');
    expect(stops, `stops reached:\n${stops.map((s) => s.sig).join('\n')}`).toHaveLength(TAB_STOPS);
    // SC 2.1.2: Tab must go out the other side. 'cycled' would mean a trap.
    expect(exit, 'Tab must escape the page').toBe('left-page');
    expect(new Set(stops.map((s) => s.sig)).size, 'every stop distinct').toBe(TAB_STOPS);
  });

  test('a `hidden` arrow is out of the tab order, and comes back when unhidden', async ({ page }) => {
    await settle(page);
    await resetFocus(page);
    // [hidden], not opacity — a focusable-but-invisible button is the worse bug.
    await page.waitForFunction(() => document.getElementById('tf-prev').hidden);
    const atStart = await page.evaluate(() => {
      const p = document.getElementById('tf-prev');
      p.focus();
      return { hidden: p.hidden, display: getComputedStyle(p).display, focusTook: document.activeElement === p };
    });
    expect(atStart).toEqual({ hidden: true, display: 'none', focusTook: false });

    await page.evaluate(() => {
      const sc = document.getElementById('tf-scroller');
      sc.scrollLeft = sc.scrollWidth - sc.clientWidth;
    });
    // Poll for the STATE, not for a stable number. #tf-scroller scrolls
    // smoothly, so an assignment to scrollLeft does not land on the frame it is
    // made — and sync() only hides #tf-next once it has. Sampling for stability
    // instead can catch the pre-scroll value twice and call it settled.
    await page.waitForFunction(() => document.getElementById('tf-next').hidden,
      null, { timeout: 10_000 });
    const atEnd = await page.evaluate(() => {
      const n = document.getElementById('tf-next');
      n.focus();
      const nextTook = document.activeElement === n;
      const p = document.getElementById('tf-prev');
      p.focus();
      return { nextHidden: n.hidden, nextTook, prevHidden: p.hidden, prevTook: document.activeElement === p };
    });
    expect(atEnd).toEqual({ nextHidden: true, nextTook: false, prevHidden: false, prevTook: true });
  });

  test('B4 — every real Tab stop renders the audited focus ring', async ({ page }) => {
    await settle(page);
    await resetFocus(page);
    // On the COMPUTED value after real Tab keys, on EVERY stop. Three ways this
    // test could have been fake: Chrome normalises #c86c03 to rgb(200,108,3) so
    // a stylesheet-text check passes while the ring is broken; :focus-visible
    // does not match a programmatic .focus(), so a .focus() walk measures
    // nothing; and one base rule now covers 16 stops of four different kinds,
    // so checking a single element would miss a regression on the others.
    const { stops } = await tabStops(page);
    expect(stops.length).toBe(TAB_STOPS);
    for (const s of stops) {
      expect(s.outlineColor, `ring colour on ${s.sig}`).toBe(FOCUS_RING);
      expect(s.outlineStyle, `ring style on ${s.sig}`).toBe('solid');
      expect(s.outlineWidth, `ring width on ${s.sig}`).toBeGreaterThanOrEqual(2);
      expect(s.outlineOffset, `ring offset on ${s.sig}`).toBe(0);
    }
  });
});

/* ═══ B5 · SC 2.4.11 — a focused control is never left off-screen ═══════════ */

test('B5 — every focused control inside the scroller settles clear of the viewport edge and the fades', async ({ page }) => {
  await settle(page);
  await resetFocus(page);
  const bad = [];
  for (let i = 0; i < TAB_STOPS + 2; i++) {
    await page.keyboard.press('Tab');
    const who = await page.evaluate(() => {
      const a = document.activeElement;
      if (!a || a === document.body) return null;
      return {
        id: a.id || a.className,
        inScroller: a.id !== 'tf-scroller' && document.getElementById('tf-scroller').contains(a),
      };
    });
    if (!who) break;
    // Judged only on the scroller's own contents. #tf-scroller itself is a
    // 698px-tall scroll CONTAINER at a 256px viewport (measured T-185 B513 at
    // 320x256@dsf4) — SC 2.4.11 is about a focused CONTROL being obscured, and a
    // scroll container bigger than its porthole is the permitted two-dimensional
    // case. The two arrow buttons live outside the scroller, in the page
    // gutters, and are painted after the fades: sitting over one is where they
    // belong.
    if (!who.inScroller) continue;

    /*
     * Poll for the CONDITION, do not sample for stability.
     *
     * This test was written the other way first — stableRect() then a single
     * assertion — and it was flaky: #tf-scroller sets `scroll-behavior: smooth`
     * and the page scrolls vertically at the same time, so a "settled" sample
     * can be caught in a lull between the two animations and reports a control
     * as off-viewport that arrives 100ms later. A false SC 2.4.11 failure that
     * appears one run in twenty is worse than no test.
     *
     * Polling for "ends up clear" cannot produce that false red, and it still
     * fails loudly when the control never arrives — verified by mutation
     * (removing the focusin handler, and removing scroll-padding-inline).
     */
    // Generous on purpose. 88 measurements at 320x256 showed zero persistent
    // overlaps, but a 2s budget still went red once under six parallel workers:
    // a genuine failure NEVER becomes true, so a long deadline costs nothing
    // but a slow red, while a short one manufactures false ones. Bounded by the
    // `break` below, so one bad control cannot turn into a 30s test timeout.
    const deadline = Date.now() + 6000;
    let last = null;
    for (;;) {
      last = await page.evaluate(() => {
        const a = document.activeElement;
        const b = a.getBoundingClientRect();
        const de = document.documentElement;
        const fades = [...document.querySelectorAll('#tf-fade, #tf-fade-left')]
          .filter((f) => {
            const cs = getComputedStyle(f);
            return cs.display !== 'none' && parseFloat(cs.opacity) > 0.01;
          })
          .map((f) => {
            const fr = f.getBoundingClientRect();
            const w = Math.min(b.right, fr.right) - Math.max(b.left, fr.left);
            const h = Math.min(b.bottom, fr.bottom) - Math.max(b.top, fr.top);
            return { id: f.id, w: Math.round(w), h: Math.round(h) };
          })
          .filter((o) => o.w > 0 && o.h > 0);
        return {
          rect: `L${Math.round(b.left)} R${Math.round(b.right)} T${Math.round(b.top)} B${Math.round(b.bottom)}`,
          vw: de.clientWidth, vh: de.clientHeight,
          inside: b.left >= -1 && b.right <= de.clientWidth + 1
            && b.top >= -1 && b.bottom <= de.clientHeight + 1,
          fades,
        };
      });
      if (last.inside && last.fades.length === 0) break;
      if (Date.now() > deadline) {
        bad.push(`${who.id} ${last.rect} (vw${last.vw} vh${last.vh})`
          + (last.fades.length ? ` under ${last.fades.map((f) => `${f.id} ${f.w}x${f.h}`).join(', ')}` : ' OFF-VIEWPORT'));
        break;
      }
      await page.waitForTimeout(80);
    }
    // One named control is enough to go red; walking the remaining ten at 2s
    // each only turns a clear failure into a 30s test timeout.
    if (bad.length) break;
  }
  expect(bad, 'controls that never came clear of the viewport edge or a visible fade').toEqual([]);
});

/* ═══ C2 · activation on the up-event ═══════════════════════════════════════ */

test('C2 — a disclosure activates on pointer UP, not DOWN', async ({ page }) => {
  await settle(page);
  const btn = page.locator('#tf-main .tf-acc-btn').first();
  await btn.focus();               // brings it inside the porthole
  const r = await stableRect(page, '#tf-main .tf-acc-btn');
  const was = await btn.getAttribute('aria-expanded');

  await page.mouse.move(r.left + r.w / 2, r.top + r.h / 2);
  await page.mouse.down();
  await page.waitForTimeout(200);
  expect(await btn.getAttribute('aria-expanded'),
    'nothing may happen on pointerdown — the user must be able to drag off to abort')
    .toBe(was);
  await page.mouse.up();
  await expect(btn).toHaveAttribute('aria-expanded', was === 'true' ? 'false' : 'true');
});

/* ═══ A6 · the live region — the defect that shipped ════════════════════════ */

test.describe('A6 — announcements', () => {
  test('the live region exists at load and is silent', async ({ page }) => {
    // probe:false — the settle probe presses a key, and a test about what
    // happens with NO interaction must not be handed an interacted-with page.
    // The census, fonts and image gates still run.
    await settle(page, { probe: false });
    const live = page.locator('#tf-live');
    await expect(live).toHaveAttribute('aria-live', 'polite');
    // In the DOM from the start: injecting a region and writing to it in the
    // same tick is not announced.
    await expect(live).toHaveText('');
    await page.waitForTimeout(700);
    await expect(live, 'the first sync() must not announce — there is no change to report')
      .toHaveText('');
  });

  test('ArrowRight announces the tile FOCUS is in, at every step', async ({ page }) => {
    await settle(page);
    // THE regression guard. Before the fix the index came from scrollLeft — the
    // leftmost VISIBLE tile — which equals the focused tile only when one tile
    // fits. At 1440 that announced "We Charge Go, tariff 2 of 4" with focus on
    // Pro; at 390 it looked perfect. Asserting the announcement against the
    // element that actually has focus is the only formulation that fails at the
    // wide widths and passes at the narrow one.
    await resetFocus(page);
    await page.locator('#tf-scroller .tf-tile').first().locator('.tf-acc-btn').focus();
    await stableScroll(page);
    await clearLive(page);

    for (let i = 1; i < TILES; i++) {
      await page.keyboard.press('ArrowRight');
      await page.waitForFunction((n) => document.getElementById('tf-live').textContent
        .includes(`tariff ${n + 1} of `), i, { timeout: 5_000 });
      await stableScroll(page);
      const s = await snap(page);
      expect(s.tileIdx, `ArrowRight ${i}: focus must have moved into tile ${i}`).toBe(i);
      expect(s.live, 'the announcement must name the tile focus is in')
        .toBe(`${TARIFFS[i]}, tariff ${i + 1} of ${TILES}`);
      expect(s.active, 'focus must land on the peer control, not be dropped').toBe('tf-acc-btn');
    }
  });

  test('ArrowLeft walks back, and the announcement follows focus', async ({ page }) => {
    await settle(page);
    await resetFocus(page);
    await page.locator('#tf-scroller .tf-tile').nth(TILES - 1).locator('.tf-acc-btn').first().focus();
    await stableScroll(page);
    await clearLive(page);

    for (let i = TILES - 2; i >= 0; i--) {
      await page.keyboard.press('ArrowLeft');
      await page.waitForFunction((n) => document.getElementById('tf-live').textContent
        .includes(`tariff ${n + 1} of `), i, { timeout: 5_000 });
      await stableScroll(page);
      const s = await snap(page);
      expect(s.tileIdx, `ArrowLeft to tile ${i}`).toBe(i);
      expect(s.live).toBe(`${TARIFFS[i]}, tariff ${i + 1} of ${TILES}`);
    }
  });

  test('focus follows to the matching control in the next tile, index clamped', async ({ page }) => {
    await settle(page);
    await resetFocus(page);
    // Tile 2's SECOND accordion ("Ionity"). Tile 3 has two, so the peer is its
    // second; tile 1 has ONE, so walking back must CLAMP rather than assume an
    // index exists — that is a real off-by-one waiting to happen.
    await page.locator('#tf-scroller .tf-tile').nth(1).locator('.tf-acc-btn').nth(1).focus();
    await stableScroll(page);

    await page.keyboard.press('ArrowRight');
    await stableScroll(page);
    let s = await snap(page);
    expect(s.tileIdx).toBe(2);
    expect(s.name, 'same class, same index within that class').toContain('Ionity');

    await page.keyboard.press('ArrowLeft');
    await stableScroll(page);
    await page.keyboard.press('ArrowLeft');
    await stableScroll(page);
    s = await snap(page);
    expect(s.tileIdx, 'clamped into tile 1').toBe(0);
    expect(s.name, 'tile 1 has only "Emission standard", so the index must clamp')
      .toContain('Emission standard');
    expect(s.active).toBe('tf-acc-btn');

    // A CTA must step to a CTA, not to an accordion.
    await page.locator('#tf-scroller .tf-tile').first().locator('.tf-cta').focus();
    await stableScroll(page);
    await page.keyboard.press('ArrowRight');
    await stableScroll(page);
    s = await snap(page);
    expect(s.tileIdx).toBe(1);
    expect(s.active).toBe('tf-cta');
  });

  test('at the last tile the arrow falls through instead of dead-ending', async ({ page }) => {
    await settle(page);
    await resetFocus(page);
    await page.locator('#tf-scroller .tf-tile').nth(TILES - 1).locator('.tf-cta').focus();
    await stableScroll(page);
    const before = await snap(page);
    expect(before.tileIdx).toBe(TILES - 1);

    await page.keyboard.press('ArrowRight');
    await stableScroll(page);
    const after = await snap(page);
    // The handler returns before preventDefault at the last tile, so the key
    // falls through to native scrolling rather than being swallowed. Focus must
    // stay put and must not be dropped on the floor.
    expect(after.active, 'focus must not be lost at the end of the carousel').toBe(before.active);
    expect(after.tileIdx).toBe(TILES - 1);
    expect(after.inMain).toBe(true);
  });

  test('focus is never lost to <body> across a full keyboard pass', async ({ page }) => {
    await settle(page);
    await resetFocus(page);
    const lost = [];
    const check = async (step) => {
      const s = await snap(page);
      if (s.active === 'BODY' || !s.inMain) lost.push(`${step}: ${s.active}`);
    };
    await page.locator('#tf-scroller .tf-tile').first().locator('.tf-acc-btn').focus();
    await stableScroll(page);
    for (const key of ['Enter', 'Enter', ' ', ' ', 'ArrowRight', 'ArrowRight',
      'ArrowRight', 'ArrowLeft', 'ArrowLeft', 'ArrowLeft', 'Escape', 'Enter', 'Enter']) {
      await page.keyboard.press(key);
      await stableScroll(page);
      await check(key);
    }
    expect(lost, 'focus was dropped to <body>').toEqual([]);
  });

  test('the next arrow keeps focus when it hides itself at the end of the scroll', async ({ page }) => {
    /*
     * FIXED 2026-08-24. This was a real defect: sync() set `next.hidden = true`
     * while that button still held focus, Chromium had nowhere to put it, and
     * document.activeElement collapsed to <body> — a keyboard user was dumped at
     * the top of the document mid-task. #tf-prev had the mirror bug at
     * scrollLeft 0. Presses to reach the end: 1 at 1440, 3 at the rest.
     *
     * sync() now rehomes focus BEFORE hiding whichever arrow owns it — to the
     * opposite arrow if that one will still be visible, otherwise to
     * #tf-scroller, which is a named role="group" with tabindex="0" and so a
     * legitimate place to land.
     *
     * This was pinned as an expected failure while the defect stood, so fixing
     * it turned the run red for passing unexpectedly. That is what un-pinned it.
     */
    await settle(page);
    await resetFocus(page);
    await page.locator('#tf-next').focus();
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Enter');
      await stableScroll(page);
      const s = await snap(page);
      expect(s.active, `after ${i + 1} press(es) on #tf-next`).not.toBe('BODY');
      if (s.nextHidden) break;
    }
  });
});
