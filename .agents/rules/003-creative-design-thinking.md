---
trigger: always_on
---
# Creative Design Thinking for Data-Dense Web Apps — CRITICAL
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
