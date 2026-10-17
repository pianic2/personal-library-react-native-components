// @ai-example
import { useState } from "react";
import { Checkbox } from "@personal-library/react-native-components";

export function CheckboxExample() {
  const [checked, setChecked] = useState(false);
  return <Checkbox label="Accept the terms" checked={checked} onChange={setChecked} />;
}
