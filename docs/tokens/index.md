# Tokens

**Stability:** beta — public consumer API, usable but contract may still change.

Questa sezione ricalca l’albero dei token in `tokens/`.

- [colors.base](colors.md)
- [spacing.base](spacing.md)
- [radius.base](radius.md)
- [typography.base](typography.md)
- [shadows.base](shadows.md)
- [zIndex.base](zindex.md)
- [size.base](size.md)
- [types](types.md)

## Export pubblici

Il root package entrypoint esporta:

- `defaultThemeTokens` (snapshot readonly default/light)
- `createThemeTokens(mode)` (snapshot readonly per `light`/`dark`)
- `type ThemeTokens`
- `type TokenPair`

## Esempio rapido

```ts
import { defaultThemeTokens, createThemeTokens } from "@personal-library/react-native-components";

const spacingMd = defaultThemeTokens.spacing.md;
const darkFeedbackError = createThemeTokens("dark").colors.feedback.error;
```

Lo snapshot pubblico espone le scale/famiglie utili al design system:
typography, spacing, radius, shadows, zIndex, size e semantic colors.
