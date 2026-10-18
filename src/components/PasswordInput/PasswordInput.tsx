// ui/components/form/PasswordInput.tsx

import React, { useState } from "react";
import { Pressable } from "react-native";

import { useMessages } from "../../i18n/index.js";
import { useTheme } from "../../theme/useTheme.js";
import { Text } from "../Text/Text.js";
import { Input } from "../Input/Input.js";
import type { InputProps } from "../Input/Input.js";

export interface PasswordInputProps
  extends Omit<InputProps, "rightIcon" | "secureTextEntry"> {
  /** Controlled visibility of the password. */
  passwordVisible?: boolean;
  /** Initial visibility when uncontrolled. Default: `false` (hidden). */
  defaultPasswordVisible?: boolean;
  onPasswordVisibilityChange?: (visible: boolean) => void;
  /** Text and accessibility label of the toggle while the password is hidden. Default: the `password.show` message. */
  showPasswordLabel?: string;
  /** Text and accessibility label of the toggle while the password is visible. Default: the `password.hide` message. */
  hidePasswordLabel?: string;
}

export function PasswordInput({
  passwordVisible,
  defaultPasswordVisible = false,
  onPasswordVisibilityChange,
  showPasswordLabel,
  hidePasswordLabel,
  ...props
}: PasswordInputProps) {
  const messages = useMessages();
  const { colors } = useTheme();
  const [uncontrolledVisible, setUncontrolledVisible] = useState(
    defaultPasswordVisible
  );
  const visible = passwordVisible ?? uncontrolledVisible;

  function toggleVisibility() {
    const nextVisible = !visible;

    if (passwordVisible === undefined) {
      setUncontrolledVisible(nextVisible);
    }

    onPasswordVisibilityChange?.(nextVisible);
  }

  const accessibilityLabel = visible ? hidePasswordLabel ?? messages["password.hide"] : showPasswordLabel ?? messages["password.show"];

  return (
    <Input
      {...props}
      secureTextEntry={!visible}
      rightIcon={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          accessibilityState={{ checked: visible }}
          onPress={toggleVisibility}
        >
          <Text size="sm" weight="medium" style={{ color: colors.primary }}>
            {accessibilityLabel}
          </Text>
        </Pressable>
      }
    />
  );
}
