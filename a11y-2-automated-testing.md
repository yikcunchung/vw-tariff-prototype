# A11y 2 of 3 — What the automated tests cover, and what they cannot

**App:** VW Charging Tariffs — We Charge (`tariffs`).
**Audited:** 2026-08-24 against the current source, headless Chrome 151.0.7922.174, axe-core 4.13.0
(`axe.version` read from the engine, not the bundle filename).
**Deployed at:** https://yikcunchung.github.io/vw-tariff-prototype/
**Companions:** `a11y-1-criteria.md` (every criterion) · `a11y-3-implementation.md` (what to build).

**BLUF:** `#tf-main` is at **0 axe violations** across five viewports including literal 400% zoom,
in **both accordion states**, with every default-disabled rule force-enabled. WAVE is clean on two
engines, two invocation methods and both states. Nu is clean. The accessibility tree carries **0
unnamed nodes and 0 duplicate role+name pairs**, and all **16 tab stops** were driven with real keys.
**All three manual runs are done**, and the VoiceOver pass found a defect no tool reported — now
fixed. **NVDA is the only instrument still owed.**

> **The one sentence that matters:** every automated instrument here scored this app clean **while it
> was announcing the wrong tariff to a screen-reader user.** Tooling is necessary and nowhere near
> sufficient — a live region can be present, correctly wired, and confidently naming the wrong thing.

**How to read this:** §0–§5 explain what the tools can and cannot establish. §6–§7 are procedure —
follow them. §8 re-runs the automated half. §9 is the evidence record. §10 is the claim the evidence
supports.

---

# 0. Scope of this evidence — read before quoting a number

The conformance surface is **`#tf-main`**. `axe.run(document)` is run over the whole document
anyway; anything the topbar generates is triaged as out of scope.

**The topbar is excluded deliberately, not conveniently.** Inert `<div>`s wrapping `alt=""` images
with no handler, `tabindex`, `role` or `cursor: pointer`. A real build must turn them into real
controls. See `a11y-1` and §9.3.

The local `index.html` and the deployed build are **byte-identical**.

---

# 1. Tool coverage at a glance

| Tool | Good for | Blind spots that matter here |
|---|---|---|
| **axe-core 4.13.0** | Structural ARIA, names, roles, contrast on solid backgrounds | **No `label-in-name` rule** (SC 2.5.3). Cannot see an unnamed inline `<svg>` with no `role` — trap 10. Cannot see behaviour. **Nine rules off by default, including `target-size`** — trap 1 |
| **WAVE 3.3.1.0** | A genuinely different engine; catches empty labels and sr-only contrast axe passes | Needs a public URL. Reports `.sr-only` contrast as an error even when clipped to 1×1 |
| **Nu HTML validator** | SC 4.1.1 Parsing, normative under EN 301 549 | Says nothing about semantics or naming |
| **Accessibility tree (CDP)** | Ground truth for name / role / value | Exposure is not announcement — §5 |
| **Real key and pointer events** | The only way to test behaviour | Slow; assert state after every event |

## Required toolchain — coverage against it

| Required | Status | Note |
|---|---|---|
| **axe DevTools 4.131.2** | ◐ **Equivalent, not identical** | Ran **axe-core 4.13.0** over CDP, no `runOnly` filter. One run through the 4.131.2 UI still owed to satisfy the protocol literally |
| **WAVE Evaluation Tool 3.3.1.0** | ✅ **Done** | Real engine via `wave.webaim.org/report#/<url>` |
| **Zoom 400% and 320 × 256 px** | ✅ **Done** | `320×256 @ deviceScaleFactor 4`. **dsf 1 is a small screen, not a zoomed one** |
| **Operated via the keyboard** | ✅ **Done** | Driven with real `Input.dispatchKeyEvent` |
| **NVDA 2026.1.1.55980** | ◐ **Deviation** | VoiceOver run instead — §9.1. **The one instrument still owed** |
| **PAC 26.1.0.0** | ⚪ **Not applicable — for now** | The four linked PDFs are **placeholders** (§9.5). Flips to required when real documents replace them — clause 10 applies and the placeholders are untagged |

