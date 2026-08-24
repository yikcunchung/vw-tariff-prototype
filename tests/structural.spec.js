// @ts-check
/*
 * The scanner half. axe runs INSIDE Playwright rather than under jest-axe: jsdom
 * has no layout, so target-size (SC 2.5.8) and reflow (SC 1.4.10) cannot be
 * evaluated there at all, and this component's whole interesting behaviour is a
 * horizontally scrolling region.
 *
 * Both disclosure states are covered, not just the shipped one. Four of the seven
 * accordions ship `aria-expanded="true"` and three ship collapsed.
 */

const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const {
  settle, expandAll, stableRect, TILES, ACC_BTNS, CTAS, NAMED, TARIFFS,
} = require('./settle');

// The nine rules axe-core ships with `enabled: false`. target-size is the SC
// 2.5.8 rule, so a stock run reports "0 violations" having never tested target
// size at all — a11y-2 §4 trap 1.
const DEFAULT_DISABLED = [
  'target-size', 'aria-roledescription', 'color-contrast-enhanced',
  'duplicate-id', 'duplicate-id-active', 'identical-links-same-purpose',
  'landmark-complementary-is-top-level', 'meta-refresh-no-exceptions', 'audio-caption',
];

// The conformance target is WCAG 2.2 A + AA. `color-contrast-enhanced` is SC
// 1.4.6 — AAA — and is force-enabled here so it RUNS and is reported, but a AAA
// finding is not a failure against this target. It is gated separately below,
// against the exact node set a11y-2 §2 records, so a NEW AAA regression still
// goes red while the two documented ones do not fail the build.
const isAAAOnly = (v) => v.tags.includes('wcag2aaa')
  && !v.tags.some((t) => /^wcag2a{1,2}$/.test(t) || /^wcag2\d/.test(t));

const KNOWN_AAA_CONTRAST = ['.tf-legal-org', '.tf-rate-note--tertiary'];

const fmt = (list) => list.map((v) => `${v.id} [${v.tags.filter((t) => t.startsWith('wcag')).join(',')}]`
  + `: ${v.nodes.length} node(s) -> ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`);

function axeRun(page) {
  return new AxeBuilder({ page })
    .include('#tf-main')
    .options({ rules: Object.fromEntries(DEFAULT_DISABLED.map((r) => [r, { enabled: true }])) })
    .analyze();
}

const bucketOf = (r, id) => (r.violations.some((x) => x.id === id) ? 'violations'
  : r.incomplete.some((x) => x.id === id) ? 'incomplete'
    : r.passes.some((x) => x.id === id) ? 'passes' : 'ABSENT');

test.describe('axe', () => {
  test('0 A/AA violations in the default state, with the nine forced on', async ({ page }) => {
    await settle(page);
    const r = await axeRun(page);
    const blocking = r.violations.filter((v) => !isAAAOnly(v));
    expect(fmt(blocking)).toEqual([]);
  });

  test('0 A/AA violations with all seven disclosures expanded', async ({ page }) => {
    await settle(page);
    // "All states, not just the default" — a11y-3 Definition of Done. Driven with
    // real Enter keys, so this also exercises the handler rather than the markup.
    const moved = await expandAll(page);
    expect(moved, 'three accordions ship collapsed and must have been opened').toBe(3);
    const r = await axeRun(page);
    const blocking = r.violations.filter((v) => !isAAAOnly(v));
    expect(fmt(blocking)).toEqual([]);
  });

  test('target-size ran, and it ran in `passes` — not silently skipped', async ({ page }) => {
    await settle(page);
    const r = await axeRun(page);
    // Assert the RULE, not the config: a tag filter or a typo'd rule id gives a
    // clean run that never tested SC 2.5.8. `incomplete` matters just as much as
    // `violations` here, because an obscured control lands there (trap 2) — an
    // undersized target can be missing from `violations` because axe could not
    // decide, not because it passed.
    expect(bucketOf(r, 'target-size'), 'target-size bucket').toBe('passes');
    const pass = r.passes.find((x) => x.id === 'target-size');
    // 13 = 7 accordion headers + 4 PDF links + the Imprint link + #tf-next.
    // #tf-prev ships `hidden` at scrollLeft 0 and so is not a target yet.
    expect(pass.nodes.length, 'target-size passing nodes in #tf-main').toBe(13);
  });

  test('all nine default-disabled rules appear in the results', async ({ page }) => {
    await settle(page);
    const r = await axeRun(page);
    const ran = new Set([...r.passes, ...r.violations, ...r.incomplete, ...r.inapplicable]
      .map((x) => x.id));
    const missing = DEFAULT_DISABLED.filter((id) => !ran.has(id));
    expect(missing, 'rules that were force-enabled but never appeared').toEqual([]);
  });

  test('`incomplete` is empty — nothing is left for a human to resolve', async ({ page }) => {
    await settle(page);
    const r = await axeRun(page);
    // `violations` is not the whole result (trap 2). `incomplete` is the "needs
    // review" bucket a BITV / EN 301 549 tester must clear by hand, and it is
    // where an obscured element lands. Measured empty at all four viewports in
    // both disclosure states, so a non-empty bucket is a real change.
    expect(fmt(r.incomplete)).toEqual([]);
  });

  test('SC 1.4.6 (AAA, outside the target) fails only on the two documented nodes', async ({ page }) => {
    await settle(page);
    const r = await axeRun(page);
    expect(bucketOf(r, 'color-contrast-enhanced'), 'the AAA rule must have run').not.toBe('ABSENT');
    const v = r.violations.find((x) => x.id === 'color-contrast-enhanced');
    const nodes = v ? v.nodes.map((n) => n.target.join(' ')).sort() : [];
    // Not a build failure — a drift detector. If a THIRD node starts failing
    // 7:1, that is new information about the palette even though the target is AA.
    expect(nodes).toEqual(KNOWN_AAA_CONTRAST);
  });
});

