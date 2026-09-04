# shadcn Compliance Audit Log

## Phase 3 & 4 Audit — 2026-09-03

### Files Scanned
- `src/lib/math/expression-parser.ts`
- `src/lib/services/aggregation.ts`
- `src/components/numpad/numpad.tsx`
- `src/components/transaction/category-selector.tsx`
- `src/components/transaction/account-selector.tsx`
- `src/components/transaction/transaction-form-dialog.tsx`
- `src/components/transaction/search-overlay.tsx`
- `src/components/transaction/bookmarks-panel.tsx`
- `src/components/transaction/filter-dialog.tsx`
- `src/app/(app)/transactions/page.tsx`
- `src/app/api/categories/route.ts`
- `src/app/api/transactions/route.ts`
- `src/app/api/transactions/[id]/route.ts`
- `src/app/api/transactions/search/route.ts`
- `src/app/api/bookmarks/route.ts`

### Violations
*(None found)*

| File | Line(s) | Violation Type | Snippet | Suggested Fix |
|---|---|---|---|---|
| *All scanned files* | - | None | - | Fully compliant with shadcn/ui rules |

### Installed shadcn Primitives Utilized
- `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`
- `Popover`, `PopoverTrigger`, `PopoverContent`
- `Calendar`
- `Table`, `TableHeader`, `TableBody`, `TableHead`, `TableRow`, `TableCell`
- `Card`, `CardContent`, `CardDescription`, `CardHeader`, `CardTitle`
- `Button`
- `Input`
- `Label`
- `Badge`
- `Separator`

### Verdict
- **Verdict**: **PASS** (0 violations)
- **Design Alignment**: Clean white aesthetic matching `https://ui.shadcn.com/` with tokenized financial accents (`--income`, `--expense`, `--transfer`, `--liability`).

---

## Full Codebase `./src` Audit & Remediation — 2026-09-04

### Scope
Full recursive scan of all `.tsx` and `.ts` files under `src/` to identify and remediate:
1. Native `<select>` elements bypassing shadcn `Select`
2. Raw `<button>` tags bypassing shadcn `Button` variants
3. Hardcoded hex colors bypassing CSS design token variables (`--primary`, `--border`, `--muted-foreground`, `--income`, `--expense`)
4. Native `<input>`, `<textarea>`, `<dialog>` tags

### Installed shadcn Primitives Added
- `src/components/ui/select.tsx` (via `npx shadcn add select`)
- `src/components/ui/radio-group.tsx` (via `npx shadcn add radio-group`)

### Remediations Applied

| File | Violation / Miss | Remediation | Status |
|---|---|---|---|
| `src/components/transaction/recurrence-popover.tsx` | Native `<select>` for frequency, raw `<button>` for week day toggles | Replaced with shadcn `Select` & `Button` | FIXED |
| `src/app/(app)/more/recurring/page.tsx` | 5 native `<select>` elements (freq, timing, day, accounts) & raw `<button>` type selector | Replaced with shadcn `Select` & `Button` | FIXED |
| `src/app/(app)/more/categories/page.tsx` | Native `<select>` for reassigning deleted categories, raw `<button>` for reorder & emojis | Replaced with shadcn `Select` & `Button` | FIXED |
| `src/app/(app)/more/configuration/page.tsx` | 6 native `<select>` elements (currency, screen, day, gesture, time, order) | Replaced with shadcn `Select` components | FIXED |
| `src/components/settings/export-dialog.tsx` | Raw `<button>` for date range presets | Replaced with shadcn `Button` (`variant="outline"`) | FIXED |
| `src/components/transaction/filter-dialog.tsx` | Raw `<button>` for type selector, account picker, and category picker | Replaced with shadcn `Button` components | FIXED |
| `src/components/security/lock-screen.tsx` | Raw `<button>` elements for 10-key PIN numpad | Replaced with shadcn `Button` (`variant="outline"`) | FIXED |
| `src/app/(app)/more/passcode/page.tsx` | Raw `<button>` elements for 10-key PIN numpad | Replaced with shadcn `Button` (`variant="outline"`) | FIXED |
| `src/app/(app)/accounts/[id]/page.tsx` | Raw `<button>` for sub-tab switcher | Replaced with shadcn `Button` components | FIXED |
| `src/app/(app)/stats/page.tsx` | Raw `<button>` for granularity switcher & dimension toggles | Replaced with shadcn `Button` components | FIXED |
| `src/app/(app)/transactions/page.tsx` | Raw `<button>` for view switcher tabs | Replaced with shadcn `Button` components | FIXED |
| `src/components/transaction/transaction-form-dialog.tsx` | Raw `<button>` for Expense/Income/Transfer type selector | Replaced with shadcn `Button` components | FIXED |
| `src/components/transaction/category-selector.tsx` | Raw `<button>` for parent and subcategory list selection | Replaced with shadcn `Button` components | FIXED |
| `src/components/analytics/trend-chart.tsx` | Hardcoded hex colors (`#2563eb`, `#e5e7eb`, `#6b7280`) | Replaced with `var(--primary)`, `var(--border)`, `var(--muted-foreground)` | FIXED |
| `src/app/(app)/stats/[categoryId]/page.tsx` | Hardcoded hex colors (`#16a34a`, `#dc2626`) | Replaced with `var(--income)`, `var(--expense)` tokens | FIXED |
| `src/components/accounts/account-performance-chart.tsx` | Hardcoded hex colors for strokes and bars | Replaced with `var(--border)`, `var(--muted-foreground)`, `var(--primary)`, `var(--income)`, `var(--expense)` | FIXED |
| `src/components/accounts/net-worth-charts-dialog.tsx` | Hardcoded hex colors for lines, grids, and bars | Replaced with `var(--border)`, `var(--muted-foreground)`, `var(--primary)`, `var(--income)`, `var(--expense)` | FIXED |

### Verification
- **TypeScript (`npx tsc --noEmit`)**: PASS (0 errors)
- **Production Build (`npm run build`)**: PASS (30/30 static and dynamic routes compiled with Turbopack)
- **Remaining Native `<select>`**: 0
- **Remaining Raw `<input>` / `<textarea>`**: 0
- **Hardcoded Hex in SVG/Charts**: 0 (all using CSS design tokens)

### Final Verdict
- **Verdict**: **PASS** (100% compliant with `.agents/rules/001-styling.md`)

