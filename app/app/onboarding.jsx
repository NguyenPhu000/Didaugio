import { View, Text, Pressable, ScrollView } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import {
  TRAVEL_STYLES,
  GROUP_TYPES,
  BUDGET_LEVELS,
  PREFERENCES_DEFAULT,
} from "../src/constants/preferences";
import { useUIStore } from "../src/stores/uiStore";
import { useAIContextStore } from "../src/stores/aiContextStore";
import { TOKENS } from "../src/constants/design-tokens";

const TOTAL_STEPS = 3;

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setPreferences = useUIStore((s) => s.setPreferences);
  const completeOnboard = useUIStore((s) => s.completeOnboard);
  const setAIPreferences = useAIContextStore((s) => s.setPreferences);

  const [step, setStep] = useState(0);
  const [prefs, setPrefs] = useState(PREFERENCES_DEFAULT);

  const toggleStyle = (id) => {
    setPrefs((p) => ({
      ...p,
      travelStyles: p.travelStyles.includes(id)
        ? p.travelStyles.filter((s) => s !== id)
        : [...p.travelStyles, id],
    }));
  };

  const handleFinish = () => {
    setPreferences(prefs);
    setAIPreferences(prefs);
    completeOnboard();
    router.replace("/(tabs)/map");
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    } else {
      handleFinish();
    }
  };

  const handleSkip = () => {
    handleFinish();
  };

  return (
    <View
      className="flex-1 bg-white dark:bg-neutral-950"
      style={{ paddingTop: insets.top }}
    >
      {/* Progress Dots */}
      <View className="flex-row justify-center gap-2 pt-4 pb-2">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <View
            key={i}
            style={{
              width: i === step ? 24 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor:
                i <= step
                  ? TOKENS.color.primary[500]
                  : TOKENS.color.neutral[200],
            }}
          />
        ))}
      </View>

      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Step 1: Travel Styles */}
        {step === 0 && (
          <View className="pt-6 gap-4">
            <View className="gap-1">
              <Text className="text-2xl font-bold text-ink dark:text-white">
                Bạn thích du lịch kiểu gì? 🗺️
              </Text>
              <Text className="text-sm text-ink-secondary">
                Chọn những phong cách bạn yêu thích (có thể chọn nhiều)
              </Text>
            </View>
            <View className="flex-row flex-wrap gap-3 mt-2">
              {TRAVEL_STYLES.map((style) => {
                const isSelected = prefs.travelStyles.includes(style.id);
                return (
                  <Pressable
                    key={style.id}
                    onPress={() => toggleStyle(style.id)}
                    className="flex-row items-center gap-2 px-4 py-2.5 rounded-2xl border"
                    style={{
                      borderColor: isSelected
                        ? style.color
                        : TOKENS.color.neutral[100],
                      backgroundColor: isSelected
                        ? style.color + "22"
                        : "transparent",
                    }}
                  >
                    <MaterialIcons
                      name={style.icon}
                      size={18}
                      color={
                        isSelected ? style.color : TOKENS.color.neutral[400]
                      }
                    />
                    <Text
                      className="text-sm font-medium"
                      style={{
                        color: isSelected
                          ? style.color
                          : TOKENS.color.neutral[700],
                      }}
                    >
                      {style.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Step 2: Group Type */}
        {step === 1 && (
          <View className="pt-6 gap-4">
            <View className="gap-1">
              <Text className="text-2xl font-bold text-ink dark:text-white">
                Đi du lịch với ai? 👥
              </Text>
              <Text className="text-sm text-ink-secondary">
                Giúp em Nhi gợi ý phù hợp hơn
              </Text>
            </View>
            <View className="gap-3 mt-2">
              {GROUP_TYPES.map((group) => {
                const isSelected = prefs.groupType === group.id;
                return (
                  <Pressable
                    key={group.id}
                    onPress={() =>
                      setPrefs((p) => ({ ...p, groupType: group.id }))
                    }
                    className="flex-row items-center gap-3 px-4 py-4 rounded-2xl border"
                    style={{
                      borderColor: isSelected
                        ? TOKENS.color.primary[500]
                        : TOKENS.color.neutral[100],
                      backgroundColor: isSelected
                        ? TOKENS.color.primary[50]
                        : "transparent",
                    }}
                  >
                    <MaterialIcons
                      name={group.icon}
                      size={24}
                      color={
                        isSelected
                          ? TOKENS.color.primary[500]
                          : TOKENS.color.neutral[400]
                      }
                    />
                    <Text
                      className="text-base font-medium"
                      style={{
                        color: isSelected
                          ? TOKENS.color.primary[600]
                          : TOKENS.color.neutral[900],
                      }}
                    >
                      {group.label}
                    </Text>
                    {isSelected && (
                      <View className="ml-auto">
                        <MaterialIcons
                          name="check-circle"
                          size={20}
                          color={TOKENS.color.primary[500]}
                        />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Step 3: Budget */}
        {step === 2 && (
          <View className="pt-6 gap-4">
            <View className="gap-1">
              <Text className="text-2xl font-bold text-ink dark:text-white">
                Ngân sách của bạn? 💰
              </Text>
              <Text className="text-sm text-ink-secondary">
                Để em Nhi gợi ý phù hợp túi tiền
              </Text>
            </View>
            <View className="gap-3 mt-2">
              {BUDGET_LEVELS.map((level) => {
                const isSelected = prefs.budgetLevel === level.id;
                return (
                  <Pressable
                    key={level.id}
                    onPress={() =>
                      setPrefs((p) => ({ ...p, budgetLevel: level.id }))
                    }
                    className="px-4 py-4 rounded-2xl border"
                    style={{
                      borderColor: isSelected
                        ? TOKENS.color.primary[500]
                        : TOKENS.color.neutral[100],
                      backgroundColor: isSelected
                        ? TOKENS.color.primary[50]
                        : "transparent",
                    }}
                  >
                    <View className="flex-row items-center justify-between">
                      <Text
                        className="text-base font-semibold"
                        style={{
                          color: isSelected
                            ? TOKENS.color.primary[600]
                            : TOKENS.color.neutral[900],
                        }}
                      >
                        {level.label}
                      </Text>
                      {isSelected && (
                        <MaterialIcons
                          name="check-circle"
                          size={20}
                          color={TOKENS.color.primary[500]}
                        />
                      )}
                    </View>
                    <Text className="text-sm text-ink-secondary mt-0.5">
                      {level.description}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View
        className="px-6 pb-6 gap-3"
        style={{ paddingBottom: Math.max(insets.bottom, 24) }}
      >
        <Pressable
          onPress={handleNext}
          className="py-4 rounded-2xl items-center"
          style={{ backgroundColor: TOKENS.color.primary[500] }}
        >
          <Text className="text-base font-bold text-white">
            {step < TOTAL_STEPS - 1 ? "Tiếp theo" : "Bắt đầu khám phá!"}
          </Text>
        </Pressable>
        <Pressable onPress={handleSkip} className="items-center py-2">
          <Text className="text-sm text-ink-secondary">Bỏ qua</Text>
        </Pressable>
      </View>
    </View>
  );
}
