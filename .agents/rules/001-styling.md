---
trigger: always_on
---

# Styling & UI Components — CRITICAL, non-negotiable

- Use shadcn/ui components, blocks, and charts as the styling foundation for every UI element.
- Use shadcn MCP and SKILL SKILL (.agents/skills/shadcn/SKILL.md) when selecting a component (search registries, view items/examples, use add commands) before building anything custom.
- Compose shadcn components with Tailwind utility classes as needed for layout, spacing, and one-off adjustments — this is standard shadcn usage, not a violation.
- Do NOT hand-roll a UI element (div/button/input built from scratch with utilities) that duplicates something shadcn already provides — use the shadcn component instead.
- For component-level style changes (colors, variants, sizing), extend the component's own CVA variants or shadcn's CSS variables/theme tokens — don't hardcode arbitrary values inline.
- If no shadcn component fits, build custom using shadcn's design tokens (CSS variables) for consistency, and use Tailwind utilities for the implementation.
- Treat hand-rolled duplicates of existing shadcn components as a failed task, not a style note.