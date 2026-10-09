import assert from "node:assert/strict";

export type AccessibilityProps = {
  accessibilityRole?: string;
  accessibilityLabel?: string;
  accessibilityState?: Record<string, unknown>;
  accessibilityValue?: Record<string, unknown>;
  accessibilityHint?: string;
  accessibilityLiveRegion?: string;
  accessibilityElementsHidden?: boolean;
  importantForAccessibility?: string;
  accessible?: boolean;
  onPress?: unknown;
};

export type Insets = { top?: number; right?: number; bottom?: number; left?: number };
export type TouchPlatform = "ios" | "android" | "web";

export type AccessibilityNode = {
  props?: AccessibilityProps & Record<string, unknown>;
  children?: AccessibilityNode[];
};

const INTERACTIVE_ROLES = new Set([
  "button",
  "link",
  "checkbox",
  "radio",
  "switch",
  "tab",
  "menuitem",
  "adjustable",
  "search",
  "imagebutton",
  "combobox",
  "spinbutton",
]);

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
  if (expected.accessibilityHint !== undefined) {
    assert.equal(props.accessibilityHint, expected.accessibilityHint, "accessibilityHint mismatch");
  }
  if (expected.accessibilityLiveRegion !== undefined) {
    assert.equal(props.accessibilityLiveRegion, expected.accessibilityLiveRegion, "accessibilityLiveRegion mismatch");
  }
}

export function assertMinimumTouchTarget(
  style: Record<string, unknown>,
  minimum: number | TouchPlatform = 44,
) {
  const min = typeof minimum === "number" ? minimum : platformMinimumTouchTarget(minimum);
  const minWidth = Number(style.minWidth ?? style.width ?? 0);
  const minHeight = Number(style.minHeight ?? style.height ?? 0);
  assert.ok(minWidth >= min && minHeight >= min, `touch target must be at least ${min}x${min}`);
}

export function platformMinimumTouchTarget(platform: TouchPlatform): number {
  return platform === "android" ? 48 : 44;
}

export function assertAccessibilityHint(props: AccessibilityProps, expected?: string) {
  assert.ok(
    typeof props.accessibilityHint === "string" && props.accessibilityHint.length > 0,
    "accessibilityHint missing",
  );
  if (expected !== undefined) {
    assert.equal(props.accessibilityHint, expected, "accessibilityHint mismatch");
  }
}

export function assertNotAccessible(props: AccessibilityProps) {
  const hidden =
    props.accessibilityElementsHidden === true ||
    props.importantForAccessibility === "no" ||
    props.importantForAccessibility === "no-hide-descendants";
  assert.ok(hidden, "node must be hidden from assistive technology");
}

export function assertLiveRegion(props: AccessibilityProps, expected: "none" | "polite" | "assertive") {
  assert.equal(props.accessibilityLiveRegion, expected, "accessibilityLiveRegion mismatch");
}

export function assertTouchTargetWithHitSlop(
  style: Record<string, unknown>,
  hitSlop: number | Insets | undefined,
  platform: TouchPlatform,
  parent?: { width: number; height: number },
) {
  const minimum = platformMinimumTouchTarget(platform);
  const slop: Insets =
    typeof hitSlop === "number"
      ? { top: hitSlop, right: hitSlop, bottom: hitSlop, left: hitSlop }
      : (hitSlop ?? {});
  let width =
    Number(style.minWidth ?? style.width ?? 0) + Number(slop.left ?? 0) + Number(slop.right ?? 0);
  let height =
    Number(style.minHeight ?? style.height ?? 0) + Number(slop.top ?? 0) + Number(slop.bottom ?? 0);
  // hitSlop never extends past the parent bounds, so clamp when the parent is known.
  if (parent) {
    width = Math.min(width, parent.width);
    height = Math.min(height, parent.height);
  }
  assert.ok(
    width >= minimum && height >= minimum,
    `touch target with hitSlop must be at least ${minimum}x${minimum} on ${platform}`,
  );
}

export function collectInteractiveNodes(root: AccessibilityNode): AccessibilityNode[] {
  const found: AccessibilityNode[] = [];
  const visit = (node: AccessibilityNode) => {
    const props = node.props ?? {};
    const role = props.accessibilityRole;
    if (typeof props.onPress === "function" || (role !== undefined && INTERACTIVE_ROLES.has(role))) {
      found.push(node);
    }
    for (const child of node.children ?? []) {
      visit(child);
    }
  };
  visit(root);
  return found;
}
