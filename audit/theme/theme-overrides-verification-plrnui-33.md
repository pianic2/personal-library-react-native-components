# PLRNUI-33 - Theme Override Verification

## Objective

Verify and harden nested `themeOverrides` behavior before treating the override API as stable.

PLRNUI-33 responds to the PLRNUI-6 theme/token audit and Risk Assessment 0004 finding that override behavior was only partially verified and the merge path used broad internal `any`.

## Scope

Included:

- `ThemeProvider` override flow through `createTheme(themeOverrides, createBaseTheme(mode))`.
- `createTheme` nested merge behavior for `colors`, `radius`, `size`, and `components`.
- Component token override coverage for Button, Input, and Card.
- Invalid structure handling for required object branches.

Excluded:

- Runtime schema validation.
- Public API redesign.
- `ThemeProviderProps.themeOverrides` type widening.
- Package metadata, root exports, dependencies or stable promotion.

## Verified Behavior

`tests/theme/theme-overrides.test.tsx` verifies:

- nested `colors` overrides preserve sibling semantic color tokens;
- nested `radius` and `size.height` overrides preserve sibling scale tokens;
- nested `components.button`, `components.input`, and `components.card` overrides preserve sibling component tokens;
- partial component overrides preserve the full required theme structure;
- `undefined` override values do not erase required base values;
- invalid object branch replacements forced past TypeScript are safely rejected.

## Merge Behavior Policy

`createTheme` keeps its existing public signature:

```ts
createTheme(overrides?: Partial<Theme>, baseTheme?: Theme): Theme
```

The merge policy is:

- plain-object override branches are deep-merged into plain-object base branches;
- sibling keys from the base theme are preserved when only a nested subset is overridden;
- `undefined` override values are ignored;
- non-plain override values cannot replace required base object branches;
- scalar leaves can still be overridden by typed scalar values.

## Invalid Structure Policy

Normal consumer usage remains TypeScript-governed through `Partial<Theme>`.

Invalid object branch replacements forced through casts, such as `colors: null`, `radius: "invalid"`, `size.height: []`, or `components.button: []`, are unsupported but safely ignored for required object branches. The base theme branch is preserved.

Invalid scalar leaf values forced through casts remain unsupported. PLRNUI-33 intentionally does not add runtime schema validation for scalar leaves.

## RA 0004 Response

PLRNUI-33 reduces the override portion of Risk Assessment 0004 by adding executable coverage and removing broad internal `any` from the merge path.

Remaining RA 0004 gates are unchanged:

- clean consumer runtime proof is still separate release work;
- broader component tokenization remains limited to promoted component candidates;
- legacy token naming and stable promotion remain separate governance decisions.

## Public API Impact

- `ThemeProviderProps.themeOverrides?: Partial<Theme>` is unchanged.
- `createTheme` public signature is unchanged.
- Root exports are unchanged.
- `package.json` and `package-lock.json` are unchanged.
- No new runtime dependency or native dependency is introduced.
- No component or theme API is promoted to `stable`.

## Verification Commands

Required PLRNUI-33 validation:

```bash
nvm use 24
node -v
npm -v
npm run typecheck
npm run test
npm run build
git diff --check
git status --short
```

Focused override evidence:

```bash
node --import tsx --import ./tests/setup.ts --experimental-loader ./tests/react-native-loader.mjs --test tests/theme/theme-overrides.test.tsx
```
