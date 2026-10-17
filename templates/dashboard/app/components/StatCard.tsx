import React from "react";
import { Badge, Card, Column, Row, Text } from "@personal-library/react-native-components";
import type { Stat, Trend } from "../data";

const trendVariant: Record<Trend, "success" | "danger" | "info"> = {
  up: "success",
  down: "danger",
  flat: "info",
};

export function StatCard({ stat }: { stat: Stat }) {
  return (
    <Card padding="md" style={{ flexGrow: 1, flexBasis: 150 }}>
      <Column gap="xs" flex={0}>
        <Text>{stat.label}</Text>
        <Row gap="sm">
          <Text weight="bold">{stat.value}</Text>
          <Badge size="sm" variant={trendVariant[stat.trend]}>
            {stat.change}
          </Badge>
        </Row>
      </Column>
    </Card>
  );
}
