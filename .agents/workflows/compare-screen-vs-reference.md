---
description: Captures a screenshot of a running screen in the PWA and visually compares it against the reference design image embedded in Requirement.md — evaluates same/better/worse and suggests concrete improvements.
---

# Compare Screen vs Requirement Reference

**CRITICLE: Always take screenshot and analyze image itself rather then relaying on playwrite 
queries**
## Step 1 — Identify which screen to check
Ask the user which screen/view to compare, unless they already named it in their request (e.g. "check the ledger list screen"). Confirm:
- The route/URL of the live screen (e.g. `/ledger`, `/analytics/monthly`).
- The corresponding section in `Requirement.md` that contains the reference image for this screen.

## Step 2 — Locate the reference image
Read `Requirement.md` and find the embedded/linked reference image for this screen (e.g. `![Ledger Screen](./docs/references/ledger.png)` or similar markdown image syntax near the screen's functional description).

If no reference image exists for the requested screen, stop and tell the user — do not guess or compare against an unrelated screen's reference.

## Step 3 — Ensure the app is running
Check if the dev server is already running (e.g. check for an active process on the expected port). If not, start it.

```
npm run dev
```
// turbo

Wait for the server to be ready before proceeding (poll the URL or watch for the "ready" log line, don't just sleep a fixed time).

## Step 4 — Capture the live screen
Navigate a headless browser to the screen's route and take a screenshot at a defined viewport size.

- Use the project's mobile-first target viewport (match what's specified in `Requirement.md`/tech stack, default to a common mobile width like 390×844 if unspecified — state which one you used).
- Wait for the screen to be fully loaded and settled (no loading spinners, skeleton states resolved) before capturing — a screenshot of a loading state is not a valid comparison.
- If the screen requires auth or specific data to render meaningfully (e.g. a ledger with entries), use seeded/mock data consistent with what the reference image appears to show, and note this assumption in the report.
- Save the screenshot to `./progress/screenshots/[screen-name]-[timestamp].png`.

## Step 5 — Visual comparison
Compare the captured screenshot against the reference image from Step 2 across these dimensions:

1. **Layout & structure** — placement of major elements (header, nav, primary content, actions), spacing, alignment.
2. **Component fidelity** — do the actual rendered components match what the reference implies (e.g. if reference shows a card-based list, is the live screen also card-based, not a plain table)?
3. **Content parity** — are the same fields/data points/labels present, in the same relative positions?
4. **Visual style** — color usage, typography scale, density, whether it matches the shadcn-based design language expected per `.agents/rules/001-styling.md`.
5. **States shown vs missing** — does the reference imply states (empty/error/loading) not yet reflected, or interactive affordances (buttons, icons) missing from the live screen?

Do not treat pixel-perfect mismatch alone as "worse" — judge functional and design intent, not exact pixel diffing, unless the user asked for pixel-level strictness.

## Step 6 — Verdict and report
Produce a report with:

- **Screen**: name/route compared.
- **Reference image**: path/source used.
- **Live screenshot**: path saved in Step 4.
- **Verdict**: one of **Same** / **Better** / **Worse**, with a one-line justification.
- **Differences found**: bullet list, grouped by the dimensions in Step 5.
- **Suggested improvements**: concrete, actionable list (e.g. "Move the balance total above the transaction list to match reference" / "Use `Card` component for each row instead of plain `<div>` — also relevant to shadcn compliance") — not vague notes like "looks different."
- If any suggested improvement is itself a shadcn compliance issue, flag it and recommend running `/check-shadcn-compliance` as a follow-up rather than duplicating that workflow's logic here.

## Step 7 — Ask before making changes
Do not modify code automatically. Ask the user:
"Verdict: [Same/Better/Worse]. Found N suggested improvements. Apply them now, or just keep the report?"

If approved, implement the suggested improvements, then re-run Steps 4–6 on the updated screen only, to confirm the changes actually closed the gap (or didn't regress something that was already matching).

## Step 8 — Log the result
Append a dated entry to `./progress/visual-review-log.md` (and update `./progress/PROGRESS.md`) noting the screen, verdict, screenshot link, and improvement count, so visual review history is tracked across iterations.