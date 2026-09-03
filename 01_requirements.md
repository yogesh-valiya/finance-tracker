# Finance Tracker — Functional Requirements Guide

> **Version**: 3.0.0
> **Scope**: Personal bookkeeping, double-entry accounting, multi-account net worth, recurring schedules, and categorical spending analytics.
> **Target Platforms**: Responsive Web Application (Desktop & Mobile PWA)
> **Architecture & Framework**: Next.js with SSR & Server APIs (Route Handlers)
> **Language & Tooling**: TypeScript and Prisma
> **UI Foundation**: shadcn/ui - components, blocks and charts
> **Authentication**: Firebase Authentication (Google provider), JWT-based session verification via Firebase Admin SDK on API routes. Firebase is the source of truth for identity; Postgres stores app data keyed by Firebase UID

> **Database**: Self-hosted PostgreSQL, containerized via Docker Compose alongside the Next.js app on the same server (separate containers, same host)

> **Deployment**: Docker (multi-stage build, `output: 'standalone'`), self-hosted

---

## 1. System Principles

| # | Principle | Summary |
|---|-----------|---------|
| P1 | **Online-Only** | All data operations require an active server connection. No offline caching or mutation queuing. On connectivity loss, show a persistent non-blocking banner and disable mutations until reconnected. |
| P2 | **Login-Only Access** | All routes except `/login`, `/register`, and `/forgot-password` require authentication. Unauthenticated requests redirect immediately to the login gateway. All queries and mutations are scoped to the authenticated user's session. |
| P3 | **Minor-Unit / Precision Math** | All monetary values use integer minor units or high-precision decimal math. Floating-point currency arithmetic is prohibited. |
| P4 | **Deterministic Arithmetic Numpad** | Currency inputs embed a keypad supporting `+`, `-`, `*`, `/` with live preview. Inline calculations use a deterministic parser — never `eval()`. |
| P5 | **Two-Tier Categorization** | Parent → Subcategory hierarchy with a global toggle to collapse to single-tier when preferred. |
| P6 | **11 Account Groups** | Cash · Bank Accounts · Credit Cards · Debit Cards · Savings · Top-Up / Prepaid · Investments · Overdrafts · Loans · Insurance · Others. |
| P7 | **Data-Dense, Scannable UI** | High information scent; `tabular-nums` right-alignment for monetary columns; full state handling (loading skeletons, zero-states, inline errors); shadcn/ui design system. |
| P8 | **Desktop & Mobile Parity** | Desktop receives first-class layouts (persistent sidebars, master-detail splits, keyboard navigation). Mobile prioritizes ergonomic thumb zones, bottom sheets, and single-column feeds. |

---

## 2. Authentication & Onboarding

### 2.1 Authentication

- **Providers**: Email/password (with validation), Google OAuth2, password-reset email.
- **Session management**: Secure cookie-based sessions, HTTP-only tokens, server-side route-protection middleware.
- **Secondary app lock** (optional): Configurable 4-digit PIN or device biometrics (Fingerprint / FaceID / TouchID), prompted on foreground resume when enabled.

### 2.2 Registration & Default Seed Data

On registration the system creates a user profile with base currency **INR (₹)** and seeds:

**Default Accounts**

| Name | Group | Initial Balance |
|------|-------|-----------------|
| Cash Wallet | Cash | 0.00 |
| Primary Checking | Bank Accounts | 0.00 |
| High-Yield Savings | Savings | 0.00 |

**Default Income Categories** (with subcategories)

| Category | Subcategories |
|----------|---------------|
| 💰 Salary / Wages | Base Salary · Overtime · Bonus & Commission |
| 💼 Business & Freelance | Client Invoices · Consulting · Sales & Side Gigs |
| 📈 Investments | Dividends · Interest · Capital Gains · Rental Income |
| 🎁 Gifts & Grants | Gifts Received · Cashback & Rewards · Tax Refunds / Reimbursements |
| 💵 Other Income | *(none)* |

**Default Expense Categories** (with subcategories)

