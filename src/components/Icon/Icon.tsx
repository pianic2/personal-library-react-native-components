import React, { createContext, useContext, useMemo, useRef } from "react";
import type { ComponentType, ReactElement, ReactNode } from "react";
import { View } from "react-native";
import { useTheme } from "../../theme/useTheme.js";

/** What an icon set receives to draw one icon. */
export interface IconRenderOptions {
  size: number;
  color: string;
}

/** A pluggable icon set: draws an icon by name, or returns `null` when it does not have that name. */
export interface IconSetAdapter {
  render(name: string, options: IconRenderOptions): ReactElement | null;
  /** The names the set can draw, for tooling and tests. */
  names?: string[];
}

export type IconSets = Record<string, IconSetAdapter>;

/** Named sizes: the fixed 12, 16, 20 and 24 scale (the theme has no `size.icon` token yet). */
export const ICON_SIZES = { xs: 12, sm: 16, md: 20, lg: 24 } as const;
export type IconSize = keyof typeof ICON_SIZES | number;

type ColorKey = keyof ReturnType<typeof useTheme>["colors"];

export interface IconProps {
  name: string;
  size?: IconSize;
  /** A colour token of the current theme (for example `"primary"`) or any colour string. Defaults to `textPrimary`. */
  color?: ColorKey | (string & {});
  /** Makes the icon an image with this accessibility label; without it the icon is decorative and hidden from assistive technology. */
  label?: string;
  /** The icon set to draw from; `"default"` when omitted. */
  set?: string;
}

export interface IconProviderProps {
  sets: IconSets;
  children?: ReactNode;
}

const IconContext = createContext<IconSets>({});

function isDev(): boolean {
  return (globalThis as { __DEV__?: boolean }).__DEV__ === true;
}

/**
 * Provides icon sets to `Icon`. Sets of a nested provider are added to (and win over) the sets of its parent, so a
 * screen can add or replace a set without losing the app-wide ones.
 */
export function IconProvider({ sets, children }: IconProviderProps) {
  const parent = useContext(IconContext);
  const merged = useMemo(() => ({ ...parent, ...sets }), [parent, sets]);
  return <IconContext.Provider value={merged}>{children}</IconContext.Provider>;
}

/** The icon sets in scope. */
export function useIconSets(): IconSets {
  return useContext(IconContext);
}

/** An icon set from a map of components that take `{ size, color }`. */
export function createIconSet(map: Record<string, ComponentType<IconRenderOptions>>): IconSetAdapter {
  return {
    names: Object.keys(map),
    render(name, options) {
      if (!Object.prototype.hasOwnProperty.call(map, name)) return null;
      const Glyph = map[name]!;
      return <Glyph size={options.size} color={options.color} />;
    },
  };
}

/** Adapts any component that takes `size` and `color` props to the `{ size, color }` shape used by icon sets. */
export function iconFromComponent<P extends { size?: number; color?: string }>(Component: ComponentType<P>): ComponentType<IconRenderOptions> {
  function IconFromComponent({ size, color }: IconRenderOptions) {
    return <Component {...({ size, color } as P)} />;
  }
  IconFromComponent.displayName = `iconFromComponent(${Component.displayName ?? Component.name ?? "Component"})`;
  return IconFromComponent;
}

/** The part of a `react-native-svg` module that `createSvgIconSet` uses. The module is injected, never imported here. */
export interface SvgModule {
  Svg?: ComponentType<Record<string, unknown>>;
  default?: ComponentType<Record<string, unknown>>;
  Path: ComponentType<Record<string, unknown>>;
}

/**
 * An icon set from SVG path data (`d` attributes drawn in a 24x24 view box). Pass the `react-native-svg` module you
 * installed: this library does not import it.
 */
export function createSvgIconSet(svg: SvgModule | undefined, paths: Record<string, string>): IconSetAdapter {
  const Svg = svg?.Svg ?? svg?.default;
  const Path = svg?.Path;
  if (Svg === undefined || Path === undefined) {
    throw new Error(
      "[ui/Icon] createSvgIconSet needs the react-native-svg module: pass the module you installed (or { Svg, Path }) as the first argument.",
    );
  }
  return {
    names: Object.keys(paths),
    render(name, { size, color }) {
      if (!Object.prototype.hasOwnProperty.call(paths, name)) return null;
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d={paths[name]} fill={color} />
        </Svg>
      );
    },
  };
}

/**
 * Draws an icon from the registered icon sets. Decorative by default: without `label` the icon is hidden from assistive
 * technology; with `label` it is an image with that accessibility label. It never receives focus. An unknown name (or
 * set) renders nothing and warns once per name in `__DEV__`.
 */
export function Icon({ name, size = "md", color = "textPrimary", label, set = "default" }: IconProps) {
  const { colors } = useTheme();
  const sets = useIconSets();
  const warned = useRef<string | null>(null);

  const pixels = typeof size === "number" ? size : ICON_SIZES[size];
  const resolvedColor = Object.prototype.hasOwnProperty.call(colors, color) ? (colors as Record<string, string>)[color]! : color;
  const adapter = Object.prototype.hasOwnProperty.call(sets, set) ? sets[set] : undefined;
  const glyph = adapter?.render(name, { size: pixels, color: resolvedColor }) ?? null;

  if (glyph === null) {
    const key = `${set}:${name}`;
    if (isDev() && warned.current !== key) {
      warned.current = key;
      console.warn(
        adapter === undefined
          ? `[ui/Icon] icon set "${set}" is not registered; "${name}" is not rendered. Wrap the app in <IconProvider sets={{ ${set}: ... }}>.`
          : `[ui/Icon] icon "${name}" does not exist in the "${set}" set and is not rendered.`,
      );
    }
    return null;
  }

  const labelled = label !== undefined && label !== "";
  return (
    <View
      focusable={false}
      accessible={labelled}
      accessibilityRole={labelled ? "image" : undefined}
      accessibilityLabel={labelled ? label : undefined}
      accessibilityElementsHidden={!labelled}
      importantForAccessibility={labelled ? "yes" : "no-hide-descendants"}
      style={{ width: pixels, height: pixels }}
    >
      {glyph}
    </View>
  );
}
