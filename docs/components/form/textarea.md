# Textarea

**Stability:** beta — public consumer API, usable but contract may still change.

Multi-line `Input` (`multiline`, text aligned to the top). `label`, `helperText`, `error`, `size` and the other `Input` props work the same.

## Import

```ts
import { Textarea } from "@personal-library/react-native-components";
```

## Props

```ts
interface TextareaProps extends Omit<InputProps, "multiline" | "textAlignVertical"> {
  rows?: number; // visible lines, default 4 (minimum 1)
}
```

## Usage

```tsx
<Textarea label="Note" helperText="Max 500 characters" value={note} onChangeText={setNote} />
<Textarea label="Message" rows={8} value={message} onChangeText={setMessage} />
```

`rows` sets the minimum height from the typography tokens (`rows` x `fontSize.md` x `lineHeight.normal`) plus the vertical padding (`space.md`, twice). A `style` with its own `minHeight` wins.

## Accessibility

- Same naming rules as `Input`: pass `label` or `accessibilityLabel`; `helperText` becomes the accessibility hint.