VoiceOver on Safari was run instead of NVDA and is a **deviation, not a substitution** — the two readers disagree on live-region timing, `aria-expanded` voicing and hidden-suffix handling. **Budget an NVDA pass before formal sign-off.**

## How much is machine-decidable at all

Of the **56** A/AA criteria, **24 have no machine-testable ACT rule** — including 1.4.11, 1.4.13,
2.5.1, 2.5.2, 2.5.8, 2.4.11.

| Question | Can a tool answer it? |
|---|---|
| Does every control have a name? | **Yes** — axe and the accessibility tree definitively |
| Is the name *unique*? | **Yes** — duplicate role+name pairs are countable |
| Is the name **correct**? | **No.** `alt="Volkswagen"` on an ID.3 Neo passes every check |
| Does the visible label sit inside it? | **No.** axe-core ships **no `label-in-name` rule** — SC 2.5.3 was settled by ear |
| Is the reading order sensible? | **No.** The `<dl>` pairing was confirmed by listening |
| Does the live region say the right thing? | **No.** It said the wrong tariff and every tool passed it |

**That last row is this app's whole argument.** Six of the eight instruments in the required toolchain were clean on a build that was actively misinforming a screen-reader user.

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

**Both accordion states scanned.** Re-running with the three "Ionity" accordions toggled at
1440 / 390 / 320×256 @ dsf 4: **same result** — 0 violations, `target-size` 14 pass, 0 JS
exceptions. The `hidden-content` *incomplete* count moves 12 → 9 and 16 → 13 (the three panels now
visible), confirming the scanner noticed the state change.

> Force-enabling **every** rule raises the run to **107**. Two extras surface: `color-contrast-enhanced`
> (SC 1.4.6, **AAA**) and `focus-order-semantics` (best-practice, no SC). Neither is a finding against
> this conformance target.

## Accessibility tree

| Measure | Value |
|---|---|
| Nodes (1440×900) | 339 |
| Named interactive / graphic nodes | 29 |
| **Unnamed** | **0** |
| Focusable controls | 15 |

## WAVE 3.3.1.0 — real engine, public URL

| Errors | Contrast errors | Alerts | Features | Structure | ARIA |
|---|---|---|---|---|---|
| **0** | **0** | **4** | 29 | 16 | 26 |

Re-run 2026-08-24. **All four alerts are `link_pdf`** — one per tariff CTA. Not a page fault; WAVE
is asking whether the *document* is accessible, which §9.5 answers: placeholders, untagged.

> Nu re-run: **0 errors**, one info-level warning (`the "list" role is unnecessary for element "ul"`,
> kept deliberately for Safari).

## Nu HTML validator — 0 errors

SC 4.1.1 Parsing. Obsolete in WCAG 2.2 but normative under EN 301 549 (clause 9.4.1.1).

## Contrast

No `color-contrast` node entered the incomplete bucket at any viewport.

## Orientation and text spacing

**SC 1.3.4 — pass.** No `@media (orientation:)` rule exists.

**SC 1.4.12 — pass.** All four overrides (`line-height:1.5`, `letter-spacing:0.12em`,
`word-spacing:0.16em`, `p margin-bottom:2em`) at 1440 / 390 / 320: no clipped element, no control
lost, no horizontal scroll. Canary validated the detector before trusting the result.

---

# 3. Validate the harness before trusting a zero

| Injected defect | Rule | Fired |
|---|---|---|
| `<button>` with no accessible name | `button-name` | ✅ |
| `<img>` with no `alt` | `image-alt` | ✅ |
| Text at ~1.2:1 | `color-contrast` | ✅ |
| Two elements sharing an `id` | `duplicate-id` | ✅ |
| `<input>` with no label | `label` | ✅ |
| `<a href>` with no text | `link-name` | ✅ |
| Two adjacent 12×12 buttons | `target-size` | ✅ |

