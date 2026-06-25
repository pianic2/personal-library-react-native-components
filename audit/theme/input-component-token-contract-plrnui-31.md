# PLRNUI-31 - Input Component Token Contract

## Objective

Define and wire the `Input` component to an approved structural component-token contract, remove the decorative label marker, and eliminate magic sizing offsets.

## Implemented Contract

`theme.components.input` is now a required structural contract on `Theme`:

```ts
export type InputComponentSizeTokens = {
  xs: number;
  sm: number;
  md: number;
  lg: number;
};

export type InputComponentTokens = {
  height: InputComponentSizeTokens;
  paddingX: InputComponentSizeTokens;
  paddingY: InputComponentSizeTokens;
  iconBoxHeight: InputComponentSizeTokens;
  radius: number;
};
```

`Input` reads:

- `theme.components.input.height[size]`
- `theme.components.input.paddingX[size]`
- `theme.components.input.paddingY[size]`
- `theme.components.input.iconBoxHeight[size]`
- `theme.components.input.radius`

## Default Values

The base theme supplies defaults from existing base tokens only:

| Token | Default source |
| --- | --- |
| `height.xs/sm/md/lg` | `size.height.xs/sm/md/lg` |
| `paddingX.xs/sm/md/lg` | `space.xs/sm/md/lg` |
| `paddingY.xs/sm/md/lg` | `space.none` |
| `iconBoxHeight.xs/sm/md/lg` | `size.height.xs/sm/md/lg` |
| `radius` | `radius.md` |

No new base tokens or dependencies were introduced.

## Marker Decision

The former label marker was removed instead of tokenized. The marker was a hardcoded decorative `10x10` block with radius `5`, was always rendered, and was not actually tied to focus state. Removing it keeps `Input` generic and avoids promoting a visual decoration into the public theme contract.

## Magic Offset Decision

The former `-2` and `-2.5` offsets were eliminated. Internal input and icon line-box height now comes from `theme.components.input.iconBoxHeight[size]`, and vertical padding comes from `theme.components.input.paddingY[size]`.

## Semantic Colors

Semantic color behavior is preserved:

- `error` border uses `colors.error`.
- focused border uses `colors.primary`.
- default border uses `colors.border`.
- disabled background uses `colors.disabledBg`.
- text, placeholder and helper text continue to use semantic text/error colors.

## Test Evidence

`tests/theme/input-component-tokens.test.tsx` verifies:

- custom `theme.components.input` overrides are consumed by `Input`;
- `size="md"` uses custom height, radius, horizontal padding and vertical padding;
- error state keeps `colors.error`;
- focus state keeps `colors.primary`;
- disabled state keeps `colors.disabledBg`.

## Public API Impact

- Additive theme contract: `InputComponentSizeTokens` and `InputComponentTokens` are exported from `src/theme/types.ts` through the local theme barrel.
- `InputProps` is unchanged.
- Root exports in `src/index.ts` are unchanged.
- Package metadata is unchanged.
- No dependency, package subpath, or stable-promotion change was introduced.
