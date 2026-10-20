import {
  Badge,
  Card,
  Column,
  Text,
  ThemeAppShell,
  ThemeProvider,
} from "@personal-library/react-native-components";

export function SurfacesExample() {
  return (
    <ThemeProvider>
      <ThemeAppShell>
        <Column gap="md" style={{ padding: 16 }}>
          <Card variant="default">
            <Text>Default card</Text>
          </Card>
          <Card variant="elevated">
            <Text>Elevated card</Text>
          </Card>
          <Card variant="outline" bgColor="surface">
            <Text>Outline card with a token background</Text>
          </Card>
          <Badge variant="primary">primary</Badge>
          <Badge variant="success">success</Badge>
          <Badge variant="warning">warning</Badge>
          <Badge variant="danger">danger</Badge>
          <Badge variant="info" accessibilityLabel="3 unread messages">
            3
          </Badge>
        </Column>
      </ThemeAppShell>
    </ThemeProvider>
  );
}
