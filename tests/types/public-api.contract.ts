import type { BoxProps, ButtonProps, InputProps, NavContextValue, NavItem, Theme, ThemeProviderProps } from "../../src/index";
import { PACKAGE_NAME, useNav, useNavItems, useNavLogo, useNavPathname, useNavigate, useOptionalNav } from "../../src/index";

const button: ButtonProps = { label: "Save", onPress: () => undefined };
const input: InputProps = { label: "Name", value: "hello", onChangeText: (_value: string) => undefined };
const box: BoxProps = { padding: "md" };
const nav: NavItem = { label: "Home", href: "/" };
const provider: ThemeProviderProps = { children: null };
declare const theme: Theme;
void [button, input, box, nav, provider, theme];

// @ts-expect-error Button does not accept an arbitrary unsupported prop.
const invalidButton: ButtonProps = { definitelyNotAButtonProp: true };
// @ts-expect-error NavItem requires the governed navigation shape.
const invalidNav: NavItem = { label: "Missing href" };
void [invalidButton, invalidNav];

// The navigation hooks are part of the root API and return the documented types.
const navItems: () => NavItem[] = useNavItems;
const navLogo: () => import("react").ReactNode = useNavLogo;
const navPathname: () => string = useNavPathname;
const navigate: () => (href: string) => void = useNavigate;
const navValue: () => NavContextValue = useNav;
const optionalNav: () => NavContextValue | null = useOptionalNav;
const packageName: string = PACKAGE_NAME;
void [navItems, navLogo, navPathname, navigate, navValue, optionalNav, packageName];

// @ts-expect-error useNav returns the context value, not the item list.
const wrongNav: () => NavItem[] = useNav;
void wrongNav;
