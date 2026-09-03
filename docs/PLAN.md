# Money Manager (Expense Tracker) — Phased Build Plan

> **Plan Version**: 1.2.0  
> **Target Architecture**: Mobile-First PWA & Android Native (Capacitor 6+), React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Zustand, PocketBase (Local Dev Instance & pb_hooks Cron)  
> **Governing Rules**: `.agents/rules/001-styling.md`, `.agents/rules/002-development-standards.md`, `.agents/rules/003-creative-design-thinking.md`, `.agents/rules/011-financial-math.md`, `.agents/rules/012-capacitor-mobile-ux.md`, `.agents/rules/013-performance-and-feeds.md`  
> **Mandatory Phase Workflows**: `.agents/workflows/check-shadcn-compliance.md`, `.agents/workflows/compare-screen-vs-reference.md`  
> **Progress & Audit Directory**: `./progress/` (Logs, Progress Dashboard, and `./progress/screenshots/`)

---

## Executive Summary & Build Strategy

This phased implementation plan deconstructs the **Money Manager** specification (`Requirement.md`) into **9 sequential, independently testable phases**. Each phase produces a complete, functional slice of the application with verified financial math invariants, shadcn/ui design compliance, responsive mobile UX (360–430px viewport), and visual reference parity against the 61 UI screenshots located in `docs/screens/`.

All progress tracking, compliance audit reports, visual review verdicts, and captured browser screenshots are strictly maintained under the `./progress/` directory.

---

## Mobile Design System, Typography & Layout Density Typology

> **Design Objective**: Modern, information-dense, compact mobile architecture inspired by the reference screens (`docs/screens/`). Ensures maximum readability and allows **7–10 items above the fold** on a standard `390×844` viewport while retaining smooth touch targets ($\ge 44\times44\text{px}$) and shadcn tokens.

### 1. Typography Hierarchy & Font Scale
| Element Role | Font Size | Weight & Style | Class Pattern | Usage Context |
|---|---|---|---|---|
| **App & Page Headers (H1)** | `15px–16px` | Bold / Extrabold | `text-base font-bold text-foreground` | Top navigation bar title, drawer titles |
| **Section & Group Headers** | `10.5px–11.5px` | Bold Uppercase | `text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground` | Category sections, account group accordions, settings dividers |
| **Primary Row Titles** | `12px–13px` | Semibold | `text-xs font-semibold text-foreground` | Account names, category names, preference titles |
| **Subtitles / Memos / Previews** | `9.5px–10.5px` | Regular / Medium | `text-[9.5px] text-muted-foreground line-clamp-1` | Subcategory previews, account memos, transaction notes |
| **Financial Currency Numbers** | `11.5px–12.5px` | Bold Monospace | `text-xs font-bold font-mono text-foreground` | Ledger balances, itemized amounts, subtotals |
| **Consolidated Strip Values** | `12px–13.5px` | Extrabold Monospace | `text-xs font-extrabold font-mono` | Net Worth Assets (Blue), Liabilities (Red), Total (Bold) |
| **Micro-Badges & Weekdays** | `9px–10px` | Bold / Semibold | `text-[9.5px] font-semibold px-1 rounded` | Date day badges (`Sat`), active item counts `(4)` |
| **Bottom Navigation Labels** | `10px` | Medium / Semibold | `text-[10px] mt-0.5 tracking-tight` | Persistent 4-tab bar items (`Trans.`, `Stats`, `Accounts`, `More`) |

### 2. Spacing, Heights & Information Density Tokens
| Component / Container | Target Height / Spacing | Padding Pattern | Layout Structure |
|---|---|---|---|
| **Top Header Bar** | `44px–48px` | `px-3.5 py-2.5` | Sticky backdrop blur with action buttons |
| **Bottom Navigation Bar** | `56px` (`h-14`) | `pb-[env(safe-area-inset-bottom)]` | Fixed 4-tab bar with `size-4.5` icons and 10px text |
| **Horizontal Summary Strips** | `40px–52px` | `px-3.5 py-2` | 3-column Net Worth strip, 4-metric statement strip |
| **Unified Table Lists** | `36px–42px` per row | `px-3 py-2` to `px-3.5 py-2.5` | `rounded-xl border bg-card divide-y divide-border/50 overflow-hidden shadow-2xs` |
| **Group Accordion Headers** | `26px–30px` | `px-3.5 py-1.5` | `bg-muted/40` subtle separator with item count & subtotal |
| **Dialogs & Sheet Modals** | Max `85vh` | `p-3.5` padding, `gap-2.5` | Compact modals with `h-8` to `h-9` controls |
| **3×3 Settings Hub Grid** | Compact upper half | `gap-2.5 p-3.5` | Aspect-square tiles with `size-10` icon containers |

### 3. Icon & Control Sizing Tokens
| Control / Icon Element | Container Size | Icon Glyphs | Touch Target & Interaction |
|---|---|---|---|
| **Category & Account Icon Badges** | `size-7` (28×28px) or `size-8` (32×32px) | `size-3.5` to `size-4` | Soft pastel background, rounded-lg, vector or emoji |
| **Row Action Buttons** | `size-7` (28×28px) | `size-3.5` | Ghost/outline buttons for edit, move, delete |
| **Form Inputs & Select Triggers** | `h-7` to `h-9` (28–36px) | `text-xs` font | Right-aligned values, minimal borders in table lists |
| **Toggle Switches** | Compact scale | `Switch` primitive | Right-aligned in unified preference rows |

### 4. Creative Design Thinking & Mobile Data Density Principles (Rule 003 Summary)
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

## Phase Overview Matrix

