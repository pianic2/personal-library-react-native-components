// @ai-example
import { Button, Popover, Text } from "@personal-library/react-native-components";

export function PopoverExample() {
  return (
    <Popover renderTrigger={({ toggle }) => <Button label="Open" onPress={toggle} />}>
      <Text>Popover content</Text>
    </Popover>
  );
}
