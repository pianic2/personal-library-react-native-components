# E2 Design system and presets (with E3 motion and E10 responsive input)

Scope read: `src/theme/*`, `src/tokens/*`, `src/hooks/*`, `src/utils/useBreakpoint.ts`, `docs/theme.md`, `audit/adr/0004-theme-token-architecture.md`, `audit/dependencies/{peer-dependency-policy,theme-persistence-strategy,native-dependency-gate}.md`, `Button.tsx`, `Card.tsx`, `Modal.tsx`, `BottomSheet.tsx`. Source code was not modified.

## 1. Current state (evidence)

| Area | What exists | Evidence |
| --- | --- | --- |
| Token layers | Flat `Colors` object (light and dark) is both the primitive and the "semantic" layer. A second, grouped `ThemeTokens` shape (`surface/text/border/brand/feedback`) exists as a separate parallel API. Component tokens exist for `button`, `input`, `card` only. | `src/tokens/colors.base.ts`, `src/tokens/themeTokens.ts`, `src/theme/types.ts` |
| Color roles | 8 raw hues plus `primaryHover/Active`, `secondaryHover/Active`, `disabled`, `disabledBg`. No `on-primary`, no container/tonal roles, no state layers (hover/pressed/focus/selected/dragged opacities), no focus-ring role. `textPrimary` is `#020408ff` (8-digit hex, inconsistent). | `colors.base.ts` |
| Dark mode defect | `background`, `surface`, `surfaceElevated`, `disabledBg` are all `#020617` in dark: no surface hierarchy, elevation unreadable. | `colors.base.ts` darkColors |
| Spacing | Sparse primitive scale `0,4,8,12,20,30,80` and alias `space.none..xxl` (xxl = 80, jump 30 to 80). No 16, 24, 32, 40, 48. Button uses `theme.space[size]` as vertical padding (size `sm|md|lg` mapped onto `space` keys, `xs` special-cased). | `spacing.base.ts`, `Button.tsx` |
| Typography | `fontFamily` = `System` and `monospace` only. `fontSize` xs..xxxl, `lineHeight` as unitless multipliers, `fontWeight`. No text styles/roles (display, title, body, label, caption), no letterSpacing, no custom font loading contract, no Dynamic Type / `maxFontSizeMultiplier` policy. Button hardcodes `fontWeight: "600"` and indexes `fontSize[size]` (`sm/md/lg` keys happen to coincide). | `typography.base.ts`, `Button.tsx` |
| Radii | `none,xs,sm,md,lg,xl,full`. Adequate. No border-width or opacity tokens (Button uses `borderWidth: 2` component token; Card uses literal `1`). | `radius.base.ts` |
| Elevation | `shadows` none/sm/md/lg with iOS shadow props plus Android `elevation`. The cross-platform resolver (`applyShadow`, web `boxShadow` string) is duplicated in `Card.tsx` and `Box.tsx`, uses hardcoded `rgba(0,0,0,..)` and ignores `shadowColor`; `md` has offset x=3 (unnatural light direction). No dark-mode elevation (tonal surfaces). | `shadows.base.ts`, `Card.tsx:88-110`, `Box.tsx:44` |
| Motion | None. No tokens, no `Animated` usage, no reduced-motion handling (`AccessibilityInfo` not referenced anywhere in `src`). `Modal` uses RN `animationType="fade"`, `BottomSheet` `"slide"`; Modal scrim is hardcoded `rgba(0,0,0,0.5)`. | grep of `src` |
| Responsive | Two inconsistent `useBreakpoint`: `src/hooks/useBreakpoint.ts` (public, returns `Breakpoint` string, **always `"base"` on native**, so tablets get phone layout; thresholds 640/768/1024/1280) and `src/utils/useBreakpoint.ts` (not public, returns object, thresholds 480/768/1024/1280, native always `xs`). No orientation, no size classes, no `Show/Hide`, no container hook, no safe-area abstraction (ThemeProvider deliberately pure, ThemeAppShell has no insets), no foldable support. | both files, `src/index.ts:93-97` |
| Light/dark/system | `ThemeMode = "light" | "dark"`; `initialMode` default `"light"`; no `useColorScheme` / `"system"`. | `ThemeProvider.tsx` |
| Persistence | Optional, adapter-based, consumer-owned (`ThemeStorageAdapter`, `persistTheme`, `storageKey`). Persists only mode. Reads async after first render, so first paint can flash the wrong mode; `ready` is hardcoded `true`. Failures swallowed silently. Correct per peer policy. | `ThemeProvider.tsx:46-62`, `audit/dependencies/theme-persistence-strategy.md` |
| Override and composition | `createTheme(overrides, base)` deep-merges plain objects; arrays and mismatched types in overrides are silently ignored (`mergeValue` returns target when target is object and source is not). `Partial<Theme>` is shallow so nested overrides are not type-safe partial. `ThemeProvider` rebuilds the theme from `createBaseTheme(mode)`: one override object applies to both modes (cannot say "primary differs in dark only"). No theme extension, no named themes, no nested scope. | `createTheme.ts`, `ThemeProvider.tsx:85-88` |
| Component variants | Hand-written per component: `Button` has `variant`/`size` branching with nested ternaries (`ghost`, `info` variant has no color mapping, pressed state swaps background to `colors.surface`, pressed opacity token = 1). `Card` uses a different mechanism (variant plus `shadow` prop plus `bgColor`). No shared recipe system, so each component re-implements token resolution. 31 component files call `useTheme`. | `Button.tsx`, `Card.tsx` |
| Density | `size.height` {xs 26, sm 32, md 40, lg 48} only. No density axis. | `size.base.ts` |
| Tooling | No tokens manifest, no contrast validation, no hardcoded-value guard (a register exists as prose: `audit/theme/hardcoded-values-register.md`). Tests cover provider, dark mode, overrides, component tokens, public token API (`tests/theme/*`). | `tests/theme`, `audit/theme` |
| Doc drift | `docs/theme.md` says tokens are exported from `tokens/` but root exports only `createThemeTokens`, `defaultThemeTokens`. `peer-dependency-policy.md` states RN `0.85.x` while `package.json` peer is `>=0.86.0 <0.87.0`. ADR 0004 is still "Proposto". | `src/index.ts`, `package.json`, policy doc |
| Typo-level debt | Header comments with stale paths (`ui/hooks/...`, `src/tokens/radius.ts`, `zIndex.base,ts`), `TokenPair {access, refresh}` is an auth type exported as a design token type (`src/tokens/types.ts`, root export). | files above |

