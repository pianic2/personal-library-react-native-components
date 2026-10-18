import { Banner, Column, ThemeAppShell, ThemeProvider } from "@personal-library/react-native-components";

export function BannerExample() {
  return (
    <ThemeProvider>
      <ThemeAppShell>
        <Column gap="md">
          <Banner tone="warning" title="You are offline" message="Changes will sync when you reconnect." />
          <Banner tone="info" message="A new version is available" actionLabel="Update" onAction={() => undefined} onDismiss={() => undefined} dismissKey="update-banner" />
        </Column>
      </ThemeAppShell>
    </ThemeProvider>
  );
}
