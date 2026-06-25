# Personal Library React Native Components

Personal Library React Native Components è una libreria UI composta da
componenti React pensati per essere usati in contesti React Native e React
Native Web.

## Cosa include

- Componenti: layout, typography, form, navigation, feedback, overlay, surfaces
- Theme e token (colori, spacing, radius, typography, shadows, zIndex)
- Hook e utilità

## Documentazione

- [Components](components.md)
- [Theme (tree)](theme/index.md)
- [Tokens](tokens/index.md)
- [Utils](utils/index.md)

## Entry point

L’API pubblica consumer è esposta dal root package entrypoint:

```ts
import { ThemeProvider, NavBar, Box, Text } from "@personal-library/react-native-components";
```
