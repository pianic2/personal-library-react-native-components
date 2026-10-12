import type { NavItem } from "@personal-library/react-native-components";

/** The tabs: `href` is the route, `label` is shown in the top bar and the bottom bar. */
export const tabs: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Explore", href: "/explore" },
  { label: "Profile", href: "/profile" },
];

/** Unknown routes fall back to the first tab. */
export function resolveRoute(href: string): string {
  return tabs.some((tab) => tab.href === href) ? href : tabs[0]!.href;
}
