import React from "react";
import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import TestRenderer, { act } from "react-test-renderer";
import { ThemeProvider, useTheme } from "../../src";
import { Chip } from "../../src/components/Chip/index.js";
import type { ChipProps } from "../../src/components/Chip/index.js";

type Mode = "light" | "dark";
const tones = ["primary", "neutral", "success", "warning", "danger", "info"] as const;
const variants = ["filled", "outline", "soft"] as const;

const originalError = console.error;
const originalWarn = console.warn;
afterEach(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

function render(ui: React.ReactElement, mode: Mode = "light"): TestRenderer.ReactTestRenderer {
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(
      <ThemeProvider initialMode={mode} persistTheme={false}>
        {ui}
      </ThemeProvider>,
    );
  });
  return renderer;
}

function themeOf(mode: Mode = "light"): ReturnType<typeof useTheme> {
  let captured: ReturnType<typeof useTheme> | undefined;
  function Probe() {
    captured = useTheme();
    return null;
  }
  render(<Probe />, mode);
  return captured as ReturnType<typeof useTheme>;
}

const flatten = (style: unknown): Record<string, any> => Object.assign({}, ...[style].flat(Infinity).filter(Boolean));
const press = (node: TestRenderer.ReactTestInstance) => act(() => void node.props.onPress({}));
const byLabel = (r: TestRenderer.ReactTestRenderer, label: string) =>
  r.root.findAll((n) => typeof n.type === "string" && n.props.accessibilityLabel === label && typeof n.props.onPress === "function");
const rootView = (r: TestRenderer.ReactTestRenderer, testID: string) => r.root.findAll((n) => n.props.testID === testID && typeof n.type === "string")[0]!;

describe("PLRNUI-331 Chip selection", () => {
  it("toggles through onSelectedChange with the next value and calls onPress", () => {
    const seen: boolean[] = [];
    let presses = 0;
    const r = render(<Chip label="Sale" selected={false} onSelectedChange={(v) => seen.push(v)} onPress={() => presses++} />);
    press(byLabel(r, "Sale")[0]!);
    act(() =>
      r.update(
        <ThemeProvider initialMode="light" persistTheme={false}>
          <Chip label="Sale" selected onSelectedChange={(v) => seen.push(v)} onPress={() => presses++} />
        </ThemeProvider>,
      ),
    );
    press(byLabel(r, "Sale")[0]!);
    assert.deepEqual(seen, [true, false]);
    assert.equal(presses, 2);
  });

  it("does not notify when disabled", () => {
    let calls = 0;
    const r = render(<Chip label="Sale" selected={false} disabled onSelectedChange={() => calls++} onRemove={() => calls++} />);
    for (const node of [...byLabel(r, "Sale"), ...byLabel(r, "Remove Sale")]) press(node);
    assert.equal(calls, 0);
  });

  it("calls onRemove without onPress or onSelectedChange", () => {
    const log: string[] = [];
    const r = render(<Chip label="Tag" selected onSelectedChange={() => log.push("select")} onPress={() => log.push("press")} onRemove={() => log.push("remove")} />);
    press(byLabel(r, "Remove Tag")[0]!);
    assert.deepEqual(log, ["remove"]);
    press(byLabel(r, "Tag")[0]!);
    assert.deepEqual(log, ["remove", "select", "press"]);
  });

  it("shows no remove control without onRemove and gives it a 44pt target through hitSlop", () => {
    assert.equal(byLabel(render(<Chip label="Tag" onPress={() => undefined} />), "Remove Tag").length, 0);
    for (const size of ["sm", "md"] as const) {
      const control = byLabel(render(<Chip label="Tag" size={size} onRemove={() => undefined} />), "Remove Tag")[0]!;
      const slop = control.props.hitSlop as number;
      const style = flatten(control.props.style);
      assert.ok(style.width + 2 * slop >= 44 && style.height + 2 * slop >= 44, `${size}: ${style.width} + 2 * ${slop}`);
    }
  });
});

