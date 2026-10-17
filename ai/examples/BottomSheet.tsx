// @ai-example
import { useState } from "react";
import { BottomSheet, Text } from "@personal-library/react-native-components";

export function BottomSheetExample() {
  const [visible, setVisible] = useState(true);
  return (
    <BottomSheet visible={visible} onClose={() => setVisible(false)}>
      <Text>Sheet content</Text>
    </BottomSheet>
  );
}
