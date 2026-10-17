import React from "react";
import { ScrollView } from "react-native";
import {
  Card,
  Column,
  Heading,
  ProgressBar,
  Row,
  Text,
  ThemeAppShell,
  ThemeProvider,
  useTheme,
} from "@personal-library/react-native-components";
import { ActivityList } from "./components/ActivityList";
import { StatCard } from "./components/StatCard";
import { activity, goals, stats } from "./data";

function Dashboard() {
  const { theme } = useTheme();
  return (
    <ScrollView contentContainerStyle={{ padding: theme.space.lg }}>
      <Column gap="md" flex={0} align="stretch">
        <Heading level={1}>Dashboard</Heading>
        <Row gap="md" wrap align="stretch">
          {stats.map((stat) => (
            <StatCard key={stat.id} stat={stat} />
          ))}
        </Row>
        <Card padding="md">
          <Column gap="sm" flex={0} align="stretch">
            <Heading level={2}>Goals</Heading>
            {goals.map((goal) => (
              <Column key={goal.id} gap="xs" flex={0} align="stretch">
                <Text>
                  {goal.label} · {goal.progress}%
                </Text>
                <ProgressBar progress={goal.progress} accessibilityLabel={`${goal.label}: ${goal.progress}%`} />
              </Column>
            ))}
          </Column>
        </Card>
        <ActivityList items={activity} />
      </Column>
    </ScrollView>
  );
}

export default function App() {
  // "system" follows the device (or browser) colour scheme.
  return (
    <ThemeProvider preference="system">
      <ThemeAppShell>
        <Dashboard />
      </ThemeAppShell>
    </ThemeProvider>
  );
}
