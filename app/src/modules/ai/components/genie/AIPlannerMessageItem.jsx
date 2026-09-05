import { memo, useCallback, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { MaterialIconsRounded } from "../../../../components/primitives/MaterialIconsRounded";
import { PlacePreviewCard } from "../../../../components/composed/PlacePreviewCard";
import { TOKENS } from "../../../../constants/design-tokens";
import { GenieAvatar } from "./GenieAvatar";
import { submitFeedbackApi } from "../../../feedback/api/feedbackApi";
import {
  createAiFeedbackSubmitter,
  isRateableAiMessage,
} from "../../lib/aiFeedback";

const FEEDBACK_OPTIONS = ["up", "down"];

const styles = StyleSheet.create({
  confirmBtn: {
    marginTop: 4,
    borderRadius: 16,
    overflow: "hidden",
  },
  confirmBtnDisabled: {
    opacity: 0.6,
  },
  confirmTextDisabled: {
    color: "#94A3B8",
  },
  confirmTextEnabled: {
    color: "#FFFFFF",
  },
  confirmTextBase: {
    fontSize: 14.5,
  },
  confirmGradientInner: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  feedbackRow: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
    marginLeft: 24,
  },
  feedbackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
  feedbackButtonSelected: {
    backgroundColor: "#E0F2FE",
  },
  feedbackButtonDisabled: {
    opacity: 0.55,
  },
  feedbackError: {
    marginLeft: 4,
    color: "#B91C1C",
    fontSize: 11,
    fontFamily: TOKENS.font.body,
  },
});

