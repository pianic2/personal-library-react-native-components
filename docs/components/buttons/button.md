# Button

**Stability:** beta — public consumer API, usable but contract may still change.

Pulsante basato su `Pressable` con varianti e dimensioni.

## Import

```ts
import { Button } from "@personal-library/react-native-components";
```

## Props

```ts
type Variant = "primary" | "secondary" | "ghost" | "danger" | "info";
type Size = "xs" | "sm" | "md" | "lg";

interface ButtonProps {
  icon?: ComponentType<{ size?: number; color?: string }>;
  label?: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
```

## Usage

```tsx
<Button label="Salva" onPress={save} />
<Button label="Info" variant="info" />
<Button label="Annulla" variant="ghost" size="sm" testID="cancel" />
```

## Varianti

| Variante | Sfondo | Note |
| --- | --- | --- |
| `primary` | `colors.primary` | azione principale |
| `secondary` | `colors.secondary` | azione secondaria |
| `danger` | `colors.error` | azioni distruttive |
| `info` | `colors.info` | riempita (prima era trasparente con testo invertito, illeggibile) |
| `ghost` | trasparente | testo `colors.textPrimary`, bordo `colors.border`; da premuto usa `colors.surface` |

## Contrasto e stato premuto

- Le varianti piene mantengono il proprio colore anche da premute: il feedback è l'opacità `components.button.opacity.pressed`
  più un velo del 12% (stesso valore di `stateLayer.pressed`) sul colore opposto a quello del testo, non uno scambio con
  `colors.surface`. Con colori non esadecimali il velo non viene applicato.
- Il testo usa `colors.textInverted`; se questo non raggiunge 4.5:1 sullo sfondo (per esempio `primary` e `secondary` nel
  tema chiaro) passa a `colors.textPrimary`. I colori non esadecimali non vengono modificati.
- `style` è applicato dopo gli stili della variante; `testID` è passato al `Pressable`. Il peso del testo viene da
  `theme.typography.fontWeight.semibold`.

## Note

- Se `icon` e `label` sono entrambi assenti, in dev logga un warning.
- Le dimensioni (height, padding, iconSize) sono mappate internamente per size.
