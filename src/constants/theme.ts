import { Platform } from 'react-native';

export const COLORS = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  primary: '#0F766E',
  primaryLight: '#14B8A6',
  text: '#1E293B',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  debt: '#B91C1C',
  debtLight: '#FEE2E2',
  paid: '#15803D',
  paidLight: '#DCFCE7',
  white: '#FFFFFF',
  black: '#000000',
} as const;

export const FONTS = {
  // Large numbers for balance/amounts (24–32pt)
  balance: Platform.OS === 'android' ? 28 : 28,
  amount: 22,
  title: 20,
  body: 16,
  caption: 14,
  small: 12,
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
} as const;

// Min touch target 44pt
export const MIN_TOUCH = 44;
