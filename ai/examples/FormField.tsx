// @ai-example
import { useState } from "react";
import { FormField, Input } from "@personal-library/react-native-components";

export function FormFieldExample() {
  const [name, setName] = useState("");
  return (
    <FormField label="Name" helperText="As shown on your profile">
      <Input label="Name" value={name} onChangeText={setName} />
    </FormField>
  );
}