## 2. Gap versus a mature design system

| Capability | Status | Gap |
| --- | --- | --- |
| Primitive / semantic / component layering | partial (ADR states it, code merges layers) | Explicit three layers; semantic aliases reference primitives; components only read semantic and component tokens |
| Color roles (surface / on-surface, containers, state layers, focus ring, scrim) | missing | Add `on*` pairs, `surface` tiers (0..3) distinct in dark, `stateLayer` opacities, `focus`, `scrim` |
| Spacing | partial | Full 4pt scale plus semantic aliases, density multiplier |
| Typography | partial | Text style roles, font family slots (`display/body/mono`) with fallback, letterSpacing, Dynamic Type policy |
| Radii / border | mostly there | Add `borderWidth` and `opacity` tokens |
| Elevation | partial | One shared resolver, tonal surfaces in dark, shadow color token |
| Motion tokens and reduced motion | missing | See E3 |
| Responsive rules | broken on native | See E10 |
| Light / dark / system | partial | `"system"` preference, resolved mode exposure, flash-free persistence (`ready` gating) |
| Variants API | missing | Recipe system (section 4) |
| Theme composition | partial | `defineTheme`, extension, per-mode overrides, nested scope, strict validation |
| Persistence | adequate | Persist preference (not just resolved mode), preset id, density; expose `ready` truthfully |
| Density | missing | `compact/comfortable/spacious` |
| Tooling (manifest, contrast, hardcode guard) | missing | Ticket set below |
| Presets | missing (only default light/dark) | 8 presets below |

## 3. Architecture proposal

Constraints honoured: no new native deps; no rename of package/imports; `Theme` stays the public contract and new slots are additive (semver minor); everything resolves through `ThemeProvider` so a future `Texo` re-export shim stays a pure alias.

### 3.1 Layers

```
primitive  (src/tokens/palette.ts, scale files)   raw ramps: neutral/brand/success/... 50..950, space 0..96, radius, font sizes
   |
semantic   (src/tokens/semantic.base.ts)          roles per mode: color.surface[0..3], color.onSurface, color.primary/onPrimary/primaryContainer,
   |                                              color.stateLayer.{hover,pressed,focus,selected}, color.focusRing, color.scrim, feedback roles
component  (theme.components.*, recipes)          button/input/card first; each value is a semantic reference
```

Backwards compatibility: `theme.colors` (flat `Colors`) stays and is derived from the semantic layer, so existing component code and consumers keep working. New code reads `theme.semantic.*`. `ThemeTokens`/`createThemeTokens` is kept as a derived view; `TokenPair` is deprecated (auth type, not a token).

