import React from "react";
import { Badge, Card, Column, Heading, Text } from "@personal-library/react-native-components";

const topics = [
  { id: "layout", title: "Layout", note: "Box, Row, Column and Card." },
  { id: "forms", title: "Forms", note: "Input, Checkbox, Switch and RadioGroup." },
  { id: "feedback", title: "Feedback", note: "Alert, Spinner and ProgressBar." },
];

export function Explore() {
  return (
    <Column gap="md">
      <Heading level={1}>Explore</Heading>
      {topics.map((topic) => (
        <Card key={topic.id} padding="md">
          <Column gap="xs">
            <Badge>{topic.id}</Badge>
            <Text weight="bold">{topic.title}</Text>
            <Text>{topic.note}</Text>
          </Column>
        </Card>
      ))}
    </Column>
  );
}