| Phase | Title | Primary Deliverables | Reference Screens Tested | Progress & Log Artifacts |
|---|---|---|---|---|
| **Phase 0** | **Foundations, Design System & Financial Math Core** | Vite + React + TS setup, Tailwind & shadcn tokens, Router, Local PocketBase singleton & schema migrations, Zustand stores, Math/Parser test suite (100% coverage). | Infrastructure & Base Theme Shell | `./progress/compliance-log.md`<br>`./progress/visual-review-log.md` |
| **Phase 1** | **Authentication, Onboarding & Master Data Seeding** | Sign-In, Sign-Up, Password Reset, Master Data Seeding (Accounts & Categories), Route Guards, PIN/Biometric App Lock. | Auth screens & Session lifecycle | `./progress/compliance-log.md`<br>`./progress/visual-review-log.md` |
| **Phase 2** | **Settings, Master Data & Configuration (`More`)** | 9-Tile Settings Hub, Income/Expense Category & Subcategory Manager (with global toggle), General & Input Preferences, Sub-Currency with manual exchange rates. | `more_01` through `more_07` (7 screens) | `./progress/compliance-log.md`<br>`./progress/visual-review-log.md` |
| **Phase 3** | **Accounts, Assets & Net Worth Management (`Accounts`)** | Net Worth Consolidated Header, 11 Account Groups Accordion, Add Account Wizard, Account Info per group type (Card settlement date, Loan negative balance), Record Difference modal, Reorder & Show/Hide. | `account_01`, `account_05`–`account_15` (13 screens) | `./progress/compliance-log.md`<br>`./progress/visual-review-log.md` |
| **Phase 4** | **Transaction Entry Engine (Expense, Income, Transfer & Numpad)** | Custom Arithmetic Numpad, Expense Form, Income Form, Transfer Form (with Fees & Swap), 2-Col Category Sheet, 3-Col Account Grid, Note Autocomplete, PocketBase Photo Upload with compression. | `expense_01`–`07`, `income_01`–`05`, `transfer_01`–`05` (16 screens) | `./progress/compliance-log.md`<br>`./progress/visual-review-log.md` |
| **Phase 5** | **Transactions Hub Core Feeds (`Trans.`)** | Persistent 4-Tab Bottom Nav, Daily Feed, Calendar View with Day Drawer, Monthly Summary with Weekly Accordion, Total Payment Metrics, Note Journal Feed. | `trans_01` through `trans_06` (6 screens) | `./progress/compliance-log.md`<br>`./progress/visual-review-log.md` |
| **Phase 6** | **Search, Multi-Dimensional Filters, Bookmarks & Recurring Engine** | Real-time Search with dynamic totals, Multi-Dimensional Filter Modal (Ratio Donut, Accounts, Categories), Reusable Bookmarks Hub, PocketBase Cron Recurring Schedules (`Repeat`). | `trans_07`–`13`, `repeat_01`–`03` (10 screens) | `./progress/compliance-log.md`<br>`./progress/visual-review-log.md` |
| **Phase 7** | **Analytics & Visual Intelligence (`Stats` & Account Analytics)** | Donut Chart with slice highlight & ranked list sync, Category 12-mo trend curves, Total Net Worth Stats (`account_02`), Individual Account Details & Stats (`account_03`, `account_04`). | `stats_01`–`07`, `account_02`–`04` (10 screens) | `./progress/compliance-log.md`<br>`./progress/visual-review-log.md` |
| **Phase 8** | **Mobile Native Bridge, Backup/Export, Security & Final Polish** | Android Hardware Back button listener, AppState Foreground Lock, Daily Notification Reminders, JSON Encrypted Backup/Restore, Excel/CSV Export, PWA Manifest. | Full App Verification across all 61 reference screens | `./progress/PROGRESS.md`<br>`./progress/compliance-log.md`<br>`./progress/visual-review-log.md` |

---

## Detailed Phase Breakdown

---

### Phase 0: Foundations, Design System & Financial Math Core

#### 1. What Gets Built
- **Project Scaffolding**: Vite + React 18 + TypeScript build environment with Tailwind CSS and CSS variables for theming.
- **shadcn/ui Foundation**: Install and configure base shadcn components (`button`, `card`, `dialog`, `sheet`, `popover`, `tabs`, `dropdown-menu`, `input`, `form`, `calendar`, `select`, `badge`, `separator`, `switch`, `sonner`, `scroll-area`, `chart`, `accordion`, `radio-group`, `tooltip`, `skeleton`).
- **Design Tokens & Theme System**: Define CSS variables supporting `Set A` (Income: Blue, Expense: Red) and `Set B` (Income: Red, Expense: Blue) color schemes, typography, and dark/light modes.
- **Mobile-First App Shell**: Responsive root container constrained to mobile viewport (360–430px) on desktop viewports with safe-area padding (`env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`).
- **Financial Math Engine (`src/lib/financial-math.ts`)**:
  - `toDecimal`, `toMinorUnits`, `fromMinorUnits`, `formatCurrency` (supporting Indian numbering `₹ 18,38,737.80` and standard formatting).
  - `calculateAccountBalance`: Double-entry invariant formula ($\text{Initial} + \sum\text{Income} - \sum\text{Expense} + \sum\text{TransferIn} - \sum\text{TransferOut}$).
  - `calculateNetWorth`: Balance sheet formula ($\text{Assets} - \text{Liabilities}$).
  - `parseArithmeticExpression`: Deterministic arithmetic parser (no `eval`) supporting `+`, `-`, `*`, `/`, decimals, and parentheses.
- **Unit Test Suite**: 100% test coverage across financial math utilities and boundary cases (leap years, month-ends, divide-by-zero).
- **PocketBase Central Client Singleton (`src/lib/pocketbase.ts`)**: Centralized client configured for local instance (`http://127.0.0.1:8090`), persistent `authStore`, and schema migrations definitions.

#### 2. Dependencies on Prior Phases
- *None (Greenfield foundation)*.

#### 3. shadcn Compliance Workflow
- **Instruction**: Run workflow `.agents/workflows/check-shadcn-compliance.md` to ensure zero hand-rolled primitive duplicates and full design token compliance in newly created root components.
- **Logging**: Append audit findings to `./progress/compliance-log.md`.

#### 4. "Done" Criteria Checklist
- [ ] Vite project builds and starts cleanly with `npm run dev`.
- [ ] All unit tests in `src/lib/__tests__/financial-math.test.ts` pass with 100% assertion coverage.
- [ ] Base shadcn components render with appropriate theme tokens and zero arbitrary hardcoded colors.
- [ ] Mobile-first container respects safe-area insets.
- [ ] PocketBase client initialized with typed schemas and storage persistence against local PocketBase server.
- [ ] `./progress/compliance-log.md` and `./progress/PROGRESS.md` updated with Phase 0 status.

#### 5. Screen Visual Comparison Workflow
- **Instruction**: Run workflow `.agents/workflows/compare-screen-vs-reference.md` on the base theme shell.
- **Screenshot Storage**: Save captured screenshot to `./progress/screenshots/phase0-theme-shell.png`.
- **Logging**: Append comparison verdict and notes to `./progress/visual-review-log.md`.

---

### Phase 1: Authentication, User Onboarding & Master Data Seeding