function AIPlannerMessageItemComponent({
  canConfirmSelection,
  clearSelectedPlaces,
  draftPlan,
  handleConfirmSelection,
  handleOpenPlace,
  handleSend,
  handleTogglePlace,
  index,
  isCompactCard,
  isConfirming,
  isSpeaking,
  message,
  selectAllPlaces,
  selectedPlaceIds,
  speakText,
  stopSpeaking,
  t,
}) {
  const router = useRouter();
  const isUser = message.role === "user";
  const canRate = isRateableAiMessage(message);
  const [feedbackState, setFeedbackState] = useState({
    status: "idle",
    value: null,
  });
  const feedbackSubmitterRef = useRef(null);
  if (!feedbackSubmitterRef.current) {
    feedbackSubmitterRef.current =
      createAiFeedbackSubmitter(submitFeedbackApi);
  }

  const handleFeedback = useCallback(
    async (value) => {
      if (!canRate || feedbackState.status === "pending") return;
      setFeedbackState({ status: "pending", value });
      const result = await feedbackSubmitterRef.current.submit({
        requestLogId: message.requestLogId,
        value,
      });
      setFeedbackState({
        status: result.status,
        value:
          result.status === "submitted"
            ? result.value
            : null,
      });
    },
    [
      canRate,
      feedbackState.status,
      message.requestLogId,
    ],
  );
  const handleHelpfulFeedback = useCallback(
    () => handleFeedback("up"),
    [handleFeedback],
  );
  const handleUnhelpfulFeedback = useCallback(
    () => handleFeedback("down"),
    [handleFeedback],
  );

  return (
    <View
      key={message.id ?? index}
      className={`gap-1.5 mb-4 ${isUser ? "items-end" : "items-start"}`}
    >
      {!isUser ? (
        <View className="ml-1 flex-row items-center gap-1.5">
          <GenieAvatar size={18} />
          <Text
            className="text-[10px] uppercase tracking-[0.8px] text-zinc-500"
            style={{ fontFamily: TOKENS.font.semibold }}
          >
            {t("aiPlanner.botLabel")}
          </Text>
          <Pressable
            onPress={() =>
              isSpeaking
                ? stopSpeaking()
                : speakText(message.text ?? message.content)
            }
            hitSlop={8}
          >
            <MaterialIconsRounded
              name={isSpeaking ? "stop-circle" : "volume-up"}
              size={14}
              color="#64748B"
            />
          </Pressable>
        </View>
      ) : null}

      {isUser ? (
        <LinearGradient
          colors={["#2563EB", "#1D4ED8", "#4338CA"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 20, borderTopRightRadius: 4 }}
          className="max-w-[85%] px-4 py-3.5"
        >
          <Text
            className="text-[14.5px] leading-[22px] text-white"
            style={{ fontFamily: TOKENS.font.medium }}
          >
            {message.text ?? message.content}
          </Text>
        </LinearGradient>
      ) : (
        <View
          className="max-w-[85%] rounded-[20px] rounded-tl-sm border border-slate-100 bg-white/90 px-4 py-3.5"
          style={{ boxShadow: "0 8px 24px rgba(15, 23, 42, 0.04)" }}
        >
          <Text
            className="text-[14.5px] leading-[22px] text-zinc-800"
            style={{ fontFamily: TOKENS.font.body }}
          >
            {message.text ?? message.content}
          </Text>
        </View>
      )}

      {!isUser && message.plan ? (
        <View
          className="mt-3.5 w-full gap-3 rounded-3xl border border-emerald-100 bg-white p-4"
          style={{ boxShadow: "0 10px 30px rgba(16, 185, 129, 0.08)" }}
        >
          <View className="flex-row items-center gap-3">
            <LinearGradient
              colors={["#10B981", "#059669"]}
              className="h-10 w-10 items-center justify-center rounded-2xl"
            >
              <MaterialIconsRounded name="auto-awesome" size={20} color="#FFFFFF" />
            </LinearGradient>
            <View className="flex-1">
              <Text
                className="text-[11px] uppercase tracking-wider text-emerald-600"
                style={{ fontFamily: TOKENS.font.semibold }}
              >
                {t("aiPlanner.tripCreatedSuccess")}
              </Text>
              <Text
                className="text-[15px] text-slate-900"
                style={{ fontFamily: TOKENS.font.semibold }}
                numberOfLines={1}
              >
                {message.plan.title || "Lịch trình Cần Thơ"}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between rounded-2xl bg-slate-50 px-3.5 py-2.5">
            <View className="flex-row items-center gap-1.5">
              <MaterialIconsRounded name="event-note" size={16} color="#059669" />
              <Text
                className="text-xs text-slate-700"
                style={{ fontFamily: TOKENS.font.medium }}
              >
                {message.plan.totalDays || 1} {t("common.days", { defaultValue: "ngày" })}
              </Text>
            </View>

            {message.plan.destinations?.length ? (
              <View className="flex-row items-center gap-1.5">
                <MaterialIconsRounded name="place" size={16} color="#059669" />
                <Text
                  className="text-xs text-slate-700"
                  style={{ fontFamily: TOKENS.font.medium }}
                >
                  {message.plan.destinations.length} {t("aiPlanner.destinationCount_other", { defaultValue: "địa điểm" })}
                </Text>
              </View>
            ) : null}
          </View>

          <Pressable
            onPress={() => {
              const tripId = Number(message.plan.id);
              if (tripId) {
                router.push(`/trip/${tripId}`);
              } else {
                router.push("/(tabs)/trips");
              }
            }}
            className="overflow-hidden rounded-2xl"
          >
            <LinearGradient
              colors={["#059669", "#047857"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="flex-row items-center justify-center gap-2 py-3 px-4"
            >
              <Text
                className="text-[14px] text-white"
                style={{ fontFamily: TOKENS.font.semibold }}
              >
                {t("aiPlanner.viewCreatedTrip")}
              </Text>
              <MaterialIconsRounded name="arrow-forward" size={18} color="#FFFFFF" />
            </LinearGradient>
          </Pressable>
        </View>
      ) : null}

      {!isUser &&
      message.source === "chat" &&
      (message.suggestedPlaces?.length ?? 0) > 0 ? (
        <View className="mt-2 w-full gap-2">
          {message.suggestedPlaces.map((place, i) => (
            <PlacePreviewCard
              key={place.id || `chat-place-${i}`}
              place={place}
              compact={isCompactCard}
              showCloseButton={false}
              onViewDetail={handleOpenPlace}
            />
          ))}
        </View>
      ) : null}

      {canRate ? (
        <View style={styles.feedbackRow}>
          {FEEDBACK_OPTIONS.map((value) => {
            const selected =
              feedbackState.status === "submitted" &&
              feedbackState.value === value;
            const disabled =
              feedbackState.status === "pending" ||
              feedbackState.status === "submitted";
            return (
              <Pressable
                key={value}
                accessibilityLabel={
                  value === "up"
                    ? t("aiPlanner.feedbackHelpful", {
                        defaultValue: "Helpful response",
                      })
                    : t("aiPlanner.feedbackNotHelpful", {
                        defaultValue: "Not helpful response",
                      })
                }
                accessibilityRole="button"
                accessibilityState={{ disabled, selected }}
                disabled={disabled}
                hitSlop={2}
                onPress={
                  value === "up"
                    ? handleHelpfulFeedback
                    : handleUnhelpfulFeedback
                }
                style={[
                  styles.feedbackButton,
                  selected && styles.feedbackButtonSelected,
                  disabled &&
                    !selected &&
                    styles.feedbackButtonDisabled,
                ]}
              >
                {feedbackState.status === "pending" &&
                feedbackState.value === value ? (
                  <ActivityIndicator size="small" color="#64748B" />
                ) : (
                  <MaterialIconsRounded
                    name={
                      value === "up"
                        ? "thumb-up"
                        : "thumb-down"
                    }
                    size={17}
                    color={selected ? "#0369A1" : "#64748B"}
                  />
                )}
              </Pressable>
            );
          })}
          {feedbackState.status === "error" ? (
            <Text
              accessibilityLiveRegion="polite"
              style={styles.feedbackError}
            >
              {t("aiPlanner.feedbackError", {
                defaultValue: "Could not send feedback. Try again.",
              })}
            </Text>
          ) : null}
        </View>
      ) : null}

      {!isUser && (message.quickReplies?.length ?? 0) > 0 ? (
        <View className="mt-2 max-w-[92%] flex-row flex-wrap gap-2">
          {message.quickReplies.slice(0, 4).map((reply) => (
            <Pressable
              key={reply}
              onPress={() => handleSend(reply)}
              className="rounded-full border border-slate-200 bg-white px-3.5 py-2"
              style={{ boxShadow: "0 6px 16px rgba(15, 23, 42, 0.04)" }}
            >
              <Text
                className="text-xs text-slate-700"
                style={{ fontFamily: TOKENS.font.semibold }}
              >
                {reply}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {!isUser &&
      message.isDraftPreview &&
      (draftPlan?.suggestedPlaces?.length ?? 0) > 0 ? (
        <View
          className="mt-4 w-full gap-4 rounded-3xl border border-slate-100 bg-white p-4"
          style={{ boxShadow: "0 12px 34px rgba(15, 23, 42, 0.06)" }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text
                className="text-[14.5px] text-slate-950"
                style={{ fontFamily: TOKENS.font.semibold }}
              >
                {t("aiPlanner.selectPlaces")}
              </Text>
              <Text
                className="mt-0.5 text-xs text-slate-400"
                style={{ fontFamily: TOKENS.font.body }}
              >
                {t("aiPlanner.selectingCount", {
                  selected: selectedPlaceIds.length,
                  total: draftPlan.suggestedPlaces.length,
                })}
              </Text>
            </View>

            <View className="flex-row items-center gap-1.5">
              <Pressable
                onPress={selectAllPlaces}
                className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1.5"
              >
                <Text
                  className="text-[11px] text-sky-700"
                  style={{ fontFamily: TOKENS.font.semibold }}
                >
                  {t("aiPlanner.selectAll")}
                </Text>
              </Pressable>
              <Pressable
                onPress={clearSelectedPlaces}
                className="rounded-full border border-slate-100 bg-slate-50 px-3 py-1.5"
              >
                <Text
                  className="text-[11px] text-slate-500"
                  style={{ fontFamily: TOKENS.font.semibold }}
                >
                  {t("aiPlanner.deselect")}
                </Text>
              </Pressable>
            </View>
          </View>

          <View className="gap-3">
            {draftPlan.suggestedPlaces.map((place, pIdx) => {
              const placeId = Number(place?.id);
              const isSelected = selectedPlaceIds.includes(placeId);

              return (
                <PlacePreviewCard
                  key={placeId || `${place?.name || "place"}-${pIdx}`}
                  place={place}
                  compact={isCompactCard}
                  selected={isSelected}
                  showCloseButton={false}
                  showSelectionAction
                  selectedLabel={t("aiPlanner.selected")}
                  unselectedLabel={t("aiPlanner.selectPlace")}
                  detailLabel={t("aiPlanner.details")}
                  onViewDetail={handleOpenPlace}
                  onToggleSelection={handleTogglePlace}
                />
              );
            })}
          </View>

          <Pressable
            onPress={handleConfirmSelection}
            disabled={!canConfirmSelection || isConfirming}
            style={[
              styles.confirmBtn,
              (!canConfirmSelection || isConfirming) &&
                styles.confirmBtnDisabled,
            ]}
          >
            <LinearGradient
              colors={
                !canConfirmSelection || isConfirming
                  ? ["#E2E8F0", "#E2E8F0"]
                  : ["#3478F6", "#1E3A8A"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.confirmGradientInner}
            >
              {isConfirming ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <MaterialIconsRounded
                  name="auto-awesome-motion"
                  size={18}
                  color={
                    !canConfirmSelection || isConfirming
                      ? "#94A3B8"
                      : "#FFFFFF"
                  }
                />
              )}
              <Text
                style={[
                  styles.confirmTextBase,
                  !canConfirmSelection || isConfirming
                    ? styles.confirmTextDisabled
                    : styles.confirmTextEnabled,
                  { fontFamily: TOKENS.font.semibold },
                ]}
              >
                {t("aiPlanner.createFromSelection")}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      ) : null}

      {!isUser &&
      message.isDraftPreview &&
      !(draftPlan?.suggestedPlaces?.length > 0) &&
      (message.suggestedPlaces?.length ?? 0) > 0 ? (
        <View className="mt-2 w-full gap-2">
          {message.suggestedPlaces.map((place, pIdx) => (
            <PlacePreviewCard
              key={place.id || `preview-place-${pIdx}`}
              place={place}
              compact={isCompactCard}
              showCloseButton={false}
              onViewDetail={handleOpenPlace}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

export const AIPlannerMessageItem = memo(
  AIPlannerMessageItemComponent,
);
