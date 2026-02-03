import React from "react";
import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, MIN_TOUCH } from "../../../constants/theme";
import { AppPressable } from "../../../components/AppPressable";

const ICON_SIZE = 24;

export interface HomeFooterProps {
  paddingBottom: number;
  onCustomers: () => void;
  onAddCredit: () => void;
  onBhuktani: () => void;
}

export function HomeFooter({
  paddingBottom,
  onCustomers,
  onAddCredit,
  onBhuktani,
}: HomeFooterProps) {
  return (
    <View style={[styles.footer, { paddingBottom }]}>
      <AppPressable style={styles.footerBtn} onPress={onCustomers}>
        <Ionicons name="people-outline" size={ICON_SIZE} color={COLORS.text} />
      </AppPressable>
      <AppPressable style={styles.fab} onPress={onAddCredit}>
        <Ionicons name="add" size={32} color={COLORS.white} />
      </AppPressable>
      <AppPressable style={styles.footerBtn} onPress={onBhuktani}>
        <Ionicons name="wallet-outline" size={ICON_SIZE} color={COLORS.text} />
      </AppPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerBtn: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: MIN_TOUCH / 2,
    backgroundColor: "#F1F5F9",
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: COLORS.surface,
  },
});
