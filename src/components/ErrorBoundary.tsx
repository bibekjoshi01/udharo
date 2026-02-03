import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, FONTS, SPACING, BORDER_RADIUS, MIN_TOUCH } from "../constants/theme";
import { AppPressable } from "./AppPressable";

type ErrorBoundaryProps = {
  children: React.ReactNode;
  onReset?: () => void;
};

type ErrorBoundaryState = {
  hasError: boolean;
  message?: string;
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error?.message };
  }

  componentDidCatch() {
    // Here we can hook crash reporting in future
  }

  handleReset = () => {
    this.setState({ hasError: false, message: undefined });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={styles.container}>
        <Text style={styles.title}>केही त्रुटि भयो</Text>
        <Text style={styles.subtitle}>
          कृपया पुनः प्रयास गर्नुहोस्।
        </Text>
        {this.state.message ? (
          <Text style={styles.message} numberOfLines={3}>
            {this.state.message}
          </Text>
        ) : null}
        <AppPressable style={styles.button} onPress={this.handleReset}>
          <Text style={styles.buttonText}>पुनः खोल्नुहोस्</Text>
        </AppPressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: SPACING.xs,
    textAlign: "center",
  },
  subtitle: {
    fontSize: FONTS.body,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: SPACING.md,
  },
  message: {
    fontSize: FONTS.small,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: SPACING.md,
  },
  button: {
    minHeight: MIN_TOUCH,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: FONTS.body,
    fontWeight: "700",
    color: COLORS.white,
  },
});
