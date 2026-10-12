import React, { useCallback, useState } from "react";
import { ScrollView, View } from "react-native";
import { BottomBar, NavProvider, ThemeAppShell, ThemeProvider, Text, TopBar, useTheme } from "@personal-library/react-native-components";
import { resolveRoute, tabs } from "./navigation";
import { Explore } from "./screens/Explore";
import { Home } from "./screens/Home";
import { Profile } from "./screens/Profile";

const screens: Record<string, () => React.JSX.Element> = {
  "/": Home,
  "/explore": Explore,
  "/profile": Profile,
};

function Layout() {
  const { theme } = useTheme();
  const [pathname, setPathname] = useState("/");
  const navigate = useCallback((href: string) => setPathname(resolveRoute(href)), []);
  const Screen = screens[pathname] ?? Home;

  return (
    <NavProvider items={tabs} pathname={pathname} navigate={navigate} logo={<Text weight="bold">Tabs</Text>}>
      <View style={{ flex: 1 }}>
        <TopBar position="static" />
        <ScrollView contentContainerStyle={{ padding: theme.space.lg }}>
          <Screen />
        </ScrollView>
        <BottomBar position="static" />
      </View>
    </NavProvider>
  );
}

export default function App() {
  // "system" follows the device (or browser) colour scheme; the Profile tab switches it explicitly.
  return (
    <ThemeProvider preference="system">
      <ThemeAppShell>
        <Layout />
      </ThemeAppShell>
    </ThemeProvider>
  );
}
