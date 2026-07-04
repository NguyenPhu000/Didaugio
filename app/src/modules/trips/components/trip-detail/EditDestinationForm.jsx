import { memo, useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Modal,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import {
  formatDistance,
  calcDurationMinutes,
  formatDuration,
  TRANSPORT_OPTIONS,
  isTransportSelected,
  toTimeSortValue,
} from "../../utils/tripHelpers";
import { STYLES, T, ALPHA } from "../../utils/tripDetailTokens";
import { cn } from "@/lib/cn";
import TimeField from "./TimeField";
import CustomAlertModal from "../../../../components/composed/CustomAlertModal";

function EditDestinationForm({ dest, onSave, onCancel, isLoading, visible, isLast }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [startTime, setStartTime] = useState(dest?.startTime || "");
  const [endTime, setEndTime] = useState(dest?.endTime || "");
  const [note, setNote] = useState(dest?.note || "");
  const [transportToNext, setTransportToNext] = useState(dest?.transportToNext || null);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: "", message: "" });

  useEffect(() => {
    if (visible) {
      setStartTime(dest?.startTime || "");
      setEndTime(dest?.endTime || "");
      setNote(dest?.note || "");
      setTransportToNext(dest?.transportToNext || null);
    }
  }, [visible, dest]);

  const calculatedDuration = calcDurationMinutes(startTime, endTime);
  const durationLabel = formatDuration(calculatedDuration);

  const handleSave = useCallback(() => {
    if (isLoading || !dest?.id) return;

    if (startTime && endTime && toTimeSortValue(endTime) < toTimeSortValue(startTime)) {
      setAlertConfig({
        visible: true,
        title: t('editDestination.invalidTime'),
        message: t('editDestination.endTimeError'),
      });
      return;
    }

    const finalDuration = typeof calculatedDuration === "number" && !isNaN(calculatedDuration) && calculatedDuration > 0
      ? calculatedDuration
      : 0;

    onSave({
      destId: dest.id,
      data: {
        startTime: startTime || null,
        endTime: endTime || null,
        durationMinutes: finalDuration,
        note: note || null,
        transportToNext: isLast ? null : transportToNext,
      },
    });
  }, [dest?.id, startTime, endTime, calculatedDuration, note, transportToNext, onSave, isLoading, isLast, t]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View className="flex-1 justify-end">
        <Pressable style={StyleSheet.absoluteFillObject} className="bg-black/45" onPress={onCancel} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1 justify-end w-full"
          pointerEvents="box-none"
        >
          <View
            className="bg-white rounded-t-[24px] max-h-[90%] w-full flex-col flex-shrink"
            style={{ paddingBottom: Math.max(insets.bottom, 16) }}
          >
            <View className="w-9 h-1 rounded-full bg-black/12 self-center mt-2.5 mb-1" />

            {/* Header: tiêu đề + đóng */}
            <View className="flex-row items-center justify-between px-5 py-3 border-b border-black/[0.07]">
              <View className="flex-row items-center gap-2 flex-1 mr-2">
                <MaterialIconsRounded name="edit-location" size={18} color={T.ink} />
                <Text className="text-[16px] font-semibold text-ink tracking-tight">{t('editDestination.editPlace')}</Text>
              </View>
              <Pressable
                onPress={onCancel}
                hitSlop={12}
                className="w-8 h-8 rounded-full items-center justify-center active:bg-black/[0.06]"
              >
                <MaterialIconsRounded name="close" size={18} color={ALPHA.iconStrong} />
              </Pressable>
            </View>

            {dest?.place?.name ? (
              <Text className="text-[13px] text-black/[0.45] font-normal px-5 pt-2 tracking-tight" numberOfLines={1}>
                {dest.place.name}
              </Text>
            ) : null}

            <ScrollView
              className="max-h-[280px] flex-shrink"
              contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 12, gap: 14 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* THỜI GIAN CHI TIẾT */}
              <Text className={STYLES.sectionLabel}>{t('editDestination.detailTime')}</Text>
              <View className="flex-row gap-3">
                <TimeField
                  label={t('editDestination.start')}
                  value={startTime}
                  onChange={setStartTime}
                  placeholder="--:--"
                  icon="play-circle-outline"
                />
                <TimeField
                  label={t('editDestination.end')}
                  value={endTime}
                  onChange={setEndTime}
                  placeholder="--:--"
                  icon="stop-circle"
                />
              </View>

              {durationLabel ? (
                <View className="flex-row items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#F5F5F7]">
                  <MaterialIconsRounded name="schedule" size={16} color={T.ink} />
                  <Text className="text-[13px] font-medium text-ink tracking-tight">
                    {t('editDestination.stayDuration', { duration: durationLabel })}
                  </Text>
                </View>
              ) : null}

              {!isLast ? (
                <View className="pt-4 mt-1 border-t border-black/[0.08]">
                  <Text className={STYLES.sectionLabel}>{t('editDestination.moveToNext')}</Text>

                  <View className="gap-1.5">
                    <Text className={STYLES.fieldLabel}>{t('editDestination.transport')}</Text>
                    <View className="flex-row gap-2 flex-wrap mt-1">
                      {TRANSPORT_OPTIONS.map((opt) => {
                        const isSelected = isTransportSelected(transportToNext, opt.value);
                        return (
                          <Pressable
                            key={opt.label || "other"}
                            onPress={() => setTransportToNext(opt.value)}
                            className={`${STYLES.chip} ${isSelected ? STYLES.chipActive : ""}`}
                          >
                            <MaterialIconsRounded
                              name={opt.icon}
                              size={16}
                              color={isSelected ? T.ink : ALPHA.iconStrong}
                            />
                            <Text className={cn(
                              "text-[13px] font-semibold",
                              isSelected ? "text-ink" : "text-black/60",
                            )}>
                              {opt.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  {dest?.distanceToNext ? (
                    <View className="gap-1.5 mt-2.5">
                      <Text className={STYLES.fieldLabel}>{t('editDestination.distanceToNext')}</Text>
                      <View className="flex-row items-center gap-1.5 bg-[#F5F5F7] rounded-xl px-3 py-3 border border-black/[0.06]">
                        <MaterialIconsRounded name="navigation" size={14} color={ALPHA.iconStrong} style={{ transform: [{ rotate: "45deg" }] }} />
                        <Text className="text-[14px] text-black/50 font-normal">
                          {formatDistance(dest.distanceToNext)} {t('editDestination.autoCalculated')}
                        </Text>
                      </View>
                    </View>
                  ) : null}
                </View>
              ) : null}

              {/* GHI CHÚ HÀNH TRÌNH */}
              <View className="pt-4 mt-1 border-t border-black/[0.08]">
                <Text className={STYLES.sectionLabel}>{t('editDestination.tripNotes')}</Text>
                <View className="gap-1.5">
                  <TextInput
                    className={`${STYLES.field} min-h-[72px]`}
                    value={note}
                    onChangeText={setNote}
                    placeholder={t('editDestination.notesPlaceholder')}
                    placeholderTextColor={ALPHA.placeholder}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>
              </View>
            </ScrollView>

            {/* Nút Lưu pill — luôn cố định dưới cùng */}
            <View className={STYLES.sheetFooter}>
              <Pressable
                onPress={handleSave}
                disabled={isLoading}
                style={({ pressed }) => [pressed && !isLoading && { opacity: 0.8 }]}
                className={`${STYLES.submitBtn} ${isLoading ? "opacity-50" : ""}`}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={T.onPrimary} />
                ) : (
                  <Text className={STYLES.submitBtnText}>{t('editDestination.save')}</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>

      <CustomAlertModal
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type="error"
        onConfirm={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
    </Modal>
  );
}

export default memo(EditDestinationForm);
