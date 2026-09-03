---
trigger: always_on
---

# Styling & UI Components — CRITICAL, non-negotiable

**shadcn/ui is the required foundation for all UI implementation.**

* Before creating a UI component, **check shadcn/ui first** using the available shadcn MCP and `.agents/skills/shadcn/SKILL.md`.
* Prefer an existing **shadcn component, block, or composition** whenever one reasonably fits.
* **Do not recreate** an existing shadcn component with custom HTML/Tailwind.
* Compose multiple shadcn components when building complex UI.
* Use Tailwind freely for layout, spacing, responsiveness, and minor adjustments.
* Customize existing shadcn components through their supported variants/CVA and theme/CSS variables whenever possible.
* Build a custom component **only when shadcn does not provide a suitable solution**. Custom components must still use shadcn design tokens and patterns.
* Keep equivalent UI patterns consistent by reusing the same shadcn components.
* Treat unnecessary hand-rolled replacements of shadcn components as a **failure**, not a stylistic preference.

### Required Decision Order

**Check shadcn → Reuse → Compose → Customize/Extend → Custom only when necessary.**
