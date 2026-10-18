import React from "react";
import {
  Alert,
  B,
  Badge,
  Banner,
  BottomBar,
  BottomSheet,
  Box,
  Button,
  Card,
  Checkbox,
  CodeInline,
  Column,
  Divider,
  FormField,
  Heading,
  Input,
  Link,
  Modal,
  NavBar,
  NavProvider,
  P,
  PageIndicator,
  Pager,
  PasswordInput,
  Popover,
  ProgressBar,
  Quote,
  RadioGroup,
  Row,
  Select,
  SideBar,
  Small,
  Spacer,
  Spinner,
  Switch,
  Text,
  TextGroup,
  Textarea,
  Tooltip,
  Touchable,
  TopBar,
} from "../../src";
import { Container } from "../../src/components/Container/index.js";
import { OverlayHost, Portal } from "../../src/components/Portal/index.js";
import { useDataTable, type DataTableColumn } from "../../src/components/DataTable/index.js";
import { Slot } from "../../src/components/Slot/index.js";
import { Label } from "../../src/components/Label/index.js";
import { AsyncBoundary, EmptyState, ErrorState, LoadingState, Result } from "../../src/components/StateView/index.js";
import { Icon, IconProvider, createIconSet } from "../../src/components/Icon/index.js";
import { IconGlyphs } from "../../src/components/IconGlyphs/index.js";
import { View } from "react-native";

const noop = () => undefined;

// The DataTable folder has only the headless model so far: the fixture renders a minimal table driven by it.
const tableColumns: DataTableColumn<{ id: string; name: string }>[] = [{ key: "name", header: "Name", sortable: true }];
const tableRows = [
  { id: "1", name: "Bea" },
  { id: "2", name: "Ada" },
];
function DataTableFixture() {
  const table = useDataTable({ rows: tableRows, columns: tableColumns, selectionMode: "multi", defaultSort: { key: "name", direction: "asc" } });
  return (
    <View>
      {table.rows.map((row) => (
        <Text key={row.id}>{row.name}</Text>
      ))}
    </View>
  );
}
const items = [
  { label: "Home", href: "/" },
  { label: "Docs", href: "/docs" },
];

/**
 * Minimal props per component, keyed by the component directory name (the `name` of its meta file). The render matrix
 * (tests/components/render-matrix.test.tsx) fails with a clear message for a meta entry that has no fixture here.
 */
