// @ai-example
import { Button, Screen, Text } from "@personal-library/react-native-components";

export function ScreenExample() {
  return (
    <Screen scroll padding="md" keyboardAvoiding footer={<Button label="Save" onPress={() => undefined} />}>
      <Text>Screen body</Text>
    </Screen>
  );
}
