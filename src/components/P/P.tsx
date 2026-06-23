import React from "react";
import { Text } from "../Text/Text";
import type { ComponentProps } from "react";

export type PProps = ComponentProps<typeof Text>;

export function P(props: PProps) {
  
  return (
    <Text
      size="md"
      weight="regular"
      align="left"
      {...props}
    />
  );
}
