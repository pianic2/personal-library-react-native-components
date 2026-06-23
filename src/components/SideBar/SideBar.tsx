// ui/components/navigation/SideBar.tsx

import React from "react";
import { ScrollView, View } from "react-native";
import { useTheme } from "../../theme/useTheme";
import { Link } from "../Link";
import { Text } from "../Text";
import { useOptionalNav } from "../NavContext";

export type SideBarVariant = "fixed" | "embedded";

export interface SideBarProps {
  width?: number;
  variant?: SideBarVariant;
}

export function SideBar({ width = 280, variant = "embedded" }: SideBarProps = {}) {
  const { colors, theme } = useTheme();
  const nav = useOptionalNav();
  const items = nav?.items ?? [];
  const pathname = nav?.pathname;

  return (
    <View
      style={{
        width,
        alignSelf: variant === "fixed" ? "stretch" : undefined,
        backgroundColor: colors.surface,
        borderRightWidth: 1,
        borderRightColor: colors.border,
        paddingTop: theme.space.md,
      }}
    >
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
                {it.icon ? (
                  <View style={{ marginRight: theme.space.sm }}>{it.icon}</View>
                ) : null}
                <Text
                  weight={active ? "bold" : "regular"}
                  style={{ color: active ? colors.primary : colors.textPrimary }}
                >
                  {it.label}
                </Text>
              </View>
            </Link>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default SideBar;