test.describe('names', () => {
  test('no interactive node is unnamed', async ({ page }) => {
    await settle(page);
    await expandAll(page);
    const unnamed = await page.evaluate(() =>
      [...document.querySelectorAll(
        '#tf-main button, #tf-main a[href], #tf-main select, #tf-main input,'
        + ' #tf-main [role="button"], #tf-main [role="link"], #tf-main [role="group"],'
        + ' #tf-main [tabindex]:not([tabindex="-1"])')]
        .filter((el) => el.getAttribute('aria-hidden') !== 'true' && !el.closest('[hidden]'))
        .filter((el) => {
          const ref = el.getAttribute('aria-labelledby');
          const name = el.getAttribute('aria-label')
            || (ref ? ref.split(/\s+/).map((id) => (document.getElementById(id) || {}).textContent || '').join(' ') : '')
            || (el.getAttribute('alt'))
            || el.textContent || '';
          return name.replace(/\s+/g, ' ').trim() === '';
        })
        .map((el) => el.tagName + (el.id ? '#' + el.id : '.' + el.className)));
    expect(unnamed).toEqual([]);
  });

  test('no <img> is unnamed and unhidden — axe cannot see an unnamed graphic', async ({ page }) => {
    await settle(page);
    // a11y-2 §4 trap 10: `svg-img-alt` and `role-img-alt` return `inapplicable`
    // for an <svg> with no role, and `image-alt` only inspects <img>. Three
    // siblings shipped 16, 9 and 7 unnamed graphics past a clean axe run. This
    // app ships zero, and this is what keeps it that way.
    const bad = await page.evaluate(() => {
      const out = [];
      for (const el of document.querySelectorAll('#tf-main img, #tf-main svg')) {
        const hidden = el.getAttribute('aria-hidden') === 'true';
        const named = (el.getAttribute('alt') || el.getAttribute('aria-label') || '').trim() !== '';
        const decorative = el.tagName === 'IMG' && el.getAttribute('alt') === '';
        if (!hidden && !named && !decorative) out.push(el.tagName + '.' + el.getAttribute('class'));
      }
      return out;
    });
    expect(bad, 'graphics that are neither named nor explicitly hidden').toEqual([]);
  });

  test('11 controls show 4 duplicate strings and carry 11 unique names', async ({ page }) => {
    await settle(page);
    // The pattern a11y-3 §9 says to copy: four tiles each show "PDF Download"
    // and "Emission standard". Suffix for uniqueness, never replace the visible
    // text — so SC 2.5.3 still holds and a link rotor stays navigable.
    const rows = await page.evaluate(() =>
      [...document.querySelectorAll('#tf-main .tf-acc-btn, #tf-main .tf-cta')].map((el) => {
        const clone = /** @type {HTMLElement} */ (el.cloneNode(true));
        clone.querySelectorAll('.sr-only').forEach((s) => s.remove());
        return {
          visible: (clone.textContent || '').replace(/\s+/g, ' ').trim(),
          name: (el.textContent || '').replace(/\s+/g, ' ').trim(),
        };
      }));

    expect(rows).toHaveLength(NAMED);
    expect(new Set(rows.map((r) => r.name)).size, `duplicate accessible names: ${JSON.stringify(rows.map((r) => r.name))}`)
      .toBe(NAMED);
    // Duplicate VISIBLE strings are the whole point of the fixture: if they ever
    // become unique this test stops proving anything, so assert they are still there.
    expect(new Set(rows.map((r) => r.visible)).size,
      'the visible strings are supposed to collide — that is what the suffix solves')
      .toBeLessThan(NAMED);
    // SC 2.5.3: the visible label, verbatim, at the START of the name.
    const spliced = rows.filter((r) => !r.name.startsWith(r.visible));
    expect(spliced, 'a hidden suffix must be appended, never spliced into the visible text')
      .toEqual([]);
    // Every name must end in its own tariff tier.
    const untiered = rows.filter((r) => !TARIFFS.some((t) => r.name.endsWith(t)));
    expect(untiered, 'each name must be suffixed with its tariff').toEqual([]);
  });

  test('every aria-controls resolves to a real element', async ({ page }) => {
    await settle(page);
    const dangling = await page.evaluate(() =>
      [...document.querySelectorAll('#tf-main [aria-controls]')]
        .filter((el) => !document.getElementById(el.getAttribute('aria-controls')))
        .map((el) => el.getAttribute('aria-controls')));
    expect(dangling).toEqual([]);
    expect(await page.locator('#tf-main .tf-acc-btn[aria-controls]').count()).toBe(ACC_BTNS);
  });
});

