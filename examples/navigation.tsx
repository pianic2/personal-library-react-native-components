import {
  Column,
  Link,
  NavBar,
  NavProvider,
  Text,
  ThemeAppShell,
  ThemeProvider,
  type NavItem,
} from "@personal-library/react-native-components";

const navItems: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Docs", href: "/docs" },
  { label: "Support", href: "/support" },
];

export function NavigationExample() {
  const navigate = (_href: string) => undefined;

  return (
    <ThemeProvider>
      <ThemeAppShell>
        <NavProvider
          items={navItems}
          pathname="/docs"
          navigate={navigate}
        >
          <Column gap="md" style={{ padding: 16 }}>
            <Text>
              Stability: NavProvider, Link and NavBar are beta public
              candidates. This consumer example avoids repo-local demo imports.
            </Text>
            <NavBar
              items={navItems}
              pathname="/docs"
              navigate={navigate}
              layout="top"
            />
            <Link href="/support">Contact support</Link>
          </Column>
        </NavProvider>
      </ThemeAppShell>
    </ThemeProvider>
  );
}