#### 1. What Gets Built
- **Sign-In View (`/login`)**: Email and password form, validation with `zod` + `react-hook-form`, Google Social Login button, "Forgot Password?" navigation link.
- **Sign-Up View (`/register`)**: Full name, email, password, confirm password, base currency selector (default `INR ₹`).
- **Forgot Password View (`/forgot-password`)**: Email reset request submission with instant feedback.
- **Auth Guard & Session Management**: Centralized `useAuthStore` (Zustand); strict login-only redirect for all protected routes; auto-refreshing session with local PocketBase instance.
- **Automatic Master Data Seeding**:
  - Automatically seeds default accounts: `Cash` (Group: Cash), `Bank Account` (Group: Accounts).
  - Automatically seeds default Income categories: `Allowance`, `Salary`, `Petty cash`, `Bonus`, `Other`.
  - Automatically seeds default Expense categories & subcategories: `Food` (*Lunch, Dinner, Eating out, Beverages*), `Social Life` (*Friend, Fellowship, Alumni, Dues*), `Pets`, `Transport` (*Bus, Subway, Taxi, Car*), `Culture` (*Books, Movie, Music, Apps*), `Household` (*Appliances, Furniture, Kitchen, Toiletries, Chandlery, Rent*), `Apparel` (*Clothing, Fashion, Shoes, Laundry*), `Beauty` (*Cosmetics, Makeup, Accessories, Beauty*), `Health` (*Health, Yoga, Hospital, Medicine*), `Education` (*Schooling, Textbooks, School supplies, Academy*), `EMI` (*Car Loan, Home Loan*), `Gift`, `Other`.
- **Secondary App Lock (Passcode & Biometrics)**: PIN entry keypad modal, session lock trigger on app backgrounding/resume.

#### 2. Dependencies on Prior Phases
- Phase 0 (Vite shell, shadcn components, PocketBase client, Zustand store).

#### 3. shadcn Compliance Workflow
- **Instruction**: Run workflow `.agents/workflows/check-shadcn-compliance.md` on `src/features/auth/` and `src/features/lock/`.
- **Logging**: Append audit findings to `./progress/compliance-log.md`.

#### 4. "Done" Criteria Checklist
- [ ] Unauthenticated requests to protected routes immediately redirect to `/login`.
- [ ] Successful registration automatically initializes the complete default category and account hierarchy in PocketBase.
- [ ] User login persists across page reloads.
- [ ] Passcode PIN modal triggers and validates correctly.
- [ ] `./progress/compliance-log.md` and `./progress/PROGRESS.md` updated with Phase 1 status.

#### 5. Screen Visual Comparison Workflow
- **Instruction**: Run workflow `.agents/workflows/compare-screen-vs-reference.md` on auth & lock dialogs.
- **Screenshot Storage**: Save screenshots to `./progress/screenshots/phase1-login.png` and `./progress/screenshots/phase1-app-lock.png`.
- **Logging**: Append comparison verdict to `./progress/visual-review-log.md`.

---

### Phase 2: Settings, Master Data & Configuration (`More`)

#### 1. What Gets Built
- **9-Tile Settings Hub (`/more`)** *(Ref: `more_01_settings_menu.jpg`)*:
  - Tiles: `Configuration`, `Accounts`, `Passcode`, `CalcBox`, `PC Manager`, `Backup`, `Feedback`, `Help`, `Recommend`.
- **Master Category Management (`/more/categories`)**:
  - Income Category list *(Ref: `more_02_income_category_settings.jpg`)*: Add category, emoji picker, rename, delete, reorder.
  - Expense Category list *(Ref: `more_03_expense_category_settings.jpg`)*: Add category, icon badge, rename, delete, reorder.
  - Subcategory Management Sheet *(Ref: `more_04_subcategory_settings_food.jpg`)*: Add, rename, delete, reorder subcategories under parent category.
  - Subcategory Master Toggle (`ON`/`OFF`): Globally disables subcategory selection for single-tier logging.
- **Configuration & Preferences (`/more/configuration`)** *(Refs: `more_05_configuration_settings.jpg`, `more_06_configuration_settings_general.jpg`, `more_07_configuration_settings_advanced.jpg`)*:
  - Main Currency & Sub Currency selector (with manual exchange rate input and default conversion presets).
  - Start Screen preference (`Daily` vs `Calendar`).
  - Monthly Start Date cycle (`Every 1`, `Every 5`, `Every 25`, etc.) with dynamic date-range calculations (e.g. 25th → 24th).
  - Weekly Start Day (`Sunday` vs `Monday`).
  - Carry-over balance toggle (`ON`/`OFF`).
  - Swipe Action configuration (`To Change Date` vs `To Change Tab`).
  - Color Scheme selector (`Set. A` vs `Set. B`).
  - Advanced Input Preferences: Time Input mode, Show Description toggle, Autocomplete toggle, Input Order (`From Amount` vs `From Category`), Note Button setting.

#### 2. Dependencies on Prior Phases
- Phase 0 (Base setup), Phase 1 (Auth session & seeded user master data).

#### 3. shadcn Compliance Workflow
- **Instruction**: Run workflow `.agents/workflows/check-shadcn-compliance.md` on `src/features/settings/` and `src/features/categories/`.
- **Logging**: Append audit findings to `./progress/compliance-log.md`.

#### 4. "Done" Criteria Checklist
- [ ] Category and subcategory additions, edits, deletions, and reordering persist to PocketBase.
- [ ] Toggling subcategories `OFF` hides subcategory controls globally.
- [ ] Changing Monthly Start Date dynamically recomputes billing period boundaries.
- [ ] Sub-currency configuration stores manual exchange rates with default values.
- [ ] Color scheme toggle updates CSS theme tokens across the entire app.
- [ ] `./progress/compliance-log.md` and `./progress/PROGRESS.md` updated with Phase 2 status.

#### 5. Screen Visual Comparison Workflow
- **Instruction**: Run workflow `.agents/workflows/compare-screen-vs-reference.md` on routes:
  - `/more` vs `docs/screens/more_01_settings_menu.jpg`
  - `/more/categories/income` vs `docs/screens/more_02_income_category_settings.jpg`
  - `/more/categories/expense` vs `docs/screens/more_03_expense_category_settings.jpg`
  - `/more/categories/expense/:id` vs `docs/screens/more_04_subcategory_settings_food.jpg`
  - `/more/configuration` vs `docs/screens/more_05_configuration_settings.jpg`
  - `/more/configuration/general` vs `docs/screens/more_06_configuration_settings_general.jpg`
  - `/more/configuration/advanced` vs `docs/screens/more_07_configuration_settings_advanced.jpg`
- **Screenshot Storage**: Save screenshots to `./progress/screenshots/more_01_...` through `more_07_...`.
- **Logging**: Append comparison verdicts to `./progress/visual-review-log.md`.

---

### Phase 3: Accounts, Assets & Net Worth Management (`Accounts`)

