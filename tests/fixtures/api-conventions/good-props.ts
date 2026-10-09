// Fixture: conforms to ADR 0014; the check must exit 0 on it.
export interface GoodFieldProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  invalid?: boolean;
  error?: string;
  variant?: "solid" | "outline" | "ghost";
  tone?: "primary" | "neutral" | "success" | "warning" | "danger" | "info";
  size?: "xs" | "sm" | "md" | "lg";
  style?: object;
  testID?: string;
}

export interface GoodOverlayProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  style?: object;
  testID?: string;
}

// Typography components may use larger sizes (ADR 0014, Visual axes).
export interface HeadingProps {
  size?: "sm" | "md" | "lg" | "xl" | "xxl";
  style?: object;
  testID?: string;
}

export interface GoodProviderProps {
  children?: unknown;
}
