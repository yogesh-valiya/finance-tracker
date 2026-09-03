# Money Manager (Expense Tracker) - Project Specification

> **Document Version**: 1.1.0
> **Target Platform**: Mobile-First Progressive Web App (PWA) & Android Native APK (via Capacitor 6+)
> **Backend Service**: PocketBase (Authentication, SQLite WAL, REST APIs, S3, Cron Hooks)
> **Frontend Stack**: React 18, TypeScript, Vite, React Router v6, Tailwind CSS, Zustand
> **Mobile Bridge**: Capacitor 6+ (Camera, Biometrics, Local Notifications, Filesystem, Share, App State, Deep Linking, Status Bar)
>
> **Governance**: Architecture, styling, and core rules are enforced via `.agents/rules/` (Antigravity) — see `001-styling.md`, `002-development-standards.md`, and `003-creative-design-thinking.md` (always_on), along with `011-financial-math.md`, `012-capacitor-mobile-ux.md`, and `013-performance-and-feeds.md`. This document defines *what* to build; those files define *how* it must be built. Do not restate or override them here.

---

## Table of Contents
1. [Product Overview & Core Principles](#1-product-overview--core-principles)
2. [Authentication, User Onboarding & Access Control](#2-authentication-user-onboarding--access-control)
3. [Persistent Navigation Framework](#3-persistent-navigation-framework)
4. [Module 1: Transactions Hub (`Trans.`)](#4-module-1-transactions-hub-trans)
   - [4.1 Sub-Tab 1: Daily Transactions Feed (`Daily`)](#41-sub-tab-1-daily-transactions-feed-daily)
   - [4.2 Sub-Tab 2: Calendar View & Day Inspection Drawer (`Calendar`)](#42-sub-tab-2-calendar-view--day-inspection-drawer-calendar)
   - [4.3 Sub-Tab 3: Monthly Summary & Annual Breakdown (`Monthly`)](#43-sub-tab-3-monthly-summary--annual-breakdown-monthly)
   - [4.4 Sub-Tab 4: Total & Account Overview (`Total`)](#44-sub-tab-4-total--account-overview-total)
   - [4.5 Sub-Tab 5: Note Journal Feed (`Note`)](#45-sub-tab-5-note-journal-feed-note)
   - [4.6 Search, Auto-Suggestions & Search Results](#46-search-auto-suggestions--search-results)
   - [4.7 Bookmarks & Reusable Templates](#47-bookmarks--reusable-templates)
   - [4.8 Multi-Dimensional Transaction Filter System](#48-multi-dimensional-transaction-filter-system)
   - [4.9 Expense Transaction Logging (`Expense`)](#49-expense-transaction-logging-expense)
   - [4.10 Income Transaction Logging (`Income`)](#410-income-transaction-logging-income)
   - [4.11 Inter-Account Transfer Logging (`Transfer`)](#411-inter-account-transfer-logging-transfer)
   - [4.12 Recurring Transactions & Repeat Engine (`Repeat`)](#412-recurring-transactions--repeat-engine-repeat)
5. [Module 2: Analytics & Visual Intelligence (`Stats`)](#5-module-2-analytics--visual-intelligence-stats)
6. [Module 3: Accounts, Assets & Net Worth (`Accounts`)](#6-module-3-accounts-assets--net-worth-accounts)
   - [6.1 Consolidated Net Worth & Classification Overview](#61-consolidated-net-worth--classification-overview)
   - [6.2 Total Accounts Analytics & Trend Curves (`Total Stats`)](#62-total-accounts-analytics--trend-curves-total-stats)
   - [6.3 Individual Account Ledger & Statement (`Account Details`)](#63-individual-account-ledger--statement-account-details)
   - [6.4 Individual Account Statistics & Historical Performance](#64-individual-account-statistics--historical-performance)
   - [6.5 Account Configuration & Group-Specific Rules (`Account Info`)](#65-account-configuration--group-specific-rules-account-info)
   - [6.6 Add Account Creation Wizard & Group Selection](#66-add-account-creation-wizard--group-selection)
   - [6.7 Account Visibility & Show/Hide Settings](#67-account-visibility--showhide-settings)
   - [6.8 Account Display Reordering (`Modify Orders`)](#68-account-display-reordering-modify-orders)
   - [6.9 Account Deletion & Dependency Reconciliation](#69-account-deletion--dependency-reconciliation)
7. [Module 4: Settings, Master Data & Configuration (`More`)](#7-module-4-settings-master-data--configuration-more)
8. [Financial Accounting Rules & Business Logic](#8-financial-accounting-rules--business-logic)
9. [PHASE 2 Roadmap](#9-phase-2-roadmap)

---

## 1. Product Overview & Core Principles

The **Money Manager Expense Tracker** is a mobile-first personal finance platform providing double-entry bookkeeping, multi-account net worth tracking, automated recurring transactions, and categorical spending analytics.

### Core Functional Tenets
1. **Strict Login-Only Policy**: Data is private; authenticated session is strictly required before accessing any financial screen. No unauthenticated/guest access.
2. **Double-Entry Financial Accuracy**: Incomes, expenses, and transfers update real-time account balances, classification groupings, liabilities, and net worth.
3. **Built-in Arithmetic Numpad**: Currency fields include an embedded arithmetic numpad supporting inline multi-step equations (`+`, `-`, `*`, `/`) with live evaluation.
4. **Hierarchical Categorization**: Two-tier structure (Main Categories + Subcategories) with optional global subcategory toggle.
5. **Multi-Account & Multi-Group Architecture**: Supports 11 account groups (Cash, Bank Accounts, Credit Cards [statement payable vs outstanding], Debit Cards, Savings, Prepaid, Investments, Overdrafts, Loans, Insurance, Others).
6. **Search, Filter & Bookmark Templates**: Real-time keyword search with auto-suggestions, multi-dimensional matrix filters, and one-tap reusable bookmark templates.

### 1.1 Creative Design Thinking & UI/UX Standards (Rule 003 Summary)
- **Design Thinking Over Blind Copying**: Treat reference images, sketches, and mockups as functional blueprints and intent specifications—NOT as rigid pixel templates to slavishly clone. Understand the *why* behind the layout, then elevate the execution with modern UX patterns, superior ergonomics, and thoughtful polish.
- **Data Density with Visual Clarity**:
  - **High Information Scent & Scannability**: Maximize usable data density on mobile viewports (360–430px) without clutter. Group related metrics logically, use subtle borders/dividers, and establish clear typographic contrast.
  - **Glanceable Intelligence**: Use smart visual cues (status pills, trend indicators, micro-progress bars, category color accents) so users understand financial state in milliseconds.
  - **Tabular & Aligned Presentation**: Always align numerical and monetary values with `tabular-nums` and right-alignment for effortless vertical comparison.
- **Proactive & Comprehensive State Design**:
  - Never design only the "happy path" shown in a reference image.
  - Creatively design and handle all operational states: zero/empty states (with helpful onboarding CTAs), loading skeletons matching exact dense layouts, inline error validations, search miss states, and partial/extreme data values (e.g. very large balances, long category names with ellipsis).
- **Modern Mobile & PWA Interaction Patterns**:
  - **Tactile Micro-Interactions**: Incorporate snappy active states, subtle transitions, and intuitive feedback for touches and gestures.
  - **Ergonomic Action Placement**: Place frequent primary actions (e.g., Quick Add, Filter Chips, Numpad buttons) within easy thumb reach.
  - **Contextual Workflows**: Use full-height bottom sheets, progressive disclosure, and contextual menus rather than burying actions in nested modals or confusing navigation trees.
- **Harmonious Innovation within Design System Rules**:
  - Creative enhancements must strictly respect the shadcn component library (`.agents/rules/001-styling.md`), mobile spacing invariants (`.agents/rules/004-spacing-and-density.md`), and financial arithmetic integrity (`.agents/rules/011-financial-math.md`).
  - Do NOT introduce decorative fluff, oversized margins, or gratuitous whitespace that degrades data density. Innovation must serve clarity, speed, and user utility.

---

## 2. Authentication, User Onboarding & Access Control

### 2.1 Sign-In & Session Control
- **Gated Access**: Unauthenticated sessions redirect immediately to Sign-In.
- **Methods**: Email/Password validation, Social Login (Google), and "Forgot Password?" email reset link.
- **Session Persistence**: Sessions remain authenticated across app restarts/backgrounding until explicit sign-out.

### 2.2 Registration & Default Master Data Seeding
- **Form Fields**: Full Name, Email, Password, Password Confirmation, Base Currency (default `INR ₹`).
- **Automatic Master Data Seeding**:
  - **Default Accounts**: `Cash` (Group: Cash), `Accounts` / `Bank Account` (Group: Accounts).
  - **Default Income Categories**: `Allowance`, `Salary`, `Petty cash`, `Bonus`, `Other`.
  - **Default Expense Categories & Subcategories**:
    - `Food`: *Lunch, Dinner, Eating out, Beverages*
    - `Social Life`: *Friend, Fellowship, Alumni, Dues*
    - `Pets`
    - `Transport`: *Bus, Subway, Taxi, Car*
    - `Culture`: *Books, Movie, Music, Apps*
    - `Household`: *Appliances, Furniture, Kitchen, Toiletries, Chandlery, Rent*
    - `Apparel`: *Clothing, Fashion, Shoes, Laundry*
    - `Beauty`: *Cosmetics, Makeup, Accessories, Beauty*
    - `Health`: *Health, Yoga, Hospital, Medicine*
    - `Education`: *Schooling, Textbooks, School supplies, Academy*
    - `EMI`: *Car Loan, Home Loan*
    - `Gift`, `Other`

### 2.3 Secondary App Lock (Passcode & Biometrics)
- Configurable 4-digit PIN lock or native biometrics (Fingerprint / FaceID) prompted upon returning to foreground.

---

## 3. Persistent Navigation Framework

Standard 4-tab bottom navigation bar across all top-level sections:
1. **`Trans.` (Transactions Hub)**: Daily, Calendar, Monthly, Total, Note feeds + Search, Filter, Bookmarks, and Transaction Creator.
2. **`Stats` (Analytics & Intelligence)**: Donut charts, ranked category lists, historical trend curves (Weekly, Monthly, Annual, Custom).
3. **`Accounts` (Assets & Net Worth)**: Balance sheet categorizing assets, credit liabilities, debit cards, investments, loans, and insurance.
4. **`More` (Settings & Configuration)**: Categories, recurring rules, currency preferences, backups, and app settings.

---

## 4. Module 1: Transactions Hub (`Trans.`)

Top sub-tabs: `Daily` | `Calendar` | `Monthly` | `Total` | `Note`.

### 4.1 Sub-Tab 1: Daily Transactions Feed (`Daily`)
<p align="center">
  <img src="screens/trans_01_daily_transactions_jul_2026.jpg" alt="Daily Feed Jul 2026" width="300" />
</p>

- **Period Bar**: `< Month Year >` chevrons + month/year picker wheel.
- **Header Actions**: Bookmarks (`⭐`), Search (`🔍`), Filter (`⚙️`).
- **Monthly Summary Strip**: `Income` (blue), `Expenses` (red), `Total` (`Income - Expenses`).
- **Date Group Header**: Day number, Day badge (`Fri`), `MM.YYYY`, and Daily Income/Expense totals.
- **Transaction Card**: Category icon + Name + Subcategory, Note memo, Account badge, Formatted amount (color-coded).
- **Interactions**: Tap card to Edit/View, horizontal swipe to cycle months, fixed `+` FAB to add transaction.
- **Active Filter Banner**: Sticky bottom bar displaying active filter criteria with `[Edit]` shortcut.

### 4.2 Sub-Tab 2: Calendar View & Day Inspection Drawer (`Calendar`)
<p align="center">
  <img src="screens/trans_02_calendar_view_aug_2026.jpg" alt="Calendar View" width="300" />
  <img src="screens/trans_03_day_transaction_details_aug_12.jpg" alt="Day Drawer" width="300" />
</p>

- **Calendar Grid**: Standard monthly grid (Sunday/Monday first). Cells display Day #, Income (blue line), Expense (red line), Net Balance (black line). Selected day is highlighted.
- **Day Inspection Bottom Drawer**: Opens on date tap. Shows date header, daily totals, note shortcut, itemized chronological transactions, `<` `>` day navigation, `+` FAB, and `Close` button.

### 4.3 Sub-Tab 3: Monthly Summary & Annual Breakdown (`Monthly`)
<p align="center">
  <img src="screens/trans_04_monthly_summary_view_unfiltered.jpg" alt="Monthly Unfiltered" width="300" />
</p>

- **Year Bar**: `< YYYY >` navigation chevrons.
- **Annual Summary**: Full-year Income, Expenses, and Net Savings aggregates.
- **12-Month Table**: Rows for each month with Income (blue), Expenses (red), and Net Difference.
- **Weekly Accordion Drilldown**: Tapping a month row expands weekly breakdown rows (e.g. `16.08 ~ 22.08`) with 7-day totals.

### 4.4 Sub-Tab 4: Total & Account Overview (`Total`)
<p align="center">
  <img src="screens/trans_05_total_account_overview.jpg" alt="Total Overview" width="320" />
</p>

- **Payment Method Metrics**:
  - `Compared Expenses (Last month)`: % spend change vs previous calendar month.
  - `Expenses (Cash, Accounts)`: Aggregate spend from cash and liquid bank accounts.
  - `Expenses (Card, Pay)`: Aggregate spend on credit/debit cards (unbilled card balance in parentheses).
  - `Transfer (Cash, Accounts -> ...)`: Total inter-account transfer volume for the month.
- **Export Data to Excel**: Prominent button generating formatted `.xlsx`/`.csv` (Date, Category, Subcategory, Account, Type, Amount, Note, Description).

### 4.5 Sub-Tab 5: Note Journal Feed (`Note`)
<p align="center">
  <img src="screens/trans_06_note_tab.jpg" alt="Note Feed" width="320" />
</p>

- **Purpose**: Chronological diary displaying only transactions containing a note/memo.
- **Empty State**: Centered graphic with *"No data available."*
- **Feed Card**: Grouped by date; displays category icon, note memo, account badge, amount, and quick note `+` FAB.

### 4.6 Search, Auto-Suggestions & Results
<p align="center">
  <img src="screens/trans_07_transaction_search_suggestions.jpg" alt="Search Suggestions" width="300" />
  <img src="screens/trans_08_search_results_dinner.jpg" alt="Search Results" width="300" />
</p>

- **Search Bar**: Real-time query input with clear `(x)` and filter shortcut.
- **Auto-Suggestions**: Dynamic dropdown matching notes, categories, subcategories, and accounts.
- **Dynamic Header**: Computes matching `Income`, `Expenses`, and `Transfer` totals.
- **Results Feed**: Chronological list; tap any row to open Transaction Details.

### 4.7 Bookmarks & Reusable Templates
<p align="center">
  <img src="screens/trans_09_bookmarks.jpg" alt="Bookmarks Screen" width="320" />
</p>

- **Purpose**: Save reusable transaction templates (e.g., "Morning Coffee", "Rent").
- **Workflow**: Toggle `⭐ Bookmark` on Transaction Details to save. Tapping a template in the Bookmark hub opens a pre-filled Add Transaction form.

### 4.8 Multi-Dimensional Transaction Filter System
<p align="center">
  <img src="screens/trans_10_transaction_filter_modal.jpg" alt="Filter Modal" width="240" />
  <img src="screens/trans_11_filtered_monthly_summary_view.jpg" alt="Monthly Filtered" width="240" />
  <img src="screens/trans_12_filtered_calendar_view.jpg" alt="Calendar Filtered" width="240" />
  <img src="screens/trans_13_filtered_daily_transactions.jpg" alt="Daily Feed Filtered" width="240" />
</p>

- **Tabs**: `INCOME` (by category/subcategory), `EXPENSES` (by category/subcategory), `ACCOUNT` (by account).
- **Widgets**: Visual Ratio Donut (% income vs expenses) and per-account volume breakdowns (income, expense, transfer-in, transfer-out).
- **Actions**: `[ Reset ]`, `[ Select All ]`, `[ Filter ]` (applies matrix across Daily, Calendar, Monthly views).

---

### 4.9 Expense Transaction Logging (`Expense`)

<p align="center">
  <img src="screens/expense_01_form_initial.jpeg" alt="Expense Form Initial" width="180" />
  <img src="screens/expense_02_category_sheet.jpeg" alt="Expense Category Sheet" width="180" />
  <img src="screens/expense_03_account_grid.jpeg" alt="Expense Account Grid" width="180" />
  <img src="screens/expense_04_note_field.jpeg" alt="Expense Note Field" width="180" />
  <img src="screens/expense_05_note_autocomplete.jpeg" alt="Expense Note Autocomplete" width="180" />
  <img src="screens/expense_06_camera_attachment.jpeg" alt="Expense Camera Attachment" width="180" />
  <img src="screens/expense_07_photo_thumbnails.jpeg" alt="Expense Photo Thumbnails" width="180" />
</p>

#### Functional Specification & Field Breakdown:
- **Visual Identity**: Red theme (active tab indicator, input focus line, and primary Save button).
- **Header Bar**:
  - `←` Back chevron (discards unsaved draft or prompts confirmation if modified).
  - Title: Displays `Expense` (updates dynamically if tab changes).
  - `⭐` Star icon: One-tap toggle to save current entry parameters as a reusable bookmark template.
- **Top Segmented Switcher**: `Income` | `Expense` (Selected) | `Transfer`. Seamless switching preserves previously entered common values (Date, Amount, Note).
- **Date & Time Selector**:
  - Format: `DD/MM/YY (Day) HH:MM` (e.g. `02/09/26 (Wed) 14:56`).
  - Tapping opens the interactive Date/Time picker with calendar navigation and time dials.
  - Right-aligned `Rep/Inst.` icon: Quick shortcut to configure a recurring schedule (`Repeat`).
- **Amount Field & Arithmetic Numpad**:
  - Tapping activates red underline focus and reveals the custom arithmetic keypad.
  - Keypad features: `0-9`, decimal `.`, backspace `⌫`, subtract `-`, calculator button `🧮`, currency switch (Globe icon), and red `Done` button.
  - Supports inline multi-step mathematical calculations (e.g. `200 + 45 - 15 = 230`).
- **Category & Subcategory Selector (2-Column Bottom Sheet)**:
  - Header: `Category`, `✏️` Edit shortcut (opens Category Settings), `✕` Close.
  - Left Column: Parent expense categories with icon badges (`🍜 Food`, `🧑‍🤝‍🧑 Social Life`, `🐶 Pets`, `🚖 Transport`, `🖼️ Culture`, `🪑 Household`, etc.) with `>` chevron indicators. If a category icon is removed/not set, renders a fallback tag badge or clean label.
  - Right Column: Dynamic subcategories belonging to the active parent category (e.g. for `Food`: `Lunch`, `Dinner`, `Eating out`, `Beverages`), displaying subcategory custom icon badge if configured.
  - Selection formats the field as `Icon Category/Subcategory` (e.g. `🍜 Food/Dinner`, or `Category/Subcategory` when icons are removed).
- **Account Selector (3-Column Grid Sheet)**:
  - Header: `Accounts`, Layout switch, `✏️` Edit shortcut, `✕` Close.
  - 3-column responsive grid of active accounts (`Cash`, `Wallet`, `SBI Savings`, `AXIS Salary Ac`, `HSBC CC`, `AXIS DC`, `Mutual Fund`, `Car EMI`, `Mediclaim`, `Term Insurance`, etc.).
  - Tapping an account selects the payment source and automatically advances focus to the Note field.
- **Note Field with Live Autocomplete**:
  - Single-line note text input with clear `(x)` button.
  - Real-time floating autocomplete suggestion chips appear below the field based on historical transaction entries (e.g., typing "Family din" suggests "Family dinner").
- **Description & Photo Receipt Attachment**:
  - Multiline description text area for expanded details (e.g. `At Maharaja Resturant`).
  - Camera icon (`📷`): Opens action sheet with `Camera` (capture new photo) and `Gallery` (select existing photo).
  - Attached receipts render as thumbnail previews with `✕` delete buttons directly above the action buttons.
- **Form Actions**:
  - `[ Save ]` (Red Primary Button): Persists the expense record, reduces source account balance, updates ledger/stats, and navigates back.
  - `[ Continue ]` (White Secondary Button): Persists the current transaction and immediately clears amount/note to rapidly record subsequent expenses.
- **Existing Transaction Operations**:
  - `🗑 Delete`: Prompts confirmation, deletes record, and reconciles/restores source account balance.
  - `📄 Duplicate / Copy`: Clones all attributes into a new expense entry form.

---

### 4.10 Income Transaction Logging (`Income`)

<p align="center">
  <img src="screens/income_01_form_initial.jpeg" alt="Income Form Initial" width="220" />
  <img src="screens/income_02_category_sheet.jpeg" alt="Income Category Sheet" width="220" />
  <img src="screens/income_03_account_grid.jpeg" alt="Income Account Grid" width="220" />
  <img src="screens/income_05_note_autocomplete.jpeg" alt="Income Note Autocomplete" width="220" />
</p>

#### Functional Specification & Field Breakdown:
- **Visual Identity**: Blue theme (active tab indicator, input focus line, and primary Save button).
- **Header Bar**: `←` Back chevron, Title `Income`, `⭐` Star icon for bookmarking templates.
- **Top Segmented Switcher**: `Income` (Selected) | `Expense` | `Transfer`.
- **Date & Time Selector**: `DD/MM/YY (Day) HH:MM` format with `Rep/Inst.` shortcut to attach recurring income schedules.
- **Amount Field & Arithmetic Numpad**:
  - Blue focus line; embedded keypad with arithmetic calculation (`+`, `-`, `*`, `/`), currency selector, and blue `Done` button.
- **Category Selector (2-Column Sheet)**:
  - Header includes `✏️` shortcut to manage Income Categories.
  - Default income categories: `🤑 Allowance`, `💰 Salary`, `💵 Petty cash`, `🏅 Bonus`, `Other` (with subcategories if configured).
- **Account Selector (3-Column Grid Sheet)**:
  - Selects the target destination account where income funds are deposited (e.g. `AXIS Salary Ac`, `SBI Savings`, `Cash`, `Car EMI`).
- **Note Field & Autocomplete**:
  - Text input with real-time autocompletion matching past income notes (e.g. typing "Extra Amount", "Freelance bonus").
- **Description & Receipt Attachment**:
  - Multiline description text + Camera (`📷`) shortcut for payslips, invoice receipts, or checks.
- **Form Actions**:
  - `[ Save ]` (Blue Primary Button): Credits the destination account balance, updates monthly income aggregates, and returns to previous feed.
  - `[ Continue ]` (White Secondary Button): Saves current income and retains date/account for consecutive logging.

---

### 4.11 Inter-Account Transfer Logging (`Transfer`)

<p align="center">
  <img src="screens/transfer_01_form_initial.jpeg" alt="Transfer Form Initial" width="180" />
  <img src="screens/transfer_02_amount_entered.jpeg" alt="Transfer Amount Entered" width="180" />
  <img src="screens/transfer_03_fees_field.jpeg" alt="Transfer Fees Field" width="180" />
  <img src="screens/transfer_04_account_grid.jpeg" alt="Transfer Account Grid" width="180" />
  <img src="screens/transfer_05_complete_form.jpeg" alt="Transfer Complete Form" width="180" />
</p>

#### Functional Specification & Field Breakdown:
- **Visual Identity**: Neutral / Dark theme (active tab indicator and dark primary Save button).
- **Accounting Impact**: Executes double-entry fund transfer between two owned accounts without affecting overall monthly income or expense totals.
- **Header Bar**: `←` Back chevron, Title `Transfer`, `⭐` Star icon for bookmarking templates.
- **Top Segmented Switcher**: `Income` | `Expense` | `Transfer` (Selected).
- **Date & Time Selector**: `DD/MM/YY (Day) HH:MM` format with `Rep/Inst.` shortcut.
- **Amount Field & Embedded `[ Fees ]` Button**:
  - Numeric amount input featuring a prominent `[ Fees ]` badge/button on the right edge.
- **Conditional Transfer Fees Row**:
  - Tapping `[ Fees ]` dynamically expands a dedicated `Fees` line directly below Amount with a `✕` dismiss button.
  - The bottom arithmetic numpad updates title to `Fees` for inline surcharge calculation.
  - **Accounting**: Transfer fees are debited from the source account as an expense charge.
- **Dual Account Selectors (`From` and `To`)**:
  - `From` (Source Account): Account debited by the transfer amount (e.g., `AXIS Salary Ac`).
  - `To` (Destination Account): Account credited by the transfer amount (e.g., `Cash`).
  - **Interactive Swap Button (`↑↓`)**: Positioned between `From` and `To` rows; one tap instantly swaps source and destination accounts.
  - Tapping either row opens the 3-column account selector sheet.
- **Note Field & Autocomplete**: Text input with real-time autocompletion (e.g. `Cash withdrawal`, `Credit card bill payment`).
- **Description & Receipt Attachment**: Multiline description text + Camera (`📷`) receipt photo capture.
- **Form Actions**:
  - `[ Save ]` (Dark Primary Button): Executes atomic double-entry balance adjustment ($\text{From} - M - \text{Fee}, \text{To} + M$) and returns to feed.
  - `[ Continue ]` (White Secondary Button): Saves transfer and refreshes form for rapid batch transfers.

---

### 4.12 Recurring Transactions & Repeat Engine (`Repeat`)

<p align="center">
  <img src="screens/repeat_01_context_menu.jpeg" alt="Repeat Context Menu" width="200" />
  <img src="screens/repeat_02_frequency_list.jpeg" alt="Repeat Frequency List" width="200" />
  <img src="screens/repeat_03_frequency_list_advanced.jpeg" alt="Repeat Frequency List Continued" width="200" />
</p>

#### Functional Specification & Recurrence Rules:
- **Access Points**:
  1. **Direct from Transaction Entry**: Tap `Rep/Inst.` shortcut icon on the Date row in Expense, Income, or Transfer forms.
  2. **Central Recurring Hub**: Navigate to `More > Configuration > Repeat Setting` or `Trans. > Recurring Management`.
- **Scope & Constraints**:
  - **Repeat ONLY**: Supports automated recurring transaction schedules across Expenses, Incomes, and Transfers. Installments (`Installment`) are explicitly excluded.
- **Supported Recurrence Intervals (Full Selection List)**:
  - `Nothing`: Disabled / One-off transaction (default).
  - `Every Day`: Fires every calendar day.
  - `Weekdays`: Monday through Friday only.
  - `Weekend`: Saturday and Sunday only.
  - `Every Week`: Weekly on the designated day of the week.
  - `Every 2 weeks`: Bi-weekly interval (every 14 days).
  - `Every 4 weeks`: 28-day cycle.
  - `Every Month`: Monthly on the specific calendar date (e.g., 1st or 15th).
  - `The end of the month`: Dynamically posts on the last calendar day of each month (28th, 29th, 30th, or 31st).
  - `Every 2 Month`: Bi-monthly.
  - `Every 3 Month`: Quarterly.
  - `Every 4 Month`: Quadrimester.
  - `Every 6 Month`: Semi-annually.
  - `Annually`: Yearly recurrence on the specified month & day.
- **Timing of Reflection & Auto-Posting Rules**:
  - `On the date`: The transaction is automatically posted to the active ledger on its scheduled execution date.
  - `In advance`: The transaction is posted 1–3 days prior to the due date to assist with forward balance forecasting.
  - **Auto-Posting Execution**: When the trigger condition is met, the system automatically creates the ledger transaction with pre-configured category, account, amount, and note values.
- **Central Recurring Transaction Management (`Repeat Setting`)**:
  - Displays all registered recurring rules grouped by type (`Expense`, `Income`, `Transfer`) with frequency badges and target accounts.
  - Tap any recurring rule to modify amounts, interval frequencies, or accounts.
  - Delete action (`🗑`) removes recurring schedules without deleting previously generated historical transactions.

---

## 5. Module 2: Analytics & Visual Intelligence (`Stats`)

<p align="center">
  <img src="screens/stats_01_monthly_expenses_breakdown.jpg" alt="Stats Monthly Expenses" width="300" />
  <img src="screens/stats_02_pie_chart_slice_highlight.jpg" alt="Pie Chart Highlight" width="300" />
</p>

### 5.1 Controls & Navigation
- **Period Dropdown**: `Weekly`, `Monthly`, `Annually`, `Period` (Custom date range).
- **Dimension Toggle**: `Expenses` vs `Income`. Navigation via `<` and `>` chevrons.

### 5.2 Interactive Donut / Pie Breakdown
- Multi-colored chart with callouts and percentage labels.
- Tapping a slice applies an animated offset, shows a tooltip (Category, Amount, %), and sync-scrolls/highlights the matching row in the ranked list below.

### 5.3 Ranked Category Breakdown List
- Sorted descending by spend. Rows display color-coded % badge (e.g., `68%`), icon + name, and total amount.

### 5.4 Category Deep-Dive & Historical Trend View
<p align="center">
  <img src="screens/stats_03_category_expense_trends_food.jpg" alt="Food Trends" width="300" />
  <img src="screens/stats_04_category_income_trends_salary.jpg" alt="Salary Trends" width="300" />
</p>

- **Trigger**: Tap any category row in Stats.
- **Content**: Category total spend, Subcategory distribution breakdown with % share, 12-month continuous trend curve (Jan–Dec), and filtered transaction list for the active period.

### 5.5 Period Granularities
<p align="center">
  <img src="screens/stats_05_period_selector_dropdown.jpg" alt="Period Dropdown" width="240" />
  <img src="screens/stats_06_weekly_expense_breakdown.jpg" alt="Weekly Stats" width="240" />
  <img src="screens/stats_07_annual_expense_breakdown.jpg" alt="Annual Stats" width="240" />
</p>

1. **Weekly**: 7-day span (`< 19.07 ~ 25.07 >`), 7-day pie chart, and 7-day deep-dive trend line.
2. **Monthly**: Month span (`< Aug 2026 >`), monthly pie chart, and 12-month annual trend curve.
3. **Annually**: Year span (`< 2026 >`), annual pie chart, and monthly comparison bars.
4. **Custom Period**: Date range (`From [DD.MM.YYYY]` to `To [DD.MM.YYYY]`) with dynamic aggregation.

---

## 6. Module 3: Accounts, Assets & Net Worth (`Accounts`)

<p align="center">
  <img src="screens/account_01_summary_net_worth.jpeg" alt="Accounts Summary" width="260" />
  <img src="screens/account_07_options_menu.jpeg" alt="Accounts Options Menu" width="260" />
  <img src="screens/account_02_total_stats_trends.jpeg" alt="Total Stats Trend Curves" width="260" />
</p>

### 6.1 Consolidated Net Worth & Classification Overview
- **Consolidated Net Worth Header Bar**:
  - `Assets` (Blue text): Aggregate balance sum across all liquid cash, bank checking/savings, debit cards, investments, and prepaid instruments.
  - `Liabilities` (Red text): Total indebtedness across all credit cards, personal loans, overdrafts, and vehicle loans.
  - `Total Net Worth` (Bold text): Computed absolute balance sheet position ($\text{Assets} - \text{Liabilities}$).
- **11 Account Classification Groups**:
  1. `Cash` (Wallets, physical petty cash)
  2. `Accounts` (Savings, Checking, Payroll bank accounts)
  3. `Card` (Credit cards with dual columns for `Balance Payable` and `Outstanding Balance`)
  4. `Debit Card` (Card linked directly to primary bank account; separate non-accumulating tracking)
  5. `Savings` (Dedicated high-yield or emergency funds)
  6. `Top-Up / Prepaid` (Transit cards, digital reloadable wallets)
  7. `Investments` (Mutual funds, stocks, crypto, fixed deposits)
  8. `Overdrafts` (Credit line facilities)
  9. `Loan` (Vehicle loan, home mortgage, personal debt entered as negative liability)
  10. `Insurance` (Term life, health, mediclaim policies)
  11. `Others` (Miscellaneous assets/liabilities)
- **Group Accordion Behavior**: Tapping a classification header collapses or expands its itemized account cards.

---

### 6.2 Total Accounts Analytics & Trend Curves (`Total Stats`)

<p align="center">
  <img src="screens/account_02_total_stats_trends.jpeg" alt="Total Stats" width="300" />
</p>

- **Access Trigger**: Tapping the Chart icon (`📊`) in the top-right header of the main Accounts screen.
- **Top Summary Metric**: Dynamic Total Net Worth Balance (e.g. `₹ 18,38,737.80`).
- **Period Bar**: `< Month Year >` chevrons (e.g. `< Sept 2026 >`) to shift baseline time windows.
- **Visual Analytics Graphs**:
  1. **Net Worth Trajectory Curve (Line Chart)**: Plots the user's total net balance progression across recent months (Apr through Sept).
  2. **Monthly Comparative Cashflow (Bar Chart)**: Dual-colored vertical bars comparing total monthly credits/income (Blue bars) vs disbursements/expenses (Red bars) month-by-month.

---

### 6.3 Individual Account Ledger & Statement (`Account Details`)

<p align="center">
  <img src="screens/account_03_cash_daily_ledger.jpeg" alt="Individual Account Daily Feed" width="300" />
</p>

- **Access Trigger**: Tapping any individual account card from the Accounts summary list.
- **Header Bar**:
  - `←` Back chevron returning to Accounts Overview.
  - Account Title (e.g., `Cash`, `SBI Savings`, `HSBC CC`).
  - Period Navigator: `< Month Year >` (e.g., `< Aug 2026 >`).
- **Granularity Sub-Tabs**:
  - `Daily` (Active default feed)
  - `Monthly` (Aggregated monthly transaction summary for this specific account)
  - `Annually` (12-month annual account performance)
- **Statement Header & 4-Metric Strip**:
  - Statement Period label: `Statement 01.MM.YY ~ DD.MM.YY` (e.g. `Statement 01.08.26 ~ 31.08.26`).
  - Header Action Icons:
    - Statistics Shortcut (`📊`): Opens dedicated performance analytics for this specific account.
    - Edit Shortcut (`✏️`): Opens the `Account Info` form for this account.
  - **4 Summary Metrics**:
    1. `Deposit` (Blue): Total inbound credits and transfers into this account.
    2. `Withdrawal` (Red): Total outbound expenses and transfers disbursed from this account.
    3. `Total` (Black): Net change in account balance during the period ($\text{Deposit} - \text{Withdrawal}$).
    4. `Balance` (Orange/Bold): Running closing balance at the end of the statement window.
- **Daily Grouped Account Ledger**:
  - Group Header: Day number, day of week badge (`Thu`), `MM.YYYY`, daily deposit total (blue), and daily withdrawal total (red).
  - Itemized Transactions: Category icon + name + subcategory, note memo, account badge, transaction amount, and running closing balance tag (`(Balance ...)`).
  - Tap any transaction to open the Transaction Details / Edit modal.
- **Quick Add (`+` FAB)**: Opens Add Transaction screen with this account pre-selected.

---

### 6.4 Individual Account Statistics & Historical Performance

<p align="center">
  <img src="screens/account_04_single_account_stats_hsbc_cc.jpeg" alt="Account Statistics Performance" width="300" />
</p>

- **Access Trigger**: Tapping the Chart icon (`📊`) in the Account Details statement header (e.g. for `HSBC CC`).
- **Account Performance Curves**:
  1. **Account Balance Trajectory (Line Chart)**: Tracks the closing balance trend for this specific account over preceding months.
  2. **Account Cashflow Distribution (Bar Chart)**: Compares monthly deposits/payments (Blue) vs monthly withdrawals/charges (Red) for this specific account.

---

### 6.5 Account Configuration & Group-Specific Rules (`Account Info`)

<p align="center">
  <img src="screens/account_05_info_credit_card.jpeg" alt="Card Info" width="220" />
  <img src="screens/account_06_info_cash.jpeg" alt="Cash Info" width="220" />
  <img src="screens/account_10_info_debit_card.jpeg" alt="Debit Card Info" width="220" />
  <img src="screens/account_12_info_loan_liability.jpeg" alt="Loan Info" width="220" />
</p>

#### Universal Configuration Fields:
- `Group`: Selected account classification group.
- `Name`: Custom user-defined account name (e.g. `Wallet`, `HSBC CC`, `Car EMI`).
- `Amount`: Base/current account balance entered via embedded arithmetic numpad (with currency badge button `₹`).
- `Description`: Multiline memo for account details or bank account numbers.
- `Include in totals` (Toggle Switch): When `OFF`, excludes this account's balance from the Consolidated Net Worth header calculation while keeping transaction feeds intact.
- `Show/Hide Setting` (Eye Toggle `👁`): Sets account visibility in selection sheets and daily feeds.
- `🗑 Delete Action`: Top-right icon to remove account.

#### Group-Specific Business Logic & Fields:
1. **Credit Cards (`Card`)** *(Screenshots: `account_05_info_credit_card.jpeg`, `account_11_info_credit_card_details.jpeg`)*:
   - `Settlement Date`: The monthly statement generation date (e.g. `Every 1`, `Every 15`).
   - `Payment Date`: The payment due date for settling card statement balances (e.g. `Every 1`, `Every 20`).
   - **Statement vs Outstanding Summary Box**:
     - `Balance Payable`: Billed statement balance due for payment (e.g. `01/08 ~ 31/08 (Pay: 01/09)`).
     - `Outst. Balance`: Total outstanding liability including unbilled recent transactions (e.g. `01/09 ~ 30/09 (Pay: 01/10)`).
2. **Debit Cards (`Debit Card`)** *(Screenshot: `account_10_info_debit_card.jpeg`)*:
   - `Payment`: Dropdown linking to the parent bank account (e.g. `AXIS Salary Ac`) from which payments are drawn.
   - **Non-Carryover Policy**: Debit cards track individual card disbursements without carrying over separate asset balances from the linked bank account.
3. **Loans & Liabilities (`Loan`)** *(Screenshot: `account_12_info_loan_liability.jpeg`)*:
   - **Negative Amount Requirement**: Loans must be entered as a negative liability amount (e.g. `₹ -5,47,000.00`). If entered as a positive number, the system warns that the amount will incorrectly be added to assets.
4. **Cash & Liquid Accounts (`Cash`, `Accounts`, `Savings`)** *(Screenshot: `account_06_info_cash.jpeg`)*:
   - Direct asset balance tracking with real-time income, expense, and transfer reconciliation.

---

### 6.6 Add Account Creation Wizard & Group Selection

<p align="center">
  <img src="screens/account_07_options_menu.jpeg" alt="Accounts Options" width="220" />
  <img src="screens/account_08_group_select_modal.jpeg" alt="Select Account Group" width="220" />
  <img src="screens/account_09_add_account_form.jpeg" alt="Add Account Form" width="220" />
  <img src="screens/account_15_record_difference_confirmation_modal.jpg" alt="Record Difference Confirmation" width="220" />
</p>

- **Workflow Steps**:
  1. From `Accounts`, tap top-right Options Menu (`[ ⋮ ]`) $\rightarrow$ Select `Add`.
  2. Select target group from the 11 Account Groups list modal (`account_08_group_select_modal.jpeg`).
  3. Enter Account Name, Initial Balance (using arithmetic numpad), and optional Description (`account_09_add_account_form.jpeg`).
  4. Tap `[ Save ]`.
- **"Record Difference" Confirmation Modal**:
  - *"The difference is registered on your account details. Would you like to record the difference as an income?"*
  - **`[ YES ]`**: Automatically posts an initial balance transaction under the "Income" category for ledger parity.
  - **`[ NO ]`**: Sets baseline account balance directly without creating an income transaction.

---

### 6.7 Account Visibility & Show/Hide Settings

<p align="center">
  <img src="screens/account_14_show_hide_settings.jpeg" alt="Show Hide Settings" width="300" />
</p>

- **Access Point**: `Accounts > [ ⋮ ] > Show/Hide`.
- Displays all registered accounts organized by group with current balances and eye toggles (`👁`).
- Hiding an account removes it from the transaction account pickers and daily feeds while preserving historical records and net worth math.

---

### 6.8 Account Display Reordering (`Modify Orders`)

<p align="center">
  <img src="screens/account_13_modify_orders.jpeg" alt="Modify Orders" width="300" />
</p>

- **Access Point**: `Accounts > [ ⋮ ] > Modify Orders`.
- Tap any account row to select it (indicated by red highlight and checkmark `✓`).
- Use the header chevrons (`⌃` Up / `⌄` Down) to reposition accounts within or across groups to customize display order in sheets and dropdowns.

---

### 6.9 Account Deletion & Dependency Reconciliation
- **Access Point**: `Account Info > 🗑` or `Accounts > [ ⋮ ] > Delete`.
- **Dependency Guard**: If the account contains associated transactions, the system requires reassigning records to another account or confirming cascading deletion before removal.

---

## 7. Module 4: Settings, Master Data & Configuration (`More`)

<p align="center">
  <img src="screens/more_01_settings_menu.jpg" alt="More Menu" width="320" />
</p>

### 7.1 9-Tile Settings Hub
1. **`Configuration`**: Categories, currencies, start dates, input preferences.
2. **`Accounts`**: Accounts & Net Worth manager.
3. **`Passcode`**: Security PIN and biometric unlock.
4. **`CalcBox`**: Dedicated financial calculator tools.
5. **`PC Manager`**: Web/desktop management portal connection.
6. **`Backup`**: Cloud sync, JSON backup/restore, file exports.
7. **`Feedback`**: User feedback submission form.
8. **`Help`**: FAQs and user guides.
9. **`Recommend`**: Share application link.

### 7.2 Master Category & Subcategory Management
<p align="center">
  <img src="screens/more_02_income_category_settings.jpg" alt="Income Settings" width="240" />
  <img src="screens/more_03_expense_category_settings.jpg" alt="Expense Settings" width="240" />
  <img src="screens/more_04_subcategory_settings_food.jpg" alt="Subcategory Settings" width="240" />
</p>

- **Master Category Management (`Income` & `Expense`)**:
  - Add new categories, rename, delete (with transaction cascade/reconciliation safeguards), and reorder via up/down controls.
  - **Custom Icon Selection**: Ability to choose any custom emoji/symbol (via direct text input or from a curated quick-select palette) for each category.
  - **Remove Icon Option**: Dedicated "Remove Icon" action allowing categories to exist with no icon; rendered cleanly with a fallback placeholder tag badge (`🏷️` / `Tag`) or text-only label across feeds and selectors.
- **Subcategory Management**:
  - Subcategory editor per category: Add new subcategories, rename, delete, and reorder.
  - **Subcategory Custom Icon & Remove Option**: Full parity with parent categories—subcategories support choosing a custom icon/emoji or removing the icon completely.
- **Subcategory Master Toggle (`ON`/`OFF`)**: When `OFF`, hides subcategories globally across transaction forms and selectors for simplified single-tier logging.

### 7.3 General Preferences & Customization
<p align="center">
  <img src="screens/more_05_configuration_settings.jpg" alt="Config Top" width="300" />
  <img src="screens/more_06_configuration_settings_general.jpg" alt="Config General" width="300" />
</p>

| Setting Field | Available Options / Behaviors | Default Value |
|---|---|---|
| **Main Currency** | Select primary currency symbol & format (`INR ₹`, `USD $`, `EUR €`, `GBP £`, `JPY ¥`, etc.) | `INR (₹)` |
| **Sub Currency** | Configure secondary foreign currency with custom exchange rates for travel tracking | Disabled |
| **Start Screen** | Default landing sub-tab on launch: `Daily` or `Calendar` | `Daily` |
| **Monthly Start Date** | Monthly billing/salary cycle start day (`Every 1`, `Every 5`, `Every 25`, etc.) | `Every 1` |
| **Weekly Start Day** | First day of the calendar week: `Sunday` or `Monday` | `Sunday` |
| **Carry-over** | `ON`/`OFF` — Carry forward unspent/overspent balances into subsequent months | `OFF` |
| **Swipe Action** | Horizontal gesture action: `To Change Date` (swipes months/weeks) vs `To Change Tab` | `To Change Date` |
| **Color Scheme** | `Set. A` (Income: Blue, Expense: Red) vs `Set. B` (Income: Red, Expense: Blue) | `Set. A` |

### 7.4 Input Preferences & Order Configuration
<p align="center">
  <img src="screens/more_07_configuration_settings_advanced.jpg" alt="Config Advanced" width="320" />
</p>

| Setting Field | Available Options / Behaviors | Default Value |
|---|---|---|
| **Time Input** | `Input Only, Desc.` (manual time selection) vs `Auto-Stamp Current Time` | `Input Only, Desc.` |
| **Show Description** | `ON`/`OFF` — Displays multiline description notes directly in transaction feeds | `OFF` |
| **Autocomplete** | `ON`/`OFF` — Suggests past transaction memos and descriptions while typing | `ON` |
| **Input Order** | `From Amount` (Numpad opens first) vs `From Category` (Category sheet opens first) | `From Amount` |
| **Note Button Setting** | `ON`/`OFF` — Standalone note shortcut button in bottom drawer | `OFF` |

### 7.5 Security, Reminders & Backup
- **Passcode & Biometrics**: 4-digit PIN lock and Fingerprint/FaceID unlock.
- **Daily Reminder / Alarm**: Configurable daily push notification at a designated time (e.g. 21:00).
- **Backup & Export**: Cloud account sync ("Sync Now"), encrypted JSON backup export/restore, and Excel (`.xlsx`) / CSV export.

---

## 8. Financial Accounting Rules & Business Logic

### 8.1 Account Balance Formula
For any account $A$:
$$\text{Current Balance}(A) = \text{Initial}(A) + \sum \text{Income}(A) - \sum \text{Expense}(A) + \sum \text{TransferIn}(A) - \sum \text{TransferOut}(A)$$

### 8.2 Net Worth Computation
$$\text{Total Assets} = \sum_{A \in \{\text{Cash, Accounts, Savings, Debit, Investments, Insurance, Prepaid}\}} \text{Balance}(A)$$
$$\text{Total Liabilities} = \sum_{A \in \{\text{Credit Cards, Loans, Overdrafts}\}} |\text{Balance}(A)|$$
$$\text{Net Worth} = \text{Total Assets} - \text{Total Liabilities}$$

### 8.3 Credit Card Accounting
- **Balance Payable**: Confirmed statement balance due for payment.
- **Outstanding Balance**: Total credit liabilities (billed balance + unbilled recent spend).
- **Payment Settlement**: Transfer from Bank Account to Credit Card decreases Bank balance and reduces Credit Card outstanding liability.

### 8.4 Inter-Account Transfers
- For a transfer of amount $M$ from $A_{\text{src}}$ to $A_{\text{dst}}$:
  $$\text{Balance}(A_{\text{src}}) \leftarrow \text{Balance}(A_{\text{src}}) - M, \quad \text{Balance}(A_{\text{dst}}) \leftarrow \text{Balance}(A_{\text{dst}}) + M$$
- Transfers do not affect aggregate monthly Income or Expense statistics.

---

## 9. PHASE 2 Roadmap

- **Online-Only Operation (Phase 1)**: Live cloud synchronization with network status detection; unsynced changes blocked with an alert if offline. Architectural layers designed for offline sync compatibility.
- **Offline Synchronization (Phase 2)**: Local persistent storage caching, offline mutation queuing, background reconnection sync/replay, and conflict resolution.
- **Strict Login-Only Policy**: Preserved across all phases (no guest access).
