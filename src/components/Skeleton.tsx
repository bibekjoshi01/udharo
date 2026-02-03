import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';
import { COLORS } from '../constants/theme';

export interface SkeletonProps {
  height?: number;
  width?: number | `${number}%` | 'auto';
  radius?: number;
  style?: ViewStyle;
}

export function Skeleton({ height = 12, width = '100%', radius = 8, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.base, { height, width, borderRadius: radius, opacity }, style]} />
  );
}

export function SkeletonBlock({ lines = 3 }: { lines?: number }) {
  return (
    <View style={styles.block}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={12}
          width={i === lines - 1 ? '70%' : '100%'}
          style={styles.line}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: COLORS.border,
  },
  block: {
    width: '100%',
  },
  line: {
    marginBottom: 8,
  },
});
