# IconGlyphs

**Stability:** prototype — experimental, not yet exported from the package root.

A built-in set of 31 own-drawn UI glyphs for `Icon`: check, close, plus, minus, chevrons, search, eye, calendar, clock, star, info, alert, upload, trash, edit, copy, menu, user, image, file, arrows and more. They are filled 24 × 24 shapes (SVG path data, no third-party artwork) drawn with the icon colour.

Drawing SVG needs `react-native-svg`. This library has no such dependency: you install it and **pass the module in**.

## Import

Not exported from the package root yet (the wiring tickets own that); import from the component folder (relative to `src/`):

```ts
import { IconGlyphs, GLYPH_NAMES, createGlyphIconSet, glyphs } from "./components/IconGlyphs/index.js";
import type { GlyphName, IconGlyphsProps } from "./components/IconGlyphs/index.js";
```

## Props

```ts
interface IconGlyphsProps {
  svg: SvgModule; // the react-native-svg module (or { Svg, Path })
  setName?: string; // default "default"
  children?: React.ReactNode;
}

type GlyphName = "check" | "close" | "plus" | "minus" | "chevron-up" | "chevron-down" | "chevron-left" | "chevron-right"
  | "search" | "eye" | "eye-off" | "calendar" | "clock" | "star" | "star-outline" | "info" | "alert" | "error" | "success"
  | "upload" | "trash" | "edit" | "copy" | "menu" | "more-horizontal" | "user" | "image" | "file" | "arrow-left"
  | "arrow-right" | "clear";
```

## Usage

```tsx
import * as Svg from "react-native-svg";

<IconGlyphs svg={Svg}>
  <Icon name="check" color="success" />
  <Icon name="search" size="lg" label="Search" />
</IconGlyphs>

// Without the provider component
const set = createGlyphIconSet(Svg);
<IconProvider sets={{ default: set }}>...</IconProvider>
```

## Behaviour

- `IconGlyphs` registers the glyphs as the `default` icon set (or `setName`) for everything below it. An `IconProvider` below with the same set name replaces them; other sets are untouched.
- `IconGlyphs` with the default set name **replaces** a `default` set of an outer `IconProvider` for its subtree (the inner key wins; there is no per-name fallback). To keep your own default set, register the glyphs under another name (`setName="glyphs"` and `<Icon set="glyphs" />`) or put `IconGlyphs` outside your provider.
- Pass a stable `svg` (the `import * as Svg` namespace): a fresh inline `{ Svg, Path }` object each render rebuilds the set and re-renders every `Icon` below.
- `glyphs` maps each name to its path data, `GLYPH_NAMES` lists the names in a stable order, `createGlyphIconSet(svg)` returns the icon set adapter. An unknown name renders nothing (and `Icon` warns once in development).
- **Differences from the ticket text**: the ticket sketches `glyphIconSet = createSvgIconSet(glyphs)`, but `createSvgIconSet` takes the injected SVG module as its first argument and the library may not import `react-native-svg`, so the set is created with `createGlyphIconSet(svg)`. `Icon` itself is not changed to fall back to the glyphs without a provider (it belongs to another ticket): wrap the app in `IconGlyphs` instead.

## Accessibility

Decorative by default through `Icon`: without `label` the glyph is hidden from assistive technology; with `label` it is an image with that label.
