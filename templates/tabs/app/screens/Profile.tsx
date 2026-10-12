import React from "react";
import { Card, Column, Heading, Switch, Text, useTheme } from "@personal-library/react-native-components";

export function Profile() {
  const { mode, setMode } = useTheme();
  return (
    <Column gap="md">
      <Heading level={1}>Profile</Heading>
      <Card padding="md">
        <Column gap="sm">
          <Text>Appearance: {mode}</Text>
          <Switch label="Dark mode" value={mode === "dark"} onChange={(on) => setMode(on ? "dark" : "light")} />
        </Column>
      </Card>
    </Column>
  );
}
