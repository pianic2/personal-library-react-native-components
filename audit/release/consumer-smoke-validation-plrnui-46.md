# PLRNUI-46 - Automated Expo Consumer Smoke Validation

## Scope

Task key: PLRNUI-46.

Date: 2026-06-25.

Repository path: `/home/optimus/Documenti/GitHub/personal-library-react-native-components`.

Branch: `main`.

Node/npm:

- Node: `v20.19.2`.
- npm: `9.2.0`.

This report records the automated consumer smoke validation added for an external Expo/React Native-style consumer fixture. The validation consumes the packed package artifact through npm package resolution and does not import from the library source tree.

## Consumer Strategy

Exact validation command:

```bash
npm run consumer:smoke
```

The script performs these steps:

1. Validates the current package name and root package entrypoint metadata.
2. Runs the library build with `npm run build`.
3. Creates a deterministic fixture root at `/tmp/plrnui-46-consumer-smoke`.
4. Packs the library with `npm pack --pack-destination /tmp/plrnui-46-consumer-smoke/artifacts`.
5. Verifies the packed tarball exists and does not include `src/` files.
6. Creates a minimal generated consumer fixture at `/tmp/plrnui-46-consumer-smoke/consumer`.
7. Installs the packed artifact with normal npm package semantics using `file:/tmp/plrnui-46-consumer-smoke/artifacts/personal-library-react-native-components-0.0.0.tgz`.
8. Runs `npm ls @personal-library/react-native-components react react-native --depth=0` inside the consumer.
9. Runs consumer TypeScript validation with `npm run typecheck`.
10. Runs consumer render smoke with `npm run render:smoke`.

The generated consumer fixture includes an Expo-style `app.json` and React Native dependencies, but the render check uses the existing repository Node render strategy with a React Native shim. It is therefore a package/type/render consumer smoke, not an Expo CLI Metro export or device runtime proof.

## Public API Covered

Runtime root imports from `@personal-library/react-native-components`:

- `ThemeProvider`
- `Button`
- `Text`
- `Box`
- `Input`
- `Card`

Type-level root imports from `@personal-library/react-native-components`:

- `ButtonProps`
- `TextProps`
- `InputProps`
- `CardProps`
- `ThemeProviderProps`

The consumer render path mounts:

```tsx
<ThemeProvider>
  <Box>
    <Text />
    <Input />
    <Card>
      <Button />
    </Card>
  </Box>
</ThemeProvider>
```

Legacy AURA imports are not required. The render test also confirms `auraTokens` and `getAuraTokens` are not root runtime exports.

## Commands Executed

Initial red/green evidence:

```bash
npm run test
```

Result before implementation: failed on the newly added PLRNUI-46 command contract test because `consumer:smoke` and `scripts/consumer-smoke.mjs` did not exist.

Result after implementation: passed, 10/10 test files.

Consumer smoke attempts:

```bash
npm run consumer:smoke
```

Sandboxed result: failed during generated fixture dependency resolution. A direct registry check failed with `EAI_AGAIN registry.npmjs.org`, confirming network dependency for fresh consumer dependency installation in this environment.

Network-enabled result: passed.

Important output from the passing run:

```text
added 242 packages in 17s
plrnui-46-expo-consumer-smoke@0.0.0 /tmp/plrnui-46-consumer-smoke/consumer
├── @personal-library/react-native-components@0.0.0
├── react-native@0.85.3
└── react@19.2.7

> plrnui-46-expo-consumer-smoke@0.0.0 typecheck
> tsc --noEmit

> plrnui-46-expo-consumer-smoke@0.0.0 render:smoke
> node --import tsx --import ./test/setup.ts --experimental-loader ./test/react-native-loader.mjs --test test/consumer-render.test.tsx

# pass 2
# fail 0
PLRNUI-46 consumer smoke passed using /tmp/plrnui-46-consumer-smoke/artifacts/personal-library-react-native-components-0.0.0.tgz
```

The passing run emitted `EBADENGINE` warnings because the host was Node `v20.19.2`, while the package declares `node >=22` and React Native `0.85.3` declares `^20.19.4 || ^22.13.0 || ^24.3.0 || >= 25.0.0`.

## Result

Pass with residual risks.

Confirmed:

- The consumer imports from package root only.
- The consumer does not import from the library source tree.
- The consumer installs the packed `.tgz` artifact through npm package resolution.
- The package root entrypoints and declaration entrypoints resolve from the consumer.
- Representative public runtime exports import and render.
- Representative public type exports resolve in consumer TypeScript.
- No legacy AURA package/import is required.

## Residual Risks

- The generated consumer dependency install requires registry access when dependencies are not already cached; this environment needed network-enabled execution for the passing run.
- The host Node version is below the current package/RN engine baseline, so the passing run includes engine warnings.
- The render smoke uses a Node React Native shim, matching the repository render strategy, and does not prove Expo CLI Metro export, iOS/Android device runtime behavior, Expo Go, prebuild or custom dev client compatibility.
- The fixture is deterministic and overwritten at `/tmp/plrnui-46-consumer-smoke`, but it is intentionally left after execution for inspection.
