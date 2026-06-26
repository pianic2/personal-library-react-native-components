import {
  Alert,
  Badge,
  Column,
  Spinner,
  Text,
  ThemeAppShell,
  ThemeProvider,
} from "@personal-library/react-native-components";

export function FeedbackExample() {
  return (
    <ThemeProvider>
      <ThemeAppShell>
        <Column gap="md" style={{ padding: 16 }}>
          <Alert
            title="Review needed"
            message="Alert, Badge and Spinner are beta public candidates. This example uses only the root package entrypoint."
            variant="info"
          />
          <Badge variant="info">beta</Badge>
          <Spinner />
          <Text>Use the root package entrypoint for consumer feedback UI.</Text>
        </Column>
      </ThemeAppShell>
    </ThemeProvider>
  );
}
