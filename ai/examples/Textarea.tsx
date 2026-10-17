// @ai-example
import { useState } from "react";
import { Textarea } from "@personal-library/react-native-components";

export function TextareaExample() {
  const [value, setValue] = useState("");
  return <Textarea label="Message" value={value} onChangeText={setValue} />;
}
