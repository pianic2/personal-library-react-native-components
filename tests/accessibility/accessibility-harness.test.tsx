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

test("accessibility contract compares hint and live region when expected", () => {
  assert.throws(() => assertAccessibilityContract({}, { accessibilityHint: "Saves" }), /accessibilityHint mismatch/);
  assert.throws(() => assertAccessibilityContract({}, { accessibilityLiveRegion: "polite" }), /accessibilityLiveRegion mismatch/);
  assert.doesNotThrow(() => assertAccessibilityContract({ accessibilityHint: "Saves" }, { accessibilityHint: "Saves" }));
});

test("hidden helper accepts hidden nodes and rejects exposed ones", () => {
  assert.doesNotThrow(() => assertNotAccessible({ accessibilityElementsHidden: true }));
  assert.doesNotThrow(() => assertNotAccessible({ importantForAccessibility: "no-hide-descendants" }));
  assert.doesNotThrow(() => assertNotAccessible({ importantForAccessibility: "no" }));
  assert.throws(() => assertNotAccessible({ accessibilityLabel: "Visible" }), /hidden from assistive/);
  assert.throws(() => assertNotAccessible({ accessibilityElementsHidden: false }), /hidden from assistive/);
  assert.throws(() => assertNotAccessible({ importantForAccessibility: "auto" }), /hidden from assistive/);
  assert.throws(() => assertNotAccessible({ accessible: false }), /hidden from assistive/);
});

test("live region helper checks the announced politeness", () => {
  assert.doesNotThrow(() => assertLiveRegion({ accessibilityLiveRegion: "polite" }, "polite"));
  assert.doesNotThrow(() => assertLiveRegion({ accessibilityLiveRegion: "none" }, "none"));
  assert.throws(() => assertLiveRegion({ accessibilityLiveRegion: "polite" }, "assertive"), /LiveRegion mismatch/);
});

test("hitSlop helper adds slop to the visual size per platform", () => {
  assert.doesNotThrow(() => assertTouchTargetWithHitSlop({ width: 32, height: 32 }, 6, "ios"));
  assert.throws(() => assertTouchTargetWithHitSlop({ width: 32, height: 32 }, 6, "android"), /48x48/);
  assert.doesNotThrow(() => assertTouchTargetWithHitSlop({ width: 32, height: 32 }, { top: 8, bottom: 8, left: 8, right: 8 }, "android"));
  assert.throws(() => assertTouchTargetWithHitSlop({ width: 32, height: 32 }, undefined, "ios"), /44x44/);
  assert.throws(
    () => assertTouchTargetWithHitSlop({ width: 32, height: 32 }, 8, "android", { width: 32, height: 32 }),
    /48x48/,
  );
  assert.doesNotThrow(
    () => assertTouchTargetWithHitSlop({ width: 32, height: 32 }, 8, "android", { width: 64, height: 64 }),
  );
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
  assert.equal(
    collectInteractiveNodes({ children: [{ props: { accessibilityRole: "imagebutton" } }, { props: { accessibilityRole: "combobox" } }, { props: { accessibilityRole: "spinbutton" } }] }).length,
    3,
  );
  assert.equal(collectInteractiveNodes({ children: [] }).length, 0);
  assert.equal(collectInteractiveNodes({ props: { onPress: "not a function" } }).length, 0);
  const nested = { props: { accessibilityRole: "button" }, children: [{ children: [{ props: { accessibilityRole: "link" } }] }] };
  assert.equal(collectInteractiveNodes(nested).length, 2);
});