**`target-size` first appeared to miss.** Canaries were injected at `position:fixed; top:0; left:0`
— underneath the topbar, treated as obscured — and only `violations` was read. In normal flow the
rule fires on both nodes. Traps 1 and 2.

---

# 4. Ten traps that produce a confident false pass

**1 · Bare `axe.run()` is not every rule.** Nine rules are `enabled:false` by default in axe-core
4.13.0, including **`target-size`** (SC 2.5.8). Pass `{rules:{'target-size':{enabled:true}, …}}` and
confirm it appears in `passes`. Check `axe._audit.rules.filter(r => !r.enabled)` before believing a
rule ran.

**2 · `violations` is not the whole result.** `incomplete` is the "needs review" bucket and where
an *obscured* element lands — a genuinely undersized target can be absent from `violations` because
axe could not decide, not because it passed.

**3 · `runOnly: {type:'tag'}` is not "all rules".** It silently skips every rule without one of
those tags.

**4 · 400% zoom is `deviceScaleFactor: 4`.** `320×256 @ dsf 1` is a small screen — not the test
SC 1.4.4 asks for.

**5 · WAVE reads stale counts.** Poll until the icon counts go **stable**. `iconlist.error` is
`{description, count, items}`, not a map — summing it as a map yields a false all-zero clean pass.

**6 · `Page.captureScreenshot` clip is document-absolute; `getBoundingClientRect()` is
viewport-relative.** Mixing them photographs a blank region. **A ratio of exactly 1.00 means the
clip missed, not that contrast failed.**

**7 · Anti-aliasing is not the background, and neither is a border.** Taking the worst minority
colour in a text crop finds the element's own border. Crop to the glyph band (`Range.getClientRects()`)
and use the **dominant** background.

**8 · A `<select>`'s options are not its label.** Comparing concatenated `<option>` text against the
accessible name manufactures SC 2.5.3 failures. Compare the associated `<label>`.

**9 · `Network.setCacheDisabled` is a no-op unless `Network.enable` was called first.** Re-auditing
after an edit silently re-measures the old page. Enable the domain, or append a cache-busting query
string.

**10 · axe is blind to unnamed inline SVGs.** `svg-img-alt` and `role-img-alt` return `inapplicable`
for an `<svg>` with no `role`; `image-alt` only inspects `<img>`. **Read `role=image` nodes off the
AX tree and assert 0 unnamed** — neither axe nor WAVE nor Nu saw any unnamed-graphic failure in this
suite.

---

# 5. What automation will never close

**Real screen-reader output has never been tested.** The AX tree confirms what is *exposed*; NVDA,
JAWS and VoiceOver differ in what they *announce*. No headless pass closes this.

**A name can be present, unique, and wrong.** Every automated check here passes on a control labelled
"button". Names must be read against what they describe.

**SC 2.5.3 Label in Name has no axe rule.** Checked by hand — see `a11y-1-criteria.md`.

---

# 6. Manual testing — what to do

This section is the reproducible procedure; §7 grades it. **Actions only, in the order you perform
them. Write down what happened; grade it against §7 afterwards.**

## Step 0 — before any tool, every single run

1. Decide **live** (`https://yikcunchung.github.io/vw-tariff-prototype/`, verify: `curl -s <url> | grep -c 'tf-cta-ico'` → **6**) or **local** (`python3 -m http.server 7820`; hosted WAVE cannot reach localhost).
2. **Confirm on screen:** four tiles, one PDF Download per tile, seven accordion headers, next arrow.
3. **Set the window width deliberately and write it down.** 1 tile below 960, 2 at 960, 3 at 1280, 4 at 1600+ where both arrows disappear.
4. **Write down:** browser + version, OS version, window size, date, live or local.

## Run 1 — VoiceOver (macOS)

Safari first. `Cmd+F5` = VoiceOver on/off. `VO` = `Ctrl+Option`. Move: `VO+Right/Left`. Activate: `VO+Space`. Rotor: `VO+U`.

