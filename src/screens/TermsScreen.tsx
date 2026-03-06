import React from 'react';
import { View, Text, StyleSheet, ScrollView, Button, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenHeader } from '../components/ScreenHeader';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { useStrings } from '../constants/strings';
import type { RootStackParamList } from '../navigation/types';
import crashlytics from '@react-native-firebase/crashlytics';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Terms'>;

export function TermsScreen() {
  const navigation = useNavigation<Nav>();
  const STRINGS = useStrings();

  return (
    <View style={styles.container}>
      <ScreenHeader title={STRINGS.termsOfUse} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.body}>• {STRINGS.termsBody}</Text>
          <Text style={[styles.body, { marginTop: 20 }]}>• {STRINGS.privacyBody}</Text>
        </View>
      </ScrollView>
      <Button
        title="Trigger Test Crash"
        color="#EF4444" 
        onPress={() => {
          Alert.alert(
            'Crash Test',
            'This will crash the app and report to Firebase Crashlytics. Continue?',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Yes', onPress: () => crashlytics().crash() },
            ],
          );
        }}
      />
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
});
