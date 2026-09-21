import assert from "node:assert/strict";

export type AccessibilityProps = {
  accessibilityRole?: string;
  accessibilityLabel?: string;
  accessibilityState?: Record<string, unknown>;
  accessibilityValue?: Record<string, unknown>;
};

export function assertAccessibilityContract(
  props: AccessibilityProps,
  expected: AccessibilityProps,
) {
  if (expected.accessibilityRole !== undefined) {
    assert.equal(props.accessibilityRole, expected.accessibilityRole, "accessibilityRole mismatch");
  }
  if (expected.accessibilityLabel !== undefined) {
    assert.equal(props.accessibilityLabel, expected.accessibilityLabel, "accessibilityLabel mismatch");
  }
  if (expected.accessibilityState !== undefined) {
    assert.deepEqual(props.accessibilityState, expected.accessibilityState, "accessibilityState mismatch");
  }
  if (expected.accessibilityValue !== undefined) {
    assert.deepEqual(props.accessibilityValue, expected.accessibilityValue, "accessibilityValue mismatch");
  }
}

export function assertMinimumTouchTarget(style: Record<string, unknown>, minimum = 44) {
  const minWidth = Number(style.minWidth ?? style.width ?? 0);
  const minHeight = Number(style.minHeight ?? style.height ?? 0);
  assert.ok(minWidth >= minimum && minHeight >= minimum, `touch target must be at least ${minimum}x${minimum}`);
}
