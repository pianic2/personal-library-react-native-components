# PLRNUI-58 - Expo Metro Consumer Validation

## Scope

Task key: PLRNUI-58.

Date: 2026-06-25.

Repository path: `/home/optimus/Documenti/GitHub/personal-library-react-native-components`.

Branch: `main`.

Node/npm:

- Node: `v20.19.2`.
- npm: `9.2.0`.

PLRNUI-58 closes the Metro-specific validation gap left after PLRNUI-46.

- PLRNUI-46: Node-based external package smoke using a packed `.tgz`, root imports, TypeScript validation and `react-test-renderer` with a React Native shim.
- PLRNUI-58: Expo/Metro consumer validation using a packed `.tgz`, a generated Expo app fixture and `expo export --platform web`.

## Consumer Strategy

Exact command added:

```bash
npm run consumer:expo
```

Exact consumer fixture path:

```text
/tmp/plrnui-58-expo-consumer/consumer
```

Exact package consumption method:

```text
file:/tmp/plrnui-58-expo-consumer/artifacts/personal-library-react-native-components-0.0.0.tgz
```

Exact Expo/Metro command:

```bash
npx expo export --platform web --output-dir dist-web
```

The script:

1. Validates package identity and root entrypoint metadata.
2. Runs `npm run build`.
3. Packs the library to `/tmp/plrnui-58-expo-consumer/artifacts`.
4. Verifies the packed tarball exists and does not include `src/` files.
5. Recreates `/tmp/plrnui-58-expo-consumer/consumer` deterministically.
6. Writes a minimal Expo web app fixture.
7. Installs the packed package artifact with normal npm package resolution.
8. Runs `npm ls @personal-library/react-native-components expo react react-native --depth=0`.
9. Runs TypeScript validation inside the fixture.
10. Runs Expo Metro web export.

The consumer fixture imports only from `@personal-library/react-native-components`. It does not import from package `src/`, package `dist/`, monorepo-relative paths, package subpaths, `@aura/ui` or `AURA`.

## Public API Covered

Runtime root imports:

- `ThemeProvider`
- `Box`
- `Text`
- `Button`
- `Input`
- `Card`

Type root imports:

- `ThemeProviderProps`
- `ButtonProps`
- `TextProps`
- `InputProps`
- `CardProps`

Bundled render tree:

```tsx
<ThemeProvider>
  <Box>
    <Text />
    <Input />
    <Card>
      <Text />
      <Button />
    </Card>
  </Box>
</ThemeProvider>
```

## Commands Executed

Red/green guard evidence:

```bash
node --import tsx --import ./tests/setup.ts --experimental-loader ./tests/react-native-loader.mjs --test tests/scripts/expo-consumer-smoke-script.test.tsx
```

Initial result: failed before implementation because `consumer:expo` and `scripts/expo-consumer-smoke.mjs` did not exist.

Implemented result: passed.

Expo consumer validation:

```bash
npm run consumer:expo
```

Sandboxed result: failed during generated fixture dependency resolution with strict npm peer resolution because registry/package metadata could not be fully resolved in the sandbox.

Network-enabled attempts:

- First network-enabled attempt installed the packed package, then failed consumer TypeScript because the generated fixture did not satisfy required public props.
- After fixing the fixture, a retry failed during npm install with `ECONNRESET`.
- A later run caught a deterministic fixture cleanup bug: `consumerDir` was not recreated before writing `package.json`; the script now recreates it explicitly.
- Final post-fix retry passed.

Important output from the passing run:

```text
added 490 packages in 32s
plrnui-58-expo-metro-consumer@0.0.0 /tmp/plrnui-58-expo-consumer/consumer
├── @personal-library/react-native-components@0.0.0
├── expo@56.0.12
├── react-native@0.85.3
└── react@19.2.7

> plrnui-58-expo-metro-consumer@0.0.0 typecheck
> tsc --noEmit

Starting Metro Bundler

Web Bundled 484ms index.js (280 modules)

Exported: dist-web
PLRNUI-58 Expo/Metro consumer smoke passed using /tmp/plrnui-58-expo-consumer/artifacts/personal-library-react-native-components-0.0.0.tgz
```

The passing run emitted `EBADENGINE` warnings because the host was Node `v20.19.2`, while this package declares `node >=22` and React Native/Metro require a newer Node line.

## Result

Pass with residual risks.

Confirmed:

- Packed artifact install works in an external Expo fixture.
- Consumer TypeScript resolves representative root runtime and type exports.
- Expo web export starts Metro and bundles the app with the package resolved from `node_modules`.
- No direct `src/` or `dist/` imports are used as the validation path.
- No legacy AURA names/imports are required.

## Residual Risks

- The generated fixture dependency install requires registry access when dependencies are not already cached; this environment needed network-enabled execution and one retry after `ECONNRESET`.
- Host Node `v20.19.2` is below the approved package/RN/Metro engine baseline, so engine warnings remain.
- Expo web export is proven. Expo Go runtime, native device runtime, managed workflow runtime, prebuild and custom dev client behavior remain unproven locally.
