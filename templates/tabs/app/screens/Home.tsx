import React from "react";
import { Button, Card, Column, Heading, Text, useNavigate } from "@personal-library/react-native-components";

export function Home() {
  const navigate = useNavigate();
  return (
    <Column gap="md">
      <Heading level={1}>Home</Heading>
      <Card padding="md">
        <Column gap="sm">
          <Text>A starter with three tabs, a top bar, a bottom tab bar and a light/dark theme.</Text>
          <Button label="Go to Explore" onPress={() => navigate("/explore")} />
        </Column>
      </Card>
    </Column>
  );
}
