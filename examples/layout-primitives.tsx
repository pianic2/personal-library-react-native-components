import {
  Badge,
  Box,
  Button,
  Column,
  Divider,
  Row,
  Text,
  ThemeProvider,
} from "@personal-library/react-native-components";

export function LayoutPrimitivesExample() {
  return (
    <ThemeProvider withScroll={false}>
      <Column gap="md" style={{ padding: 16 }}>
        <Row align="center" justify="space-between" gap="sm">
          <Text>Layout primitives</Text>
          <Badge>beta</Badge>
        </Row>

        <Divider />

        <Box padding="md" radius="md" bg="surface">
          <Column gap="sm">
            <Text>Box, Row and Column are beta public candidates.</Text>
            <Row gap="sm">
              <Button label="Primary" onPress={() => undefined} />
              <Button label="Secondary" variant="secondary" onPress={() => undefined} />
            </Row>
          </Column>
        </Box>
      </Column>
    </ThemeProvider>
  );
}
