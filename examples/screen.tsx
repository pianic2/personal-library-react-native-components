import { Button, Column, Screen, Text, ThemeProvider } from "@personal-library/react-native-components";

export function ScreenExample() {
  return (
    <ThemeProvider>
    <Screen
      scroll
      padding="md"
      keyboardAvoiding
      header={<Text>Settings</Text>}
      footer={<Button label="Save" onPress={() => undefined} />}
    >
      <Column gap="md">
        <Text>Body content scrolls; the footer stays above the keyboard.</Text>
      </Column>
    </Screen>
    </ThemeProvider>
  );
}
