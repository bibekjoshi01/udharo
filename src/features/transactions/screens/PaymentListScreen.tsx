import React from 'react';
import { useStrings } from '../../../constants/strings';
import { TransactionListScreen } from './TransactionListScreen';

export function PaymentListScreen() {
  const STRINGS = useStrings();
  return <TransactionListScreen type="payment" title={STRINGS.bhuktaniharu} />;
}
