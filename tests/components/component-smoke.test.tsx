import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import TestRenderer, { act } from "react-test-renderer";

import * as RootApi from "../../src";
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
  BottomBar,
  Link,
  Modal,
  NavBar,
  BottomSheet,
  Tooltip,
  Popover,
  Select,
  SideBar,
  TopBar,
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
  it("fences internal helpers from the root API", () => {
    assert.equal("cn" in RootApi, false);
    assert.equal("useIsMounted" in RootApi, false);
  });

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

describe("PLRNUI-22 navigation component coverage", () => {
  const navItems = [
    { label: "Home", href: "/home" },
    { label: "Search", href: "/search" },
    { label: "Library", href: "/library" },
    { label: "Settings", href: "/settings" },
  ];

  it("renders TopBar without consumer-facing placeholder text when slots are missing", () => {
    const renderer = renderWithTheme(<TopBar />);
    const textNodes = renderer.root.findAllByType("Text");

    assert.equal(
      textNodes.some((node) => node.children.includes("a")),
      false
    );
  });

  it("limits BottomBar visible items without rendering overflow", () => {
    const renderer = renderWithTheme(
      <NavBar
        items={navItems}
        pathname="/home"
        navigate={() => undefined}
        layout="bottom"
        bottomMaxItems={2}
      />
    );
    const textNodes = renderer.root.findAllByType("Text");
    const labels = textNodes.flatMap((node) => node.children);

    assert.ok(labels.includes("Home"));
    assert.ok(labels.includes("Search"));
    assert.equal(labels.includes("Library"), false);
    assert.equal(labels.includes("Settings"), false);
    assert.equal(labels.includes("More"), false);
  });

  it("passes NavBar bottomMaxItems to BottomBar as a visible item limit", () => {
    const renderer = renderWithTheme(
      <NavBar
        items={navItems}
        pathname="/home"
        navigate={() => undefined}
        layout="bottom"
        bottomMaxItems={3}
      />
    );
    const bottomBar = renderer.root.findByType(BottomBar);

    assert.equal(bottomBar.props.maxItems, 3);
  });

  it("does not crash Link without router adapter or onPress", () => {
    const renderer = renderWithTheme(<Link href="/safe">Safe link</Link>);
    const pressable = renderer.root.findByType("Pressable");

    act(() => {
      pressable.props.onPress();
    });

    assert.ok(renderer.toJSON());
  });

  it("uses Link onPress before navigation fallback", () => {
    let pressed = false;
    const renderer = renderWithTheme(
      <Link href="/safe" onPress={() => {
        pressed = true;
      }}>
        Safe link
      </Link>
    );
    const pressable = renderer.root.findByType("Pressable");

    act(() => {
      pressable.props.onPress();
    });

    assert.equal(pressed, true);
  });

  it("uses Link routerAdapter navigation", () => {
    let navigatedTo = "";
    const renderer = renderWithTheme(
      <Link
        href="/adapter"
        routerAdapter={{
          navigate: (href) => {
            navigatedTo = href;
          },
        }}
      >
        Adapter link
      </Link>
    );
    const pressable = renderer.root.findByType("Pressable");

    act(() => {
      pressable.props.onPress();
    });

    assert.equal(navigatedTo, "/adapter");
  });

  it("renders SideBar as a non-null navigation list", () => {
    const renderer = renderWithTheme(
      <NavBar
        items={navItems}
        pathname="/home"
        navigate={() => undefined}
        layout="sidebar"
      />
    );
    const textNodes = renderer.root.findAllByType("Text");
    const labels = textNodes.flatMap((node) => node.children);

    assert.ok(renderer.toJSON());
    assert.ok(labels.includes("Home"));
  });
});

describe("PLRNUI-23 overlay and modal form component coverage", () => {
  it("renders Modal without throwing", () => {
    const renderer = renderWithTheme(
      <Modal visible={true} onClose={() => undefined}>
        <Text>Modal content</Text>
      </Modal>
    );

    assert.ok(renderer.toJSON());
  });

  it("renders BottomSheet without throwing", () => {
    const renderer = renderWithTheme(
      <BottomSheet visible={true} onClose={() => undefined}>
        <Text>Sheet content</Text>
      </BottomSheet>
    );

    assert.ok(renderer.toJSON());
  });

  it("renders Tooltip without throwing", () => {
    const renderer = renderWithTheme(
      <Tooltip content="Helpful detail">
        <Text>Tooltip trigger</Text>
      </Tooltip>
    );

    assert.ok(renderer.toJSON());
  });

  it("renders Popover without throwing", () => {
    const renderer = renderWithTheme(
      <Popover
        renderTrigger={() => <Text>Popover trigger</Text>}
      >
        <Text>Popover content</Text>
      </Popover>
    );

    assert.ok(renderer.toJSON());
  });

  it("renders Select without throwing", () => {
    const renderer = renderWithTheme(
      <Select
        options={[{ label: "One", value: "one" }]}
        value="one"
        onChange={() => undefined}
      />
    );

    assert.ok(renderer.toJSON());
  });
});
