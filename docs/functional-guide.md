# Finance Tracker — Comprehensive Functional Guide & Single Source of Truth

> **Document Version**: 2.1.0  
> **Target Platforms**: Responsive Web Application (Desktop & Mobile PWA)
> **Backend Service**: PocketBase (Centralized REST API, SQLite WAL, Real-Time Subscriptions, Auth, S3/Local Storage)  
> **Frontend Stack**: React 18, TypeScript, Vite, React Router v6, Tailwind CSS, shadcn/ui, Zustand  
> **Operating Model**: Strictly Online-Only (Zero offline caching or offline queueing; requires active network connection with real-time verification)  
> **UI Foundation**: shadcn/ui design tokens, CVA variants, responsive layouts, and deterministic arithmetic numpad parser

---

## Table of Contents
1. [Product Architecture, Core Tenets & System Principles](#1-product-architecture-core-tenets--system-principles)
2. [Authentication, User Onboarding & Master Data Seeding](#2-authentication-user-onboarding--master-data-seeding)
3. [Global Persistent Navigation & Adaptive Shell Framework](#3-global-persistent-navigation--adaptive-shell-framework)
4. [Financial Accounting Rules & Calculation Engine](#4-financial-accounting-rules--calculation-engine)
5. [Module 1: Transactions Hub (`Trans.`)](#5-module-1-transactions-hub-trans)
   - [5.1 Primary Transaction Feeds](#51-primary-transaction-feeds)
   - [5.2 Calendar & Day Inspection](#52-calendar--day-inspection)
   - [5.3 Search & Query Intelligence](#53-search--query-intelligence)
   - [5.4 Bookmarks & Reusable Templates](#54-bookmarks--reusable-templates)
   - [5.5 Multi-Dimensional Transaction Filter System](#55-multi-dimensional-transaction-filter-system)
6. [Module 2: Transaction Logging, Sheets & Engine](#6-module-2-transaction-logging-sheets--engine)
   - [6.1 Expense Logging Flow](#61-expense-logging-flow)
   - [6.2 Income Logging Flow](#62-income-logging-flow)
   - [6.3 Inter-Account Transfer Flow](#63-inter-account-transfer-flow)
   - [6.4 Recurring Transactions & Repeat Engine](#64-recurring-transactions--repeat-engine)
7. [Module 3: Analytics & Visual Intelligence (`Stats`)](#7-module-3-analytics--visual-intelligence-stats)
   - [7.1 Categorical Spending & Income Breakdowns](#71-categorical-spending--income-breakdowns)
   - [7.2 Category Deep-Dive & Historical Trend Curves](#72-category-deep-dive--historical-trend-curves)
8. [Module 4: Accounts, Assets & Net Worth (`Accounts`)](#8-module-4-accounts-assets--net-worth-accounts)
   - [8.1 Net Worth Overview & Aggregate Analytics](#81-net-worth-overview--aggregate-analytics)
   - [8.2 Individual Account Ledger & Performance](#82-individual-account-ledger--performance)
   - [8.3 Account Creation & Reconciliation](#83-account-creation--reconciliation)
   - [8.4 Group-Specific Account Configuration](#84-group-specific-account-configuration)
   - [8.5 Account List Management & Organization](#85-account-list-management--organization)
9. [Module 5: Settings, Master Data & Configuration (`More`)](#9-module-5-settings-master-data--configuration-more)
   - [9.1 Settings Navigation Hub](#91-settings-navigation-hub)
   - [9.2 Master Category & Subcategory Management](#92-master-category--subcategory-management)
   - [9.3 Application Preferences & Customization](#93-application-preferences--customization)

---

## 1. Product Architecture, Core Tenets & System Principles

The **Finance Tracker (Money Manager)** is a comprehensive personal bookkeeping and financial intelligence system. It provides double-entry accounting integrity, dynamic multi-account net worth tracking, automated recurring transaction schedules, and visual categorical spending analytics.

### 1.1 Core System Tenets
1. **Strictly Online-Only Architecture**: All data operations directly communicate with the centralized PocketBase backend. The application explicitly supports no offline data caching or offline mutation queuing. An active internet connection is mandatory; if connectivity is interrupted, the application displays a persistent non-blocking notification and disables mutations until re-established.
2. **Strict Login-Only Access Control**: Financial data is completely private. Unauthenticated requests are immediately blocked and redirected to the login gateway. No unauthenticated or guest mode is permitted. All queries are strictly scoped to the authenticated user ID (`@request.auth.id`).
3. **Double-Entry Financial Accuracy & Minor Unit Math**: All monetary amounts are managed using integer minor units or high-precision decimal math utilities (`011-financial-math.md`). Floating-point arithmetic on currency calculations is strictly prohibited to eliminate rounding discrepancies. Incomes, expenses, and inter-account transfers update live account balances and classification totals atomically.
4. **Embedded Deterministic Arithmetic Numpad**: Currency inputs feature an integrated keypad supporting multi-operator equations (`+`, `-`, `*`, `/`) with live preview. Inline calculations are evaluated using a deterministic custom arithmetic parser without `eval()` or dangerous code execution.
5. **Hierarchical Two-Tier Categorization**: Master data supports a parent category and subcategory hierarchy with an optional global master toggle to simplify transaction entry to single-tier categories when preferred.
6. **11 Account Classification Groups**: The ledger supports 11 structured account groups: Cash, Bank Accounts, Credit Cards (tracking both statement payable and total outstanding), Debit Cards (linked to bank accounts without balance carry-over), Savings, Top-Up/Prepaid, Investments, Overdrafts, Loans (negative liabilities), Insurance, and Others.
7. **Design Thinking & Data Density (Rules 001, 003, 004)**: High information scent, dense scannable layouts, `tabular-nums` right-alignment for effortless numerical comparison, rich micro-interactions, full operational state handling (loading skeletons, zero-states, inline errors), and strict adherence to the shadcn/ui design system.
8. **Equal Parity for Desktop & Mobile Form Factors**: Rather than a mobile-exclusive experience scaled up, desktop viewports (1024px+) receive first-class layout adaptations including persistent sidebars, side-by-side master-detail splits, expanded tabular grids, multi-column analytics, and full keyboard navigation. Mobile viewports (360–430px) prioritize ergonomic thumb zones, bottom sheets, and single-column touch feeds.

---

## 2. Authentication, User Onboarding & Master Data Seeding

### 2.1 Authentication & Session Management
- **Gated Navigation**: The client routing layer enforces strict authentication gates across all application paths except `/login`, `/register`, and `/forgot-password`.
- **Authentication Providers**: Standard Email and Password authentication with client-side Zod validation, Google OAuth2 social login, and password reset email delivery.
- **Session Singleton**: Powered by `PocketBase.authStore` wrapped in a centralized singleton client (`src/lib/pocketbase.ts`), storing tokens securely and restoring authenticated sessions across browser reloads.
- **Secondary App Security**: Configurable 4-digit PIN lock or WebAuthn / native device biometrics (Fingerprint / FaceID / TouchID) prompted upon returning to the foreground when enabled in settings.

### 2.2 User Registration & Default Master Data Seeding
Upon successful user registration, the system automatically creates the user profile with base currency `INR (₹)` and deterministically seeds default master data records reflecting practical, real-life personal finance workflows:
- **Default Seeded Accounts**:
  - `Cash Wallet` (Classification Group: `Cash`, Initial Balance: `0.00`)
  - `Primary Checking` (Classification Group: `Accounts`, Initial Balance: `0.00`)
  - `High-Yield Savings` (Classification Group: `Savings`, Initial Balance: `0.00`)
- **Default Income Categories & Subcategories**:
  - `💰 Salary / Wages`: *Base Salary, Overtime, Bonus & Commission*
  - `💼 Business & Freelance`: *Client Invoices, Consulting, Sales & Side Gigs*
  - `📈 Investments`: *Dividends, Interest, Capital Gains, Rental Income*
  - `🎁 Gifts & Grants`: *Gifts Received, Cashback & Rewards, Tax Refunds / Reimbursements*
  - `💵 Other Income`
- **Default Expense Categories & Subcategories**:
  - `🍔 Food & Dining`: *Groceries, Restaurants, Coffee & Cafes, Food Delivery*
  - `🏠 Housing & Utilities`: *Rent, Mortgage, Electricity, Water & Gas, Internet & Mobile, Home Maintenance*
  - `🚗 Transportation`: *Fuel & Gas, Public Transit, Rideshare & Cabs, Vehicle Maintenance, Parking & Tolls*
  - `🛍️ Shopping & Lifestyle`: *Clothing & Apparel, Electronics & Gadgets, Personal Care & Grooming, Home Goods*
  - `🏥 Health & Medical`: *Doctor & Dental, Pharmacy & Medicine, Health Insurance, Fitness & Gym*
  - `🎬 Entertainment & Leisure`: *Streaming & Subscriptions, Movies & Events, Gaming, Hobbies, Travel & Vacations*
  - `📚 Education & Learning`: *Tuition & Courses, Books & Learning Material, Certifications*
  - `💳 Bills & Financial Fees`: *Bank & ATM Fees, Loan Interest / EMI, Credit Card Charges, Taxes*
  - `🐾 Pets`: *Pet Food, Vet & Healthcare, Pet Supplies*
  - `🎁 Family & Gifts`: *Childcare & Family Support, Gifts Given, Donations & Charity*
  - `📦 Miscellaneous`: *General Expense, Uncategorized*

---

## 3. Global Persistent Navigation & Adaptive Shell Framework

### 3.1 Adaptive Shell Architecture
- **Mobile Viewports (360–430px)**: Persistent 4-tab bottom navigation bar with 44px+ touch targets and safe area insets:
  1. `Trans.` (Transactions Hub): Feeds, calendar, search, filters, logging.
  2. `Stats` (Analytics): Donut charts, category rankings, trend curves.
  3. `Accounts` (Net Worth & Assets): Classification sheet, ledgers, statements.
  4. `More` (Settings & Configuration): Categories, preferences, security, backups.
- **Desktop Viewports (1024px+)**: Left persistent navigation rail/sidebar featuring icon and text labels, active route indicators, quick user profile indicator, and direct shortcut access. Sub-tabs render as desktop pill switchers or tab bars at the top of the main content canvas.
- **Contextual Workflows & Overlays**:
  - On mobile, transaction creation, filters, and pickers present as bottom sheets and drawers.
  - On desktop, these workflows adapt into centered modal dialogs or docked slide-over side-panels, preserving background context and enabling multi-tasking.

---

## 4. Financial Accounting Rules & Calculation Engine

### 4.1 Account Balance Formula
For any account $A$, the current closing balance is computed by:
$$\text{Current Balance}(A) = \text{Initial Balance}(A) + \sum \text{Income}(A) - \sum \text{Expense}(A) + \sum \text{TransferIn}(A) - \sum \text{TransferOut}(A)$$

### 4.2 Consolidated Net Worth Computation
$$\text{Total Assets} = \sum_{A \in \{\text{Cash, Accounts, Savings, Debit, Investments, Insurance, Prepaid}\}} \text{Balance}(A)$$
$$\text{Total Liabilities} = \sum_{A \in \{\text{Credit Cards, Loans, Overdrafts}\}} |\text{Balance}(A)|$$
$$\text{Total Net Worth} = \text{Total Assets} - \text{Total Liabilities}$$

Accounts configured with `Include in totals = OFF` are excluded from the Consolidated Net Worth calculations while retaining their itemized transaction history and individual statement balances.

### 4.3 Credit Card Ledger Accounting
- **Balance Payable**: The confirmed statement balance due for settlement within the current billing cycle:
  $$\text{Balance Payable} = \sum_{\text{Billing Cycle}} \text{Charges} - \sum_{\text{Billing Cycle}} \text{Payments}$$
- **Outstanding Balance**: The comprehensive indebtedness including unbilled recent transactions:
  $$\text{Outstanding Balance} = \text{Balance Payable} + \sum_{\text{Unbilled Period}} \text{New Charges}$$
- **Settlement Parity**: A transfer from a liquid bank account to a credit card reduces the bank balance and reduces the credit card liability by equivalent amounts.

### 4.4 Inter-Account Transfers
For a fund transfer of amount $M$ from source account $A_{\text{src}}$ to destination account $A_{\text{dst}}$ with optional surcharge $\text{Fee}$:
$$\text{Balance}(A_{\text{src}}) \leftarrow \text{Balance}(A_{\text{src}}) - M - \text{Fee}$$
$$\text{Balance}(A_{\text{dst}}) \leftarrow \text{Balance}(A_{\text{dst}}) + M$$
- Transfers do not alter aggregate monthly Income or Expense statistics.
- The transfer fee $\text{Fee}$, if present, is debited from $A_{\text{src}}$ and recorded in financial statistics as an expense debit.

### 4.5 Loan & Debt Liabilities
- Loans must be registered as a negative liability balance (e.g. formatted with negative prefix `-₹ X,XXX.XX`). Positive entries represent credit balances and would improperly augment asset totals.

---

## 5. Module 1: Transactions Hub (`Trans.`)

The Transactions Hub is the primary operational portal for reviewing, analyzing, and managing financial records. It provides five interchangeable chronological views (Daily, Calendar, Monthly, Total, Note), comprehensive search intelligence, reusable bookmark templates, and multi-dimensional filtering.

### 5.1 Primary Transaction Feeds
- **Key Views & Components**:
  - Daily Transactions Feed
  - Monthly Summary & Annual Breakdown
  - Total & Account Overview (Payment Method Metrics & Excel Export)
  - Note Journal Feed & Zero-Data Empty State
- **Purpose**: Provides a unified multi-perspective ledger engine that allows users to review transactions chronologically by day, compare 12-month annual financial trends with weekly drilldowns, inspect payment method distribution metrics with Excel export, and browse a dedicated journal feed of transactions with user notes.
- **Elements**:
  - Period navigation bar featuring: previous and next cycle chevrons (`<`, `>`), active period display (e.g., `Jul 2026` or `< 2026 >`), and an interactive date picker trigger.
  - Header utility action triggers: Bookmarks hub trigger (`⭐`), Transaction search trigger (`🔍`), and Multi-dimensional filter trigger (`⚙️`).
  - View switcher segmented control with 5 sub-tab options: `Daily`, `Calendar`, `Monthly`, `Total`, `Note`.
  - Monthly financial summary strip displaying three color-coded aggregates: Income total (blue), Expenses total (red), and Net balance (black/bold).
  - Annual financial statement banner displaying: Full-year Income, Full-year Expenses, and Full-year Net Savings.
  - 12-month summary table rows displaying: Month abbreviation (`Jan` through `Dec`), Monthly Income, Monthly Expense, and Net difference, with expandable weekly accordion rows (`DD.MM ~ DD.MM`) detailing 7-day micro-balances under the selected month.
  - Payment method metrics card bounded by active date range (`DD.MM.YY ~ DD.MM.YY`) displaying: Compared Expenses (% change vs prior month), Expenses from liquid accounts (`Cash, Accounts`), Expenses from credit accounts (`Card, Pay`), and Inter-account transfer volume.
  - Budget navigation tile with memo icon and `Budget Setting >` navigation trigger.
  - Spreadsheet export trigger button (`Export data to Excel`) with document icon.
  - Daily transaction section group headers containing: day number (e.g. `28`), day-of-week badge (`Tue`), formatted date stamp (`07.2026`), daily income sum, and daily expense sum.
  - Itemized transaction cards displaying: category emoji icon and hierarchical name (`🍔 Food & Dining / Restaurants`), note or payee memo (`Dinner with colleagues`), associated account badge (`Primary Checking`), and formatted monetary amount (red for expenses, blue for income).
  - Note journal empty state component featuring an illustrated watermark graphic, empty text label ("No data available."), and an onboarding suggestion.
  - Quick-note creation shortcut button (`[📋+]`).
  - Primary Add Transaction action button (`+`).
  - Global persistent navigation component.
- **Content vs. placeholder**:
  - Spec data: Period formats (`Jul 2026`, `DD.MM.YY ~ DD.MM.YY`), currency symbol (`₹`), three summary metrics (Income, Expenses, Net Total), 12-month row schema, weekly range format, payment method metric titles, sub-tab names (`Daily`, `Calendar`, `Monthly`, `Total`, `Note`), Excel export trigger, empty state prompt text.
  - Dynamic vs. configured data: Monetary aggregates, date group headers, and running totals are dynamically computed from transactions; transaction memos, category assignments, and account tags reflect user inputs.
- **States**:
  - Populated feed states: Daily grouped feed with itemized cards, Monthly 12-month table with expanded weekly rows, Total view with computed payment method metrics.
  - Empty states: Zero-data monthly feed ("No transactions recorded for this month. Tap + to add one."), Note feed empty state ("No data available." with illustrated watermark).
  - Loading state: Shimmer skeleton mirroring date headers, summary card, and transaction rows.
  - Network Disconnect state: Persistent non-blocking offline banner indicating real-time sync paused with mutation buttons temporarily disabled.
- **Expected behavior**:
  - Tapping cycle chevrons decrements or increments the active period (month or year) and refetches transactions from PocketBase.
  - Tapping sub-tabs (`Daily`, `Calendar`, `Monthly`, `Total`, `Note`) switches the active view presentation mode while preserving the currently selected period and active filter state.
  - In Monthly view, tapping a month row expands or collapses its 7-day weekly breakdown accordion rows.
  - In Total view, tapping `Export data to Excel` generates and downloads formatted `.xlsx` and `.csv` workbooks containing all transactions for the selected cycle.
  - In Note view, tapping `[📋+]` opens the transaction creator with the cursor auto-focused on the Note input.
  - Tapping any individual transaction card opens its Transaction Details/Edit view with pre-populated values.
  - Tapping `+` opens the Add Transaction form.
- **Navigation**:
  - Entry: Default landing module on launch when configured, or selected via `Trans.` tab in the global persistent navigation bar.
  - Exits: `+` opens Transaction Creator; Search icon navigates to Search view; Filter icon opens Filter Modal; Bookmarks icon navigates to Bookmarks Hub; transaction card tap opens Transaction Edit form; `Budget Setting >` navigates to Budget configuration.
- **Responsive & Viewport Adaptation (Mobile & Desktop)**:
  - Mobile: Single-column vertically scrollable stream with floating action button (`+`) in the thumb reach area; sticky month summary and period navigator. Sub-tabs render as a horizontal scrollable segment bar.
  - Desktop: Multi-column executive financial workspace. The left pane hosts the persistent daily or monthly feed with expanded tabular columns (Date, Category, Memo, Account, Deposit, Withdrawal, Actions). The right pane hosts an instant Transaction Detail / Quick Edit side panel, eliminating page transitions. Period navigation spans an integrated top command bar with keyboard shortcuts (`J`/`K` for row traversal, `N` for new transaction, `E` for export).

---

### 5.2 Calendar & Day Inspection
- **Key Views & Components**:
  - Monthly Calendar Grid View
  - Day Inspection Sheet / Drawer
- **Purpose**: Provides a monthly calendar grid showing daily income, expense, and net cashflow totals per date cell to highlight spending spikes, coupled with a day inspection sheet to review and log transactions for any selected date.
- **Elements**:
  - Period navigator matching Section 5.1 (`< Aug 2026 >`).
  - View switcher with `Calendar` sub-tab selected.
  - Monthly financial summary strip matching Section 5.1.
  - Calendar grid header with 7 day-of-week labels (`Sun`, `Mon`, `Tue`, `Wed`, `Thu`, `Fri`, `Sat`), honoring the user's weekly start day setting.
  - Calendar date cells (7x5 or 7x6 matrix) displaying:
    - Day number (e.g., `12`).
    - Daily income sum (blue text line, omitted if zero).
    - Daily expense sum (red text line, omitted if zero).
    - Daily net balance sum (black text line, calculated as income minus expenses).
    - Inactive / adjacent-month overflow days rendered with reduced opacity.
    - Active day indicator (highlighted colored badge on current or selected date).
  - Day inspection drawer / bottom sheet containing:
    - Day summary banner with day number (`12`), day-of-week badge (`Wed`), date stamp (`08.2026`), daily income total, daily expense total, and memo shortcut icon.
    - Itemized daily transaction cards showing category icon/name (`🏠 Housing & Utilities / Rent`), memo (`Monthly Rent`), account badge (`Rewards Credit Card`), and formatted amount.
    - Quick-note shortcut button (`[📋+]`).
    - Day pagination controls with previous day chevron (`<`), next day chevron (`>`), and explicit `Close` dismiss button.
  - Primary Add Transaction action button (`+`).
- **Content vs. placeholder**:
  - Spec data: 7-column calendar matrix, 3-line cell financial metric format (Income, Expense, Net), day inspection sheet controls (`Close`, `<`, `>`).
  - Dynamic vs. configured data: Daily income, expense, and net values in calendar cells and the day inspection drawer are calculated dynamically from user transactions for each date.
- **States**:
  - Populated calendar state with day inspection drawer open.
  - Inferred states: Zero-data day (day inspection displays "No transactions on this date" with an instant Add button), Zero-data month (cells display day numbers without financial lines).
- **Expected behavior**:
  - Tapping any date cell selects that day and smoothly opens the Day Inspection Drawer.
  - Swiping horizontally across the calendar switches to the previous or next month (when swipe gesture is enabled in settings).
  - In the Day Inspection Drawer, tapping `<` or `>` transitions immediately to the adjacent calendar day, updating itemized records and calendar cell highlight in lockstep.
  - Tapping `Close` or performing a swipe-down gesture dismisses the inspection drawer.
  - Tapping any transaction in the drawer opens its Edit form.
  - Tapping `+` opens the Add Transaction form with the date pre-filled to the selected calendar day.
- **Navigation**:
  - Entry: Selecting `Calendar` sub-tab from Transactions Hub.
  - Exits: Date cell tap opens Day Inspection Drawer; `Close` dismisses drawer; `+` opens Transaction Creator; transaction tap opens Transaction Edit form.
- **Responsive & Viewport Adaptation (Mobile & Desktop)**:
  - Mobile: Calendar cells scale to viewport width (360–430px) with condensed typography. The day inspection view presents as a bottom drawer sliding over the lower screen.
  - Desktop: Full-sized desktop calendar grid. Cells expand with comfortable padding, displaying up to 3 individual transaction micro-pills per cell before a "+N more" badge. Hovering reveals a summary popover; clicking a day docks the Day Inspection view as a permanent right-hand side panel without obscuring the calendar matrix.

---

### 5.3 Search & Query Intelligence
- **Key Views & Components**:
  - Transaction Search Bar & Live Suggestions
  - Transaction Search Results & Aggregations
- **Purpose**: Delivers instant transaction discovery through debounced keyword search across notes, payees, categories, and accounts, providing dynamic suggestion matching and live financial aggregations for all matching records.
- **Elements**:
  - Search view header with back chevron (`←`), title (`Search`), and compound filter shortcut icon (`⚙️`).
  - Search input field featuring magnifying glass icon, real-time query text, and clear query button (`(x)`).
  - Floating auto-suggestions container displaying live contextual match suggestions based on input keystrokes.
  - Search results aggregate metrics strip displaying 3 dynamic totals: Income matching query (blue), Expenses matching query (red), and Transfers matching query (neutral).
  - Chronological results feed of matching transaction cards, each displaying: formatted date stamp (`YYYY-MM-DD`), category icon and hierarchical name, note or payee memo, payment account badge, and formatted amount.
- **Content vs. placeholder**:
  - Spec data: Header controls, clear button `(x)`, 3-metric summary header (Income, Expenses, Transfer), transaction card data schema.
  - Dynamic vs. configured data: Search query text is entered by user; matching transaction counts and aggregated Income, Expense, and Transfer totals are dynamically calculated from matching records.
- **States**:
  - Initial active state with input focused and suggestions container visible.
  - Populated search results state showing matching entries and aggregated metrics.
  - Inferred states: Zero-match state ("No results found for '[query]'. Try adjusting your search term."), Searching/debouncing indicator.
- **Expected behavior**:
  - Typing characters executes an instant debounced lookup (150ms) across transaction notes, categories, subcategories, and accounts.
  - Tapping a suggestion chip automatically populates the search query and executes the search.
  - Tapping `(x)` clears entered query text and restores suggestions mode.
  - Tapping the filter shortcut (`⚙️`) allows applying compound date or account constraints to the active search query.
  - Tapping any transaction in the results feed opens its Transaction Details/Edit view.
  - Tapping `←` clears query and returns to the previous transactions feed.
- **Navigation**:
  - Entry: Tapping the Search icon (`🔍`) from any Transactions Hub view.
  - Exits: `←` returns to previous feed; transaction tap opens Transaction Edit form; `⚙️` opens compound filter modal.
- **Responsive & Viewport Adaptation (Mobile & Desktop)**:
  - Mobile: Full-screen search overlay with auto-focused soft keyboard and single-column results feed.
  - Desktop: Omnibox command palette (accessible via `Ctrl+K` or `Cmd+K`) floating above the interface. As the user types, a categorized dropdown reveals instant matches grouped by Categories, Accounts, Payees, and Notes, with an option to expand into a full tabular results view with column sorting.

---

### 5.4 Bookmarks & Reusable Templates
- **Key Views & Components**:
  - Bookmarks & Reusable Templates Hub
- **Purpose**: Serves as the central repository for saved reusable transaction templates (e.g. daily coffee, regular groceries, recurring monthly rent), enabling one-tap pre-filled transaction entry.
- **Elements**:
  - Header bar with back chevron (`←`) and title (`Bookmarks`).
  - Instructional registration card explaining bookmark creation workflow: "How to register Bookmark? Please select the contents in Trans. tab. There are Delete and Copy, Bookmark, Edit button. Tap Bookmark button and it shall be registered."
  - Saved template list container displaying registered template cards with: template title, category emoji and name, default account badge, pre-set amount, and quick-apply trigger button.
  - Global persistent navigation component.
- **Content vs. placeholder**:
  - Spec data: Header title `Bookmarks`, instructional onboarding card text.
  - Example data: Saved template items.
- **States**:
  - Zero-template state shown (instructional card displayed).
  - Populated state (inferred): List of saved template cards with action triggers.
- **Expected behavior**:
  - Tapping an existing bookmark template opens the Add Transaction form pre-populated with that template's category, account, amount, and note parameters.
  - Swiping a template card reveals options to Rename, Edit Default Values, or Delete Bookmark.
  - Tapping `←` returns to Transactions Hub.
- **Navigation**:
  - Entry: Tapping the Bookmark star icon (`⭐`) in the Transactions Hub header.
  - Exits: `←` returns to Transactions Hub; template tap opens Add Transaction form with pre-filled fields.
- **Responsive & Viewport Adaptation (Mobile & Desktop)**:
  - Mobile: Single-column card list with swipe actions.
  - Desktop: Multi-column grid of bookmark tiles (2–3 columns) with direct "Quick Log" buttons, allowing users to record frequent transactions with a single click.

---

### 5.5 Multi-Dimensional Transaction Filter System
- **Key Views & Components**:
  - Multi-Dimensional Filter Modal
  - Filtered Monthly Summary View
  - Filtered Calendar View
  - Filtered Daily Transactions Feed
- **Purpose**: Provides a compound multi-dimensional filtering engine allowing users to isolate transactions across income categories, expense categories, and accounts, with live ratio donut meters, persisting an active filter banner across Daily, Calendar, and Monthly views.
- **Elements**:
  - Filter modal header with period navigator (`< Aug 2026 >`) and dismiss button (`✕`).
  - Informational prompt label: "Select items that you want to filter."
  - Visual ratio meter widgets:
    - Income donut gauge with filtered percentage (e.g., `0%`) and volume total.
    - Expenses donut gauge with filtered percentage (e.g., `0%`) and volume total.
    - Net Total balance metric.
  - Filter dimension tabs: `INCOME`, `EXPENSES`, `ACCOUNT`.
  - Master checkbox: `All` with dual-column headers for `Income / Expenses` and `Transfer-In / Transfer-Out`.
  - Itemized filter list grouped by classification (Cash, Accounts, Card, Debit Card, Investments), where each account row displays checkboxes and dual financial volume lines.
  - Modal action buttons: `[ Reset ]`, `[ Select All ]`, `[ Filter ]`.
  - Persistent top filter-active header banner across views in dark theme with period navigator and clear filter button (`✕`).
  - Sticky criteria banner across feeds displaying: comma-separated list of active filtered entities (e.g., `Cash Wallet, Primary Checking, Rewards Credit Card`) and an `[ Edit ]` shortcut button.
  - Filtered view presentations: Filtered Daily Feed , Filtered Calendar Grid , and Filtered Monthly 12-month summary table .
  - Primary Add Transaction button (`+`).
- **Content vs. placeholder**:
  - Spec data: Tab titles (`INCOME`, `EXPENSES`, `ACCOUNT`), dual-line account metric format, ratio gauges, filter banner format with `✕` and `[ Edit ]` button.
  - Example data: Account balances, spending totals, and filtered amounts for August 2026.
- **States**:
  - Filter Modal open with Account dimension active.
  - Filter active state reflected across Daily, Calendar, and Monthly views.
  - Inferred states: Indeterminate master checkbox (some items selected), Zero matches under active filter ("No transactions match the selected filters. [Clear Filters]").
- **Expected behavior**:
  - Tapping dimension tabs switches between Income Categories, Expense Categories, and Accounts.
  - Tapping individual checkboxes toggles filtering inclusion for that entity.
  - Donut gauges and percentages dynamically update to reflect the proportion of selected volume against the overall monthly totals.
  - Tapping `[ Filter ]` persists active criteria into the filter store and applies the filter across Daily, Calendar, and Monthly views.
  - Tapping `[ Reset ]` clears all active filter selections.
  - When a filter is active in any view, tapping `✕` in the top header clears the filter immediately and restores full data.
  - Tapping `[ Edit ]` in the bottom criteria banner re-opens the Filter Modal with existing selections preserved.
- **Navigation**:
  - Entry: Tapping the Filter icon (`⚙️`) in any Transactions Hub view.
  - Exits: `✕` dismisses modal without applying; `[ Filter ]` applies criteria and updates the active view; `✕` on filter banner clears filter; `[ Edit ]` reopens filter modal.
- **Responsive & Viewport Adaptation (Mobile & Desktop)**:
  - Mobile: Full-screen modal overlay with bottom action buttons; feeds render sticky top filter banner and bottom criteria pill.
  - Desktop: Collapsible filter sidebar or docked filter panel embedded directly beside transaction feeds. Filter criteria render as dismissible tag chips at the top of the feed (e.g. `[ Cash Wallet ✕ ] [ Primary Checking ✕ ] [ Clear All ]`), updating the data table reactively without modal interruptions.

---

## 6. Module 2: Transaction Logging, Sheets & Engine

This module governs the creation, modification, and duplication of financial records across Expenses, Incomes, and Inter-Account Transfers, alongside the automated Recurring Schedule Engine.

### 6.1 Expense Logging Flow
- **Key Views & Components**:
  - Expense Logging Form & Custom Numpad
  - Expense 2-Column Category & Subcategory Selector Sheet
  - Expense 3-Column Account Grid Selector Sheet
  - Expense Note Field Active Focus
  - Expense Note Real-Time Autocomplete Suggestions
  - Expense Camera/Gallery Receipt Action Sheet
  - Expense Receipt Photo Thumbnails & Delete Controls
- **Purpose**: Provides a high-speed data capture interface for logging out-of-pocket expenses, utilizing a custom arithmetic keypad, hierarchical category selectors, multi-column account grids, real-time note autocomplete, and receipt photo attachments.
- **Elements**:
  - View header with back navigation chevron (`←`), title (`Expense`), and template bookmark trigger (`⭐`).
  - Transaction type segmented pill switcher: `Income`, `Expense` (selected with red theme accent), `Transfer`.
  - Form input fields:
    - Date field displaying formatted date-time (`DD/MM/YY (Day) HH:MM`, e.g. `02/09/26 (Wed) 14:56`) with a recurring schedule shortcut button (`Rep/Inst.`).
    - Amount field with red active focus indicator and currency symbol.
    - Category selector field displaying parent category and optional subcategory.
    - Account selector field displaying source payment account.
    - Note memo text field with clear button (`(x)`).
    - Multiline Description text area with camera receipt attachment trigger (`📷`).
  - Custom arithmetic numpad component:
    - Keypad header bar with title `Amount`, currency selector globe icon, and dismiss button (`✕`).
    - Keypad grid: Digits `0-9`, decimal point (`.`), backspace (`⌫`), subtraction operator (`-`), inline calculator trigger (`🧮`), and prominent `Done` action button (solid red).
  - Two-column hierarchical Category Sheet:
    - Primary column: Parent expense categories with icon badges (`🍔 Food & Dining`, `🏠 Housing & Utilities`, `🚗 Transportation`, `🛍️ Shopping & Lifestyle`, `🏥 Health & Medical`, `🎬 Entertainment & Leisure`).
    - Secondary column: Dynamic list of child subcategories belonging to the active parent category (e.g. for `Food & Dining`: `Groceries`, `Restaurants`, `Coffee & Cafes`, `Food Delivery`).
    - Sheet header with title (`Category`), edit categories shortcut icon (`✏️`), and close button (`✕`).
  - Responsive 3-Column Account Grid Sheet:
    - Header with title (`Accounts`), grid/list layout toggle icon, edit accounts shortcut icon (`✏️`), and close button (`✕`).
    - Account tile grid displaying active registered accounts: `Cash Wallet`, `Primary Checking`, `High-Yield Savings`, `Rewards Credit Card`, `Everyday Debit Card`, `Brokerage & Investments`, `Auto Loan`, `Health Insurance`, `Term Life Insurance`.
  - Floating autocomplete suggestion chip container displaying matching historical memo entries (e.g., `Weekly supermarket groceries`).
  - Receipt acquisition action sheet with options: `Camera` (camera capture via Web MediaDevices / HTML5 file capture) and `Gallery` (system photo picker).
  - Receipt photo thumbnail preview row showing attached images side-by-side with individual delete overlay buttons (`✕`).
  - Primary form action buttons: `[ Save ]` (solid red theme) and `[ Continue ]` (outline style).
- **Content vs. placeholder**:
  - Spec data: Field names (`Date`, `Amount`, `Category`, `Account`, `Note`, `Description`), format `DD/MM/YY (Day) HH:MM`, keypad buttons, two-column category layout, 3-column account grid layout, camera action options, `Save` and `Continue` buttons.
  - Dynamic vs. configured data: Form timestamp defaults to current date-time; amount, category, account, note memo, and receipt photos are entered dynamically by the user.
- **States**:
  - Initial active state: Amount field focused with custom numpad open.
  - Category / Account selection states: Respective bottom sheets open over dimmed form.
  - Note typing state: Real-time autocomplete suggestions container active.
  - Attachment states: Zero attachments, 1 to 3 photo thumbnails attached with delete icons.
  - Validation error state: Required field highlight (e.g. "Please select a Category and Account before saving").
- **Expected behavior**:
  - Tapping keypad buttons appends numbers or decimal points to Amount; tapping `🧮` activates arithmetic mode (`+`, `-`, `*`, `/`) for inline math.
  - Tapping `Done` or `✕` hides keypad and advances focus to Category.
  - In Category sheet, tapping a parent category updates the subcategory column; tapping a subcategory sets the category, closes the sheet, and advances focus to Account.
  - In Account sheet, tapping an account selects it, closes the sheet, and advances focus to Note.
  - Typing in Note triggers debounced autocomplete; tapping a suggestion chip auto-fills the field.
  - Tapping `📷` opens the photo action sheet; capturing/selecting an image adds a thumbnail preview (max 3 receipts).
  - Tapping `[ Save ]` persists the expense record, decrements the source account balance, updates monthly aggregates in PocketBase, and returns to previous feed.
  - Tapping `[ Continue ]` persists the record and resets the form for rapid batch entry.
- **Navigation**:
  - Entry: Tapping Add Transaction (`+`) from any feed or ledger view.
  - Exits: `←` prompts confirmation if dirty and returns to feed; `Save` persists and returns; `Continue` persists and resets; `Rep/Inst.` opens Recurrence Menu; `⭐` registers bookmark.
- **Responsive & Viewport Adaptation (Mobile & Desktop)**:
  - Mobile: Fixed vertical layout with custom bottom numpad and slide-up selection sheets.
  - Desktop: Centered modal dialog or slide-out drawer (max-width 580px). Fully supports desktop physical keyboard inputs (numeric keypad, Tab to cycle fields, Enter to save, Esc to dismiss) alongside mouse clicks. Category and account pickers render as combobox popovers directly anchored to their fields.

---

### 6.2 Income Logging Flow
- **Key Views & Components**:
  - Income Logging Form & Blue Themed Numpad
  - Income Category Selector Sheet
  - Income Destination Account Grid Sheet
  - Income Note Autocomplete Suggestions
- **Purpose**: Captures inbound revenues, earnings, and debt paydown deposits into an account using an income-specific blue visual identity, income category selector, and deposit destination grid.
- **Elements**:
  - View header matching Section 6.1 with title (`Income`).
  - Segmented pill switcher with `Income` selected (blue theme accent).
  - Form input fields matching Section 6.1, with `Account` labeled as destination deposit account.
  - Custom arithmetic numpad matching Section 6.1, with blue theme accents.
  - Income Category Sheet:
    - Primary column: Default income categories (`💰 Salary / Wages`, `💼 Business & Freelance`, `📈 Investments`, `🎁 Gifts & Grants`, `💵 Other Income`).
    - Secondary column: Child subcategories (empty if none defined).
    - Header with title (`Category`), edit shortcut (`✏️`), and close button (`✕`).
  - Destination Account Grid Sheet: Reuses the 3-column account grid component from Section 6.1, listing asset accounts (`Primary Checking`, `High-Yield Savings`, `Cash Wallet`) and liability accounts (`Auto Loan` for debt paydown).
  - Note field with autocomplete suggestion chips matching Section 6.1.
  - Action buttons: Primary `[ Save ]` (blue solid theme) and Secondary `[ Continue ]` (outline).
- **Content vs. placeholder**:
  - Spec data: Title `Income`, blue color scheme tokens (`Set A`), master income categories, destination account designation.
  - Example data: Date `02/09/26 (Wed) 15:02`, category `Salary / Wages`, notes `Monthly salary direct deposit`.
- **States**:
  - Initial active state with Amount focused and blue numpad open.
  - Category / Account selection sheets active.
  - Inferred states: Matching Section 6.1.
- **Expected behavior**:
  - Identical data entry behavior to Section 6.1, except that saving increments the destination account balance and adds to aggregate monthly Income totals.
  - If a liability account is selected as destination (e.g. `Auto Loan`), saving reduces the negative liability debt balance accordingly.
- **Navigation**:
  - Entry: Tapping `+` and selecting `Income`, or switching to `Income` pill from Expense/Transfer form.
  - Exits: `Save` persists and returns; `Continue` persists and resets; `Rep/Inst.` opens Recurrence Menu.
- **Responsive & Viewport Adaptation (Mobile & Desktop)**:
  - Same adaptive shell rules as Section 6.1, utilizing blue theme tokens.

---

### 6.3 Inter-Account Transfer Flow
- **Key Views & Components**:
  - Transfer Form Initial & Fees Badge
  - Transfer Amount Entered State
  - Transfer Fees Field & Keypad
  - Transfer Account Selector Sheet
  - Transfer Completed Form & Account Swap
- **Purpose**: Executes an atomic double-entry fund transfer between two owned accounts, providing source/destination account selectors, bidirectional swap controls, and an optional transaction fee surcharge row with a dedicated fees keypad.
- **Elements**:
  - View header matching Section 6.1 with title (`Transfer`).
  - Segmented pill switcher with `Transfer` selected (neutral/charcoal dark theme accent).
  - Form input fields:
    - Date field with `Rep/Inst.` shortcut.
    - Amount field with an inline `[ Fees ]` button on the right edge.
    - Dedicated `Fees` input row expanded directly under Amount with active underline and dismiss button (`✕`).
    - `From` source account selector field.
    - `To` destination account selector field.
    - Bidirectional account swap button (`↑↓`) positioned between From and To rows.
    - Note memo field with clear button (`(x)`).
    - Multiline Description area with camera attachment trigger (`📷`).
  - Source/Destination Account Grid Sheet: Reuses the 3-column account grid component from Section 6.1, visually dimming the opposing selected account to prevent identical From/To assignments.
  - Custom arithmetic numpad matching Section 6.1, with header title dynamically switching between `Amount` and `Fees`.
  - Action buttons: Primary `[ Save ]` (charcoal dark theme) and Secondary `[ Continue ]`.
- **Content vs. placeholder**:
  - Spec data: Field titles `From`, `To`, `Fees` badge, swap button `↑↓`, dark theme buttons, dual-account transfer schema.
  - Dynamic vs. configured data: Principal transfer amount, optional fee surcharge, source/destination accounts, and memo notes are provided by user entry.
- **States**:
  - Initial active state: Amount focused with `[ Fees ]` button visible.
  - Fees active state: Dedicated `Fees` row open with numpad titled `Fees`.
  - Completed valid state: Both accounts selected with amount and note filled.
  - Inferred validation error state: Same account selected for From and To (Save blocked: "Source and destination accounts must be different").
- **Expected behavior**:
  - Tapping `[ Fees ]` expands the dedicated Fees row and switches numpad focus to calculate surcharges.
  - Tapping `✕` on the Fees row removes the fee surcharge entirely.
  - Tapping `↑↓` swaps From and To accounts instantaneously.
  - Tapping From or To opens the Account Grid Sheet.
  - **Accounting Invariant**: On Save, debits $(M + \text{Fee})$ from `From` account, credits $M$ to `To` account, records $\text{Fee}$ as an expense debit, and does not alter monthly Income/Expense aggregates.
- **Navigation**:
  - Entry: Tapping `+` and selecting `Transfer`, or switching to `Transfer` pill from Expense/Income form.
  - Exits: `Save` executes atomic transfer and returns to feed; `Continue` executes and resets for next transfer.
- **Responsive & Viewport Adaptation (Mobile & Desktop)**:
  - Mobile: Fixed vertical layout with bottom numpad.
  - Desktop: Centered modal dialog featuring two side-by-side account cards (`From` account card on left, animated directional arrow `→` in center with swap button, `To` account card on right).

---

### 6.4 Recurring Transactions & Repeat Engine
- **Key Views & Components**:
  - Recurrence Type Selection Context Menu
  - Recurrence Frequency List
  - Central Recurring Rules Management Hub
- **Purpose**: Manages automated recurring schedules across Expenses, Incomes, and Transfers, supporting 13 interval frequencies (including dynamic month-end logic), configurable posting reflection timing, and a central rule management hub.
- **Elements**:
  - Recurrence popover context menu triggered from `Rep/Inst.` button, displaying options: `Repeat` and `Installment` (marked as excluded from Phase 1 scope).
  - Recurrence frequency selection list with 14 options: `Nothing`, `Every Day`, `Weekdays`, `Weekend`, `Every Week`, `Every 2 weeks`, `Every 4 weeks`, `Every Month`, `The end of the month`, `Every 2 Month`, `Every 3 Month`, `Every 4 Month`, `Every 6 Month`, `Annually`.
  - Central Recurring Rules Management Hub:
    - Header bar with back chevron (`←`), title (`Repeat Setting`), delete icon (`🗑`), and add rule button (`+`).
    - Global timing configuration row: `Timing of reflection` with value navigation trigger (`On the date >`).
    - Grouped recurring rules sections (`Expenses`, `Transfer`, `Income`) with section subtotal sums.
    - Recurring rule item cards displaying: Next execution date (`DD/MM/YY`), frequency interval (`Every Month`), rule title (`Monthly Rent`, `Auto Loan EMI`, `Retirement Savings Contribution`), account/category path, and formatted amount.
  - Global persistent navigation component.
- **Content vs. placeholder**:
  - Spec data: All 14 recurrence frequency intervals, `Timing of reflection` options (`On the date`, `In advance`), section categories (`Expenses`, `Transfer`, `Income`).
  - Dynamic vs. configured data: Recurring schedules, frequency intervals, auto-posting rules, and amounts are configured dynamically by the user.
- **States**:
  - Populated rules hub shown.
  - Inferred states: Zero recurring rules registered ("No recurring schedules configured. Tap + to set one up."), Batch delete mode active (selection checkboxes beside rules).
- **Expected behavior**:
  - Selecting `Repeat` opens the frequency list; tapping an interval attaches the recurring schedule rule to the active transaction.
  - Selecting `The end of the month` automatically computes the last calendar day across leap years and variable month lengths (28th, 29th, 30th, or 31st).
  - Tapping `Timing of reflection` toggles between `On the date` (auto-posts on scheduled day) and `In advance` (posts 1–3 days early for cashflow forecasting).
  - In the central hub, tapping a rule opens its schedule editor; deleting a rule stops future automated entries without altering historical transactions.
  - Tapping `+` in the hub opens a blank transaction form with recurrence pre-enabled.
- **Navigation**:
  - Entry: Tapping `Rep/Inst.` shortcut on Date row in any transaction form, or accessed via `More > Configuration > Repeat Setting`.
  - Exits: Selecting frequency returns to transaction creator; `←` in central hub returns to Configuration menu.
- **Responsive & Viewport Adaptation (Mobile & Desktop)**:
  - Mobile: Full-screen interval list and grouped vertical rules feed.
  - Desktop: Recurring schedule control table with columns for Type, Name, Frequency, Next Execution Date, Source/Destination, Amount, Active Switch Toggle, and Row Actions.

---

## 7. Module 3: Analytics & Visual Intelligence (`Stats`)

The Analytics & Visual Intelligence module transforms transaction ledger data into graphical intelligence, featuring multi-period donut distributions, interactive slice callouts, ranked categorical spend tables, and 12-month category deep-dive trend curves.

### 7.1 Categorical Spending & Income Breakdowns
- **Key Views & Components**:
  - Monthly Expense Donut & Ranked Category List
  - Donut Interactive Slice Highlight & Tooltip
  - Period Granularity Dropdown
  - Weekly Expense Donut & Ranked Category List
  - Annual Expense Donut & Ranked Category List
- **Purpose**: Visualizes the proportional distribution of spending or earnings across categories across configurable time horizons (Weekly, Monthly, Annually, Custom Period) using an interactive donut chart paired with a ranked categorical breakdown list.
- **Elements**:
  - Period navigator with previous and next period chevrons (`<`, `>`) and active period label (e.g. `< Aug 2026 >`, `< 26.07.26 ~ 01.08.26 >`, `< 2026 >`).
  - Period granularity dropdown trigger displaying active selection (`Weekly ⌄`, `Monthly ⌄`, `Annually ⌄`, `Period ⌄`).
  - Anchored granularity dropdown menu featuring 4 options: `Weekly`, `Monthly`, `Annually`, `Period`.
  - Dimension toggle bar switching between `Income` (displaying total aggregate income volume for the period) and `Expenses` (selected with red theme underline, displaying total aggregate expense volume for the period).
  - Multi-colored interactive donut chart component:
    - External leader lines and percentage callouts pointing to slices showing category name and dynamically computed percentage share.
    - Interactive slice offset animation on tap/hover.
    - Pinned touch-friendly inspection callout tooltip displaying category emoji, name, and dynamically computed expenditure amount.
  - Ranked category breakdown list sorted descending by spending amount, where each item displays:
    - Color-coded percentage badge (e.g., `68%`, `13%`, `6%`, `4%`).
    - Category emoji icon and name (`🏠 Housing & Utilities`, `🍔 Food & Dining`, `🚗 Transportation`, `🛍️ Shopping & Lifestyle`, `🎬 Entertainment & Leisure`).
    - Formatted total spend displaying calculated category volume with currency symbol.
    - Synchronized visual highlight when corresponding donut slice is active.
  - Global persistent navigation component.
- **Content vs. placeholder**:
  - Spec data: Period formats (`Weekly`, `Monthly`, `Annually`, `Period`), dimension toggle schema, donut chart callout structure, ranked list row format, inspection badge pattern.
  - Dynamic vs. configured data: Donut slice angles, percentage callouts, and ranked list totals are dynamically calculated from transactions within the active time window.
- **States**:
  - Populated breakdown state shown across Monthly, Weekly, and Annual horizons.
  - Slice highlighted state: Selected slice exploded with pinned inspection badge.
  - Inferred states: Zero-transaction period (displays empty grey donut ring with "No financial activity recorded for this period"), Negative spend / refund state (0% badge with negative amount, e.g. Health refund).
- **Expected behavior**:
  - Tapping previous/next chevrons shifts the period window by 1 week, 1 month, or 1 year depending on active granularity.
  - Tapping the period dropdown opens granularity options; selecting an option immediately recalculates all statistics and charts.
  - Tapping dimension tabs toggles between Income and Expense category breakdowns.
  - Tapping any slice in the donut chart explodes the slice, renders the pinned inspection callout badge, and scrolls the ranked list to highlight the matching category row.
  - Tapping any row in the ranked list navigates directly to the Category Deep-Dive view (Section 7.2).
- **Navigation**:
  - Entry: Tapping `Stats` tab in the global persistent navigation bar.
  - Exits: Category row tap opens Category Deep-Dive (Section 7.2); period dropdown opens granularity picker.
- **Responsive & Viewport Adaptation (Mobile & Desktop)**:
  - Mobile: Vertically stacked layout with the donut chart pinned above the scrolling ranked list; touch-friendly inspection badge.
  - Desktop: Side-by-side analytics dashboard. The left pane presents an expanded donut chart with center totals and legend; the right pane displays the sortable ranked category table with comparative change indicators (% vs prior period) and inline sparklines. Granularity renders as an inline tab group in the top command bar.

---

### 7.2 Category Deep-Dive & Historical Trend Curves
- **Key Views & Components**:
  - Category Expense Deep-Dive, 12-Month Curve & Feed
  - Category Income Deep-Dive, 12-Month Curve & Feed
- **Purpose**: Provides deep granular inspection for a single selected category (expense or income), displaying subcategory distributions, a continuous 12-month historical progression curve, and an itemized transaction feed.
- **Elements**:
  - View header with back chevron (`←`), category icon and title (`🍔 Food & Dining` or `💰 Salary / Wages`), and period navigator (`< Aug 2026 >`).
  - Top summary metric banner displaying total calculated balance for the selected category within the period: `Total Balance: [Currency Symbol] [Amount]`.
  - Subcategory distribution breakdown list with percentage shares:
    - Master row: `All: 100% ₹ [Total]` (highlighted when all subcategories are included).
    - Subcategory rows displaying computed percentage share badge, subcategory name, and calculated subcategory total amount.
  - Historical 12-month trend line chart:
    - Y-axis: Scaled currency intervals (`0`, `10k`, `20k`, `30k`).
    - X-axis: 12-month labels (`Jan` through `Dec`).
    - Continuous trend curve: Color-coded line (red for expenses, blue for income) with interactive circular data point nodes tracking monthly category spending.
  - Itemized transaction list filtered to this category for the active month, grouped by date:
    - Day group header with day number, day-of-week, date stamp, and daily subtotal.
    - Transaction cards showing subcategory, account badge, and amount.
- **Content vs. placeholder**:
  - Spec data: Subcategory distribution list schema, 12-month curve coordinates and axes, filtered daily transaction list pattern.
  - Example data: Food & Dining breakdown (`Groceries`, `Restaurants`, `Coffee & Cafes`, `Food Delivery`), Salary income data for August 2026.
- **States**:
  - Populated category state with `All` selected.
  - Inferred states: Filtered subcategory state (tapping a specific subcategory like `Dinner` filters both the 12-month trend line and the transaction feed below to Dinner transactions only).
- **Expected behavior**:
  - Tapping a subcategory row toggles filtering on the 12-month trend curve and transaction list.
  - Tapping any data point node on the line chart displays that month's exact expenditure in an inspection tooltip.
  - Tapping any transaction in the list opens its Transaction Details/Edit form.
  - Tapping `←` returns to the main Stats breakdown.
- **Navigation**:
  - Entry: Tapping any category row from Section 7.1.
  - Exits: `←` returns to Stats; transaction card tap opens Transaction Edit form.
- **Responsive & Viewport Adaptation (Mobile & Desktop)**:
  - Mobile: Single-column vertically scrollable layout.
  - Desktop: Two-column master-detail layout. The left pane presents the subcategory breakdown list and 12-month trend chart; the right pane displays the full tabular list of matching transactions with sorting and quick edit actions.

---

## 8. Module 4: Accounts, Assets & Net Worth (`Accounts`)

The Accounts module manages the complete balance sheet of the user, calculating consolidated net worth across liquid assets, investments, and debt liabilities, providing dedicated statements per account, and supporting custom ordering and visibility rules.

### 8.1 Net Worth Overview & Aggregate Analytics
- **Key Views & Components**:
  - Accounts Classification & Consolidated Net Worth
  - Total Stats Net Worth Curve & Comparative Cashflow Bars
  - Accounts Header Options Menu
- **Purpose**: Displays the user's consolidated balance sheet and net worth progression, organizing all registered financial accounts into 11 classification groups, providing long-term trajectory charts, and offering centralized account administration actions.
- **Elements**:
  - Header bar with title (`Accounts`), total analytics shortcut icon (`📊`), and options menu trigger (`⋮`).
  - Consolidated Net Worth summary strip displaying:
    - `Assets` (blue text, sum of all asset accounts).
    - `Liabilities` (red text, sum of credit cards, loans, and overdrafts).
    - `Total` Net Worth (bold black text, calculated as Assets minus Liabilities).
  - Account classification group sections with computed group subtotal rollups:
    - Group `Cash`: Displays computed subtotal of all liquid cash accounts, with item rows for registered cash holdings (e.g. `Cash Wallet`, `Emergency Cash`).
    - Group `Accounts`: Displays computed subtotal of bank checking accounts, with item rows for registered checking accounts (e.g. `Primary Checking`, `Secondary Checking`).
    - Group `Savings`: Displays computed subtotal of savings accounts, with item rows for interest-bearing deposits (e.g. `High-Yield Savings`).
    - Group `Card`: Displays credit card accounts with dual-column tracking for statement `Balance Payable` and current `Outst. Balance` (e.g. `Rewards Credit Card`).
    - Group `Debit Card`: Displays debit cards linked directly to checking accounts with zero balance carry-over (e.g. `Everyday Debit Card`).
    - Group `Investments`: Displays computed subtotal of investment portfolios, with item rows for investment holdings (e.g. `Brokerage & Mutual Funds`).
    - Group `Loan`: Displays liability accounts in red text with negative balances deducted from net worth (e.g. `Auto Loan`).
    - Group `Insurance`: Displays registered insurance policies tracked for premium payments and benefit coverage.
    - Additional supported groups: `Top-Up/Prepaid`, `Overdrafts`, `Others`.
  - Contextual anchored dropdown menu displaying options: `Add`, `Show/Hide`, `Delete`, `Modify Orders`.
  - Total Stats visual analytics view featuring:
    - Net Worth Trajectory Curve (Line chart): Continuous line with node markers plotting historical net worth balance across months (`Apr` to `Sept`).
    - Monthly Comparative Cashflow (Bar chart): Dual vertical bars per month comparing Total Credits/Income (blue) vs Total Debits/Disbursements (red).
  - Global persistent navigation component.
- **Content vs. placeholder**:
  - Spec data: Three net worth metrics (Assets, Liabilities, Total), classification group titles, dual-column credit card structure, group subtotal rollups, options menu items, dual chart schema.
  - Dynamic vs. configured data: Account balances and group totals are dynamically calculated from ledger history; account names and classifications are configured by the user.
- **States**:
  - Populated account sheet state shown.
  - Options menu open state shown.
  - Total stats view populated state shown.
  - Inferred states: Zero accounts state (onboarding prompt with "Add your first account" CTA), Collapsed group state (tapping group header collapses its accounts).
- **Expected behavior**:
  - Tapping any individual account row opens that account's Daily Ledger Statement (Section 8.2).
  - Tapping `📊` opens the Total Stats visual analytics view.
  - Tapping `⋮` opens the Accounts Options Menu (`Add`, `Show/Hide`, `Delete`, `Modify Orders`).
  - Tapping any classification group header collapses or expands its constituent accounts.
  - In Total Stats, tapping data nodes reveals exact monthly inflow/outflow deltas in an inspection tooltip.
- **Navigation**:
  - Entry: Tapping `Accounts` in the global persistent navigation bar.
  - Exits: Account row tap opens Account Details (Section 8.2); `📊` opens Total Stats; `Add` opens Group Selector (Section 8.3); `Show/Hide` opens Visibility Settings (Section 8.5); `Modify Orders` opens Reordering (Section 8.5).
- **Responsive & Viewport Adaptation (Mobile & Desktop)**:
  - Mobile: Single-column scrollable feed with collapsible group accordions.
  - Desktop: Multi-column balance sheet grid. The top summary spans an executive metric card (Net Worth, Total Assets, Total Liabilities, Debt-to-Asset Ratio); the content area renders account groups as distinct cards with direct inline action menus (`+ Transaction`, `View Ledger`, `Settings`).

---

### 8.2 Individual Account Ledger & Performance
- **Key Views & Components**:
  - Individual Account Daily Statement & Ledger
  - Individual Account Historical Performance Stats
- **Purpose**: Delivers a dedicated bank-style monthly statement and itemized transaction ledger for a single selected account, tracking running balances after each transaction alongside historical balance curves and cashflow comparisons.
- **Elements**:
  - Header bar with back chevron (`←`), account title (e.g. `Primary Checking` or `Rewards Credit Card`), and period navigator (`< Aug 2026 >`).
  - Account sub-tab switcher: `Daily`, `Monthly`, `Annually`.
  - Statement period bar displaying:
    - Statement range label: `Statement DD.MM.YY ~ DD.MM.YY`.
    - Action icons: Performance Analytics shortcut (`📊`) and Edit Account Info shortcut (`✏️`).
  - 4-metric statement summary strip:
    - `Deposit` (blue sum of inflows).
    - `Withdrawal` (red sum of disbursements).
    - `Total` net period cashflow.
    - `Balance` running closing balance (orange/bold).
  - Itemized daily grouped transactions list:
    - Group header: day number, day-of-week, date stamp, daily deposits, and daily withdrawals.
    - Transaction cards displaying category emoji/name, account badge, amount, and **running balance tag** reflecting the account balance after the transaction occurred (e.g. `(Balance: [Amount])`).
  - Single Account Historical Performance Analytics:
    - Account Balance Trajectory (Line chart) tracking the account's closing balance over preceding months.
    - Account Cashflow Distribution (Bar chart) comparing monthly deposits/payments (blue) versus charges/withdrawals (red) for this specific account.
    - List toggle shortcut icon to return to itemized ledger.
  - Primary Add Transaction action button (`+`).
  - Global persistent navigation component.
- **Content vs. placeholder**:
  - Spec data: 4-metric statement summary (Deposit, Withdrawal, Total, Balance), statement range format, running balance tag pattern `(Balance ...)`, single account dual charts.
  - Example data: Checking transactions and Credit Card statement numbers.
- **States**:
  - Populated ledger state shown.
  - Populated single account stats state shown.
  - Inferred states: Zero transactions in statement period ("No transactions recorded for this account during this period"), Overdrawn/negative balance (rendered in red with warning indicator).
- **Expected behavior**:
  - Tapping cycle chevrons navigates between statement billing cycles.
  - Tapping any transaction row opens the Transaction Edit view with this account pre-selected.
  - Tapping `📊` toggles between the itemized ledger and the single account performance charts.
  - Tapping `✏️` opens Account Info configuration (Section 8.4).
  - Tapping `+` opens Add Transaction form with this account pre-selected.
- **Navigation**:
  - Entry: Tapping any account card on Accounts Overview (Section 8.1).
  - Exits: `←` returns to Accounts Overview; `✏️` opens Account Info; `+` opens Transaction Creator.
- **Responsive & Viewport Adaptation (Mobile & Desktop)**:
  - Mobile: Single-column scrollable statement with sticky statement summary.
  - Desktop: Full tabular bank statement interface with columns for Date, Category, Description/Payee, Deposit (+), Withdrawal (-), Running Balance, and Action buttons. A side panel provides account details and monthly stats simultaneously.

---

### 8.3 Account Creation & Reconciliation
- **Key Views & Components**:
  - 11 Account Classification Groups Select Modal
  - Add Account Creation Form
  - Record Difference Confirmation Dialog
- **Purpose**: Guides the creation of new financial accounts through classification group selection, initial balance configuration, and double-entry reconciliation (offering to create an income transaction to preserve ledger parity).
- **Elements**:
  - Classification Group Select Modal displaying the 11 supported groups:
    1. `Cash`
    2. `Accounts`
    3. `Card`
    4. `Debit Card`
    5. `Savings`
    6. `Top-Up/Prepaid`
    7. `Investments`
    8. `Overdrafts`
    9. `Loan`
    10. `Insurance`
    11. `Others`
  - Add Account Creation Form fields:
    - `Group`: Assigned classification group name.
    - `Name`: Text input with active focus and underline.
    - `Amount`: Numeric field displaying currency symbol and initial balance (defaulting to zero).
    - `Description`: Multiline memo input.
    - Primary action button: `[ Save ]` (solid red theme).
  - Record Difference Confirmation Dialog:
    - Dialog prompt: "The difference is registered on your account details, Would you like to record the difference as an income?"
    - Dialog action buttons: `NO` (plain text) and `YES` (red action text).
- **Content vs. placeholder**:
  - Spec data: 11 canonical group names, Add Account fields (`Group`, `Name`, `Amount`, `Description`), confirmation dialog message and button choices.
  - Dynamic vs. configured data: Account name, assigned classification group, opening balance, and optional notes are entered by the user.
- **States**:
  - Group modal open state.
  - Add Account form active state with Name focused.
  - Confirmation dialog open state over numpad.
- **Expected behavior**:
  - Selecting a group in the modal immediately navigates to the Add Account form with that group assigned.
  - Tapping Amount opens the arithmetic numpad to enter an initial balance.
  - Tapping `[ Save ]` validates that Name is non-empty.
  - If a non-zero initial amount was entered, it prompts the Record Difference Confirmation Dialog:
    - Tapping `YES`: Sets the baseline balance and generates an initial balance transaction categorized as "Income" with today's date, maintaining double-entry ledger parity.
    - Tapping `NO`: Sets the account balance directly without creating an income transaction.
- **Navigation**:
  - Entry: Selecting `Add` from Accounts Options Menu (Section 8.1).
  - Exits: Confirming dialog saves to PocketBase and returns to Accounts Overview; `←` cancels creation.
- **Responsive & Viewport Adaptation (Mobile & Desktop)**:
  - Mobile: Centered modal dialogs and full-screen form view.
  - Desktop: Centered modal wizard (max-width 540px) combining group selection and account configuration into a smooth 2-step stepper dialog.

---

### 8.4 Group-Specific Account Configuration (`Account Info`)
- **Key Views & Components**:
  - Credit Card Configuration & Statement Dates
  - Credit Card Details & Billing Dates
  - Cash Account Configuration Info
  - Debit Card Configuration & Linked Bank Account
  - Loan / Liability Configuration & Negative Amount Invariant
- **Purpose**: Configures group-specific properties, billing cycles, linked accounts, and accounting rules across Credit Cards, Liquid Cash, Debit Cards, and Loan Liabilities.
- **Elements**:
  - View header with back chevron (`←`), title (`Account Info`), and delete action icon (`🗑`).
  - Universal account fields: Group name, Account name, Amount with currency selector (`₹`), Description.
  - `Include in totals` toggle switch (controls inclusion in Consolidated Net Worth).
  - `Show/Hide` setting row with eye icon indicator (`👁`).
  - Group-specific specialized controls:
    - **Credit Card Accounts**:
      - `Settlement Date`: Recurring monthly statement closing day (e.g. `Every 1`).
      - `Payment Date`: Recurring monthly payment due day (e.g. `Every 1`).
      - Dual statement summary container: `Balance Payable` (`01/08 ~ 31/08 (Pay: 01/09)`) and `Outst. Balance` (`01/09 ~ 30/09 (Pay: 01/10)`).
    - **Debit Card Accounts**:
      - `Payment`: Dropdown binding to a linked checking or savings Bank Account.
      - Non-carryover informational card explaining zero-accumulation policy.
    - **Loan / Liability Accounts**:
      - Mandatory negative amount validation rule.
      - Prominent liability instruction warning text: "In case of loan account, please input negative(-) amount to set it as a liability. If you register without '-' on the amount field, the amount will be added up on your asset."
  - Primary action button: `[ Save ]` (solid red theme).
- **Content vs. placeholder**:
  - Spec data: Group-specific fields (`Settlement Date`, `Payment Date`, `Balance Payable`, `Outst. Balance`, `Payment` link), non-carryover notice text, loan negative amount warning text.
  - Example data: `Rewards Credit Card`, `Cash Wallet`, `Everyday Debit Card`, `Auto Loan` records.
- **States**:
  - Populated configuration state shown for each respective account type.
  - Inferred states: Delete confirmation dialog ("Are you sure you want to delete this account? Existing transactions will need reassignment."), Invalid positive loan amount warning state.
- **Expected behavior**:
  - In Credit Card accounts, selecting Settlement Date and Payment Date updates billing cycle calculations.
  - In Debit Card accounts, selecting a linked bank account directs all debit card charges to debit the parent bank account atomically.
  - In Loan accounts, the form enforces a negative amount prefix; positive values trigger an alert warning that assets will be incorrectly inflated.
  - Toggling `Include in totals` to OFF excludes this account from Net Worth without removing ledger history.
  - Tapping `Save` persists configuration to PocketBase.
- **Navigation**:
  - Entry: Tapping `✏️` in Account Details header (Section 8.2).
  - Exits: `Save` persists and returns; `🗑` triggers deletion confirmation flow.
- **Responsive & Viewport Adaptation (Mobile & Desktop)**:
  - Mobile: Single-column vertically scrollable form.
  - Desktop: Multi-column configuration panel where general properties sit on the left, and specialized rules (settlement schedules, linked bank accounts, liability amortization) render on the right.

---

### 8.5 Account List Management & Organization
- **Key Views & Components**:
  - Account Display Reordering / Modify Orders
  - Account Visibility Show/Hide Settings
- **Purpose**: Customizes the presentation order and visibility of accounts across selection sheets, dropdowns, and overview ledgers without permanently deleting records.
- **Elements**:
  - Modify Orders view:
    - Header bar in dark theme with back chevron (`←`), title (`Modify Orders`), and reorder chevrons: Move Up (`⌃`) and Move Down (`⌄`).
    - Grouped account list matching Section 8.1 classification groups.
    - Selected account row highlight in red text with checkmark indicator (`✓`) on the right edge.
  - Show/Hide Settings view:
    - Header bar in dark theme with back chevron (`←`) and title (`Show/Hide Setting`).
    - Grouped list of accounts with current balances and interactive eye icon visibility toggle (`👁`).
  - Global persistent navigation component.
- **Content vs. placeholder**:
  - Spec data: Reorder chevrons (`⌃`, `⌄`), selection checkmark `✓`, eye icon toggle component (`👁` visible, `👁‍🗨` hidden).
  - Example data: Account balances and group listings.
- **States**:
  - Modify Orders: Account selected state.
  - Show/Hide: All accounts visible state.
  - Inferred states: Account hidden state (eye icon rendered as slashed eye with account row dimmed), Topmost/bottommost item selected (appropriate chevron disabled).
- **Expected behavior**:
  - In Modify Orders, tapping an account selects it; tapping `⌃` or `⌄` moves it up or down within its group.
  - In Show/Hide Settings, tapping the eye icon toggles the account between Visible and Hidden. Hidden accounts are omitted from transaction creator pickers and daily feeds while preserving historical records and net worth math.
  - All changes persist immediately to user preferences in PocketBase.
- **Navigation**:
  - Entry: Selecting `Modify Orders` or `Show/Hide` from Accounts Options Menu (Section 8.1).
  - Exits: `←` returns to Accounts Overview with updated ordering and visibility reflected.
- **Responsive & Viewport Adaptation (Mobile & Desktop)**:
  - Mobile: Full-screen list with touch buttons.
  - Desktop: Drag-and-drop sortable list with interactive grab handles (`⠿`) beside each account tile, with bulk visibility switch toggles.

---

## 9. Module 5: Settings, Master Data & Configuration (`More`)

The Settings module controls application parameters, master category data, visual themes, currency definitions, security locks, and user profile management.

### 9.1 Settings Navigation Hub
- **Key Views & Components**:
  - Settings 9-Tile Navigation Hub & User Profile
- **Purpose**: Acts as the primary configuration directory, displaying the user's profile card and a 3x3 grid of functional settings domains.
- **Elements**:
  - Header bar with title (`Settings`) and client application version stamp (`4.12.8 AD`).
  - User profile summary card containing: avatar placeholder, user display name, and user email address.
  - 3x3 functional navigation tile grid featuring icon and title pairs:
    1. `Configuration` (gear icon): General preferences, billing cycles, input orders.
    2. `Accounts` (coins icon): Direct shortcut to Accounts & Net Worth manager.
    3. `Passcode` (unlocked padlock icon): 4-digit PIN lock and biometric security.
    4. `CalcBox` (calculator icon): Financial calculators and loan amortization tools.
    5. `PC Manager` (desktop monitor icon): Web client connection and desktop sync portal.
    6. `Backup` (restore arrow icon): Cloud sync trigger, JSON exports, and file backups.
    7. `Feedback` (envelope icon): User support and feature suggestions form.
    8. `Help` (question mark icon): FAQs, documentation, and user guides.
    9. `Recommend` (thumbs up icon): App sharing trigger.
  - Global persistent navigation component.
- **Content vs. placeholder**:
  - Spec data: 9 settings domains, version indicator format, user profile card structure.
  - Example data: Version number `4.12.8 AD`, profile avatar skeleton.
- **States**:
  - Authenticated user state shown.
  - Inferred states: Passcode active (padlock icon renders locked `🔒`).
- **Expected behavior**:
  - Tapping any tile navigates to its respective management screen.
  - Tapping `Configuration` opens the Configuration Hub (Section 9.3).
  - Tapping the user profile card opens user account profile editing.
- **Navigation**:
  - Entry: Tapping `More` in the global persistent navigation bar.
  - Exits: Tapping tiles navigates to specific settings sub-screens.
- **Responsive & Viewport Adaptation (Mobile & Desktop)**:
  - Mobile: 3x3 grid with touch tiles.
  - Desktop: Expanded settings hub where the 9 domains are organized into categorized sidebar navigation links (`Preferences`, `Master Data`, `Security`, `System`), with sub-setting forms rendering in the main view pane.

---

### 9.2 Master Category & Subcategory Management
- **Key Views & Components**:
  - Master Income Category Management
  - Master Expense Category Management
  - Category Subcategory Detail Management
- **Purpose**: Manages master income and expense categories and child subcategories, supporting category creation, renaming, deletion guards, custom reordering, and a global subcategory master toggle.
- **Elements**:
  - Header bar with back chevron (`←`), title (`Income Category` or `Expenses Category`), and add category shortcut (`+`).
  - Master configuration row: `Subcategory` with a global toggle switch (shown `ON`).
  - Itemized category management rows displaying:
    - Delete action icon: Red minus button (`⛔`) on the left edge.
    - Category icon and name: `💰 Salary / Wages`, `💼 Business & Freelance`, `📈 Investments`, `🍔 Food & Dining (4)`, `🏠 Housing & Utilities (6)`.
    - Subcategory preview subtitle for expense categories: Comma-separated list of child subcategories (e.g. `Groceries, Restaurants, Coffee & Cafes, Food Delivery`).
    - Edit action icon: Pencil (`✏️`) to rename category or change emoji.
    - Reorder drag handle: Hamburger icon (`☰`) on the right edge.
  - Subcategory Detail Management view:
    - Header with back chevron (`←`), parent category icon/name (`🍔 Food & Dining`), edit parent icon (`✏️`), and add subcategory button (`+`).
    - Itemized subcategory list with delete button (`⛔`), subcategory name, edit pencil (`✏️`), and drag handle (`☰`).
  - Global persistent navigation component.
- **Content vs. placeholder**:
  - Spec data: Subcategory toggle switch, category row schema with count badges and subtitle previews, edit and delete controls, reorder handles.
  - Example data: Category emojis and names.
- **States**:
  - Populated category list state shown.
  - Inferred states: Subcategory OFF (subcategories hidden throughout transaction logging forms), Delete confirmation dialog (confirming category deletion with transaction reassignment guard).
- **Expected behavior**:
  - Tapping `+` opens a modal to name a new category and assign an emoji icon.
  - Toggling `Subcategory` to OFF hides all child subcategories across transaction entry sheets.
  - Tapping a category row in Expense Category Settings navigates to its Subcategory Detail Management view.
  - In Subcategory view, tapping `+` adds a new child subcategory name.
  - Tapping `✏️` renames categories or subcategories.
  - Tapping `⛔` prompts deletion confirmation: if historical transactions reference this category, the user must reassign them to another category before deletion proceeds.
  - Dragging `☰` reorders items vertically, persisting display ordering to PocketBase.
- **Navigation**:
  - Entry: Accessed via `More > Configuration > Income/Expenses Category Setting` or from `✏️` on Category sheets.
  - Exits: `←` returns to previous screen; tapping an expense category opens its Subcategory Detail view.
- **Responsive & Viewport Adaptation (Mobile & Desktop)**:
  - Mobile: Full-screen list with touch drag handles.
  - Desktop: Two-pane master-detail view where parent categories sit on the left, and the selected category's subcategories render on the right for instant editing.

---

### 9.3 Application Preferences & Customization
- **Key Views & Components**:
  - Configuration Hub & Category/Repeat Shortcuts
  - General Financial Preferences
  - Advanced Input, Passcode & Reminder Preferences
- **Purpose**: Provides a centralized preferences engine governing financial calculation cycles, base currencies, input ordering, visual themes, security passcodes, and daily reminders.
- **Elements**:
  - Header bar with back chevron (`←`) and title (`Configuration`).
  - Grouped preferences sections and configurable rows:
    - **Category/Repeat**:
      - `Income Category Setting` (navigates to Section 9.2).
      - `Expenses Category Setting` (navigates to Section 9.2).
      - `Subcategory` master toggle (`ON`).
      - `Budget Setting` (navigates to Budget configuration).
      - `Repeat Setting` (navigates to Section 6.4).
    - **Configuration (General Financial Preferences)**:
      - `Main Currency Setting`: Active base currency (e.g. `INR (₹)`).
      - `Sub Currency Setting`: Secondary currency with custom exchange rates.
      - `Start Screen (Daily/Calendar)`: Initial view upon opening the app (`Daily` or `Calendar`).
      - `Monthly Start Date`: Monthly billing cycle start date (`Every 1`, `Every 5`, `Every 25`, etc.).
      - `Weekly Start Day`: Weekly start day (`Sunday` or `Monday`).
      - `Carry-over Setting`: Carries forward net month balances (`OFF` or `ON`).
      - `Swipe`: Gesture assignment (`To Change Date` or `To Change Tab`).
      - `Income-Expenses Color Setting`: Visual color scheme (`Set. A` [Income=Blue, Expense=Red] vs `Set. B` [Income=Red, Expense=Blue]).
      - `Time Input`: Date-time timestamping behavior (`Input Only, Desc.` vs `Auto-Stamp Current Time`).
      - `Show description`: Multiline descriptions in feeds (`OFF` or `ON`).
      - `Autocomplete`: Live suggestion chips in note fields (`ON` or `OFF`).
      - `Input order`: Initial field focus when opening transaction form (`From Amount` vs `From Category`).
      - `Note button setting`: Standalone note button in bottom bar (`OFF` or `ON`).
    - **Other (Security & Reminders)**:
      - `Passcode`: App lock configuration (`OFF` or `ON`, supporting 4-digit PIN and WebAuthn / biometrics).
      - `Alarm Setting`: Daily reminder notification (`ON` or `OFF`, scheduling daily reminder at set hour via Web Push Notifications / Service Worker background sync).
  - Global persistent navigation component.
- **Content vs. placeholder**:
  - Spec data: All preference field names, value formats, and available configuration options.
- **States**:
  - Standard configuration view shown across scrolled positions.
- **Expected behavior**:
  - Tapping `Monthly Start Date` opens day selector (`Every 1` to `Every 28`) which dynamically shifts monthly ledger window calculations (e.g. 25th to 24th of next month).
  - Tapping `Income-Expenses Color Setting` toggles theme tokens across all charts and feeds.
  - Tapping `Passcode` opens PIN setup workflow (4-digit keypad with confirmation).
  - Tapping `Alarm Setting` configures reminder time (e.g., `21:00`) and requests notification permissions.
  - All setting mutations immediately update Zustand application state and sync to PocketBase user record.
- **Navigation**:
  - Entry: Tapping `Configuration` from Settings Menu (Section 9.1).
  - Exits: Tapping rows opens specific setting pickers or sub-screens; `←` returns to Settings Menu.
- **Responsive & Viewport Adaptation (Mobile & Desktop)**:
  - Mobile: Vertically scrolling grouped settings list.
  - Desktop: Categorized settings sidebar with tabbed panels (General, Display & Gestures, Accounting & Currencies, Categories & Rules, Security).
