## Context

Claude Chat currently uses a mix of:
1. Inline SVG elements (for arrows, send button)
2. Text symbols (+, A)
3. CSS-styled divs (connection dot)

This creates visual inconsistency and makes icon management harder.

## Goals / Non-Goals

**Goals:**
- Replace all icons with Iconify icons
- Use Lucide icon set for consistency
- Support both light and dark themes
- Keep bundle size reasonable

**Non-Goals:**
- Not replacing logo.svg
- Not changing any functionality
- Not adding new features

## Decisions

### 1. Icon Library: @iconify/react

**Rationale:**
- Official React/Preact support
- Tree-shaking for smaller bundles
- On-demand loading (icons loaded as needed)
- Works with Preact via `preact/compat` or directly

**Installation:**
```bash
npm install @iconify/react
```

### 2. Icon Set: Lucide

**Rationale:**
- Modern, clean design
- Consistent stroke width
- Wide coverage of common icons
- Open source (ISC license)

### 3. Icon Components

Create a wrapper component for consistent usage:

```tsx
// src/client/components/Icon.tsx
import { Icon } from '@iconify/react';

interface IconProps {
  icon: string;
  size?: number;
  className?: string;
}

export function Icon({ icon, size = 24, className }: IconProps) {
  return (
    <Icon
      icon={`lucide:${icon}`}
      width={size}
      height={size}
      className={className}
    />
  );
}
```

### 4. Icon Mappings

| Component | Current | New Icon |
|-----------|---------|----------|
| Sidebar - New Team | `+` text | `lucide:plus` |
| Sidebar - Archive | `A` text | `lucide:archive` |
| Sidebar - Connection | green/red dot | `lucide:wifi` / `lucide:wifi-off` |
| MessageBubble - Incoming | inline SVG | `lucide:arrow-left` |
| MessageBubble - Outgoing | inline SVG | `lucide:arrow-right` |
| InputBox - Send | inline SVG | `lucide:send` |

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Bundle size increase | Use on-demand loading via @iconify/react |
| Loading delay | Icons are cached after first load |
| Breaking changes in Iconify | Pin version, Lucide is stable |

## Migration Plan

1. Install @iconify/react
2. Create Icon wrapper component
3. Update Sidebar icons
4. Update MessageBubble icons
5. Update InputBox icons
6. Test in both themes
7. Remove unused inline SVGs
