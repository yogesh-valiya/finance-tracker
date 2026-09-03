---
description: Audits code generated/edited in the last iteration against the project's shadcn-first styling rule (.agents/rules/styling.md) — flags hand-rolled UI duplicating shadcn, hardcoded style values bypassing tokens, and non-shadcn CSS, then reports or fixes them. Tailwind utility classes composing shadcn components are expected usage, not a violation.
---

# Check shadcn Compliance

## Step 1 — Identify changed files
Get the list of files created or modified in the last iteration/turn (not the whole repo).

```
git diff --name-only HEAD
git status --porcelain
```
// turbo

Limit scope to `.tsx`, `.jsx`, `.css` files under the app's source directory. Ignore config files, `node_modules`, and files under `components/ui/` that are unmodified shadcn primitives (those are expected to contain Tailwind internally — that's shadcn's own implementation, not a violation).

## Step 2 — Read the binding rule
Read `.agents/rules/001-styling.md` before evaluating anything, so the check is against the actual current rule text, not an assumption.

## Step 3 — Scan each changed file for violations
For every file from Step 1, check for:

1. **Missed shadcn replacement opportunity** — for every custom-built UI section (even if it uses no hand-rolled primitives and technically passes checks 1–4), ask: does this logically match something shadcn already offers as a component, block, or chart? Check against shadcn's catalog — e.g. a hand-built modal/overlay → `Dialog`/`Sheet`; a custom data table → `Table` or the data-table block; a hand-rolled dropdown/select → `Select`/`Combobox`; a custom card layout → `Card`; a hand-built stat/number display with a graph → the `chart` components (bar/line/pie); a custom form → `Form` + `react-hook-form` integration; a custom nav/sidebar → the sidebar block; a custom toast/notification → `Sonner`/`Toast`; a custom date input → `Calendar`/`DatePicker`. Flag these as **missed replacements** even when no rule is technically broken — the intent of the styling rule is maximum shadcn reuse, not zero Tailwind.
2. **Hand-rolled UI duplicating shadcn** — raw `<div>`/`<button>`/`<input>` etc. built from scratch (with or without utility classes) to imitate something shadcn already provides (e.g. a hand-rolled button instead of `import { Button } from "@/components/ui/button"`). This is the primary violation — not utility class usage itself.
3. **Hardcoded values bypassing design tokens** — arbitrary hex colors, one-off pixel values, or magic-number spacing/typography used directly (e.g. `bg-[#3b82f6]`, `text-[15px]`) instead of shadcn's CSS variables/theme tokens (`bg-primary`, the existing spacing/typography scale). Utility classes referencing tokens (`bg-primary`, `p-4`, `text-sm`) are correct usage, not a violation.
4. **Non-shadcn CSS sources** — inline `style={{ }}` used as a substitute for utility/token classes, ad-hoc CSS-in-JS, or new global CSS that doesn't go through shadcn's `@layer` system or a scoped custom CSS file/module for genuinely custom elements.
5. **Component-level style overrides done wrong** — a shadcn component's look changed by prop-drilling one-off classes repeatedly across the app instead of extending its CVA variant definition once (e.g. same custom button color pasted via `className` in 5 places → should be a new `variant` in that component's `cva()` config).

## Step 4 — Produce a compliance report
Output two tables:

**Violations** (checks 1–4 — breaks the binding rule):

| File | Line(s) | Violation Type | Snippet | Suggested Fix |
|---|---|---|---|---|

**Missed shadcn replacements** (check 5 — passes the rule but could reuse shadcn instead of custom code):

| File | Section | Current Approach | Suggested shadcn Component/Block/Chart |
|---|---|---|---|

If a file has zero findings in either table, state that explicitly rather than omitting it, so coverage is visible.

End the report with:
- **Verdict: PASS** — no violations found in changed files.
- **Verdict: FAIL (N violations)** — list count by type.
- **Replacement opportunities: N** — reported separately; these do not affect PASS/FAIL, since check 5 is a reuse recommendation, not a rule violation.

## Step 5 — Ask before fixing
Do not auto-fix violations or apply replacements. Ask the user:
"Found N violations and M missed shadcn replacement opportunities. Fix violations, apply replacements, both, or just leave the report?"

If approved, fix accordingly:
- **Violations**: replace hand-rolled elements with the matching shadcn component/block; swap hardcoded values for the corresponding design token/CSS variable; move genuinely custom CSS into a scoped file (not inline styles or CSS-in-JS); consolidate repeated one-off class overrides into a proper CVA variant on the component itself.
- **Replacements**: swap the custom-built section for the identified shadcn component/block/chart, preserving existing behavior and data wiring — don't change functionality while swapping implementation.
- Re-running Step 3's scan on the fixed files only, to confirm the fix didn't introduce a new violation or reveal a further replacement opportunity.

## Step 6 — Log the result
Append a dated entry to `./progress/compliance-log.md` (and update `./progress/PROGRESS.md`) under the current phase, noting the verdict, violation count, and replacement-opportunity count, so compliance history is tracked across iterations rather than lost after this chat turn.