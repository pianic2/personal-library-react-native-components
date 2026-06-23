import React from "react";
import { Text } from "../Text/Text";
import type { ComponentProps } from "react";

export type SmallProps = ComponentProps<typeof Text>;

export function Small(props: SmallProps) {
  
  return (
    <Text
      size="sm"
      variant="muted"
      {...props}
    />
  );
}
