import React from "react";
import { View, Text } from "react-native";
import { MaterialIconsRounded } from "../../../components/primitives/MaterialIconsRounded";
import { BOOKING_APPLE_THEME as APPLE_THEME } from "../../../constants/design-tokens";

const STEP_LABELS = ["Dịch vụ", "Xác nhận", "Gửi yêu cầu"];

const BOOKING_THEME = {
  ...APPLE_THEME,
  background: APPLE_THEME.background,
  backgroundElevated: APPLE_THEME.surface,
  glass: APPLE_THEME.surface,
  glassBorder: APPLE_THEME.border,
  glassBorderStrong: APPLE_THEME.borderSoft,
  neon: APPLE_THEME.primary,
  neonAccent: APPLE_THEME.primaryPressed,
  neonGlow: APPLE_THEME.primaryTint,
  text: APPLE_THEME.text,
  textSecondary: APPLE_THEME.textSecondary,
  textMuted: APPLE_THEME.textMuted,
  white: APPLE_THEME.white,
  focusBlue: APPLE_THEME.focusBlue,
};

export function StepIndicator({ currentStep }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        marginBottom: 24,
      }}
    >
      {STEP_LABELS.map((label, index) => {
        const stepNum = index + 1;
        const isDone = stepNum < currentStep;
        const isActive = stepNum === currentStep;
        return (
          <View key={label} style={{ flex: 1, alignItems: "center" }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                width: "100%",
              }}
            >
              {index > 0 ? (
                <View
                  style={{
                    flex: 1,
                    height: 2,
                    backgroundColor:
                      isDone || isActive
                        ? BOOKING_THEME.neon
                        : BOOKING_THEME.glass,
                  }}
                />
              ) : null}
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isActive
                    ? BOOKING_THEME.neon
                    : isDone
                      ? BOOKING_THEME.neonGlow
                      : BOOKING_THEME.glass,
                  borderWidth: 1,
                  borderColor:
                    isDone || isActive
                      ? BOOKING_THEME.neon
                      : BOOKING_THEME.glassBorder,
                }}
              >
                {isDone ? (
                  <MaterialIconsRounded
                    name="check"
                    size={16}
                    color={BOOKING_THEME.neon}
                  />
                ) : (
                  <Text
                    style={{
                      color: isActive
                        ? BOOKING_THEME.white
                        : BOOKING_THEME.textSecondary,
                      fontSize: 13,
                      fontWeight: "700",
                    }}
                  >
                    {stepNum}
                  </Text>
                )}
              </View>
              {index < STEP_LABELS.length - 1 ? (
                <View
                  style={{
                    flex: 1,
                    height: 2,
                    backgroundColor:
                      stepNum < currentStep
                        ? BOOKING_THEME.neon
                        : BOOKING_THEME.glass,
                  }}
                />
              ) : null}
            </View>
            <Text
              style={{
                color: isActive
                  ? BOOKING_THEME.neon
                  : BOOKING_THEME.textSecondary,
                fontSize: 11,
                fontWeight: isActive ? "700" : "400",
                marginTop: 6,
              }}
            >
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
export default StepIndicator;
