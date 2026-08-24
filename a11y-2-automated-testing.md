# A11y 2 of 3 — What the automated tests cover, and what they cannot

**App:** VW Charging Tariffs — We Charge (`tariffs`).
**Audited:** 2026-08-24 against the current source, headless Chrome 151.0.7922.174, axe-core 4.13.0
(`axe.version` read from the engine, not the bundle filename).
**Deployed at:** https://yikcunchung.github.io/vw-tariff-prototype/
**Companions:** `a11y-1-criteria.md` (every criterion) · `a11y-3-implementation.md` (what to build).
**Manual testing:** the procedure is §6, the checklist §7, the results §9, the claim §10.

The single most important sentence in this pack:

> **A clean automated run is necessary and nowhere near sufficient.** This app scores 0 axe
> violations, 0 WAVE errors and 0 HTML validity errors — and that result could not see the
> unnamed-graphic defect that the accessibility tree found, cannot test SC 2.5.3, cannot judge
> whether a name is *correct* rather than merely present, and cannot tell you what a screen reader
> actually says.

---

# 0. Scope of this evidence — read before quoting a number

The conformance surface is **`#tf-main`** — the tariff section. `axe.run(document)` is run over the
whole document anyway, because scoping a scanner is how findings get lost; anything it reports in the
**topbar** is then triaged as out of scope.

**The topbar is excluded deliberately, not conveniently.** It is non-functional chrome reproducing the
VW shell: inert `<div>`s wrapping `alt=""` images, with no handler, `tabindex`, `role` or
`cursor: pointer`. They do nothing for *anyone* — a sighted mouse user cannot use them either. That is
**not implemented**, not "accessible", and a real build must turn them into real controls and expose
them. See `a11y-1` for the scope statement and §9.3 for what a Pro-tier scan finds against them.

The local `index.html` and the deployed build are **byte-identical**.

---

# 1. Tool coverage at a glance

| Tool | Good for | Blind spots that matter here |
|---|---|---|
| **axe-core 4.13.0** | Structural ARIA, names, roles, contrast on solid backgrounds | **No `label-in-name` rule at all** (SC 2.5.3). **Cannot see an unnamed inline `<svg>` that has no `role`** — trap 10. Cannot see behaviour. Punts on contrast over gradients. **Nine rules are off by default, including `target-size`** — trap 1 |
| **WAVE 3.3.1.0** | A genuinely different engine; catches empty labels and sr-only contrast axe passes | Needs a public URL. Reports `.sr-only` contrast as an error even when clipped to 1×1 |
| **Nu HTML validator** | SC 4.1.1 Parsing, still normative under EN 301 549 | Says nothing about semantics or naming |
| **Accessibility tree (CDP)** | Ground truth for name / role / value | Exposure is not announcement — §5 |
| **Real key and pointer events** | The only way to test behaviour | Slow; assert state after every event |

## Required toolchain — coverage against it

| Required | Status | Note |
|---|---|---|
| **axe DevTools 4.131.2** | ◐ **Equivalent, not identical** | This audit ran **axe-core 4.13.0**, the library the extension embeds, over CDP with no `runOnly` filter. The extension's build number is not the engine version. One run through the 4.131.2 UI is still worth doing to satisfy the protocol literally; expect agreement |
| **WAVE Evaluation Tool 3.3.1.0** | ✅ **Done** | Real engine via `wave.webaim.org/report#/<url>` against the public URL |
| **Zoom 400% and 320 × 256 px** | ✅ **Done** | `320×256 @ deviceScaleFactor 4`. **dsf 1 is a small screen, not a zoomed one** |
| **Operated via the keyboard** | ✅ **Done** | Driven with real `Input.dispatchKeyEvent` |
| **NVDA 2026.1.1.55980** | ❌ **Not done** | The one real gap — §5 |
| **PAC 26.1.0.0** | ⚪ **Not applicable — for now** | PAC checks PDF/UA-1 (ISO 14289-1). The four linked PDFs are **placeholders that exist to demonstrate the download** (§9.5), so there is nothing meaningful to validate. **This flips to required the moment real tariff documents replace them** — clause 10 applies to those, and the placeholders are untagged, so do not assume the real ones will be |

### NVDA vs VoiceOver — a deviation to record

VoiceOver is planned instead of NVDA. Record that as a **deviation**, not a substitution. The two
disagree exactly where this app is interesting: a `<select>` named via `aria-labelledby`, live-region
politeness, and controls built from a visually hidden `<input>` behind a styled `<label>`. NVDA is
normally tested with Firefox or Chrome, VoiceOver with Safari, so the browser differs too. Budget an
NVDA pass before formal sign-off.

---

# 2. Results

## axe-core — 0 violations

Bare `axe.run(document)` plus the default-disabled rules force-enabled (97 rules).
Viewports: 1440×900, 768×1024, 390×844, 320×640, and 320×256 @ dsf 4 (literal 400% zoom).

| Measure | Value |
|---|---|
| Rules executed | 97 |
| Violations | **0** at every viewport |
| `target-size` | **passes 14 nodes**, 0 violations, 0 incomplete |
| JS exceptions | **0** |
| Horizontal scroll | none, at any viewport |

**Both accordion states scanned, not just the default one.** Four of the seven accordions ship
`aria-expanded="true"` ("Emission standard") and three ship collapsed ("Ionity"). Clicking the three
open and re-running at 1440 / 390 / 320×256 @ dsf 4 gives the **same result**: 0 violations in scope,
`target-size` 14 pass, 0 JS exceptions. The only figure that moves is the `hidden-content`
*incomplete* count, 12 → 9 and 16 → 13 — exactly the three panels that stopped being hidden, which is
the detector confirming it noticed the state change rather than scanning the same DOM twice.

