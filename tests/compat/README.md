# Legacy-shim compatibility suite

Runs a curated subset of the component, theme and accessibility tests through the **legacy specifier** (PLRNUI-162,
ADR 0013): the tests import `@legacy-placeholder/shim` (override with `COMPAT_LEGACY`) and the loader
`tests/compat-loader.mjs` maps it to the generated shim, whose `export * from "<target>"` is mapped to the built target.
Before the cutover the legacy name is the placeholder of `scripts/build-shim.mjs` and the target is the current package.

| File | What it checks |
| --- | --- |
| `surface.test.tsx` | The legacy specifier (root, `/theme`, `/tokens`) exposes exactly the exports of the built target, with the same values, and every snapshot export |
| `render.test.tsx` | Core components render and respond to presses; theme overrides and initial mode work through the legacy `ThemeProvider` |
| `accessibility.test.tsx` | Role, name and state contracts of Button, Input, Checkbox, Switch, RadioGroup |
| `harness.check.mjs` | Not a test file: proves the suite is a real gate (see below) |

## Run

```sh
npm run build
node scripts/build-shim.mjs --out dist-shim        # dist-shim is gitignored
node --import tsx --import ./tests/setup.ts --experimental-loader ./tests/compat-loader.mjs --test tests/compat/*.test.tsx
```

Control run (the legacy specifier resolves straight to the built target; must pass too):

```sh
COMPAT_MODE=target node --import tsx --import ./tests/setup.ts --experimental-loader ./tests/compat-loader.mjs --test tests/compat/*.test.tsx
```

Environment: `COMPAT_MODE` (`shim` default, or `target`), `COMPAT_LEGACY`, `COMPAT_TARGET`, `COMPAT_SHIM_DIR` (default `dist-shim`).

Gate proof (needs the build and the shim): `node tests/compat/harness.check.mjs` runs the suite against the shim (must pass),
in control mode (must pass) and against a copy of the shim that lacks one export (default `Button`, override with
`COMPAT_OMIT_EXPORT`; must fail).

## Notes

- Fail-closed: when the loader is active and `dist-shim` or `dist` is missing, the loader throws and the suite fails; it never
  falls back to the source.
- `npm test` also globs this folder but runs without the compat loader: there the specifier cannot be resolved and the suite
  falls back to the source API, as a plain control run.
- The package.json script name and the CI job are deferred to E17-01 / E17-05 (`package.json` and workflows are not owned by
  this ticket). Suggested script: `test:compat` = build + `node scripts/build-shim.mjs --out dist-shim` + the command above.
- The shim currently generates entries for subpaths the package does not ship yet (`./native`, `./testing`, `./meta`); the
  suite only uses the root, `/theme` and `/tokens`.