describe("PLRNUI-331 Chip accessibility", () => {
  it("uses role checkbox with checked and selected state when selectable", () => {
    for (const selected of [true, false]) {
      const node = byLabel(render(<Chip label="Sale" selected={selected} onSelectedChange={() => undefined} />), "Sale")[0]!;
      assert.equal(node.props.accessibilityRole, "checkbox");
      assert.equal(node.props.accessibilityState.selected, selected);
      assert.equal(node.props.accessibilityState.checked, selected);
      assert.equal(node.props.accessibilityState.disabled, false);
    }
  });

  it("uses role button with onPress only, and reports disabled", () => {
    const node = byLabel(render(<Chip label="Go" onPress={() => undefined} disabled />), "Go")[0]!;
    assert.equal(node.props.accessibilityRole, "button");
    assert.equal(node.props.accessibilityState.disabled, true);
    assert.equal(node.props.accessibilityState.selected, undefined);
  });

  it("labels the remove control Remove <label> as a button, and hides decoration", () => {
    const r = render(<Chip label="Tag" leftIcon={<></>} avatar={<></>} onRemove={() => undefined} />);
    const control = byLabel(r, "Remove Tag")[0]!;
    assert.equal(control.props.accessibilityRole, "button");
    assert.equal(r.root.findAll((n) => n.props.accessibilityElementsHidden === true && typeof n.type === "string").length >= 3, true);
  });

  it("is plain content when it has no press, selection or remove handler", () => {
    const r = render(<Chip label="Info" testID="chip" />);
    assert.equal(r.root.findAll((n) => n.props.accessibilityRole === "button" || n.props.accessibilityRole === "checkbox").length, 0);
  });
});

describe("PLRNUI-331 Chip theming", () => {
  it("resolves every variant and tone to theme tokens in light and dark with no console output", () => {
    const calls: unknown[][] = [];
    // react-test-renderer logs its own deprecation notice once per process; that notice is not a component error.
    console.error = (...args: unknown[]) => {
      if (!String(args[0]).includes("react-test-renderer is deprecated")) calls.push(args);
    };
    console.warn = (...args: unknown[]) => void calls.push(args);
    for (const mode of ["light", "dark"] as const) {
      const { theme } = themeOf(mode);
      const main = {
        primary: theme.semantic.action.primary,
        neutral: theme.semantic.text.secondary,
        success: theme.semantic.feedback.success,
        warning: theme.semantic.feedback.warning,
        danger: theme.semantic.feedback.error,
        info: theme.semantic.feedback.info,
      };
      for (const variant of variants) {
        for (const tone of tones) {
          const root = flatten(rootView(render(<Chip label="X" testID="c" variant={variant} tone={tone} onPress={() => undefined} />, mode), "c").props.style);
          if (variant === "filled") {
            assert.equal(root.backgroundColor, main[tone], `${mode} ${variant} ${tone}`);
          } else if (variant === "outline") {
            assert.equal(root.borderColor, main[tone], `${mode} ${variant} ${tone}`);
          }
          assert.equal(root.borderRadius, theme.radius.full);
        }
      }
    }
    assert.deepEqual(calls, []);
  });

  it("shows the quiet look until a selectable chip is selected", () => {
    const { theme } = themeOf();
    const idle = flatten(rootView(render(<Chip label="X" testID="c" tone="success" selected={false} onSelectedChange={() => undefined} />), "c").props.style);
    assert.equal(idle.backgroundColor, theme.semantic.surface.sunken);
    assert.equal(idle.borderColor, theme.semantic.border.default);
    const on = flatten(rootView(render(<Chip label="X" testID="c" tone="success" selected onSelectedChange={() => undefined} />), "c").props.style);
    assert.equal(on.backgroundColor, theme.semantic.feedback.success);
  });

  it("dims a disabled chip with the disabled opacity token", () => {
    const { theme } = themeOf();
    const root = flatten(rootView(render(<Chip label="X" testID="c" disabled onPress={() => undefined} />), "c").props.style);
    assert.equal(root.opacity, theme.components.button.opacity.disabled);
  });

  it("hardcodes no colour literal in src/components/Chip", () => {
    const dir = join(process.cwd(), "src/components/Chip");
    for (const file of readdirSync(dir)) {
      assert.doesNotMatch(readFileSync(join(dir, file), "utf8"), /#[0-9a-fA-F]{3,8}\b/, file);
    }
  });

  it("accepts the documented props", () => {
    const props: ChipProps = { label: "X", variant: "soft", size: "sm", tone: "info", leftIcon: null, avatar: null, disabled: false };
    assert.ok(props);
  });
});
