# ProgressBar

**Stability:** internal / non-stable — not part of the public consumer API.

Barra di progresso (0–100) con tono colore, determinata o indeterminata.

## Import

```ts
import { ProgressBar } from "@personal-library/react-native-components";
```

## Props

```ts
type Tone = "primary" | "info" | "success" | "warning" | "danger";

interface ProgressBarProps {
  progress?: number; // 0–100, clamped; undefined renders 0%
  tone?: Tone; // default "primary"
  color?: Tone | "error"; // @deprecated alias of `tone`; `tone` wins
  indeterminate?: boolean; // unknown duration, ignores `progress`
  accessibilityLabel?: string;
}
```

## Usage

```tsx
<ProgressBar progress={40} accessibilityLabel="Upload" />
<ProgressBar progress={100} tone="success" />
<ProgressBar indeterminate accessibilityLabel="Loading results" />
```

## Accessibility

- Determinate: `accessibilityRole="progressbar"` and `accessibilityValue={{ min: 0, max: 100, now }}` (`now` is the clamped progress).
- Indeterminate: `accessibilityRole="progressbar"` and `accessibilityState.busy = true`, with no value (the duration is unknown).
- An `undefined` or non-finite `progress` renders an empty bar (0%), not a fake value.
- The indeterminate sweep honours the reduced-motion preference: it shows a static segment instead of moving.

## Notes

- La barra è alta `theme.space.sm`; il raggio e i colori vengono dal tema.
- `color` resta come alias deprecato di `tone` (ADR 0014: il colore è `tone`, `variant` è struttura).