> **Force-enabling *every* rule raises the run to 107** — the 97 above plus the AAA and
> best-practice sets. That surfaces exactly two, both outside the A + AA target and both
> present before any of the current markup: `color-contrast-enhanced` (SC 1.4.6, **AAA**)
> and `focus-order-semantics` (an axe best-practice rule that maps to no SC). Neither is a
> finding against this conformance target; do not report them as regressions.

## Accessibility tree

| Measure | Value |
|---|---|
| Nodes (1440×900) | 339 |
| Named interactive / graphic nodes | 29 |
| **Unnamed** | **0** |
| Focusable controls | 15 |

> No unnamed node has ever been exposed here — every inline `<svg>` already carried `aria-hidden="true"` or a name.

## WAVE 3.3.1.0 — real engine, public URL

| Errors | Contrast errors | Alerts | Features | Structure | ARIA |
|---|---|---|---|---|---|
| **0** | **0** | **4** | 29 | 16 | 26 |

Re-run **2026-08-24** against the current build. The run was confirmed to have analysed *this* markup,
not a cached one: the iframe reported 4 tiles, **4 `a.tf-cta[download]`**, 7 accordions and the
`announce(idx)` fix present.

**All four alerts are `link_pdf`** — WAVE's "Link to PDF document", one per tariff CTA. It is a prompt
to confirm the linked document is accessible, not a fault in the page, and it is **new only because
the CTAs became real PDF links**. It points straight at §9.5: the four targets are placeholders and
are untagged. WAVE reached that conclusion independently of the structural read, which is worth
something — two different methods, same finding.

The run was confirmed to have analysed the real page — control count and document title were read
back out of WAVE's iframe, not assumed.

> Nu was also re-run against the current file: **0 errors**, one info-level warning (`the "list" role
> is unnecessary for element "ul"`, kept deliberately for Safari).

## Nu HTML validator — 0 errors

SC 4.1.1 Parsing. Obsolete in WCAG 2.2 but normative under EN 301 549 (clause 9.4.1.1), so it is
checked and kept.

## Contrast

**Nothing to resolve.** No `color-contrast` node entered the incomplete bucket at any viewport. axe computed a ratio for every text node and none failed.

## Orientation and text spacing

**SC 1.3.4 Orientation — pass.** No `@media (orientation:)` rule exists anywhere in the app.

**SC 1.4.12 Text Spacing — pass.** With all four overrides applied (`line-height:1.5`,
`letter-spacing:0.12em`, `word-spacing:0.16em`, `p margin-bottom:2em`) at 1440 / 390 / 320:
**no newly clipped element, no control lost, no horizontal scroll.**

> **Detector validated.** A canary that fits at the default line-height and overflows only at 1.5
> was injected and *was* detected. A first canary was already clipped before the override and
> therefore proved nothing — "no new clipping" is worthless unless you have watched the detector fire.

---

# 3. Validate the harness before trusting a zero

Every axe detector was re-run against the page with that defect injected:

| Injected defect | Rule | Fired |
|---|---|---|
| `<button>` with no accessible name | `button-name` | ✅ |
| `<img>` with no `alt` | `image-alt` | ✅ |
| Text at ~1.2:1 | `color-contrast` | ✅ |
| Two elements sharing an `id` | `duplicate-id` | ✅ |
| `<input>` with no label | `label` | ✅ |
| `<a href>` with no text | `link-name` | ✅ |
| Two adjacent 12×12 buttons | `target-size` | ✅ |

**`target-size` first appeared to miss, and that was the harness's fault.** The canaries had been
injected at `position:fixed; top:0; left:0` — underneath the sticky topbar, so axe treated them as
obscured — and only `violations` was read. In normal flow the rule fires on both nodes. Traps 1 and 2.

---

# 4. Ten traps that produce a confident false pass

**1 · Bare `axe.run()` is not every rule.** Nine rules are `enabled:false` by default in axe-core
4.13.0: **`target-size`** (SC 2.5.8), `aria-roledescription`, `color-contrast-enhanced`,
`duplicate-id`, `duplicate-id-active`, `identical-links-same-purpose`,
`landmark-complementary-is-top-level`, `meta-refresh-no-exceptions`, `audio-caption`. A stock run
reports "0 violations" **without ever having tested target size**. Pass
`{rules:{'target-size':{enabled:true}, …}}` and confirm the rule appears in `passes`. Check
`axe._audit.rules.filter(r => !r.enabled)` before believing a rule ran.

**2 · `violations` is not the whole result.** `incomplete` is the "needs review" bucket a BITV or
EN 301 549 tester must resolve by hand. It is also where an *obscured* element lands — so a
genuinely undersized target can be missing from `violations` because axe could not decide, not
because it passed.

**3 · `runOnly: {type:'tag'}` is not "all rules".** A tag filter silently skips every rule without
one of those tags.

**4 · 400% zoom is `deviceScaleFactor: 4`.** `320×256 @ dsf 1` is a small screen — a different test,
and not the one 1.4.4 asks for.

**5 · WAVE reads stale counts.** Poll until the icon counts go **stable**, not until
`wave.report.iconlist` merely exists. Reading early returns the *previous* page's numbers. Also
`iconlist.error` is `{description, count, items}`, not a map — summing it as a map yields a false
all-zero clean pass.

**6 · `Page.captureScreenshot` clip is document-absolute.** `getBoundingClientRect()` is
viewport-relative. Mixing them photographs a blank region: the element scores exactly `1.00:1` with
one unique colour. **A ratio of exactly 1.00 means the clip missed, not that contrast failed.**