#### 1. What Gets Built
- **Consolidated Net Worth & Classification Overview (`/accounts`)** *(Ref: `account_01_summary_net_worth.jpeg`)*:
  - Summary Header: `Assets` (Blue), `Liabilities` (Red), `Total Net Worth` (Bold) using `calculateNetWorth`.
  - 11 Classification Group Accordions: Cash, Accounts (Bank), Card (Credit Card), Debit Card, Savings, Top-Up/Prepaid, Investments, Overdrafts, Loan, Insurance, Others.
  - Credit Card dual-metric display (`Balance Payable` driven by card `Settlement Date` and `Outstanding Balance`).
  - Header icons: Statistics (`📊`) shortcut, Options Menu (`⋮`).
- **Options Menu & Modals** *(Ref: `account_07_options_menu.jpeg`)*:
  - Dropdown options: `Add`, `Modify Orders`, `Show/Hide`, `Delete`.
- **Add Account Creation Wizard** *(Refs: `account_08_group_select_modal.jpeg`, `account_09_add_account_form.jpeg`, `account_15_record_difference_confirmation_modal.jpg`)*:
  - Step 1: Select Account Group modal (11 groups).
  - Step 2: Add Account Form (Name, Initial Amount via numpad, Description).
  - Step 3: "Record Difference" confirmation modal:
    - If $\Delta > 0$ (positive difference): creates an initial `Income` transaction under category "Other" / "Initial Balance".
    - If $\Delta < 0$ (negative difference / balance reduced): creates an `Expense` transaction under category "Other" / "Balance Adjustment".
    - If `[NO]`: sets starting balance directly without generating an auxiliary ledger transaction.
- **Account Configuration & Group Rules (`/accounts/:id/info`)** *(Refs: `account_05_info_credit_card.jpeg`, `account_06_info_cash.jpeg`, `account_10_info_debit_card.jpeg`, `account_11_info_credit_card_details.jpeg`, `account_12_info_loan_liability.jpeg`)*:
  - Universal fields: Group, Name, Amount, Description, Include in totals toggle, Show/Hide toggle.
  - Credit Card rules: Settlement Date, Payment Date, Statement vs Outstanding preview (using card Settlement Date).
  - Debit Card rules: Linked parent bank account selector, non-carryover logic.
  - Loan rules: Negative liability amount requirement and warning validation.
- **Account Visibility & Reordering**:
  - Show/Hide Settings *(Ref: `account_14_show_hide_settings.jpeg`)* with eye toggles (`👁`).
  - Modify Orders *(Ref: `account_13_modify_orders.jpeg`)* with row selection and `⌃` Up / `⌄` Down chevrons.
- **Account Deletion & Dependency Reconciliation**:
  - Deletion guard requiring transaction reassignment or confirmed cascade.

#### 2. Dependencies on Prior Phases
- Phase 0 (Financial math formulas), Phase 1 (Auth/Store), Phase 2 (Preferences).

#### 3. shadcn Compliance Workflow
- **Instruction**: Run workflow `.agents/workflows/check-shadcn-compliance.md` on `src/features/accounts/`.
- **Logging**: Append audit findings to `./progress/compliance-log.md`.

#### 4. "Done" Criteria Checklist
- [ ] Net Worth, Total Assets, and Total Liabilities calculate accurately with exact decimal arithmetic.
- [ ] Credit card accounts calculate statement Balance Payable based strictly on the card's specific Settlement Date.
- [ ] Loans enforce negative liability balances in Net Worth computation.
- [ ] "Record Difference" confirmation accurately generates Income on positive adjustment and Expense on negative adjustment.
- [ ] Show/Hide toggles hide accounts from selection pickers while preserving Net Worth aggregates.
- [ ] Modify Orders persists custom sort orders across account groups.
- [ ] `./progress/compliance-log.md` and `./progress/PROGRESS.md` updated with Phase 3 status.

#### 5. Screen Visual Comparison Workflow
- **Instruction**: Run workflow `.agents/workflows/compare-screen-vs-reference.md` on routes:
  - `/accounts` vs `docs/screens/account_01_summary_net_worth.jpeg`
  - `/accounts/options` vs `docs/screens/account_07_options_menu.jpeg`
  - `/accounts/select-group` vs `docs/screens/account_08_group_select_modal.jpeg`
  - `/accounts/new` vs `docs/screens/account_09_add_account_form.jpeg`
  - `/accounts/confirm-difference` vs `docs/screens/account_15_record_difference_confirmation_modal.jpg`
  - `/accounts/:id/info` (Credit Card) vs `docs/screens/account_05_info_credit_card.jpeg` & `account_11_info_credit_card_details.jpeg`
  - `/accounts/:id/info` (Cash) vs `docs/screens/account_06_info_cash.jpeg`
  - `/accounts/:id/info` (Debit Card) vs `docs/screens/account_10_info_debit_card.jpeg`
  - `/accounts/:id/info` (Loan) vs `docs/screens/account_12_info_loan_liability.jpeg`
  - `/accounts/reorder` vs `docs/screens/account_13_modify_orders.jpeg`
  - `/accounts/visibility` vs `docs/screens/account_14_show_hide_settings.jpeg`
- **Screenshot Storage**: Save screenshots to `./progress/screenshots/account_01_...` through `account_15_...`.
- **Logging**: Append comparison verdicts to `./progress/visual-review-log.md`.

---

### Phase 4: Transaction Entry Engine (Expense, Income, Transfer & Numpad)

#### 1. What Gets Built
- **Embedded Arithmetic Numpad**:
  - Keys: `0-9`, decimal `.`, backspace `⌫`, subtract `-`, calculator `🧮`, currency switch, color-themed `Done` button.
  - Real-time expression evaluation (e.g. `200 + 45 - 15 = 230`) using `parseArithmeticExpression`.
  - Supports opening order configured in preferences (`From Amount` vs `From Category`).
- **Segmented Type Switcher**: Seamless switching between `Income` | `Expense` | `Transfer`, preserving common entered fields (Date, Amount, Note).
- **Expense Logging Form (`/transactions/new/expense`)** *(Refs: `expense_01` through `expense_07`)*:
  - Red theme styling (active tab, underline, Save button).
  - Date & Time selector (`DD/MM/YY (Day) HH:MM`) with `Repeat` shortcut.
  - 2-Column Category/Subcategory bottom sheet *(Ref: `expense_02_category_sheet.jpeg`)* with edit shortcut.
  - 3-Column Account Grid sheet *(Ref: `expense_03_account_grid.jpeg`)* with layout toggle.
  - Note input with floating autocomplete suggestion chips *(Ref: `expense_05_note_autocomplete.jpeg`)*.
  - Description textarea + Camera/Gallery receipt photo attachment *(Ref: `expense_06_camera_attachment.jpeg`)* with client-side image compression (max 1024px JPEG, <500KB) and PocketBase multipart file upload.
  - Photo thumbnail previews with delete buttons *(Ref: `expense_07_photo_thumbnails.jpeg`)*.
  - Action buttons: `[ Save ]` (primary red) and `[ Continue ]` (rapid batch logging).
  - Existing transaction actions: `🗑 Delete` (restores account balance) and `📄 Duplicate`.
