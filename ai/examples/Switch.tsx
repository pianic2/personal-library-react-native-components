// @ai-example
import { useState } from "react";
import { Switch } from "@personal-library/react-native-components";

export function SwitchExample() {
  const [on, setOn] = useState(true);
  return <Switch label="Notifications" value={on} onChange={setOn} />;
}
