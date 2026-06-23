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
  Column,
  Divider,
  Heading,
  Input,
  Row,
  Spinner,
  Switch,
  Text,
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
        <Switch value={true} onChange={() => undefined} label="Enabled" />
        <Checkbox checked={true} onChange={() => undefined} label="Checked" />
      </Column>
    );

    assert.ok(renderer.toJSON());
  });
});