- **Income Logging Form (`/transactions/new/income`)** *(Refs: `income_01`, `income_02`, `income_03`, `income_05`)*:
  - Blue theme styling; destination account selector; credits account balance and increases monthly income total.
- **Transfer Logging Form (`/transactions/new/transfer`)** *(Refs: `transfer_01` through `transfer_05`)*:
  - Dark/Neutral theme styling.
  - `[ Fees ]` badge button on Amount row: expands dedicated Fees row with custom arithmetic numpad calculation *(Ref: `transfer_03_fees_field.jpeg`)*.
  - Dual `From` (Source) and `To` (Destination) account rows with interactive Swap button (`↑↓`) *(Ref: `transfer_05_complete_form.jpeg`)*.
  - Atomic double-entry update: Deducts $M + \text{Fee}$ from source, credits $M$ to destination; zero impact on monthly aggregate income/expense totals.

#### 2. Dependencies on Prior Phases
- Phase 0 (Financial math & arithmetic parser), Phase 1 (Auth), Phase 2 (Categories & Sub-currency), Phase 3 (Accounts).

#### 3. shadcn Compliance Workflow
- **Instruction**: Run workflow `.agents/workflows/check-shadcn-compliance.md` on `src/features/transactions/forms/` and `src/components/numpad/`.
- **Logging**: Append audit findings to `./progress/compliance-log.md`.

#### 4. "Done" Criteria Checklist
- [ ] Arithmetic keypad performs live inline evaluations correctly without runtime errors.
- [ ] Category sheet renders two columns and properly populates `Parent/Subcategory`.
- [ ] Account sheet renders 3-column responsive grid and updates source/destination accounts.
- [ ] Note autocomplete matches historical transaction notes accurately.
- [ ] Photo receipts compress client-side and upload reliably to PocketBase collection file storage.
- [ ] Transfer form deducts transfer fees from source account without altering monthly income/expense metrics.
- [ ] Duplicate and Continue buttons function as specified.
- [ ] `./progress/compliance-log.md` and `./progress/PROGRESS.md` updated with Phase 4 status.

#### 5. Screen Visual Comparison Workflow
- **Instruction**: Run workflow `.agents/workflows/compare-screen-vs-reference.md` on routes:
  - `/transactions/new/expense` vs `docs/screens/expense_01_form_initial.jpeg`
  - `/transactions/new/expense/categories` vs `docs/screens/expense_02_category_sheet.jpeg`
  - `/transactions/new/expense/accounts` vs `docs/screens/expense_03_account_grid.jpeg`
  - `/transactions/new/expense/note` vs `docs/screens/expense_04_note_field.jpeg` & `expense_05_note_autocomplete.jpeg`
  - `/transactions/new/expense/photos` vs `docs/screens/expense_06_camera_attachment.jpeg` & `expense_07_photo_thumbnails.jpeg`
  - `/transactions/new/income` vs `docs/screens/income_01_form_initial.jpeg`
  - `/transactions/new/income/categories` vs `docs/screens/income_02_category_sheet.jpeg`
  - `/transactions/new/income/accounts` vs `docs/screens/income_03_account_grid.jpeg`
  - `/transactions/new/income/note` vs `docs/screens/income_05_note_autocomplete.jpeg`
  - `/transactions/new/transfer` vs `docs/screens/transfer_01_form_initial.jpeg`
  - `/transactions/new/transfer/amount` vs `docs/screens/transfer_02_amount_entered.jpeg`
  - `/transactions/new/transfer/fees` vs `docs/screens/transfer_03_fees_field.jpeg`
  - `/transactions/new/transfer/accounts` vs `docs/screens/transfer_04_account_grid.jpeg`
  - `/transactions/new/transfer/complete` vs `docs/screens/transfer_05_complete_form.jpeg`
- **Screenshot Storage**: Save screenshots to `./progress/screenshots/expense_01_...`, `income_01_...`, `transfer_01_...`.
- **Logging**: Append comparison verdicts to `./progress/visual-review-log.md`.

---

### Phase 5: Core Transactions Hub Feeds (`Trans.`)

#### 1. What Gets Built
- **Persistent Bottom Navigation Framework**: 4 tabs (`Trans.`, `Stats`, `Accounts`, `More`) with fixed touch targets ($44\times44\text{px}$) and safe-area insets.
- **Top Sub-Tabs Switcher**: `Daily` | `Calendar` | `Monthly` | `Total` | `Note`.
- **Sub-Tab 1: Daily Transactions Feed (`/trans/daily`)** *(Ref: `trans_01_daily_transactions_jul_2026.jpg`)*:
  - Period Navigator: `< Month Year >` chevrons + month/year picker.
  - Header actions: Bookmarks (`⭐`), Search (`🔍`), Filter (`⚙️`).
  - Monthly Summary Strip: `Income` (blue), `Expenses` (red), `Total` (`Income - Expenses`).
  - Date Group Headers: Day number, Day badge (`Fri`), `MM.YYYY`, daily Income & Expense totals.
  - Virtualized Transaction Feed (per `.agents/rules/013-performance-and-feeds.md`).
  - Itemized Transaction Cards: Category icon + name + subcategory, note memo, account badge, color-coded amount. Tap to edit/view.
  - Fixed `+` FAB for quick transaction creation.
- **Sub-Tab 2: Calendar View & Day Inspection Drawer (`/trans/calendar`)** *(Refs: `trans_02_calendar_view_aug_2026.jpg`, `trans_03_day_transaction_details_aug_12.jpg`)*:
  - Calendar Grid: Monthly matrix; cells show Day #, Income line (blue), Expense line (red), Net balance line (black).
  - Day Inspection Bottom Drawer: Opens on date tap; displays date header, daily totals, itemized transactions, day navigation `< >`, `+` FAB, and `Close`.
- **Sub-Tab 3: Monthly Summary & Annual Breakdown (`/trans/monthly`)** *(Ref: `trans_04_monthly_summary_view_unfiltered.jpg`)*:
  - Year selector: `< YYYY >`.
  - Full-year summary aggregates (Income, Expenses, Net Savings).
  - 12-Month Table with monthly rows.
  - Weekly Accordion Drilldown: Expanding a month row reveals weekly breakdown rows with 7-day totals.
