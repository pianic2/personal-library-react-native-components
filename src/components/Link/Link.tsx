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
import { useTheme } from "../../theme/useTheme.js";
import { useOptionalNav } from "../NavContext/index.js";

type LinkVariant = "text" | "button";
type LinkSize = "sm" | "md" | "lg";

// Typed constants instead of inline numbers: the control heights and the opacity of the pressed and disabled states.
const HEIGHT: Record<LinkSize, number> = { sm: 32, md: 40, lg: 48 };
const ALPHA = { rest: 1, pressedButton: 0.85, pressedText: 0.7, disabled: 0.5 } as const;

/** The parts of a web click event that Link reads (a press from a screen reader or on native has none). */
type WebClick = { preventDefault?: () => void; ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean; button?: number };

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

  /** Blocks `onPress` and navigation, dims the link and reports it as disabled to assistive technology. */
  disabled?: boolean;
  /** Accessibility label. When omitted the platform reads the text of the children. */
  accessibilityLabel?: string;
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
  disabled = false,
  accessibilityLabel,
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
      accessibilityRole="link"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      {...(Platform.OS === "web" && !disabled ? { href, hrefAttrs: /^https?:\/\//i.test(href) ? { target: "_blank", rel: "noopener noreferrer" } : undefined } : {})}
      onPress={(event?: WebClick) => {
        if (disabled) return;
        if (Platform.OS === "web" && event) {
          // A modified click (new tab, new window, download) belongs to the browser: the anchor handles it.
          if (event.ctrlKey || event.metaKey || event.shiftKey || (event.button !== undefined && event.button !== 0)) {
            onPress?.();
            return;
          }
          // A plain click: the Link navigates through its handler, so the anchor must not.
          event.preventDefault?.();
        }
        onPress?.();
        doNavigate();
      }}
      style={({ pressed }) => [
        variant === "button" && {
          minHeight: HEIGHT[size],
          paddingHorizontal: paddingXMap[size],
          borderRadius: theme.radius.md,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.primary,
          opacity: disabled ? ALPHA.disabled : pressed ? ALPHA.pressedButton : ALPHA.rest,
        },
        variant === "text" && (disabled ? { opacity: ALPHA.disabled } : pressed && { opacity: ALPHA.pressedText }),
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
