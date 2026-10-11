import React, { useState } from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import TestRenderer, { act } from "react-test-renderer";
import { TextInput } from "react-native";
import { Button, Input, ThemeProvider } from "../../src/index.js";
import { useTheme } from "../../src/theme/useTheme.js";
import { assertWithinBaseline, createRenderCounter, createRenderProbe } from "../helpers/render-count.js";

function mount(ui: React.ReactElement): TestRenderer.ReactTestRenderer {
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(ui);
  });
  return renderer;
}

const noop = () => undefined;

// Each scenario measures a count and compares it with tests/perf/baselines.json (relative tolerance).
describe("PLRNUI-126 render-count baselines", () => {
  it("Button: parent updates with the same props", () => {
    // Button renders its `icon` component on every render, so the probe inside the icon counts Button's renders.
    const buttonRenders = createRenderProbe();
    const Icon = () => <buttonRenders.Probe />;
    let bump: () => void = () => undefined;
    function Parent() {
      const [tick, setTick] = useState(0);
      bump = () => setTick((t) => t + 1);
      return (
        <>
          <span>{tick}</span>
          <Button icon={Icon} label="Save" onPress={noop} />
        </>
      );
    }
    mount(
      <ThemeProvider>
        <Parent />
      </ThemeProvider>,
    );
    buttonRenders.reset();
    for (let i = 0; i < 5; i += 1) act(() => bump());
    assertWithinBaseline("button-parent-update-same-props", buttonRenders.renders);
  });

  it("ThemeProvider toggle re-renders consumers, not components that do not read the theme", () => {
    const consumer = createRenderProbe();
    const bystander = createRenderProbe();
    let toggle: () => void = () => undefined;
    function Consumer() {
      const { toggleTheme, colors } = useTheme();
      toggle = toggleTheme;
      return (
        <consumer.Probe>
          <span>{colors.primary}</span>
        </consumer.Probe>
      );
    }
    // The bystander element is created once, outside ThemeProvider's render, so only a context change can re-render Consumer.
    const bystanderElement = (
      <bystander.Probe>
        <span>static</span>
      </bystander.Probe>
    );
    mount(
      <ThemeProvider>
        <Consumer />
        {bystanderElement}
      </ThemeProvider>,
    );
    consumer.reset();
    bystander.reset();
    act(() => toggle());
    act(() => toggle());
    assertWithinBaseline("theme-toggle-consumer-renders", consumer.renders);
    assertWithinBaseline("theme-toggle-non-consumer-renders", bystander.renders);
  });

  it("Input: typing five characters into a controlled field", () => {
    const counter = createRenderCounter();
    function Form() {
      const [value, setValue] = useState("");
      return (
        <counter.Profile>
          <Input label="Name" value={value} onChangeText={setValue} />
        </counter.Profile>
      );
    }
    const renderer = mount(
      <ThemeProvider>
        <Form />
      </ThemeProvider>,
    );
    counter.reset();
    for (const text of ["a", "ad", "ada", "ada ", "ada l"]) act(() => renderer.root.findByType(TextInput).props.onChangeText(text));
    assert.equal(renderer.root.findByType(TextInput).props.value, "ada l");
    assertWithinBaseline("input-typing-commits", counter.commits);
  });
});
