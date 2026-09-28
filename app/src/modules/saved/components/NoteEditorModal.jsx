import { memo, useCallback } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { FileEdit, X } from "lucide-react-native";
import { TOKENS } from "../../../constants/design-tokens";

const TactilePressable = memo(function TactilePressable({
  onPress,
  disabled,
  children,
  className = "",
  style = {},
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    if (disabled) return;
    scale.value = withSpring(0.96, TOKENS.spring.press);
  }, [disabled, scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, TOKENS.spring.press);
  }, [scale]);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      className={className}
    >
      <Animated.View style={[animStyle, style]}>{children}</Animated.View>
    </Pressable>
  );
});

export function NoteEditorModal({
  visible,
  placeName,
  value = "",
  saving,
  onChangeText,
  onClose,
  onSubmit,
}) {
  const { t } = useTranslation();
  const charCount = value ? value.length : 0;

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose?.();
  };

  const handleSubmit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSubmit?.();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(150)}
        style={styles.backdrop}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1 justify-center px-5"
        >
          <Animated.View
            entering={SlideInDown.duration(260).springify().damping(18)}
            exiting={SlideOutDown.duration(180)}
          >
            <View
              className="bg-white p-6 gap-3.5 border-[0.5px] border-black/[0.08]"
              style={{
                borderRadius: 24,
                borderCurve: "continuous",
                shadowColor: "#000000",
                shadowOffset: { width: 0, height: 16 },
                shadowOpacity: 0.12,
                shadowRadius: 28,
                elevation: 10,
              }}
            >
              {/* Header */}
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-2">
                  <View className="flex-row items-center gap-1.5 mb-1">
                    <FileEdit size={16} color="#007BFF" strokeWidth={2.2} />
                    <Text
                      className="text-[12px] uppercase tracking-[1px] text-[#007BFF]"
                      style={{ fontFamily: TOKENS.font.semibold }}
                    >
                      {t("noteEditor.badge", "Ghi chú cá nhân")}
                    </Text>
                  </View>
                  <Text
                    className="text-[#1D1D1F] text-[19px] leading-[24px] tracking-tight"
                    style={{ fontFamily: TOKENS.font.heading }}
                    numberOfLines={1}
                  >
                    {placeName || t("noteEditor.subtitle", "Địa điểm")}
                  </Text>
                </View>

                <Pressable
                  onPress={handleClose}
                  hitSlop={8}
                  className="w-8 h-8 rounded-full items-center justify-center bg-black/[0.05] active:opacity-70"
                >
                  <X size={15} color="#636366" strokeWidth={2.4} />
                </Pressable>
              </View>

              {/* Input Area */}
              <View>
                <TextInput
                  value={value}
                  onChangeText={onChangeText}
                  placeholder={t(
                    "noteEditor.placeholder",
                    "Ghi lại mẹo ăn uống, thời điểm nên ghé, món ngon...",
                  )}
                  placeholderTextColor="rgba(29, 29, 31, 0.4)"
                  multiline
                  maxLength={500}
                  className="min-h-[120px] px-3.5 py-3 text-[#1D1D1F] text-[14.5px] leading-5 bg-[#F6F7F9] border-[0.5px] border-black/[0.08]"
                  style={{
                    borderRadius: 16,
                    borderCurve: "continuous",
                    fontFamily: TOKENS.font.body,
                  }}
                  textAlignVertical="top"
                />

                <View className="flex-row justify-end mt-1 px-1">
                  <Text
                    className="text-[11px] text-[#8E8E93]"
                    style={{ fontFamily: TOKENS.font.medium }}
                  >
                    {charCount}/500
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View className="flex-row gap-2.5 mt-1">
                <TactilePressable
                  onPress={handleClose}
                  disabled={saving}
                  className="flex-1"
                >
                  <View
                    className="items-center justify-center py-3 bg-[#F2F2F7]"
                    style={{ borderRadius: 14, borderCurve: "continuous" }}
                  >
                    <Text
                      className="text-[#1D1D1F] text-[15px] tracking-tight"
                      style={{ fontFamily: TOKENS.font.semibold }}
                    >
                      {t("noteEditor.cancel", "Hủy")}
                    </Text>
                  </View>
                </TactilePressable>

                <TactilePressable
                  onPress={handleSubmit}
                  disabled={saving}
                  className="flex-1"
                >
                  <View
                    className={`items-center justify-center py-3 bg-[#1D1D1F] ${
                      saving ? "opacity-60" : ""
                    }`}
                    style={{ borderRadius: 14, borderCurve: "continuous" }}
                  >
                    <Text
                      className="text-white text-[15px] tracking-tight"
                      style={{ fontFamily: TOKENS.font.semibold }}
                    >
                      {saving
                        ? t("noteEditor.saving", "Đang lưu...")
                        : t("noteEditor.saveNote", "Lưu ghi chú")}
                    </Text>
                  </View>
                </TactilePressable>
              </View>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
});

export default NoteEditorModal;
