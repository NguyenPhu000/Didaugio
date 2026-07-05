import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
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
import * as Location from "expo-location";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import safeAsyncStorage from "../../src/utils/safeAsyncStorage";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { useAuthStore } from "../../src/stores/authStore";
import {
  useCreateMoment,
  useEventDetail,
  useEventMoments,
  useJoinEvent,
} from "../../src/modules/explore/hooks/useEvents";
import { TOKENS } from "../../src/constants/design-tokens";
import { getOptimizedCloudinaryUrl, resolveMediaUrl, resolvePlaceImageUri } from "../../src/lib/media-url";
import { formatFullDate, formatFullDateNoWeekday } from "../../src/utils/dateFormat";
import { distanceMeters } from "../../src/modules/map/utils/distance";

const SCREEN_W = Dimensions.get("window").width;
const CHECK_IN_RADIUS_M = 75;

const getMomentList = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  return [];
};

const getDestinationPlaceId = (destination) =>
  Number(destination?.placeId ?? destination?.place?.id);

const getDestinationDistance = (destination, location) => {
  const place = destination?.place;
  if (!place || !location) return null;
  const lat = Number(place.latitude);
  const lng = Number(place.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return distanceMeters(location.latitude, location.longitude, lat, lng);
};

async function imageUriToBase64(uri) {
  const response = await fetch(uri);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Cannot read image"));
    reader.readAsDataURL(blob);
  });
}

