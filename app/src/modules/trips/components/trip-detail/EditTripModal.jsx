import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { CustomDatePicker } from "../../../../components/ui/CustomDatePicker";
import { compressImageToDataUrl } from "../../../../lib/image-compress";
import { resolveMediaUrl } from "../../../../lib/media-url";
import { toYmdString, toValidDate } from "../../utils/tripHelpers";
import CustomAlertModal from "../../../../components/composed/CustomAlertModal";

function calcTotalDays(start, end) {
  if (!start || !end) return 1;
  const ms = end.getTime() - start.getTime();
  const days = Math.round(ms / (1000 * 60 * 60 * 24)) + 1;
  return days > 0 ? days : 1;
}

function EditTripModal({ visible, trip, isSaving, onCancel, onSave }) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [pendingThumbnail, setPendingThumbnail] = useState(undefined);
  const [isProcessingThumbnail, setIsProcessingThumbnail] = useState(false);
  const [avoidFerry, setAvoidFerry] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: "", message: "", type: "error" });

  const wasVisible = useRef(false);

  useEffect(() => {
    if (visible && !wasVisible.current) {
      setTitle(trip?.title || "");
      setDescription(trip?.description || "");
      setStartDate(toValidDate(trip?.startDate));
      setEndDate(toValidDate(trip?.endDate));
      setThumbnailPreview(resolveMediaUrl(trip?.thumbnail));
      setPendingThumbnail(undefined);
    }
    if (visible && trip?.id) {
      AsyncStorage.getItem(`trip_avoidFerry_${trip.id}`).then((val) => {
        setAvoidFerry(val === "true");
      });
    }
    wasVisible.current = visible;
  }, [visible, trip]);

  const handlePickThumbnail = useCallback(async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setAlertConfig({
          visible: true,
          title: t('editTrip.noPhotoAccess'),
          message: t('editTrip.noPhotoAccessDesc'),
          type: "warning",
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 1,
      });

      const selectedUri = result?.assets?.[0]?.uri;
      if (result.canceled || !selectedUri) return;

      setIsProcessingThumbnail(true);
      const compressed = await compressImageToDataUrl(selectedUri, {
        startWidth: 1280,
      });
      setThumbnailPreview(compressed.dataUrl);
      setPendingThumbnail(compressed.dataUrl);
    } catch (error) {
      setAlertConfig({
        visible: true,
        title: t('editTrip.error'),
        message: error?.message || t('editTrip.imageError'),
        type: "error",
      });
    } finally {
      setIsProcessingThumbnail(false);
    }
  }, []);

  const handleRemoveThumbnail = useCallback(() => {
    setThumbnailPreview(null);
    setPendingThumbnail(null);
  }, []);

  const handleStartDateChange = useCallback(
    (date) => {
      setStartDate(date);
      if (date && endDate && endDate < date) {
        setEndDate(null);
      }
    },
    [endDate],
  );

  const handleSave = useCallback(async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle || isSaving) return;

    if (startDate && endDate && endDate < startDate) {
      setAlertConfig({
        visible: true,
        title: t('editTrip.invalidDate'),
        message: t('editTrip.endDateError'),
        type: "error",
      });
      return;
    }

    if (trip?.id) {
      try {
        await AsyncStorage.setItem(`trip_avoidFerry_${trip.id}`, String(avoidFerry));
      } catch (e) {
        console.error("Lỗi khi lưu cấu hình tránh phà:", e);
      }
    }

    onSave({
      title: trimmedTitle,
      description: description.trim() || null,
      startDate: startDate ? toYmdString(startDate) : null,
      endDate: endDate ? toYmdString(endDate) : null,
      totalDays: calcTotalDays(startDate, endDate),
      ...(pendingThumbnail !== undefined && { thumbnail: pendingThumbnail }),
    });
  }, [description, endDate, isSaving, onSave, startDate, title, pendingThumbnail, avoidFerry, trip?.id]);

  const canSave = title.trim().length > 0 && !isSaving && !isProcessingThumbnail;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View className="flex-1 justify-end">
        <Pressable style={StyleSheet.absoluteFillObject} className="bg-black/40" onPress={onCancel} />
        <KeyboardAvoidingView
          className="w-full max-h-[85%]"
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View
            className="bg-white rounded-t-[24px] flex-shrink"
            style={{ paddingBottom: Platform.OS === "ios" ? 24 : 16 }}
          >
            <View className="w-9 h-1 rounded-full bg-black/12 self-center mt-2.5 mb-1.5" />
            <View className="flex-row items-center justify-between px-5 py-3 border-b border-black/[0.07]">
              <View className="flex-row items-center gap-2">
                <MaterialIconsRounded name="edit-calendar" size={18} color="#1D1D1F" />
                <Text className="text-[16px] font-semibold text-[#1D1D1F] tracking-tight">{t('editTrip.editTrip')}</Text>
              </View>
              <Pressable
                onPress={onCancel}
                hitSlop={12}
                style={({ pressed }) => [
                  pressed && { backgroundColor: "rgba(0,0,0,0.06)" },
                ]}
                className="w-8 h-8 rounded-full items-center justify-center"
              >
                <MaterialIconsRounded name="close" size={20} color="rgba(0,0,0,0.45)" />
              </Pressable>
            </View>

            <ScrollView
              className="flex-shrink"
              contentContainerStyle={{ padding: 20, gap: 14 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
              nestedScrollEnabled
            >
              <View className="gap-1.5">
                <Text className="text-[11px] text-black/40 font-semibold uppercase tracking-widest">{t('editTrip.coverPhoto')}</Text>
                <Pressable
                  onPress={handlePickThumbnail}
                  disabled={isProcessingThumbnail}
                  className="w-full h-[160px] rounded-2xl overflow-hidden bg-[#F5F5F7] border border-black/[0.06] items-center justify-center"
                >
                  {thumbnailPreview ? (
                    <Image
                      source={{ uri: thumbnailPreview }}
                      style={StyleSheet.absoluteFillObject}
                      contentFit="cover"
                      transition={200}
                    />
                  ) : (
                    <View className="items-center gap-2">
                      <MaterialIconsRounded name="add-photo-alternate" size={32} color="rgba(0,0,0,0.3)" />
                      <Text className="text-[13px] text-black/40 font-medium">{t('editTrip.tapToSelect')}</Text>
                    </View>
                  )}

                  {isProcessingThumbnail ? (
                    <View className="absolute inset-0 items-center justify-center bg-black/30">
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    </View>
                  ) : null}

                  {thumbnailPreview && !isProcessingThumbnail ? (
                    <View className="absolute top-2.5 right-2.5 flex-row gap-2">
                      <View className="flex-row items-center gap-1 px-2.5 py-1.5 rounded-full bg-black/55">
                        <MaterialIconsRounded name="edit" size={13} color="#FFFFFF" />
                        <Text className="text-white text-[11px] font-semibold">{t('editTrip.changePhoto')}</Text>
                      </View>
                      <Pressable
                        onPress={handleRemoveThumbnail}
                        hitSlop={8}
                        className="w-7 h-7 rounded-full bg-black/55 items-center justify-center"
                      >
                        <MaterialIconsRounded name="close" size={15} color="#FFFFFF" />
                      </Pressable>
                    </View>
                  ) : null}
                </Pressable>
              </View>

              <View className="gap-1.5">
                <Text className="text-[11px] text-black/40 font-semibold uppercase tracking-widest">{t('editTrip.tripName')}</Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder={t('editTrip.tripNamePlaceholder')}
                  placeholderTextColor="rgba(0,0,0,0.3)"
                  className="bg-[#F5F5F7] rounded-xl px-3 py-3 text-[15px] color-[#1D1D1F] font-normal border border-black/[0.06]"
                  returnKeyType="next"
                />
              </View>

              <View className="gap-1.5">
                <Text className="text-[11px] text-black/40 font-semibold uppercase tracking-widest">{t('editTrip.description')}</Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder={t('editTrip.descPlaceholder')}
                  placeholderTextColor="rgba(0,0,0,0.3)"
                  className="bg-[#F5F5F7] rounded-xl px-3 py-3 text-[15px] color-[#1D1D1F] font-normal border border-black/[0.06] min-h-[84px]"
                  multiline
                  textAlignVertical="top"
                />
              </View>

              <View className="rounded-2xl bg-[#F5F5F7] px-3 py-1 border border-black/[0.06]">
                <CustomDatePicker
                  label={t('editTrip.startDate')}
                  value={startDate}
                  onChange={handleStartDateChange}
                  placeholder={t('editTrip.selectDate')}
                />
                <View className="h-[0.5px] bg-black/[0.08]" />
                <CustomDatePicker
                  label={t('editTrip.endDate')}
                  value={endDate}
                  onChange={setEndDate}
                  minimumDate={startDate ?? undefined}
                  placeholder={t('editTrip.selectDate')}
                />
              </View>


              <View className="rounded-2xl bg-[#F5F5F7] px-4 py-3.5 border border-black/[0.06] flex-row items-center justify-between">
                <View className="flex-row items-center gap-3 flex-1">
                  <View className="w-9 h-9 rounded-xl bg-white items-center justify-center border border-black/[0.06]">
                    <MaterialIconsRounded name="directions-boat" size={18} color={avoidFerry ? "#FF9500" : "rgba(0,0,0,0.35)"} />
                  </View>
                  <View className="flex-1 gap-0.5">
                    <Text className="text-[15px] font-semibold text-[#1D1D1F] tracking-tight">{t('editTrip.avoidFerry')}</Text>
                    <Text className="text-[12px] text-black/40 tracking-tight">{t('editTrip.avoidFerryDesc')}</Text>
                  </View>
                </View>
                <Switch
                  value={avoidFerry}
                  onValueChange={setAvoidFerry}
                  trackColor={{ false: "rgba(0,0,0,0.12)", true: "#34C759" }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor="rgba(0,0,0,0.12)"
                />
              </View>
            </ScrollView>

            <View className="px-5 pt-4 pb-2 border-t border-black/[0.07] bg-white flex-shrink-0">
              <TouchableOpacity
                onPress={handleSave}
                disabled={!canSave}
                activeOpacity={0.8}
                className={`w-full h-[52px] rounded-full bg-[#1D1D1F] items-center justify-center ${
                  !canSave ? "opacity-50" : ""
                }`}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-white text-[16px] font-semibold tracking-tight text-center">{t('editTrip.save')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>

      <CustomAlertModal
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onConfirm={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
    </Modal>
  );
}

export default memo(EditTripModal);
