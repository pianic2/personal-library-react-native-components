import { Column, Text, ThemeAppShell, ThemeProvider, Touchable } from "@personal-library/react-native-components";

export function TouchableExample() {
  return (
    <ThemeProvider>
      <ThemeAppShell>
        <Column gap="md" style={{ padding: 16 }}>
          <Touchable onPress={() => undefined}>
            <Text>Default opacity feedback</Text>
          </Touchable>
          <Touchable feedback="scale" haptic="light" onPress={() => undefined}>
            <Text>Scale with a light haptic</Text>
          </Touchable>
          <Touchable loading accessibilityLabel="Saving" onPress={() => undefined}>
            <Text>Loading blocks presses</Text>
          </Touchable>
        </Column>
      </ThemeAppShell>
    </ThemeProvider>
  );
}
