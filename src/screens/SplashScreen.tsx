import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import { STRINGS } from '../constants/strings';
import { initDatabase } from '../db/database';
import { useStore } from '../store/useStore';

export function SplashScreen({ onReady }: { onReady: () => void }) {
  const insets = useSafeAreaInsets();
  const setDbReady = useStore((s) => s.setDbReady);
  const hydratePrefs = useStore((s) => s.hydratePrefs);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await hydratePrefs();
      await initDatabase();
      if (!cancelled) setDbReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [setDbReady, hydratePrefs]);

  const isDbReady = useStore((s) => s.isDbReady);

  useEffect(() => {
    if (!isDbReady) return;
    const t = setTimeout(onReady, 1500);
    return () => clearTimeout(t);
  }, [isDbReady, onReady]);

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: Math.max(insets.left, SPACING.xl),
          paddingRight: Math.max(insets.right, SPACING.xl),
        },
      ]}
    >
      <View style={styles.logoWrap}>
        <Ionicons name="book-outline" size={32} color={COLORS.primary} />
      </View>
      <Text style={styles.appName}>{STRINGS.appName}</Text>
      <Text style={styles.tagline}>{STRINGS.tagline}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E2F3F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  appName: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  tagline: {
    fontSize: FONTS.body,
    color: COLORS.textSecondary,
  },
});
