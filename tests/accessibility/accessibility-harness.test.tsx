import assert from "node:assert/strict";
import test from "node:test";
import { assertAccessibilityContract, assertMinimumTouchTarget } from "../helpers/accessibility";

test("accessibility contract accepts expected static semantics", () => {
  assert.doesNotThrow(() => assertAccessibilityContract(
    { accessibilityRole: "button", accessibilityLabel: "Save", accessibilityState: { disabled: false } },
    { accessibilityRole: "button", accessibilityLabel: "Save", accessibilityState: { disabled: false } },
  ));
});

test("accessibility contract detects missing semantics", () => {
  assert.throws(() => assertAccessibilityContract(
    { accessibilityLabel: "Save" },
    { accessibilityRole: "button", accessibilityLabel: "Save" },
  ), /accessibilityRole mismatch/);
});

test("touch target helper enforces deterministic minimum style dimensions", () => {
  assert.doesNotThrow(() => assertMinimumTouchTarget({ minWidth: 44, minHeight: 44 }));
  assert.throws(() => assertMinimumTouchTarget({ minWidth: 32, minHeight: 44 }), /touch target/);
});
