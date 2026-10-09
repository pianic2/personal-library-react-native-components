// Fixture: every export below breaks one rule of ADR 0014 (see scripts/check-api-conventions.mjs).
export interface BadOpenProps {
  visible?: boolean;
  style?: object;
  testID?: string;
}

export interface BadOnChangeProps {
  value?: string;
  onChange?: (value: string) => void;
  style?: object;
  testID?: string;
}

export interface BadVariantProps {
  variant?: "solid" | "danger";
  style?: object;
  testID?: string;
}

export interface BadToneProps {
  tone?: "purple" | "primary";
  style?: object;
  testID?: string;
}

export interface BadColorProps {
  color?: string;
  style?: object;
  testID?: string;
}

export interface BadSizeProps {
  size?: "sm" | "xl";
  style?: object;
  testID?: string;
}

export interface BadErrorProps {
  error?: boolean;
  style?: object;
  testID?: string;
}

export interface BadInvalidProps {
  invalid?: string;
  style?: object;
  testID?: string;
}

export interface BadPassthroughProps {
  label?: string;
}
