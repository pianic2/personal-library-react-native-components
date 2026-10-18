// ui/components/form/Textarea.tsx

import { Input } from "../Input/Input.js";
import { useTheme } from "../../theme/useTheme.js";
import type { InputProps } from "../Input/Input.js";

/** Rows shown when `rows` is not given. */
const DEFAULT_ROWS = 4;

export interface TextareaProps
  extends Omit<InputProps, "multiline" | "textAlignVertical"> {
  /** Number of visible text lines the field is at least tall for. Default: 4. Values below 1 count as 1. */
  rows?: number;
}

export function Textarea({ rows = DEFAULT_ROWS, style, ...props }: TextareaProps) {
  const { theme } = useTheme();
  const { fontSize, lineHeight } = theme.typography;
  const verticalPadding = theme.space.md;
  const visibleRows = Number.isFinite(rows) ? Math.max(1, Math.round(rows)) : DEFAULT_ROWS;
  const minHeight = Math.ceil(visibleRows * fontSize.md * lineHeight.normal + 2 * verticalPadding);
  return (
    <Input
      {...props}
      multiline
      textAlignVertical="top"
      style={[
        {
          minHeight,
          paddingVertical: verticalPadding,
        },
        style,
      ]}
    />
  );
}
