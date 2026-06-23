import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import TestRenderer, { act } from "react-test-renderer";

import {
  Alert,
  Badge,
  Box,
  Button,
  Checkbox,
  Card,
  CodeInline,
  Column,
  Divider,
  Heading,
  Input,
  PasswordInput,
  ProgressBar,
  Row,
  Spinner,
  Switch,
  Text,
  Textarea,
  ThemeProvider,
} from "../../src";

function renderWithTheme(element: React.ReactElement) {
  let renderer: TestRenderer.ReactTestRenderer | undefined;

  act(() => {
    renderer = TestRenderer.create(
      <ThemeProvider withScroll={false}>{element}</ThemeProvider>
    );
  });

  assert.ok(renderer);
  return renderer;
}

function flattenStyle(style: unknown): Record<string, unknown> {
  if (Array.isArray(style)) {
    return style.reduce<Record<string, unknown>>(
      (merged, item) => ({ ...merged, ...flattenStyle(item) }),
      {}
    );
  }

  if (style && typeof style === "object") {
    return style as Record<string, unknown>;
  }

  return {};
}

describe("component smoke render baseline", () => {
  const priorityCases: Array<{
    name: string;
    element: React.ReactElement;
  }> = [
    {
      name: "Button",
      element: <Button label="Save" onPress={() => undefined} />,
    },
    {
      name: "Box",
      element: (
        <Box padding="sm">
          <Text>Box content</Text>
        </Box>
      ),
    },
    {
      name: "Row",
      element: (
        <Row gap="sm">
          <Text>Left</Text>
          <Text>Right</Text>
        </Row>
      ),
    },
    {
      name: "Column",
      element: (
        <Column gap="sm">
          <Text>Top</Text>
          <Text>Bottom</Text>
        </Column>
      ),
    },
    {
      name: "Divider",
      element: <Divider />,
    },
    {
      name: "Text",
      element: <Text>Body text</Text>,
    },
    {
      name: "Heading",
      element: <Heading level={2}>Smoke</Heading>,
    },
    {
      name: "Spinner",
      element: <Spinner />,
    },
    {
      name: "Alert",
      element: <Alert title="Heads up" message="Smoke message" />,
    },
    {
      name: "Badge",
      element: <Badge label="New" />,
    },
    {
      name: "Input",
      element: <Input label="Name" value="Ada" onChangeText={() => undefined} />,
    },
    {
      name: "Switch",
      element: (
        <Switch value={true} onChange={() => undefined} label="Enabled" />
      ),
    },
    {
      name: "Checkbox",
      element: (
        <Checkbox checked={true} onChange={() => undefined} label="Checked" />
      ),
    },
    {
      name: "Card",
      element: (
        <Card>
          <Text>Card content</Text>
        </Card>
      ),
    },
    {
      name: "ProgressBar",
      element: <ProgressBar progress={50} />,
    },
    {
      name: "CodeInline",
      element: <CodeInline>const ok = true;</CodeInline>,
    },
    {
      name: "Textarea",
      element: (
        <Textarea
          label="Message"
          value="Hello"
          onChangeText={() => undefined}
        />
      ),
    },
    {
      name: "PasswordInput",
      element: (
        <PasswordInput
          label="Password"
          value="secret"
          onChangeText={() => undefined}
        />
      ),
    },
  ];

  for (const { name, element } of priorityCases) {
    it(`renders ${name} without throwing`, () => {
      const renderer = renderWithTheme(element);

      assert.ok(renderer.toJSON());
    });
  }

  it("renders the priority component group together", () => {
    const renderer = renderWithTheme(
      <Column gap="sm">
        <Heading level={2}>Smoke</Heading>
        <Text>Body text</Text>
        <Box padding="sm">
          <Row gap="sm">
            <Button label="Save" onPress={() => undefined} />
            <Badge label="New" />
          </Row>
        </Box>
        <Divider />
        <Spinner />
        <Alert title="Heads up" message="Smoke message" />
        <Input label="Name" value="Ada" onChangeText={() => undefined} />
        <Card>
          <CodeInline>const grouped = true;</CodeInline>
        </Card>
        <ProgressBar progress={50} />
        <Textarea
          label="Message"
          value="Hello"
          onChangeText={() => undefined}
        />
        <PasswordInput
          label="Password"
          value="secret"
          onChangeText={() => undefined}
        />
        <Switch value={true} onChange={() => undefined} label="Enabled" />
        <Checkbox checked={true} onChange={() => undefined} label="Checked" />
      </Column>
    );

    assert.ok(renderer.toJSON());
  });
});

describe("PLRNUI-21 component blocker remediation coverage", () => {
  it("applies clamped ProgressBar fill width", () => {
    const renderer = renderWithTheme(<ProgressBar progress={150} />);
    const views = renderer.root.findAllByType("View");

    const fill = views.find((node) => {
      const style = flattenStyle(node.props.style);
      return style.height === "100%";
    });

    assert.ok(fill);
    assert.equal(flattenStyle(fill.props.style).width, "100%");
  });

  it("uses a resolved CodeInline size for lineHeight", () => {
    const renderer = renderWithTheme(<CodeInline>inline code</CodeInline>);
    const textNodes = renderer.root.findAllByType("Text");

    const codeText = textNodes.find((node) => node.children.includes("inline code"));

    assert.ok(codeText);
    assert.equal(flattenStyle(codeText.props.style).fontSize, 12);
    assert.equal(flattenStyle(codeText.props.style).lineHeight, 15.600000000000001);
  });

  it("forces Textarea multiline input with top alignment", () => {
    const renderer = renderWithTheme(
      <Textarea label="Message" value="Hello" onChangeText={() => undefined} />
    );
    const input = renderer.root.findByType("TextInput");

    assert.equal(input.props.multiline, true);
    assert.equal(input.props.textAlignVertical, "top");
  });

  it("renders an accessible PasswordInput visibility toggle", () => {
    const renderer = renderWithTheme(
      <PasswordInput
        label="Password"
        value="secret"
        onChangeText={() => undefined}
      />
    );

    const input = renderer.root.findByType("TextInput");
    assert.equal(input.props.secureTextEntry, true);

    const toggle = renderer.root.findByProps({
      accessibilityLabel: "Show password",
    });
    assert.equal(toggle.props.accessibilityRole, "button");
    assert.deepEqual(toggle.props.accessibilityState, { checked: false });

    act(() => {
      toggle.props.onPress();
    });

    const updatedInput = renderer.root.findByType("TextInput");
    assert.equal(updatedInput.props.secureTextEntry, false);
    assert.equal(
      renderer.root.findByProps({ accessibilityLabel: "Hide password" }).props
        .accessibilityRole,
      "button"
    );
  });
});
