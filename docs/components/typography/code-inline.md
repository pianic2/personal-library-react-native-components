# CodeInline

**Stability:** internal / non-stable — not part of the public consumer API.

Stile “inline code” basato su `Text` (font mono + bordo + background).

## Import

```ts
import { CodeInline } from "@personal-library/react-native-components";
```

## Props

Uguali a `Text` (`ComponentProps<typeof Text>`).

Il `style` del chiamante viene applicato per ultimo, dopo font mono, bordo e padding del tema, quindi li estende o li sovrascrive
senza perderli. `size` accetta i token tipografici (default `sm`) e determina `fontSize` e `lineHeight`.

## Usage

```tsx
<CodeInline>const ok = true;</CodeInline>
<CodeInline size="lg" style={{ color: "red" }}>npm test</CodeInline>
```