| Category | Subcategories |
|----------|---------------|
| 🍔 Food & Dining | Groceries · Restaurants · Coffee & Cafes · Food Delivery |
| 🏠 Housing & Utilities | Rent · Mortgage · Electricity · Water & Gas · Internet & Mobile · Home Maintenance |
| 🚗 Transportation | Fuel & Gas · Public Transit · Rideshare & Cabs · Vehicle Maintenance · Parking & Tolls |
| 🛍️ Shopping & Lifestyle | Clothing & Apparel · Electronics & Gadgets · Personal Care & Grooming · Home Goods |
| 🏥 Health & Medical | Doctor & Dental · Pharmacy & Medicine · Health Insurance · Fitness & Gym |
| 🎬 Entertainment & Leisure | Streaming & Subscriptions · Movies & Events · Gaming · Hobbies · Travel & Vacations |
| 📚 Education & Learning | Tuition & Courses · Books & Learning Material · Certifications |
| 💳 Bills & Financial Fees | Bank & ATM Fees · Loan Interest / EMI · Credit Card Charges · Taxes |
| 🐾 Pets | Pet Food · Vet & Healthcare · Pet Supplies |
| 🎁 Family & Gifts | Childcare & Family Support · Gifts Given · Donations & Charity |
| 📦 Miscellaneous | General Expense · Uncategorized |

---

## 3. Navigation Shell

### 3.1 Mobile (360–430 px)
Persistent 4-tab bottom navigation (44 px+ touch targets, safe-area insets):

1. **Trans.** — Transactions Hub (feeds, calendar, search, filters, logging)
2. **Stats** — Analytics (donut charts, category rankings, trend curves)
3. **Accounts** — Net worth, classification sheet, ledgers
4. **More** — Settings, categories, preferences, security

### 3.2 Desktop (1024 px+)
Persistent left sidebar/rail with icon + text labels, active route indicator, user profile shortcut. Sub-tabs render as top pill/tab bars.

### 3.3 Contextual Overlays
- **Mobile**: Bottom sheets and drawers for transaction creation, filters, pickers.
- **Desktop**: Centered modals or docked slide-over panels preserving background context.

---

## 4. Financial Accounting Rules

### 4.1 Account Balance

```
Balance(A) = InitialBalance(A)
           + Σ Income(A)
           − Σ Expense(A)
           + Σ TransferIn(A)
           − Σ TransferOut(A)
```

### 4.2 Net Worth

```
Total Assets      = Σ Balance  for groups {Cash, Accounts, Savings, Debit, Investments, Insurance, Prepaid}
Total Liabilities  = Σ |Balance| for groups {Credit Cards, Loans, Overdrafts}
Net Worth          = Total Assets − Total Liabilities
```

Accounts with **Include in totals = OFF** are excluded from net worth but retain their transaction history and individual balances.

### 4.3 Credit Card Accounting

- **Balance Payable** = charges − payments within the current billing cycle.
- **Outstanding Balance** = Balance Payable + unbilled new charges.
- **Settlement**: A transfer from a bank account to a credit card reduces the bank balance and the credit card liability by equal amounts.

### 4.4 Inter-Account Transfers

For a transfer of amount **M** from source **Src** to destination **Dst** with optional fee **F**:

```
Balance(Src) -= (M + F)
Balance(Dst) += M
```

- Transfers **do not** alter monthly Income or Expense aggregates.
- The fee **F**, if present, is recorded as an expense debit from **Src**.

### 4.5 Loans & Liabilities

Loans must be registered with a **negative** balance. A positive balance would incorrectly inflate assets.

---

## 5. Module 1 — Transactions Hub (`Trans.`)

### 5.1 Transaction Feeds

The primary ledger portal with five interchangeable views sharing a common period navigator, header actions, and monthly summary strip.

#### Common Elements (all views)

| Element | Description |
|---------|-------------|
| Period navigator | `< Jul 2026 >` (or year): chevrons ± 1 period, tappable date-picker |
| Header actions | Bookmarks (`⭐`), Search (`🔍`), Filter (`⚙️`) |
| View switcher | 5 tabs: **Daily · Calendar · Monthly · Total · Note** |
| Monthly summary strip | Income (blue) · Expenses (red) · Net (bold) |
| FAB | Primary `+` button to add a transaction |

#### Daily View

- **Day group headers**: day number, day-of-week badge, date stamp, daily income sum, daily expense sum.
- **Transaction cards**: category emoji + hierarchical name, note/payee, account badge, formatted amount (red = expense, blue = income).
- Tapping a card opens Transaction Edit.

#### Calendar View

- 7-column month grid; each cell shows day number plus daily income (blue), expense (red), and net (black) — zero values omitted. Adjacent-month overflow days rendered at reduced opacity. Active day highlighted.
- **Day Inspection Drawer**: opens on cell tap; shows day summary banner, itemized transactions, `< >` day pagination, `Close` dismiss. Tapping `+` pre-fills the selected date.
- **Desktop**: cells show up to 3 micro-pills + "+N more" badge; click docks a side panel without obscuring the grid.