**7 · Anti-aliasing is not the background, and neither is a border.** Taking the *worst* minority
colour in a text crop reports white-on-dark text as a failure — it has found the element's own
border. Crop to the **glyph band** (union of `Range.getClientRects()`), or the padding box for a
`<select>`, and use the **dominant** background.

**8 · A `<select>`'s options are not its label.** Comparing concatenated `<option>` text against the
accessible name manufactures SC 2.5.3 failures that do not exist. Compare the associated `<label>`.

**9 · `Network.setCacheDisabled` is a no-op unless `Network.enable` was called first.** Re-auditing
after an edit then silently re-measures the *old* page and reports the defect as unfixed. Enable the
domain, or append a cache-busting query string.

**10 · axe is blind to unnamed inline SVGs.** `svg-img-alt` and `role-img-alt` return
**`inapplicable`** for an `<svg>` with no `role`, and `image-alt` only inspects `<img>`. A page can
expose any number of unnamed graphics and still score 0 violations. **Read `role=image` nodes off
the AX tree and assert 0 unnamed** — that is how every unnamed-graphic failure in this suite was
found, and neither axe nor WAVE nor Nu saw any of them.

---

# 5. What automation will never close

**Real screen-reader output has never been tested.** The accessibility tree confirms what is
*exposed*; NVDA, JAWS and VoiceOver differ in what they *announce*. No headless pass closes this.

**A name can be present, unique, and wrong.** Every automated check here passes on a control
labelled "button". Names must be read against what they describe.

**SC 2.5.3 Label in Name has no axe rule.** It was checked by hand — see `a11y-1-criteria.md`.

---

# 6. Manual testing — what to do

**None of these three has been run against the current build — see §9.** This section is the
reproducible procedure; §7 is how you grade it.

**Actions only, in the order you perform them. Do not judge anything as you go** — write down what
happened and grade it against **§7** afterwards. Judging in the moment is how "it seemed fine"
becomes evidence.

## Step 0 — before any tool, every single run

1. Decide **live or local**, and be deliberate:
   - **Live** — `https://yikcunchung.github.io/vw-tariff-prototype/`. Use this if the evidence must
     describe what ships. **Verify it is current first:**
     `curl -s <url> | grep -c 'tf-cta-ico'` → expect **6**. A **0** means you are looking at the
     build from before the PDF-download CTA landed. Pages lags a merge by 1–3 min.
   - **Local** — `python3 -m http.server 7820` → `http://127.0.0.1:7820/tariffs/index.html`. Hosted
     WAVE cannot reach localhost; the extension can.
2. **Nothing here lazy-builds.** All four tiles, all seven accordions and all four PDF buttons are in
   the served HTML — no `IntersectionObserver` gate, no injected controls. There is no
   scroll-and-wait step and no risk of auditing an empty shell. (The Visualizer needs one; this app
   does not.)
3. **Confirm on screen: four tariff tiles, one PDF Download button per tile, seven accordion headers
   in total** — tile 1 has one, the other three have two each — **and the next arrow.** The
   *previous* arrow is `hidden` at rest by design; it appears only once you have scrolled.
4. **Set the window width deliberately and write it down.** This app changes shape more than its
   siblings: 1 tile visible below 960, 2 at 960, 3 at 1280, 4 at 1600+ — where the carousel stops
   being a carousel and **both** arrows disappear. A carousel finding without a width is unusable.
5. **Write down:** browser + version, OS version, window size, date, live or local.

## Run 1 — VoiceOver (macOS)

Safari first, Chrome as a second opinion. `Cmd+F5` toggles VoiceOver. `VO` = `Ctrl+Option`.
Move `VO+Right` / `VO+Left`, activate `VO+Space`, rotor `VO+U`.

Do Step 0, then — **writing down the spoken words after each action:**

1. `VO+Right` from the top. Note what is said at the legal label: "An offer from Elli AG" and the
   **Imprint** link are the first content in the section, and the label straddles the orange frame.
2. Continue to `#tf-scroller`. Note whether the group's name is spoken — expected *"Charging
   tariffs, scrollable list of 4"* — and whether the reader offers to enter it.
3. `Tab` through the whole page. Note the name **and** role at each stop. There are **16**; write
   the sequence down in order.
4. At each **accordion** header, note the name and whether **expanded / collapsed** is spoken. Press
   `VO+Space`. Note what changes, and whether the new state is announced without focus moving.
5. At each **PDF Download** control, note the full name **and the role**. These are `<a href download>`,
   so expect *"link"*, not *"button"*. Expected names: the visible words followed by the tier —
   *"PDF Download — We Charge Basic"* through *"… Pro"*. **All four must differ.** Press `Enter`
   (not `Space` — links do not activate on `Space`) and confirm a download starts. The targets are
   **placeholder PDFs** (§9.5) — check that the link resolves, and audit nothing inside the file.
6. **The carousel announcement.** With focus inside a tile press `ArrowRight`. Note (a) whether the
   carousel steps, (b) where focus lands, (c) what `#tf-live` says — expected one utterance of the
   form *"We Charge Go, tariff 2 of 4"*. Walk to the last tile, then `ArrowLeft` back.
7. **Count the utterances per step.** One per change, not two. `#tf-live` is `aria-live="polite"`
   and empty at rest.
8. `Tab` to **Show next tariff** and **Show previous tariff**. Note the names, and note what happens
   at each end: the arrow that becomes irrelevant is `hidden`, so it should **leave the tab order
   entirely** rather than sit there as a dead control.
9. `VO+U` → **Form Controls**, arrow the whole list. Then the rotor to **Headings**, then
   **Landmarks**.
10. **The one thing only a reader can settle.** Browse a tile body with `VO+Right` and note whether
    the price, the contract duration and the rate rows read as a coherent sequence — or whether the
    `<dl>` term/definition pairs interleave so you lose which number belongs to which label.

