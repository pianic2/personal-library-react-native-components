import assert from "node:assert/strict";
import test from "node:test";
import {
  assertAccessibilityContract,
  assertAccessibilityHint,
  assertLiveRegion,
  assertMinimumTouchTarget,
  assertNotAccessible,
  assertTouchTargetWithHitSlop,
  collectInteractiveNodes,
} from "../helpers/accessibility";

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

test("touch target helper accepts the platform minimum 44 (ios) and 48 (android)", () => {
  assert.doesNotThrow(() => assertMinimumTouchTarget({ minWidth: 44, minHeight: 44 }, "ios"));
  assert.throws(() => assertMinimumTouchTarget({ minWidth: 44, minHeight: 44 }, "android"), /48x48/);
  assert.doesNotThrow(() => assertMinimumTouchTarget({ minWidth: 48, minHeight: 48 }, "android"));
});

test("accessibility hint helper requires a non-empty hint", () => {
  assert.doesNotThrow(() => assertAccessibilityHint({ accessibilityHint: "Saves the form" }, "Saves the form"));
  assert.throws(() => assertAccessibilityHint({}), /accessibilityHint missing/);
  assert.throws(() => assertAccessibilityHint({ accessibilityHint: "A" }, "B"), /accessibilityHint mismatch/);
});

test("hidden helper accepts hidden nodes and rejects exposed ones", () => {
  assert.doesNotThrow(() => assertNotAccessible({ accessibilityElementsHidden: true }));
  assert.doesNotThrow(() => assertNotAccessible({ importantForAccessibility: "no-hide-descendants" }));
  assert.throws(() => assertNotAccessible({ accessibilityLabel: "Visible" }), /hidden from assistive/);
});

test("live region helper checks the announced politeness", () => {
  assert.doesNotThrow(() => assertLiveRegion({ accessibilityLiveRegion: "polite" }, "polite"));
  assert.throws(() => assertLiveRegion({ accessibilityLiveRegion: "polite" }, "assertive"), /LiveRegion mismatch/);
});

test("hitSlop helper adds slop to the visual size per platform", () => {
  assert.doesNotThrow(() => assertTouchTargetWithHitSlop({ width: 32, height: 32 }, 6, "ios"));
  assert.throws(() => assertTouchTargetWithHitSlop({ width: 32, height: 32 }, 6, "android"), /48x48/);
  assert.doesNotThrow(() => assertTouchTargetWithHitSlop({ width: 32, height: 32 }, { top: 8, bottom: 8, left: 8, right: 8 }, "android"));
  assert.throws(() => assertTouchTargetWithHitSlop({ width: 32, height: 32 }, undefined), /44x44/);
});

test("collectInteractiveNodes finds pressables and interactive roles", () => {
  const tree = {
    children: [
      { props: { accessibilityRole: "button" } },
      { props: { onPress: () => undefined }, children: [{ props: { accessibilityRole: "text" } }] },
      { props: { accessibilityRole: "image" } },
    ],
  };
  assert.equal(collectInteractiveNodes(tree).length, 2);
  assert.equal(collectInteractiveNodes({}).length, 0);
});
