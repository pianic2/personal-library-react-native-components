// ui/components/layout/Box.tsx

import React from "react";
import { Platform, View, ViewProps, StyleProp, ViewStyle } from "react-native";
import { useTheme } from "../../theme/useTheme";

type SpaceKey = keyof ReturnType<typeof useTheme>["theme"]["space"];
type RadiusKey = keyof ReturnType<typeof useTheme>["theme"]["radius"];
type ShadowKey = keyof ReturnType<typeof useTheme>["theme"]["shadows"];

export interface BoxProps extends ViewProps {
  padding?: SpaceKey;
  margin?: SpaceKey;
  bg?: keyof ReturnType<typeof useTheme>["colors"];
  radius?: RadiusKey;
  border?: boolean;
  shadow?: ShadowKey;
  style?: StyleProp<ViewStyle>;
}

export function Box({
  padding,
  margin,
  bg,
  radius = "md",
  border = false,
  shadow,
  style,
  children,
  ...rest
}: BoxProps) {
  const { theme, colors } = useTheme();

  const shadowStyle = (() => {
    if (!shadow) return undefined;

    const s = theme.shadows[shadow];
    if (Platform.OS === "web") {
      if (shadow === "none") {
        return { boxShadow: "none" } as ViewStyle;
      }

      return {
        boxShadow: `${s.shadowOffset.width}px ${s.shadowOffset.height}px ${s.shadowRadius}px rgba(0, 0, 0, ${s.shadowOpacity})`,
      } as ViewStyle;
    }

    return s;
  })();

  return (
    <View
      {...rest}
      style={[
        padding && { padding: theme.space[padding] },
        margin && { margin: theme.space[margin] },
        bg && { backgroundColor: colors[bg] },
        radius && { borderRadius: theme.radius[radius] },
        border && { borderWidth: 1, borderColor: colors.border },
        shadowStyle,
        style,
      ]}
    >
      {children}
    </View>
  );
}
