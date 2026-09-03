---
trigger: model_decision
description: Financial math rules — decimal precision, account balances, net worth math, double-entry transfer invariants
---

# Financial Math & Ledger Integrity

- **Precision & Storage**: Never perform raw JavaScript floating-point arithmetic on currency. Use exact decimal helpers (`decimal.js` / BigInt).
- **Double-Entry Balance Invariant**: Every account balance must satisfy:
  $$\text{Current Balance} = \text{Initial Balance} + \sum\text{Income} - \sum\text{Expense} + \sum\text{TransferIn} - \sum\text{TransferOut}$$
- **Atomic Transfers**: Inter-account transfers must deduct from source account and credit destination account together. Transfers must NEVER alter monthly aggregate income or expense totals.
- **Liability Semantics**:
  - **Loans**: Negative balances that reduce Net Worth ($\text{Net Worth} = \text{Assets} - \text{Liabilities}$).
  - **Credit Cards**: Separate *Statement Balance Payable* (due on payment date) from *Total Outstanding Balance* (unbilled + billed).