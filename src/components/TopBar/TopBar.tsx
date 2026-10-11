// ui/components/navigation/TopBar.tsx

import React from "react";
import { useTheme } from "../../theme/useTheme.js";
import { Row } from "../Row/index.js";
import { Box } from "../Box/index.js";
import { Text } from "../Text/index.js";
import { Link } from "../Link/index.js";
import { useOptionalNav } from "../NavContext/index.js";

/** Safe-area insets in density-independent pixels; the app reads them from its safe-area provider and passes them in. */
export interface BarInsets {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

export interface TopBarProps {
  title?: string;

  /** `"absolute"` (default) pins the bar to the top of its container; `"static"` lays it out in the normal flow. */
  position?: "absolute" | "static";
  /** Safe-area insets added to the bar's padding. */
  insets?: BarInsets;

  leftSlot?: React.ReactNode;
  centerSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
}

export function TopBar({ title, position = "absolute", insets, leftSlot, centerSlot, rightSlot }: TopBarProps) {
  const { colors, theme } = useTheme();
  const nav = useOptionalNav();
  const logo = nav?.logo;
  const items = nav?.items ?? [];
  const pathname = nav?.pathname;

  return (
    <Box
      role="navigation"
      bg="surface"
      style={{
        ...(position === "absolute" ? { position: "absolute" as const, top: 0 } : null),
        borderBottomWidth: 1,
        width: "100%",
        borderBottomColor: colors.border,
        paddingLeft: theme.space.lg + (insets?.left ?? 0),
        paddingRight: theme.space.lg + (insets?.right ?? 0),
        paddingTop: theme.space.lg + (insets?.top ?? 0),
        paddingBottom: theme.space.lg + (insets?.bottom ?? 0),
      }}
    >
      <Row justify="space-between" align="center" wrap={false} style={{ height: theme.size.height.md }}>
        <Row gap="md" style={{ minWidth: 0, flex: 1 }}>
          {logo}
          {title ? <Text weight="bold" size="sm" accessibilityRole="header">{title}</Text> : null}
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
                  selected={active}
                  activeStyle={{ fontWeight: theme.typography.fontWeight.bold, color: colors.primary }}
                  style={{ flex: 1, alignSelf: "center", color: active ? colors.primary : colors.textSecondary, minWidth: theme.size.height.lg * 2, textAlign: "center", fontSize: theme.typography.fontSize.lg }}
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
