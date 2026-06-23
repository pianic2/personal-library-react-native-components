import React from "react";
import {
  Linking,
  Platform,
  Pressable,
  type StyleProp,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
} from "react-native";
import { useTheme } from "../../theme/useTheme";
import { useOptionalNav } from "../NavContext";

type LinkVariant = "text" | "button";
type LinkSize = "sm" | "md" | "lg";

export type LinkRouterAdapter = {
  navigate: (href: string) => void;
};

export interface LinkProps {
  href: string;
  children: React.ReactNode;

  variant?: LinkVariant;
  size?: LinkSize;
  underline?: boolean;

  containerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<TextStyle>;

  activeStyle?: StyleProp<TextStyle>;
  activeContainerStyle?: StyleProp<ViewStyle>;
  exact?: boolean;

  onPress?: () => void;
  routerAdapter?: LinkRouterAdapter;
}

export const Link: React.FC<LinkProps> = ({
  href,
  children,
  variant = "text",
  size = "md",
  underline = false,
  containerStyle,
  style,
  activeStyle,
  activeContainerStyle,
  exact = true,
  onPress,
  routerAdapter,
}: LinkProps) => {
  const { theme, colors } = useTheme();
  const nav = useOptionalNav();

  const childArray = React.Children.toArray(children);
  const isTextOnly =
    childArray.length > 0 &&
    childArray.every((c) => typeof c === "string" || typeof c === "number");

  const pathname = nav?.pathname;
  const isActive = pathname
    ? exact
      ? pathname === href
      : pathname.startsWith(href)
    : false;

  const heightMap = { sm: 32, md: 40, lg: 48 };
  const paddingXMap = {
    sm: theme.space.sm,
    md: theme.space.md,
    lg: theme.space.lg,
  };

  function doNavigate() {
    if (routerAdapter) return routerAdapter.navigate(href);

    if (nav?.navigate) return nav.navigate(href);

    if (/^https?:\/\//i.test(href)) {
      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.open(href, "_blank", "noopener,noreferrer");
        return;
      }
      void Linking.openURL(href);
      return;
    }

    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.location.assign(href);
      return;
    }

    if (__DEV__) {
      console.warn(
        `[ui/Link] No navigation handler is available for "${href}".`
      );
    }
  }

  return (
    <Pressable
      onPress={() => {
        onPress?.();
        doNavigate();
      }}
      style={({ pressed }) => [
        variant === "button" && {
          minHeight: heightMap[size],
          paddingHorizontal: paddingXMap[size],
          borderRadius: theme.radius.md,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.primary,
          opacity: pressed ? 0.85 : 1,
        },
        variant === "text" && pressed && { opacity: 0.7 },
        containerStyle,
        isActive && activeContainerStyle,
      ]}
    >
      {isTextOnly ? (
        <Text
          style={[
            variant === "button"
              ? {
                  color: colors.textInverted,
                  fontSize: theme.typography.fontSize[size],
                  fontWeight: "600",
                }
              : {
                  color: colors.primary,
                  textDecorationLine: underline ? "underline" : "none",
                },
            style,
            isActive && activeStyle,
          ]}
        >
          {children}
        </Text>
      ) : (
        <View style={{ alignItems: "stretch", justifyContent: "center" }}>
          {children}
        </View>
      )}
    </Pressable>
  );
};
