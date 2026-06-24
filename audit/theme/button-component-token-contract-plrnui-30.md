# PLRNUI-30 - Button component token contract

## Decision

Button consumes `theme.components.button` for structural component tokens.

## Implemented token paths

- `theme.components.button.height.sm`
- `theme.components.button.height.md`
- `theme.components.button.height.lg`
- `theme.components.button.paddingX.sm`
- `theme.components.button.paddingX.md`
- `theme.components.button.paddingX.lg`
- `theme.components.button.iconSize.sm`
- `theme.components.button.iconSize.md`
- `theme.components.button.iconSize.lg`
- `theme.components.button.radius`
- `theme.components.button.gap`
- `theme.components.button.borderWidth`
- `theme.components.button.opacity.disabled`
- `theme.components.button.opacity.pressed`

## Preserved behavior

- Button public props unchanged.
- Root API unchanged.
- Light/dark behavior remains semantic-color-token driven.
- Variant behavior unchanged.
- No new runtime dependencies.
- Existing `size="xs"` behavior remains supported outside the PLRNUI-30 component-token contract.

## Explicit non-goals

The following are intentionally not added in PLRNUI-30:

- Button background color component tokens.
- Button text color component tokens.
- Button border color component tokens.
- Button typography tokens.
- Button shadow/elevation tokens.
- Button animation tokens.
- Button min/max width tokens.

## Validation

- `npm run typecheck`: passed.
- `npm run test`: passed, 5 test files passed.
- `npm run build`: passed.
- `git diff --check`: passed.
- `git diff -- package.json package-lock.json`: no diff.
- `npm run package:dry-run`: failed with `EROFS` writing to `/home/optimus/.npm/_cacache`.
- `npm_config_cache=/tmp/plrnui30-npm-cache npm run package:dry-run`: passed, package size `54.5 kB`, unpacked size `239.4 kB`, total files `407`.
