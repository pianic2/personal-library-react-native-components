import React from "react";
import {
  Modal as RNModal,
  Pressable,
} from "react-native";
import { useTheme } from "../../theme/useTheme";
import { Box } from "../Box";

interface ModalProps {
  visible: boolean;
  onClose: () => void;

  children: React.ReactNode;

  size?: "sm" | "md" | "lg";
  dismissOnBackdrop?: boolean;
}

export function Modal({
  visible,
  onClose,
  children,
  size = "md",
  dismissOnBackdrop = true,
}: ModalProps) {
  const { theme, colors } = useTheme();

  const widthMap = {
    sm: 360,
    md: 480,
    lg: 640,
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <Pressable
        onPress={dismissOnBackdrop ? onClose : undefined}
        style={{
          flex: 1,
          backgroundColor: colors.backdrop,
          alignItems: "center",
          justifyContent: "center",
          padding: theme.space.lg,
        }}
      >
        {/* Stop propagation */}
        <Pressable onPress={() => {}}>
          <Box
            bg="surface"
            radius="lg"
            padding="lg"
            style={{
              width: "100%",
              maxWidth: widthMap[size],
            }}
          >
            {children}
          </Box>
        </Pressable>
      </Pressable>
    </RNModal>
  );
}