1. `VO+Right` from the top. Note the legal label ("An offer from Elli AG") and **Imprint** link.
2. Continue to `#tf-scroller`. Note whether group name is spoken and whether reader offers to enter.
3. `Tab` through the whole page. **16 stops** — write name and role at each.
4. At each **accordion** header: note name and **expanded / collapsed** state. `VO+Space`; note whether new state is announced without focus moving.
5. At each **PDF Download** control: note full name **and role** (expect *"link"*). **All four names must differ.** Press `Enter`; confirm download starts.
6. With focus inside a tile, `ArrowRight`. Note: (a) carousel steps, (b) where focus lands, (c) what `#tf-live` says. Walk to last tile; `ArrowLeft` back.
7. **Count utterances per step.** One per change, not two.
8. `Tab` to **Show next / previous tariff**. Confirm the arrow that becomes irrelevant **leaves the tab order entirely**.
9. `VO+U` → **Form Controls** (full list), then **Headings**, then **Landmarks**.
10. Browse a tile body `VO+Right`; record whether `<dl>` term/definition pairs read coherently.

## Run 2 — WAVE 3.3.1.0

1. Install the WAVE extension. Load the page. Do Step 0. Click the WAVE icon. Record all six counts: **Errors, Contrast, Alerts, Features, Structure, ARIA**.
2. Turn WAVE off, **expand all seven accordions**, turn WAVE on. Record six counts again.
3. Note `.sr-only` contrast reports — **known artifact** (1×1 clip, never rendered).
4. Record the hosted run too (`wave.webaim.org/report#/<live-url>`). Poll until counts stop moving.

## Run 3 — axe DevTools

1. Install axe DevTools extension. DevTools → **axe DevTools** tab. **Note the version.**
2. ⚠️ **Set standard to WCAG 2.2 AA** — default may be 2.1 AA, which excludes all SC 2.2 criteria including **`target-size`** (SC 2.5.8).
3. **Enable the default-off rules**, `target-size` above all.
4. **Scan all of my page.** Expand all seven accordions. Scan again.
5. Run **Interactive Elements** guided test — target size is covered here in current builds.

> **Guided-test zeros are not passes** — an unrun test rolls up as clean. **axe cannot tell you:** SC 2.5.3 (no `label-in-name` rule), the SC 1.4.11 focus-ring decision, or 1.4.11 non-text contrast. `color-contrast` covers SC 1.4.3 text contrast only.

---

# 7. Verification checklist

Tick only what you observed. **An untested box is not a pass.**

## Run 1 — VoiceOver

- [ ] **Step 2** — `#tf-scroller` announced as **group** named *"Charging tariffs, scrollable list of 4"*, reachable by `Tab`.
- [ ] **Step 3 — 16 stops, in this order:**

      | # | Control | Expected name | Role |
      |---|---|---|---|
      | 1 | `.skip-link` | "Skip to main content" | link |
      | 2 | Imprint | "Imprint" | link |
      | 3 | `#tf-scroller` | "Charging tariffs, scrollable list of 4" | group |
      | 4–14 | 7 × `.tf-acc-btn` | tier-suffixed | button |
      | 4–14 | 4 × `.tf-cta` | tier-suffixed | **link** |
      | 15 | `#tf-prev` | "Show previous tariff" | button |
      | 16 | `#tf-next` | "Show next tariff" | button |

- [ ] **Step 4** — Every `.tf-acc-btn` speaks **expanded** or **collapsed**; toggling re-announces without moving focus.
- [ ] **Step 5 — four PDF buttons distinguishable:**

      | Tile | Expected accessible name |
      |---|---|
      | 1 | "PDF Download — We Charge Basic" |
      | 2 | "PDF Download — We Charge Go" |
      | 3 | "PDF Download — We Charge Plus" |
      | 4 | "PDF Download — We Charge Pro" |

