# Run 1 — VoiceOver worksheet (a11y-2 §6 / §7)

Untracked working file. Fill the **"what VO actually said"** column while listening, then transfer
the findings into `a11y-2-automated-testing.md` §9.1. Delete this file afterwards, or commit it if
the transcript is worth keeping.

**Every "expected" value below was read from the accessibility tree of the live page**, at 1440×900,
by driving real `Tab` keys — not from the source, and not guessed. Source:
`https://yikcunchung.github.io/vw-tariff-prototype/`

> **Expected ≠ what you will hear.** These are the name, role and state VoiceOver is *given*. How it
> phrases them, in what order, and what it adds or swallows is the whole point of this run. A
> mismatch is a finding; so is a match that sounds wrong.

---

## Step 0 — fill this in first

| | |
|---|---|
| Date | |
| Live or local | live — `https://yikcunchung.github.io/vw-tariff-prototype/` |
| Freshness check | `curl -s <url> \| grep -c 'tf-cta-ico'` → expect **6**, got ___ |
| Browser + version | Safari ___ (then Chrome ___ as second opinion) |
| macOS version | |
| Window size | |

---

## The 16 Tab stops, in order

`VO` = `Ctrl+Option`. Tab through; do not judge as you go, just write.

| # | Expected role | Expected name | State | What VO actually said |
|---|---|---|---|---|
| 1 | link | Skip to main content | | |
| 2 | link | Imprint | | |
| 3 | **group** | Charging tariffs, scrollable list of 4 | | |
| 4 | button | Emission standard — We Charge Basic | **expanded** | |
| 5 | **link** | PDF Download — We Charge Basic | → `we_charge_free.pdf` | |
| 6 | button | Emission standard — We Charge Go | **expanded** | |
| 7 | button | Ionity — We Charge Go | **collapsed** | |
| 8 | **link** | PDF Download — We Charge Go | → `we_charge_free_ionity_1.pdf` | |
| 9 | button | Emission standard — We Charge Plus | **expanded** | |
| 10 | button | Ionity — We Charge Plus | **collapsed** | |
| 11 | **link** | PDF Download — We Charge Plus | → `we_charge_free_ionity_2.pdf` | |
| 12 | button | Emission standard — We Charge Pro | **expanded** | |
| 13 | button | Ionity — We Charge Pro | **collapsed** | |
| 14 | **link** | PDF Download — We Charge Pro | → `we_charge_plus.pdf` | |
| 15 | button | Show previous tariff | appears only after scrolling | |
| 16 | button | Show next tariff | | |

Three things to listen for specifically:

- **Stops 5 / 8 / 11 / 14 are `link`, not `button`.** If VO says "button", the element changed.
- **The "Emission standard" accordions ship open, "Ionity" ship closed.** Expect *expanded* on the
  first and *collapsed* on the second within each tile.
- **Stop 15 is not there at rest.** `#tf-prev` is `hidden` until the carousel has scrolled. Reaching
  it at stop 15 is correct *because* stops 4–14 scrolled the track. If you hear it before you have
  scrolled, that is a defect.

---

## Rotor censuses — `VO+U`

| Rotor | Expected | Actual |
|---|---|---|
| **Links** | **6** — Skip to main content, Imprint, + the 4 PDF Downloads | |
| **Form Controls** | **8 at rest** (7 accordions + *Show next tariff*); **9 once scrolled**, when *Show previous tariff* unhides | |
| **Headings** | **12** — 1 × h1 "Simply charge – with We Charge", 4 × h2 tile titles, 7 × h3 accordion labels. No level skipped | |
| **Landmarks** | **3** — banner (unnamed), main (unnamed), region "Simply charge – with We Charge" | |

> **Check the Links rotor, not just Form Controls.** The four PDF CTAs are `<a>`, so they do **not**
> appear under Form Controls. A tester who only opens Form Controls will wrongly report them missing.

---

## Behaviour

| Action | Expected | What actually happened |
|---|---|---|
| `Enter` on a PDF link | download starts (placeholder PDF, 2–3 pages) | |
| `Space` on a PDF link | **nothing** — links do not activate on Space. Correct, not a defect | |
| `VO+Space` on an accordion | state flips and is re-announced, **focus does not move** | |
| `ArrowRight`, focus inside a tile | carousel steps; focus lands on the **same control in the next tile**, on screen | |
| `ArrowLeft` back | steps the other way | |
| Either arrow at first / last tile | falls through to native scrolling, does not dead-end | |
| After each arrow step | `#tf-live` speaks **once**: "We Charge Go, tariff 2 of 4" | |

---

## The two judgement calls only a listener can settle

1. **The `.sr-only` tier suffix.** All four PDF links show the same visible words, "PDF Download",
   and are disambiguated only by hidden text. Record whether *"PDF Download — We Charge Basic"* reads
   naturally or sounds like two glued fragments. The rule the pack relies on is **append, never
   splice** — the visible words must come first and whole. This is the SC 2.5.3 evidence.
2. **The `<dl>` rate rows.** Browse a tile body with `VO+Right` and note whether each rate label
   stays paired with its number, or whether the term/definition pairs interleave so you lose which
   value belongs to which label. This is the SC 1.3.1 / 1.3.2 evidence and no tool supplies it.

---

## Recording

**Write the actual utterances, not ticks.** A tick against "announces correctly" is not evidence a
BITV auditor can use; the transcript is. Then paste it into `a11y-2` §9.1 and change that heading
from ❌ to what you found.
