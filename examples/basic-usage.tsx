import {
  Button,
  Card,
  Column,
  Heading,
  Text,
  ThemeAppShell,
  ThemeProvider,
} from "@personal-library/react-native-components";

export function BasicUsageExample() {
  return (
    <ThemeProvider>
      <ThemeAppShell>
        <Column gap="md" style={{ padding: 16 }}>
          <Heading level={2}>Account overview</Heading>
          <Text>
            Stability: Button, Column, Heading and Text are beta; Card is
            internal / non-stable and shown here only as preview coverage.
          </Text>
          <Card>
            <Column gap="sm">
              <Text>Use the root package entrypoint for consumer code.</Text>
              <Button label="Review" onPress={() => undefined} />
            </Column>
          </Card>
        </Column>
      </ThemeAppShell>
    </ThemeProvider>
  );
}
