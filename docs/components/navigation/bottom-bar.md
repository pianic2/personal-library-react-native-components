# BottomBar

**Stability:** experimental — provisional API, not recommended for production dependency.

Barra di navigazione in basso (tipicamente per mobile). Usa `NavContext` per items e pathname.

## Import

```ts
import { BottomBar } from "@personal-library/react-native-components";
```

## Props

```ts
export interface BottomBarProps {
  maxItems?: number; // default 5
  position?: "absolute" | "static"; // default "absolute"
  insets?: BarInsets; // { top?, bottom?, left?, right? }
}
```

## Usage

```tsx
<NavProvider items={items} pathname={pathname} navigate={navigate}>
  <BottomBar maxItems={4} insets={{ bottom: safeArea.bottom }} />
</NavProvider>
```

## Comportamento

- Mostra massimo `maxItems` elementi (slice dell’array).
- Per l’item attivo: `activeIcon ?? icon`.
- `position="absolute"` (default) fissa la barra in basso; `"static"` la lascia nel flusso.
- `insets.bottom` aumenta padding e altezza della barra; la libreria non legge le safe-area insets.
- Altezze e larghezze vengono dai token `theme.size.height` e `theme.space`.

## Accessibility

- The bar has `role="navigation"` and its items sit in a `tablist`.
- Each item has `accessibilityRole="tab"`; the current one has `accessibilityState.selected = true`.
