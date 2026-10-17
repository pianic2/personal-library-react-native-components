// @ai-example
import { useState } from "react";
import { Modal, Text } from "@personal-library/react-native-components";

export function ModalExample() {
  const [visible, setVisible] = useState(true);
  return (
    <Modal visible={visible} onClose={() => setVisible(false)}>
      <Text>Modal content</Text>
    </Modal>
  );
}
