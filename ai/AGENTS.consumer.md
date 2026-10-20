<!-- Copy this section into your app's AGENTS.md (or CLAUDE.md). Library repo rules live in the library's own AGENTS.md. -->
## @personal-library/react-native-components

This app uses `@personal-library/react-native-components` (React Native / Expo UI library).

- Import components from the package root, theme from `@personal-library/react-native-components/theme` and tokens from `.../tokens`. Never import from `dist/` or `src/` paths.
- Wrap the app in `ThemeProvider` before rendering components; read colours, spacing and type from tokens, not hard-coded values.
- Reuse library components (Button, Input, Select, Modal, Screen, ...) before writing custom UI.
- Open state props are `open` / `defaultOpen` / `onOpenChange`.
- Look up a component's props in `node_modules/@personal-library/react-native-components/dist/meta/props.json` (query by component name; do not read the whole file).
- Check accessibility props (labels, roles, states) on interactive elements; keep touch targets at least 44 pt.
- Do not edit files under `node_modules/`. Do not deep-import internals; only documented exports are supported.
