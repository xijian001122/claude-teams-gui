# Update Icons with Iconify

## What

Replace inline SVGs and text-based icons with icons from the [Iconify](https://icon-sets.iconify.design/) library throughout the Claude Chat application.

## Why

- **Consistency**: Use a unified icon library instead of mixed inline SVGs and text symbols
- **Quality**: Iconify provides thousands of high-quality icons from popular sets (Lucide, Material, Heroicons, etc.)
- **Maintainability**: Easier to update and manage icons from a single source
- **Flexibility**: Easy to switch icon styles without changing code

## Scope

### Icons to Replace

| Current | Location | Iconify Replacement |
|---------|----------|---------------------|
| `+` text | Sidebar "新建团队" button | `lucide:plus` or `lucide:plus-circle` |
| `A` text | Sidebar "归档" button | `lucide:archive` |
| Connection dot | Sidebar header | `lucide:wifi` / `lucide:wifi-off` |
| Inline SVG arrow | MessageBubble cross-team | `lucide:arrow-left` / `lucide:arrow-right` |
| Inline SVG send | InputBox send button | `lucide:send` |

### Icons to Add

| New Icon | Location | Iconify Icon |
|----------|----------|--------------|
| Theme toggle | Header | `lucide:sun` / `lucide:moon` |
| Settings | Header (optional) | `lucide:settings` |

## Out of Scope

- Logo replacement (logo.svg)
- Avatar letters
- Emoji usage in messages

## References

- Iconify Icon Sets: https://icon-sets.iconify.design/
- Recommended set: Lucide (modern, clean, consistent)
- Preact integration: `@iconify/react` or `@iconify-icon/react`
