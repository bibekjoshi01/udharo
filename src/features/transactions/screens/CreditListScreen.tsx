import React from 'react';
import { useStrings } from '../../../constants/strings';
import { TransactionListScreen } from './TransactionListScreen';

export function CreditListScreen() {
  const STRINGS = useStrings();
  return <TransactionListScreen type="credit" title={STRINGS.udharoharu} />;
}
