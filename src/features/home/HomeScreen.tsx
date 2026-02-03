import React, { useCallback, useState } from "react";
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { COLORS, SPACING } from "../../constants/theme";
import { getTotalReceivables } from "../../db/database";
import type { RootStackParamList } from "../../navigation/types";
import { HomeHeader, SummaryCard, ActionGrid, HomeFooter } from "./components";

type Nav = NativeStackNavigationProp<RootStackParamList, "Home">;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [totalReceivables, setTotalReceivables] = useState<number>(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingTotal, setLoadingTotal] = useState(false);

  const loadTotal = useCallback(async () => {
    setLoadingTotal(true);
    try {
      const total = await getTotalReceivables();
      setTotalReceivables(total);
    } finally {
      setLoadingTotal(false);
    }
  }, []);

  React.useEffect(() => {
    loadTotal();
  }, [loadTotal]);

  useFocusEffect(
    React.useCallback(() => {
      loadTotal();
    }, [loadTotal]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTotal();
    setRefreshing(false);
  }, [loadTotal]);

  const headerPaddingTop = Math.max(insets.top, SPACING.md);
  const footerPaddingBottom = Math.max(insets.bottom, SPACING.md);

  return (
    <View style={styles.container}>
      <HomeHeader
        paddingTop={headerPaddingTop}
        onMenuPress={() => navigation.navigate("Menu")}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <SummaryCard total={totalReceivables} loading={loadingTotal} />
        <ActionGrid
          onCustomers={() => navigation.navigate("CustomerList")}
          onUdharo={() => navigation.navigate("CreditList")}
          onBhuktani={() => navigation.navigate("PaymentList")}
          onReports={() => navigation.navigate("CreditReports")}
        />
      </ScrollView>

      <HomeFooter
        paddingBottom={footerPaddingBottom}
        onCustomers={() => navigation.navigate("CustomerList")}
        onAddCredit={() =>
          navigation.navigate("AddTransaction", {
            mode: "udharo",
            lockMode: true,
          })
        }
        onBhuktani={() => navigation.navigate("PaymentList")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  scrollContent: { padding: SPACING.md, paddingBottom: SPACING.xl },
});
