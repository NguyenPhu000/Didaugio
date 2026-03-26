/**
 * GlobalErrorBoundary — catches unhandled JS errors and shows a friendly screen.
 * Must be a class component (React requirement for error boundaries).
 */
import { Component } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

const PRIMARY = "#0077b8";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary] Caught error:", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={styles.container}>
        <MaterialIcons name="error-outline" size={64} color="#ef4444" />
        <Text style={styles.title}>Có lỗi xảy ra</Text>
        <Text style={styles.message}>
          {this.state.error?.message || "Lỗi không xác định. Vui lòng thử lại."}
        </Text>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
          ]}
          onPress={this.handleReset}
        >
          <MaterialIcons name="refresh" size={20} color="#fff" />
          <Text style={styles.buttonText}>Thử lại</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: "#f5f7f8",
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111618",
    fontFamily: "BeVietnamPro_700Bold",
  },
  message: {
    fontSize: 14,
    color: "#737373",
    textAlign: "center",
    lineHeight: 22,
    fontFamily: "BeVietnamPro_400Regular",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
    fontFamily: "BeVietnamPro_600SemiBold",
  },
});
