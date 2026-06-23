import React from "react";
import { View, ViewProps } from "react-native";
import { useTheme } from "../../theme/useTheme";

type SpaceKey = keyof ReturnType<typeof useTheme>["theme"]["space"];

export interface TextGroupProps extends ViewProps {
  spacing?: SpaceKey;
  children: React.ReactNode;
}

export function TextGroup({ spacing = "sm", children, style, ...rest }: TextGroupProps) {
  const { theme } = useTheme();
  const validChildren = React.Children.toArray(children).filter(Boolean);

  return (
    <View {...rest} style={style}>
      {validChildren.map((child, index) => (
        <View
          key={index}
          style={{ marginBottom: index === validChildren.length - 1 ? 0 : theme.space[spacing] }}
        >
          {child}
        </View>
      ))}
    </View>
  );
}
