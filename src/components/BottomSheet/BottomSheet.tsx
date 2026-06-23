// ui/components/overlay/BottomSheet.tsx

import React, { useMemo } from "react";
import {
  Modal as RNModal,
  Pressable,
  View,
} from "react-native";
import { useTheme } from "../../theme/useTheme";
import { Box } from "../Box";

type Snap = "collapsed" | "expanded";

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;

  snap?: Snap; // basic snap
  header?: React.ReactNode;
  children: React.ReactNode;
}

export function BottomSheet({
  visible,
  onClose,
  snap = "expanded",
  header,
  children,
}: BottomSheetProps) {
  const { theme, colors } = useTheme();

  const sheetHeight = useMemo(() => {
    // Basic snap heights (percentuali)
    return snap === "collapsed" ? "35%" : "70%";
  }, [snap]);

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: colors.backdrop,
          justifyContent: "flex-end",
        }}
        onPress={onClose}
      >
        <Pressable onPress={() => {}} style={{ width: "100%" }}>
          <View
            style={{
              height: sheetHeight as any,
            }}
          >
            <Box
              bg="surface"
              radius="lg"
              shadow="lg"
              padding="md"
              style={{
                height: "100%",
                borderTopLeftRadius: theme.radius.xl,
                borderTopRightRadius: theme.radius.xl,
              }}
            >
              {/* Handle */}
              <View
                style={{
                  alignSelf: "center",
                  width: 48,
                  height: 5,
                  borderRadius: 5,
                  backgroundColor: colors.divider,
                  marginBottom: theme.space.md,
                }}
              />

              {header ? (
                <View style={{ marginBottom: theme.space.sm }}>
                  {header}
                </View>
              ) : null}

              {children}
            </Box>
          </View>
        </Pressable>
      </Pressable>
    </RNModal>
  );
}
