import React, { useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SplashScreen } from "../screens/SplashScreen";
import { HomeScreen } from "../features/home/HomeScreen";
import {
  CustomerListScreen,
  CustomerDetailScreen,
  AddCustomerScreen,
  EditCustomerScreen,
} from "../features/customers";
import {
  AddTransactionScreen,
  EditTransactionScreen,
  CreditListScreen,
  PaymentListScreen,
} from "../features/transactions";
import { CreditReportsScreen } from "../features/reports/CreditReportsScreen";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onReady={() => setShowSplash(false)} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          contentStyle: { backgroundColor: "#F8FAFC" },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="CustomerList" component={CustomerListScreen} />
        <Stack.Screen name="CreditList" component={CreditListScreen} />
        <Stack.Screen name="PaymentList" component={PaymentListScreen} />
        <Stack.Screen name="CustomerDetail" component={CustomerDetailScreen} />
        <Stack.Screen name="AddTransaction" component={AddTransactionScreen} />
        <Stack.Screen
          name="EditTransaction"
          component={EditTransactionScreen}
        />
        <Stack.Screen name="AddCustomer" component={AddCustomerScreen} />
        <Stack.Screen name="EditCustomer" component={EditCustomerScreen} />
        <Stack.Screen name="CreditReports" component={CreditReportsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
