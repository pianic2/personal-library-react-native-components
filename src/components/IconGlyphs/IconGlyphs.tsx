import React from "react";
import { IconProvider, createSvgIconSet, type IconSetAdapter, type SvgModule } from "../Icon/index.js";

/**
 * Own-drawn UI glyphs: filled shapes in a 24 x 24 view box (SVG path data), drawn with the icon colour. They carry no
 * third-party artwork. Rendering needs the `react-native-svg` module you install: it is injected, never imported here.
 */
export const glyphs = {
  "check": "M19.6 5.6 L21 7 L9 19 L3.4 13.4 L4.8 12 L9 16.2 Z",
  "close": "M13.4 12 L19 17.6 L17.6 19 L12 13.4 L6.4 19 L5 17.6 L10.6 12 L5 6.4 L6.4 5 L12 10.6 L17.6 5 L19 6.4 Z",
  "plus": "M11 5 L13 5 L13 11 L19 11 L19 13 L13 13 L13 19 L11 19 L11 13 L5 13 L5 11 L11 11 Z",
  "minus": "M5 11 L19 11 L19 13 L5 13 Z",
  "chevron-up": "M5.29 14.29 L12 7.59 L18.71 14.29 L17.29 15.71 L12 10.41 L6.71 15.71 Z",
  "chevron-down": "M6.71 8.29 L12 13.59 L17.29 8.29 L18.71 9.71 L12 16.41 L5.29 9.71 Z",
  "chevron-left": "M15.71 6.71 L10.41 12 L15.71 17.29 L14.29 18.71 L7.59 12 L14.29 5.29 Z",
  "chevron-right": "M9.71 5.29 L16.41 12 L9.71 18.71 L8.29 17.29 L13.59 12 L8.29 6.71 Z",
  "search": "M3.5 10 A6.5 6.5 0 1 1 16.5 10 A6.5 6.5 0 1 1 3.5 10 Z M5.5 10 A4.5 4.5 0 1 0 14.5 10 A4.5 4.5 0 1 0 5.5 10 Z M14.6 16 L16 14.6 L20.8 19.4 L19.4 20.8 Z",
  "eye": "M2 12 A10 6.5 0 1 1 22 12 A10 6.5 0 1 1 2 12 Z M4 12 A8 4.5 0 1 0 20 12 A8 4.5 0 1 0 4 12 Z M9 12 A3 3 0 1 1 15 12 A3 3 0 1 1 9 12 Z",
  "eye-off": "M2 12 A10 6.5 0 1 1 22 12 A10 6.5 0 1 1 2 12 Z M4 12 A8 4.5 0 1 0 20 12 A8 4.5 0 1 0 4 12 Z M9 12 A3 3 0 1 1 15 12 A3 3 0 1 1 9 12 Z M4.78 3.22 L20.78 19.22 L19.22 20.78 L3.22 4.78 Z",
  "calendar": "M3 5 L21 5 L21 21 L3 21 Z M5 19 L19 19 L19 7 L5 7 Z M3 5 L21 5 L21 9 L3 9 Z M7 2 L9 2 L9 7 L7 7 Z M15 2 L17 2 L17 7 L15 7 Z M7 12 L10 12 L10 15 L7 15 Z M14 12 L17 12 L17 15 L14 15 Z",
  "clock": "M2 12 A10 10 0 1 1 22 12 A10 10 0 1 1 2 12 Z M4 12 A8 8 0 1 0 20 12 A8 8 0 1 0 4 12 Z M11 6 L13 6 L13 11.2 L16.6 13.3 L15.6 15 L11 12.3 Z",
  "star": "M12 2.5 L14.59 8.94 L21.51 9.41 L16.18 13.86 L17.88 20.59 L12 16.9 L6.12 20.59 L7.82 13.86 L2.49 9.41 L9.41 8.94 Z",
  "star-outline": "M12 2.5 L14.59 8.94 L21.51 9.41 L16.18 13.86 L17.88 20.59 L12 16.9 L6.12 20.59 L7.82 13.86 L2.49 9.41 L9.41 8.94 Z M10.3 10.55 L5.72 10.86 L9.24 13.8 L8.12 18.24 L12 15.8 L15.88 18.24 L14.76 13.8 L18.28 10.86 L13.7 10.55 L12 6.3 Z",
  "info": "M2 12 A10 10 0 1 1 22 12 A10 10 0 1 1 2 12 Z M10.6 7.6 A1.4 1.4 0 1 0 13.4 7.6 A1.4 1.4 0 1 0 10.6 7.6 Z M11 17.5 L13 17.5 L13 10.5 L11 10.5 Z",
  "alert": "M12 2.5 L22.5 20.5 L1.5 20.5 Z M11 15 L13 15 L13 9 L11 9 Z M10.8 17.5 A1.2 1.2 0 1 0 13.2 17.5 A1.2 1.2 0 1 0 10.8 17.5 Z",
  "error": "M2 12 A10 10 0 1 1 22 12 A10 10 0 1 1 2 12 Z M11 13.5 L13 13.5 L13 6.5 L11 6.5 Z M10.7 16.8 A1.3 1.3 0 1 0 13.3 16.8 A1.3 1.3 0 1 0 10.7 16.8 Z",
  "success": "M2 12 A10 10 0 1 1 22 12 A10 10 0 1 1 2 12 Z M17 9.9 L15.6 8.5 L10.6 13.5 L8.4 11.3 L7 12.7 L10.6 16.3 Z",
  "upload": "M12 3 L18 9 L16.6 10.4 L13 6.8 L13 16 L11 16 L11 6.8 L7.4 10.4 L6 9 Z M4 18 L20 18 L20 20.4 L4 20.4 Z",
  "trash": "M3 5 L21 5 L21 7 L3 7 Z M9 2.5 L15 2.5 L15 4.5 L9 4.5 Z M5 8.5 L19 8.5 L18 21.5 L6 21.5 Z M9.2 18.5 L10.8 18.5 L10.8 11 L9.2 11 Z M13.2 18.5 L14.8 18.5 L14.8 11 L13.2 11 Z",
  "edit": "M14.2 6 L18 9.8 L6.8 21 L3 21 L3 17.2 Z M15.6 4.6 L17.3 2.9 L18.1 2.9 L21.1 5.9 L21.1 6.7 L19.4 8.4 Z",
  "copy": "M8 8 L21 8 L21 21 L8 21 Z M10 19 L19 19 L19 10 L10 10 Z M3 3 L14 3 L14 6 L6 6 L6 14 L3 14 Z",
  "menu": "M3 5 L21 5 L21 7 L3 7 Z M3 11 L21 11 L21 13 L3 13 Z M3 17 L21 17 L21 19 L3 19 Z",
  "more-horizontal": "M3 12 A2 2 0 1 1 7 12 A2 2 0 1 1 3 12 Z M10 12 A2 2 0 1 1 14 12 A2 2 0 1 1 10 12 Z M17 12 A2 2 0 1 1 21 12 A2 2 0 1 1 17 12 Z",
  "user": "M7.5 7.5 A4.5 4.5 0 1 1 16.5 7.5 A4.5 4.5 0 1 1 7.5 7.5 Z M3 21 C3 15.5 7 14 12 14 C17 14 21 15.5 21 21 Z",
  "image": "M3 4 L21 4 L21 20 L3 20 Z M5 18 L19 18 L19 6 L5 6 Z M6.7 9.5 A1.8 1.8 0 1 1 10.3 9.5 A1.8 1.8 0 1 1 6.7 9.5 Z M5 18 L10 12.5 L13 15.5 L15.5 13 L19 18 Z",
  "file": "M5 2 L14 2 L20 8 L20 22 L5 22 Z M7 20 L18 20 L18 9 L13 9 L13 4 L7 4 Z M14.6 7.4 L17.2 7.4 L14.6 4.8 Z",
  "arrow-left": "M11 5 L12.4 6.4 L7.8 11 L20 11 L20 13 L7.8 13 L12.4 17.6 L11 19 L4 12 Z",
  "arrow-right": "M20 12 L13 19 L11.6 17.6 L16.2 13 L4 13 L4 11 L16.2 11 L11.6 6.4 L13 5 Z",
  "clear": "M2 12 A10 10 0 1 1 22 12 A10 10 0 1 1 2 12 Z M15.8 8.9 L15.1 8.2 L12 11.3 L8.9 8.2 L8.2 8.9 L11.3 12 L8.2 15.1 L8.9 15.8 L12 12.7 L15.1 15.8 L15.8 15.1 L12.7 12 Z",
} as const;

export type GlyphName = keyof typeof glyphs;

/** The glyph names, in declaration order. */
export const GLYPH_NAMES = Object.keys(glyphs) as GlyphName[];

/** An icon set that draws the built-in glyphs with the given `react-native-svg` module (`Svg` and `Path`). */
export function createGlyphIconSet(svg: SvgModule): IconSetAdapter {
  return createSvgIconSet(svg, glyphs);
}

export interface IconGlyphsProps {
  /** The `react-native-svg` module (or `{ Svg, Path }`) you installed. */
  svg: SvgModule;
  /** The icon set name the glyphs are registered under. Default `"default"`, so `<Icon name="check" />` finds them. */
  setName?: string;
  children?: React.ReactNode;
}

/**
 * Registers the built-in glyphs as the `default` icon set (or `setName`) for everything below it. An `IconProvider` below
 * with the same set name replaces them; other sets are untouched.
 */
export function IconGlyphs({ svg, setName = "default", children }: IconGlyphsProps): React.ReactElement {
  // One adapter per svg module: a new object each render would re-render every Icon below.
  const sets = React.useMemo(() => ({ [setName]: createGlyphIconSet(svg) }), [svg, setName]);
  return <IconProvider sets={sets}>{children}</IconProvider>;
}
