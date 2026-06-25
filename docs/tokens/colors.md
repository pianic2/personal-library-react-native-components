# colors.base

Definisce le scale colore interne usate per costruire i token tema.

## API

L’accesso consumer supportato passa dal root package entrypoint:

```ts
import { createThemeTokens, defaultThemeTokens } from "@personal-library/react-native-components";
```

Usa `defaultThemeTokens.colors` o `createThemeTokens("dark").colors` per leggere
lo snapshot pubblico dei colori.
