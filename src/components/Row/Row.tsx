// ui/components/layout/Row.tsx

import React from "react";
import { View, ViewProps } from "react-native";
import { useTheme } from "../../theme/useTheme";

type SpaceKey = keyof ReturnType<typeof useTheme>["theme"]["space"];

export interface RowProps extends ViewProps {
  gap?: SpaceKey;
  align?: "flex-start" | "center" | "flex-end" | "stretch";
  justify?:
    | "flex-start"
    | "center"
    | "flex-end"
    | "space-between"
    | "space-around"
    | "space-evenly";
  wrap?: boolean;
  children: React.ReactNode;
  flex?: number;
}

export function Row({
  gap = "md",
  align = "center",
  justify = "flex-start",
  wrap = false,
  style,
  children,
  ...rest
}: RowProps) {
  const { theme } = useTheme();

  return (
    <View
      {...rest}
      style={[
        {
          flexDirection: "row",
          alignItems: align,
          justifyContent: justify,
          flexWrap: wrap ? "wrap" : "nowrap",
          columnGap: theme.space[gap],
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