### 3.2 Theme contract v2 (additive)

```ts
interface Theme {
  // existing: colors, mode, spacing, space, radius, typography, shadows, zIndex, size, components, materials, globalStyles, screens
  semantic: SemanticColors;          // roles, mode-resolved
  textStyles: Record<TextRole, TextStyleToken>; // display/headline/title/body/label/caption/code
  elevation: Record<ElevationLevel, ElevationToken>; // level 0..5 -> {ios, android, web, tonalOverlay}
  motion: MotionTokens;              // E3
  density: DensityTokens;            // scale + selected level
  breakpoints: Record<Breakpoint, number>; // E10
  preset?: { id: string };
}
type ThemePreference = "light" | "dark" | "system"; // ThemeMode stays "light"|"dark" = resolved
interface ThemePreset { id: string; light: DeepPartial<Theme>; dark: DeepPartial<Theme>; defaults?: { density?: DensityLevel; preference?: ThemePreference } }
```

`createTheme(overrides)` becomes `DeepPartial`-typed; `defineTheme({ extends, light, dark })` composes (preset then user override; per-mode overrides); `ThemeProvider` gains `preset`, `preference`, `density`, keeps `initialMode`, `themeOverrides`, storage props. `ThemeScope` re-provides a sub-tree with an override for sections (cards on brand backgrounds). Persistence stores `{preference, presetId?, density?}` as JSON under the existing key (read legacy plain `"light"|"dark"` strings for compatibility), and `ready` is `false` until storage resolves so shells can hold splash.

### 3.3 Variant / recipe API

Goal: remove per-component ternaries; make variants declarative, type-inferred, themable and overridable by presets and consumers. Zero runtime deps (tiny function, no `cva` dependency).

```ts
// src/theme/recipe.ts
const buttonRecipe = defineRecipe((t: Theme) => ({
  slots: ["root", "label", "icon"],
  base: {
    root:  { flexDirection: "row", alignItems: "center", borderRadius: t.components.button.radius, gap: t.components.button.gap },
    label: { ...t.textStyles.label },
  },
  variants: {
    variant: {
      solid:   { root: { backgroundColor: t.semantic.primary },          label: { color: t.semantic.onPrimary } },
      outline: { root: { borderWidth: t.borderWidth.thin, borderColor: t.semantic.outline }, label: { color: t.semantic.onSurface } },
      ghost:   { root: { backgroundColor: "transparent" },               label: { color: t.semantic.onSurface } },
      danger:  { root: { backgroundColor: t.semantic.error },            label: { color: t.semantic.onError } },
    },
    size: {
      sm: { root: { minHeight: t.size.height.sm, paddingHorizontal: t.components.button.paddingX.sm } },
      md: { root: { minHeight: t.size.height.md, paddingHorizontal: t.components.button.paddingX.md } },
      lg: { root: { minHeight: t.size.height.lg, paddingHorizontal: t.components.button.paddingX.lg } },
    },
  },
  states: {                       // interaction states layered via state-layer tokens, not ad-hoc colors
    pressed:  { root: { overlay: "pressed" } },
    disabled: { root: { opacity: t.opacity.disabled } },
    focused:  { root: { ring: true } },
  },
  compoundVariants: [{ when: { variant: "ghost", size: "sm" }, style: { root: { paddingHorizontal: t.space.sm } } }],
  defaultVariants: { variant: "solid", size: "md" },
}));

// in component:
const s = useRecipe(buttonRecipe, { variant, size }, { pressed, disabled, focused }); // memoized, returns { root, label, icon } StyleSheet-compatible styles
```

Rules: recipe is a pure function of `Theme`, so presets/overrides apply automatically; variant prop types are inferred (`RecipeProps<typeof buttonRecipe>`); consumers can override via `theme.recipes?.button` (deep-merged `variants`/`defaultVariants`) without forking; slot styles stay plain RN style objects (no CSS-in-JS, Expo Go safe); resolution memoised per `(theme, variantKey, stateKey)`. Components migrate one at a time under E1; pilot is Button. Existing `Button` prop names (`primary|secondary|ghost|danger|info`) map as aliases for BC.

### 3.4 Elevation

One `resolveElevation(theme, level)` returns `ViewStyle` per platform: iOS `shadow*`, Android `elevation`, web `boxShadow`, plus in dark mode a tonal surface overlay colour (`surface[level]`) because shadows are invisible on dark. `Card`/`Box` drop their private `applyShadow` copies. Shadow colour becomes a token (preset can use tinted shadows).

