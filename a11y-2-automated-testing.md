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

This app is a **standalone page**, so `axe.run(document)` covers the whole conformance surface.
There is no component-versus-page split.

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
| **0** | **0** | 0 | 29 | 16 | 26 |

The run was confirmed to have analysed the real page — control count and document title were read
back out of WAVE's iframe, not assumed.

> ⚠️ **This row predates the current markup and has not been re-run.** WAVE needs a public URL,
> and the tile footers, the focus ring and the legal label have changed since. Re-run it against
> the Pages deployment before quoting these numbers. Nu **was** re-run against the current file:
> **0 errors**, one info-level warning (`the "list" role is unnecessary for element "ul"`, kept
> deliberately for Safari).

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

## 9.1 Screen reader — ❌ not done

No screen-reader pass has been recorded for this app — not VoiceOver, not NVDA. §5 is why that
matters: the accessibility tree proves what is *exposed*, never what is *announced*. This app's
whole naming strategy leans on that distinction, so it is the most valuable run of the three.

## 9.2 WAVE — ⚠️ stale, needs re-running

A hosted run exists and is recorded in §2 (**0 errors, 0 contrast errors, 0 alerts, 29 features,
16 structure, 26 ARIA**) — but it predates the PDF-download CTA, the shared focus ring and the
legal-label fix. **Re-run it against the live URL and overwrite that row.** The extension run — the
all-accordions-expanded state, which hosted WAVE cannot reach — has never been done.

## 9.3 axe DevTools — ◐ engine covered, UI not run

axe-core **4.13.0**, the library the 4.131.2 extension embeds, has been run over CDP across five
viewports with every rule force-enabled (107): **0 violations in the A + AA scope**, `target-size`
14 pass / 0 violations. What has *not* happened is a pass through the extension UI at WCAG 2.2 AA.
Expect agreement — run it anyway, because the protocol names the UI build, and the build number is
not the engine version.

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

> *"This app meets WCAG 2.2 A/AA on **every automated check available** — axe-core 4.13.0 over CDP
> with every rule force-enabled, the accessibility tree, real key and pointer events, the Nu
> validator and literal 400% zoom, across five viewports — with **one discretionary decision
> recorded** and **all manual verification still outstanding**."*

**What it must not say: "fully compliant."** Three specific reasons, not hedging:

1. **No screen reader has been run at all.** This app's naming strategy — four identical visible
   "PDF Download" strings disambiguated by an `.sr-only` tier suffix — is exactly the kind of thing
   that is correct in the accessibility tree and can still read badly aloud. It is untested.
2. **The WAVE evidence describes an older build.** A second, independent engine agreeing is a real
   part of the claim; a second engine agreeing about *different markup* is not.
3. **One decision rests on a reading an auditor may reject** — the SC 1.4.11 focus ring at 2.04:1
   against the CTA's hover fill. It is written down in `a11y-1-criteria.md` rather than smoothed over.

**The precedent for that wording** is nala's and the Visualizer's packs, which claim *"every check
the protocol names except NVDA"* and *"every automated and runtime check available … pending
screen-reader verification"* respectively. Quote that shape rather than inventing a stronger one. On
nala, the one defect that shipped was passed by axe, WAVE and Nu alike. **Tool-clean is not
compliant.**
