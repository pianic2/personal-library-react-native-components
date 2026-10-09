// Reading-order helper for assistive technology (PLRNUI-99, E9-11).
// getAccessibleTree() walks the host tree of a react-test-renderer instance and returns the nodes a screen reader
// would visit, in tree order. It models the rules documented for React Native:
//  - accessibilityElementsHidden / aria-hidden (iOS) and importantForAccessibility="no-hide-descendants" (Android)
//    hide the node and its whole subtree;
//  - importantForAccessibility="no" hides only the node itself, its descendants stay reachable;
//  - accessible={true} groups its descendants into one element whose text is the concatenation of their text;
//  - accessible={false} makes a node transparent: its descendants are considered on their own;
//  - Text, TextInput, Switch and Pressable are accessible elements by default; a Text nested in a Text belongs to the
//    outer element.
// It is a model of the platform rules for tests, not a replacement for a device check.

export type HostNode = {
  type: string;
  props?: Record<string, unknown>;
  children?: Array<HostNode | string> | null;
};

export type Renderer = { toJSON(): HostNode | HostNode[] | null };

export type AccessibleNode = {
  type: string;
  role?: string;
  label?: string;
  /** Text of the element: its accessibilityLabel when set, otherwise the concatenated text of its content. */
  text: string;
  props: Record<string, unknown>;
};

const NATIVELY_ACCESSIBLE = new Set(["Text", "TextInput", "Switch", "Pressable", "TouchableOpacity", "TouchableHighlight", "TouchableWithoutFeedback", "Button"]);

function isRenderer(value: unknown): value is Renderer {
  return typeof value === "object" && value !== null && typeof (value as Renderer).toJSON === "function";
}

function hidesSubtree(props: Record<string, unknown>): boolean {
  return (
    props.accessibilityElementsHidden === true ||
    props["aria-hidden"] === true ||
    props.importantForAccessibility === "no-hide-descendants"
  );
}

function contentText(node: HostNode | string): string {
  if (typeof node === "string") return node;
  const props = node.props ?? {};
  if (hidesSubtree(props)) return "";
  return (node.children ?? []).map(contentText).join(" ").replace(/\s+/g, " ").trim();
}

function isElement(node: HostNode): boolean {
  const props = node.props ?? {};
  if (props.importantForAccessibility === "no") return false;
  if (props.accessible === false) return false;
  return props.accessible === true || NATIVELY_ACCESSIBLE.has(node.type);
}

export function getAccessibleTree(source: Renderer | HostNode | HostNode[] | null): AccessibleNode[] {
  const root = isRenderer(source) ? source.toJSON() : source;
  const found: AccessibleNode[] = [];
  const visit = (node: HostNode | string) => {
    if (typeof node === "string") return;
    const props = node.props ?? {};
    if (hidesSubtree(props)) return;
    if (isElement(node)) {
      const label = typeof props.accessibilityLabel === "string" ? props.accessibilityLabel : undefined;
      const text = label ?? contentText(node);
      found.push({
        type: node.type,
        role: typeof props.accessibilityRole === "string" ? props.accessibilityRole : undefined,
        label,
        text,
        props,
      });
      return; // descendants are part of this element
    }
    for (const child of node.children ?? []) visit(child);
  };
  if (Array.isArray(root)) root.forEach(visit);
  else if (root) visit(root);
  return found;
}

/** The text a screen reader announces for each node, in order. */
export function accessibleTexts(source: Renderer | HostNode | HostNode[] | null): string[] {
  return getAccessibleTree(source).map((node) => node.text);
}