### 3.5 Density

`density: { compact: 0.875, comfortable: 1, spacious: 1.125 }` multiplies component `height`, `paddingX/Y`, gaps (not font size, which follows text styles; not hit slop, which keeps >=44pt minimum targets). Resolved by `useDensity()`; `DensityProvider` allows per-region override (dashboard table compact inside comfortable app).

### 3.6 Motion and responsive (cross-stream)

- Motion tokens are a Theme slot (`theme.motion`), owned in code by E3 (`src/tokens/motion.base.ts`); reduced-motion preference is resolved in `MotionProvider` and consumed by every animated component.
- Engine decision (E3-02, needs owner sign-off): **core uses React Native built-in `Animated` + `LayoutAnimation` + `PanResponder`** (JS-only, zero deps, works in Expo Go and bare). Reanimated and gesture-handler are NOT peers of the core. They may be offered only through an adapter interface (`MotionEngine`) and a separate entrypoint/package after an ADR (the package currently exposes only root `exports["."]`, and `native-dependency-gate.md` requires an ADR when the public API must be split to isolate optional native features). Haptics follow the clipboard precedent: consumer-supplied adapter, no `expo-haptics` import in core.
- Responsive: breakpoints are width-based on every platform (fixes the native-always-`base` defect), plus size classes (`compact|medium|expanded`, Material window classes), orientation, container hooks; theme exposes `breakpoints` default; `ResponsiveProvider` overrides without touching the Theme.

### 3.7 Tooling

- `scripts/export-tokens.mjs`: emits W3C Design Tokens (DTCG) JSON plus a flat `tokens.manifest.json` per preset and mode (input for E13 AI manifests and Figma sync). Check-mode for CI.
- `src/theme/contrast.ts` plus `scripts/validate-theme-contrast.mjs`: WCAG 2.x ratios (APCA optional later) for every `on*`/surface pair, text sizes, per preset x mode; fails CI under 4.5 (body) / 3.0 (large text, UI components).
- Hardcoded-value guard `scripts/check-hardcoded-values.mjs` (turns `audit/theme/hardcoded-values-register.md` into a check; initial allowlist).

## 4. Preset themes

All presets are `ThemePreset` objects (`light` + `dark` deltas over the same primitives and the same `Theme` contract; no new tokens per preset). Fonts: where a preset names a display/serif face, the token defines a fallback stack in `fontFamily` and the consumer loads the font (core does not bundle fonts, to keep `files` and Expo Go neutral). Hex values are starting hints; contrast ticket E2-12 gates the final values (AA).

