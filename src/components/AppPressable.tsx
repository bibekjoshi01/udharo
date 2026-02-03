import React from 'react';
import { Pressable, type PressableProps, Platform, type ViewStyle } from 'react-native';

export interface AppPressableProps extends PressableProps {
  rippleColor?: string;
  rippleBorderless?: boolean;
  disableRipple?: boolean;
}

export function AppPressable({
  rippleColor = '#E2E8F0',
  rippleBorderless = false,
  disableRipple = false,
  style,
  ...props
}: AppPressableProps) {
  const androidRipple =
    Platform.OS === 'android' && !disableRipple
      ? { color: rippleColor, borderless: rippleBorderless }
      : undefined;

  return <Pressable android_ripple={androidRipple} style={style as ViewStyle} {...props} />;
}
