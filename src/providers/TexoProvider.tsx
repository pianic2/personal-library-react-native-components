import React from "react";
import { CapabilityProvider, type CapabilityAdapters } from "../native/core/index.js";
import { LocaleProvider, type LocaleProviderProps } from "../i18n/index.js";
import { MotionProvider, type MotionProviderProps } from "../motion/MotionProvider.js";
import { ResponsiveProvider } from "../responsive/ResponsiveProvider.js";
import { IconProvider, type IconSets } from "../components/Icon/Icon.js";
import { NavProvider, type NavProviderProps } from "../components/NavContext/NavContext.js";
import { OverlayHost } from "../components/Portal/OverlayHost.js";
import { ThemeProvider } from "../theme/ThemeProvider.js";
import type { ThemeProviderProps } from "../theme/ThemeProvider.js";

// NavProvider is overloaded per props form; the union of both forms is accepted through one signature.
const AnyNavProvider = NavProvider as React.ComponentType<NavProviderProps>;

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

export interface TexoProviderProps {
  /** Theme token overrides, merged over the preset. */
  theme?: ThemeProviderProps["themeOverrides"];
  /** A preset made with `defineTheme`. */
  preset?: ThemeProviderProps["preset"];
  /** `light`, `dark`, or `system` to follow the OS. */
  preference?: ThemeProviderProps["preference"];
  /** Density level of the theme. */
  density?: ThemeProviderProps["density"];
  /** Locale, direction and messages. */
  locale?: Omit<LocaleProviderProps, "children">;
  /** Reduced-motion preference and animation engine. */
  motion?: Omit<MotionProviderProps, "children">;
  /** Native capability adapters (haptics, storage, share, ...). Hoist or memoize this object. */
  adapters?: CapabilityAdapters;
  /** Icon sets. Hoist or memoize this object. */
  icons?: IconSets;
  /** Navigation items and router adapter. Without it no navigation context is provided. */
  nav?: DistributiveOmit<NavProviderProps, "children">;
  children?: React.ReactNode;
}

/**
 * The composition root. It mounts the providers in a fixed order, outermost first: Theme, Locale, Motion, Responsive,
 * Capabilities, Icons, Nav, and the root OverlayHost around `children`. Each provider stays exported on its own for
 * advanced setups. Do not mount a second root OverlayHost inside it.
 */
export function TexoProvider({ theme, preset, preference, density, locale, motion, adapters, icons, nav, children }: TexoProviderProps) {
  let content: React.ReactNode = <OverlayHost>{children}</OverlayHost>;
  if (nav) content = <AnyNavProvider {...(nav as NavProviderProps)}>{content}</AnyNavProvider>;
  if (icons) content = <IconProvider sets={icons}>{content}</IconProvider>;
  content = <CapabilityProvider adapters={adapters}>{content}</CapabilityProvider>;
  content = <ResponsiveProvider>{content}</ResponsiveProvider>;
  content = <MotionProvider {...motion}>{content}</MotionProvider>;
  content = <LocaleProvider {...locale}>{content}</LocaleProvider>;
  return (
    <ThemeProvider themeOverrides={theme} preset={preset} preference={preference} density={density}>
      {content}
    </ThemeProvider>
  );
}
