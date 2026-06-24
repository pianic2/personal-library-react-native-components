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
