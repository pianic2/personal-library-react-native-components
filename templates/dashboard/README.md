# Dashboard starter

A single-screen dashboard built only with the public API of `@personal-library/react-native-components`: `ThemeProvider`, `ThemeAppShell`, `Heading`, `Card`, `Row`, `Column`, `Text`, `Badge`, `ProgressBar` and `Divider`.

- **Stats:** a wrapping row of stat cards (label, value, trend badge). The data lives in `app/data.ts`; replace it with your own source.
- **Goals:** a card with a labelled `ProgressBar` per goal.
- **Activity list:** a card with a divided list of recent items and a status badge each.
- **Theme:** `ThemeProvider preference="system"` follows the device colour scheme.
- **Run:** `npm install`, then `npm run web` (or `npm start` for Expo Go). `npm run typecheck` checks the types; `npm run export:web` builds the web bundle.

Charts are out of scope for this starter; it uses only components that already exist in the library.

The library dependency is a semver range. This repository builds the starter against the packed local library: `node scripts/check-templates.mjs --build dashboard` (see `templates/README.md`).
