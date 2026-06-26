import {
  Button,
  Box,
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
            Stability: Button, Box, Column, Heading and Text are beta public
            candidates. This example uses only the root package entrypoint.
          </Text>
          <Box padding="md" radius="md" bg="surface">
            <Column gap="sm">
              <Text>Use the root package entrypoint for consumer code.</Text>
              <Button label="Review" onPress={() => undefined} />
            </Column>
          </Box>
        </Column>
      </ThemeAppShell>
    </ThemeProvider>
  );
}
