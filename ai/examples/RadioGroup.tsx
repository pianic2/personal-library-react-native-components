// @ai-example
import { useState } from "react";
import { RadioGroup } from "@personal-library/react-native-components";

export function RadioGroupExample() {
  const [value, setValue] = useState("light");
  return (
    <RadioGroup
      value={value}
      onChange={setValue}
      options={[
        { label: "Light", value: "light" },
        { label: "Dark", value: "dark" },
      ]}
    />
  );
}
