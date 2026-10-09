# Examples naming convention

- Examples live in `examples/*.tsx`, one topic per file (`basic-usage.tsx`, `form-controls.tsx`, ...).
- Each file imports only from the public package name (`@personal-library/react-native-components`).
- Each file exports at least one component whose name ends with `Example` (for example `BasicUsageExample`) that renders without props.
- Files for experimental components carry `.experimental.` in the file name (`overlays.experimental.tsx`).
- `tests/examples/render.test.tsx` renders every exported `*Example` component and checks that an example with a bad import fails.
- `tsconfig.tests.json` type-checks `examples/**/*.tsx` with the package name mapped to `src`.