#### Monthly View

- Annual statement banner: full-year Income, Expenses, Net Savings.
- 12-month table rows: month abbreviation, monthly Income, Expense, Net. Tapping a row expands weekly accordion rows (`DD.MM ~ DD.MM`) with 7-day micro-balances.

#### Total View

- Payment method metrics card for active date range: compared expenses (% change vs prior), liquid-account expenses, credit-account expenses, transfer volume.
- Budget navigation tile (`Budget Setting >`).
- **Export**: `Export data to Excel` generates `.xlsx` and `.csv` workbooks for the selected cycle.

#### Note View

- Journal feed of transactions that have user notes.
- Zero-data state: illustrated watermark + "No data available."
- Quick-note shortcut button (`📋+`) opens the transaction creator with Note field auto-focused.

#### States

| State | Behavior |
|-------|----------|
| Populated | Grouped feed / table / grid with data |
| Zero-data | Contextual empty message + CTA |
| Loading | Shimmer skeletons matching layout structure |
| Offline | Persistent banner; mutations disabled |

#### Desktop Adaptations

- Multi-column workspace: left pane = feed/table (Date, Category, Memo, Account, Deposit, Withdrawal, Actions columns); right pane = instant Transaction Detail / Quick Edit side panel.
- Keyboard shortcuts: `J`/`K` row traversal, `N` new transaction, `E` export.

---

### 5.2 Search & Query Intelligence

- **Entry**: `🔍` icon from any Transactions Hub view. Desktop: omnibox via `Ctrl+K` / `Cmd+K`.
- **Search input**: magnifying glass icon, real-time query text, clear `(x)`.
- **Behavior**: 150 ms debounced lookup across notes, categories, subcategories, and accounts.
- **Auto-suggestions**: floating chip container with contextual matches; tapping a chip populates and executes.
- **Results**: aggregate metrics strip (Income · Expenses · Transfers) + chronological transaction cards.
- **Filter shortcut** (`⚙️`): compound date/account constraints on the active query.
- **Zero-match state**: "No results found for '[query]'. Try adjusting your search term."
- **Desktop**: categorized dropdown (Categories, Accounts, Payees, Notes) with expandable tabular results + column sorting.

---

### 5.3 Bookmarks & Reusable Templates

- **Entry**: `⭐` in Transactions Hub header.
- Saved transaction templates (e.g., daily coffee, monthly rent) enabling one-tap pre-filled entry.
- **Onboarding card** explains how to register a bookmark from a transaction's action menu.
- **Actions**: tap to apply template → opens Add Transaction pre-filled; swipe to Rename, Edit Defaults, or Delete.
- **Desktop**: 2–3 column grid with "Quick Log" buttons for single-click recording.

---

### 5.4 Multi-Dimensional Filter System

- **Entry**: `⚙️` in any Transactions Hub view.
- **Filter modal**: period navigator, dimension tabs (**INCOME · EXPENSES · ACCOUNT**), master `All` checkbox, itemized checkboxes per category/account.
- **Live ratio meters**: Income donut gauge (filtered %) and Expenses donut gauge (filtered %) dynamically update as selections change.
- **Actions**: `[ Reset ]` clears all; `[ Select All ]`; `[ Filter ]` persists and applies across Daily, Calendar, Monthly views.
- **Active filter indicators**: dark top banner with `✕` (clear filter) + sticky criteria banner listing active entities with `[ Edit ]` shortcut.
- **Zero-match**: "No transactions match the selected filters. [Clear Filters]"
- **Desktop**: collapsible filter sidebar/panel; criteria as dismissible tag chips (`[ Cash Wallet ✕ ]`); reactive updates without modal.

---

## 6. Module 2 — Transaction Logging

### 6.1 Common Form Behavior

All three transaction types (Expense, Income, Transfer) share these patterns:

| Element | Behavior |
|---------|----------|
| **Type switcher** | Segmented pill: `Income` · `Expense` · `Transfer` — switching preserves shared field values |
| **Date field** | Format `DD/MM/YY (Day) HH:MM`; defaults to now; `Rep/Inst.` button for recurrence |
| **Amount field** | Opens custom arithmetic numpad; supports `+`, `-`, `*`, `/` with live preview; `Done` / `✕` dismisses |
| **Note field** | Text input with clear `(x)`; debounced autocomplete from historical memos |
| **Description** | Multiline textarea; camera trigger (`📷`) for receipt attachment |
| **Receipts** | Camera capture or gallery pick; up to 3 thumbnails with individual delete `✕` |
| **Validation** | Required fields highlighted on save attempt; save blocked until valid |
| **`[ Save ]`** | Persists record, updates balances/aggregates, returns to previous feed |
| **`[ Continue ]`** | Persists record, resets form for rapid batch entry |
| **`←` back** | If form is dirty, prompt confirmation before discarding |
| **`⭐` bookmark** | Registers current form values as a reusable template |
| **Desktop** | Centered modal / slide-out (max 580 px); full keyboard support (Tab, Enter=save, Esc=dismiss); pickers as anchored combobox popovers |

### 6.2 Expense

- **Theme accent**: Red.
- **Category selector**: 2-column bottom sheet — left: parent expense categories with emoji; right: subcategories of selected parent. Header: `Category`, edit `✏️`, close `✕`.
- **Account selector**: 3-column grid sheet — all active accounts as tiles. Header: `Accounts`, grid/list toggle, edit `✏️`, close `✕`.
- **On save**: decrements source account balance; adds to monthly Expense aggregates.

### 6.3 Income

- **Theme accent**: Blue.
- **Category selector**: same 2-column sheet with income categories.
- **Account selector**: same 3-column grid (asset accounts + liability accounts for debt paydown).
- **On save**: increments destination account balance; adds to monthly Income aggregates. If a liability account is selected, reduces the negative debt balance.

### 6.4 Transfer

- **Theme accent**: Neutral / charcoal dark.
- **Fields**: `From` (source), `To` (destination), bidirectional swap `↑↓`, optional `[ Fees ]` row.
- **Fees**: tapping `[ Fees ]` expands a dedicated row with numpad titled "Fees"; `✕` removes the fee.
- **Account selector**: same 3-column grid; the already-selected opposing account is visually dimmed to prevent identical From/To.
- **Validation**: same account for From and To blocks save ("Source and destination accounts must be different").
- **On save**: applies the accounting invariant from §4.4. Does **not** alter Income/Expense aggregates.
- **Desktop**: two side-by-side account cards with animated directional arrow and swap button.

### 6.5 Recurring Transactions & Repeat Engine

- **Entry**: `Rep/Inst.` button on Date row, or `More > Configuration > Repeat Setting`.
- **Recurrence popover**: `Repeat` (active) and `Installment` (excluded from Phase 1).
- **14 frequency options**: Nothing · Every Day · Weekdays · Weekend · Every Week · Every 2 Weeks · Every 4 Weeks · Every Month · End of Month · Every 2/3/4/6 Months · Annually.
  - "End of month" dynamically computes the last calendar day (28–31), including leap years.
- **Timing of reflection**: `On the date` (auto-posts on scheduled day) or `In advance` (posts 1–3 days early).
- **Central Rules Hub** (`Repeat Setting`):
  - Header: `←`, title, delete `🗑`, add `+`.
  - Global timing config row.
  - Grouped rules sections (Expenses, Transfer, Income) with section subtotals.
  - Rule cards: next execution date, frequency, title, account/category, amount.
  - Deleting a rule stops future entries without altering historical transactions.
- **Desktop**: sortable control table with columns: Type, Name, Frequency, Next Date, Source/Dest, Amount, Active Toggle, Actions.

---

## 7. Module 3 — Analytics & Visual Intelligence (`Stats`)

### 7.1 Categorical Spending & Income Breakdowns

- **Entry**: `Stats` tab in global navigation.
- **Period granularity**: dropdown with 4 options: Weekly · Monthly · Annually · Period (custom range). Chevrons shift ±1 period.
- **Dimension toggle**: `Income` (blue) / `Expenses` (red).
- **Interactive donut chart**: color-coded slices with external leader-line percentage callouts. Tap/hover explodes a slice and renders a pinned inspection badge (emoji, name, amount). Touch-friendly — no hover-only flows.
- **Ranked category list**: sorted descending by amount; each row shows color-coded % badge, category emoji + name, formatted total. Highlighting syncs with donut slice selection.
- **Tapping a category row** → navigates to Category Deep-Dive (§7.2).
- **Zero-data**: empty grey donut ring + "No financial activity recorded for this period."
- **Desktop**: side-by-side dashboard — left: expanded donut with center totals + legend; right: sortable ranked table with % change vs prior period and inline sparklines.