- **Sub-Tab 4: Total & Account Overview (`/trans/total`)** *(Ref: `trans_05_total_account_overview.jpg`)*:
  - Payment metrics: `Compared Expenses (Last month)` %, `Expenses (Cash, Accounts)`, `Expenses (Card, Pay)` with unbilled liability, `Transfer (Cash, Accounts -> ...)`.
  - "Export Data to Excel" button generating structured spreadsheet files.
- **Sub-Tab 5: Note Journal Feed (`/trans/note`)** *(Ref: `trans_06_note_tab.jpg`)*:
  - Chronological feed of transactions with notes; empty state illustration when none exist.

#### 2. Dependencies on Prior Phases
- Phase 0 (Scaffolding & Virtualization), Phase 1 (Auth), Phase 3 (Accounts), Phase 4 (Transaction Logging).

#### 3. shadcn Compliance Workflow
- **Instruction**: Run workflow `.agents/workflows/check-shadcn-compliance.md` on `src/features/transactions/feeds/` and `src/components/navigation/`.
- **Logging**: Append audit findings to `./progress/compliance-log.md`.

#### 4. "Done" Criteria Checklist
- [ ] Bottom navigation and top sub-tabs switch views with persistent state.
- [ ] Daily feed renders grouped transactions and monthly summary strip with 60 FPS virtualized scrolling.
- [ ] Calendar view renders multi-line daily aggregates and opens the interactive Day Drawer on date click.
- [ ] Monthly summary expands weekly accordion breakdowns with accurate date-range math.
- [ ] Total tab calculates payment method spend comparisons and unbilled card liabilities.
- [ ] `./progress/compliance-log.md` and `./progress/PROGRESS.md` updated with Phase 5 status.

#### 5. Screen Visual Comparison Workflow
- **Instruction**: Run workflow `.agents/workflows/compare-screen-vs-reference.md` on routes:
  - `/trans/daily` vs `docs/screens/trans_01_daily_transactions_jul_2026.jpg`
  - `/trans/calendar` vs `docs/screens/trans_02_calendar_view_aug_2026.jpg`
  - `/trans/calendar/day-drawer` vs `docs/screens/trans_03_day_transaction_details_aug_12.jpg`
  - `/trans/monthly` vs `docs/screens/trans_04_monthly_summary_view_unfiltered.jpg`
  - `/trans/total` vs `docs/screens/trans_05_total_account_overview.jpg`
  - `/trans/note` vs `docs/screens/trans_06_note_tab.jpg`
- **Screenshot Storage**: Save screenshots to `./progress/screenshots/trans_01_...` through `trans_06_...`.
- **Logging**: Append comparison verdicts to `./progress/visual-review-log.md`.

---

### Phase 6: Search, Multi-Dimensional Filters, Bookmarks & Recurring Engine

#### 1. What Gets Built
- **Real-Time Transaction Search (`/trans/search`)** *(Refs: `trans_07_transaction_search_suggestions.jpg`, `trans_08_search_results_dinner.jpg`)*:
  - Real-time search query input with clear `(x)` and filter shortcut.
  - Auto-suggestions dropdown matching notes, categories, subcategories, and accounts.
  - Dynamic results summary header computing matching Income, Expense, and Transfer totals.
  - Filtered results list with direct tap-to-edit navigation.
- **Multi-Dimensional Filter Modal (`/trans/filter`)** *(Refs: `trans_10_transaction_filter_modal.jpg`, `trans_11_filtered_monthly_summary_view.jpg`, `trans_12_filtered_calendar_view.jpg`, `trans_13_filtered_daily_transactions.jpg`)*:
  - Tabs: `INCOME` (by category/subcategory), `EXPENSES` (by category/subcategory), `ACCOUNT` (by account).
  - Widgets: Visual Ratio Donut (% income vs expenses) and per-account volume breakdowns.
  - Actions: `[ Reset ]`, `[ Select All ]`, `[ Filter ]`.
  - Filter state applies consistently across `Daily`, `Calendar`, and `Monthly` views with sticky bottom Active Filter Banner.
- **Bookmarks & Reusable Templates (`/trans/bookmarks`)** *(Ref: `trans_09_bookmarks.jpg`)*:
  - `⭐ Bookmark` toggle on Transaction Details to save templates.
  - Bookmarks Hub displaying saved templates; tapping pre-fills Add Transaction form.
- **Recurring Transactions Engine (`Repeat`) & PocketBase Cron** *(Refs: `repeat_01_context_menu.jpeg`, `repeat_02_frequency_list.jpeg`, `repeat_03_frequency_list_advanced.jpeg`)*:
  - Supported intervals: `Every Day`, `Weekdays`, `Weekend`, `Every Week`, `Every 2 weeks`, `Every 4 weeks`, `Every Month`, `The end of the month`, `Every 2/3/4/6 Month`, `Annually`.
  - Reflection timing: `On the date` vs `In advance` (1–3 days prior).
  - Central Recurring Management Hub (`/more/configuration/repeat`): list rules by type, edit rule, delete rule (preserving historical postings).
  - PocketBase cron hook (`pb_hooks`) executing due recurring transactions on the server and syncing with client.

#### 2. Dependencies on Prior Phases
- Phase 4 (Transaction forms), Phase 5 (Core feeds & bottom nav).

#### 3. shadcn Compliance Workflow
- **Instruction**: Run workflow `.agents/workflows/check-shadcn-compliance.md` on `src/features/search/`, `src/features/filter/`, `src/features/bookmarks/`, and `src/features/recurring/`.
- **Logging**: Append audit findings to `./progress/compliance-log.md`.

#### 4. "Done" Criteria Checklist
- [ ] Search query dynamically updates suggestion chips and matching total metrics.
- [ ] Filter matrix correctly filters transactions across Daily, Calendar, and Monthly views.
- [ ] Bookmarking an entry creates a reusable template that accurately pre-populates forms.
- [ ] Recurring engine generates due transactions via PocketBase cron according to specified intervals and reflection rules without creating duplicates.
- [ ] `./progress/compliance-log.md` and `./progress/PROGRESS.md` updated with Phase 6 status.

