import {
  Column,
  Link,
  NavProvider,
  Text,
  ThemeAppShell,
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
    <ThemeProvider>
      <ThemeAppShell>
        <NavProvider
          items={navItems}
          pathname="/docs"
          navigate={() => undefined}
        >
          <Column gap="md" style={{ padding: 16 }}>
            <Text>
              Stability: NavProvider, Link and NavBar are beta. TopBar is
              experimental and web-oriented.
            </Text>
            <TopBar title="Product" />
            <Link href="/support">Contact support</Link>
          </Column>
        </NavProvider>
      </ThemeAppShell>
    </ThemeProvider>
  );
}
