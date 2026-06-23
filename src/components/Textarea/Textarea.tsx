// ui/components/form/Textarea.tsx

import { Input } from "../Input/Input";
import { useTheme } from "../../theme/useTheme";
import type { InputProps } from "../Input/Input";

export type TextareaProps = InputProps;

export function Textarea(props: TextareaProps) {
  const { theme } = useTheme();
  return (
    <Input
      {...props}
      multiline
      textAlignVertical="top"
      style={{ minHeight: 100, paddingVertical: theme.space.md, ...props.style }}
    />
  );
}
