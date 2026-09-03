---
trigger: model_decision
description: Performance & feed UX — virtualization for long transaction lists, gesture handling, memoization
---

# Feed Performance & Gesture UX

- **List Virtualization**: Transaction feeds (Daily, Note, Account Ledgers) spanning large date ranges must use list windowing/virtualization to maintain 60 FPS scrolling.
- **Gesture Disambiguation**: Horizontal period swiping (changing months/weeks) must have explicit directional slope locks so it does not interfere with vertical list scrolling.
- **Efficient Aggregations**: Compute daily, weekly, and category total sums server-side where possible. For client-side interactive filtering or drill-downs, memoize derived computations so re-renders do not recalculate the entire transaction history.
