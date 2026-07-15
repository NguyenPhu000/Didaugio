/**
 * GlobalErrorBoundary — catches unhandled JS errors and shows a friendly screen.
 * Must be a class component (React requirement for error boundaries).
 */
import { Component } from "react";
import { Pressable, Text, View } from "react-native";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import i18n from "@/i18n";
import { logger } from "../lib/logger";


export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    logger.error("[ErrorBoundary] Caught error:", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View className="flex-1 items-center justify-center p-8 bg-[#f5f7f8] gap-3">
        <MaterialIconsRounded name="error-outline" size={64} color="#ef4444" />
        <Text className="text-xl font-bold text-[#111618]" style={{ fontFamily: "BeVietnamPro_700Bold" }}>
          {i18n.t("errorBoundary.title")}
        </Text>
        <Text className="text-sm text-[#737373] text-center leading-[22px]" style={{ fontFamily: "BeVietnamPro_400Regular" }}>
          {this.state.error?.message || i18n.t("errorBoundary.message")}
        </Text>
        <Pressable
          className="flex-row items-center gap-2 bg-[#0077b8] px-6 py-3 rounded-6xl mt-2"
          style={({ pressed }) => pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] }}
          onPress={this.handleReset}
        >
          <MaterialIconsRounded name="refresh" size={20} color="#fff" />
          <Text className="text-white font-semibold text-[15px]" style={{ fontFamily: "BeVietnamPro_600SemiBold" }}>
            {i18n.t("errorBoundary.retry")}
          </Text>
        </Pressable>
      </View>
    );
  }
}