## Run 2 — WAVE 3.3.1.0

⚠️ **The hosted figures in §2 predate the current markup** — they were taken before the PDF-download
CTA, the shared focus ring and the legal-label fix. **This run replaces them; do not carry the old
numbers forward.** Hosted WAVE is valid for this app because nothing lazy-builds.

1. Install the WAVE extension (Chrome or Firefox).
2. Load the page. Do **Step 0**. Click the WAVE toolbar icon. Read **Errors**, **Contrast**,
   **Alerts**, **Features**, **Structure** and **ARIA** — record all six.
3. **The state only the extension can reach.** Turn WAVE off, **expand all seven accordions**, turn
   WAVE on again. Read the six counts a second time.
4. Note the `.sr-only` nodes. WAVE does not treat a 1×1 clip as hidden and may report contrast on
   `#tf-live` or on the `.sr-only` tier suffix inside each button label. That is a **known
   artifact** — both are clipped and never rendered.
5. Record the hosted run too (`wave.webaim.org/report#/<live-url>`) so hosted and extension can be
   compared. Poll until the counts stop moving; reading early returns zeros that look like a pass.

## Run 3 — axe DevTools

1. Install the axe DevTools extension. DevTools → **axe DevTools** tab.
2. **Note the version.** The protocol names **4.131.2**. A newer build is fine — rule sets only
   grow — but **record the deviation** rather than leaving a reader to find the mismatch.
3. Load the page. Do **Step 0**.
4. ⚠️ **Set the standard to WCAG 2.2 AA.** The extension may default to **2.1 AA**, which excludes
   every criterion 2.2 added — including **`target-size`, the SC 2.5.8 rule**. A clean 2.1 result is
   real and says nothing about the six new criteria. This is the single most important step here.
5. In rule settings, **enable the rules that are off by default**, `target-size` above all. If the
   UI will not confirm which rules ran, record that — do not claim 2.5.8 was covered.
6. **Scan all of my page.** Then **expand all seven accordions and scan again.**
7. Run the **Interactive Elements** guided test — **target size is covered under it** in current
   builds, rather than as a separate numbered test.

> **Guided-test zeros are not passes.** The Intelligent Guided Tests are semi-automated and must
> each be launched by hand. An unrun test reports "Runs: 0, Total issues: 0", and the summary rolls
> that up as "Guided Issues: 0" — which reads as a clean sheet to anyone skimming an export.

> **What axe cannot tell you here, at any version:** **SC 2.5.3** — axe-core ships no
> `label-in-name` rule at all — and the **SC 1.4.11 focus-ring decision** recorded in
> `a11y-1-criteria.md`, where the ring is 2.04:1 against the CTA's own hover fill when a control is
> hovered and focused at once. axe's `color-contrast` rule implements SC 1.4.3 text contrast only. A
> clean axe run clears neither.

---

# 7. Verification checklist

Tick only what you observed. **An untested box is not a pass.**

## Run 1 — VoiceOver

- [ ] **Step 2** — `#tf-scroller` is announced as a **group** named *"Charging tariffs, scrollable
      list of 4"* and is reachable by `Tab`. It carries `tabindex="0"` **because its scrollbar is
      visually hidden**; if a reader treats it as inert text, SC 2.1.1 is the criterion at risk.
- [ ] **Step 3 — 16 stops, in this order**, with nothing invisible in between:

      | # | Control | Expected name | Role |
      |---|---|---|---|
      | 1 | `.skip-link` | "Skip to main content" | link |
      | 2 | Imprint | "Imprint" | link |
      | 3 | `#tf-scroller` | "Charging tariffs, scrollable list of 4" | group |
      | 4–14 | 7 × `.tf-acc-btn` | tier-suffixed | button |
      | 4–14 | 4 × `.tf-cta` | tier-suffixed, see below | **link** |
      | 15 | `#tf-prev` | "Show previous tariff" | button |
      | 16 | `#tf-next` | "Show next tariff" | button |

      Stops 4–14 interleave: accordion(s) then the PDF link, tile by tile.

- [ ] **Step 4 — accordion state.** Every `.tf-acc-btn` speaks **expanded** or **collapsed**, and
      toggling re-announces the new state **without moving focus**.
- [ ] **Step 5 — the four PDF buttons are distinguishable:**

      | Tile | Expected accessible name |
      |---|---|
      | 1 | "PDF Download — We Charge Basic" |
      | 2 | "PDF Download — We Charge Go" |
      | 3 | "PDF Download — We Charge Plus" |
      | 4 | "PDF Download — We Charge Pro" |

      The visible words are identical on all four; the tier arrives from an `.sr-only` suffix. This
      is the **SC 2.4.4 / 4.1.2 evidence** — a control list reading "PDF Download" four times is the
      exact failure this pattern exists to prevent. The icon is `alt=""` and must add **nothing**.
- [ ] **Step 5 — the label is appended to, never split.** The visible string must be spoken
      **verbatim and first**, tier after it. Nala's `#nala-wea` failure was a hidden word **spliced
      between** two visible ones; the rule is **append, never splice**. This is the SC 2.5.3 evidence.
- [ ] **Step 6 — arrow keys.** With focus on a control inside a tile, `ArrowRight` / `ArrowLeft` step
      the carousel and focus lands on the **same kind of control in the adjacent tile, on screen**.
      At the first and last tile the arrows fall through to native scrolling instead of dead-ending.
      This behaviour is new and has no coverage beyond the CDP run.
- [ ] **Step 6–7 — one utterance per step.** `#tf-live` says *"We Charge Go, tariff 2 of 4"*
      **once**. Twice means something announces alongside it; silence means it never updated.
