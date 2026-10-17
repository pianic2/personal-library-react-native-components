// @ai-example
import { Row, Spacer, Text } from "@personal-library/react-native-components";

export function SpacerExample() {
  return (
    <Row>
      <Text>Left</Text>
      <Spacer flex />
      <Text>Right</Text>
    </Row>
  );
}
