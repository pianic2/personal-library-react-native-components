// ui/components/form/PasswordInput.tsx

import React, { useState } from "react";

import { Input } from "../Input/Input";
import type { InputProps } from "../Input/Input";

export type PasswordInputProps = InputProps;

export function PasswordInput(props: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <Input
      {...props}
      secureTextEntry={!visible}
      onPressIn={() => setVisible((v) => !v)}
    />
  );
}