- [ ] **Step 8 — the hidden arrow really is gone.** At the first tile `#tf-prev` must be unreachable
      by `Tab` *and* by the rotor; at the last, likewise `#tf-next`. A focusable-but-invisible
      control is an SC 2.4.3 / 4.1.2 problem, and `hidden` is what prevents it.
- [ ] **Step 9 — check the right rotor.** The PDF CTAs are `<a>`, so they appear under **Links**, *not* Form Controls. Expect Links = 2 page links + 4 PDF links = **6**; Form Controls = 7 accordion buttons plus whichever arrow is live. A tester who only opens Form Controls will report the PDF links missing. Headings lists one
      `h1`, four `h2` tile titles and the `h3` accordion headers, no level skipped. Landmarks lists
      a banner and a main. `#tf-dots` is `aria-hidden` and must **not** appear anywhere.
- [ ] **Step 10 — the `<dl>` reads coherently.** Each rate label stays paired with its value. Record
      the actual sequence; this is the SC 1.3.1 / 1.3.2 evidence and no tool can supply it.

## Run 2 — WAVE

- [ ] All six counts recorded for the **default** state, replacing the stale row in §2.
- [ ] All six recorded again for the **all-accordions-expanded** state, with **no new errors**.
- [ ] Hosted and extension runs agree, or the difference is explained.
- [ ] Any `.sr-only` contrast report is dismissed as the known 1×1-clip artifact.
- [ ] Any "Possible heading" alert on the tile price is recorded as **not a defect** — it is a
      calculated value, not a section title.

## Run 3 — axe DevTools

- [ ] The standard selector reads **WCAG 2.2 AA**, not 2.1.
- [ ] `target-size` is confirmed **enabled** and appears in the results.
- [ ] Default state: **0 violations**. All-expanded state: **0 violations**.
- [ ] Extension version recorded, and any deviation from 4.131.2 noted.
- [ ] It is recorded that this run covers **neither** SC 2.5.3 **nor** the 1.4.11 focus-ring decision.

## Recording the result

**Write down the actual utterances and counts, not a pass/fail.** A tick against "announces
correctly" is not evidence a BITV auditor can use; the transcript is.

---

# 8. Re-running the automated suite

```
# 1. serve the build, then drive a real browser over CDP
python3 -m http.server 7810 --bind 127.0.0.1
chrome --headless=new --remote-debugging-port=9345 --disable-gpu
#    pick the debug target by matching type == "page" AND the expected URL.
#    NEVER take the first target from /json — it is often an extension page.

# 2. Network.enable BEFORE Network.setCacheDisabled, or add ?cb=<nonce>
# 3. axe.run(document, {rules:{'target-size':{enabled:true}, ...}})
#    read violations AND incomplete; assert target-size lands in passes
# 4. AX tree: Accessibility.getFullAXTree
#      -> assert 0 role=image nodes that are unnamed and not ignored
#      -> review every duplicate role+name pair
# 5. Real keys: Input.dispatchKeyEvent, assert document.activeElement after each
# 6. Reflow: Emulation.setDeviceMetricsOverride 320x256 @ dsf 4   (= 400% zoom)
# 7. Text spacing: inject the four overrides, diff the clipped-element set,
#    and prove a canary fires before believing the result
# 8. WAVE: wave.webaim.org/report#/<public-url>, poll until counts are STABLE
# 9. Diff local against live first — audit what is actually deployed
```

**Automate the structural half in CI, but do not mistake it for the whole.** A structural-only suite
is exactly what scores clean on a build with a Level A naming failure.

---

# 9. Manual run results

**Nothing in this section has been run against the current build.** The headings below are slots,
not results. The automated evidence in §2 is current as of 2026-08-24; the manual evidence is not.

## 9.1 Screen reader — ✅ VoiceOver / Safari, complete (2026-08-24)

**VoiceOver on Safari, against the live deployment**, freshness-checked before the run
(`grep -c 'tf-cta-ico'` → 6). Captured from the VoiceOver caption panel. **Partial: the naming and
**Complete for VoiceOver on Safari. NVDA is
untouched — §9.4.** One defect was found and fixed; the arrow-key rows were re-confirmed against the
fixed build.

### What was heard

| # | Control | Spoken | Verdict |
|---|---|---|---|
| 5 | `.tf-cta`, tile 1 | **"link, PDF Download — We Charge Basic"** | ✅ role and name both correct |
| 5 | `.tf-cta`, tile 1 (hint) | "You are currently on a link. To click this link, press Control-Option-Space." | ✅ exposed as a link, with an activation hint |
| 6 | `.tf-acc-btn`, tile 2 | **"Emission standard — We Charge Go, expanded, button"** | ✅ name, **state** and role all spoken |
| 12 | `.tf-acc-btn`, tile 4 | **"Emission standard — We Charge Pro, expanded, button"** | ✅ same pattern, different tier |

### Rotor censuses — all four as predicted

| Rotor | Expected | Heard | |
|---|---|---|---|
| Links | 6 | **6** | ✅ |
| Headings | 12 | **12** | ✅ |
| Form Controls | 8 | **8** | ✅ |
| Landmarks | 3 | **3** | ✅ |

The six links were confirmed as *Skip to main content*, *Imprint*, and the four *PDF Download — We
Charge {Basic, Go, Plus, Pro}*.

### What this settles

- **SC 2.5.3 Label in Name — the criterion no tool can test.** "PDF Download — We Charge Basic" is
  the visible string spoken **verbatim and first**, tier appended after it. The pattern the pack
  relies on is **append, never splice**, and by ear it holds. Nala's `#nala-wea` failure was the same
  construct done wrong — a hidden word wedged *between* two visible ones. This one is clean.
