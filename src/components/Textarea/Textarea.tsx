// ui/components/form/Textarea.tsx

import { Input } from "../Input/Input";
import { useTheme } from "../../theme/useTheme";
import type { InputProps } from "../Input/Input";

export interface TextareaProps
  extends Omit<InputProps, "multiline" | "textAlignVertical"> {}

export function Textarea({ style, ...props }: TextareaProps) {
  const { theme } = useTheme();
  return (
    <Input
      {...props}
      multiline
      textAlignVertical="top"
      style={[
        {
          minHeight: 100,
          paddingVertical: theme.space.md,
        },
        style,
      ]}
    />
  );
}
