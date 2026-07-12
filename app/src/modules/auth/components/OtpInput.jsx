import { useEffect, useMemo, useRef } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const OTP_LENGTH = 6;

export function OtpInput({ value, onChange, disabled, hasError }) {
  const inputRef = useRef(null);
  const shake = useSharedValue(0);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!hasError) return;
    shake.value = withSequence(
      withTiming(-8, { duration: 45 }),
      withTiming(8, { duration: 45 }),
      withTiming(-5, { duration: 45 }),
      withTiming(0, { duration: 45 }),
    );
  }, [hasError, shake]);

  const digits = useMemo(() => {
    const normalized = String(value || "").replace(/\D/g, "").slice(0, OTP_LENGTH);
    return Array.from({ length: OTP_LENGTH }, (_, index) => normalized[index] || "");
  }, [value]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }],
  }));

  const handleChange = (nextValue) => {
    onChange?.(String(nextValue || "").replace(/\D/g, "").slice(0, OTP_LENGTH));
  };

  return (
    <Pressable onPress={() => inputRef.current?.focus()} disabled={disabled}>
      <Animated.View style={animatedStyle}>
        <View className="flex-row justify-between gap-2">
          {digits.map((digit, index) => {
            const isActive = value?.length === index;
            const isFilled = Boolean(digit);

            return (
              <View
                key={index}
                className={[
                  "h-14 flex-1 rounded-2xl border items-center justify-center bg-white",
                  hasError
                    ? "border-[#FF3B30]"
                    : isActive || isFilled
                    ? "border-[#007AFF]"
                    : "border-[#D1D5DB]",
                ].join(" ")}
              >
                <Text className="text-[22px] font-extrabold text-[#0F172A]">{digit}</Text>
              </View>
            );
          })}
        </View>
      </Animated.View>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        editable={!disabled}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={OTP_LENGTH}
        style={{ position: "absolute", opacity: 0, height: 1, width: 1 }}
      />
    </Pressable>
  );
}
