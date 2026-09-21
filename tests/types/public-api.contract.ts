import type {
  BoxProps,
  ButtonProps,
  InputProps,
  NavItem,
  Theme,
  ThemeProviderProps,
} from "../../src/index";

const button: ButtonProps = { children: "Save", onPress: () => undefined };
const input: InputProps = { value: "hello", onChangeText: (_value: string) => undefined };
const box: BoxProps = { padding: "md" };
const nav: NavItem = { label: "Home", href: "/" };
const provider: ThemeProviderProps = { children: null };

declare const theme: Theme;
void [button, input, box, nav, provider, theme];

// Negative consumer contracts must remain rejected.
// @ts-expect-error Button does not accept an arbitrary unsupported prop.
const invalidButton: ButtonProps = { definitelyNotAButtonProp: true };
// @ts-expect-error NavItem requires the governed navigation shape.
const invalidNav: NavItem = { label: "Missing href" };
void [invalidButton, invalidNav];
