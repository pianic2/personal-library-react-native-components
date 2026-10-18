import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import TestRenderer, { act } from "react-test-renderer";
import { ThemeProvider, Row, Text } from "../../src";
import { defaultTheme } from "../../src/theme/defaultTheme.js";

function render(ui: React.ReactElement): TestRenderer.ReactTestRenderer {
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(
      <ThemeProvider initialMode="light" persistTheme={false}>
        {ui}
      </ThemeProvider>,
    );
  });
  return renderer;
}

const flatten = (style: unknown): Record<string, any> => Object.assign({}, ...[style].flat(Infinity).filter(Boolean));
const view = (r: TestRenderer.ReactTestRenderer) => r.root.findByType("View" as unknown as React.ElementType);

describe("PLRNUI-295 Row flex and rowGap", () => {
  it("flex={1} is applied to the style", () => {
    const style = flatten(view(render(<Row flex={1}><Text>a</Text></Row>)).props.style);
    assert.equal(style.flex, 1);
  });

  it("flex is not forwarded as a View prop", () => {
    const props = view(render(<Row flex={1}><Text>a</Text></Row>)).props;
    assert.equal(props.flex, undefined);
    assert.equal("flex" in props, false);
  });

  it("without flex the style has no flex key", () => {
    assert.equal("flex" in flatten(view(render(<Row><Text>a</Text></Row>)).props.style), false);
  });

  it("a consumer style overrides flex", () => {
    const style = flatten(view(render(<Row flex={1} style={{ flex: 3 }}><Text>a</Text></Row>)).props.style);
    assert.equal(style.flex, 3);
  });

  it("wrap adds rowGap equal to theme.space[gap]", () => {
    for (const gap of ["none", "xs", "sm", "md", "lg", "xxl"] as const) {
      const style = flatten(view(render(<Row wrap gap={gap}><Text>a</Text></Row>)).props.style);
      assert.equal(style.rowGap, defaultTheme.space[gap], gap);
      assert.equal(style.columnGap, defaultTheme.space[gap], gap);
    }
  });

  it("without wrap there is no rowGap", () => {
    assert.equal("rowGap" in flatten(view(render(<Row gap="lg"><Text>a</Text></Row>)).props.style), false);
  });
});