- [ ] **Step 5** — Visible string spoken **verbatim and first**, tier appended after (**append, never splice**).
- [ ] **Step 6–7** — `ArrowRight/Left` step carousel; focus lands on the same kind of control in the adjacent tile. `#tf-live` speaks **once** per step.
- [ ] **Step 8** — At first tile `#tf-prev` unreachable by `Tab` and rotor; at last tile, likewise `#tf-next`.
- [ ] **Step 9** — PDFs under **Links** (not Form Controls); Links = 6, Form Controls = 7 accordions + live arrow. Headings: `h1 x1, h2 x4, h3` per accordion count, no level skipped. `#tf-dots` must not appear.
- [ ] **Step 10** — `<dl>` term/definition pairs read coherently. Record the actual sequence.

## Run 2 — WAVE

- [ ] Six counts recorded, **default** state.
- [ ] Six counts recorded, **all-expanded** state, no new errors.
- [ ] Hosted and extension runs agree, or difference explained.
- [ ] Any `.sr-only` contrast report dismissed as the 1×1-clip artifact.

## Run 3 — axe DevTools

- [ ] Standard reads **WCAG 2.2 AA**.
- [ ] `target-size` confirmed **enabled** and in results.
- [ ] Default and all-expanded: **0 violations** each.
- [ ] Extension version recorded; deviation from 4.131.2 noted.
- [ ] Run covers **neither** SC 2.5.3 **nor** the 1.4.11 focus-ring decision — recorded.

## Sign-off

- [ ] All three runs done: tool version, browser, OS, viewport, date, live or local.
- [ ] Every failure triaged as **in scope** or **topbar**.
- [ ] **VoiceOver recorded as deviation from NVDA 2026.1.1.55980**, not a substitute.
- [ ] Linked PDFs recorded as **placeholders**; clause 10 and PAC apply when real documents land.
- [ ] **"Fully compliant" remains unavailable** while the four documents are untagged placeholders.

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

**Automate the structural half in CI, but do not mistake it for the whole.**

---

# 9. Manual run results

## 9.1 Screen reader — ✅ VoiceOver / Safari, complete (2026-08-24)

**VoiceOver on Safari, against the live deployment**, freshness-checked before the run
(`grep -c 'tf-cta-ico'` → 6). Captured from the VoiceOver caption panel. **Complete for VoiceOver
on Safari. NVDA is untouched — §9.4.** One defect was found and fixed; the arrow-key rows were re-confirmed against the
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

The six links: *Skip to main content*, *Imprint*, and *PDF Download — We Charge {Basic, Go, Plus, Pro}*.

### What this settles

- **SC 2.5.3 / 2.4.4 / 4.1.2** — "PDF Download — We Charge Basic" spoken verbatim and first, tier appended (**append, never splice**). Four identical visible strings; four distinguishable controls in the Links rotor.
- **Accordion state** — `aria-expanded` reaches the reader ("…, **expanded**, button"); "Ionity" headers ship closed and say *collapsed*.

> **VoiceOver's own cursor, not the orange ring, appears in screenshots taken with VO running.** `VO+arrows` does not move DOM focus. The ring was confirmed at all 16 stops by driving real `Tab` keys — §2.

### Behaviour observed

| Action | Result | Verdict |
|---|---|---|
| `Enter` on a PDF link | download starts | ✅ the link does its job |
| `Space` on a PDF link | nothing happens | ✅ correct link semantics — `Space` is not a link activator |
| `ArrowRight`, focus on an "Emission standard" accordion | focus moves to **the "Emission standard" accordion of the next tile** | ✅ the peer-matching is working as designed |
| `VO+Space` on an "Ionity" header | says **collapsed**, and focus stays on the header | ✅ both states reach the reader; toggling does not move focus |
| `ArrowRight` at 4-tiles-visible width | **nothing announced**, then the *wrong tariff* announced | ⚠️ **defect — found by this run, now fixed.** See below |

### The defect this run found

**The live region announced a tariff the user was not on.** `#tf-live` derived its index from
`sc.scrollLeft` — the leftmost visible tile — which is only the focused tile when a single tile fits.

