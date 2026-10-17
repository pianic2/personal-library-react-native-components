import React, { useState } from "react";
import { ScrollView } from "react-native";
import {
  Card,
  Column,
  Divider,
  Heading,
  Switch,
  Text,
  ThemeAppShell,
  ThemeProvider,
  useTheme,
} from "@personal-library/react-native-components";
import { isDarkPreference, preferenceForSwitch } from "./preference";

const notificationRows = [
  { id: "push", label: "Push notifications", note: "Alerts on this device.", initial: true },
  { id: "email", label: "Email digest", note: "A weekly summary by email.", initial: false },
  { id: "sound", label: "Sounds", note: "Play a sound for new alerts.", initial: true },
];

function ThemeRow() {
  const { preference, setPreference } = useTheme();
  return (
    <Column gap="xs" flex={0} align="stretch">
      <Switch
        label="Dark mode"
        value={isDarkPreference(preference)}
        onChange={(on) => setPreference(preferenceForSwitch(on))}
      />
      <Text>Switches the ThemeProvider preference between light and dark.</Text>
    </Column>
  );
}

function NotificationRows() {
  const [values, setValues] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(notificationRows.map((row) => [row.id, row.initial])),
  );
  return (
    <>
      {notificationRows.map((row, index) => (
        <React.Fragment key={row.id}>
          {index > 0 ? <Divider /> : null}
          <Column gap="xs" flex={0} align="stretch">
            <Switch
              label={row.label}
              value={values[row.id] ?? false}
              onChange={(on) => setValues((current) => ({ ...current, [row.id]: on }))}
            />
            <Text>{row.note}</Text>
          </Column>
        </React.Fragment>
      ))}
    </>
  );
}

function Settings() {
  const { theme } = useTheme();
  return (
    <ScrollView contentContainerStyle={{ padding: theme.space.lg }}>
      <Column gap="md" flex={0} align="stretch">
        <Heading level={1}>Settings</Heading>
        <Card padding="md">
          <Column gap="sm" flex={0} align="stretch">
            <Heading level={2}>Appearance</Heading>
            <ThemeRow />
          </Column>
        </Card>
        <Card padding="md">
          <Column gap="sm" flex={0} align="stretch">
            <Heading level={2}>Notifications</Heading>
            <NotificationRows />
          </Column>
        </Card>
      </Column>
    </ScrollView>
  );
}

export default function App() {
  return (
    <ThemeProvider preference="light">
      <ThemeAppShell>
        <Settings />
      </ThemeAppShell>
    </ThemeProvider>
  );
}