- **SC 2.4.4 / 4.1.2 — four identical visible strings, four distinguishable controls.** The Links
  rotor is the exact surface where this would fail: a user jumping by link would meet four entries
  reading "PDF Download" and have to guess. Instead all four carry their tier. **The `.sr-only`
  suffix does the job it was added for.**
- **The `<button>` → `<a href download>` conversion is correctly exposed.** VoiceOver says *link*,
  not *button*, and offers the link activation hint.
- **Form Controls = 8, not 12.** The four PDF CTAs are absent from Form Controls *and* present in
  Links — correct for anchors, and why §7 tells a tester to check the right rotor.
- **Accordion state is announced.** "…, **expanded**, button" — the `aria-expanded` on the button is
  reaching the reader, and the tier suffix works on the accordions exactly as it does on the links.
  Both captures were of an "Emission standard" header, which ships **open**; an "Ionity" header ships
  **closed** and should say *collapsed*.

> **Expect VoiceOver's own cursor, not the orange ring, in any screenshot taken with VO running.** The
> black rounded-rectangle outline in the captures is the VO cursor drawn over the page. When the VO
> cursor is moved with `VO`+arrows, DOM focus does not move, so `:focus-visible` never matches and the
> `#c86c03` ring is legitimately absent. The ring itself was confirmed separately at all 16 stops by
> driving real `Tab` keys — §2. Do not read its absence here as a regression.

### Behaviour observed

| Action | Result | Verdict |
|---|---|---|
| `Enter` on a PDF link | download starts | ✅ the link does its job |
| `Space` on a PDF link | nothing happens | ✅ correct link semantics — `Space` is not a link activator |
| `ArrowRight`, focus on an "Emission standard" accordion | focus moves to **the "Emission standard" accordion of the next tile** | ✅ the peer-matching is working as designed |
| `VO+Space` on an "Ionity" header | says **collapsed**, and focus stays on the header | ✅ both states reach the reader; toggling does not move focus |
| `ArrowRight` at 4-tiles-visible width | **nothing announced**, then the *wrong tariff* announced | ❌ **defect — found by this run, now fixed.** See below |

**On that last row — this is the behaviour the handler was written for, not a coincidence.** Arrow keys
step the carousel *and* carry focus to the **matching control in the adjacent tile**: same class, same
index within that class. Stepping alone would have stranded focus on a control that had just scrolled
out of the porthole, which is an SC 2.4.11 problem. Landing on the next tile's *equivalent* control is
the whole point. Tile 1 has one accordion and the others have two, so the index is clamped rather than
assumed.

### The defect this run found

**The live region announced a tariff the user was not on.** `#tf-live` derived its index from
`sc.scrollLeft` — the **leftmost visible** tile — which is only the focused tile when a single tile
fits. Measured before the fix:

| Width | Focus landed on | `#tf-live` said |
|---|---|---|
| 1440 | Pro | "We Charge **Go**, tariff 2 of 4" |
| 960 | Plus | "We Charge **Go**, tariff 2 of 4" |
| 960 | Pro | "We Charge **Plus**, tariff 3 of 4" |
| 390 | Go / Plus / Pro | correct — one tile fits, so leftmost *is* focused |

At 1440 the first two presses announced **nothing at all**, because all four tiles already fit and
`scrollLeft` never moved, so no `scroll` event fired and `sync()` never ran.

**Why this was invisible to every automated pass.** The region was never empty, never unlabelled and
never mis-wired; it faithfully announced a *real* tile index. Only a human moving focus and listening
could notice it was the **wrong** one. Announcing a tariff you are not on is worse than silence.

**Fix.** A single `announce(idx)` writer now owns the region, and the index is **the tile focus is in**,
falling back to the leftmost visible tile when focus is outside the carousel — which is still right for
the prev/next buttons. The arrow-key handler calls it directly, so it speaks even when nothing scrolls.
The dots keep using the scroll-derived index; a position indicator *should* mirror scroll. Verified at
1440 / 1280 / 960 / 390: the announcement matches the focused tile at every width.

**This is the single strongest argument in the pack for manual testing.** It was introduced by the
arrow-key feature, shipped past a clean axe run at 107 rules, a clean AX tree and 16 verified tab
stops, and was caught by one person pressing an arrow key and listening.

Three things, all narrow:

### The rate rows — reported as "not glued", and that is correct behaviour

The tester reported that the rate labels and their values are "not glued / connected" and that the
rows are not focusable. **Both observations are accurate, and neither is a defect.** The rows are
`<dt>`/`<dd>`, not controls: they are correctly outside the Tab order and are reached with the virtual
cursor. A reader speaks a term and its definition as two utterances — that is simply how a description
list is read.

**The relationship is programmatically determined**, which is what SC 1.3.1 actually requires. The
exposed subtree, read off the live page:

```
DescriptionList
  term "AC"                                          definition "£0.52 / kWh"
  term "Blocking Fee from 210 min. (08:00 - 23:00)"  definition "£0.07 / min"
  term "DC"                                          definition "£0.69 / kWh"
  term "Blocking Fee from 90 min."                   definition "£0.14 / min"
  term "Transaction fee"                             definition "-"
```

Five `term` / `definition` pairs, correctly ordered and paired. **SC 1.3.1 and 1.3.2 pass.** The rate
note inside each `<dt>` is also spaced correctly in the accessible text ("Blocking Fee from 210 min.",
not "Blocking Feefrom") — the run-together string in the raw `textContent` is a `textContent`
artifact, not what a reader gets.