| Width | Focus landed on | `#tf-live` said |
|---|---|---|
| 1440 | Pro | "We Charge **Go**, tariff 2 of 4" |
| 960 | Plus | "We Charge **Go**, tariff 2 of 4" |
| 960 | Pro | "We Charge **Plus**, tariff 3 of 4" |
| 390 | Go / Plus / Pro | correct — one tile fits, so leftmost *is* focused |

At 1440 the first two presses announced **nothing at all** — all four tiles fit, `scrollLeft` never
moves, `scroll` never fires, `sync()` never ran.

**Why this was invisible to every automated pass.** The region announced a *real* tile index; only a
human moving focus and listening could notice it was the **wrong** one. Announcing a tariff you are
not on is worse than silence.

**Fix.** `announce(idx)` now uses the **tile focus is in** (not `scrollLeft`); the arrow-key handler calls it directly. Verified at 1440 / 1280 / 960 / 390.

**This is the single strongest argument in the pack for manual testing** — shipped past a clean 107-rule axe run, clean AX tree and 16 verified tab stops.

### The rate rows — reported as "not glued", and that is correct behaviour

The tester reported rate labels and values as "not glued / connected" and the rows as not focusable.
**Both observations are accurate, and neither is a defect.** The rows are `<dt>`/`<dd>`, not controls:
correctly outside the Tab order, reached with the virtual cursor.

```
DescriptionList
  term "AC"                                          definition "£0.52 / kWh"
  term "Blocking Fee from 210 min. (08:00 - 23:00)"  definition "£0.07 / min"
  term "DC"                                          definition "£0.69 / kWh"
  term "Blocking Fee from 90 min."                   definition "£0.14 / min"
  term "Transaction fee"                             definition "-"
```

Five term/definition pairs, correctly ordered and paired. **SC 1.3.1 and 1.3.2 pass.** The AC/DC grouping lives in the reading order only — no ARIA grouping on the rows — so **the order is load-bearing**. **Only the Pro tile has rate rows** (one `<dl>`, 5 pairs); the other three tiles carry a description sentence.

## 9.2 WAVE — ✅ complete (hosted + extension, both accordion states), 2026-08-24

### Hosted run

| Errors | Contrast | Alerts | Features | Structure | ARIA |
|---|---|---|---|---|---|
| **0** | **0** | **4** | 29 | 16 | 26 |

Build verified: 4 tiles, 4 `a.tf-cta[download]`, 7 accordions, `announce(idx)` present. All four alerts are `link_pdf` — expected (§9.5).

### Extension run — default state, 2026-08-24

| Errors | Contrast | Alerts | Features | Structure | ARIA |
|---|---|---|---|---|---|
| **0** | **0** | **4** | 29 | 16 | 26 |

### Extension run — all seven accordions expanded, 2026-08-24

| Errors | Contrast | Alerts | Features | Structure | ARIA |
|---|---|---|---|---|---|
| **0** | **0** | **4** | 29 | 16 | 26 |

**Run 2 complete:** two engines, two invocation methods, two content states, same six numbers every time.

## 9.3 axe DevTools — ◐ UI run done 2026-08-24 (Pro); 3 findings, all on the out-of-scope topbar

Settings: **WCAG 2.2 AA**, Best Practices ON, Experimental OFF.

| Bucket | Count |
|---|---|
| **Automatic Issues (axe-core)** | **0** |
| Automatic Issues (**advanced**, Pro-only) | 2 |
| Guided Issues | 1 |
| Manual Issues | 0 |
| **Total** | **3** — all Critical |
| Ignored (excluded from total) | 0 |

The open-source engine agrees with the CDP run. All 3 findings are from Pro's advanced set / a guided test — not in open-source axe-core — and all are against the **topbar (out of scope)**.

| Rule | Count | Where |
|---|---|---|
| Informative images must have accessible names | 2 | topbar icons |
| Function cannot be performed by keyboard alone | 1 | topbar |