test.describe('targets', () => {
  test('no visible target is under 24x24', async ({ page }) => {
    await settle(page);
    await expandAll(page);
    // Wait for the box to STOP CHANGING first. The fades transition opacity over
    // .2s and #tf-scroller scrolls smoothly; a control measured mid-transition
    // reports interim geometry (the sibling Visualizer read 13x13 off a 44x44
    // button that way). Two identical consecutive samples, not a sleep.
    await stableRect(page, '#tf-next');
    const small = await page.evaluate(() =>
      [...document.querySelectorAll('#tf-main button, #tf-main a[href], #tf-main [role="button"]')]
        .filter((el) => !(/** @type {HTMLButtonElement} */ (el).disabled))
        .filter((el) => {
          for (let n = el; n; n = n.parentElement) {
            if (n.nodeType === 1 && getComputedStyle(n).display === 'none') return false;
          }
          return true;
        })
        .map((el) => ({
          id: el.id || el.className,
          w: Math.round(el.getBoundingClientRect().width),
          h: Math.round(el.getBoundingClientRect().height),
        }))
        .filter((b) => b.w > 0 && (b.w < 24 || b.h < 24)));
    expect(small, 'targets under 24x24 CSS px').toEqual([]);
  });
});

test.describe('reflow', () => {
  test('the page never scrolls horizontally; the overflow lives inside #tf-scroller', async ({ page }) => {
    await settle(page);
    // SC 1.4.10 passes here on the EXCEPTION, not on the absence of overflow.
    // The tiles do extend past the viewport — entirely inside a bounded,
    // keyboard-operable region, which is the permitted two-dimensional case.
    // If the carousel is ever replaced with a plain overflowing row, the first
    // assertion goes red and that is correct.
    const m = await page.evaluate(() => {
      const sc = document.getElementById('tf-scroller');
      const de = document.documentElement;
      return {
        pageOverflow: de.scrollWidth - de.clientWidth,
        scrollerOverflow: sc.scrollWidth - sc.clientWidth,
        vw: de.clientWidth,
      };
    });
    expect(m.pageOverflow, `page-level horizontal scroll at ${m.vw}px`).toBeLessThanOrEqual(0);
    expect(m.scrollerOverflow,
      'the tiles must overflow the SCROLLER — otherwise this test proves nothing')
      .toBeGreaterThan(2);
  });

  test('still no horizontal scroll with every disclosure open', async ({ page }) => {
    await settle(page);
    await expandAll(page);
    const over = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(over).toBeLessThanOrEqual(0);
  });

  test('the census survives all four viewports', async ({ page }) => {
    await settle(page);
    expect(await page.locator('#tf-scroller .tf-tile').count()).toBe(TILES);
    expect(await page.locator('#tf-main .tf-acc-btn').count()).toBe(ACC_BTNS);
    expect(await page.locator('#tf-main .tf-cta').count()).toBe(CTAS);
  });
});

test.describe('assets', () => {
  test('no request fails and no JS exception fires through a full pass', async ({ page }) => {
    const bad = [];
    const errs = [];
    page.on('requestfailed', (r) => bad.push(`FAILED ${r.url()}`));
    page.on('response', (r) => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`); });
    page.on('pageerror', (e) => errs.push(e.message));

    await settle(page);
    await expandAll(page);
    await page.locator('#tf-scroller').focus();
    await page.keyboard.press('ArrowRight');
    await page.locator('#tf-next').focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(400);

    expect(bad, 'a 404 image still reports img.complete === true').toEqual([]);
    expect(errs).toEqual([]);
  });
});
