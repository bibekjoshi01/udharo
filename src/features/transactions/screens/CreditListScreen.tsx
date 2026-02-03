import React from 'react';
import { STRINGS } from '../../../constants/strings';
import { TransactionListScreen } from './TransactionListScreen';

export function CreditListScreen() {
  return <TransactionListScreen type="udharo" title={STRINGS.udharoharu} />;
}
