// MAP: OnboardingScreen
// ├── UI: @/components/primitives/MaterialIconsRounded
// └── API: @/stores/uiStore, @/stores/aiContextStore

import { View, Text, Pressable, ScrollView } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import {
  TRAVEL_STYLES,
  GROUP_TYPES,
  BUDGET_LEVELS,
  PREFERENCES_DEFAULT,
} from "../src/constants/preferences";
import { useUIStore } from "../src/stores/uiStore";
import { useAIContextStore } from "../src/stores/aiContextStore";
import { TOKENS } from "../src/constants/design-tokens";

const TOTAL_STEPS = 4;

// Minimalist palette - chỉ dùng ink/black/white + subtle neutrals
const PALETTE = {
  ink: "#0B0B0F",
  inkSecondary: "rgba(11, 11, 15, 0.55)",
  inkTertiary: "rgba(11, 11, 15, 0.35)",
  divider: "rgba(11, 11, 15, 0.08)",
  surface: "#FFFFFF",
  surfaceMuted: "#FAFAFA",
  surfaceSubtle: "rgba(11, 11, 15, 0.03)",
  accent: "#0B0B0F",
  accentSurface: "rgba(11, 11, 15, 0.04)",
};

function WelcomeIllustration() {
  return (
    <View className="items-center justify-center mb-8">
      <View
        className="w-28 h-28 rounded-full items-center justify-center"
        style={{
          backgroundColor: PALETTE.surfaceSubtle,
          borderWidth: 1,
          borderColor: PALETTE.divider,
        }}
      >
        <MaterialIconsRounded name="explore" size={56} color={PALETTE.ink} />
      </View>
    </View>
  );
}

function ProgressIndicator({ currentStep, totalSteps }) {
  return (
    <View className="flex-row justify-center gap-1.5 pt-2 pb-4">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <View
          key={i}
          style={{
            width: i === currentStep ? 24 : 6,
            height: 6,
            borderRadius: 3,
            backgroundColor:
              i <= currentStep ? PALETTE.ink : PALETTE.divider,
          }}
        />
      ))}
    </View>
  );
}

