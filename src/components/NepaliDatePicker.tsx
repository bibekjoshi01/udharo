import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { CalendarPicker, BsToAd, AdToBs } from 'react-native-nepali-picker';
import { AppPressable } from './AppPressable';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, MIN_TOUCH } from '../constants/theme';
import { getNepaliRange } from '../utils/date';

type Props = {
  label: string;
  value?: string;
  onChange: (adDate?: string) => void;
  placeholder?: string;
};

export function NepaliDatePicker({ label, value, onChange, placeholder }: Props) {
  const [open, setOpen] = React.useState(false);
  const displayValue = React.useMemo(() => {
    if (!value) return '';
    const bs = AdToBs(value);
    return bs ?? '';
  }, [value]);

  const handleSelect = (bsDate: string) => {
    const ad = BsToAd(bsDate);
    if (!ad) {
      Alert.alert('मिति मिलेन', 'भुक्तानी मिति मिलेन। कृपया फेरि प्रयास गर्नुहोस्।');
      return;
    }
    const todayAd = getNepaliRange('today').startAD;
    if (ad < todayAd) {
      Alert.alert('मिति अमान्य', 'भुक्तानी मिति आज वा आजपछि मात्र हुन सक्छ।');
      return;
    }
    onChange(ad);
    setOpen(false);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <AppPressable style={styles.field} onPress={() => setOpen(true)}>
        <Text style={[styles.fieldText, !displayValue && styles.placeholder]}>
          {displayValue || placeholder || 'YYYY-MM-DD'}
        </Text>
      </AppPressable>
      <CalendarPicker
        visible={open}
        title=""
        onClose={() => setOpen(false)}
        onDateSelect={handleSelect}
        language="np"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: SPACING.md },
  label: {
    fontSize: FONTS.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  field: {
    minHeight: MIN_TOUCH,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  fieldText: { fontSize: FONTS.body, color: COLORS.text },
  placeholder: { color: COLORS.textSecondary },
});
