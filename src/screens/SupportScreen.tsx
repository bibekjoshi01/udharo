import React from "react";
import { View, Text, StyleSheet, ScrollView, Alert, Linking } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScreenHeader } from "../components/ScreenHeader";
import { AppPressable } from "../components/AppPressable";
import { COLORS, FONTS, SPACING, BORDER_RADIUS, MIN_TOUCH } from "../constants/theme";
import { STRINGS } from "../constants/strings";
import type { RootStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList, "Support">;

export function SupportScreen() {
  const navigation = useNavigation<Nav>();

  const openEmail = async () => {
    const mailUrl = `mailto:${STRINGS.supportEmail}?subject=${encodeURIComponent(
      STRINGS.appName
    )}&body=${encodeURIComponent("नमस्ते,")}`;
    const canOpen = await Linking.canOpenURL(mailUrl);
    if (!canOpen) {
      Alert.alert(STRINGS.support, STRINGS.supportEmail);
      return;
    }
    await Linking.openURL(mailUrl);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title={STRINGS.support} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.body}>{STRINGS.supportBody}</Text>
          <View style={styles.emailRow}>
            <Text style={styles.emailLabel}>Email</Text>
            <Text style={styles.emailValue}>{STRINGS.supportEmail}</Text>
          </View>
          <AppPressable style={styles.button} onPress={openEmail}>
            <Text style={styles.buttonText}>Email पठाउनुहोस्</Text>
          </AppPressable>
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
  emailRow: {
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  emailLabel: {
    fontSize: FONTS.small,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  emailValue: {
    fontSize: FONTS.body,
    color: COLORS.text,
    fontWeight: "600",
  },
  button: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    minHeight: MIN_TOUCH,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: FONTS.body,
    fontWeight: "700",
    color: COLORS.white,
  },
});
