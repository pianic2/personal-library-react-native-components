import {
  Column,
  Link,
  NavProvider,
  Text,
  ThemeProvider,
  TopBar,
  type NavItem,
} from "@personal-library/react-native-components";

const navItems: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Docs", href: "/docs" },
  { label: "Support", href: "/support" },
];

export function NavigationExample() {
  return (
    <ThemeProvider withScroll={false}>
      <NavProvider
        items={navItems}
        pathname="/docs"
        navigate={() => undefined}
      >
        <Column gap="md" style={{ padding: 16 }}>
          <TopBar title="Product" />
          <Link href="/support">Contact support</Link>
        </Column>
      </NavProvider>
    </ThemeProvider>
  );
}
