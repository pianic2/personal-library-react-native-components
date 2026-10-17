import React from "react";
import { Badge, Card, Column, Divider, Heading, Row, Text } from "@personal-library/react-native-components";
import type { ActivityItem } from "../data";

const statusVariant: Record<ActivityItem["status"], "success" | "warning" | "danger"> = {
  done: "success",
  pending: "warning",
  failed: "danger",
};

export function ActivityList({ items }: { items: ActivityItem[] }) {
  return (
    <Card padding="md">
      <Column gap="sm" flex={0} align="stretch">
        <Heading level={2}>Recent activity</Heading>
        {items.map((item, index) => (
          <React.Fragment key={item.id}>
            {index > 0 ? <Divider /> : null}
            <Row justify="space-between">
              <Column gap="xs" flex={0}>
                <Text weight="bold">{item.title}</Text>
                <Text>{item.detail}</Text>
              </Column>
              <Badge size="sm" variant={statusVariant[item.status]}>
                {item.status}
              </Badge>
            </Row>
          </React.Fragment>
        ))}
      </Column>
    </Card>
  );
}
