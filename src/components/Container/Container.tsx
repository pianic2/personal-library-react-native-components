import React, { useCallback, useContext, useMemo, useRef, useState } from "react";
import { View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from "react-native";
import { resolveBreakpoint, useBreakpointInfo, type Breakpoint } from "../../hooks/useBreakpoint.js";
import { ResponsiveContext } from "../../responsive/context.js";
import { resolveResponsive } from "../../responsive/resolve.js";
import { ContainerContext, type ContainerContextValue } from "../../responsive/useContainerSize.js";
import { useTheme } from "../../theme/useTheme.js";

/** Maximum content widths of the named sizes, in density-independent pixels. */
export const CONTAINER_WIDTHS = { sm: 480, md: 720, lg: 960, xl: 1200 } as const;

export type ContainerSizeName = keyof typeof CONTAINER_WIDTHS | "full";

type SpaceKey = keyof ReturnType<typeof useTheme>["theme"]["space"];

/** Changes of the measured size below this many pixels are ignored (they would only cause layout loops). */
const LAYOUT_EPSILON = 1;

export interface ContainerProps {
  /** Maximum content width: a named size, a number of pixels, or `"full"` for none. Default `"lg"`. */
  size?: ContainerSizeName | number;
  /** Horizontal padding as a `theme.space` key, or a map from breakpoint to key. Default: 16 below `md`, 24 from `md`, 32 from `lg`. */
  gutter?: SpaceKey | Partial<Record<Breakpoint, SpaceKey>>;
  /** Centres the container when it is narrower than its parent. Default `true`. */
  center?: boolean;
  /** Caps the width of the content inside the gutters, for comfortable reading lines. */
  measure?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export function Container({ size = "lg", gutter, center = true, measure, style, children }: ContainerProps) {
  const { theme } = useTheme();
  const window = useBreakpointInfo();
  const { breakpoints } = useContext(ResponsiveContext);
  const bp = resolveBreakpoint(window.width, breakpoints);

  // Gutter in pixels: the given theme.space key, or the default 16 / 24 / 32 steps by breakpoint.
  const defaults: Partial<Record<Breakpoint, number>> = { base: theme.spacing[16], md: theme.spacing[24], lg: theme.spacing[32] };
  const resolvedKey = gutter === undefined ? undefined : resolveResponsive<SpaceKey>(gutter as SpaceKey, bp);
  const gutterPx = resolvedKey !== undefined ? theme.space[resolvedKey] : (resolveResponsive(defaults, bp) ?? theme.spacing[16]);

  const contentMax = size === "full" ? undefined : typeof size === "number" ? size : CONTAINER_WIDTHS[size];
  const outerMax = contentMax === undefined ? undefined : contentMax + 2 * gutterPx;

  // Until the first layout the window width (capped by the maximum) stands in for the measured width: no flash.
  const initialWidth = outerMax === undefined ? window.width : Math.min(window.width, outerMax);
  const [measured, setMeasured] = useState<ContainerContextValue | null>(null);
  const last = useRef<ContainerContextValue | null>(null);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    const previous = last.current;
    if (previous && Math.abs(previous.width - width) < LAYOUT_EPSILON && Math.abs(previous.height - height) < LAYOUT_EPSILON) return;
    last.current = { width, height };
    setMeasured({ width, height });
  }, []);

  const value = useMemo<ContainerContextValue>(() => measured ?? { width: initialWidth, height: window.height }, [measured, initialWidth, window.height]);

  return (
    <ContainerContext.Provider value={value}>
      <View
        onLayout={onLayout}
        style={[
          { width: "100%", paddingHorizontal: gutterPx },
          outerMax !== undefined && { maxWidth: outerMax },
          center && { alignSelf: "center" },
          style,
        ]}
      >
        {measure !== undefined ? <View style={{ width: "100%", maxWidth: measure, alignSelf: center ? "center" : "flex-start" }}>{children}</View> : children}
      </View>
    </ContainerContext.Provider>
  );
}
