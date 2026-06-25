# PLRNUI-32 - Card Component Token Contract

## Scope

PLRNUI-32 wires `Card` structural defaults to the approved component-token contract.

Included:

- `theme.components.card.radius`
- `theme.components.card.padding`
- `theme.components.card.shadow`
- `src/components/Card/Card.tsx` default resolution for radius, padding and shadow
- focused Node test coverage in `tests/theme/card-component-tokens.test.tsx`

Excluded:

- Card color component tokens
- variant-specific Card component tokens
- package metadata, root exports, dependencies or Card relocation
- stable promotion

## Token Contract

`theme/types.ts` defines `components.card` as `CardComponentTokens`:

- `radius: number`
- `padding: number`
- `shadow: Shadow`

`theme/defaultTheme.tsx` provides defaults from existing approved tokens:

- `radius: radius.lg`
- `padding: space.md`
- `shadow: "sm"`, resolved through `theme.shadows.sm`

## Previous Blocker

Before PLRNUI-32, Card had an open component-token blocker because `Card` declared a component-token contract in theme types but did not read it. The default prop `radius = 14` also bypassed the approved radius scale.

PLRNUI-32 removes that hardcoded default and resolves Card defaults through `theme.components.card` with approved base-token fallbacks.

## Override Precedence

Card keeps existing consumer override props.

Resolution order:

1. explicit Card prop
2. `theme.components.card` token
3. approved base-token fallback

Current mappings:

- `radius` prop > `theme.components.card.radius` > `theme.radius.lg`
- `padding` prop key > `theme.components.card.padding` > `theme.space.md`
- `shadow` prop > `theme.components.card.shadow` > existing variant fallback (`none`, `md`, `sm`)

## Verification Commands

Required PLRNUI-32 validation:

```bash
npm run typecheck
npm run test
npm run build
git diff --check
git diff -- package.json package-lock.json
git status --short
```

Focused token-path evidence:

```bash
node --import tsx --import ./tests/setup.ts --experimental-loader ./tests/react-native-loader.mjs --test tests/theme/card-component-tokens.test.tsx
```

## Final Decision On Card Maturity Blocker

The Card component-token blocker is resolved for radius, padding and shadow defaults.

Card remains `beta`, not `stable`. Stable promotion is still blocked by the broader docs/platform/support and consumer runtime gates recorded in the component maturity and release readiness audits.
