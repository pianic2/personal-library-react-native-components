import { useState } from "react";
import { Button, Text, ThemeAppShell, ThemeProvider } from "@personal-library/react-native-components";
// The responsive area is not re-exported from the package root yet: import it from its barrel.
import {
  Container,
  Hide,
  Responsive,
  ResponsiveProvider,
  Show,
  SplitView,
  StackOnLargeText,
  useDeviceClass,
  useIsLargeText,
  useResponsiveValue,
  useWindowSizeClass,
} from "../src/responsive/index.js";

function Inbox({ onOpen }: { onOpen: () => void }) {
  return (
    <>
      <Text>Inbox</Text>
      <Button label="Open message" onPress={onOpen} />
    </>
  );
}

function Message() {
  return <Text>Message body</Text>;
}

function Summary() {
  const sizeClass = useWindowSizeClass();
  const device = useDeviceClass();
  const columns = useResponsiveValue({ base: 1, md: 2, lg: 3 }) ?? 1;
  const largeText = useIsLargeText();
  return (
    <Text>
      {device}, {sizeClass.width} width, {columns} column(s){largeText ? ", large text" : ""}
    </Text>
  );
}

export function ResponsiveExample() {
  const [showMessage, setShowMessage] = useState(false);

  return (
    <ThemeProvider>
      <ResponsiveProvider>
        <ThemeAppShell>
          <Container size="lg">
            <Summary />

            <Show above="md">
              <Text>Shown from the md breakpoint up</Text>
            </Show>
            <Hide above="md">
              <Text>Shown below md</Text>
            </Hide>
            <Responsive base={<Text>Phone layout</Text>} lg={<Text>Wide layout</Text>} />

            <StackOnLargeText gap="sm">
              <Text>Label</Text>
              <Text>Value</Text>
            </StackOnLargeText>

            <SplitView
              primary={<Inbox onOpen={() => setShowMessage(true)} />}
              secondary={<Message />}
              showSecondary={showMessage}
              onBack={() => setShowMessage(false)}
            />
          </Container>
        </ThemeAppShell>
      </ResponsiveProvider>
    </ThemeProvider>
  );
}
