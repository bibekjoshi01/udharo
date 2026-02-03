import React from 'react';
import { STRINGS } from '../../../constants/strings';
import { TransactionListScreen } from './TransactionListScreen';

export function PaymentListScreen() {
  return <TransactionListScreen type="payment" title={STRINGS.bhuktaniharu} />;
}
