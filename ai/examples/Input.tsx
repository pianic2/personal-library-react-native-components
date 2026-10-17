// @ai-example
import { useState } from "react";
import { Input } from "@personal-library/react-native-components";

export function InputExample() {
  const [name, setName] = useState("");
  return <Input label="Name" value={name} onChangeText={setName} />;
}