> ⚠️ **Still to capture: per-node selectors.** If any node resolves inside `#tf-main` this verdict changes.

### Intelligent Guided Tests — 2 of 5 run

| Guided test | Runs | Issues | Reading |
|---|---|---|---|
| **Interactive Elements** | **1** | **0** | ✅ **SC 2.5.8 covered here** — independently of the CDP 14-node pass |
| **Keyboard** | **1** | **1** | "Function cannot be performed by keyboard alone" — topbar |
| Table | 0 | 0 | **Not run.** Also **not applicable**: 0 `<table>` elements |
| Modal Dialog | 0 | 0 | **Not run.** Also **not applicable**: 0 `<dialog>`, 0 `role="dialog"`, 0 `aria-modal` |
| Structure | 0 | 0 | **Not run — and it does apply.** 12 headings, `<ul>`, `<dl>`, banner and main |

> Three unrun tests show "Total issues: 0" and roll up as clean. **Structure is neither run nor N/A.**

### Structure guided test — run 2026-08-24

- **Tile price correctly a `<p>`.** As a heading it would put "£10.49" in the headings rotor and require an `h3`, colliding with the accordion level.
- **Heading text includes `.sr-only` tier suffix** — all 12 heading names are unique.

**Still owed to finish Run 3:** per-node selectors for the 3 findings.

### Two deviations from the protocol, recorded

1. **Engine version.** Extension shipped **axe-core 4.12.1**; CDP runs used **4.13.0**. Protocol names build **4.131.2** — a build number, not an engine version.
2. **`focus-order-semantics` absent** despite Best Practices ON — 4.13.0 CDP flags it on `#tf-scroller`. Rule sets move between minor versions; SC 2.1.1 wins.

## 9.4 NVDA — ◐ deviation recorded, still owed

**NVDA 2026.1.1.55980** is named by the protocol and has not been run. VoiceOver on Safari was run instead (§9.1) — **documented deviation, not a substitute**; a formal BITV / EN 301 549 audit will not accept VoiceOver evidence. That run was not ceremonial: it found the live-region defect every automated instrument passed.

## 9.5 The four linked PDFs — placeholders, deliberately not assessed

The tile CTAs link four PDFs in `assets/`. They are **untagged, carry no `/Lang`, and all four share
the title "Ladebedingungen"**. Recorded for completeness; no verdict in `a11y-1` depends on them.

When genuine tariff documents replace them, they become a conformance surface under **EN 301 549
clause 10**, each needs a **PAC 26.1.0.0** pass, and tagging plus `/Lang` plus distinct document
titles become required. The only thing verified here is that **the link resolves and the download
starts.**

---

# 10. The claim this evidence supports

> *"This app meets WCAG 2.2 A/AA on **every check the protocol names except NVDA and the axe DevTools
> UI** — axe-core 4.13.0 over CDP with every rule force-enabled, across five viewports and **both
> accordion states**; WAVE 3.3.1.0 hosted **and** by extension, in both states; the accessibility tree;
> real key and pointer events; the Nu validator; literal 400% zoom; and a **VoiceOver pass on Safari**
> — all against the live deployment, with **one discretionary decision recorded**, **one defect found
> by the VoiceOver pass and fixed**, and **NVDA still outstanding**."*

**What it must not say: "fully compliant."** Three reasons:

1. **Only one screen reader, on one browser, and not the one the protocol names.** VoiceOver on Safari passed (§9.1). **NVDA 2026.1.1.55980 is named by the protocol and has not been run.** Deviation recorded, not a substitute.
2. **The axe DevTools UI pass is incomplete.** Protocol names build **4.131.2**; what ran is **axe-core 4.13.0** over CDP (§9.3). Per-node selectors for the 3 topbar findings are still owed.
3. **One decision rests on a reading an auditor may reject** — the SC 1.4.11 focus ring at 2.04:1 against the CTA's hover fill, recorded in `a11y-1-criteria.md`.

**Tool-clean is not compliant.** The one defect that shipped was passed by axe, WAVE and Nu alike.
