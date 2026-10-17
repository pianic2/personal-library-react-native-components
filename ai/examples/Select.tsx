// @ai-example
import { useState } from "react";
import { Select } from "@personal-library/react-native-components";

export function SelectExample() {
  const [value, setValue] = useState("s");
  return (
    <Select
      value={value}
      onChange={setValue}
      options={[
        { label: "Small", value: "s" },
        { label: "Large", value: "l" },
      ]}
    />
  );
}
