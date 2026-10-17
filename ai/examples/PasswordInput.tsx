// @ai-example
import { useState } from "react";
import { PasswordInput } from "@personal-library/react-native-components";

export function PasswordInputExample() {
  const [value, setValue] = useState("");
  return <PasswordInput label="Password" value={value} onChangeText={setValue} />;
}