export default function EventDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  const { data: event, isLoading, refetch } = useEventDetail(id, !!id);
  const { data: momentsData, refetch: refetchMoments } = useEventMoments(id, {}, !!id);
  const joinEventMutation = useJoinEvent();
  const createMomentMutation = useCreateMoment();

  const [activeTab, setActiveTab] = useState("route");
  const [uploadingPlaceId, setUploadingPlaceId] = useState(null);
  const [selectedMoment, setSelectedMoment] = useState(null);
  const [lastLocation, setLastLocation] = useState(null);
  const [optimisticChecked, setOptimisticChecked] = useState({});

  const moments = useMemo(() => getMomentList(momentsData), [momentsData]);
  const destinations = useMemo(
    () => (Array.isArray(event?.trip?.destinations) ? event.trip.destinations : []),
    [event?.trip?.destinations],
  );

  const serverCheckedIds = useMemo(
    () => new Set((event?.myCheckedInPlaceIds || []).map((placeId) => Number(placeId))),
    [event?.myCheckedInPlaceIds],
  );

  const checkedInCount = event?.checkInSummary?.checkedInCount ?? serverCheckedIds.size;
  const totalDestinations = event?.checkInSummary?.totalDestinations ?? destinations.length;
  const progressPercent = totalDestinations > 0
    ? Math.round((checkedInCount / totalDestinations) * 100)
    : 0;

  const eventImageUri = useMemo(() => {
    const raw = event?.thumbnail || event?.imageUrl;
    return raw ? getOptimizedCloudinaryUrl(resolveMediaUrl(raw), 1000) : null;
  }, [event?.imageUrl, event?.thumbnail]);

  const handleJoinEvent = useCallback(async () => {
    if (!user) {
      Alert.alert("Cần đăng nhập", "Đăng nhập để tham gia sự kiện và nhận bản sao chuyến đi.", [
        { text: "Để sau", style: "cancel" },
        { text: "Đăng nhập", onPress: () => router.push("/(auth)/login") },
      ]);
      return;
    }

    try {
      const response = await joinEventMutation.mutateAsync(id);
      const clonedTrip = response?.clonedTrip || response?.data || null;
      if (clonedTrip?.id) {
        await safeAsyncStorage.setItem(
          `didaugio:active_event_trip:${clonedTrip.id}`,
          String(id),
        );
      }
      await refetch();
      Alert.alert("Đã tham gia", "Chuyến đi mẫu đã được clone về tài khoản của bạn.", [
        { text: "Xem chuyến đi", onPress: () => router.replace("/(tabs)/trips") },
        { text: "Ở lại", style: "cancel" },
      ]);
    } catch (error) {
      Alert.alert("Không thể tham gia", error?.message || "Vui lòng thử lại.");
    }
  }, [id, joinEventMutation, refetch, router, user]);

  const getCurrentLocation = useCallback(async () => {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert("Cần quyền vị trí", "Bật vị trí để xác nhận bạn đang ở gần điểm check-in.");
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    const coords = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
    setLastLocation(coords);
    return coords;
  }, []);

  const handleCheckInDestination = useCallback(async (destination) => {
    const placeId = getDestinationPlaceId(destination);
    if (!event?.isJoined) {
      Alert.alert("Chưa tham gia", "Bạn cần tham gia sự kiện trước khi check-in.");
      return;
    }
    if (!placeId) return;

    const location = await getCurrentLocation();
    if (!location) return;

    const distance = getDestinationDistance(destination, location);
    if (distance !== null && distance > CHECK_IN_RADIUS_M) {
      Alert.alert(
        "Chưa đủ gần điểm",
        `Bạn đang cách điểm này khoảng ${Math.round(distance)}m. Check-in mở khi trong bán kính ${CHECK_IN_RADIUS_M}m.`,
      );
      return;
    }

    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    if (cameraPermission.status !== "granted") {
      Alert.alert("Cần quyền camera", "Bật camera để chụp khoảnh khắc check-in.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;

    setUploadingPlaceId(placeId);
    try {
      const manipulated = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 400, height: 400 } }],
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG },
      );
      const imageUrl = await imageUriToBase64(manipulated.uri);
      await createMomentMutation.mutateAsync({
        id,
        payload: {
          placeId,
          imageUrl,
          latitude: location.latitude,
          longitude: location.longitude,
        },
      });

      setOptimisticChecked((prev) => ({ ...prev, [placeId]: true }));
      await safeAsyncStorage.setItem(`didaugio:event:${id}:checkedin:${placeId}`, "true");
      await Promise.all([refetch(), refetchMoments()]);
      Alert.alert("Check-in thành công", "Khoảnh khắc đã được thêm vào tường sự kiện.");
    } catch (error) {
      Alert.alert("Check-in thất bại", error?.message || "Vui lòng thử lại.");
    } finally {
      setUploadingPlaceId(null);
    }
  }, [createMomentMutation, event?.isJoined, getCurrentLocation, id, refetch, refetchMoments]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0F8A7A" />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>Không tìm thấy sự kiện</Text>
        <Pressable onPress={() => router.back()} style={styles.darkButton}>
          <Text style={styles.darkButtonText}>Quay lại</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 104 }}
      >
        <View style={styles.hero}>
          {eventImageUri ? (
            <Image source={{ uri: eventImageUri }} contentFit="cover" style={StyleSheet.absoluteFillObject} />
          ) : null}
          <LinearGradient
            colors={["rgba(3,7,18,0.2)", "rgba(3,7,18,0.62)", "#062D2A"]}
            locations={[0, 0.46, 1]}
            style={StyleSheet.absoluteFillObject}
          />

          <View style={[styles.heroTop, { paddingTop: Math.max(insets.top, 16) }]}>
            <Pressable onPress={() => router.back()} style={styles.glassIcon}>
              <MaterialIconsRounded name="arrow-back" size={22} color="#FFFFFF" />
            </Pressable>
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>
                {event.totalActiveCompanionCount || 0} đang đi
              </Text>
            </View>
          </View>

          <View style={styles.heroCopy}>
            <Text style={styles.heroEyebrow}>COMMUNITY TRIP</Text>
            <Text style={styles.heroTitle}>{event.title}</Text>
            <Text style={styles.heroMeta}>
              {formatFullDate(event.startDate)} - {formatFullDateNoWeekday(event.endDate)}
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.campaignCard}>
            <Text style={styles.sectionLabel}>Tiến độ cộng đồng</Text>
            <View style={styles.statsRow}>
              <StatTile icon="people" label="Tham gia" value={String(event._count?.participants || event.participantCount || 0)} />
              <StatTile icon="photo-camera" label="Check-in" value={String(event.totalCheckIns || 0)} />
              <StatTile icon="route" label="Chặng" value={String(destinations.length)} />
            </View>

            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Hành trình của bạn</Text>
              <Text style={styles.progressValue}>{checkedInCount}/{totalDestinations} chặng</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
            </View>
            <Text style={styles.progressHint}>
              {event.isJoined
                ? "Đến gần từng điểm, chụp ảnh 1:1 để hoàn tất check-in."
                : "Tham gia để clone chuyến đi mẫu và mở check-in theo vị trí."}
            </Text>
          </View>

          {event.broadcastNotice ? (
            <View style={styles.noticeCard}>
              <MaterialIconsRounded name="campaign" size={18} color="#B45309" />
              <Text style={styles.noticeText}>{event.broadcastNotice}</Text>
            </View>
          ) : null}

          {event.description ? (
            <Text style={styles.description}>{event.description}</Text>
          ) : null}

          <View style={styles.tabs}>
            <TabButton active={activeTab === "route"} label="Lịch trình" onPress={() => setActiveTab("route")} />
            <TabButton active={activeTab === "moments"} label={`Khoảnh khắc (${moments.length})`} onPress={() => setActiveTab("moments")} />
          </View>

          {activeTab === "route" ? (
            <View style={styles.routeCard}>
              {destinations.length === 0 ? (
                <Text style={styles.emptyText}>Sự kiện chưa gắn chuyến đi mẫu.</Text>
              ) : (
                destinations.map((destination, index) => {
                  const placeId = getDestinationPlaceId(destination);
                  const isChecked = Boolean(destination.checkedInByMe || optimisticChecked[placeId] || serverCheckedIds.has(placeId));
                  const distance = getDestinationDistance(destination, lastLocation);
                  const placeImage = resolvePlaceImageUri(destination.place);
                  const isUploading = uploadingPlaceId === placeId;

                  return (
                    <View key={destination.id || `${placeId}-${index}`} style={styles.stopRow}>
                      <View style={styles.stopRail}>
                        <View style={[styles.stopNode, isChecked && styles.stopNodeDone]}>
                          {isChecked ? (
                            <MaterialIconsRounded name="check" size={15} color="#FFFFFF" />
                          ) : (
                            <Text style={styles.stopNodeText}>{index + 1}</Text>
                          )}
                        </View>
                        {index < destinations.length - 1 ? <View style={styles.stopLine} /> : null}
                      </View>

                      <View style={styles.stopCard}>
                        <View style={styles.stopHead}>
                          <View style={styles.stopImage}>
                            {placeImage ? (
                              <Image source={{ uri: getOptimizedCloudinaryUrl(placeImage, 180) }} contentFit="cover" style={StyleSheet.absoluteFillObject} />
                            ) : (
                              <MaterialIconsRounded name="place" size={20} color="#0F8A7A" />
                            )}
                          </View>
                          <View style={styles.stopInfo}>
                            <Text style={styles.stopTitle}>{destination.place?.name || "Điểm dừng"}</Text>
                            <Text style={styles.stopMeta}>
                              Ngày {destination.dayNumber || 1}
                              {destination.startTime ? ` · ${destination.startTime}` : ""}
                              {distance !== null ? ` · ${Math.round(distance)}m` : ""}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.stopActions}>
                          <Pressable
                            onPress={() => router.push({ pathname: "/place/[id]", params: { id: placeId } })}
                            style={styles.secondaryAction}
                          >
                            <Text style={styles.secondaryActionText}>Chi tiết điểm</Text>
                          </Pressable>
                          <Pressable
                            onPress={() => handleCheckInDestination(destination)}
                            disabled={isUploading}
                            style={[styles.checkInAction, isChecked && styles.checkInActionDone]}
                          >
                            {isUploading ? (
                              <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                              <>
                                <MaterialIconsRounded name={isChecked ? "task-alt" : "photo-camera"} size={14} color="#FFFFFF" />
                                <Text style={styles.checkInActionText}>{isChecked ? "Đã check-in" : "Check-in"}</Text>
                              </>
                            )}
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          ) : (
            <View style={styles.momentWall}>
              {moments.length === 0 ? (
                <View style={styles.emptyMoments}>
                  <MaterialIconsRounded name="photo-library" size={28} color="rgba(15,35,32,0.35)" />
                  <Text style={styles.emptyTitle}>Chưa có khoảnh khắc</Text>
                  <Text style={styles.emptyText}>Người tham gia đầu tiên check-in sẽ mở tường ảnh cộng đồng.</Text>
                </View>
              ) : (
                <View style={styles.momentGrid}>
                  {moments.map((moment) => {
                    const momentUri = getOptimizedCloudinaryUrl(resolveMediaUrl(moment.imageUrl), 360);
                    return (
                      <Pressable key={moment.id} onPress={() => setSelectedMoment(moment)} style={styles.momentThumb}>
                        <Image source={{ uri: momentUri }} contentFit="cover" style={StyleSheet.absoluteFillObject} />
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <BlurView intensity={56} tint="light" style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom + 8, 16) }]}>
        {event.isJoined ? (
          <View style={styles.joinedButton}>
            <MaterialIconsRounded name="check-circle" size={18} color="#0F8A7A" />
            <Text style={styles.joinedButtonText}>Đang tham gia sự kiện</Text>
          </View>
        ) : (
          <Pressable onPress={handleJoinEvent} disabled={joinEventMutation.isPending} style={styles.joinButton}>
            {joinEventMutation.isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <MaterialIconsRounded name="luggage" size={18} color="#FFFFFF" />
                <Text style={styles.joinButtonText}>Tham gia & clone chuyến đi</Text>
              </>
            )}
          </Pressable>
        )}
      </BlurView>

      <Modal visible={!!selectedMoment} transparent animationType="fade" onRequestClose={() => setSelectedMoment(null)}>
        <Pressable onPress={() => setSelectedMoment(null)} style={styles.modalBackdrop}>
          <View style={styles.momentModal} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Khoảnh khắc ẩn danh</Text>
              <Pressable onPress={() => setSelectedMoment(null)} style={styles.modalClose}>
                <MaterialIconsRounded name="close" size={18} color="#0F2320" />
              </Pressable>
            </View>
            <View style={styles.modalImage}>
              {selectedMoment?.imageUrl ? (
                <Image
                  source={{ uri: getOptimizedCloudinaryUrl(resolveMediaUrl(selectedMoment.imageUrl), 800) }}
                  contentFit="cover"
                  style={StyleSheet.absoluteFillObject}
                />
              ) : null}
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function StatTile({ icon, label, value }) {
  return (
    <View style={styles.statTile}>
      <MaterialIconsRounded name={icon} size={16} color="#0F8A7A" />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function TabButton({ active, label, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.tabButton, active && styles.tabButtonActive]}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F2F6F1",
  },
  centered: {
    flex: 1,
    backgroundColor: "#F2F6F1",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 14,
  },
  hero: {
    height: 360,
    backgroundColor: "#062D2A",
  },
  heroTop: {
    position: "absolute",
    top: 0,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 5,
  },
  glassIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(0,0,0,0.36)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.26)",
  },
  livePill: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.26)",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#6EE7B7",
  },
  liveText: {
    color: "#FFFFFF",
    fontFamily: TOKENS.font.bold,
    fontSize: 11,
  },
  heroCopy: {
    position: "absolute",
    left: 22,
    right: 22,
    bottom: 30,
  },
  heroEyebrow: {
    color: "#A7F3D0",
    fontFamily: TOKENS.font.bold,
    fontSize: 11,
    letterSpacing: 1.6,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontFamily: TOKENS.font.heading,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -1,
    marginTop: 8,
  },
  heroMeta: {
    color: "rgba(255,255,255,0.74)",
    fontFamily: TOKENS.font.semibold,
    fontSize: 13,
    marginTop: 10,
  },
  content: {
    padding: 16,
    marginTop: -18,
    gap: 14,
  },
  campaignCard: {
    borderRadius: 28,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(15,35,32,0.08)",
    shadowColor: "#0F2320",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 5,
  },
  sectionLabel: {
    color: "rgba(15,35,32,0.42)",
    fontFamily: TOKENS.font.bold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  statTile: {
    flex: 1,
    minHeight: 78,
    borderRadius: 18,
    backgroundColor: "#F3FAF6",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  statValue: {
    color: "#0F2320",
    fontFamily: TOKENS.font.bold,
    fontSize: 18,
  },
  statLabel: {
    color: "rgba(15,35,32,0.48)",
    fontFamily: TOKENS.font.semibold,
    fontSize: 11,
  },
  progressHeader: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressTitle: {
    color: "#0F2320",
    fontFamily: TOKENS.font.bold,
    fontSize: 15,
  },
  progressValue: {
    color: "#0F8A7A",
    fontFamily: TOKENS.font.bold,
    fontSize: 13,
  },
  progressTrack: {
    height: 9,
    borderRadius: 999,
    backgroundColor: "rgba(15,35,32,0.08)",
    overflow: "hidden",
    marginTop: 10,
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#0F8A7A",
  },
  progressHint: {
    color: "rgba(15,35,32,0.56)",
    fontFamily: TOKENS.font.medium,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
  noticeCard: {
    borderRadius: 18,
    padding: 14,
    backgroundColor: "#FFF7ED",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(180,83,9,0.18)",
    flexDirection: "row",
    gap: 10,
  },
  noticeText: {
    flex: 1,
    color: "#92400E",
    fontFamily: TOKENS.font.semibold,
    fontSize: 13,
    lineHeight: 19,
  },
  description: {
    color: "rgba(15,35,32,0.66)",
    fontFamily: TOKENS.font.medium,
    fontSize: 14,
    lineHeight: 22,
  },
  tabs: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 999,
    backgroundColor: "rgba(15,35,32,0.06)",
  },
  tabButton: {
    flex: 1,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  tabButtonActive: {
    backgroundColor: "#FFFFFF",
  },
  tabText: {
    color: "rgba(15,35,32,0.52)",
    fontFamily: TOKENS.font.bold,
    fontSize: 13,
  },
  tabTextActive: {
    color: "#0F8A7A",
  },
  routeCard: {
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(15,35,32,0.08)",
  },
  stopRow: {
    flexDirection: "row",
    gap: 12,
  },
  stopRail: {
    width: 30,
    alignItems: "center",
  },
  stopNode: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#E7F6EF",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  stopNodeDone: {
    backgroundColor: "#0F8A7A",
  },
  stopNodeText: {
    color: "#0F8A7A",
    fontFamily: TOKENS.font.bold,
    fontSize: 12,
  },
  stopLine: {
    flex: 1,
    width: 2,
    backgroundColor: "rgba(15,35,32,0.08)",
  },
  stopCard: {
    flex: 1,
    marginBottom: 14,
    borderRadius: 22,
    backgroundColor: "#F8FBF7",
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(15,35,32,0.06)",
  },
  stopHead: {
    flexDirection: "row",
    gap: 10,
  },
  stopImage: {
    width: 52,
    height: 52,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#E7F6EF",
    alignItems: "center",
    justifyContent: "center",
  },
  stopInfo: {
    flex: 1,
  },
  stopTitle: {
    color: "#0F2320",
    fontFamily: TOKENS.font.bold,
    fontSize: 15,
    lineHeight: 19,
  },
  stopMeta: {
    color: "rgba(15,35,32,0.48)",
    fontFamily: TOKENS.font.semibold,
    fontSize: 11,
    marginTop: 5,
  },
  stopActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  secondaryAction: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(15,35,32,0.12)",
  },
  secondaryActionText: {
    color: "#0F2320",
    fontFamily: TOKENS.font.bold,
    fontSize: 12,
  },
  checkInAction: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0F8A7A",
    flexDirection: "row",
    gap: 6,
  },
  checkInActionDone: {
    backgroundColor: "#10B981",
  },
  checkInActionText: {
    color: "#FFFFFF",
    fontFamily: TOKENS.font.bold,
    fontSize: 12,
  },
  momentWall: {
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(15,35,32,0.08)",
  },
  momentGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  momentThumb: {
    width: (SCREEN_W - 32 - 28 - 16) / 3,
    height: (SCREEN_W - 32 - 28 - 16) / 3,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#E7F6EF",
  },
  emptyMoments: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 20,
  },
  emptyTitle: {
    color: "#0F2320",
    fontFamily: TOKENS.font.bold,
    fontSize: 16,
    textAlign: "center",
  },
  emptyText: {
    color: "rgba(15,35,32,0.48)",
    fontFamily: TOKENS.font.medium,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 12,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(15,35,32,0.08)",
  },
  joinButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: "#0F8A7A",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  joinButtonText: {
    color: "#FFFFFF",
    fontFamily: TOKENS.font.bold,
    fontSize: 15,
  },
  joinedButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: "#E7F6EF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(15,138,122,0.22)",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  joinedButtonText: {
    color: "#0F8A7A",
    fontFamily: TOKENS.font.bold,
    fontSize: 14,
  },
  darkButton: {
    height: 42,
    paddingHorizontal: 20,
    borderRadius: 21,
    backgroundColor: "#0F2320",
    alignItems: "center",
    justifyContent: "center",
  },
  darkButtonText: {
    color: "#FFFFFF",
    fontFamily: TOKENS.font.bold,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.88)",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  momentModal: {
    width: "100%",
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  modalHeader: {
    height: 54,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    color: "#0F2320",
    fontFamily: TOKENS.font.bold,
    fontSize: 14,
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(15,35,32,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalImage: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#E7F6EF",
  },
});
