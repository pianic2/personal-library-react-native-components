// ui/utils/mergeStyles.ts

import { StyleProp } from "react-native";

export function mergeStyles<T>(
  ...styles: (StyleProp<T> | false | null | undefined)[]
): StyleProp<T> {
  return styles.filter(Boolean) as StyleProp<T>;
}
