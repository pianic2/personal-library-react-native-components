# Text

**Stability:** beta — public consumer API, usable but contract may still change.

Componente base tipografico (wrapper di `react-native` `Text`) che applica token di font size/weight, colori e allineamento.

## Import

```ts
import { Text } from "@personal-library/react-native-components";
```

## Props

```ts
type Variant = "default" | "muted" | "danger" | "success";
type Align = "left" | "center" | "right" | "justify";

interface Props extends TextProps {
  variant?: Variant;
  size?: keyof ReturnType<typeof useTheme>["theme"]["typography"]["fontSize"];
  weight?: keyof ReturnType<typeof useTheme>["theme"]["typography"]["fontWeight"];
  align?: Align; // no default: the platform default applies
  truncate?: boolean;
  lines?: number;
}
```

## Comportamento

- `variant` controlla il colore (es. `muted` → `colors.textMuted`).
- `truncate=true` imposta `numberOfLines=1` e `ellipsizeMode="tail"`.
- `lines={n}` limita il testo a `n` righe con `ellipsizeMode="tail"`. Precedenza: `numberOfLines` esplicito, poi `lines`, poi `truncate` (una riga). Un `ellipsizeMode` esplicito vince sempre.
- `fontFamily` viene da `theme.typography.fontFamily.regular`; uno `style` con `fontFamily` lo sostituisce.
- `accessibilityRole` e tutte le altre props di `Text` di React Native passano al componente sottostante (per esempio `accessibilityRole="header"`).

## Usage

```tsx
<Text>Allineato come da default della piattaforma</Text>
<Text align="justify" lines={3}>Testo lungo giustificato su al massimo tre righe…</Text>
<Text accessibilityRole="header" weight="bold">Titolo</Text>
```

## Changelog

- PLRNUI-218: l'allineamento predefinito non è più `justify` (nessun `textAlign` finché non si passa `align`); `fontFamily` dal token del tema; nuova prop `lines`; la precedenza di `numberOfLines` è documentata. Chi si affidava al testo giustificato deve passare `align="justify"`.