### 7.2 Category Deep-Dive & Historical Trends

- **Entry**: tapping any category row from §7.1.
- **Header**: `←`, category emoji + title, period navigator.
- **Summary metric**: total balance for the category within the period.
- **Subcategory distribution**: `All: 100%` master row + individual subcategory rows with % badge, name, amount. Tapping a subcategory filters the trend curve and transaction list.
- **12-month trend line chart**: Y-axis = currency intervals; X-axis = months (Jan–Dec); color-coded line (red=expense, blue=income) with interactive data-point nodes. Tapping a node shows an inspection tooltip with that month's exact amount.
- **Itemized transaction list**: filtered to this category for the active month, grouped by date with day headers and transaction cards.
- **Desktop**: two-column — left: subcategory breakdown + trend chart; right: full tabular transactions with sorting and quick edit.

---

## 8. Module 4 — Accounts, Assets & Net Worth (`Accounts`)

### 8.1 Net Worth Overview

- **Entry**: `Accounts` tab in global navigation.
- **Header**: title, total analytics `📊`, options menu `⋮`.
- **Net worth summary strip**: Assets (blue) · Liabilities (red) · Total (bold).
- **Classification groups**: each group has a computed subtotal rollup and expandable/collapsible account rows. Tapping a group header toggles expansion.
  - **Credit Card** rows show dual columns: `Balance Payable` and `Outst. Balance`.
  - **Loan** rows show negative balances in red.
- **Tapping an account** → opens Account Ledger (§8.2).
- **Options menu** (`⋮`): Add · Show/Hide · Delete · Modify Orders.
- **Total Stats view** (`📊`): Net Worth Trajectory curve (line chart over months) + Monthly Comparative Cashflow bars (credits blue vs debits red). Tapping nodes shows exact values.
- **Zero-accounts state**: onboarding prompt with "Add your first account" CTA.
- **Desktop**: multi-column balance sheet grid; top executive metric card (Net Worth, Total Assets, Total Liabilities, Debt-to-Asset Ratio); account groups as cards with inline action menus.

### 8.2 Individual Account Ledger & Performance

- **Entry**: tapping any account from §8.1.
- **Header**: `←`, account title, period navigator.
- **Sub-tabs**: Daily · Monthly · Annually.
- **Statement bar**: date range label, performance analytics `📊`, edit account `✏️`.
- **4-metric summary**: Deposit (blue) · Withdrawal (red) · Total (net) · Balance (orange/bold closing).
- **Daily grouped transactions**: day headers with deposits/withdrawals; transaction cards include a **running balance tag** (`Balance: [Amount]`).
- **Performance view** (`📊`): Account Balance Trajectory (line chart) + Account Cashflow Distribution (bar chart). Toggle back to ledger via list icon.
- **Actions**: `+` opens transaction form with this account pre-selected; `✏️` opens Account Info (§8.4).
- **Zero-data**: "No transactions recorded for this account during this period."
- **Overdrawn**: negative balance rendered in red with warning indicator.
- **Desktop**: full tabular bank statement (Date, Category, Description, Deposit, Withdrawal, Running Balance, Actions) with side panel for account details and monthly stats.

### 8.3 Account Creation & Reconciliation