#### 5. Screen Visual Comparison Workflow
- **Instruction**: Run workflow `.agents/workflows/compare-screen-vs-reference.md` on routes:
  - `/trans/search` vs `docs/screens/trans_07_transaction_search_suggestions.jpg`
  - `/trans/search/results` vs `docs/screens/trans_08_search_results_dinner.jpg`
  - `/trans/bookmarks` vs `docs/screens/trans_09_bookmarks.jpg`
  - `/trans/filter` vs `docs/screens/trans_10_transaction_filter_modal.jpg`
  - `/trans/monthly` (Filtered) vs `docs/screens/trans_11_filtered_monthly_summary_view.jpg`
  - `/trans/calendar` (Filtered) vs `docs/screens/trans_12_filtered_calendar_view.jpg`
  - `/trans/daily` (Filtered) vs `docs/screens/trans_13_filtered_daily_transactions.jpg`
  - `/transactions/repeat/menu` vs `docs/screens/repeat_01_context_menu.jpeg`
  - `/transactions/repeat/frequencies` vs `docs/screens/repeat_02_frequency_list.jpeg`
  - `/transactions/repeat/advanced` vs `docs/screens/repeat_03_frequency_list_advanced.jpeg`
- **Screenshot Storage**: Save screenshots to `./progress/screenshots/trans_07_...` through `trans_13_...`, `repeat_01_...` through `repeat_03_...`.
- **Logging**: Append comparison verdicts to `./progress/visual-review-log.md`.

---

### Phase 7: Analytics & Visual Intelligence (`Stats` & Account Analytics)

#### 1. What Gets Built
- **Main `Stats` Module (`/stats`)** *(Refs: `stats_01_monthly_expenses_breakdown.jpg`, `stats_02_pie_chart_slice_highlight.jpg`, `stats_05_period_selector_dropdown.jpg`, `stats_06_weekly_expense_breakdown.jpg`, `stats_07_annual_expense_breakdown.jpg`)*:
  - Period Selector Dropdown: `Weekly`, `Monthly`, `Annually`, `Period` (Custom date range).
  - Dimension Toggle: `Expenses` vs `Income` with navigation chevrons.
  - Interactive Donut / Pie Breakdown: Multi-colored chart, percentage callouts, animated slice highlight on touch, tooltip with Category/Amount/%, and auto-scroll highlighting in ranked list.
  - Ranked Category Breakdown List: Descending spend sort, color-coded % badges, category icon, and total amount.
- **Category Deep-Dive & Historical Trend View (`/stats/category/:id`)** *(Refs: `stats_03_category_expense_trends_food.jpg`, `stats_04_category_income_trends_salary.jpg`)*:
  - Category total spend and subcategory distribution breakdown with % share.
  - 12-Month Continuous Trend Curve (Jan–Dec line chart).
  - Filtered itemized transaction list for active period.
- **Total Accounts Analytics & Trend Curves (`/accounts/stats`)** *(Ref: `account_02_total_stats_trends.jpeg`)*:
  - Total Net Worth balance metric.
  - Net Worth Trajectory Curve (multi-month Line Chart).
  - Monthly Comparative Cashflow (Blue credits vs Red debits Bar Chart).
- **Individual Account Details & Statement (`/accounts/:id`)** *(Ref: `account_03_cash_daily_ledger.jpeg`)*:
  - Sub-tabs: `Daily`, `Monthly`, `Annually`.
  - 4-Metric Statement Header: `Deposit` (blue), `Withdrawal` (red), `Total` (black), `Balance` (bold orange).
  - Grouped account ledger with running closing balance tags (`(Balance ...)`).
  - Account Stats shortcut (`📊`) and Edit shortcut (`✏️`).
- **Individual Account Stats (`/accounts/:id/stats`)** *(Ref: `account_04_single_account_stats_hsbc_cc.jpeg`)*:
  - Account balance trajectory line chart and cashflow distribution bar chart for the specific account.

#### 2. Dependencies on Prior Phases
- Phase 0 (Charts & Tokens), Phase 3 (Accounts), Phase 4 (Transactions), Phase 5 (Feeds).

#### 3. shadcn Compliance Workflow
- **Instruction**: Run workflow `.agents/workflows/check-shadcn-compliance.md` on `src/features/analytics/` and chart components.
- **Logging**: Append audit findings to `./progress/compliance-log.md`.

#### 4. "Done" Criteria Checklist
- [ ] Pie/Donut chart slice taps synchronize with ranked list selection.
- [ ] Trend line charts and cashflow bar charts render smoothly with zero floating-point calculation errors.
- [ ] Category deep-dive displays 12-month historical trends and subcategory breakdown.
- [ ] Individual account statement computes accurate running balances for each transaction row.
- [ ] Period granularities (Weekly, Monthly, Annually, Custom) aggregate data accurately.
- [ ] `./progress/compliance-log.md` and `./progress/PROGRESS.md` updated with Phase 7 status.

#### 5. Screen Visual Comparison Workflow
- **Instruction**: Run workflow `.agents/workflows/compare-screen-vs-reference.md` on routes:
  - `/stats` vs `docs/screens/stats_01_monthly_expenses_breakdown.jpg`
  - `/stats/highlight` vs `docs/screens/stats_02_pie_chart_slice_highlight.jpg`
  - `/stats/category/food` vs `docs/screens/stats_03_category_expense_trends_food.jpg`
  - `/stats/category/salary` vs `docs/screens/stats_04_category_income_trends_salary.jpg`
  - `/stats/periods` vs `docs/screens/stats_05_period_selector_dropdown.jpg`
  - `/stats/weekly` vs `docs/screens/stats_06_weekly_expense_breakdown.jpg`
  - `/stats/annually` vs `docs/screens/stats_07_annual_expense_breakdown.jpg`
  - `/accounts/stats` vs `docs/screens/account_02_total_stats_trends.jpeg`
  - `/accounts/:id` vs `docs/screens/account_03_cash_daily_ledger.jpeg`
  - `/accounts/:id/stats` vs `docs/screens/account_04_single_account_stats_hsbc_cc.jpeg`
- **Screenshot Storage**: Save screenshots to `./progress/screenshots/stats_01_...` through `stats_07_...`, `account_02_...` through `account_04_...`.
- **Logging**: Append comparison verdicts to `./progress/visual-review-log.md`.

---

### Phase 8: Mobile Native Bridge, Backup/Export, Security & Final Polish

#### 1. What Gets Built
- **Capacitor 6+ Mobile Integration & Lifecycle Hooks**:
  - Android Hardware Back Button listener (`App.addListener('backButton')`): Dismisses open drawers, modals, action sheets, and custom numpads before triggering route navigation or app exit.
  - AppState Lifecycle Listener (`AppState.addListener('appStateChange')`): Re-prompts PIN/Biometric lock screen upon returning from background.
  - Safe Area insets and Status Bar styling.
  - Complete web fallbacks for all Capacitor plugins.
