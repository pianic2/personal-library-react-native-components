// @ai-example
import { Text, Touchable } from "@personal-library/react-native-components";

export function TouchableExample() {
  return (
    <Touchable feedback="scale" haptic="light" onPress={() => undefined}>
      <Text>Like</Text>
    </Touchable>
  );
}
