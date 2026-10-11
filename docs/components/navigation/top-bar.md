# TopBar

**Stability:** beta — public consumer API, usable but contract may still change.

Barra di navigazione in alto (web-only).

## Import

```ts
import { TopBar } from "@personal-library/react-native-components";
```

## Props

```ts
export interface BarInsets {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

export interface TopBarProps {
  title?: string;
  position?: "absolute" | "static"; // default "absolute"
  insets?: BarInsets;
  leftSlot?: React.ReactNode;
  centerSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
}
```

## Usage

```tsx
<NavProvider items={items} pathname={pathname} navigate={navigate}>
  <TopBar title="Library" insets={{ top: safeArea.top }} />
</NavProvider>

// In the normal layout flow instead of pinned to the top:
<TopBar title="Library" position="static" />
```

## Note

- Se `centerSlot` non è fornito, renderizza i `NavItem` come link.
- `position="absolute"` (default) fissa la barra in alto e la sovrappone al contenuto; `"static"` la lascia nel flusso.
- `insets` aggiunge le safe-area insets al padding: la libreria non le legge, le passa l'app (nessuna nuova dipendenza).
- Altezze e larghezze vengono dai token `theme.size.height` e `theme.space`.

## Accessibility

- The bar has `role="navigation"`; the `title` has `accessibilityRole="header"`.
- Each item is a `Link` (role `link`); the current one has `accessibilityState.selected = true`.
