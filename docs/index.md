# Personal Library React Native Components

Personal Library React Native Components is a UI library of React components designed for React Native and React Native Web.

## What it includes

- Components: layout, typography, form, navigation, feedback, overlay, surfaces
- Theme and tokens (colors, spacing, radius, typography, shadows, zIndex)
- Hooks and utilities

## Documentation

- [Getting started](getting-started.md)
- [Components](components.md)
- [Theme (tree)](theme/index.md)
- [Tokens](tokens/index.md)
- [Utils](utils/index.md)

## Stability labels

- `beta`: public consumer API, usable but contract may still change.
- `experimental`: provisional API, not recommended for production dependency.
- `internal`: not part of the public consumer API.
- `deprecated / legacy`: historical alias or API kept only for migration context.
- `stable`: currently no component/API is classified as stable.

## Entry point

The public consumer API is exposed from the root package entry point:

```ts
import { ThemeProvider, NavBar, Box, Text } from "@personal-library/react-native-components";
```
