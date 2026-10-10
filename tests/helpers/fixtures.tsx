import React from "react";
import {
  Alert,
  B,
  Badge,
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
  PasswordInput,
  Popover,
  ProgressBar,
  Quote,
  RadioGroup,
  Row,
  Select,
  SideBar,
  Small,
  Spinner,
  Switch,
  Text,
  TextGroup,
  Textarea,
  Tooltip,
  TopBar,
} from "../../src";

const noop = () => undefined;
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
  Column: () => (
    <Column gap="sm">
      <Text>Top</Text>
      <Text>Bottom</Text>
    </Column>
  ),
  Divider: () => <Divider />,
  FormField: () => (
    <FormField label="Name" helperText="Helper">
      <Input label="Name" value="Ada" onChangeText={noop} />
    </FormField>
  ),
  Heading: () => <Heading level={2}>Title</Heading>,
  Input: () => <Input label="Name" value="Ada" onChangeText={noop} />,
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
  Small: () => <Small>Caption</Small>,
  Spinner: () => <Spinner />,
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
