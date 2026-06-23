// ui/components/form/PasswordInput.tsx

import React, { useState } from "react";
import { Pressable, Text } from "react-native";

import { Input } from "../Input/Input";
import type { InputProps } from "../Input/Input";

export interface PasswordInputProps
  extends Omit<InputProps, "rightIcon" | "secureTextEntry"> {
  passwordVisible?: boolean;
  defaultPasswordVisible?: boolean;
  onPasswordVisibilityChange?: (visible: boolean) => void;
  showPasswordLabel?: string;
  hidePasswordLabel?: string;
}

export function PasswordInput({
  passwordVisible,
  defaultPasswordVisible = false,
  onPasswordVisibilityChange,
  showPasswordLabel = "Show password",
  hidePasswordLabel = "Hide password",
  ...props
}: PasswordInputProps) {
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

  const accessibilityLabel = visible ? hidePasswordLabel : showPasswordLabel;

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
          <Text>{visible ? "Hide" : "Show"}</Text>
        </Pressable>
      }
    />
  );
}
