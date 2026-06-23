// ui/components/navigation/SideBar.web.tsx

import React, { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useTheme } from "../../theme/useTheme";
import { Text } from "../Text";
import { Link } from "../Link";
import { useOptionalNav } from "../NavContext";

export type SideBarVariant = "fixed" | "embedded";

export interface SideBarProps {
  width?: number;
  variant?: SideBarVariant;
}

export function SideBar({ width = 280, variant = "fixed" }: SideBarProps) {
  const { colors, theme } = useTheme();
  const nav = useOptionalNav();
  const items = nav?.items ?? [];
  const pathname = nav?.pathname;
  const [collapsed, setCollapsed] = useState(false);

  const finalWidth = collapsed ? 72 : width;
  const containerStyle =
    variant === "fixed"
      ? ({
          width: finalWidth,
          backgroundColor: colors.surface,
          borderRightWidth: 1,
          borderRightColor: colors.border,
          paddingTop: theme.space.md,
          position: "fixed",
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: theme.zIndex.sticky,
        } as any)
      : {
          width: finalWidth,
          backgroundColor: colors.surface,
          borderRightWidth: 1,
          borderRightColor: colors.border,
          paddingTop: theme.space.md,
          position: "relative" as const,
          alignSelf: "stretch" as const,
          zIndex: theme.zIndex.base,
        };

  return (
    <View style={containerStyle}>
      <Pressable
        onPress={() => setCollapsed((v) => !v)}
        style={({ pressed }) => ({
          alignSelf: "flex-end",
          padding: theme.space.sm,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text variant="muted" align="center">
          {collapsed ? ">" : "<"}
        </Text>
      </Pressable>

      <ScrollView contentContainerStyle={{ padding: theme.space.sm }}>
        {items.map((it) => {
          const active = pathname === it.href;

          return (
            <Link
              key={it.href}
              href={it.href}
              underline={false}
              containerStyle={{
                paddingVertical: theme.space.sm,
                paddingHorizontal: theme.space.sm,
                borderRadius: theme.radius.md,
                backgroundColor: active ? colors.disabledBg : "transparent",
                marginBottom: theme.space.xs,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                {it.icon ? <View style={{ marginRight: collapsed ? 0 : theme.space.sm }}>{it.icon}</View> : null}
                {!collapsed ? (
                  <Text
                    weight={active ? "bold" : "regular"}
                    style={{ color: active ? colors.primary : colors.textPrimary }}
                  >
                    {it.label}
                  </Text>
                ) : null}
              </View>
            </Link>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default SideBar;
