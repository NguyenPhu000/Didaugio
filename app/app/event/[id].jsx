import { useCallback, useEffect, useState, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import safeAsyncStorage from "../../src/utils/safeAsyncStorage";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "../../src/stores/authStore";
import {
  useEventDetail,
  useEventMoments,
  useJoinEvent,
  useCreateMoment,
} from "../../src/modules/explore/hooks/useEvents";
import {
  BOOKING_APPLE_THEME as APPLE_THEME,
  TOKENS,
} from "../../src/constants/design-tokens";
import { resolveMediaUrl, getOptimizedCloudinaryUrl } from "../../src/lib/media-url";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { formatFullDate, formatFullDateNoWeekday } from "../../src/utils/dateFormat";

const SCREEN_W = Dimensions.get("window").width;

export default function EventDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  const { data: event, isLoading, refetch } = useEventDetail(id, !!id);
  const { data: momentsData, refetch: refetchMoments } = useEventMoments(id, {}, !!id);
  const joinEventMutation = useJoinEvent();
  const createMomentMutation = useCreateMoment();

  const [activeTab, setActiveTab] = useState("info"); // info | moments
  const [personalCheckedIn, setPersonalCheckedIn] = useState({});
  const [uploadingChặngId, setUploadingChặngId] = useState(null);
  const [selectedMoment, setSelectedMoment] = useState(null);

  // Moments list
  const moments = useMemo(() => {
    return momentsData?.data || momentsData || [];
  }, [momentsData]);

  // Load progress từ safeAsyncStorage
  useEffect(() => {
    const loadProgress = async () => {
      try {
        if (!id) return;
        const keys = await safeAsyncStorage.getAllKeys();
        const eventPrefix = `didaugio:event:${id}:checkedin:`;
        const eventKeys = keys.filter(key => key.startsWith(eventPrefix));
        if (eventKeys.length === 0) {
          setPersonalCheckedIn({});
          return;
        }
        const pairs = await safeAsyncStorage.multiGet(eventKeys);
        const progress = {};
        pairs.forEach(([key, val]) => {
          const placeId = key.replace(eventPrefix, "");
          progress[placeId] = val === "true";
        });
        setPersonalCheckedIn(progress);
      } catch (err) {
        console.error("Lỗi đọc tiến trình chặng:", err);
      }
    };
    loadProgress();
  }, [id]);

  // Tính số lượng chặng đã check-in
  const destinations = event?.trip?.destinations || [];
  const totalDestinations = destinations.length;
  const checkedInCount = useMemo(() => {
    let count = 0;
    destinations.forEach(dest => {
      if (personalCheckedIn[dest.placeId]) {
        count++;
      }
    });
    return count;
  }, [destinations, personalCheckedIn]);

  const progressPercent = totalDestinations > 0 ? (checkedInCount / totalDestinations) : 0;

  // Xử lý Tham gia Sự kiện
  const handleJoinEvent = useCallback(async () => {
    if (!user) {
      Alert.alert(t("event.loginRequired"), t("event.loginRequiredMessage"), [
        { text: t("common.cancel"), style: "cancel" },
        { text: t("common.login"), onPress: () => router.push("/(auth)/login") },
      ]);
      return;
    }

    Alert.alert(
      t("event.joinEvent"),
      t("event.joinEventMessage"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.confirm"),
          onPress: async () => {
            try {
              const res = await joinEventMutation.mutateAsync(id);
              // Best-effort: lưu mapping event→trip, không crash nếu storage đầy
              if (res?.clonedTrip?.id) {
                try {
                  await safeAsyncStorage.setItem(
                    `didaugio:active_event_trip:${res.clonedTrip.id}`,
                    String(id)
                  );
                } catch (storageErr) {
                  console.warn("Không thể lưu mapping event trip:", storageErr?.message);
                }
              }
              Alert.alert(t("event.success"), t("event.successMessage"), [
                {
                  text: t("event.goToTrips"),
                  onPress: () => {
                    // Navigate to trips tab
                    router.replace("/(tabs)/trips");
                  }
                },
                {
                  text: t("event.stay"),
                  onPress: () => refetch()
                }
              ]);
            } catch (err) {
              Alert.alert(t("event.error"), err?.message || t("event.joinErrorMessage"));
            }
          }
        }
      ]
    );
  }, [id, user, router, joinEventMutation, refetch]);

  // Xử lý check-in chụp ảnh tại chặng
  const handleCheckInChặng = useCallback(async (dest) => {
    if (!event?.isJoined) {
      Alert.alert(t("event.notJoined"), t("event.notJoinedMessage"));
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(t("event.cameraPermission"), t("event.cameraPermissionMessage"));
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return;

    const uri = result.assets[0].uri;
    setUploadingChặngId(dest.id);

    try {
      // Nén ảnh về 400x400 JPEG (~30KB)
      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 400, height: 400 } }],
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Đọc ảnh thành base64 qua Promise wrapper
      const response = await fetch(manipulated.uri);
      const blob = await response.blob();
      const base64data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Cannot read image"));
        reader.readAsDataURL(blob);
      });

      // Upload ảnh lên server
      await createMomentMutation.mutateAsync({
        id: id,
        payload: {
          placeId: dest.placeId,
          imageUrl: base64data,
        }
      });

      // Cập nhật UI ngay — không phụ thuộc safeAsyncStorage
      setPersonalCheckedIn(prev => ({ ...prev, [dest.placeId]: true }));

      // Lưu trạng thái check-in cục bộ — best-effort
      try {
        const key = `didaugio:event:${id}:checkedin:${dest.placeId}`;
        await safeAsyncStorage.setItem(key, "true");
      } catch (storageErr) {
        console.warn("Không thể lưu trạng thái check-in cục bộ:", storageErr?.message);
      }

      Alert.alert(t("event.success"), t("event.checkinSuccess"));
      refetchMoments();
      refetch();
    } catch (err) {
      console.error("Check-in error:", err);
      Alert.alert(t("event.error"), err?.message || t("event.checkinError"));
    } finally {
      setUploadingChặngId(null);
    }
  }, [id, event, createMomentMutation, refetch, refetchMoments]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F4F7FB]">
        <ActivityIndicator size="large" color="#0071E3" />
      </View>
    );
  }

  if (!event) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F4F7FB] px-6">
        <Text className="text-[#1D1D1F] text-[18px] font-semibold text-center mb-4">
          {t("event.notFound")}
        </Text>
        <Pressable onPress={() => router.back()} className="h-10 px-6 rounded-full bg-[#1D1D1F] items-center justify-center">
          <Text className="text-white font-semibold">{t("event.goBack")}</Text>
        </Pressable>
      </View>
    );
  }

  const rawImage = event.thumbnail || event.imageUrl;
  const imageUri = rawImage ? getOptimizedCloudinaryUrl(resolveMediaUrl(rawImage), 800) : "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80";

  return (
    <View className="flex-1 bg-[#F4F7FB]">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}>
        {/* Banner Image */}
        <View className="w-full h-[280px] relative bg-[#EDEDF2]">
          <Image source={{ uri: imageUri }} contentFit="cover" style={{ width: "100%", height: "100%" }} />
          <View className="absolute inset-0 bg-black/20" />
          <LinearGradient
            colors={["rgba(0,0,0,0.6)", "transparent"]}
            start={{ x: 0, y: 1 }}
            end={{ x: 0, y: 0 }}
            style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "40%" }}
          />

          {/* Floated Header Buttons */}
          <View 
            style={{ top: Math.max(12, insets.top) }} 
            className="absolute left-4 right-4 flex-row justify-between items-center z-[5]"
          >
            <Pressable 
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full items-center justify-center bg-black/40 overflow-hidden"
            >
              <BlurView intensity={30} style={{ position: "absolute", inset: 0 }} />
              <MaterialIconsRounded name="arrow-back" size={22} color="#FFFFFF" />
            </Pressable>

            {event.totalActiveCompanionCount > 0 ? (
              <View className="px-3 py-1.5 rounded-full bg-[#34C759] border border-white/20 flex-row items-center gap-1.5 shadow-sm">
                <View className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <Text className="text-white text-[11px] font-bold" style={{ fontFamily: TOKENS.font.bold }}>
                  {event.totalActiveCompanionCount} {t("event.online")}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Event Title Block */}
        <View className="bg-white px-5 py-5 rounded-b-[32px] shadow-sm mb-4 border-b border-black/5">
          <View className="flex-row items-center gap-2 mb-2">
            <View className="px-2.5 py-0.5 rounded-full bg-[#0071E3]/10">
              <Text className="text-[#0071E3] text-[11px] font-bold" style={{ fontFamily: TOKENS.font.bold }}>
                {t("event.communityEvent")}
              </Text>
            </View>
            <Text className="text-black/40 text-[12px] font-medium" style={{ fontFamily: TOKENS.font.medium }}>
              {t("event.location")}
            </Text>
          </View>

          <Text className="text-[#1D1D1F] text-[24px] leading-8 font-bold tracking-tight mb-3" style={{ fontFamily: TOKENS.font.heading }}>
            {event.title}
          </Text>

          {/* Quick Stats Grid */}
          <View className="flex-row items-center gap-4 py-3 border-y border-black/[0.06] mb-4">
            <View className="flex-1 flex-row items-center gap-2">
              <View className="w-8 h-8 rounded-full bg-blue-50 items-center justify-center">
                <MaterialIconsRounded name="people" size={16} color="#0071E3" />
              </View>
              <View>
                <Text className="text-black/40 text-[10px] font-bold uppercase" style={{ fontFamily: TOKENS.font.bold }}>{t("event.participants")}</Text>
                <Text className="text-[#1D1D1F] text-[13px] font-bold" style={{ fontFamily: TOKENS.font.semibold }}>
                  {event._count?.participants || event.participantCount || 0} {t("event.people")}
                </Text>
              </View>
            </View>

            <View className="flex-1 flex-row items-center gap-2">
              <View className="w-8 h-8 rounded-full bg-green-50 items-center justify-center">
                <MaterialIconsRounded name="photo-camera" size={16} color="#34C759" />
              </View>
              <View>
                <Text className="text-black/40 text-[10px] font-bold uppercase" style={{ fontFamily: TOKENS.font.bold }}>{t("event.checkins")}</Text>
                <Text className="text-[#1D1D1F] text-[13px] font-bold" style={{ fontFamily: TOKENS.font.semibold }}>
                  {event.totalCheckIns || 0} {t("event.times")}
                </Text>
              </View>
            </View>
          </View>

          {/* Date & Time info */}
          <View className="gap-2.5">
            <View className="flex-row items-center gap-3">
              <MaterialIconsRounded name="calendar-today" size={18} color="#8E8E93" />
              <View>
                <Text className="text-[#1D1D1F] text-[13px] font-semibold" style={{ fontFamily: TOKENS.font.semibold }}>
                  {formatFullDate(event.startDate)}
                </Text>
                <Text className="text-black/40 text-[11px] font-medium" style={{ fontFamily: TOKENS.font.medium }}>
                  {t("event.to")} {formatFullDateNoWeekday(event.endDate)}
                </Text>
              </View>
            </View>

            {event.description ? (
              <View className="mt-2.5">
                <Text className="text-[#1D1D1F]/70 text-[13px] leading-[20px] font-medium" style={{ fontFamily: TOKENS.font.body }}>
                  {event.description}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Tab Buttons */}
        <View className="flex-row px-4 mb-4 gap-2">
          <Pressable
            onPress={() => setActiveTab("info")}
            className={`flex-1 py-2.5 rounded-full items-center justify-center border ${
              activeTab === "info" ? "bg-white border-[#0071E3]/20 shadow-sm" : "bg-black/[0.03] border-transparent"
            }`}
          >
            <Text 
              className={`text-[13px] font-bold ${activeTab === "info" ? "text-[#0071E3]" : "text-black/60"}`}
              style={{ fontFamily: TOKENS.font.semibold }}
            >
              {t("event.itinerary")}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab("moments")}
            className={`flex-1 py-2.5 rounded-full items-center justify-center border ${
              activeTab === "moments" ? "bg-white border-[#0071E3]/20 shadow-sm" : "bg-black/[0.03] border-transparent"
            }`}
          >
            <Text 
              className={`text-[13px] font-bold ${activeTab === "moments" ? "text-[#0071E3]" : "text-black/60"}`}
              style={{ fontFamily: TOKENS.font.semibold }}
            >
              {t("event.momentsCheckin")} ({moments.length})
            </Text>
          </Pressable>
        </View>

        {/* TAB 1: INFO & TIMELINE */}
        {activeTab === "info" ? (
          <View className="px-4 gap-4">
            {/* Viễn cảnh 2: Tiến trình cá nhân */}
            {event.isJoined ? (
              <View className="bg-white p-4 rounded-2xl shadow-sm border border-black/5">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-[#1D1D1F] text-[15px] font-bold" style={{ fontFamily: TOKENS.font.heading }}>
                    {t("event.personalProgress")}
                  </Text>
                  <Text className="text-[#0071E3] text-[13px] font-bold" style={{ fontFamily: TOKENS.font.bold }}>
                    {checkedInCount}/{totalDestinations} {t("event.leg")}
                  </Text>
                </View>

                {/* Progress bar */}
                <View className="w-full h-2 rounded-full bg-black/5 overflow-hidden mb-2">
                  <View 
                    style={{ width: `${progressPercent * 100}%` }} 
                    className="h-full rounded-full bg-[#34C759]" 
                  />
                </View>

                <Text className="text-black/50 text-[11px] font-medium" style={{ fontFamily: TOKENS.font.body }}>
                  {progressPercent === 1 
                    ? t("event.allCheckedIn")
                    : t("event.checkinHint")}
                </Text>
              </View>
            ) : null}

            {/* Timeline Destinations */}
            <View className="bg-white p-4 rounded-2xl shadow-sm border border-black/5">
              <Text className="text-[#1D1D1F] text-[16px] font-bold mb-4" style={{ fontFamily: TOKENS.font.heading }}>
                {t("event.routeDetail")}
              </Text>

              {destinations.length === 0 ? (
                <Text className="text-black/40 text-[13px] text-center py-4">{t("event.noLegs")}</Text>
              ) : (
                destinations.map((dest, index) => {
                  const place = dest.place;
                  const isCheckedIn = personalCheckedIn[dest.placeId];
                  const isUploading = uploadingChặngId === dest.id;

                  return (
                    <View key={dest.id} className="flex-row gap-3 pb-6 relative">
                      {/* Timeline Line */}
                      {index < destinations.length - 1 ? (
                        <View className="absolute left-[15px] top-[30px] bottom-0 w-[2px] bg-black/[0.08]" />
                      ) : null}

                      {/* Timeline Icon Node */}
                      <View className="z-[2]">
                        {isCheckedIn ? (
                          <View className="w-8 h-8 rounded-full bg-[#34C759] items-center justify-center border border-white">
                            <MaterialIconsRounded name="check" size={16} color="#FFFFFF" />
                          </View>
                        ) : (
                          <View className="w-8 h-8 rounded-full bg-[#0071E3]/10 items-center justify-center border border-white">
                            <Text className="text-[#0071E3] text-[12px] font-bold" style={{ fontFamily: TOKENS.font.bold }}>
                              {index + 1}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Timeline Content */}
                      <View className="flex-1 bg-black/[0.02] p-3.5 rounded-2xl border border-black/[0.04]">
                        <View className="flex-row justify-between items-start gap-1">
                          <Text className="text-[#1D1D1F] text-[14px] font-bold flex-1" style={{ fontFamily: TOKENS.font.heading }}>
                            {place?.name}
                          </Text>

                          {/* Companion Count (Neon indicator) */}
                          {dest.activeCompanionCount > 0 ? (
                            <View className="flex-row items-center gap-1 bg-[#34C759]/10 px-2 py-0.5 rounded-full">
                              <View className="w-1.5 h-1.5 rounded-full bg-[#34C759]" />
                              <Text className="text-[#34C759] text-[9px] font-bold uppercase" style={{ fontFamily: TOKENS.font.bold }}>
                                {t("event.onlineCount", { count: dest.activeCompanionCount })}
                              </Text>
                            </View>
                          ) : null}
                        </View>

                        {dest.startTime ? (
                          <Text className="text-black/40 text-[11px] font-bold mt-1 uppercase" style={{ fontFamily: TOKENS.font.bold }}>
                            {t("event.estimated")}: {dest.startTime} {dest.endTime ? ` - ${dest.endTime}` : ""}
                          </Text>
                        ) : null}

                        {dest.note ? (
                          <Text className="text-black/60 text-[12px] mt-1.5 italic" style={{ fontFamily: TOKENS.font.body }}>
                            📝 {dest.note}
                          </Text>
                        ) : null}

                        {/* Actions on Destination */}
                        <View className="flex-row items-center gap-2 mt-3 pt-3 border-t border-black/[0.04]">
                          {/* View Detail button */}
                          <Pressable
                            onPress={() => router.push({ pathname: "/place/[id]", params: { id: dest.placeId } })}
                            className="h-8 px-3 rounded-full bg-white border border-black/10 items-center justify-center flex-row gap-1"
                          >
                            <MaterialIconsRounded name="explore" size={12} color="#1D1D1F" />
                            <Text className="text-[#1D1D1F] text-[11px] font-bold" style={{ fontFamily: TOKENS.font.semibold }}>
                              {t("event.pointDetail")}
                            </Text>
                          </Pressable>

                          {/* Check-in Camera Button (Only when event is joined) */}
                          {event.isJoined ? (
                            <Pressable
                              onPress={() => handleCheckInChặng(dest)}
                              disabled={isUploading}
                              className={`h-8 px-3 rounded-full items-center justify-center flex-row gap-1 ${
                                isCheckedIn ? "bg-[#34C759]/10 border border-[#34C759]/25" : "bg-[#0071E3] shadow-sm"
                              }`}
                            >
                              {isUploading ? (
                                <ActivityIndicator size="small" color={isCheckedIn ? "#34C759" : "#FFFFFF"} />
                              ) : (
                                <>
                                  <MaterialIconsRounded 
                                    name="photo-camera" 
                                    size={12} 
                                    color={isCheckedIn ? "#34C759" : "#FFFFFF"} 
                                  />
                                  <Text 
                                    className={`text-[11px] font-bold ${isCheckedIn ? "text-[#34C759]" : "text-white"}`} 
                                    style={{ fontFamily: TOKENS.font.semibold }}
                                  >
                                    {isCheckedIn ? t("event.checkedIn") : t("event.takePhoto")}
                                  </Text>
                                </>
                              )}
                            </Pressable>
                          ) : null}
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </View>
        ) : (
          /* TAB 2: MOMENTS CHECK-IN GRID (VIỄN CẢNH 1) */
          <View className="px-4">
            <View className="bg-white p-4 rounded-2xl shadow-sm border border-black/5">
              <View className="flex-row items-center gap-1.5 mb-3">
                <Text className="text-[#1D1D1F] text-[16px] font-bold" style={{ fontFamily: TOKENS.font.heading }}>
                  {t("event.momentsWall")}
                </Text>
                <View className="px-2 py-0.5 rounded-full bg-black/5">
                  <Text className="text-black/50 text-[10px] font-bold" style={{ fontFamily: TOKENS.font.bold }}>{t("event.anonymous1v1")}</Text>
                </View>
              </View>

              <Text className="text-black/45 text-[12px] leading-[18px] mb-4" style={{ fontFamily: TOKENS.font.body }}>
                {t("event.momentsDescription")}
              </Text>

              {moments.length === 0 ? (
                <View className="items-center py-10 gap-2">
                  <View className="w-12 h-12 rounded-full bg-black/[0.03] items-center justify-center mb-1">
                    <MaterialIconsRounded name="photo-library" size={24} color="#8E8E93" />
                  </View>
                  <Text className="text-[#1D1D1F] text-[14px] font-semibold" style={{ fontFamily: TOKENS.font.semibold }}>
                    {t("event.noMoments")}
                  </Text>
                  <Text className="text-black/40 text-[11px] text-center px-4" style={{ fontFamily: TOKENS.font.body }}>
                    {t("event.noMomentsMessage")}
                  </Text>
                </View>
              ) : (
                <View className="flex-row flex-wrap gap-2">
                  {moments.map((moment) => {
                    const momentUri = getOptimizedCloudinaryUrl(resolveMediaUrl(moment.imageUrl), 300);
                    return (
                      <Pressable
                        key={moment.id}
                        onPress={() => setSelectedMoment(moment)}
                        className="rounded-xl overflow-hidden bg-black/5 border border-black/5"
                        style={{ width: (SCREEN_W - 32 - 32 - 16) / 3, height: (SCREEN_W - 32 - 32 - 16) / 3 }}
                      >
                        <Image source={{ uri: momentUri }} contentFit="cover" style={{ width: "100%", height: "100%" }} />
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Floating Join Button */}
      {!event.isJoined ? (
        <View 
          style={{ paddingBottom: Math.max(16, insets.bottom + 8) }}
          className="absolute bottom-0 left-0 right-0 px-4 pt-3 bg-white/95 border-t border-black/5 shadow-lg flex-row gap-3 z-[6]"
        >
          <Pressable
            onPress={handleJoinEvent}
            disabled={joinEventMutation.isPending}
            className="flex-1 h-12 rounded-full bg-[#0071E3] items-center justify-center shadow-md flex-row gap-2"
          >
            {joinEventMutation.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <MaterialIconsRounded name="luggage" size={18} color="#FFFFFF" />
                <Text className="text-white text-[15px] font-bold" style={{ fontFamily: TOKENS.font.bold }}>
                  {t("event.joinJourney")}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      ) : (
        <View 
          style={{ paddingBottom: Math.max(16, insets.bottom + 8) }}
          className="absolute bottom-0 left-0 right-0 px-4 pt-3 bg-white/95 border-t border-black/5 shadow-lg flex-row gap-3 z-[6]"
        >
          <View className="flex-1 h-12 rounded-full bg-[#34C759]/10 border border-[#34C759]/20 items-center justify-center flex-row gap-2">
            <MaterialIconsRounded name="check-circle" size={18} color="#34C759" />
            <Text className="text-[#34C759] text-[14px] font-bold" style={{ fontFamily: TOKENS.font.bold }}>
              {t("event.alreadyJoining")}
            </Text>
          </View>
        </View>
      )}

      {/* Moment Preview Modal */}
      <Modal
        visible={!!selectedMoment}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedMoment(null)}
      >
        <Pressable 
          onPress={() => setSelectedMoment(null)}
          className="flex-1 bg-black/90 items-center justify-center px-4"
        >
          <View className="w-full bg-white rounded-3xl overflow-hidden shadow-2xl" onStartShouldSetResponder={() => true}>
            <View className="p-4 flex-row justify-between items-center border-b border-black/[0.05]">
              <View className="flex-row items-center gap-1.5">
                <View className="w-6 h-6 rounded-full bg-black/5 items-center justify-center">
                  <MaterialIconsRounded name="person" size={14} color="#8E8E93" />
                </View>
                <Text className="text-[#1D1D1F] text-[13px] font-bold" style={{ fontFamily: TOKENS.font.semibold }}>
                  {t("event.anonymousCompanion")}
                </Text>
              </View>
              <Pressable 
                onPress={() => setSelectedMoment(null)}
                className="w-7 h-7 rounded-full bg-black/5 items-center justify-center"
              >
                <MaterialIconsRounded name="close" size={16} color="#8E8E93" />
              </Pressable>
            </View>

            <View className="w-full aspect-square bg-[#EDEDF2]">
              {selectedMoment?.imageUrl ? (
                <Image 
                  source={{ uri: getOptimizedCloudinaryUrl(resolveMediaUrl(selectedMoment.imageUrl), 600) }} 
                  contentFit="cover" 
                  style={{ width: "100%", height: "100%" }} 
                />
              ) : null}
            </View>

            <View className="p-4 bg-black/[0.02] gap-1">
              <Text className="text-black/40 text-[10px] font-bold uppercase" style={{ fontFamily: TOKENS.font.bold }}>
                {t("event.checkinTime")}
              </Text>
              <Text className="text-[#1D1D1F] text-[13px] font-semibold" style={{ fontFamily: TOKENS.font.medium }}>
                {selectedMoment?.createdAt ? new Date(selectedMoment.createdAt).toLocaleString(i18n.language === "vi" ? "vi-VN" : "en-US") : ""}
              </Text>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({});
