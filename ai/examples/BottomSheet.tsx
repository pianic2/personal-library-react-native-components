// @ai-example
import { useState } from "react";
import { BottomSheet, Text } from "@personal-library/react-native-components";

export function BottomSheetExample() {
  const [open, setOpen] = useState(true);
  return (
    <BottomSheet open={open} onOpenChange={setOpen} snapPoints={["35%", "70%"]}>
      <Text>Sheet content</Text>
    </BottomSheet>
  );
}