export default function OnboardingScreen() {
  const { t } = useTranslation();
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

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSkip = () => {
    handleFinish();
  };

  return (
    <View
      className="flex-1 bg-white dark:bg-neutral-950"
      style={{ paddingTop: insets.top }}
    >
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 pt-2 h-12">
        {step > 0 && step < TOTAL_STEPS - 1 ? (
          <Pressable
            onPress={handleBack}
            hitSlop={10}
            className="w-9 h-9 rounded-full items-center justify-center active:opacity-60"
          >
            <MaterialIconsRounded
              name="arrow-back"
              size={20}
              color={PALETTE.ink}
            />
          </Pressable>
        ) : (
          <View className="w-9" />
        )}

        <Pressable onPress={handleSkip} hitSlop={10} className="active:opacity-60">
          <Text
            className="text-[13px]"
            style={{
              color: PALETTE.inkSecondary,
              fontFamily: TOKENS.font.medium,
              letterSpacing: 0.1,
            }}
          >
            {t("onboarding.skip")}
          </Text>
        </Pressable>
      </View>

      {/* Progress Dots */}
      <ProgressIndicator currentStep={step} totalSteps={TOTAL_STEPS} />

      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Step 0: Welcome */}
        {step === 0 && (
          <View className="pt-10">
            <WelcomeIllustration />

            <View className="items-center gap-3 mb-10">
              <Text
                className="text-[34px] text-center"
                style={{
                  color: PALETTE.ink,
                  fontFamily: TOKENS.font.heading,
                  letterSpacing: -1.2,
                  lineHeight: 40,
                }}
              >
                {t("onboarding.welcomeTitle")}
              </Text>
              <Text
                className="text-[15px] text-center px-6"
                style={{
                  color: PALETTE.inkSecondary,
                  fontFamily: TOKENS.font.body,
                  lineHeight: 22,
                }}
              >
                {t("onboarding.welcomeSubtitle")}
              </Text>
            </View>

            <View className="gap-2">
              {[
                {
                  icon: "auto-awesome",
                  title: t("onboarding.features.aiTitle"),
                  desc: t("onboarding.features.aiDesc"),
                },
                {
                  icon: "map",
                  title: t("onboarding.features.mapTitle"),
                  desc: t("onboarding.features.mapDesc"),
                },
                {
                  icon: "explore",
                  title: t("onboarding.features.exploreTitle"),
                  desc: t("onboarding.features.exploreDesc"),
                },
              ].map((feature, idx) => (
                <View
                  key={idx}
                  className="flex-row items-center gap-4 px-4 py-3.5 rounded-2xl"
                  style={{
                    backgroundColor: PALETTE.surfaceSubtle,
                  }}
                >
                  <MaterialIconsRounded
                    name={feature.icon}
                    size={22}
                    color={PALETTE.ink}
                  />
                  <View className="flex-1">
                    <Text
                      className="text-[15px]"
                      style={{
                        color: PALETTE.ink,
                        fontFamily: TOKENS.font.semibold,
                        letterSpacing: -0.2,
                      }}
                    >
                      {feature.title}
                    </Text>
                    <Text
                      className="text-[13px] mt-0.5"
                      style={{
                        color: PALETTE.inkSecondary,
                        fontFamily: TOKENS.font.body,
                        lineHeight: 18,
                      }}
                    >
                      {feature.desc}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Step 1: Travel Styles */}
        {step === 1 && (
          <View className="pt-6">
            <View className="mb-6">
              <Text
                className="text-[10px] uppercase mb-2"
                style={{
                  color: PALETTE.inkTertiary,
                  fontFamily: TOKENS.font.semibold,
                  letterSpacing: 1.5,
                }}
              >
                {t("onboarding.stepLabel", {
                  current: 1,
                  total: TOTAL_STEPS - 1,
                })}
              </Text>
              <Text
                className="text-[28px]"
                style={{
                  color: PALETTE.ink,
                  fontFamily: TOKENS.font.heading,
                  letterSpacing: -0.8,
                  lineHeight: 34,
                }}
              >
                {t("onboarding.travelStyleTitle")}
              </Text>
              <Text
                className="text-[15px] mt-2"
                style={{
                  color: PALETTE.inkSecondary,
                  fontFamily: TOKENS.font.body,
                  lineHeight: 22,
                }}
              >
                {t("onboarding.travelStyleSubtitle")}
              </Text>
            </View>

            <View className="flex-row flex-wrap gap-2">
              {TRAVEL_STYLES.map((style) => {
                const isSelected = prefs.travelStyles.includes(style.id);
                return (
                  <Pressable
                    key={style.id}
                    onPress={() => toggleStyle(style.id)}
                    className="flex-row items-center gap-2 px-4 py-3 rounded-full"
                    style={{
                      borderWidth: 1,
                      borderColor: isSelected ? PALETTE.ink : PALETTE.divider,
                      backgroundColor: isSelected
                        ? PALETTE.ink
                        : "transparent",
                    }}
                  >
                    <MaterialIconsRounded
                      name={style.icon}
                      size={16}
                      color={isSelected ? PALETTE.surface : PALETTE.ink}
                    />
                    <Text
                      className="text-[14px]"
                      style={{
                        color: isSelected ? PALETTE.surface : PALETTE.ink,
                        fontFamily: isSelected
                          ? TOKENS.font.semibold
                          : TOKENS.font.medium,
                        letterSpacing: -0.1,
                      }}
                    >
                      {t(style.labelKey)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text
              className="text-[12px] text-center mt-4"
              style={{
                color: PALETTE.inkTertiary,
                fontFamily: TOKENS.font.body,
              }}
            >
              {t("onboarding.selectMultiple")}
            </Text>
          </View>
        )}

        {/* Step 2: Group Type */}
        {step === 2 && (
          <View className="pt-6">
            <View className="mb-6">
              <Text
                className="text-[10px] uppercase mb-2"
                style={{
                  color: PALETTE.inkTertiary,
                  fontFamily: TOKENS.font.semibold,
                  letterSpacing: 1.5,
                }}
              >
                {t("onboarding.stepLabel", {
                  current: 2,
                  total: TOTAL_STEPS - 1,
                })}
              </Text>
              <Text
                className="text-[28px]"
                style={{
                  color: PALETTE.ink,
                  fontFamily: TOKENS.font.heading,
                  letterSpacing: -0.8,
                  lineHeight: 34,
                }}
              >
                {t("onboarding.groupTitle")}
              </Text>
              <Text
                className="text-[15px] mt-2"
                style={{
                  color: PALETTE.inkSecondary,
                  fontFamily: TOKENS.font.body,
                  lineHeight: 22,
                }}
              >
                {t("onboarding.groupSubtitle")}
              </Text>
            </View>

            <View className="gap-2">
              {GROUP_TYPES.map((group) => {
                const isSelected = prefs.groupType === group.id;
                return (
                  <Pressable
                    key={group.id}
                    onPress={() =>
                      setPrefs((p) => ({ ...p, groupType: group.id }))
                    }
                    className="flex-row items-center gap-3 px-4 py-4 rounded-2xl"
                    style={{
                      borderWidth: 1,
                      borderColor: isSelected ? PALETTE.ink : PALETTE.divider,
                      backgroundColor: isSelected
                        ? PALETTE.surfaceSubtle
                        : "transparent",
                    }}
                  >
                    <MaterialIconsRounded
                      name={group.icon}
                      size={22}
                      color={PALETTE.ink}
                    />
                    <Text
                      className="text-[16px] flex-1"
                      style={{
                        color: PALETTE.ink,
                        fontFamily: isSelected
                          ? TOKENS.font.semibold
                          : TOKENS.font.medium,
                        letterSpacing: -0.2,
                      }}
                    >
                      {t(group.labelKey)}
                    </Text>
                    <View
                      className="w-5 h-5 rounded-full items-center justify-center"
                      style={{
                        borderWidth: 1.5,
                        borderColor: isSelected
                          ? PALETTE.ink
                          : PALETTE.divider,
                      }}
                    >
                      {isSelected && (
                        <View
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: PALETTE.ink }}
                        />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Step 3: Budget */}
        {step === 3 && (
          <View className="pt-6">
            <View className="mb-6">
              <Text
                className="text-[10px] uppercase mb-2"
                style={{
                  color: PALETTE.inkTertiary,
                  fontFamily: TOKENS.font.semibold,
                  letterSpacing: 1.5,
                }}
              >
                {t("onboarding.stepLabel", {
                  current: 3,
                  total: TOTAL_STEPS - 1,
                })}
              </Text>
              <Text
                className="text-[28px]"
                style={{
                  color: PALETTE.ink,
                  fontFamily: TOKENS.font.heading,
                  letterSpacing: -0.8,
                  lineHeight: 34,
                }}
              >
                {t("onboarding.budgetTitle")}
              </Text>
              <Text
                className="text-[15px] mt-2"
                style={{
                  color: PALETTE.inkSecondary,
                  fontFamily: TOKENS.font.body,
                  lineHeight: 22,
                }}
              >
                {t("onboarding.budgetSubtitle")}
              </Text>
            </View>

            <View className="gap-2">
              {BUDGET_LEVELS.map((level) => {
                const isSelected = prefs.budgetLevel === level.id;
                return (
                  <Pressable
                    key={level.id}
                    onPress={() =>
                      setPrefs((p) => ({ ...p, budgetLevel: level.id }))
                    }
                    className="px-4 py-4 rounded-2xl"
                    style={{
                      borderWidth: 1,
                      borderColor: isSelected ? PALETTE.ink : PALETTE.divider,
                      backgroundColor: isSelected
                        ? PALETTE.surfaceSubtle
                        : "transparent",
                    }}
                  >
                    <View className="flex-row items-center justify-between">
                      <Text
                        className="text-[16px]"
                        style={{
                          color: PALETTE.ink,
                          fontFamily: isSelected
                            ? TOKENS.font.semibold
                            : TOKENS.font.medium,
                          letterSpacing: -0.2,
                        }}
                      >
                        {t(level.labelKey)}
                      </Text>
                      <View
                        className="w-5 h-5 rounded-full items-center justify-center"
                        style={{
                          borderWidth: 1.5,
                          borderColor: isSelected
                            ? PALETTE.ink
                            : PALETTE.divider,
                        }}
                      >
                        {isSelected && (
                          <View
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: PALETTE.ink }}
                          />
                        )}
                      </View>
                    </View>
                    <Text
                      className="text-[13px] mt-1"
                      style={{
                        color: PALETTE.inkSecondary,
                        fontFamily: TOKENS.font.body,
                        lineHeight: 19,
                      }}
                    >
                      {t(level.descriptionKey)}
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
        className="px-6 pt-4"
        style={{ paddingBottom: Math.max(insets.bottom + 8, 24) }}
      >
        <Pressable
          onPress={handleNext}
          className="py-4 rounded-2xl items-center flex-row justify-center gap-2 active:opacity-80"
          style={{
            backgroundColor: PALETTE.ink,
          }}
        >
          <Text
            className="text-[15px]"
            style={{
              color: PALETTE.surface,
              fontFamily: TOKENS.font.semibold,
              letterSpacing: -0.2,
            }}
          >
            {step < TOTAL_STEPS - 1
              ? t("onboarding.next")
              : t("onboarding.start")}
          </Text>
          <MaterialIconsRounded
            name={step < TOTAL_STEPS - 1 ? "arrow-forward" : "check"}
            size={18}
            color={PALETTE.surface}
          />
        </Pressable>
      </View>
    </View>
  );
}