- **Backup & Export Hub (`/more/backup`)**:
  - Encrypted JSON backup file export & restore.
  - Cloud "Sync Now" trigger.
  - Excel (`.xlsx`) & CSV export engine (Date, Category, Subcategory, Account, Type, Amount, Note, Description).
- **Daily Notification Reminder Scheduler**:
  - Push notification reminder at user-configured daily time (e.g. 21:00).
- **PWA Manifest & Service Worker**:
  - Installable PWA manifest with theme colors, icons, and offline caching shell.
- **End-to-End Visual & Regression Audit**: Full visual review across all 61 reference screens.

#### 2. Dependencies on Prior Phases
- Phases 0 through 7.

#### 3. shadcn Compliance Workflow
- **Instruction**: Run workflow `.agents/workflows/check-shadcn-compliance.md` across the complete codebase.
- **Logging**: Append final audit findings to `./progress/compliance-log.md`.

#### 4. "Done" Criteria Checklist
- [ ] Android hardware back button cleanly dismisses overlays before navigating back.
- [ ] App lock activates reliably on background/resume.
- [ ] JSON backup and restore reproduces exact database state.
- [ ] Excel/CSV export creates properly formatted financial ledger spreadsheets.
- [ ] PWA passes audit checklist and runs seamlessly across mobile browser viewports.
- [ ] `./progress/compliance-log.md`, `./progress/visual-review-log.md`, and `./progress/PROGRESS.md` signed off.

#### 5. Screen Visual Comparison Workflow
- **Instruction**: Run workflow `.agents/workflows/compare-screen-vs-reference.md` across all critical application screens.
- **Screenshot Storage**: Save all comparison screenshots to `./progress/screenshots/`.
- **Logging**: Append comprehensive visual review sign-off to `./progress/visual-review-log.md`.

---

## Technical Decisions & Architectural Alignments

1. **Backend Service & Local Instance**:
   - For development and automated testing, a local instance of PocketBase will run at `http://127.0.0.1:8090`.
   - The frontend connects via a singleton client (`src/lib/pocketbase.ts`) with typed collection models and automated schema initialization scripts.

2. **Photo Receipt Attachments**:
   - Receipt images captured via camera/gallery are compressed client-side (JPEG format, max dimension 1024px, target size <500KB) and uploaded via PocketBase multipart form data directly into the `transactions` collection file storage.

3. **Recurring ("Repeat") Schedule Execution**:
   - PocketBase cron hooks (`pb_hooks`) will execute server-side recurring rules, automatically posting scheduled transactions on their scheduled execution date or advance interval, with client-side real-time sync on login.

4. **Multi-Currency & Sub-Currency Support**:
   - Main currency defaults to `INR ₹`.
   - Sub-currency preferences allow manual exchange rate configuration with preset sensible defaults (e.g., USD, EUR, GBP, JPY), converting logged sub-currency transactions into the main currency for net worth and category stats.

5. **Credit Card Statement Billing Cycle**:
   - Credit card statement calculations (`Balance Payable`) strictly use the card's specific `Settlement Date` / `Payment Date`, while the global `Monthly Start Date` setting drives standard calendar/billing period grouping for general accounts.

6. **"Record Difference as Income/Expense" Modal Semantics**:
   - When adding or adjusting an account's baseline balance:
     - If $\Delta > 0$ (balance increased): Prompts to record difference as an **Income** under category `"Other"` / `"Initial Balance"`.
     - If $\Delta < 0$ (balance decreased): Prompts to record difference as an **Expense** under category `"Other"` / `"Balance Adjustment"`.
     - If user selects `[NO]`: Adjusts the account baseline balance directly without creating an auxiliary transaction record, maintaining double-entry ledger parity.

---

## Compliance, Visual Review & Progress Tracking Protocol

All verification records, compliance audit reports, visual review verdicts, and captured screenshots **must be strictly maintained in dedicated markdown files and directories under `./progress/`**.

### 1. Directory Structure (`./progress/`)

```
./progress/
├── PROGRESS.md              # Central phase status, active tasks, and milestone dashboard
├── compliance-log.md        # Detailed changelog and audit findings from check-shadcn-compliance workflow
├── visual-review-log.md     # Comparative visual review logs, verdicts (Same/Better/Worse), and UI diff notes
└── screenshots/             # Headless browser screenshot captures organized by phase/screen
    ├── .gitkeep
    ├── phase0-theme-shell.png
    ├── more_01_settings_menu-[timestamp].png
    ├── account_01_summary_net_worth-[timestamp].png
    ├── expense_01_form_initial-[timestamp].png
    └── ...
```

### 2. File Roles & Maintenance Instructions

#### A. Central Progress Dashboard (`./progress/PROGRESS.md`)
- Maintained as the living single-source-of-truth for project execution status.
- Updated at the start and completion of each phase with:
  - Current Active Phase
  - Phase Completion Checklist
  - Blockers or Action Items
  - Quick Links to `./progress/compliance-log.md` and `./progress/visual-review-log.md`

#### B. shadcn Compliance Audit Log (`./progress/compliance-log.md`)
- Managed in accordance with `.agents/workflows/check-shadcn-compliance.md`.
- After every build iteration or phase completion, append an entry structured as:
  ```markdown
  ### [YYYY-MM-DD] Phase X — shadcn Compliance Audit
  - **Files Scanned**: `src/features/...`
  - **Verdict**: PASS / FAIL (N violations)
  - **Violations Fixed**: List of replaced hand-rolled primitives or token alignments
  - **Missed Replacement Opportunities**: N recommendations
  ```

#### C. Visual Review & Reference Parity Log (`./progress/visual-review-log.md`)
- Managed in accordance with `.agents/workflows/compare-screen-vs-reference.md`.
- Captures live screenshots from the running dev server, compares against `docs/screens/[screen-name].jpeg`, and logs findings structured as:
  ```markdown
  ### [YYYY-MM-DD] Phase X — Screen: [Screen Name] (`/route`)
  - **Reference Image**: `docs/screens/[name].jpeg`
  - **Live Screenshot**: `progress/screenshots/[name]-[timestamp].png`
  - **Verdict**: Same / Better / Worse
  - **Visual Comparison**:
    - Layout & Spacing: ...
    - Component Fidelity: ...
    - Theme Tokens & Typography: ...
  - **Actionable Improvements Applied**: ...
  ```

#### D. Screenshot Asset Directory (`./progress/screenshots/`)
- All screenshots generated during visual review workflows must be saved directly to `./progress/screenshots/` using descriptive naming:
  `./progress/screenshots/[screen_name]-[timestamp].png`
