// ui/components/navigation/BottomBar.tsx

import React from "react";

import { useTheme } from "../../theme/useTheme";
import { Box } from "../Box";
import { Column } from "../Column";
import { Row } from "../Row";
import { Text } from "../Text";
import { Link } from "../Link";
import { useOptionalNav } from "../NavContext";

export interface BottomBarProps {
  maxItems?: number;
}

export function BottomBar({ maxItems = 5 }: BottomBarProps) {
  const { colors, theme } = useTheme();

  const nav = useOptionalNav();
  const items = nav?.items ?? [];
  const pathname = nav?.pathname;
  const visibleLimit = Math.max(0, Math.floor(maxItems));
  const visibleItems = items.slice(0, visibleLimit);

  return (
    <Box
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,

        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.surface,

        paddingTop: theme.space.xs,
        paddingBottom: theme.space.xs,

        zIndex: theme.zIndex.sticky,
        height: 60,
      }}
    >
      <Row justify="space-around" align="center" style={{ flex: 1 }}>
        {visibleItems.map((it) => {
          const active = pathname === it.href;
          const IconNode = active ? it.activeIcon ?? it.icon : it.icon;

          return (
            <Link
              key={it.href}
              href={it.href}
              underline={false}
              containerStyle={{
                alignItems: "center",
                justifyContent: "center",
                minWidth: 64,
                paddingVertical: theme.space.xs,
              }}
            >
              <Column
                gap="xs"
                align="center"
                justify="center"
                flex={0}
                style={{ minWidth: 64 }}
              >
                {IconNode}

                <Text
                  size="sm"
                  weight={active ? "bold" : "medium"}
                  variant={active ? "default" : "muted"}
                  style={{ marginTop: 4 }}
                >
                  {it.label}
                </Text>
              </Column>
            </Link>
          );
        })}
      </Row>
    </Box>
  );
}
