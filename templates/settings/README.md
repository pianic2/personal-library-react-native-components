# Settings starter

A settings screen built only with the public API of `@personal-library/react-native-components`: `ThemeProvider`, `ThemeAppShell`, `Heading`, `Card`, `Column`, `Text`, `Divider` and `Switch`.

- **Theme toggle:** the "Dark mode" switch calls `setPreference` of `useTheme()` with `light` or `dark` (`app/preference.ts`). `ThemeProvider` starts on `light`.
- **Switch rows:** the notification rows keep their state in the screen; replace it with your own storage.
- **Run:** `npm install`, then `npm run web` (or `npm start` for Expo Go). `npm run typecheck` checks the types; `npm run export:web` builds the web bundle.
- **Test:** `node --import tsx --test templates/settings/app/preference.test.ts`, from the root of this repository, checks that the switch selects the `dark` and `light` preference.

The library dependency is a semver range. This repository builds the starter against the packed local library: `node scripts/check-templates.mjs --build settings` (see `templates/README.md`).
