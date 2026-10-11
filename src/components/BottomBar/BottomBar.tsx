// ui/components/navigation/BottomBar.tsx

import React from "react";

import { useTheme } from "../../theme/useTheme.js";
import { Box } from "../Box/index.js";
import { Column } from "../Column/index.js";
import { Row } from "../Row/index.js";
import { Text } from "../Text/index.js";
import { Link } from "../Link/index.js";
import { useOptionalNav } from "../NavContext/index.js";
import type { BarInsets } from "../TopBar/TopBar.js";

export interface BottomBarProps {
  maxItems?: number;
  /** `"absolute"` (default) pins the bar to the bottom of its container; `"static"` lays it out in the normal flow. */
  position?: "absolute" | "static";
  /** Safe-area insets added to the bar's padding and height. */
  insets?: BarInsets;
}

export function BottomBar({ maxItems = 5, position = "absolute", insets }: BottomBarProps) {
  const { colors, theme } = useTheme();

  const nav = useOptionalNav();
  const items = nav?.items ?? [];
  const pathname = nav?.pathname;
  const itemMinWidth = theme.size.height.lg + theme.space.md + theme.space.xs;
  const visibleLimit = Math.max(0, Math.floor(maxItems));
  const visibleItems = items.slice(0, visibleLimit);

  return (
    <Box
      role="navigation"
      style={{
        ...(position === "absolute" ? { position: "absolute" as const, left: 0, right: 0, bottom: 0 } : null),

        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.surface,

        paddingTop: theme.space.xs,
        paddingBottom: theme.space.xs + (insets?.bottom ?? 0),
        paddingLeft: insets?.left ?? 0,
        paddingRight: insets?.right ?? 0,

        zIndex: theme.zIndex.sticky,
        height: theme.size.height.lg + theme.space.md + (insets?.bottom ?? 0),
      }}
    >
      <Row justify="space-around" align="center" accessibilityRole="tablist" style={{ flex: 1 }}>
        {visibleItems.map((it) => {
          const active = pathname === it.href;
          const IconNode = active ? it.activeIcon ?? it.icon : it.icon;

          return (
            <Link
              key={it.href}
              href={it.href}
              underline={false}
              accessibilityRole="tab"
              selected={active}
              containerStyle={{
                alignItems: "center",
                justifyContent: "center",
                minWidth: itemMinWidth,
                paddingVertical: theme.space.xs,
              }}
            >
              <Column
                gap="xs"
                align="center"
                justify="center"
                flex={0}
                style={{ minWidth: itemMinWidth }}
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