- **Entry**: `Add` from options menu (§8.1).
- **Step 1 — Group selection modal**: choose from the 11 classification groups.
- **Step 2 — Creation form**: Group (assigned), Name (required), Amount (default 0, opens numpad), Description.
- **Reconciliation**: if a non-zero initial amount is entered, prompt:
  > "The difference is registered on your account details. Would you like to record the difference as an income?"
  - **YES**: sets balance and creates an initial Income transaction (today's date) for ledger parity.
  - **NO**: sets the balance directly without creating a transaction.
- **Desktop**: centered 2-step stepper dialog (max 540 px).

### 8.4 Account Configuration (`Account Info`)

- **Entry**: `✏️` from Account Ledger header (§8.2).
- **Header**: `←`, `Account Info`, delete `🗑`.
- **Universal fields**: Group, Name, Amount (with currency selector), Description, `Include in totals` toggle, `Show/Hide` eye toggle.
- **Group-specific fields**:

| Group | Fields |
|-------|--------|
| **Credit Card** | Settlement Date (monthly closing day), Payment Date (monthly due day), computed Balance Payable and Outstanding Balance with billing-cycle date ranges |
| **Debit Card** | Linked bank account dropdown; informational card explaining zero-balance carry-over policy |
| **Loan** | Negative amount enforced; positive values trigger warning: "In case of loan account, please input negative(-) amount to set it as a liability." |

- **Toggling `Include in totals` OFF** excludes the account from net worth without removing ledger history.
- **Delete**: confirmation dialog noting transaction reassignment requirement.
- **Desktop**: two-column — left: general properties; right: specialized rules (billing schedules, linked accounts).

### 8.5 Account List Management

#### Modify Orders
- Grouped account list; tap to select an account, then use `⌃` (up) / `⌄` (down) to reposition within its group.
- Desktop: drag-and-drop with grab handles (`⠿`).

#### Show/Hide Settings
- Grouped list with eye icon toggles (`👁`). Hidden accounts are omitted from transaction pickers and daily feeds but preserve historical records and net worth inclusion.
- Changes persist immediately.

---

## 9. Module 5 — Settings & Configuration (`More`)

### 9.1 Settings Navigation Hub

- **Entry**: `More` tab in global navigation.
- **User profile card**: avatar, display name, email. Tappable → profile editing.
- **3×3 navigation grid**:

| Tile | Purpose |
|------|---------|
| Configuration | General preferences, billing cycles, input orders (→ §9.3) |
| Accounts | Shortcut to Accounts module |
| Passcode | 4-digit PIN / biometric lock setup |
| CalcBox | Financial calculators, loan amortization |
| PC Manager | Web client connection / desktop sync |
| Backup | Cloud sync, JSON export, file backups |
| Feedback | User support / feature suggestions |
| Help | FAQs, documentation, guides |
| Recommend | App sharing |

- **Desktop**: sidebar navigation with categorized links (Preferences, Master Data, Security, System); sub-settings render in main pane.

### 9.2 Master Category & Subcategory Management

- **Entry**: `More > Configuration > Income/Expenses Category Setting`, or `✏️` on any category sheet.
- **Header**: `←`, title (`Income Category` / `Expenses Category`), add `+`.
- **Subcategory master toggle**: ON = two-tier hierarchy; OFF = hides subcategories throughout.
- **Category rows**: delete `⛔`, emoji + name (with subcategory count badge for expenses), subcategory preview subtitle, edit `✏️`, drag handle `☰`.
- **Add**: `+` opens modal to name and assign emoji.
- **Delete**: `⛔` prompts confirmation; if historical transactions reference the category, user must reassign before deletion proceeds.
- **Subcategory detail view** (expense categories): header with parent name + `✏️` + `+`; subcategory rows with `⛔`, name, `✏️`, `☰`.
- **Reordering**: drag `☰` to reorder; persists immediately.
- **Desktop**: two-pane master-detail — parent categories on left, selected category's subcategories on right.

### 9.3 Application Preferences

- **Entry**: `Configuration` tile from §9.1.

#### Category & Repeat Shortcuts
- Income Category Setting (→ §9.2)
- Expenses Category Setting (→ §9.2)
- Subcategory master toggle
- Budget Setting
- Repeat Setting (→ §6.5)

#### General Financial Preferences

| Setting | Options / Format |
|---------|-----------------|
| Main Currency | e.g. `INR (₹)` |
| Sub Currency | Secondary currency with custom exchange rate |
| Start Screen | `Daily` or `Calendar` |
| Monthly Start Date | `Every 1` through `Every 28` — dynamically shifts the monthly ledger window (e.g. 25th → 24th of next month) |
| Weekly Start Day | `Sunday` or `Monday` |
| Carry-over Setting | OFF / ON — carries forward net month balances |
| Swipe gesture | `To Change Date` / `To Change Tab` |
| Income-Expenses Color | Set A (Income=Blue, Expense=Red) / Set B (Income=Red, Expense=Blue) — applied across all charts and feeds |
| Time Input | `Input Only, Desc.` / `Auto-Stamp Current Time` |
| Show description | OFF / ON — toggles multiline descriptions in feeds |
| Autocomplete | ON / OFF — live suggestion chips in note fields |
| Input order | `From Amount` / `From Category` — initial field focus on transaction open |
| Note button | OFF / ON — standalone note button in bottom bar |

#### Security & Reminders
- **Passcode**: OFF / ON; setup via 4-digit keypad with confirmation; supports WebAuthn / biometrics.
- **Alarm Setting**: ON / OFF; configurable daily reminder time; requests notification permissions.

All setting changes are persisted immediately and reflected across the application.
