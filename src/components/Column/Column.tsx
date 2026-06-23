// ui/components/layout/Column.tsx

import React from "react";
import { View, ViewProps } from "react-native";
import { useTheme } from "../../theme/useTheme";

type SpaceKey = keyof ReturnType<typeof useTheme>["theme"]["space"];

export interface ColumnProps extends ViewProps {
  gap?: SpaceKey;
  flex?: -1 | 0 | 1 | 2 | 3 ;
  align?: "flex-start" | "center" | "flex-end" | "stretch";
  justify?: "flex-start" | "center" | "flex-end" | "space-between";
  children: React.ReactNode;
}

export function Column({
  gap = "xl",
  align = "flex-start",
  justify = "flex-start",
  flex = 1,
  style,
  children,
  ...rest
}: ColumnProps) {
  const { theme } = useTheme();
  const validChildren = React.Children.toArray(children).filter(Boolean);

  return (
    <View
      {...rest}
      style={[
        { flex: flex, alignItems: align, justifyContent: justify },
        style,
      ]}
    >
      {validChildren.map((child, i) => (
        <View
          key={i}
          style={{
            alignSelf: "stretch",
            marginBottom:
              gap && i < validChildren.length - 1
                ? theme.space[gap]
                : 0,
          }}
        >
          {child}
        </View>
      ))}
    </View>
  );
}

// Alias semantico
export const Stack = Column;
