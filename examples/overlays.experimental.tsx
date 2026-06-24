import { useState } from "react";
import {
  BottomSheet,
  Button,
  Column,
  Modal,
  Popover,
  Select,
  Text,
  ThemeProvider,
  Tooltip,
} from "@personal-library/react-native-components";

export function ExperimentalOverlaysExample() {
  const [modalOpen, setModalOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [choice, setChoice] = useState<string | undefined>();

  return (
    <ThemeProvider withScroll={false}>
      <Column gap="md" style={{ padding: 16 }}>
        <Text>
          Experimental: overlay APIs are not stable and need additional focus,
          keyboard, accessibility and platform runtime evidence.
        </Text>

        <Button label="Open modal" onPress={() => setModalOpen(true)} />
        <Modal visible={modalOpen} onClose={() => setModalOpen(false)}>
          <Column gap="sm">
            <Text>Experimental modal content</Text>
            <Button label="Close" onPress={() => setModalOpen(false)} />
          </Column>
        </Modal>

        <Button label="Open bottom sheet" onPress={() => setSheetOpen(true)} />
        <BottomSheet visible={sheetOpen} onClose={() => setSheetOpen(false)}>
          <Text>Experimental bottom sheet content</Text>
        </BottomSheet>

        <Tooltip content="Web tooltip content; native renders children only.">
          <Text>Tooltip trigger</Text>
        </Tooltip>

        <Popover
          renderTrigger={({ toggle }) => (
            <Button label="Toggle popover" onPress={toggle} />
          )}
        >
          <Text>Web popover content; native renders trigger only.</Text>
        </Popover>

        <Select
          value={choice}
          onChange={setChoice}
          placeholder="Choose an option"
          options={[
            { label: "Alpha", value: "alpha" },
            { label: "Beta", value: "beta" },
          ]}
        />
      </Column>
    </ThemeProvider>
  );
}