**One nuance recorded, not fixed.** The AC block and the DC block are separated only by visual spacing
(`.tf-rrow--grp`); there is no role or ARIA grouping on the rows. Sequential reading carries the
association — AC, then AC's blocking fee, then DC, then DC's — so the information *is* available in
text and the criterion holds. But a user who jumps into the middle of the list meets "Blocking Fee
from 90 min., £0.14 / min" with nothing saying *DC*. The two blocking-fee terms are at least
distinguishable from each other by their notes. Worth knowing before anyone reorders these rows:
**the grouping lives in the reading order, so the order is load-bearing.**

Also worth knowing: **only the Pro tile has rate rows.** The page holds exactly one `<dl>`, 5 pairs;
the other three tiles carry a description sentence instead.

**NVDA remains untouched** — §9.4. VoiceOver on Safari is a **deviation recorded, not a substitute**.

## 9.2 WAVE — ✅ complete (hosted + extension, both accordion states), 2026-08-24

**Hosted run, real engine, against the live URL**, polled until the icon counts went *stable* — reading
early returns zeros that look like a clean pass.

| Errors | Contrast | Alerts | Features | Structure | ARIA |
|---|---|---|---|---|---|
| **0** | **0** | **4** | 29 | 16 | 26 |

Verified to have analysed the current build, not a cache: 4 tiles, 4 `a.tf-cta[download]`, 7
accordions, `announce(idx)` present.

**The 4 alerts are all `link_pdf`**, one per tariff CTA — "Link to PDF document". Expected, and new
only because the CTAs became real links. Not a page fault; it is WAVE asking whether the *document* is
accessible, which §9.5 answers: placeholders, untagged. **A second engine reaching the same conclusion
as the structural read is worth recording** — the two methods agree.

The breakdown corroborates the accessibility-tree figures line for line: `h1 x1, h2 x4, h3 x7` (the 12
headings), `dl x1` (only the Pro tile has rate rows), `aria_expanded x7` (the 7 accordions),
`aria_live_region x1` (`#tf-live`), `lang x1`, `alt_null x25` (the decorative images).

### Extension run — default state, 2026-08-24

Run with the browser extension against the live page, **"Ionity" accordions collapsed** (the shipped
default: 4 of 7 expanded).

| Errors | Contrast | Alerts | Features | Structure | ARIA |
|---|---|---|---|---|---|
| **0** | **0** | **4** | 29 | 16 | 26 |

**Identical to the hosted run, figure for figure.** That closes the §7 checkbox asking whether hosted
and extension agree — they do, so neither result rests on a quirk of how WAVE was invoked.

### Extension run — all seven accordions expanded, 2026-08-24

The state hosted WAVE cannot reach, and the reason the extension run exists at all.

| Errors | Contrast | Alerts | Features | Structure | ARIA |
|---|---|---|---|---|---|
| **0** | **0** | **4** | 29 | 16 | 26 |

**Identical again.** Opening the three "Ionity" panels reveals prose, which adds no WAVE icon of any
kind, so the counts holding is the correct result rather than a suspicious one. axe agrees — run in
both states it returns the same verdict, with only the `hidden-content` incomplete count moving as the
three panels stop being hidden (§2).

**Run 2 is complete:** two engines, two invocation methods, two content states, and the same six
numbers every time.

## 9.3 axe DevTools — ◐ UI run done 2026-08-24 (Pro); 3 findings on the out-of-scope topbar, 1 guided test still owed

Run through the **axe DevTools Pro** extension UI against the live URL. Settings recorded, because
they determine whether the number means anything: **WCAG 2.2 AA**, **Best Practices ON**,
**Experimental OFF**.

| Bucket | Count |
|---|---|
| **Automatic Issues (axe-core)** | **0** |
| Automatic Issues (**advanced**, Pro-only) | 2 |
| Guided Issues | 1 |
| Manual Issues | 0 |
| **Total** | **3** — all Critical |
| Ignored (excluded from total) | 0 |

### The number that matters: axe-core = 0

**The open-source engine agrees with the CDP run exactly.** That is the comparison this section
existed to make, and it holds. The 3 findings come from rules that are **not in open-source axe-core
at all** — Pro's "advanced" set plus a guided test — so no headless harness could have produced them,
and their absence from §2 is not a harness failure.

### The 3 findings

| Rule | Count | Where |
|---|---|---|
| Informative images must have accessible names | 2 | topbar icons |
| Function cannot be performed by keyboard alone | 1 | topbar |

All three are against the **topbar, which is out of scope** — see §0 and `a11y-1`. They are the
predictable consequence of inert `<div>`s wrapping `alt=""` icons: Pro judges an icon-only graphic in
a navigation bar to be informative rather than decorative, and flags a control-looking element that no
keyboard can reach. **Both judgements are correct about the markup.** The reason they are not fixed is
that the topbar is not implemented at all, not that the findings are wrong.

> ⚠️ **Still to capture: the per-node selectors.** The attribution above is the tester's, taken from
> the panel. Expanding each issue gives the element, and that list belongs here — if any node resolves
> inside `#tf-main` it is a real in-scope finding and this verdict changes.

### Intelligent Guided Tests — 2 of 5 run

| Guided test | Runs | Issues | Reading |
|---|---|---|---|
| **Interactive Elements** | **1** | **0** | ✅ **This is where target size lives** in current builds. Run, clean — **SC 2.5.8 is covered by the UI**, independently of the CDP run's 14-node pass |
| **Keyboard** | **1** | **1** | The "Function cannot be performed by keyboard alone" finding — the topbar |
| Table | 0 | 0 | **Not run.** Also **not applicable**: the page contains **0 `<table>`** elements |
| Modal Dialog | 0 | 0 | **Not run.** Also **not applicable**: 0 `<dialog>`, 0 `role="dialog"`, 0 `aria-modal` |
| Structure | 0 | 0 | **Not run — and it does apply.** 12 headings, a `<ul>`, a `<dl>`, a banner and a main. **This is the gap in Run 3** |

