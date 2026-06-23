// ui/components/typography/B.tsx

import { Text } from "../Text/Text";
import type { ComponentProps } from "react";

export type BProps = ComponentProps<typeof Text>;

export function B(props: BProps) {
  return <Text weight="bold" {...props} />;
}
