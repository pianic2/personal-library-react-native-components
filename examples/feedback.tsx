import {
  Alert,
  Badge,
  CodeInline,
  Column,
  ProgressBar,
  Spinner,
  Text,
  ThemeProvider,
} from "@personal-library/react-native-components";

export function FeedbackExample() {
  return (
    <ThemeProvider withScroll={false}>
      <Column gap="md" style={{ padding: 16 }}>
        <Alert
          title="Review needed"
          message="Feedback components are beta candidates and still need accessibility support evidence."
          variant="info"
        />
        <Badge variant="info">beta</Badge>
        <ProgressBar progress={72} />
        <Spinner />
        <Text>
          Inline code example: <CodeInline>npm test</CodeInline>
        </Text>
      </Column>
    </ThemeProvider>
  );
}
