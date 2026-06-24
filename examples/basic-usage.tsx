import {
  Button,
  Card,
  Column,
  Heading,
  Text,
  ThemeProvider,
} from "@personal-library/react-native-components";

export function BasicUsageExample() {
  return (
    <ThemeProvider withScroll={false}>
      <Column gap="md" style={{ padding: 16 }}>
        <Heading level={2}>Account overview</Heading>
        <Card>
          <Column gap="sm">
            <Text>Use the root package entrypoint for consumer code.</Text>
            <Button label="Review" onPress={() => undefined} />
          </Column>
        </Card>
      </Column>
    </ThemeProvider>
  );
}