export const fixtures: Record<string, () => React.ReactElement> = {
  Alert: () => <Alert title="Heads up" message="Fixture message" />,
  B: () => <B>Bold</B>,
  Badge: () => <Badge>New</Badge>,
  Banner: () => <Banner message="Fixture message" />,
  BottomBar: () => <BottomBar />,
  BottomSheet: () => (
    <BottomSheet visible onClose={noop}>
      <Text>Sheet content</Text>
    </BottomSheet>
  ),
  Box: () => (
    <Box padding="sm">
      <Text>Box content</Text>
    </Box>
  ),
  Button: () => <Button label="Save" onPress={noop} />,
  Card: () => (
    <Card>
      <Text>Card content</Text>
    </Card>
  ),
  Checkbox: () => <Checkbox label="Accept" checked onChange={noop} />,
  CodeInline: () => <CodeInline>const ok = true;</CodeInline>,
  Container: () => (
    <Container size="md">
      <Text>Contained</Text>
    </Container>
  ),
  Column: () => (
    <Column gap="sm">
      <Text>Top</Text>
      <Text>Bottom</Text>
    </Column>
  ),
  DataTable: () => <DataTableFixture />,
  Divider: () => <Divider />,
  Pager: () => (
    <>
      <Pager count={3} renderPage={(i) => <Text>{`Page ${i + 1}`}</Text>} />
      <PageIndicator count={3} index={0} />
    </>
  ),
  FormField: () => (
    <FormField label="Name" helperText="Helper">
      <Input label="Name" value="Ada" onChangeText={noop} />
    </FormField>
  ),
  Heading: () => <Heading level={2}>Title</Heading>,
  IconGlyphs: () => (
    <IconGlyphs svg={{ Svg: "Svg" as never, Path: "Path" as never }}>
      <Icon name="check" />
    </IconGlyphs>
  ),
  Icon: () => (
    <IconProvider sets={{ default: createIconSet({ check: ({ size, color }) => <View style={{ width: size, height: size, backgroundColor: color }} /> }) }}>
      <Icon name="check" label="Done" />
    </IconProvider>
  ),
  Input: () => <Input label="Name" value="Ada" onChangeText={noop} />,
  Label: () => <Label required>Name</Label>,
  Link: () => <Link href="/docs">Docs</Link>,
  Modal: () => (
    <Modal visible onClose={noop}>
      <Text>Modal content</Text>
    </Modal>
  ),
  NavBar: () => <NavBar items={items} pathname="/" navigate={noop} layout="top" />,
  NavContext: () => (
    <NavProvider items={items} pathname="/" navigate={noop}>
      <Text>Inside provider</Text>
    </NavProvider>
  ),
  P: () => <P>Paragraph</P>,
  PasswordInput: () => <PasswordInput label="Password" value="secret" onChangeText={noop} />,
  Popover: () => <Popover renderTrigger={() => <Text>Trigger</Text>}>{<Text>Popover content</Text>}</Popover>,
  Portal: () => (
    <OverlayHost>
      <Text>Screen</Text>
      <Portal>
        <Text>Overlay</Text>
      </Portal>
    </OverlayHost>
  ),
  ProgressBar: () => <ProgressBar progress={50} />,
  Quote: () => <Quote>Quoted</Quote>,
  RadioGroup: () => (
    <RadioGroup
      value="a"
      onChange={noop}
      options={[
        { label: "A", value: "a" },
        { label: "B", value: "b" },
      ]}
    />
  ),
  Row: () => (
    <Row gap="sm">
      <Text>Left</Text>
      <Text>Right</Text>
    </Row>
  ),
  Select: () => (
    <Select
      value="a"
      onChange={noop}
      options={[
        { label: "A", value: "a" },
        { label: "B", value: "b" },
      ]}
    />
  ),
  SideBar: () => <SideBar />,
  Slot: () => (
    <Slot accessibilityRole="text">
      <Text>Slot child</Text>
    </Slot>
  ),
  Small: () => <Small>Caption</Small>,
  Spacer: () => (
    <View>
      <Spacer size="md" />
      <Spacer axis="horizontal" size="sm" />
      <Spacer flex />
    </View>
  ),
  Spinner: () => <Spinner />,
  StateView: () => (
    <View>
      <EmptyState variant="no-results" actionLabel="Clear filters" onAction={noop} />
      <ErrorState message="Could not load" detail="Network request failed" onRetry={noop} />
      <LoadingState />
      <Result status="success" />
      <AsyncBoundary status="success" data={["a"]}>
        {(rows) => <Text>{rows.join(",")}</Text>}
      </AsyncBoundary>
    </View>
  ),
  Switch: () => <Switch label="Enabled" value onChange={noop} />,
  Text: () => <Text>Body</Text>,
  TextGroup: () => (
    <TextGroup>
      <Heading level={3}>Title</Heading>
      <P>Body</P>
    </TextGroup>
  ),
  Textarea: () => <Textarea label="Message" value="Hello" onChangeText={noop} />,
  Tooltip: () => (
    <Tooltip content="Hint">
      <Text>Target</Text>
    </Tooltip>
  ),
  Touchable: () => (
    <Touchable accessibilityLabel="Touch" onPress={noop}>
      <Text>Press</Text>
    </Touchable>
  ),
  TopBar: () => <TopBar title="Docs" />,
};

/** The fixture for a component, or an error that says exactly what to add. */
export function requireFixture(name: string): () => React.ReactElement {
  const fixture = fixtures[name];
  if (!fixture) {
    throw new Error(`Component "${name}" has a meta entry (src/components/${name}/${name}.meta.ts) but no render fixture: add "${name}" to tests/helpers/fixtures.tsx`);
  }
  return fixture;
}
