// @ai-example
import { Popover, Text } from "@personal-library/react-native-components";

export function PopoverExample() {
  return (
    <Popover renderTrigger={() => <Text>Open</Text>}>
      <Text>Popover content</Text>
    </Popover>
  );
}
