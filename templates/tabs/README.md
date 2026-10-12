# Tabs starter

Three tabs (Home, Explore, Profile) built only with the public API of `@personal-library/react-native-components`: `ThemeProvider`, `ThemeAppShell`, `NavProvider`, `TopBar`, `BottomBar`, `Heading`, `Card`, `Column`, `Text`, `Badge`, `Button` and `Switch`.

- **Navigation:** the app keeps the current route in state and gives it to `NavProvider` (`items`, `pathname`, `navigate`); the top bar and the bottom bar read it. `app/navigation.ts` lists the tabs. Replace the state with your router if you use one.
- **Theme:** `ThemeProvider preference="system"` follows the device colour scheme; the Profile tab has a switch that sets light or dark.
- **Run:** `npm install`, then `npm run web` (or `npm start` for Expo Go). `npm run typecheck` checks the types; `npm run export:web` builds the web bundle.

The library dependency is a semver range. This repository builds the starter against the packed local library: `node scripts/check-templates.mjs --build tabs` (see `templates/README.md`).