> **This panel is the trap in §4 caught in the act.** Three tests read "Runs: 0, Total issues: 0",
> and the summary rolls them into "Guided Issues: 1" — which looks like four clean tests and one
> finding. It is **two** tests run and three never started. Two of those three are genuinely N/A here,
> verified above by element count rather than assumed. **Structure is neither run nor N/A**, and until
> it is run the guided half of this section is incomplete.

### Structure guided test — run 2026-08-24

Worked through by hand. Steps 1–3 confirmed against the markup independently before answering, rather
than clicked through:

- **The 12 headings are all legitimate headings.** Nothing is marked up as a heading for styling.
- **Nothing is missing.** The only real candidate was the tile price — large, bold, standalone, and
  exactly the shape a tool flags as "possible heading". It is correctly a `<p>`: a heading names a
  *section*, and the price is a **value** whose section is already named by the `h2` above it. As a
  heading it would put "£10.49" in the headings rotor, useless for navigation, and would have to be an
  `h3`, colliding with the accordion level.
- **Heading text includes the `.sr-only` tier suffix** — the tool listed all 12 as "Emission standard —
  We Charge Pro" and so on. Useful corroboration that the suffix reaches the accessible name and that
  all 12 heading names are unique.

- **All 12 headings describe the content that follows them.** The step worth a second look was the
  four `"Emission standard"` headings, which introduce pricing content — a sentence about AC/DC
  standard prices in Basic/Go/Plus, and the rate table itself in Pro. "Emission standard" is the
  product's own term for the standard, non-Ionity tier, and was read as clear by the team that owns
  the copy. Answered **yes**; no finding.

**What is still owed to finish Run 3:** the per-node selectors for the 3 findings. Nothing else.

### Two deviations from the protocol, recorded

1. **Engine version.** The extension shipped **axe-core 4.12.1**; the CDP runs in §2 used **4.13.0**.
   The protocol names extension build **4.131.2** — which is a build number, not an engine version.
   Record all three rather than implying they are the same thing.
2. **`focus-order-semantics` did not appear**, despite Best Practices being ON. The 4.13.0 CDP run
   flags it on `#tf-scroller` ("Element does not have a widget role"). Rule sets move between minor
   versions, so this is a **version difference, not a contradiction** — and it is the one already
   documented as a deliberate disagreement, where SC 2.1.1 wins over a best-practice rule.

`color-contrast-enhanced` correctly **did not** appear: it is AAA, and the standard was set to 2.2 AA.
That is the expectation in the previous revision of this section holding exactly.

## 9.4 NVDA — ❌ not done

**NVDA 2026.1.1.55980** is named by the protocol and has not been run; it needs Windows. VoiceOver
is planned instead and is a **documented deviation, not a substitute** — a formal BITV / EN 301 549
audit naming NVDA will not accept VoiceOver evidence for that line item. §1 has the reasoning.

## 9.5 The four linked PDFs — placeholders, deliberately not assessed

The tile CTAs link four PDFs in `assets/`. **These are placeholders, present so the download button
can be demonstrated end to end** — they are not the tariff documents this app would ship. They were
read structurally (PDF 1.7, 2–3 pages each) and are **untagged, carry no `/Lang`, and all four share
the title "Ladebedingungen"**. That is recorded for completeness, not raised as a defect: nothing is
claimed about these files and no verdict in `a11y-1` depends on them.

**What this means for a real build.** The moment genuine tariff documents replace them, they become a
conformance surface under **EN 301 549 clause 10**, each needs a **PAC 26.1.0.0** pass, and tagging
plus `/Lang` plus a document title that identifies the tariff stop being optional. Until then the
only thing verified here is that **the link resolves and the download starts.**

---

# 10. The claim this evidence supports

> *"This app meets WCAG 2.2 A/AA on **every check the protocol names except NVDA and the axe DevTools
> UI** — axe-core 4.13.0 over CDP with every rule force-enabled, across five viewports and **both
> accordion states**; WAVE 3.3.1.0 hosted **and** by extension, in both states; the accessibility tree;
> real key and pointer events; the Nu validator; literal 400% zoom; and a **VoiceOver pass on Safari**
> — all against the live deployment, with **one discretionary decision recorded**, **one defect found
> by the VoiceOver pass and fixed**, and **NVDA still outstanding**."*

**What it must not say: "fully compliant."** Three specific reasons, not hedging:

1. **Only one screen reader, on one browser, and not the one the protocol names.** VoiceOver on
   Safari passed (§9.1) — including SC 2.5.3, which no tool can test. But **NVDA 2026.1.1.55980 is
   named by the protocol and has not been run**, and readers differ in what they announce. VoiceOver
   is a **deviation recorded, not a substitute**.
2. **The axe DevTools UI pass has not been made.** The protocol names build **4.131.2**; what has run
   is **axe-core 4.13.0**, the library that build embeds, driven over CDP (§9.3). Expect agreement —
   but a build number is not an engine version, and the protocol names the build.
3. **One decision rests on a reading an auditor may reject** — the SC 1.4.11 focus ring at 2.04:1
   against the CTA's hover fill. It is written down in `a11y-1-criteria.md` rather than smoothed over.

**The precedent for that wording** is nala's and the Visualizer's packs, which claim *"every check
the protocol names except NVDA"* and *"every automated and runtime check available … pending
screen-reader verification"* respectively. Quote that shape rather than inventing a stronger one. On
nala, the one defect that shipped was passed by axe, WAVE and Nu alike. **Tool-clean is not
compliant.**
