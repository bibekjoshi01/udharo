import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScreenHeader } from "../components/ScreenHeader";
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from "../constants/theme";
import { STRINGS } from "../constants/strings";
import type { RootStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList, "AboutApp">;

export function AboutAppScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <View style={styles.container}>
      <ScreenHeader title={STRINGS.aboutApp} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.body}>{STRINGS.aboutBody}</Text>
          <Text style={styles.developer}>Developer: Bibek Joshi</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: SPACING.xl },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  },
  body: {
    fontSize: FONTS.body,
    color: COLORS.text,
    lineHeight: 22,
  },
  developer: {
    marginTop: SPACING.md,
    fontSize: FONTS.small,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
});
