import React, { useCallback, useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, FONTS, SPACING } from '../../../constants/theme';
import { useStrings } from '../../../constants/strings';
import { updateCustomer } from '../../../db/database';
import type { RootStackParamList } from '../../../navigation/types';
import type { CustomerFormInput } from '../validation';
import { useCustomer } from '../hooks';
import { ScreenHeader, CustomerForm } from '../components';
import { Skeleton } from '../../../components/Skeleton';

type Nav = NativeStackNavigationProp<RootStackParamList, 'EditCustomer'>;

export function EditCustomerScreen() {
  const navigation = useNavigation<Nav>();
  const STRINGS = useStrings();
  const route = useRoute();
  const customerId = (route.params as { customerId: number }).customerId;
  const { customer, loading, reload } = useCustomer(customerId);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = navigation.addListener('focus', reload);
    return unsub;
  }, [navigation, reload]);

  const handleSubmit = useCallback(
    async (values: CustomerFormInput) => {
      setSaving(true);
      try {
        await updateCustomer(customerId, {
          name: values.name,
          mobile: values.mobile,
          address: values.address,
          note: values.note,
        });
        navigation.goBack();
      } finally {
        setSaving(false);
      }
    },
    [customerId, navigation],
  );

  if (loading || !customer) {
    return (
      <View style={styles.container}>
        <ScreenHeader title={STRINGS.editCustomer} onBack={() => navigation.goBack()} />
        <View style={styles.loadingWrap}>
          <View style={styles.skeletonStack}>
            <Skeleton height={16} width="55%" radius={8} style={styles.skeletonLine} />
            <Skeleton height={48} radius={10} style={styles.skeletonField} />
            <Skeleton height={16} width="45%" radius={8} style={styles.skeletonLine} />
            <Skeleton height={48} radius={10} style={styles.skeletonField} />
            <Skeleton height={16} width="50%" radius={8} style={styles.skeletonLine} />
            <Skeleton height={48} radius={10} style={styles.skeletonField} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <ScreenHeader title={STRINGS.editCustomer} onBack={() => navigation.goBack()} />
      <CustomerForm
        initialValues={{
          name: customer.name,
          mobile: customer.mobile ?? '',
          address: customer.address ?? '',
          note: customer.note ?? '',
        }}
        onSubmit={handleSubmit}
        submitLabel={STRINGS.save}
        isSubmitting={saving}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  wrapper: { flex: 1 },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    fontSize: FONTS.body,
    color: COLORS.textSecondary,
  },
  skeletonStack: {
    width: '100%',
  },
  skeletonLine: {
    marginBottom: SPACING.xs,
  },
  skeletonField: {
    marginBottom: SPACING.md,
  },
});
