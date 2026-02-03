export type RootStackParamList = {
  Splash: undefined;
  Home: undefined;
  CustomerList: undefined;
  CreditList: undefined;
  PaymentList: undefined;
  CustomerDetail: { customerId: number };
  AddTransaction: { customerId?: number; mode: 'udharo' | 'payment'; lockMode?: boolean };
  EditTransaction: { transactionId: number; mode: 'udharo' | 'payment' };
  AddCustomer: undefined;
  EditCustomer: { customerId: number };
  CreditReports: undefined;
};
