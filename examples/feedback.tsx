import {
  Alert,
  Badge,
  CodeInline,
  Column,
  ProgressBar,
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
            message="Alert and Spinner are beta. ProgressBar and CodeInline are internal / non-stable and shown only as preview coverage."
            variant="info"
          />
          <Badge variant="info">beta</Badge>
          <ProgressBar progress={72} />
          <Spinner />
          <Text>
            Inline code example: <CodeInline>npm test</CodeInline>
          </Text>
        </Column>
      </ThemeAppShell>
    </ThemeProvider>
  );
}