| Preset | Palette hints (light / dark) | Radii (xs/sm/md/lg/xl) | Type | Elevation | Density | Motion personality |
| --- | --- | --- | --- | --- | --- | --- |
| minimal | primary `#111827` ink; accent only on links `#2563EB`; bg `#FFFFFF` / `#0A0A0A`; surfaces differ by 1px border `#E5E7EB` / `#262626` | 2/4/6/8/12 | System; scale ratio 1.200, base 15; weights 400/500 only; letterSpacing 0 | none; hairline borders; shadows `none` everywhere except overlays | comfortable | 120/180ms standard ease-out; no springs, no stagger; reduce-motion identical to default |
| premium | bg `#FAF8F5` warm ivory / `#0B0B0F`; primary gold `#B8935A`; text `#14110F` / `#EDE7DD`; accent deep green `#1F4D3A` | 2/6/10/16/28 | Serif display (Playfair/Didot, fallback Georgia/serif) + System body; display tracking +0.5, uppercase labels tracking +1.2; base 16 | long soft shadows (y12 blur32 op .16), tinted warm; dark uses tonal ramp | spacious (1.125) | slow 280/420ms, cubic-bezier(.2,.8,.2,1); gentle spring (stiffness 120, damping 22); stagger 60ms |
| saas | primary indigo `#4F46E5` (dark `#818CF8`); neutrals slate; bg `#FFFFFF` / `#0B1020`; success/warn/error standard | 4/6/8/12/16 | Inter-like System; base 14, ratio 1.125; weights 400/500/600; tabular numerals in tables | sm (y1 blur2) plus 1px ring `#E2E8F0`; popovers lg | comfortable (compact opt-in) | 150/200ms standard; snappy spring (stiffness 300, damping 30); no stagger |
| consumer | primary coral `#FF5A5F`, secondary teal `#00C2A8`; bg `#FFF9F5` warm / `#14121A`; large friendly accents | 8/12/16/24/32 + pills (`full`) for buttons/chips | Rounded sans (SF Rounded/Nunito; fallback System); base 16, headings 700, ratio 1.25 | md with coloured shadow (primary at 25%); cards float | comfortable, min target 48 | bouncy: spring stiffness 220 damping 14; 220/320ms; stagger 40ms on lists; press scale 0.96 |
| editorial | paper `#FBFAF7` / `#121212`; text `#1A1A1A` / `#E8E6E1`; accent crimson `#B91C1C`; rules `#D6D3CD` | 0/0/2/2/4 | Serif body (Georgia/Merriweather) base 18, lineHeight 1.6; headings tight 1.1, ratio 1.25; measure max ~680 (exposed as `size.measure`) | none; 1px and 3px double rules as separators | spacious | 100/160ms fade only; no scale/translate; reading-focused, reduce-motion = no-op |
| ecommerce | CTA ink `#0F172A` (dark `#F8FAFC`); sale red `#DC2626`; success green `#15803D`; bg `#FFFFFF` / `#0B0B0C`; surface `#F5F5F4` | 4/6/8/12/20 | System; base 15; price role: weight 700, tabular numerals; strike-through role for old price | sm cards; sticky buy bar lg shadow above content (elevation 5) | comfortable | 160/240ms standard; press scale 0.97; add-to-cart micro spring (stiffness 260, damping 18); skeleton shimmer 1200ms |
| dashboard | bg `#F3F4F6` / `#0F1115`; primary `#3B82F6`; dataviz categorical 8 (see `dataviz` palette ref); borders `#E5E7EB` / `#272B33` | 2/4/6/8/12 | System plus mono for figures; base 13, ratio 1.1; tabular numerals mandatory | borders-first; shadows none; dark uses tonal surface ramp 0..3 | compact (0.875; table row 32/36) | 100/150ms linear-out; chart enter 400ms ease-out; no decorative motion, no springs |
| social | primary `#0EA5E9`, like `#F43F5E`; bg `#FFFFFF` / `#000000` (OLED true black); dividers `#EFF3F4` / `#2F3336` | 4/8/12/16/24 + `full` for avatars | System; base 15, names 700, handles 400 muted; ratio 1.2 | flat; dividers instead of shadows; sheets md | comfortable | lively: like-pop spring (stiffness 400, damping 10); 150/250ms; layout transition on feed insert; haptic hook on like/refresh |

## 5. Ticket map (see `tickets/E2.json`, `E3.json`, `E10.json`)

- E2 (20): contract v2, colors, typography, scales+density tokens, elevation, recipe API, composition/scope, mode+persistence+preset prop, density runtime, manifest export, contrast validation, 8 presets (one each), preset registry/barrels/docs.
- E3 (15) and E10 (14): see their JSON. Cross-stream: E3-01 and E10-01 refine skeleton token files created by E2-01; `src/theme/types.ts` is owned only by E2-01.
- Root barrel `src/index.ts`, `package.json`, and the API snapshot are deliberately not in any ticket's `filesTouched`; every stream's last ticket exports through its own area barrel and E14 must batch root exports plus `npm run api:snapshot`.

## 6. Open architecture decisions (owner needed)

1. Motion engine: core on RN `Animated`/`LayoutAnimation`/`PanResponder` (recommended) versus optional Reanimated peer with separate entrypoint. Needs ADR (E3-02) and entry-point policy (touches `package.json` `exports`, E14).
2. `ThemeMode` semantics: keep `"light"|"dark"` as resolved mode and add `ThemePreference` including `"system"` (recommended), versus widening `ThemeMode` (breaking for consumers narrowing on it).
3. Is flat `theme.colors` frozen as the legacy surface (derived from `theme.semantic`) or deprecated with codemod? Recommended: keep, derive, deprecate at 1.0 review.
4. Fix of `useBreakpoint` on native (width-based) is a behavior change: ship as minor with a breaking-change register entry (BC-xxx), or hold for 1.0.
5. Where presets ship: root export (bundle size grows ~1 KB each, tree-shakeable only if ESM sideEffects false) versus future subpath `./presets`; recommended root named exports now, subpath after E14 packaging decision.
6. Font strategy for premium/editorial/consumer: tokens with fallback stacks and consumer-loaded fonts (recommended) versus an optional `expo-font` helper outside core.
7. Stale peer doc (RN 0.85 vs `package.json` 0.86) must be reconciled before E15/E17 relies on the policy.
