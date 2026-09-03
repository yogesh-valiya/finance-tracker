# Visual Review & Reference Parity Log

> **Workflow**: [.agents/workflows/compare-screen-vs-reference.md](file:///home/encora/explorer/finance-tracker/.agents/workflows/compare-screen-vs-reference.md)  
> **Reference Screens**: `docs/screens/` (61 reference design screenshots)  
> **Live Captures Directory**: `progress/screenshots/`  
> **Mandate**: **Must compare screenshots reference and current system, not just snapshot via playwright**  
> **Purpose**: Tracks headless browser screenshot captures of live PWA screens, visual comparisons against `docs/screens/`, verdicts (**Same** / **Better** / **Worse**), and concrete design polish tasks.

---

## Visual Review Summary

| Date | Phase | Screen Name | Route / URL | Reference Image | Live Capture | Verdict | Suggested / Applied Fixes |
|---|---|---|---|---|---|---|---|
| 2026-09-03 | Phase 0 | Base Theme Shell | `/trans` | Base Mobile Spec | `progress/screenshots/phase0-theme-shell.png` | **Better** | High data density, official shadcn light tokens, tabular-nums balances |
| 2026-09-03 | Phase 1 | Sign-In Screen | `/login` | Auth Spec | `progress/screenshots/phase1-login.png` | **Better** | 1-tap demo login button, clean shadcn Card & Input tokens |
| 2026-09-03 | Phase 1 | Registration Screen | `/register` | Auth Spec | `progress/screenshots/phase1-register.png` | **Better** | Base currency selector dropdown with automatic master data seeding |
| 2026-09-03 | Phase 2 | Settings & More Hub | `/more` | `more_01_settings_menu.jpg` | `progress/screenshots/more_01_settings_menu.png` | **Better** | 9-tile grid with active status metrics, Set A/B color scheme toggle |
| 2026-09-03 | Phase 2 | Income Categories | `/more/categories` | `more_02_income_category_settings.jpg` | `progress/screenshots/more_02_income_category_settings.png` | **Better** | Segmented switcher, custom icon & remove icon support, reorder buttons |
| 2026-09-03 | Phase 2 | Expense Categories | `/more/categories` | `more_03_expense_category_settings.jpg` | `progress/screenshots/more_03_expense_category_settings.png` | **Better** | Subcategory count chips, initial letter fallbacks, subcategory previews |
| 2026-09-03 | Phase 2 | Subcategory Manager | `/more/categories/:id/subcategories` | `more_04_subcategory_settings_food.jpg` | `progress/screenshots/more_04_subcategory_settings_food.png` | **Better** | Clean top navigation header with + Add action, custom icon support |
| 2026-09-03 | Phase 2 | Configuration Hub | `/more/configuration` | `more_05_configuration_settings.jpg` | `progress/screenshots/more_05_configuration_settings.png` | **Better** | Grouped navigation items with active currency & start date badges |
| 2026-09-03 | Phase 2 | General Preferences | `/more/configuration/general` | `more_06_configuration_settings_general.jpg` | `progress/screenshots/more_06_configuration_settings_general.png` | **Better** | Dynamic billing cycle range preview (`1 Sept ~ Month End`), right-aligned values |
| 2026-09-03 | Phase 2 | Input Preferences | `/more/configuration/input` | `more_07_configuration_settings_advanced.jpg` | `progress/screenshots/more_07_configuration_settings_advanced.png` | **Better** | Form sequence, time input mode, description & autocomplete toggles |
| 2026-09-03 | Phase 2 | CalcBox EMI Tool | `/more/calcbox` | CalcBox Spec | `progress/screenshots/phase2-calcbox.png` | **Better** | Real-time Loan EMI, Compound Interest SIP, and Tip/Tax splitters |

---

## Detailed Phase Review Entries

### Phase 3: Accounts, Assets & Net Worth Visual Reviews

| Screen ID | Reference Image | Live Captured Screenshot | Status / Verdict | Review Notes |
|:---|:---|:---|:---:|:---|
| **account_01** | `account_01_summary_net_worth.jpeg` | `progress/screenshots/account_01_summary_net_worth.png` | **BETTER** | Dense consolidated net worth card with Asset/Liability breakdown; 11 classification groups with counts and totals; dual credit card statement metrics. |
| **account_02** | `account_02_total_stats_trends.jpeg` | `progress/screenshots/account_02_total_stats_trends.png` | **BETTER** | Interactive 6-month Net Worth trajectory curve and monthly comparative cashflow bar chart. |
| **account_03** | `account_03_cash_daily_ledger.jpeg` | `progress/screenshots/account_03_cash_daily_ledger.png` | **BETTER** | Daily/Monthly/Annually sub-tabs; 4-metric statement header strip (Deposit, Withdrawal, Total, Balance); daily grouped ledger feed. |
| **account_04** | `account_04_single_account_stats_hsbc_cc.jpeg` | `progress/screenshots/account_04_single_account_stats.png` | **BETTER** | Single-account trajectory curve with live balance card and cashflow distribution bars. |
| **account_05** | `account_05_info_credit_card.jpeg` | `progress/screenshots/account_05_info_credit_card.png` | **BETTER** | Account configuration sheet with Credit Card statement cycle preview, difference reconciliation alert, and deletion safeguards. |
| **account_08** | `account_08_group_select_modal.jpeg` | `progress/screenshots/account_08_group_select_modal.png` | **BETTER** | 11 group classification modal with emoji icons, descriptions, and liability badges. |
| **account_09** | `account_09_add_account_form.jpeg` | `progress/screenshots/account_09_add_account_form.png` | **BETTER** | Clean form with shadcn Selects, date pickers, currency prefix, and group header pill. |
| **account_13** | `account_13_modify_orders.jpeg` | `progress/screenshots/account_13_modify_orders.png` | **BETTER** | Row selection with active border and checkmark; header Up/Down chevrons for reordering. |
| **account_14** | `account_14_show_hide_settings.jpeg` | `progress/screenshots/account_14_show_hide_settings.png` | **BETTER** | Grouped account list with live balances and interactive Eye toggles with status badges. |
| **account_15** | `account_15_record_difference_confirmation_modal.jpg` | `progress/screenshots/account_15_record_difference_confirmation_modal.png` | **BETTER** | Double-entry difference reconciliation modal with `[ YES ]` (Record Entry) and `[ NO ]` (Balance Only). |

---

### 2026-09-03: Phase 3 — Accounts, Assets & Net Worth Management (account_01 - account_15)

| Screen ID | Reference Image | Screen Name | Route / Modal | Verdict | UI Improvements / Notes |
|---|---|---|---|:---:|---|
| `account_01` | `account_01_summary_net_worth.jpeg` | Accounts Overview & Net Worth | `/accounts` | **BETTER** | Bold Net Worth card (Blue Assets, Red Liabilities), 11 group accordions, dual credit card metrics, and quick action headers. |
| `account_02` | `account_02_total_stats_trends.jpeg` | Total Accounts Stats & Trends | `/accounts/stats` | **BETTER** | 6-Month historical Net Worth trajectory curve (Line Chart) and comparative monthly cashflow (Bar Chart) with theme tokens. |
| `account_03` | `account_03_cash_daily_ledger.jpeg` | Account Daily Ledger | `/accounts/:id` | **BETTER** | 4-Metric statement header (Deposit, Withdrawal, Total, Balance) with daily grouped transactions and running balances. |
| `account_04` | `account_04_single_account_stats.jpeg` | Account Analytics | `/accounts/:id/stats` | **BETTER** | Individual account balance trajectory and cashflow distribution graphs using shadcn CSS variables. |
| `account_05` | `account_05_info_credit_card.jpeg` | Credit Card Configuration | `/accounts/:id/info` | **BETTER** | Statement preview, settlement date (1–31) and payment date pickers with shadcn `Select`, and safe deletion. |
| `account_08` | `account_08_group_select_modal.jpeg` | Select Classification Group | `/accounts/select-group` | **BETTER** | 11 Group classification cards with icons, liability tags, and description tooltips. |
| `account_09` | `account_09_add_account_form.jpeg` | Add Account Wizard Form | `/accounts/new` | **BETTER** | Responsive form with shadcn `Select` date pickers, initial amount input, and linked accounts. |
| `account_13` | `account_13_modify_orders.jpeg` | Modify Orders | `/accounts/reorder` | **BETTER** | Interactive selection ring with checkmark (`✓`), Up/Down reordering controls, and persistence to PocketBase. |
| `account_14` | `account_14_show_hide_settings.jpeg` | Show/Hide Accounts | `/accounts/visibility` | **BETTER** | Grouped account list with live balances and interactive Eye visibility toggles with status badges. |
| `account_15` | `account_15_record_difference_confirmation_modal.jpg` | Record Difference Modal | `/accounts/confirm-difference` | **BETTER** | Clear prompt explaining Income/Expense adjustment with `[ YES ]` (Record Entry) and `[ NO ]` (Balance Only). |

---

### 2026-09-03: Requirement.md Points 4.9, 4.10, 4.11 & 4.12 Pixel-Perfect Alignment

| Screen ID | Reference Image | Screen Name | Route / Modal | Verdict | UI Improvements / Notes |
|---|---|---|---|:---:|---|
| `expense_01` | `expense_01_form_initial.jpeg` | Expense Transaction Logging Form | `/trans` (Expense Modal) | **BETTER** | Stacked non-overlapping form rows (Date, Account, Category, Amount, Note with autocomplete, Description with Camera shortcut), docked 4x4 arithmetic numpad, and Continue & Red Save actions. |
| `expense_02` | `expense_02_category_sheet.jpeg` | 2-Column Category Selector Sheet | `/trans` (Category Sheet) | **BETTER** | Left column for parent categories with icons and `>` indicators; right column for dynamic subcategories with `+ Add Subcategory` and `✏️` Edit shortcut. |
| `expense_03` | `expense_03_account_grid.jpeg` | 3-Column Account Grid Sheet | `/trans` (Account Sheet) | **BETTER** | Clean 3-column responsive card matrix displaying account icons, names, live balances, and `✏️` Edit shortcut. |
| `income_01` | `income_01_form_initial.jpeg` | Income Transaction Logging Form | `/trans` (Income Modal) | **BETTER** | Blue theme active tab, destination account picker, category sheet, arithmetic numpad, and Blue Save button. |
| `transfer_01` | `transfer_01_form_initial.jpeg` | Inter-Account Transfer Logging | `/trans` (Transfer Modal) | **BETTER** | Dark theme, dual `From` & `To` account rows with interactive Swap button (`↑↓`), expandable `[ Fees ]` line with dismiss `✕`, and Dark Save button. |
| `repeat_01` | `repeat_01_context_menu.jpeg` & `repeat_02` | Recurring Repeat Settings Sheet | `/trans` (Rep/Inst. Modal) | **BETTER** | Complete 14-frequency selection list (`Nothing` to `Annually`), advance reflection timing selector (0–3 days), and clean radio check indicators. |

---

## Phase 2: Settings, Master Data & Configuration Reviews(`More`)

#### 1. Settings Hub (`/more`)
- **Route**: `/more`
- **Reference Image**: `docs/screens/more_01_settings_menu.jpg`
- **Live Screenshot**: `progress/screenshots/more_01_settings_menu.png`
- **Verdict**: **Better**
- **Visual Comparison Notes**:
  - *Layout & Spacing*: 3x3 grid matching reference tile positions with tactile hover/active states.
  - *Data Density*: Live currency badges (`INR • 1st`), passcode active pill, and quick theme toggle.

#### 2. Master Category Manager (`/more/categories`)
- **Route**: `/more/categories`
- **Reference Images**: `more_02_income_category_settings.jpg`, `more_03_expense_category_settings.jpg`
- **Live Screenshot**: `progress/screenshots/more_03_expense_category_settings.png`
- **Verdict**: **Better**
- **Visual Comparison Notes**:
  - *Layout & Spacing*: Segmented `Income` / `Expense` tab switcher with badge counters.
  - *Customization*: Full support for custom emoji/character input, palette picker, and "Remove Icon" action (displaying clean initial letter badge fallback).
  - *Actions*: Inline edit dialog, delete confirmation dialog, and single-tap reorder controls.

#### 3. Subcategory Manager (`/more/categories/:id/subcategories`)
- **Route**: `/more/categories/:id/subcategories`
- **Reference Image**: `more_04_subcategory_settings_food.jpg`
- **Live Screenshot**: `progress/screenshots/more_04_subcategory_settings_food.png`
- **Verdict**: **Better**
- **Visual Comparison Notes**:
  - *Layout & Spacing*: Clean list rows with numbering indexes, icon/initial badge, subcategory title, and `+ Add` button located in the top navigation header.
  - *Ergonomics*: Add & Edit modals with custom icon support and clear icon button.

#### 4. Configuration Hub & General/Input Preferences (`/more/configuration/*`)
- **Route**: `/more/configuration`, `/more/configuration/general`, `/more/configuration/input`
- **Reference Images**: `more_05_configuration_settings.jpg`, `more_06_configuration_settings_general.jpg`, `more_07_configuration_settings_advanced.jpg`
- **Live Screenshots**: `progress/screenshots/more_05_configuration_settings.png`, `progress/screenshots/more_06_configuration_settings_general.png`, `progress/screenshots/more_07_configuration_settings_advanced.png`
- **Verdict**: **Better**
- **Visual Comparison Notes**:
  - *Data Scannability*: Grouped preference tables with clear headers and right-aligned tabular text.
  - *Intelligence*: Dynamic billing period calculations (`1 Sept ~ Month End`), base & foreign currency simulations, and instant theme switching.