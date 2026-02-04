import React, { useCallback } from 'react';
import { View, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useStrings } from '../../../constants/strings';
import { insertCustomer } from '../../../db/database';
import type { RootStackParamList } from '../../../navigation/types';
import type { CustomerFormInput } from '../validation';
import { ScreenHeader, CustomerForm } from '../components';
import { showToast } from '../../../utils/toast';

type Nav = NativeStackNavigationProp<RootStackParamList, 'AddCustomer'>;

export function AddCustomerScreen() {
  const navigation = useNavigation<Nav>();
  const STRINGS = useStrings();
  const [saving, setSaving] = React.useState(false);

  const handleSubmit = useCallback(
    async (values: CustomerFormInput) => {
      setSaving(true);
      try {
        await insertCustomer({
          name: values.name,
          mobile: values.mobile,
          address: values.address,
          note: values.note,
        });
        showToast(STRINGS.customerSaved);
        navigation.goBack();
      } catch (e: any) {
        Alert.alert(STRINGS.saveFailed, String(e?.message ?? e));
      } finally {
        setSaving(false);
      }
    },
    [navigation, STRINGS],
  );

  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader title={STRINGS.addCustomer} onBack={() => navigation.goBack()} />
      <CustomerForm
        onSubmit={handleSubmit}
        submitLabel={STRINGS.saveCustomer}
        isSubmitting={saving}
      />
    </View>
  );
}
