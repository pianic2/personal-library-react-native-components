// ui/components/navigation/TopBar.tsx

import React from "react";
import { useTheme } from "../../theme/useTheme";
import { Row } from "../Row";
import { Box } from "../Box";
import { Text } from "../Text";
import { Link } from "../Link";
import { useOptionalNav } from "../NavContext";

export interface TopBarProps {
  title?: string;

  leftSlot?: React.ReactNode;
  centerSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
}

export function TopBar({ title, leftSlot, centerSlot, rightSlot }: TopBarProps) {
  const { colors, theme } = useTheme();
  const nav = useOptionalNav();
  const logo = nav?.logo;
  const items = nav?.items ?? [];
  const pathname = nav?.pathname;

  return (
    <Box
      bg="surface"
      style={{
        position: "absolute",
        top: 0,
        borderBottomWidth: 1,
        width: "100%",
        borderBottomColor: colors.border,
        paddingHorizontal: theme.space.lg,
        paddingVertical: theme.space.lg,
      }}
    >
      <Row justify="space-between" align="center" wrap={false} style={{ height: 40 }}>
        <Row gap="md" style={{ minWidth: 0, flex: 1 }}>
          {logo}
          {title ? <Text weight="bold" size="sm">{title}</Text> : null}
          {leftSlot}
        </Row>

        <Box style={{ flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "center" }}>
          {centerSlot ? (
            centerSlot
          ) : (
            items.map((it) => {
              const active = pathname === it.href;
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  underline={false}
                  activeStyle={{ fontWeight: theme.typography.fontWeight.bold, color: colors.primary }}
                  style={{ flex: 1, alignSelf: "center", color: active ? colors.primary : colors.textSecondary, width: 90, textAlign: "center", fontSize: theme.typography.fontSize.lg }}
                >
                  {it.label}
                </Link>
              );
            })
          )}
        </Box>

        <Row align="center" gap="sm" style={{ justifyContent: "flex-end", flex: 1 }}>
          {rightSlot}
        </Row>
      </Row>
    </Box>
  );
}
